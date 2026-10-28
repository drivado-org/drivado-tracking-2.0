/** `event:` names on the trip stream (backend EventType). */
export const TRACKING_EVENTS = {
  snapshot: "snapshot",
  location: "location",
  eta: "eta",
  routeChange: "route_change",
  tripStage: "trip_stage",
  vehicleMeta: "vehicle_meta",
  status: "status",
} as const;

export const DEFAULT_SSE_EVENT = "message";
