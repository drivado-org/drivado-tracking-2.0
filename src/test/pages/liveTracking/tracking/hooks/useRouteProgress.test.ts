import { renderHook } from "@testing-library/react";
import useRouteProgress from "@/pages/liveTracking/tracking/hooks/useRouteProgress";
import type { LatLng } from "@/types/geo";

// Straight east along one latitude: ~103 m per 0.001° lng at 22.57°N.
const PATH = [
  { lat: 22.57, lng: 88.4 },
  { lat: 22.57, lng: 88.401 },
  { lat: 22.57, lng: 88.402 },
  { lat: 22.57, lng: 88.403 },
];

const render = (path: LatLng[] | null, position: LatLng | null) =>
  renderHook(({ path, position }) => useRouteProgress(path, position), {
    initialProps: { path, position },
  });

describe("useRouteProgress", () => {
  it("draws the car on the route and the route from the car", () => {
    // ~11 m north of the route: GPS noise beside the road.
    const { result } = render(PATH, { lat: 22.5701, lng: 88.4015 });
    const { carPosition, remaining } = result.current;

    expect(carPosition!.lat).toBeCloseTo(22.57, 6);
    expect(carPosition!.lng).toBeCloseTo(88.4015, 6);
    expect(remaining[0]).toBe(carPosition);
    expect(remaining.slice(1)).toEqual(PATH.slice(2));
  });

  it("faces along the route segment the car is on", () => {
    // Raw points beside the road would give any direction; the road goes east.
    const { result } = render(PATH, { lat: 22.5701, lng: 88.4015 });
    expect(result.current.routeHeading).toBeCloseTo(90, 0);
  });

  it("has no route heading off the route or on a zero-length segment", () => {
    expect(render(PATH, { lat: 22.571, lng: 88.4015 }).result.current.routeHeading).toBeNull();

    // A route ending on a repeated point: at the end the car is on the zero-length segment.
    const repeated = [PATH[0], PATH[1], PATH[1]];
    expect(render(repeated, PATH[1]).result.current.routeHeading).toBeNull();
  });

  it("keeps the raw position off the route and draws the route whole", () => {
    const offRoute = { lat: 22.571, lng: 88.4015 };
    const { result } = render(PATH, offRoute);

    expect(result.current.carPosition).toBe(offRoute);
    expect(result.current.remaining).toEqual(PATH);
  });

  it("keeps the line from where the car left the route through a GPS jump", () => {
    const onRoute = { lat: 22.57, lng: 88.4015 };
    const { result, rerender } = render(PATH, onRoute);
    const before = result.current.remaining;

    rerender({ path: PATH, position: { lat: 22.571, lng: 88.4016 } });
    expect(result.current.remaining).toEqual(before);
  });

  it("passes the position through without a route", () => {
    const position = { lat: 22.57, lng: 88.4015 };
    const { result } = render(null, position);

    expect(result.current.carPosition).toBe(position);
    expect(result.current.remaining).toEqual([]);
  });

  it("never brings back segments already driven", () => {
    const { result, rerender } = render(PATH, { lat: 22.57, lng: 88.4025 });
    // A noisy point back near the start: the line still starts where the car was.
    rerender({ path: PATH, position: { lat: 22.57, lng: 88.4002 } });

    expect(result.current.remaining[0].lng).toBeCloseTo(88.4025, 6);
    expect(result.current.remaining.at(-1)).toEqual(PATH[3]);
  });

  it("starts a new route from its first segment", () => {
    const { result, rerender } = render(PATH, { lat: 22.57, lng: 88.4025 });
    const newRoute = [...PATH];
    rerender({ path: newRoute, position: { lat: 22.57, lng: 88.4005 } });

    expect(result.current.remaining).toHaveLength(4);
    expect(result.current.remaining[0].lng).toBeCloseTo(88.4005, 6);
  });
});
