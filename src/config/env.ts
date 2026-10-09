import { toNonEmptyString } from "@/validators/primitives";

// Single place to read env vars. Every value is validated; missing → null.
export const env = {
  googleMapsApiKey: toNonEmptyString(import.meta.env.VITE_GOOGLE_MAPS_API_KEY),
  googleMapsMapId: toNonEmptyString(import.meta.env.VITE_GOOGLE_MAPS_MAP_ID),
  /** null → relative URLs, served by the Vite dev proxy (see vite.config.ts). */
  trackingApiBaseUrl:
    toNonEmptyString(import.meta.env.VITE_TRACKING_API_BASE_URL)?.replace(/\/+$/, "") || null,
};
