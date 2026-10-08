import { parseTrackingPayload } from "@/validators/trackingPayload";
import { buildDemoPoints } from "@/pages/liveTracking/tracking/mock/demoPoints";

const START_MS = Date.UTC(2026, 9, 6, 10, 0, 0);
const INTERVAL_MS = 2000;
const points = buildDemoPoints("T123", START_MS, INTERVAL_MS);
const parsed = points.map((point) => parseTrackingPayload(point));

/** Rough metres between two points — fine for a few hundred metres. */
const metresBetween = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) => {
  const dLat = (b.lat - a.lat) * 111_320;
  const dLng = (b.lng - a.lng) * 111_320 * Math.cos((a.lat * Math.PI) / 180);
  return Math.hypot(dLat, dLng);
};

describe("buildDemoPoints", () => {
  it("has enough points to watch the car move", () => {
    expect(points.length).toBeGreaterThanOrEqual(20);
  });

  it("every point passes the same validator as real SSE data", () => {
    parsed.forEach((point) => expect(point).not.toBeNull());
  });

  it("uses the given trip id", () => {
    parsed.forEach((point) => expect(point?.tripID).toBe("T123"));
  });

  it("spaces timestamps by the interval", () => {
    parsed.forEach((point, i) => {
      expect(Date.parse(point!.timestamp)).toBe(START_MS + i * INTERVAL_MS);
    });
  });

  it("moves in small steps so the car glides along the road", () => {
    for (let i = 1; i < parsed.length; i++) {
      const step = metresBetween(parsed[i - 1]!, parsed[i]!);
      expect(step).toBeGreaterThan(5);
      expect(step).toBeLessThan(80);
    }
  });

  it("goes ENROUTE → ARRIVE → POB → COMPLETED in order", () => {
    const order = ["ENROUTE", "ARRIVE", "POB", "COMPLETED"];
    const statuses = parsed.map((point) => point!.driverStatus);
    const seen = statuses.filter((status, i) => status !== statuses[i - 1]);
    expect(seen).toEqual(order);
  });

  it("only the last point is COMPLETED", () => {
    const statuses = parsed.map((point) => point!.driverStatus);
    expect(statuses.at(-1)).toBe("COMPLETED");
    expect(statuses.slice(0, -1)).not.toContain("COMPLETED");
  });
});
