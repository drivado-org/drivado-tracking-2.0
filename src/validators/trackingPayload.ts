import type { DriverStatus, TrackingPayload, TripType } from "@/types/tracking";
import { parseLatLng } from "./latLng";
import {
  isPlainObject,
  toFiniteNumber,
  toNonEmptyString,
  toTimestampMs,
} from "./primitives";

// SSE contract: { driverID, bookingID, tripID, tripType, driverStatus, lat, lng, timestamp, sequence }.
// Update only this file when the backend shape changes.

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

/**
 * Turns an unknown SSE payload (object or JSON string) into a TrackingPayload.
 * Returns null when any required field is missing or invalid. Never throws.
 */
export const parseTrackingPayload = (raw: unknown): TrackingPayload | null => {
  try {
    const payload = toPayloadObject(raw);
    if (!payload) return null;

    const driverID = toNonEmptyString(payload.driverID);
    const bookingID = toNonEmptyString(payload.bookingID);
    const tripID = toNonEmptyString(payload.tripID);
    const tripType = parseTripType(payload.tripType);
    const driverStatus = parseDriverStatus(payload.driverStatus);
    const position = parseLatLng(payload.lat, payload.lng);
    const timestampMs = toTimestampMs(payload.timestamp);

    if (
      driverID === null ||
      bookingID === null ||
      tripID === null ||
      tripType === null ||
      driverStatus === null ||
      position === null ||
      timestampMs === null
    ) {
      return null;
    }

    return {
      driverID,
      bookingID,
      tripID,
      tripType,
      driverStatus,
      lat: position.lat,
      lng: position.lng,
      timestamp: new Date(timestampMs).toISOString(),
      sequence: toFiniteNumber(payload.sequence),
    };
  } catch {
    return null;
  }
};
