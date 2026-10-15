import type { LatLng } from "@/types/geo";
import type {
  EtaUpdate,
  RouteChange,
  TripEventBase,
  TripVehicleMeta,
} from "@/types/route";
import type { DriverStatus, TripType } from "@/types/tracking";
import { isValidLatitude, isValidLongitude } from "./latLng";
import { isPlainObject } from "./primitives";
import { toPayloadObject } from "./trackingPayload";

// Checks each event exactly like the backend's `validate` tags; any failed rule rejects the event.
//   event: eta          ETAUpdate       { driverID, bookingID, tripID, tripType, driverStatus?, eta, distance }
//   event: route_change RouteChange     { driverID, bookingID, tripID, tripType, driverStatus, routePath }
//   event: vehicle_meta TripVehicleMeta { driverID, bookingID, tripID, tripType, driverStatus, reroute, bearing? }
//     bearing is sometimes left out ({"reroute":false}); then it is null and the last one is kept.
//   RoutePoint          { lat, lng }

const TRIP_TYPES: readonly TripType[] = ["TRIP_S", "TRIP_D"];

const EVENT_DRIVER_STATUSES: readonly DriverStatus[] = [
  "ENROUTE",
  "ARRIVED",
  "POB",
  "COMPLETED",
  "NOSHOW",
];

const isRequiredString = (value: unknown): value is string =>
  typeof value === "string" && value.trim() !== "";

const oneOf = <T extends string>(values: readonly T[], value: unknown): value is T =>
  typeof value === "string" && (values as readonly string[]).includes(value);

const isNonNegativeNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && value >= 0;

/** driverID, bookingID, tripID and tripType: required on every event. */
const parseBase = (payload: Record<string, unknown>): TripEventBase | null => {
  const { driverID, bookingID, tripID, tripType } = payload;
  if (
    !isRequiredString(driverID) ||
    !isRequiredString(bookingID) ||
    !isRequiredString(tripID) ||
    !oneOf(TRIP_TYPES, tripType)
  ) {
    return null;
  }
  return { driverID, bookingID, tripID, tripType };
};

/** RoutePoint: lat/lng numbers in range; 0,0 is a missing GPS fix. */
const parseRoutePoint = (raw: unknown): LatLng | null => {
  if (!isPlainObject(raw)) return null;
  const { lat, lng } = raw;
  if (!isValidLatitude(lat) || !isValidLongitude(lng)) return null;
  if (lat === 0 && lng === 0) return null;
  return { lat, lng };
};

/** `now` is when the event arrived; the arrival time is counted from it. Never throws. */
export const parseEtaEvent = (raw: unknown, now = Date.now()): EtaUpdate | null => {
  const payload = toPayloadObject(raw);
  if (!payload) return null;

  const base = parseBase(payload);
  if (!base) return null;

  // omitempty: missing or "" is fine, anything else must be a known status.
  const { driverStatus, eta, distance } = payload;
  const hasStatus = driverStatus !== undefined && driverStatus !== null && driverStatus !== "";
  if (hasStatus && !oneOf(EVENT_DRIVER_STATUSES, driverStatus)) return null;

  // eta is an int64 of seconds.
  if (!isNonNegativeNumber(eta) || !Number.isInteger(eta)) return null;
  if (!isNonNegativeNumber(distance)) return null;

  return {
    ...base,
    driverStatus: hasStatus ? (driverStatus as DriverStatus) : null,
    etaSeconds: eta,
    distanceMeters: distance,
    arrivalTime: new Date(now + eta * 1000).toISOString(),
  };
};

/**
 * The stream opens with { driverStatus: "", eta: 0, distance: 0 } before the route is known.
 * It is valid but says nothing: showing it would read "0 min, arriving now".
 */
export const isEtaPending = (eta: EtaUpdate): boolean =>
  eta.driverStatus === null && eta.etaSeconds === 0 && eta.distanceMeters === 0;

/** Never throws. */
export const parseRouteChange = (raw: unknown): RouteChange | null => {
  const payload = toPayloadObject(raw);
  if (!payload) return null;

  const base = parseBase(payload);
  const { driverStatus, routePath } = payload;
  if (!base || !oneOf(EVENT_DRIVER_STATUSES, driverStatus)) return null;

  // min=2, dive: one bad point rejects the route.
  if (!Array.isArray(routePath) || routePath.length < 2) return null;
  const points = routePath.map(parseRoutePoint);
  if (points.some((point) => point === null)) return null;

  return { ...base, driverStatus, routePath: points as LatLng[] };
};

/** Never throws. */
export const parseVehicleMeta = (raw: unknown): TripVehicleMeta | null => {
  const payload = toPayloadObject(raw);
  if (!payload) return null;

  const base = parseBase(payload);
  const { driverStatus, reroute, bearing } = payload;
  if (!base || !oneOf(EVENT_DRIVER_STATUSES, driverStatus)) return null;
  if (typeof reroute !== "boolean") return null;

  // Optional; when sent: gte=0, lt=360.
  const hasBearing = bearing !== undefined && bearing !== null;
  if (hasBearing && (!isNonNegativeNumber(bearing) || bearing >= 360)) return null;

  return { ...base, driverStatus, reroute, bearing: hasBearing ? (bearing as number) : null };
};
