import {
  applyPoint,
  bearingDegrees,
  distanceMeters,
  EMPTY_TRACK,
  turnTowards,
  type CarTrack,
} from "@/pages/liveTracking/tracking/utils/locationFilter";
import type { TrackPoint } from "@/types/geo";

const T0 = Date.parse("2026-09-15T12:30:00.000Z");

/** 0.0001° of latitude is ~11 m. */
const at = (lat: number, lng: number, seconds: number): TrackPoint => ({
  lat,
  lng,
  timestamp: new Date(T0 + seconds * 1000).toISOString(),
});

const START = at(22.5726, 88.3639, 0);
const started: CarTrack = { ...EMPTY_TRACK, current: START };

describe("distanceMeters / bearingDegrees", () => {
  it("measures ~11 m for 0.0001° of latitude", () => {
    expect(distanceMeters(START, at(22.5727, 88.3639, 1))).toBeCloseTo(11.1, 0);
  });

  it("points north (0°) and east (~90°)", () => {
    expect(bearingDegrees(START, at(22.5727, 88.3639, 1))).toBeCloseTo(0, 5);
    expect(bearingDegrees(START, at(22.5726, 88.364, 1))).toBeCloseTo(90, 0);
  });
});

describe("turnTowards", () => {
  it("turns the short way across north", () => {
    expect(turnTowards(350, 10)).toBe(370);
    expect(turnTowards(10, -10)).toBe(-10);
  });

  it("keeps counting past a full circle", () => {
    expect(turnTowards(720, 10)).toBe(730);
  });
});

describe("applyPoint", () => {
  it("accepts the first point as is", () => {
    expect(applyPoint(EMPTY_TRACK, START)).toEqual(started);
  });

  it("moves previous to current on a normal move", () => {
    const next = at(22.5727, 88.3639, 1);
    expect(applyPoint(started, next)).toEqual({
      previous: START,
      current: next,
      rejectedInARow: 0,
      route: null,
    });
  });

  it("ignores a duplicate or older point", () => {
    expect(applyPoint(started, at(22.5727, 88.3639, 0))).toBe(started);
    expect(applyPoint(started, at(22.5727, 88.3639, -1))).toBe(started);
  });

  it("ignores drift under 8 m while parked", () => {
    expect(applyPoint(started, at(22.57265, 88.3639, 1))).toBe(started); // ~5.5 m
  });

  it("accepts a slow crawl once it adds up to 8 m from the last accepted point", () => {
    let track = applyPoint(started, at(22.57263, 88.3639, 1)); // ~3.3 m
    track = applyPoint(track, at(22.57266, 88.3639, 2)); // ~6.6 m
    expect(track.current).toBe(START);
    track = applyPoint(track, at(22.57268, 88.3639, 3)); // ~8.9 m
    expect(track.current).toEqual(at(22.57268, 88.3639, 3));
  });

  it("rejects a spike faster than ~200 km/h and keeps the car where it was", () => {
    const track = applyPoint(started, at(22.5826, 88.3639, 1)); // ~1.1 km in 1 s
    expect(track.current).toBe(START);
    expect(track.rejectedInARow).toBe(1);
  });

  it("accepts a long jump when enough time passed (reconnect after a gap)", () => {
    const later = at(22.5826, 88.3639, 120); // ~1.1 km in 2 min
    expect(applyPoint(started, later).current).toBe(later);
  });

  it("trusts the new position after 3 spikes in a row", () => {
    let track = started;
    for (let s = 1; s <= 3; s += 1) track = applyPoint(track, at(22.5826, 88.3639, s));
    expect(track.current).toBe(START);

    const fourth = at(22.5826, 88.3639, 4);
    track = applyPoint(track, fourth);
    expect(track.current).toBe(fourth);
    expect(track.rejectedInARow).toBe(0);
  });
});

describe("applyPoint on a route", () => {
  // Straight north from START: ~11 m per 0.0001° of latitude, ~1.1 km long.
  const ROUTE = [0, 0.0025, 0.005, 0.0075, 0.01].map((d) => ({
    lat: 22.5726 + d,
    lng: 88.3639,
  }));
  /** `meters` north of START along the route, `side` meters east of it, at `seconds`. */
  const onRoute = (meters: number, seconds: number, side = 0) =>
    at(22.5726 + meters / 111_000, 88.3639 + side / 102_800, seconds);

  const drive = (...points: TrackPoint[]) =>
    points.reduce((track, point) => applyPoint(track, point, ROUTE), EMPTY_TRACK);

  it("remembers how far along the route the car is", () => {
    const track = drive(onRoute(0, 0), onRoute(300, 30, 5));
    expect(track.route!.alongMeters).toBeCloseTo(300, -1);
    expect(track.route!.segmentIndex).toBe(1);
  });

  it("rejects a point that goes back along the route", () => {
    const track = drive(onRoute(0, 0), onRoute(300, 30), onRoute(250, 31));
    expect(track.current).toEqual(onRoute(300, 30));
    expect(track.rejectedInARow).toBe(1);
  });

  it("accepts a small wobble back along the route", () => {
    const track = drive(onRoute(0, 0), onRoute(300, 30), onRoute(290, 31, 6));
    expect(track.current).toEqual(onRoute(290, 31, 6));
  });

  it("trusts the car going back after 3 rejected points in a row (U-turn)", () => {
    const track = drive(
      onRoute(0, 0),
      onRoute(300, 30),
      onRoute(260, 34),
      onRoute(230, 37),
      onRoute(200, 40),
      onRoute(170, 43),
    );
    expect(track.current).toEqual(onRoute(170, 43));
    expect(track.rejectedInARow).toBe(0);
  });

  it("rejects a blip off the route and keeps going after it", () => {
    let track = drive(onRoute(0, 0), onRoute(300, 30));
    track = applyPoint(track, onRoute(310, 31, 80), ROUTE);
    expect(track.current).toEqual(onRoute(300, 30));

    track = applyPoint(track, onRoute(320, 32), ROUTE);
    expect(track.current).toEqual(onRoute(320, 32));
    expect(track.rejectedInARow).toBe(0);
  });

  it("trusts the car leaving the route after 3 off-route points in a row", () => {
    const track = drive(
      onRoute(0, 0),
      onRoute(300, 30),
      onRoute(300, 33, 70),
      onRoute(300, 36, 100),
      onRoute(300, 39, 130),
      onRoute(300, 42, 160),
    );
    expect(track.current).toEqual(onRoute(300, 42, 160));
    expect(track.route).toBeNull();
  });

  it("does not compare points on a new route with the old one", () => {
    const newRoute = [...ROUTE].reverse();
    let track = drive(onRoute(0, 0), onRoute(300, 30));
    // Far along the old route, near the start of the new one: not "going back".
    track = applyPoint(track, onRoute(250, 31), newRoute);
    expect(track.current).toEqual(onRoute(250, 31));
    expect(track.route!.path).toBe(newRoute);
  });
});
