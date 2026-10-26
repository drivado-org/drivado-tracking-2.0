import bearing from "@turf/bearing";
import distance from "@turf/distance";
import { point } from "@turf/helpers";
import type { LatLng, TrackPoint } from "@/types/geo";
import {
  MAX_REJECTED_IN_A_ROW,
  MAX_SPEED_MPS,
  MIN_MOVE_METERS,
} from "../constants/tracking";

/** The last two accepted points: the car animates from `previous` to `current`. */
export type CarTrack = {
  previous: TrackPoint | null;
  current: TrackPoint | null;
  /** Degrees clockwise from north. Not wrapped to 0–360, so the car always turns the short way. */
  heading: number;
  /** Spikes rejected since the last accepted point. */
  rejectedInARow: number;
};

export const EMPTY_TRACK: CarTrack = {
  previous: null,
  current: null,
  heading: 0,
  rejectedInARow: 0,
};

// Turf works with GeoJSON, which orders coordinates [lng, lat].
const toTurfPoint = ({ lat, lng }: LatLng) => point([lng, lat]);

export const distanceMeters = (from: LatLng, to: LatLng): number =>
  distance(toTurfPoint(from), toTurfPoint(to), { units: "meters" });

/** Compass direction of travel from one point to the next, -180..180. */
export const bearingDegrees = (from: LatLng, to: LatLng): number =>
  bearing(toTurfPoint(from), toTurfPoint(to));

/** `from` plus the shortest turn to `to`: 350° → 10° is +20°, not -340°. */
export const turnTowards = (from: number, to: number): number =>
  from + ((((to - from) % 360) + 540) % 360) - 180;

/**
 * Adds a raw GPS point to the track, or ignores it as noise. Pure: same input, same output.
 * - older or same-time point: duplicate or late delivery
 * - closer than MIN_MOVE_METERS to the last accepted point: drift while standing still
 * - faster than MAX_SPEED_MPS: a spike, unless MAX_REJECTED_IN_A_ROW spikes came before it
 */
export const applyPoint = (track: CarTrack, next: TrackPoint): CarTrack => {
  const { current } = track;
  if (!current) return { ...EMPTY_TRACK, current: next };

  const seconds = (Date.parse(next.timestamp) - Date.parse(current.timestamp)) / 1000;
  if (seconds <= 0) return track;

  const meters = distanceMeters(current, next);
  if (meters < MIN_MOVE_METERS) return track;

  const isSpike = meters / seconds > MAX_SPEED_MPS;
  if (isSpike && track.rejectedInARow < MAX_REJECTED_IN_A_ROW) {
    return { ...track, rejectedInARow: track.rejectedInARow + 1 };
  }

  return {
    previous: current,
    current: next,
    heading: turnTowards(track.heading, bearingDegrees(current, next)),
    rejectedInARow: 0,
  };
};
