/// <reference types="google.maps" />
import { useEffect, useRef } from "react";
import { useMap, useMapsLibrary } from "@vis.gl/react-google-maps";
import type { LatLng } from "@/types/geo";
import { GEOFENCE_COLOR } from "../../constants/map";
import { GEOFENCE_RADIUS_METERS } from "../../constants/tracking";

type GeofenceAreaProps = {
  /** The pickup or the drop-off; nothing is drawn without it (the car isn't near yet). */
  center: LatLng | null;
  /** The car is inside the area: draw it darker. */
  active?: boolean;
};

/** Draws the geofence circle around the end of the route. Renders no DOM of its own. */
const GeofenceArea = ({ center, active = false }: GeofenceAreaProps) => {
  const map = useMap();
  const mapsLibrary = useMapsLibrary("maps");
  const circleRef = useRef<google.maps.Circle | null>(null);

  // One circle per map; the effect below updates it in place.
  useEffect(() => {
    if (!map || !mapsLibrary) return;

    const circle = new mapsLibrary.Circle({
      map,
      radius: GEOFENCE_RADIUS_METERS,
      strokeColor: GEOFENCE_COLOR,
      fillColor: GEOFENCE_COLOR,
      clickable: false,
      zIndex: 0,
    });
    circleRef.current = circle;

    return () => {
      circle.setMap(null);
      circleRef.current = null;
    };
  }, [map, mapsLibrary]);

  // map / mapsLibrary are deps so this also runs right after the circle is created.
  useEffect(() => {
    const circle = circleRef.current;
    if (!circle) return;

    circle.setOptions({
      ...(center && { center }),
      visible: !!center,
      fillOpacity: active ? 0.16 : 0.1,
      strokeOpacity: active ? 0.8 : 0.6,
      strokeWeight: active ? 2 : 1.5,
    });
  }, [map, mapsLibrary, center, active]);

  return null;
};

export default GeofenceArea;
