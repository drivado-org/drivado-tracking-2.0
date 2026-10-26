import { useEffect, useRef } from "react";
import { useMap } from "@vis.gl/react-google-maps";
import type { LatLng } from "@/types/geo";
import {
  FOLLOW_PAUSE_AFTER_DRAG_MS,
  OVERVIEW_PADDING_PX,
} from "../../constants/tracking";

type FitOverviewProps = {
  car: LatLng | null;
  dropOff: LatLng | null;
};

/** Smallest box around the points. */
const boundsOf = (points: LatLng[]): google.maps.LatLngBoundsLiteral => ({
  north: Math.max(...points.map((p) => p.lat)),
  south: Math.min(...points.map((p) => p.lat)),
  east: Math.max(...points.map((p) => p.lng)),
  west: Math.min(...points.map((p) => p.lng)),
});

/**
 * Shows the car and the drop-off together. Renders no DOM of its own; mount it only while
 * the overview is on.
 * - Fits both when mounted, then again only when one of them leaves the screen: the map
 *   doesn't jump every time the car moves.
 * - After the user drags the map, leaves it alone for FOLLOW_PAUSE_AFTER_DRAG_MS.
 */
const FitOverview = ({ car, dropOff }: FitOverviewProps) => {
  const map = useMap();
  const fittedRef = useRef(false);
  const pausedUntilRef = useRef(0);

  useEffect(() => {
    if (!map) return;
    const dragListener = map.addListener("dragstart", () => {
      pausedUntilRef.current = Date.now() + FOLLOW_PAUSE_AFTER_DRAG_MS;
    });
    return () => dragListener.remove();
  }, [map]);

  useEffect(() => {
    if (!map || !car || Date.now() < pausedUntilRef.current) return;

    const points = dropOff ? [car, dropOff] : [car];
    const visible = map.getBounds();
    if (fittedRef.current && visible && points.every((p) => visible.contains(p))) return;

    fittedRef.current = true;
    if (dropOff) {
      map.fitBounds(boundsOf(points), OVERVIEW_PADDING_PX);
    } else {
      map.panTo(car);
    }
  }, [map, car, dropOff]);

  return null;
};

export default FitOverview;
