import distance from "@turf/distance";
import { lineString, point } from "@turf/helpers";
import nearestPointOnLine from "@turf/nearest-point-on-line";
import type { LatLng } from "@/types/geo";
import { OFF_ROUTE_METERS } from "../constants/tracking";

export type RouteMatch = {
  /** The car is on the segment path[segmentIndex] → path[segmentIndex + 1]. */
  segmentIndex: number;
  /** The car's position projected onto that segment. */
  point: LatLng;
  distanceMeters: number;
  /** How far `point` is along the route from its first point. */
  alongMeters: number;
};

// Turf works with GeoJSON, which orders coordinates [lng, lat].
const toPosition = ({ lat, lng }: LatLng) => [lng, lat];

/** Length of the route from its first point up to path[index]. */
const lengthUpTo = (path: LatLng[], index: number): number =>
  path
    .slice(1, index + 1)
    .reduce(
      (sum, p, i) =>
        sum + distance(toPosition(path[i]), toPosition(p), { units: "meters" }),
      0,
    );

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

  const ahead = lineString(path.slice(start).map(toPosition));
  const nearest = nearestPointOnLine(ahead, point(toPosition(position)), {
    units: "meters",
  });
  const [lng, lat] = nearest.geometry.coordinates;

  return {
    // Turf counts segments from the start of `ahead`, not of `path`. At the route's very end
    // it returns the last vertex's index, one past the last segment.
    segmentIndex: Math.min(
      start + nearest.properties.segmentIndex,
      path.length - 2,
    ),
    point: { lat, lng },
    distanceMeters: nearest.properties.pointDistance,
    // lineDistance counts from the start of `ahead`: add the segments before it.
    alongMeters: lengthUpTo(path, start) + nearest.properties.lineDistance,
  };
};

export type RemainingRoute = {
  /** What to draw: starts at the car when it is on the route. */
  points: LatLng[];
  /** Pass back as `fromIndex` next time: the car never goes back along the route. */
  segmentIndex: number;
  /** The car moved onto the route: where to draw it. null when off the route or no car yet. */
  snapped: LatLng | null;
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
  const untouched = {
    points: path.slice(start),
    segmentIndex: start,
    snapped: null,
  };
  if (!position) return untouched;

  const match = matchToRoute(path, position, start);
  if (!match || match.distanceMeters > OFF_ROUTE_METERS) return untouched;

  return {
    points: [match.point, ...path.slice(match.segmentIndex + 1)],
    segmentIndex: match.segmentIndex,
    snapped: match.point,
  };
};
