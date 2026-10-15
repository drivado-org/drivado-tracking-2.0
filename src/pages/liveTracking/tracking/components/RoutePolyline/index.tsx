/// <reference types="google.maps" />
import { useEffect, useRef } from "react";
import { useMap, useMapsLibrary } from "@vis.gl/react-google-maps";
import type { LatLng } from "@/types/geo";
import { ROUTE_STROKE_COLOR, ROUTE_STROKE_WEIGHT } from "../../constants/map";
import { remainingRoute } from "../../utils/routeProgress";

type RoutePolylineProps = {
  /** Route from the backend; nothing is drawn until it has 2 points. */
  path: LatLng[] | null;
  /** Where the car is drawn: the route behind it is hidden. */
  carPosition: LatLng | null;
  /** The driver left the route and a new one is on its way: dim the old one. */
  rerouting?: boolean;
};

/**
 * Draws the route ahead of the car. Renders no DOM of its own.
 * Driven segments are erased for good: the match only searches forward from the last one.
 * A new route (route_change) starts again from its first segment.
 */
const RoutePolyline = ({ path, carPosition, rerouting = false }: RoutePolylineProps) => {
  const map = useMap();
  const mapsLibrary = useMapsLibrary("maps");
  const polylineRef = useRef<google.maps.Polyline | null>(null);
  const progressRef = useRef<{ path: LatLng[] | null; segmentIndex: number }>({
    path: null,
    segmentIndex: 0,
  });

  // One line per map; the effect below updates it in place.
  useEffect(() => {
    if (!map || !mapsLibrary) return;

    const line = new mapsLibrary.Polyline({
      map,
      strokeColor: ROUTE_STROKE_COLOR,
      strokeWeight: ROUTE_STROKE_WEIGHT,
      clickable: false,
      zIndex: 1,
    });
    polylineRef.current = line;

    return () => {
      line.setMap(null);
      polylineRef.current = null;
    };
  }, [map, mapsLibrary]);

  // map / mapsLibrary are deps so this also runs right after the line is created.
  useEffect(() => {
    const line = polylineRef.current;
    if (!line) return;

    const progress = progressRef.current;
    if (progress.path !== path) {
      progress.path = path;
      progress.segmentIndex = 0;
    }

    let visible: LatLng[] = [];
    if (path && path.length >= 2) {
      const rest = remainingRoute(path, carPosition, progress.segmentIndex);
      progress.segmentIndex = rest.segmentIndex;
      visible = rest.points;
    }

    line.setOptions({ path: visible, strokeOpacity: rerouting ? 0.35 : 0.85 });
  }, [map, mapsLibrary, path, carPosition, rerouting]);

  return null;
};

export default RoutePolyline;
