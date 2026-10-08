import type { LatLng } from "@/types/geo";
import { toFiniteNumber } from "./primitives";

export const isValidLatitude = (value: unknown): value is number =>
  typeof value === "number" &&
  Number.isFinite(value) &&
  value >= -90 &&
  value <= 90;

export const isValidLongitude = (value: unknown): value is number =>
  typeof value === "number" &&
  Number.isFinite(value) &&
  value >= -180 &&
  value <= 180;

/** Returns a LatLng or null. Rejects 0,0 — devices send it when there is no GPS fix. */
export const parseLatLng = (rawLat: unknown, rawLng: unknown): LatLng | null => {
  const lat = toFiniteNumber(rawLat);
  const lng = toFiniteNumber(rawLng);

  if (!isValidLatitude(lat) || !isValidLongitude(lng)) return null;
  if (lat === 0 && lng === 0) return null;

  return { lat, lng };
};
