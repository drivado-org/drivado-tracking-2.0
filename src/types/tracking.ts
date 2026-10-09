export type TripType = "TRIP_S" | "TRIP_D";

export type DriverStatus =
  | "ENROUTE"
  | "ARRIVE"
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
  data: TrackingPayload | null;
  loading: boolean;
  connected: boolean;
  error: string | null;
}
