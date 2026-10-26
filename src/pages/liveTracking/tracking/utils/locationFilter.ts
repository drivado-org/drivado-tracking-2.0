import bearing from "@turf/bearing";
import distance from "@turf/distance";
import { point } from "@turf/helpers";
import type { LatLng, TrackPoint } from "@/types/geo";
import {
  MAX_BACKWARD_METERS,
  MAX_REJECTED_IN_A_ROW,
  MAX_SPEED_MPS,
  MIN_MOVE_METERS,
  OFF_ROUTE_METERS,
} from "../constants/tracking";
import { matchToRoute } from "./routeProgress";

/** Where an accepted point is on the route it was matched to. */
export type RoutePosition = {
  path: LatLng[];
  segmentIndex: number;
  alongMeters: number;
};

/** The last two accepted points: the car animates from `previous` to `current`. */
export type CarTrack = {
  previous: TrackPoint | null;
  current: TrackPoint | null;
  /** Points rejected since the last accepted point. */
  rejectedInARow: number;
  /** Where `current` is on the route; null when off it or there is no route. */
  route: RoutePosition | null;
};

export const EMPTY_TRACK: CarTrack = {
  previous: null,
  current: null,
  rejectedInARow: 0,
  route: null,
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
 * Where `point` is on `path`, searching forward from `from` (the last accepted point's
 * position on the same route). null when off the route or there is no route.
 */
const locateOnRoute = (
  path: LatLng[] | null,
  point: LatLng,
  from: RoutePosition | null,
): RoutePosition | null => {
  if (!path) return null;
  const match = matchToRoute(path, point, from?.segmentIndex ?? 0);
  if (!match || match.distanceMeters > OFF_ROUTE_METERS) return null;
  return { path, segmentIndex: match.segmentIndex, alongMeters: match.alongMeters };
};

/**
 * Adds a raw GPS point to the track, or ignores it as noise. Pure: same input, same output.
 * - older or same-time point: duplicate or late delivery
 * - closer than MIN_MOVE_METERS to the last accepted point: drift while standing still
 * - rejected unless MAX_REJECTED_IN_A_ROW points were rejected before it:
 *   - faster than MAX_SPEED_MPS: a spike
 *   - more than MAX_BACKWARD_METERS back along the route: the car doesn't reverse on a trip
 *   - off the route while the last point was on it: a blip, until the next points confirm it
 * The route checks only compare points on the same `path`: a new route starts fresh.
 */
export const applyPoint = (
  track: CarTrack,
  next: TrackPoint,
  path: LatLng[] | null = null,
): CarTrack => {
  const { current } = track;
  if (!current) return { ...EMPTY_TRACK, current: next, route: locateOnRoute(path, next, null) };

  const seconds = (Date.parse(next.timestamp) - Date.parse(current.timestamp)) / 1000;
  if (seconds <= 0) return track;

  const meters = distanceMeters(current, next);
  if (meters < MIN_MOVE_METERS) return track;

  const lastOnRoute = track.route?.path === path ? track.route : null;
  const route = locateOnRoute(path, next, lastOnRoute);

  const isSpike = meters / seconds > MAX_SPEED_MPS;
  const wentBack =
    lastOnRoute !== null &&
    route !== null &&
    route.alongMeters < lastOnRoute.alongMeters - MAX_BACKWARD_METERS;
  const leftRoute = lastOnRoute !== null && route === null;

  if ((isSpike || wentBack || leftRoute) && track.rejectedInARow < MAX_REJECTED_IN_A_ROW) {
    return { ...track, rejectedInARow: track.rejectedInARow + 1 };
  }

  return {
    previous: current,
    current: next,
    rejectedInARow: 0,
    route,
  };
};
