import type { LatLng } from "./geo";
import type { DriverStatus } from "./tracking";

// Mirrors the payloads sent on the trip stream (GET /trips/{tripID}/stream).
// Only `snapshot` carries the trip ids; the live events below carry just their own fields.

/** `event: eta` — { eta, distance }. */
export interface EtaUpdate {
  /** Time left in seconds, from `eta`. */
  etaSeconds: number;
  /** Distance left in meters, from `distance`. */
  distanceMeters: number;
  /** ISO string: when the event arrived plus etaSeconds. */
  arrivalTime: string;
}

/** `event: route_change` — { route }. */
export interface RouteChange {
  /** At least 2 points, from `route`. */
  routePath: LatLng[];
}

/** `event: vehicle_meta` — { reroute, bearing? }. */
export interface TripVehicleMeta {
  /** The driver left the route; a route_change follows. */
  reroute: boolean;
  /** Degrees clockwise from north, 0–359. null when the event leaves it out. */
  bearing: number | null;
}

/** `event: driver_status` — { driverStatus }. */
export interface DriverStatusUpdate {
  driverStatus: DriverStatus;
}

/** `event: notification` — { message }. */
export interface TripNotification {
  message: string;
  /** ISO string: when the event arrived. Tells two identical messages apart. */
  receivedAt: string;
}

export interface RouteState {
  route: RouteChange | null;
  eta: EtaUpdate | null;
  vehicleMeta: TripVehicleMeta | null;
}
