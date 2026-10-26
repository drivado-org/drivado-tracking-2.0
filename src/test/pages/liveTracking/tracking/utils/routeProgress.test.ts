import {
  matchToRoute,
  remainingRoute,
} from "@/pages/liveTracking/tracking/utils/routeProgress";

// Straight east along one latitude: ~103 m per 0.001° lng at 22.57°N.
const PATH = [
  { lat: 22.57, lng: 88.4 },
  { lat: 22.57, lng: 88.401 },
  { lat: 22.57, lng: 88.402 },
  { lat: 22.57, lng: 88.403 },
];

describe("matchToRoute", () => {
  it("projects the car onto the nearest segment", () => {
    const match = matchToRoute(PATH, { lat: 22.5701, lng: 88.4015 })!;
    expect(match.segmentIndex).toBe(1);
    expect(match.point.lat).toBeCloseTo(22.57, 6);
    expect(match.point.lng).toBeCloseTo(88.4015, 6);
    expect(match.distanceMeters).toBeCloseTo(11, 0);
  });

  it("measures how far along the route the car is, from the route's start", () => {
    expect(matchToRoute(PATH, { lat: 22.5701, lng: 88.4015 })!.alongMeters).toBeCloseTo(154, 0);
    // Searching from a later segment still counts from the start.
    expect(matchToRoute(PATH, { lat: 22.57, lng: 88.4025 }, 2)!.alongMeters).toBeCloseTo(257, 0);
  });

  it("matches the last segment when the car is past the route's end", () => {
    expect(matchToRoute(PATH, { lat: 22.57, lng: 88.404 })!.segmentIndex).toBe(2);
  });

  it("returns null for a route under 2 points", () => {
    expect(matchToRoute([PATH[0]], PATH[0])).toBeNull();
  });

  it("keeps the leg not driven yet when the route comes back on the same road", () => {
    const outAndBack = [
      { lat: 22.57, lng: 88.4 },
      { lat: 22.57, lng: 88.402 },
      { lat: 22.57, lng: 88.4 },
    ];
    expect(matchToRoute(outAndBack, { lat: 22.57, lng: 88.401 })!.segmentIndex).toBe(0);
  });
});

describe("remainingRoute", () => {
  it("starts the route at the car and drops what is behind it", () => {
    const { points, segmentIndex } = remainingRoute(PATH, { lat: 22.57, lng: 88.4015 });
    expect(segmentIndex).toBe(1);
    expect(points).toHaveLength(3);
    expect(points[0].lng).toBeCloseTo(88.4015, 6);
    expect(points.slice(1)).toEqual(PATH.slice(2));
  });

  it("moves the car onto the route when it is near it", () => {
    // ~11 m north of the route: GPS noise beside the road.
    const { points, snapped } = remainingRoute(PATH, { lat: 22.5701, lng: 88.4015 });
    expect(snapped).toBe(points[0]);
    expect(snapped!.lat).toBeCloseTo(22.57, 6);
    expect(snapped!.lng).toBeCloseTo(88.4015, 6);
  });

  it("returns the whole route before the first car position", () => {
    expect(remainingRoute(PATH, null)).toEqual({ points: PATH, segmentIndex: 0, snapped: null });
  });

  it("returns the route from fromIndex when the car is off it", () => {
    // ~110 m north of the route.
    expect(remainingRoute(PATH, { lat: 22.571, lng: 88.4015 })).toEqual({
      points: PATH,
      segmentIndex: 0,
      snapped: null,
    });
    expect(remainingRoute(PATH, { lat: 22.571, lng: 88.4015 }, 2)).toEqual({
      points: PATH.slice(2),
      segmentIndex: 2,
      snapped: null,
    });
  });

  it("never brings back segments already driven", () => {
    // The car is back near the start, but segment 2 was already reached.
    const { points, segmentIndex } = remainingRoute(PATH, { lat: 22.57, lng: 88.4002 }, 2);
    expect(segmentIndex).toBe(2);
    expect(points[0].lng).toBeCloseTo(88.402, 6);
    expect(points.at(-1)).toEqual(PATH[3]);
  });

  it("keeps the last segment when fromIndex is past the end", () => {
    expect(remainingRoute(PATH, null, 99)).toEqual({
      points: PATH.slice(2),
      segmentIndex: 2,
      snapped: null,
    });
  });
});
