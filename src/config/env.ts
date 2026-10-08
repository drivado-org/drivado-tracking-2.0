import { toNonEmptyString } from "@/validators/primitives";

// Single place to read env vars. Every value is validated; missing → null.
export const env = {
  googleMapsApiKey: toNonEmptyString(import.meta.env.VITE_GOOGLE_MAPS_API_KEY),
  googleMapsMapId: toNonEmptyString(import.meta.env.VITE_GOOGLE_MAPS_MAP_ID),
};
