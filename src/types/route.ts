import type { LatLng } from "./geo";
import type { DriverStatus, TripType } from "./tracking";

// Mirrors the backend structs sent on the trip stream.

/** Fields every trip event carries. */
export interface TripEventBase {
  driverID: string;
  bookingID: string;
  tripID: string;
  tripType: TripType;
}

/** `event: eta` (ETAUpdate). */
export interface EtaUpdate extends TripEventBase {
  /** null when the backend leaves it out (omitempty). */
  driverStatus: DriverStatus | null;
  /** Time left, from `eta`. */
  etaSeconds: number;
  /** Distance left, from `distance`. */
  distanceMeters: number;
  /** ISO string: when the event arrived plus etaSeconds. */
  arrivalTime: string;
}

/** `event: route_change` (RouteChange). */
export interface RouteChange extends TripEventBase {
  driverStatus: DriverStatus;
  /** At least 2 points. */
  routePath: LatLng[];
}

/** `event: vehicle_meta` (TripVehicleMeta). */
export interface TripVehicleMeta extends TripEventBase {
  driverStatus: DriverStatus;
  /** The driver left the route; a route_change follows. */
  reroute: boolean;
  /** Degrees clockwise from north, 0–359. null when the event leaves it out. */
  bearing: number | null;
}

export interface RouteState {
  route: RouteChange | null;
  eta: EtaUpdate | null;
  vehicleMeta: TripVehicleMeta | null;
}
