import type { LatLng, TrackPoint } from "./geo";

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

/**
 * `event: snapshot`: the trip's full state, sent once when the stream connects.
 * Optional fields are absent until the source first reports. 0 is a real value.
 */
export interface TripSnapshot {
  bookingID: string;
  /** UUIDv7, same for both legs. */
  tripID: string;
  driverID: string;
  tripType: TripType;
  driverStatus: DriverStatus;
  location?: TrackPoint;
  /** Seconds remaining (integer). */
  eta?: number;
  /** Meters remaining. */
  distance?: number;
  /** At least 2 points. */
  route?: LatLng[];
  /** Degrees clockwise from north, 0–359. */
  bearing?: number;
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
