/// <reference types="google.maps" />
import { useEffect, useRef } from "react";
import { useMap, useMapsLibrary } from "@vis.gl/react-google-maps";
import type { LatLng } from "@/types/geo";
import {
  ROUTE_CASING_COLOR,
  ROUTE_CASING_WEIGHT,
  ROUTE_STROKE_COLOR,
  ROUTE_STROKE_WEIGHT,
} from "../../constants/map";

type RoutePolylineProps = {
  /** The route still ahead of the car (see useRouteProgress); nothing is drawn below 2 points. */
  points: LatLng[];
  /** The driver left the route and a new one is on its way: dim the old one. */
  rerouting?: boolean;
};

const samePoint = (a: google.maps.LatLng, b: LatLng) => a.lat() === b.lat && a.lng() === b.lng;

/**
 * Brings path to points with as few changes as possible. Every frame the car only moves the
 * first point and drops the vertices it passed, so the rest of the line is never redrawn:
 * replacing the whole path each frame is what made the line flicker.
 */
const syncPath = (path: google.maps.MVCArray<google.maps.LatLng>, points: LatLng[]) => {
  const target = points.length >= 2 ? points : [];
  const dropped = path.getLength() - target.length;

  // Same route, shorter at the front: the tail is unchanged.
  const isTail =
    target.length > 0 &&
    dropped >= 0 &&
    target.every((p, i) => i === 0 || samePoint(path.getAt(i + dropped), p));

  if (!isTail) {
    path.clear();
    target.forEach((p) => path.push(new google.maps.LatLng(p)));
    return;
  }

  for (let i = 0; i < dropped; i++) path.removeAt(0);
  if (!samePoint(path.getAt(0), target[0])) path.setAt(0, new google.maps.LatLng(target[0]));
};

/**
 * Draws the route ahead of the car: a dark line on a light casing, with round ends.
 * Renders no DOM of its own.
 */
const RoutePolyline = ({ points, rerouting = false }: RoutePolylineProps) => {
  const map = useMap();
  const mapsLibrary = useMapsLibrary("maps");
  const linesRef = useRef<{
    path: google.maps.MVCArray<google.maps.LatLng>;
    casing: google.maps.Polyline;
    line: google.maps.Polyline;
  } | null>(null);

  // One casing and one line per map, sharing one path; the effects below update it in place.
  useEffect(() => {
    if (!map || !mapsLibrary) return;

    const path = new google.maps.MVCArray<google.maps.LatLng>();
    const casing = new mapsLibrary.Polyline({
      map,
      path,
      strokeColor: ROUTE_CASING_COLOR,
      strokeWeight: ROUTE_CASING_WEIGHT,
      strokeOpacity: 1,
      clickable: false,
      zIndex: 1,
    });
    const line = new mapsLibrary.Polyline({
      map,
      path,
      strokeColor: ROUTE_STROKE_COLOR,
      strokeWeight: ROUTE_STROKE_WEIGHT,
      clickable: false,
      zIndex: 2,
    });
    linesRef.current = { path, casing, line };

    return () => {
      casing.setMap(null);
      line.setMap(null);
      linesRef.current = null;
    };
  }, [map, mapsLibrary]);

  // map / mapsLibrary are deps so these also run right after the lines are created.
  useEffect(() => {
    if (linesRef.current) syncPath(linesRef.current.path, points);
  }, [map, mapsLibrary, points]);

  useEffect(() => {
    const lines = linesRef.current;
    if (!lines) return;
    lines.line.setOptions({ strokeOpacity: rerouting ? 0.35 : 0.9 });
    lines.casing.setOptions({ strokeOpacity: rerouting ? 0.4 : 1 });
  }, [map, mapsLibrary, rerouting]);

  return null;
};

export default RoutePolyline;
