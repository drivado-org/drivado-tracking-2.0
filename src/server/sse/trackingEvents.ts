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

/** What the parser reports for a message without an `event:` line (SSE default). */
export const DEFAULT_SSE_EVENT = "message";
