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
      (sum, p, i) => sum + distance(toPosition(path[i]), toPosition(p), { units: "meters" }),
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
    segmentIndex: Math.min(start + nearest.properties.segmentIndex, path.length - 2),
    point: { lat, lng },
    distanceMeters: nearest.properties.pointDistance,
    // lineDistance counts from the start of `ahead`: add the segments before it.
    alongMeters: lengthUpTo(path, start) + nearest.properties.lineDistance,
  };
};

/** The car is before the route's first point (a new route starts at the live GPS, ahead of it). */
const beforeStart = (match: RouteMatch) =>
  match.segmentIndex === 0 && match.alongMeters === 0 && match.distanceMeters > 0;

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
  const untouched = { points: path.slice(start), segmentIndex: start, snapped: null };
  if (!position) return untouched;

  const match = matchToRoute(path, position, start);
  if (!match || match.distanceMeters > OFF_ROUTE_METERS) return untouched;

  // Just before a new route: the line runs from the car to it instead of the car jumping on.
  if (beforeStart(match)) {
    return { points: [position, ...path], segmentIndex: 0, snapped: position };
  }

  return {
    points: [match.point, ...path.slice(match.segmentIndex + 1)],
    segmentIndex: match.segmentIndex,
    snapped: match.point,
  };
};

/** Length of the route from its first point up to each point. */
export const routeLengths = (path: LatLng[]): number[] => {
  const lengths = [0];
  for (let i = 1; i < path.length; i++) {
    lengths.push(
      lengths[i - 1] +
        distance(toPosition(path[i - 1]), toPosition(path[i]), { units: "meters" }),
    );
  }
  return lengths;
};

/**
 * The point `meters` along the route; lengths from routeLengths. Below 0 it is that far back
 * from the start along the first segment's direction (the road the car came in on); past the
 * end it is the last point.
 */
export const pointAtMeters = (path: LatLng[], lengths: number[], meters: number): LatLng => {
  if (meters <= 0) {
    const t = lengths[1] > 0 ? meters / lengths[1] : 0;
    return t === 0
      ? path[0]
      : {
          lat: path[0].lat + (path[1].lat - path[0].lat) * t,
          lng: path[0].lng + (path[1].lng - path[0].lng) * t,
        };
  }
  const last = path.length - 1;
  if (meters >= lengths[last]) return path[last];

  // The segment holding `meters`: binary search, the route can have hundreds of points.
  let lo = 0;
  let hi = last;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (lengths[mid] <= meters) lo = mid;
    else hi = mid;
  }
  const span = lengths[hi] - lengths[lo];
  const t = span > 0 ? (meters - lengths[lo]) / span : 0;
  return {
    lat: path[lo].lat + (path[hi].lat - path[lo].lat) * t,
    lng: path[lo].lng + (path[hi].lng - path[lo].lng) * t,
  };
};

/**
 * How far along the route each point (oldest first) is, never going back; null for a point
 * off the route, below 0 for one just before its start. The car is then played back along
 * these distances, so it follows the road through bends instead of cutting straight between
 * GPS points, and drives onto a new route instead of jumping to its start.
 */
export const alongRoute = (path: LatLng[], points: readonly LatLng[]): (number | null)[] => {
  let fromIndex = 0;
  let furthest = -Infinity;
  return points.map((p) => {
    const match = matchToRoute(path, p, fromIndex);
    if (!match || match.distanceMeters > OFF_ROUTE_METERS) return null;
    fromIndex = match.segmentIndex;
    const along = beforeStart(match) ? -match.distanceMeters : match.alongMeters;
    furthest = Math.max(furthest, along);
    return furthest;
  });
};
