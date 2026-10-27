import { renderHook } from "@testing-library/react";
import useGeofence from "@/pages/liveTracking/tracking/hooks/useGeofence";
import type { LatLng } from "@/types/geo";

const CENTER: LatLng = { lat: 22.58, lng: 88.45 };
// 0.0001° of latitude ≈ 11 m.
const north = (meters: number): LatLng => ({
  lat: CENTER.lat + (meters / 11.1) * 0.0001,
  lng: CENTER.lng,
});

type Props = { car: LatLng | null; center: LatLng | null };

const setup = (initial: Props) =>
  renderHook(({ car, center }: Props) => useGeofence(car, center), {
    initialProps: initial,
  });

describe("useGeofence", () => {
  it("is outside without a car or a center", () => {
    expect(setup({ car: null, center: CENTER }).result.current).toBe(false);
    expect(setup({ car: CENTER, center: null }).result.current).toBe(false);
  });

  it("enters within the radius", () => {
    const { result, rerender } = setup({ car: north(300), center: CENTER });
    expect(result.current).toBe(false);

    rerender({ car: north(90), center: CENTER });
    expect(result.current).toBe(true);
  });

  it("leaves only past the exit margin", () => {
    const { result, rerender } = setup({ car: north(50), center: CENTER });
    expect(result.current).toBe(true);

    rerender({ car: north(108), center: CENTER });
    expect(result.current).toBe(true);

    rerender({ car: north(130), center: CENTER });
    expect(result.current).toBe(false);

    // Back at the same spot from outside: the plain radius applies again.
    rerender({ car: north(108), center: CENTER });
    expect(result.current).toBe(false);
  });

  it("takes a wider radius for the approach zone", () => {
    const { result } = renderHook(() => useGeofence(north(250), CENTER, 300));
    expect(result.current).toBe(true);
  });

  it("is outside when the center goes away", () => {
    const { result, rerender } = setup({ car: north(50), center: CENTER });
    rerender({ car: north(50), center: null });
    expect(result.current).toBe(false);
  });
});
