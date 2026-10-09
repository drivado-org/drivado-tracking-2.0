import type {
  DriverStatus,
  LocationUpdate,
  TrackingPayload,
  TripType,
} from "@/types/tracking";
import { parseLatLng } from "./latLng";
import {
  isPlainObject,
  toFiniteNumber,
  toNonEmptyString,
  toTimestampMs,
} from "./primitives";

// Backend shapes accepted (update only this file when they change):
//   SSE snapshot: { driverID, bookingID, tripID, tripType, driverStatus, location: { lat, lng, timestamp }, sequence }
//   SSE location: { lat, lng, timestamp } (every second after the snapshot, no ids)
//   Location API: { data: [{ driverID, bookingID, tripID, lat, lng, clientTimeUTC }] }
// tripType / driverStatus / sequence are optional: the backend plans to drop them.

const TRIP_TYPES: readonly TripType[] = ["TRIP_S", "TRIP_D"];

const DRIVER_STATUSES: readonly DriverStatus[] = [
  "ENROUTE",
  "ARRIVE",
  "POB",
  "COMPLETED",
  "NOSHOW",
];

const toEnumValue = <T extends string>(values: readonly T[], value: unknown): T | null => {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toUpperCase();
  return (values as readonly string[]).includes(normalized) ? (normalized as T) : null;
};

export const parseDriverStatus = (value: unknown): DriverStatus | null =>
  toEnumValue(DRIVER_STATUSES, value);

export const parseTripType = (value: unknown): TripType | null =>
  toEnumValue(TRIP_TYPES, value);

const toPayloadObject = (raw: unknown): Record<string, unknown> | null => {
  if (typeof raw === "string") {
    try {
      const parsed: unknown = JSON.parse(raw);
      return isPlainObject(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }
  return isPlainObject(raw) ? raw : null;
};

/** lat/lng/timestamp live in `location` (SSE) or at the top level (location API). */
const pickLocationFields = (payload: Record<string, unknown>) => {
  if ("location" in payload) {
    const location = isPlainObject(payload.location) ? payload.location : {};
    return { lat: location.lat, lng: location.lng, timestamp: location.timestamp };
  }
  return {
    lat: payload.lat,
    lng: payload.lng,
    timestamp: payload.clientTimeUTC ?? payload.timestamp,
  };
};

/**
 * Turns one unknown point (object or JSON string) into a TrackingPayload.
 * Returns null when an id, the position or the timestamp is missing or invalid. Never throws.
 */
export const parseTrackingPayload = (raw: unknown): TrackingPayload | null => {
  try {
    const payload = toPayloadObject(raw);
    if (!payload) return null;

    const fields = pickLocationFields(payload);
    const driverID = toNonEmptyString(payload.driverID);
    const bookingID = toNonEmptyString(payload.bookingID);
    const tripID = toNonEmptyString(payload.tripID);
    const position = parseLatLng(fields.lat, fields.lng);
    const timestampMs = toTimestampMs(fields.timestamp);

    if (
      driverID === null ||
      bookingID === null ||
      tripID === null ||
      position === null ||
      timestampMs === null
    ) {
      return null;
    }

    return {
      driverID,
      bookingID,
      tripID,
      tripType: parseTripType(payload.tripType),
      driverStatus: parseDriverStatus(payload.driverStatus),
      lat: position.lat,
      lng: position.lng,
      timestamp: new Date(timestampMs).toISOString(),
      sequence: toFiniteNumber(payload.sequence),
    };
  } catch {
    return null;
  }
};

/**
 * Reads an `event: location` message: position and timestamp only, no ids.
 * Returns null when any of them is missing or invalid. Never throws.
 */
export const parseLocationUpdate = (raw: unknown): LocationUpdate | null => {
  try {
    const payload = toPayloadObject(raw);
    if (!payload) return null;

    const fields = pickLocationFields(payload);
    const position = parseLatLng(fields.lat, fields.lng);
    const timestampMs = toTimestampMs(fields.timestamp);
    if (position === null || timestampMs === null) return null;

    return {
      lat: position.lat,
      lng: position.lng,
      timestamp: new Date(timestampMs).toISOString(),
    };
  } catch {
    return null;
  }
};

const isNewerPoint = (a: TrackingPayload, b: TrackingPayload): boolean => {
  const diff = Date.parse(a.timestamp) - Date.parse(b.timestamp);
  if (diff !== 0) return diff > 0;
  return (a.sequence ?? -Infinity) > (b.sequence ?? -Infinity);
};

/** Reads `{ data: [...] }` or a bare array; anything else is treated as one point. */
const toPointList = (raw: unknown): unknown[] => {
  if (typeof raw === "string") {
    try {
      return toPointList(JSON.parse(raw));
    } catch {
      return [];
    }
  }
  if (Array.isArray(raw)) return raw;
  if (isPlainObject(raw) && "data" in raw) {
    return Array.isArray(raw.data) ? raw.data : [];
  }
  return [raw];
};

/**
 * Turns one SSE message into the point the car should move to: the newest valid one.
 * Invalid points are skipped. Returns null when none is valid. Never throws.
 */
export const parseTrackingMessage = (raw: unknown): TrackingPayload | null => {
  try {
    let newest: TrackingPayload | null = null;
    for (const item of toPointList(raw)) {
      const point = parseTrackingPayload(item);
      if (point && (!newest || isNewerPoint(point, newest))) newest = point;
    }
    return newest;
  } catch {
    return null;
  }
};
