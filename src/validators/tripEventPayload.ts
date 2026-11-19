import type { LatLng, TrackPoint } from "@/types/geo";
import type {
  DriverStatusUpdate,
  TripNotification,
  EtaUpdate,
  RouteChange,
  TripVehicleMeta,
} from "@/types/route";
import type { TripSnapshot, TripType } from "@/types/tracking";
import { isValidLatitude, isValidLongitude, parseLatLng } from "./latLng";
import { isPlainObject, toTimestampMs } from "./primitives";
import { readTripStatus, toPayloadObject } from "./trackingPayload";

// Payloads on GET /trips/{tripID}/stream. Any failed rule rejects the event.
//   event: snapshot      { bookingID, driverID, driverStatus, tripID, tripType,
//                          location?: { lat, lng, timestamp }, eta?, distance?, route?, bearing? }
//     Sent once on connect. A bad optional field is dropped, not the whole snapshot.
//   event: eta           { eta, distance }
//   event: route_change  { route: RoutePoint[] }   (at least 2 points)
//   event: vehicle_meta  { reroute, bearing? }
//     bearing is sometimes left out ({"reroute":false}); then it is null and the last one is kept.
//   event: driver_status { driverStatus }
//   event: notification  { message }
//   RoutePoint           { lat, lng }
// Only the snapshot carries the trip ids.

const TRIP_TYPES: readonly TripType[] = ["TRIP_S", "TRIP_D"];

const isRequiredString = (value: unknown): value is string =>
  typeof value === "string" && value.trim() !== "";

const oneOf = <T extends string>(values: readonly T[], value: unknown): value is T =>
  typeof value === "string" && (values as readonly string[]).includes(value);

const isNonNegativeNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && value >= 0;

/** bearing: gte=0, lt=360. */
const isValidBearing = (value: unknown): value is number =>
  isNonNegativeNumber(value) && value < 360;

/** RoutePoint: lat/lng numbers in range; 0,0 is a missing GPS fix. */
const parseRoutePoint = (raw: unknown): LatLng | null => {
  if (!isPlainObject(raw)) return null;
  const { lat, lng } = raw;
  if (!isValidLatitude(lat) || !isValidLongitude(lng)) return null;
  if (lat === 0 && lng === 0) return null;
  return { lat, lng };
};

/** min=2, dive: one bad point rejects the route. */
const parseRoutePath = (raw: unknown): LatLng[] | null => {
  if (!Array.isArray(raw) || raw.length < 2) return null;
  const points = raw.map(parseRoutePoint);
  return points.some((point) => point === null) ? null : (points as LatLng[]);
};

/** eta: integer seconds >= 0; distance: meters >= 0. */
const isValidEta = (eta: unknown): eta is number =>
  isNonNegativeNumber(eta) && Number.isInteger(eta);

/** `now` is when the event arrived; the arrival time is counted from it. Never throws. */
export const parseEtaEvent = (raw: unknown, now = Date.now()): EtaUpdate | null => {
  const payload = toPayloadObject(raw);
  if (!payload) return null;

  const { eta, distance } = payload;
  if (!isValidEta(eta) || !isNonNegativeNumber(distance)) return null;

  return {
    etaSeconds: eta,
    distanceMeters: distance,
    arrivalTime: new Date(now + eta * 1000).toISOString(),
  };
};

/**
 * { eta: 0, distance: 0 } is sent both before the route is known and on arrival.
 * Before any real ETA it says nothing (it would read "0 min, arriving now").
 */
export const isEtaEmpty = (eta: EtaUpdate): boolean =>
  eta.etaSeconds === 0 && eta.distanceMeters === 0;

/** `event: route_change` { route }. Never throws. */
export const parseRouteChange = (raw: unknown): RouteChange | null => {
  const payload = toPayloadObject(raw);
  if (!payload) return null;

  const routePath = parseRoutePath(payload.route);
  return routePath ? { routePath } : null;
};

/** `event: vehicle_meta` { reroute, bearing? }. Never throws. */
export const parseVehicleMeta = (raw: unknown): TripVehicleMeta | null => {
  const payload = toPayloadObject(raw);
  if (!payload) return null;

  const { reroute, bearing } = payload;
  if (typeof reroute !== "boolean") return null;

  // Optional; when sent it must be in range.
  const hasBearing = bearing !== undefined && bearing !== null;
  if (hasBearing && !isValidBearing(bearing)) return null;

  return { reroute, bearing: hasBearing ? (bearing as number) : null };
};

/** `event: driver_status` { driverStatus }. Never throws. */
export const parseDriverStatusEvent = (raw: unknown): DriverStatusUpdate | null => {
  const payload = toPayloadObject(raw);
  if (!payload) return null;

  const driverStatus = readTripStatus(payload);
  return driverStatus ? { driverStatus } : null;
};

/** `event: notification` { message }. `now` is when the event arrived. Never throws. */
export const parseNotificationEvent = (
  raw: unknown,
  now = Date.now(),
): TripNotification | null => {
  const payload = toPayloadObject(raw);
  if (!payload || !isRequiredString(payload.message)) return null;

  return { message: payload.message.trim(), receivedAt: new Date(now).toISOString() };
};

/** Snapshot `location`: { lat, lng, timestamp }; undefined when missing or invalid. */
const parseSnapshotLocation = (raw: unknown): TrackPoint | undefined => {
  if (!isPlainObject(raw)) return undefined;
  const position = parseLatLng(raw.lat, raw.lng);
  const timestampMs = toTimestampMs(raw.timestamp);
  if (!position || timestampMs === null) return undefined;
  return { ...position, timestamp: new Date(timestampMs).toISOString() };
};

/**
 * Ids, tripType and driverStatus are required; a missing or bad optional field is left out
 * so the rest of the snapshot still shows. Never throws.
 */
export const parseTripSnapshot = (raw: unknown): TripSnapshot | null => {
  const payload = toPayloadObject(raw);
  if (!payload) return null;

  const { driverID, bookingID, tripID, tripType } = payload;
  const driverStatus = readTripStatus(payload);
  if (
    !isRequiredString(driverID) ||
    !isRequiredString(bookingID) ||
    !isRequiredString(tripID) ||
    !oneOf(TRIP_TYPES, tripType) ||
    !driverStatus
  ) {
    return null;
  }

  const snapshot: TripSnapshot = { driverID, bookingID, tripID, tripType, driverStatus };
  const { eta, distance, bearing } = payload;

  const location = parseSnapshotLocation(payload.location);
  if (location) snapshot.location = location;

  // 0 is real: "arriving now" / "facing north".
  if (isValidEta(eta)) snapshot.eta = eta;
  if (isNonNegativeNumber(distance)) snapshot.distance = distance;

  const route = parseRoutePath(payload.route);
  if (route) snapshot.route = route;

  if (isValidBearing(bearing)) snapshot.bearing = bearing;

  return snapshot;
};
