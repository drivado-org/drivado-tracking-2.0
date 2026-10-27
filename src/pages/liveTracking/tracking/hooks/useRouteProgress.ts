import { useEffect, useRef, useState } from "react";
import type { LatLng } from "@/types/geo";
import { bearingDegrees } from "../utils/locationFilter";
import { remainingRoute } from "../utils/routeProgress";

type Progress = {
  path: LatLng[] | null;
  segmentIndex: number;
};

/** Direction of the route segment path[index] → path[index + 1]; null when it has no length. */
const segmentHeading = (path: LatLng[], index: number): number | null => {
  const a = path[index];
  const b = path[index + 1];
  if (!b || (a.lat === b.lat && a.lng === b.lng)) return null;
  return bearingDegrees(a, b);
};

/**
 * Where to draw the car and the route ahead of it, from the same match so they always meet.
 * - On the route, the car is moved onto it and faces along it: GPS noise beside the road
 *   moves and turns nothing.
 * - Driven segments are erased for good: the match only searches forward from the last one.
 * - A new route (route_change) starts again from its first segment.
 * - A GPS jump off the route keeps the line starting where the car last was on it, instead
 *   of growing back to the start of the segment and shrinking again (flicker).
 */
const useRouteProgress = (path: LatLng[] | null, position: LatLng | null) => {
  const [progress, setProgress] = useState<Progress>({ path, segmentIndex: 0 });

  const fromIndex = progress.path === path ? progress.segmentIndex : 0;
  const rest =
    path && path.length >= 2 ? remainingRoute(path, position, fromIndex) : null;
  const segmentIndex = rest?.segmentIndex ?? 0;

  // Where the car last was on this route, for frames where it is off it.
  const lastOnRouteRef = useRef<{ path: LatLng[] | null; point: LatLng } | null>(null);
  useEffect(() => {
    if (rest?.snapped) lastOnRouteRef.current = { path, point: rest.snapped };
  });
  const lastOnRoute = lastOnRouteRef.current;
  const remaining =
    rest && !rest.snapped && path && lastOnRoute?.path === path
      ? [lastOnRoute.point, ...path.slice(segmentIndex + 1)]
      : (rest?.points ?? []);

  if (progress.path !== path || progress.segmentIndex !== segmentIndex) {
    setProgress({ path, segmentIndex });
  }

  return {
    remaining,
    carPosition: rest?.snapped ?? position,
    /** -180..180 while on the route; null off it (use the GPS heading). */
    routeHeading: path && rest?.snapped ? segmentHeading(path, segmentIndex) : null,
  };
};

export default useRouteProgress;
