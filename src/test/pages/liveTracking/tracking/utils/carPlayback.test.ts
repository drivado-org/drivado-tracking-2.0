import {
  MAX_SEGMENT_MS,
  PLAYBACK_DEFAULT_DELAY_MS,
  PLAYBACK_JITTER_MARGIN_MS,
  PLAYBACK_MAX_DELAY_MS,
  PLAYBACK_MIN_DELAY_MS,
} from "@/pages/liveTracking/tracking/constants/tracking";
import {
  advancePlayback,
  playbackDelayMs,
  sampleTrack,
} from "@/pages/liveTracking/tracking/utils/carPlayback";
import type { TrackPoint } from "@/types/geo";

const T0 = Date.parse("2026-10-15T07:00:00.000Z");

const at = (lat: number, lng: number, ms: number): TrackPoint => ({
  lat,
  lng,
  timestamp: new Date(T0 + ms).toISOString(),
});

describe("sampleTrack", () => {
  const track = [at(22.57, 88.4, 0), at(22.571, 88.4, 1000)];

  it("is null without points", () => {
    expect(sampleTrack([], T0)).toBeNull();
  });

  it("stands on the first point before it, waiting for its time", () => {
    expect(sampleTrack(track, T0 - 500)).toEqual({
      position: { lat: 22.57, lng: 88.4 },
      movingHeading: null,
      standingUntil: T0,
      index: 0,
      t: 0,
    });
  });

  it("moves at constant speed between two points, facing the way it drives", () => {
    const sample = sampleTrack(track, T0 + 250)!;
    expect(sample.position.lat).toBeCloseTo(22.57025, 8);
    expect(sample.movingHeading).toBeCloseTo(0, 5); // north
    expect(sample.standingUntil).toBeNull();
    expect(sample.index).toBe(0);
    expect(sample.t).toBeCloseTo(0.25, 8);
  });

  it("waits on the newest point once caught up", () => {
    expect(sampleTrack(track, T0 + 5000)).toEqual({
      position: { lat: 22.571, lng: 88.4 },
      movingHeading: null,
      standingUntil: null,
      index: track.length - 1,
      t: 0,
    });
  });

  it("treats a long gap as standing, then driving only its last MAX_SEGMENT_MS", () => {
    const withStop = [at(22.57, 88.4, 0), at(22.571, 88.4, 30_000)];
    const driveStart = T0 + 30_000 - MAX_SEGMENT_MS;

    expect(sampleTrack(withStop, T0 + 10_000)).toMatchObject({
      position: { lat: 22.57, lng: 88.4 },
      standingUntil: driveStart,
    });
    const halfway = sampleTrack(withStop, driveStart + MAX_SEGMENT_MS / 2)!;
    expect(halfway.position.lat).toBeCloseTo(22.5705, 8);
  });
});

describe("playbackDelayMs", () => {
  it("uses the default before the point spacing is known", () => {
    expect(playbackDelayMs([at(22.57, 88.4, 0)])).toBe(PLAYBACK_DEFAULT_DELAY_MS);
  });

  it("covers the longest recent gap plus jitter margin", () => {
    const track = [at(22.57, 88.4, 0), at(22.5701, 88.4, 1770), at(22.5702, 88.4, 3500)];
    expect(playbackDelayMs(track)).toBe(1770 + PLAYBACK_JITTER_MARGIN_MS);
  });

  it("ignores stops and stays within limits", () => {
    const fast = [at(22.57, 88.4, 0), at(22.5701, 88.4, 100)];
    expect(playbackDelayMs(fast)).toBe(PLAYBACK_MIN_DELAY_MS);

    const withStop = [at(22.57, 88.4, 0), at(22.5701, 88.4, 60_000)];
    expect(playbackDelayMs(withStop)).toBe(PLAYBACK_DEFAULT_DELAY_MS);

    const slow = [at(22.57, 88.4, 0), at(22.5701, 88.4, MAX_SEGMENT_MS)];
    expect(playbackDelayMs(slow)).toBe(
      Math.min(MAX_SEGMENT_MS + PLAYBACK_JITTER_MARGIN_MS, PLAYBACK_MAX_DELAY_MS),
    );
  });
});

describe("advancePlayback", () => {
  const track = [at(22.57, 88.4, 0), at(22.5701, 88.4, 1000), at(22.5702, 88.4, 2000)];
  const delay = playbackDelayMs(track);

  it("is null without points", () => {
    expect(advancePlayback(null, [], T0, 16)).toBeNull();
  });

  it("runs at real speed when on schedule", () => {
    const live = T0 + 2000;
    const clock = live - delay;
    expect(advancePlayback(clock, track, live, 16)).toBeCloseTo(clock + 16, 6);
  });

  it("runs a little faster when behind and slower when ahead, never backwards", () => {
    // Both clocks fall inside a driving segment (not before the first point).
    const live = T0 + 2600;
    const behind = advancePlayback(live - delay - 400, track, live, 16)! - (live - delay - 400);
    const ahead = advancePlayback(live - delay + 400, track, live, 16)! - (live - delay + 400);
    expect(behind).toBeGreaterThan(16);
    expect(behind).toBeLessThan(16 * 1.2);
    expect(ahead).toBeLessThan(16);
    expect(ahead).toBeGreaterThan(0);
  });

  it("never passes the newest point", () => {
    expect(advancePlayback(T0 + 1999, track, T0 + 60_000, 16)).toBe(T0 + 2000);
  });

  it("skips over a stop without moving the car", () => {
    const withStop = [at(22.57, 88.4, 0), at(22.571, 88.4, 30_000)];
    // Waiting on the first point; the second arrives 30 s later.
    const clock = advancePlayback(T0, withStop, T0 + 30_000, 16)!;
    expect(clock).toBeGreaterThanOrEqual(T0 + 30_000 - MAX_SEGMENT_MS);
    // Still (almost) on the first point: no visible jump.
    expect(sampleTrack(withStop, clock)!.position.lat).toBeLessThan(22.5701);
  });
});
