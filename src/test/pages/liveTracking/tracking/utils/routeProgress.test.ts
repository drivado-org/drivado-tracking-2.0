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

  it("returns the whole route before the first car position", () => {
    expect(remainingRoute(PATH, null)).toEqual({ points: PATH, segmentIndex: 0 });
  });

  it("returns the route from fromIndex when the car is off it", () => {
    // ~110 m north of the route.
    expect(remainingRoute(PATH, { lat: 22.571, lng: 88.4015 })).toEqual({
      points: PATH,
      segmentIndex: 0,
    });
    expect(remainingRoute(PATH, { lat: 22.571, lng: 88.4015 }, 2)).toEqual({
      points: PATH.slice(2),
      segmentIndex: 2,
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
    expect(remainingRoute(PATH, null, 99)).toEqual({ points: PATH.slice(2), segmentIndex: 2 });
  });
});
