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
  tripType: TripType;
  driverStatus: DriverStatus;
  lat: number;
  lng: number;
  timestamp: string;
  sequence: number | null;
}

export interface TrackingActionPayload {
  tripID: string;
  token?: string;
}

export interface TrackingState {
  data: TrackingPayload | null;
  loading: boolean;
  connected: boolean;
  error: string | null;
}
