import { act, renderHook } from "@testing-library/react";
import useShownStatus from "@/pages/liveTracking/tracking/hooks/useShownStatus";
import { ARRIVAL_MAX_WAIT_MS } from "@/pages/liveTracking/tracking/constants/tracking";
import type { LatLng } from "@/types/geo";
import type { DriverStatus } from "@/types/tracking";

const END: LatLng = { lat: 22.58, lng: 88.45 };
const FAR: LatLng = { lat: 22.57, lng: 88.43 };

type Props = { status: DriverStatus | null; car: LatLng | null };

const setup = (initial: Props) =>
  renderHook(({ status, car }: Props) => useShownStatus(status, car, END), {
    initialProps: initial,
  });

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("useShownStatus", () => {
  it("shows a driving status at once", () => {
    const { result, rerender } = setup({ status: null, car: FAR });
    rerender({ status: "ENROUTE", car: FAR });
    expect(result.current).toBe("ENROUTE");
    rerender({ status: "POB", car: FAR });
    expect(result.current).toBe("POB");
  });

  it("holds ARRIVED until the drawn car reaches the end of the route", () => {
    const { result, rerender } = setup({ status: "ENROUTE", car: FAR });
    rerender({ status: "ARRIVED", car: FAR });
    expect(result.current).toBe("ENROUTE");

    rerender({ status: "ARRIVED", car: { lat: END.lat + 0.0001, lng: END.lng } });
    expect(result.current).toBe("ARRIVED");
  });

  it("shows COMPLETED after the max wait if the car never gets there", () => {
    const { result, rerender } = setup({ status: "POB", car: FAR });
    rerender({ status: "COMPLETED", car: FAR });
    expect(result.current).toBe("POB");

    act(() => {
      vi.advanceTimersByTime(ARRIVAL_MAX_WAIT_MS);
    });
    expect(result.current).toBe("COMPLETED");
  });
});
