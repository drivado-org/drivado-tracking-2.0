import type { LatLng } from "@/types/geo";

export type Camera = { center: LatLng; zoom: number };

export type Padding = { top: number; right: number; bottom: number; left: number };

type Size = { width: number; height: number };

/** Google map tiles are 256 px at zoom 0. */
const TILE_PX = 256;

// Web Mercator, as 0..1 across the world.
const toWorldX = (lng: number) => (lng + 180) / 360;
const toWorldY = (lat: number) => {
  const sin = Math.sin((lat * Math.PI) / 180);
  return 0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI);
};
const fromWorldX = (x: number) => x * 360 - 180;
const fromWorldY = (y: number) =>
  (360 / Math.PI) * Math.atan(Math.exp((0.5 - y) * 2 * Math.PI)) - 90;

/**
 * Camera that shows every point inside the map minus the padding, like fitBounds, but
 * computed instead of applied: the caller can glide to it.
 * Zoom is fractional (vector maps draw any zoom) and never above maxZoom.
 */
export const fitCamera = (
  points: LatLng[],
  size: Size,
  padding: Padding,
  maxZoom: number,
): Camera | null => {
  if (points.length === 0 || size.width <= 0 || size.height <= 0) return null;

  const xs = points.map((p) => toWorldX(p.lng));
  const ys = points.map((p) => toWorldY(p.lat));
  const x0 = Math.min(...xs);
  const x1 = Math.max(...xs);
  const y0 = Math.min(...ys);
  const y1 = Math.max(...ys);

  // A small screen still keeps some room to fit into.
  const availW = Math.max(80, size.width - padding.left - padding.right);
  const availH = Math.max(80, size.height - padding.top - padding.bottom);
  const fit = Math.log2(
    Math.min(availW / ((x1 - x0) * TILE_PX), availH / ((y1 - y0) * TILE_PX)),
  );
  const zoom = Math.min(maxZoom, fit);

  // The box sits in the middle of the padded area, which is off the map's centre when the
  // padding is uneven.
  const worldPx = TILE_PX * 2 ** zoom;
  const cx = (x0 + x1) / 2 - (padding.left - padding.right) / 2 / worldPx;
  const cy = (y0 + y1) / 2 - (padding.top - padding.bottom) / 2 / worldPx;

  return { center: { lat: fromWorldY(cy), lng: fromWorldX(cx) }, zoom };
};

/** Share of the gap to close this frame, from the share still left after one second. */
export const easeFactor = (leftPerSecond: number, dtSeconds: number) =>
  1 - leftPerSecond ** dtSeconds;

/** `from` moved share `k` (0..1) of the way to `to`. */
export const lerpCamera = (from: Camera, to: Camera, k: number): Camera => ({
  center: {
    lat: from.center.lat + (to.center.lat - from.center.lat) * k,
    lng: from.center.lng + (to.center.lng - from.center.lng) * k,
  },
  zoom: from.zoom + (to.zoom - from.zoom) * k,
});

/** Slow start, slow finish. k is 0..1. */
export const easeInOutCubic = (k: number) =>
  k < 0.5 ? 4 * k ** 3 : 1 - (-2 * k + 2) ** 3 / 2;
