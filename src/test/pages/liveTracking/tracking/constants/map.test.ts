import { parseLatLng } from "@/validators/latLng";
import { DEFAULT_MAP_CENTER, DEFAULT_MAP_ID, DEFAULT_MAP_ZOOM } from "@/pages/liveTracking/tracking/constants/map";

describe("map constants", () => {
  it("has a valid default center", () => {
    expect(parseLatLng(DEFAULT_MAP_CENTER.lat, DEFAULT_MAP_CENTER.lng)).toEqual(
      DEFAULT_MAP_CENTER,
    );
  });

  it("has a zoom Google Maps supports (0–22)", () => {
    expect(DEFAULT_MAP_ZOOM).toBeGreaterThanOrEqual(0);
    expect(DEFAULT_MAP_ZOOM).toBeLessThanOrEqual(22);
  });

  it("has a non-empty fallback map id", () => {
    expect(DEFAULT_MAP_ID.trim()).not.toBe("");
  });
});
