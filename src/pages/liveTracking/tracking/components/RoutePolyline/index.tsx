/// <reference types="google.maps" />
import { useEffect, useRef } from "react";
import { useMap, useMapsLibrary } from "@vis.gl/react-google-maps";
import type { LatLng } from "@/types/geo";
import { ROUTE_STROKE_COLOR, ROUTE_STROKE_WEIGHT } from "../../constants/map";

type RoutePolylineProps = {
  /** The route still ahead of the car (see useRouteProgress); nothing is drawn below 2 points. */
  points: LatLng[];
  /** The driver left the route and a new one is on its way: dim the old one. */
  rerouting?: boolean;
};

/** Draws the route ahead of the car. Renders no DOM of its own. */
const RoutePolyline = ({ points, rerouting = false }: RoutePolylineProps) => {
  const map = useMap();
  const mapsLibrary = useMapsLibrary("maps");
  const polylineRef = useRef<google.maps.Polyline | null>(null);

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

    line.setOptions({
      path: points.length >= 2 ? points : [],
      strokeOpacity: rerouting ? 0.35 : 0.85,
    });
  }, [map, mapsLibrary, points, rerouting]);

  return null;
};

export default RoutePolyline;
