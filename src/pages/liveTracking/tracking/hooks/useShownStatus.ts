import { useEffect, useState } from "react";
import type { LatLng } from "@/types/geo";
import type { DriverStatus } from "@/types/tracking";
import { isArrivalStatus } from "@/utils/tripStatus";
import { ARRIVED_METERS, ARRIVAL_MAX_WAIT_MS } from "../constants/tracking";
import { distanceMeters } from "../utils/locationFilter";

/**
 * The trip status as the map should show it. The car is drawn a few seconds behind live,
 * so ARRIVED / COMPLETED wait until the drawn car reaches the end of the route (or
 * ARRIVAL_MAX_WAIT_MS, if it never quite gets there): the toast never fires mid-road.
 * Every other status shows at once.
 */
const useShownStatus = (
  status: DriverStatus | null,
  car: LatLng | null,
  destination: LatLng | null,
): DriverStatus | null => {
  const [shown, setShown] = useState(status);

  const waiting = status !== shown && isArrivalStatus(status);
  const atDestination =
    !!car && !!destination && distanceMeters(car, destination) <= ARRIVED_METERS;

  if (status !== shown && (!waiting || atDestination)) setShown(status);

  useEffect(() => {
    if (!waiting) return;
    const timer = setTimeout(() => setShown(status), ARRIVAL_MAX_WAIT_MS);
    return () => clearTimeout(timer);
  }, [waiting, status]);

  return shown;
};

export default useShownStatus;
