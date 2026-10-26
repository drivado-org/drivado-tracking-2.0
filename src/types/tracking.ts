import type { TrackPoint } from "./geo";

export type TripType = "TRIP_S" | "TRIP_D";

export type DriverStatus =
  | "ENROUTE"
  | "ARRIVED"
  | "POB"
  | "COMPLETED"
  | "NOSHOW";

export interface TrackingPayload {
  driverID: string;
  bookingID: string;
  tripID: string;
  /** null when missing or unknown — backend plans to drop it. */
  tripType: TripType | null;
  /** null when missing or unknown — backend plans to drop it. */
  driverStatus: DriverStatus | null;
  lat: number;
  lng: number;
  /** ISO string, from location.timestamp / clientTimeUTC / timestamp. */
  timestamp: string;
  sequence: number | null;
}

/** `event: location` after the snapshot: position only, no trip ids. */
export interface LocationUpdate {
  lat: number;
  lng: number;
  /** ISO string. */
  timestamp: string;
}

export interface TrackingActionPayload {
  tripID: string;
}

export interface TrackingState {
  /** Latest snapshot with the trip ids; null until a snapshot arrives. */
  data: TrackingPayload | null;
  /** Recent car positions, oldest first, newest last. Capped at MAX_TRACK_POINTS. */
  points: TrackPoint[];
  /** Latest known status, from the snapshot or eta / route_change / vehicle_meta. */
  driverStatus: DriverStatus | null;
  loading: boolean;
  connected: boolean;
  error: string | null;
}
