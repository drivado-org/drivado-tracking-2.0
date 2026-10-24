export interface DriverData {
  driverName: string;
  rating: number;
  trips: number;
  vehicleRegistration: string;
}

export interface BookingStatusData {
  label: string;
  time?: string;
  completed: boolean;
  active: boolean;
}
export interface TripMetricsData {
  duration: number | null;
  distance: number | null;
  dropOffTime: string | null;
}
export interface CompletedTripData {
  driverName: string;
  vehicleType: string;
  bookingId: string;
  duration: number;
  distance: number;
  dropoffLocation: string;
}

export interface JourneyFeedback {
  rating: number;
  note: string;
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
