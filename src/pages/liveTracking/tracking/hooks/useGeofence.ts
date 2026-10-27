import { useState } from "react";
import type { LatLng } from "@/types/geo";
import {
  GEOFENCE_EXIT_MARGIN_METERS,
  GEOFENCE_RADIUS_METERS,
} from "../constants/tracking";
import { distanceMeters } from "../utils/locationFilter";

/**
 * Whether the drawn car is inside the geofence around center. It enters at
 * radius and leaves only GEOFENCE_EXIT_MARGIN_METERS past it.
 */
const useGeofence = (
  car: LatLng | null,
  center: LatLng | null,
  radius = GEOFENCE_RADIUS_METERS,
): boolean => {
  const [inside, setInside] = useState(false);

  let next = false;
  if (car && center) {
    const limit = inside
      ? radius + GEOFENCE_EXIT_MARGIN_METERS
      : radius;
    next = distanceMeters(car, center) <= limit;
  }

  if (next !== inside) setInside(next);

  return next;
};

export default useGeofence;
