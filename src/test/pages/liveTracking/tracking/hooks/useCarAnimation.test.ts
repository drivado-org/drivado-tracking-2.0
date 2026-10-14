import { act, renderHook } from "@testing-library/react";
import useCarAnimation from "@/pages/liveTracking/tracking/hooks/useCarAnimation";
import type { TrackPoint } from "@/types/geo";

const T0 = Date.parse("2026-09-15T12:30:00.000Z");

const at = (lat: number, lng: number, seconds: number): TrackPoint => ({
  lat,
  lng,
  timestamp: new Date(T0 + seconds * 1000).toISOString(),
});

const render = (initial: TrackPoint | null) =>
  renderHook(({ point }) => useCarAnimation(point), {
    initialProps: { point: initial },
  });

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("useCarAnimation", () => {
  it("has no car before the first point", () => {
    const { result } = render(null);
    expect(result.current.position).toBeNull();
    expect(result.current.target).toBeNull();
  });

  it("places the car on the first point without animating", () => {
    const { result } = render(at(22.5726, 88.3639, 0));
    expect(result.current.position).toEqual({ lat: 22.5726, lng: 88.3639 });
  });

  it("glides from the previous point to the new one over the time between them", () => {
    const { result, rerender } = render(at(22.5726, 88.3639, 0));
    rerender({ point: at(22.5728, 88.3639, 1) });

    // The target updates at once (the map pans there); the car is still at the start.
    expect(result.current.target).toEqual(at(22.5728, 88.3639, 1));
    expect(result.current.position).toEqual({ lat: 22.5726, lng: 88.3639 });

    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(result.current.position!.lat).toBeGreaterThan(22.5726);
    expect(result.current.position!.lat).toBeLessThan(22.5728);

    act(() => {
      vi.advanceTimersByTime(600);
    });
    expect(result.current.position).toEqual({ lat: 22.5728, lng: 88.3639 });
  });

  it("starts the next glide from where the car is drawn, so it never jumps back", () => {
    const { result, rerender } = render(at(22.5726, 88.3639, 0));
    rerender({ point: at(22.5728, 88.3639, 1) });
    act(() => {
      vi.advanceTimersByTime(500);
    });
    const midway = result.current.position!.lat;

    rerender({ point: at(22.573, 88.3639, 2) });
    act(() => {
      vi.advanceTimersByTime(20);
    });
    expect(result.current.position!.lat).toBeGreaterThanOrEqual(midway);
  });

  it("keeps the car still on GPS drift and spikes", () => {
    const { result, rerender } = render(at(22.5726, 88.3639, 0));
    rerender({ point: at(22.57261, 88.3639, 1) }); // ~1 m drift
    rerender({ point: at(22.5826, 88.3639, 2) }); // ~1.1 km spike
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(result.current.position).toEqual({ lat: 22.5726, lng: 88.3639 });
    expect(result.current.target).toEqual(at(22.5726, 88.3639, 0));
  });

  it("faces the direction of travel", () => {
    const { result, rerender } = render(at(22.5726, 88.3639, 0));
    rerender({ point: at(22.5726, 88.364, 1) }); // east
    expect(result.current.heading).toBeCloseTo(90, 0);
  });

  it("clears the car when the point goes away (new trip)", () => {
    const { result, rerender } = render(at(22.5726, 88.3639, 0));
    rerender({ point: null });
    expect(result.current.position).toBeNull();
    expect(result.current.target).toBeNull();
  });
});
