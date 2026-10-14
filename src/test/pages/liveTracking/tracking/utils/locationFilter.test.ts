import {
  applyPoint,
  bearingDegrees,
  distanceMeters,
  EMPTY_TRACK,
  turnTowards,
  type CarTrack,
} from "@/pages/liveTracking/tracking/utils/locationFilter";
import type { TrackPoint } from "@/types/geo";

const T0 = Date.parse("2026-09-15T12:30:00.000Z");

/** 0.0001° of latitude is ~11 m. */
const at = (lat: number, lng: number, seconds: number): TrackPoint => ({
  lat,
  lng,
  timestamp: new Date(T0 + seconds * 1000).toISOString(),
});

const START = at(22.5726, 88.3639, 0);
const started: CarTrack = { ...EMPTY_TRACK, current: START };

describe("distanceMeters / bearingDegrees", () => {
  it("measures ~11 m for 0.0001° of latitude", () => {
    expect(distanceMeters(START, at(22.5727, 88.3639, 1))).toBeCloseTo(11.1, 0);
  });

  it("points north (0°) and east (~90°)", () => {
    expect(bearingDegrees(START, at(22.5727, 88.3639, 1))).toBeCloseTo(0, 5);
    expect(bearingDegrees(START, at(22.5726, 88.364, 1))).toBeCloseTo(90, 0);
  });
});

describe("turnTowards", () => {
  it("turns the short way across north", () => {
    expect(turnTowards(350, 10)).toBe(370);
    expect(turnTowards(10, -10)).toBe(-10);
  });

  it("keeps counting past a full circle", () => {
    expect(turnTowards(720, 10)).toBe(730);
  });
});

describe("applyPoint", () => {
  it("accepts the first point as is", () => {
    expect(applyPoint(EMPTY_TRACK, START)).toEqual(started);
  });

  it("moves previous to current on a normal move and faces the direction of travel", () => {
    const next = at(22.5727, 88.3639, 1);
    expect(applyPoint(started, next)).toEqual({
      previous: START,
      current: next,
      heading: expect.closeTo(0, 5),
      rejectedInARow: 0,
    });
  });

  it("ignores a duplicate or older point", () => {
    expect(applyPoint(started, at(22.5727, 88.3639, 0))).toBe(started);
    expect(applyPoint(started, at(22.5727, 88.3639, -1))).toBe(started);
  });

  it("ignores drift under 3 m while parked", () => {
    expect(applyPoint(started, at(22.57261, 88.3639, 1))).toBe(started);
  });

  it("accepts a slow crawl once it adds up to 3 m from the last accepted point", () => {
    let track = applyPoint(started, at(22.57261, 88.3639, 1)); // ~1.1 m
    track = applyPoint(track, at(22.57262, 88.3639, 2)); // ~2.2 m
    expect(track.current).toBe(START);
    track = applyPoint(track, at(22.57263, 88.3639, 3)); // ~3.3 m
    expect(track.current).toEqual(at(22.57263, 88.3639, 3));
  });

  it("rejects a spike faster than ~200 km/h and keeps the car where it was", () => {
    const track = applyPoint(started, at(22.5826, 88.3639, 1)); // ~1.1 km in 1 s
    expect(track.current).toBe(START);
    expect(track.rejectedInARow).toBe(1);
  });

  it("accepts a long jump when enough time passed (reconnect after a gap)", () => {
    const later = at(22.5826, 88.3639, 120); // ~1.1 km in 2 min
    expect(applyPoint(started, later).current).toBe(later);
  });

  it("trusts the new position after 3 spikes in a row", () => {
    let track = started;
    for (let s = 1; s <= 3; s += 1) track = applyPoint(track, at(22.5826, 88.3639, s));
    expect(track.current).toBe(START);

    const fourth = at(22.5826, 88.3639, 4);
    track = applyPoint(track, fourth);
    expect(track.current).toBe(fourth);
    expect(track.rejectedInARow).toBe(0);
  });
});
