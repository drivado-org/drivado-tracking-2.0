import type { LatLng } from "@/types/geo";

/** Kolkata — shown until the first car location arrives. */
export const DEFAULT_MAP_CENTER: LatLng = { lat: 22.5785, lng: 88.446 };

export const DEFAULT_MAP_ZOOM = 15;

/** Google's development map id. Needed for AdvancedMarker until a real one is set in env. */
export const DEFAULT_MAP_ID = "DEMO_MAP_ID";
