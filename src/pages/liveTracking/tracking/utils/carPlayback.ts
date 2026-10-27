import type { LatLng, TrackPoint } from "@/types/geo";
import {
  MAX_SEGMENT_MS,
  PLAYBACK_CATCH_UP_MS,
  PLAYBACK_DEFAULT_DELAY_MS,
  PLAYBACK_JITTER_MARGIN_MS,
  PLAYBACK_MAX_DELAY_MS,
  PLAYBACK_MAX_LAG_MS,
  PLAYBACK_MAX_RATE,
  PLAYBACK_MIN_DELAY_MS,
  PLAYBACK_MIN_RATE,
} from "../constants/tracking";
import { bearingDegrees } from "./locationFilter";

// The car is drawn at a "playback time" on the device's clock, a little behind the newest
// point. Pure functions: the hook calls them once per animation frame.

const timeOf = (point: TrackPoint) => Date.parse(point.timestamp);

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const toLatLng = ({ lat, lng }: LatLng): LatLng => ({ lat, lng });

export type TrackSample = {
  position: LatLng;
  /** Direction of the segment being driven; null while the car stands. */
  movingHeading: number | null;
  /** While standing before a move: when that move starts. null when there is no next move yet. */
  standingUntil: number | null;
  /** Between points[index] and points[index + 1], share t (0..1) of the way. */
  index: number;
  t: number;
};

/**
 * Where the car is at `time` along the points (oldest first).
 * Between two points it moves in a straight line at constant speed. A gap longer than
 * MAX_SEGMENT_MS is standing still and then driving: only its last MAX_SEGMENT_MS moves.
 */
export const sampleTrack = (points: readonly TrackPoint[], time: number): TrackSample | null => {
  if (points.length === 0) return null;

  const first = points[0];
  if (time < timeOf(first)) {
    return {
      position: toLatLng(first),
      movingHeading: null,
      standingUntil: timeOf(first),
      index: 0,
      t: 0,
    };
  }

  for (let i = 0; i < points.length - 1; i++) {
    const from = points[i];
    const to = points[i + 1];
    const end = timeOf(to);
    if (time >= end) continue;

    const start = Math.max(timeOf(from), end - MAX_SEGMENT_MS);
    if (time < start) {
      return { position: toLatLng(from), movingHeading: null, standingUntil: start, index: i, t: 0 };
    }

    const t = (time - start) / (end - start);
    return {
      position: {
        lat: from.lat + (to.lat - from.lat) * t,
        lng: from.lng + (to.lng - from.lng) * t,
      },
      movingHeading: bearingDegrees(from, to),
      standingUntil: null,
      index: i,
      t,
    };
  }

  // Caught up with the newest point: wait there for the next one.
  return {
    position: toLatLng(points[points.length - 1]),
    movingHeading: null,
    standingUntil: null,
    index: points.length - 1,
    t: 0,
  };
};

/** How far behind live to play: enough to cover the usual gap between points plus jitter. */
export const playbackDelayMs = (points: readonly TrackPoint[]): number => {
  const gaps = points
    .slice(1)
    .map((point, i) => timeOf(point) - timeOf(points[i]))
    .filter((gap) => gap <= MAX_SEGMENT_MS)
    .slice(-5);
  if (gaps.length === 0) return PLAYBACK_DEFAULT_DELAY_MS;

  return clamp(
    Math.max(...gaps) + PLAYBACK_JITTER_MARGIN_MS,
    PLAYBACK_MIN_DELAY_MS,
    PLAYBACK_MAX_DELAY_MS,
  );
};

/**
 * Moves the playback clock on by one frame.
 * - `liveTime`: best guess of the device's clock now (newest point + time since it arrived).
 * - Aims at liveTime minus the delay; runs a little faster or slower to stay there, so the
 *   speed never changes abruptly.
 * - Never passes the newest point: the car waits there instead of guessing ahead.
 * - Standing still looks the same at any time, so a stop is skipped over without a visible jump.
 */
export const advancePlayback = (
  clock: number | null,
  points: readonly TrackPoint[],
  liveTime: number,
  frameMs: number,
): number | null => {
  if (points.length === 0) return null;

  const target = liveTime - playbackDelayMs(points);
  const newest = timeOf(points[points.length - 1]);
  let next = clock ?? target;

  const sample = sampleTrack(points, next);
  if (sample?.standingUntil != null && next < target) {
    next = Math.min(target, sample.standingUntil);
  }

  if (target - next > PLAYBACK_MAX_LAG_MS) {
    next = target;
  } else {
    const rate = clamp(1 + (target - next) / PLAYBACK_CATCH_UP_MS, PLAYBACK_MIN_RATE, PLAYBACK_MAX_RATE);
    next += Math.max(0, frameMs) * rate;
  }

  return Math.min(next, newest);
};
