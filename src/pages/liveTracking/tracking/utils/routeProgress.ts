import type { LatLng } from "@/types/geo";
import { OFF_ROUTE_METERS } from "../constants/tracking";

const METERS_PER_DEGREE_LAT = 110_540;
const METERS_PER_DEGREE_LNG_AT_EQUATOR = 111_320;

/**
 * Segments this much farther than the nearest still count as a match; the earliest one wins.
 * A route that comes back along the same road then keeps the leg not driven yet.
 */
const SAME_ROAD_TOLERANCE_METERS = 15;

export type RouteMatch = {
  /** The car is on the segment path[segmentIndex] → path[segmentIndex + 1]. */
  segmentIndex: number;
  /** The car's position projected onto that segment. */
  point: LatLng;
  distanceMeters: number;
};

/** Nearest point on segment a→b. Flat-earth maths: fine at street scale. */
const projectOnSegment = (p: LatLng, a: LatLng, b: LatLng) => {
  const lngScale = METERS_PER_DEGREE_LNG_AT_EQUATOR * Math.cos((p.lat * Math.PI) / 180);
  const toXY = (q: LatLng) => ({
    x: (q.lng - p.lng) * lngScale,
    y: (q.lat - p.lat) * METERS_PER_DEGREE_LAT,
  });
  const A = toXY(a);
  const B = toXY(b);
  const dx = B.x - A.x;
  const dy = B.y - A.y;
  const lengthSq = dx * dx + dy * dy;
  // P is the origin, so AP = -A.
  const t = lengthSq === 0 ? 0 : Math.min(Math.max(-(A.x * dx + A.y * dy) / lengthSq, 0), 1);
  const x = A.x + dx * t;
  const y = A.y + dy * t;

  return {
    point: { lat: a.lat + (b.lat - a.lat) * t, lng: a.lng + (b.lng - a.lng) * t },
    distanceMeters: Math.hypot(x, y),
  };
};

/**
 * Where the car is along the route, searching from segment `fromIndex` on
 * (segments before it were already driven). null when no segment is left.
 */
export const matchToRoute = (
  path: LatLng[],
  position: LatLng,
  fromIndex = 0,
): RouteMatch | null => {
  const start = Math.max(0, fromIndex);
  if (path.length - start < 2) return null;

  const matches = path.slice(start, -1).map((a, i) => ({
    segmentIndex: start + i,
    ...projectOnSegment(position, a, path[start + i + 1]),
  }));
  const best = Math.min(...matches.map((m) => m.distanceMeters));

  return matches.find((m) => m.distanceMeters <= best + SAME_ROAD_TOLERANCE_METERS)!;
};

export type RemainingRoute = {
  /** What to draw: starts at the car when it is on the route. */
  points: LatLng[];
  /** Pass back as `fromIndex` next time: the car never goes back along the route. */
  segmentIndex: number;
};

/**
 * The part of the route the car has not driven yet.
 * Segments before `fromIndex` stay erased. Off the route (or no car yet), the route from
 * `fromIndex` is drawn whole: the backend sends a new one on reroute.
 */
export const remainingRoute = (
  path: LatLng[],
  position: LatLng | null,
  fromIndex = 0,
): RemainingRoute => {
  const start = Math.min(Math.max(0, fromIndex), Math.max(0, path.length - 2));
  const untouched = { points: path.slice(start), segmentIndex: start };
  if (!position) return untouched;

  const match = matchToRoute(path, position, start);
  if (!match || match.distanceMeters > OFF_ROUTE_METERS) return untouched;

  return {
    points: [match.point, ...path.slice(match.segmentIndex + 1)],
    segmentIndex: match.segmentIndex,
  };
};
