import {
  alongRoute,
  matchToRoute,
  pointAtMeters,
  remainingRoute,
  routeLengths,
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

// An L: ~103 m east, then ~111 m north.
const BEND = [
  { lat: 22.57, lng: 88.4 },
  { lat: 22.57, lng: 88.401 },
  { lat: 22.571, lng: 88.401 },
];

describe("routeLengths / pointAtMeters", () => {
  const lengths = routeLengths(BEND);

  it("adds up the segments", () => {
    expect(lengths[0]).toBe(0);
    expect(lengths[1]).toBeCloseTo(103, 0);
    expect(lengths[2]).toBeCloseTo(103 + 111, 0);
  });

  it("finds the point along the road, round the bend", () => {
    expect(pointAtMeters(BEND, lengths, lengths[1] / 2)).toEqual({ lat: 22.57, lng: 88.4005 });
    const past = pointAtMeters(BEND, lengths, lengths[1] + 55.5);
    expect(past.lng).toBeCloseTo(88.401, 6);
    expect(past.lat).toBeCloseTo(22.5705, 4);
  });

  it("stops at the end and runs back along the first segment before the start", () => {
    expect(pointAtMeters(BEND, lengths, 0)).toBe(BEND[0]);
    expect(pointAtMeters(BEND, lengths, 1e6)).toBe(BEND[2]);
    const before = pointAtMeters(BEND, lengths, -lengths[1] / 2);
    expect(before.lat).toBeCloseTo(22.57, 9);
    expect(before.lng).toBeCloseTo(88.3995, 9);
  });
});

describe("alongRoute", () => {
  it("measures each point along the road, never going back", () => {
    const along = alongRoute(BEND, [
      { lat: 22.5701, lng: 88.4005 },
      { lat: 22.5705, lng: 88.4011 },
      { lat: 22.5702, lng: 88.4011 }, // a noisy point back down the road
    ]);
    expect(along[0]).toBeCloseTo(51.5, 0);
    expect(along[1]).toBeGreaterThan(150);
    expect(along[2]).toBe(along[1]);
  });

  it("counts back from the start for points just before it (a new route ahead of the car)", () => {
    const along = alongRoute(BEND, [
      { lat: 22.57, lng: 88.3997 },
      { lat: 22.57, lng: 88.3999 },
      { lat: 22.57, lng: 88.4002 },
    ]);
    expect(along[0]).toBeCloseTo(-31, 0);
    expect(along[1]).toBeCloseTo(-10.3, 0);
    expect(along[2]).toBeCloseTo(20.6, 0);
  });

  it("has no distance for a point off the route", () => {
    expect(alongRoute(BEND, [{ lat: 22.58, lng: 88.4 }])).toEqual([null]);
  });
});

describe("remainingRoute before a new route's start", () => {
  it("keeps the car where it is and runs the line from it to the start", () => {
    const car = { lat: 22.57, lng: 88.3998 }; // ~20 m before PATH[0], on the same road
    const rest = remainingRoute(PATH, car);
    expect(rest.snapped).toBe(car);
    expect(rest.points).toEqual([car, ...PATH]);
    expect(rest.segmentIndex).toBe(0);
  });
});
