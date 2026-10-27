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
  renderHook(({ point }) => useCarAnimation(point ? [point] : []), {
    initialProps: { point: initial },
  });

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

/** Runs the animation for `ms` (frames every 16 ms). */
const run = (ms: number) =>
  act(() => {
    vi.advanceTimersByTime(ms);
  });

/** A car driving north ~11 m every second; point k is sent at k seconds. */
const northAt = (k: number) => at(22.57 + k * 0.0001, 88.4, k);

describe("useCarAnimation", () => {
  it("drives round a bend on the route instead of cutting the corner", () => {
    // ~103 m east, then north.
    const route = [
      { lat: 22.57, lng: 88.4 },
      { lat: 22.57, lng: 88.401 },
      { lat: 22.572, lng: 88.401 },
    ];
    // The first two points are either side of the bend: a straight line between them cuts it.
    const sent = [at(22.57, 88.4, 0), at(22.5703, 88.401, 3), at(22.5706, 88.401, 4)];
    const { result } = renderHook(() => useCarAnimation(sent, null, route));

    const drawn: { lat: number; lng: number }[] = [];
    for (let f = 0; f < 8000 / 16; f++) {
      run(16);
      if (result.current.position) drawn.push(result.current.position);
    }

    expect(drawn.some((p) => p.lng > 88.4005 && p.lng < 88.401)).toBe(true);
    for (const p of drawn) {
      const onEastLeg = Math.abs(p.lat - 22.57) < 1e-9;
      const onNorthLeg = Math.abs(p.lng - 88.401) < 1e-9;
      expect(onEastLeg || onNorthLeg).toBe(true);
    }
  });

  it("has no car before the first point", () => {
    const { result } = render(null);
    run(100);
    expect(result.current.position).toBeNull();
    expect(result.current.target).toBeNull();
  });

  it("places the car on the first point on the next frame", () => {
    const { result } = render(at(22.5726, 88.3639, 0));
    run(20);
    expect(result.current.position).toEqual({ lat: 22.5726, lng: 88.3639 });
  });

  it("drives smoothly: moves every frame, never stops or jumps while points keep coming", () => {
    const { result, rerender } = renderHook(({ points }) => useCarAnimation(points), {
      initialProps: { points: [northAt(0)] },
    });
    const sent = [northAt(0)];

    const lats: number[] = [];
    for (let k = 1; k <= 12; k++) {
      sent.push(northAt(k));
      rerender({ points: [...sent] });
      for (let f = 0; f < 1000 / 16; f++) {
        run(16);
        if (k > 4) lats.push(result.current.position!.lat);
      }
    }

    const steps = lats.slice(1).map((lat, i) => lat - lats[i]);
    // Always moving forward…
    expect(Math.min(...steps)).toBeGreaterThan(0);
    // …at an even speed: ~0.0001° per second is ~0.0000016° per frame. No jumps.
    expect(Math.max(...steps)).toBeLessThan(0.0001 * (16 / 1000) * 1.7);
  });

  it("keeps moving when a point arrives late", () => {
    const { result, rerender } = renderHook(({ points }) => useCarAnimation(points), {
      initialProps: { points: [northAt(0)] },
    });
    const sent = [northAt(0)];
    for (let k = 1; k <= 5; k++) {
      sent.push(northAt(k));
      rerender({ points: [...sent] });
      run(1000);
    }

    // Point 6 was due now; it is 600 ms late. The buffer (gap + 700 ms) keeps the car going.
    const lats: number[] = [];
    for (let f = 0; f < 600 / 16; f++) {
      run(16);
      lats.push(result.current.position!.lat);
    }
    const steps = lats.slice(1).map((lat, i) => lat - lats[i]);
    expect(Math.min(...steps)).toBeGreaterThan(0);
  });

  it("reaches the newest point when the points stop", () => {
    const { result, rerender } = render(at(22.5726, 88.3639, 0));
    rerender({ point: at(22.5728, 88.3639, 1) });
    run(6000);
    expect(result.current.position).toEqual({ lat: 22.5728, lng: 88.3639 });
  });

  it("drives off smoothly after a long stop instead of jumping", () => {
    const { result, rerender } = render(at(22.57, 88.4, 0));
    run(30_000);
    rerender({ point: at(22.5703, 88.4, 30) });

    let previous = result.current.position!.lat;
    let biggestStep = 0;
    for (let f = 0; f < 8000 / 16; f++) {
      run(16);
      const lat = result.current.position!.lat;
      biggestStep = Math.max(biggestStep, lat - previous);
      previous = lat;
    }
    expect(previous).toBeCloseTo(22.5703, 8);
    // 0.0003° over at least MAX_SEGMENT_MS (4 s) is under 0.0000012° per 16 ms frame at 1x.
    expect(biggestStep).toBeLessThan(0.0000012 * 1.7);
  });

  it("keeps the car still on GPS drift and spikes", () => {
    const { result, rerender } = render(at(22.5726, 88.3639, 0));
    rerender({ point: at(22.57261, 88.3639, 1) }); // ~1 m drift
    rerender({ point: at(22.5826, 88.3639, 2) }); // ~1.1 km spike
    run(6000);
    expect(result.current.position).toEqual({ lat: 22.5726, lng: 88.3639 });
    expect(result.current.target).toEqual(at(22.5726, 88.3639, 0));
  });

  it("faces the direction of travel while driving", () => {
    const { result, rerender } = render(at(22.5726, 88.3639, 0));
    rerender({ point: at(22.5726, 88.364, 1) }); // east
    run(3000);
    expect(result.current.heading).toBeCloseTo(90, 0);
  });

  it("clears the car when the points go away (new trip)", () => {
    const { result, rerender } = render(at(22.5726, 88.3639, 0));
    run(20);
    rerender({ point: null });
    expect(result.current.position).toBeNull();
    expect(result.current.target).toBeNull();
  });

  describe("bearing", () => {
    const renderWithBearing = (point: TrackPoint | null, bearing: number | null) =>
      renderHook(({ point, bearing }) => useCarAnimation(point ? [point] : [], bearing), {
        initialProps: { point, bearing },
      });

    it("turns a standing car to the backend bearing", () => {
      const { result, rerender } = renderWithBearing(at(22.5726, 88.3639, 0), null);
      run(20);
      expect(result.current.heading).toBe(0);

      rerender({ point: at(22.5726, 88.3639, 0), bearing: 90 });
      run(20);
      expect(result.current.heading).toBe(90);
    });

    it("turns the short way: 350° → 10° is +20°", () => {
      const { result, rerender } = renderWithBearing(at(22.5726, 88.3639, 0), 350);
      run(20);
      expect(result.current.heading).toBe(-10);

      rerender({ point: at(22.5726, 88.3639, 0), bearing: 10 });
      run(20);
      expect(result.current.heading).toBe(10);
    });

    it("faces the road while driving, even with an older bearing", () => {
      const { result, rerender } = renderWithBearing(at(22.5726, 88.3639, 0), 90);
      run(20);
      expect(result.current.heading).toBe(90);

      // Straight north.
      rerender({ point: at(22.5736, 88.3639, 5), bearing: 90 });
      run(3000);
      expect(result.current.heading).toBeCloseTo(0, 5);
    });
  });

  it("filters every new point when several arrive in one render", () => {
    const { result, rerender } = renderHook(({ points }) => useCarAnimation(points), {
      initialProps: { points: [at(22.5726, 88.3639, 0)] },
    });
    // Two points at once: a spike (≈ 11 km in 1 s) and a normal move after it.
    rerender({
      points: [at(22.5726, 88.3639, 0), at(22.6726, 88.3639, 1), at(22.5728, 88.3639, 2)],
    });

    expect(result.current.target).toEqual(at(22.5728, 88.3639, 2));
  });
});
