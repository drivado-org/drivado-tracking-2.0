/** `event:` names on the trip stream (backend EventType). */
export const TRACKING_EVENTS = {
  snapshot: "snapshot",
  location: "location",
  eta: "eta",
  routeChange: "route_change",
  vehicleMeta: "vehicle_meta",
  driverStatus: "driver_status",
  notification: "notification",
} as const;

export const DEFAULT_SSE_EVENT = "message";
