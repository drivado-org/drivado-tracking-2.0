import type { LatLng } from "@/types/geo";

/** Same shape the backend sends over SSE. */
export type DemoRawPoint = {
  driverID: string;
  bookingID: string;
  tripID: string;
  tripType: string;
  driverStatus: string;
  lat: number;
  lng: number;
  timestamp: string;
  sequence: number;
};

/** Demo drive around Salt Lake / New Town, Kolkata (approximate, not road-snapped). */
const DEMO_ROUTE: LatLng[] = [
  { lat: 22.5752, lng: 88.441 },
  { lat: 22.5785, lng: 88.444 },
  { lat: 22.581, lng: 88.4472 },
  { lat: 22.579, lng: 88.451 },
  { lat: 22.576, lng: 88.453 },
];

/** Max distance between two demo points, so the car moves in small steps. */
const STEP_METRES = 40;

const metresBetween = (a: LatLng, b: LatLng) => {
  const dLat = (b.lat - a.lat) * 111_320;
  const dLng = (b.lng - a.lng) * 111_320 * Math.cos((a.lat * Math.PI) / 180);
  return Math.hypot(dLat, dLng);
};

/** Fills each route segment with evenly spaced points. */
const densify = (route: LatLng[]): LatLng[] => {
  const points: LatLng[] = [route[0]];

  for (let i = 1; i < route.length; i++) {
    const from = route[i - 1];
    const to = route[i];
    const steps = Math.ceil(metresBetween(from, to) / STEP_METRES);

    for (let s = 1; s <= steps; s++) {
      points.push({
        lat: from.lat + ((to.lat - from.lat) * s) / steps,
        lng: from.lng + ((to.lng - from.lng) * s) / steps,
      });
    }
  }

  return points;
};

/** ENROUTE to pickup, ARRIVE once, POB to drop-off, COMPLETED on the last point. */
const statusAt = (index: number, total: number) => {
  const pickupIndex = Math.floor(total * 0.4);
  if (index === total - 1) return "COMPLETED";
  if (index < pickupIndex) return "ENROUTE";
  if (index === pickupIndex) return "ARRIVE";
  return "POB";
};

/** Demo SSE payloads for a trip, one every intervalMs starting at startMs. */
export const buildDemoPoints = (
  tripID: string,
  startMs: number,
  intervalMs: number,
): DemoRawPoint[] => {
  const path = densify(DEMO_ROUTE);

  return path.map((position, index) => ({
    driverID: "DRIVER_DEMO",
    bookingID: "BOOKING_DEMO",
    tripID,
    tripType: "TRIP_S",
    driverStatus: statusAt(index, path.length),
    lat: Number(position.lat.toFixed(6)),
    lng: Number(position.lng.toFixed(6)),
    timestamp: new Date(startMs + index * intervalMs).toISOString(),
    sequence: index + 1,
  }));
};
