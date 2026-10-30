export interface DriverData {
  driverName: string;
  driverContact: string;
  vehicleRegNo: string;
  rating?: number;
  trips?: number;
}

export interface BookingStatusData {
  label: string;
  time?: string;
  completed: boolean;
  active: boolean;
}

export interface BookingIdData {
  bookingId: string;
  vehicleType: string;
}

// Booking information used by the dashboard
export interface BookingDetails {
  bookingId: string;
  vehicleType: string;
  pickUpName: string;
  dropOffName: string;
  passengerName: string;
  passengers: number;
  luggage: number;
  flightNo: string;
}

// API response structure
export interface BookingDetailsResponse {
  success: boolean;
  data: {
    bookingId: string;
    vehicleType: string;
    driverName: string;
    driverContact: string;
    vehicleRegNo: string;
    pickUpName: string;
    dropOffName: string;
    distance: number;
    duration: string;
    passengerName: string;
    passengers: number;
    luggage: number;
    flightNo: string;
  };
  message?: string;
}

// Initial booking metrics from backend
export interface BookingMetricsData {
  distance: number;
  duration: string;
}

// Live metrics from SSE
export interface TripMetricsData {
  duration: number | null;
  distance: number | null;
  dropOffTime: string | null;
}

export interface CompletedTripData {
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
