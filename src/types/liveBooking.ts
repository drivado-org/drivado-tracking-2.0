export interface DriverData {
  driverName: string;
  rating: number;
  trips: number;
  vehicleRegistration: string;
}

export type TrackingEventType =
  | "snapshot"
  | "location"
  | "eta"
  | "route_change"
  | "trip_stage"
  | "vehicle_meta"
  | "status";

export interface TrackingEvent {
  type: TrackingEventType;
  data: unknown;
}
