import type { DriverStatus } from "@/types/tracking";
import type { MapNotice } from "../components/MapToast";

/**
 * Label on the marker at the end of the route. The route ends at the pickup until the
 * passenger is on board, so "DROP-OFF" only marks the last destination.
 */
export const destinationLabel = (status: DriverStatus | null): string | null => {
  switch (status) {
    case "ENROUTE":
      return "PICKUP";
    case "ARRIVED":
      return "ARRIVED";
    case "POB":
      return "DROP-OFF";
    case "COMPLETED":
      return "COMPLETED";
    default:
      return null;
  }
};

/** The driver is still on the way to (or waiting at) the pickup: the route ends there. */
export const isPickupLeg = (status: DriverStatus | null) =>
  status === "ENROUTE" || status === "ARRIVED";

/** Where the route ends, for the camera toasts. */
export const destinationName = (status: DriverStatus | null): string => {
  if (status === "ENROUTE" || status === "ARRIVED") return "pickup";
  if (status === "POB" || status === "COMPLETED") return "drop-off";
  return "destination";
};

/** The car is driving: the time left is worth showing above it. */
export const isDriving = (status: DriverStatus | null) =>
  status === null || status === "ENROUTE" || status === "POB";

/** Toast for each trip step. */
export const statusNotice = (status: DriverStatus | null): MapNotice | null => {
  switch (status) {
    case "ENROUTE":
      return { text: "Driver is on the way to the pickup", icon: "enroute", long: true };
    case "ARRIVED":
      return { text: "Driver has arrived at the pickup", icon: "arrived", long: true };
    case "POB":
      return { text: "Passenger on board — heading to the drop-off", icon: "onboard", long: true };
    case "COMPLETED":
      return { text: "Arrived at the drop-off — trip completed", icon: "completed", long: true };
    case "NOSHOW":
      return { text: "Trip ended — passenger no-show", icon: "noshow", long: true };
    default:
      return null;
  }
};
