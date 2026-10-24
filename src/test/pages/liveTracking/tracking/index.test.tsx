import type { ReactNode } from "react";
import { act, render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { createAppStore } from "@/store";
import { trackingUpdate } from "@/store/tracking/trackingSlice";
import { trackingAction } from "@/server/sse/tracking-action";
import type { TrackingPayload } from "@/types/tracking";
const TEST_TRIP_ID = "D101S";
import Tracking from "@/pages/liveTracking/tracking";

vi.mock("@/config/env", () => ({
  env: { googleMapsApiKey: "test-key", googleMapsMapId: null },
}));

// Never resolves: the tests drive redux directly.
vi.mock("@/server/sse/tracking-action", () => ({
  trackingAction: vi.fn(() => new Promise(() => {})),
}));

const fakeMap = {
  center: { lat: 0, lng: 0 },
  getCenter: () => ({ lat: () => fakeMap.center.lat, lng: () => fakeMap.center.lng }),
  // Plain functions: restoreMocks in vitest.config would wipe a vi.fn implementation.
  moveCamera: (options: { center: { lat: number; lng: number } }) => {
    fakeMap.center = { ...options.center };
  },
  addListener: () => ({ remove: () => {} }),
};

vi.mock("@vis.gl/react-google-maps", () => ({
  APIProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
  Map: ({ children }: { children?: ReactNode }) => (
    <div data-testid="google-map">{children}</div>
  ),
  useMap: () => fakeMap,
  useMapsLibrary: () => null,
  AdvancedMarker: (props: { position: unknown; children?: ReactNode }) => (
    <div
      data-testid="car-marker"
      data-position={JSON.stringify(props.position)}
    >
      {props.children}
    </div>
  ),
  AdvancedMarkerAnchorPoint: { CENTER: ["-50%", "-50%"] },
  RenderingType: { VECTOR: "VECTOR" },
}));

const point = (overrides: Partial<TrackingPayload> = {}): TrackingPayload => ({
  driverID: "DRIVER_123",
  bookingID: "B1",
  tripID: TEST_TRIP_ID,
  tripType: "TRIP_S",
  driverStatus: "ENROUTE",
  lat: 22.5726,
  lng: 88.3639,
  timestamp: "2026-09-15T12:30:15.000Z",
  sequence: null,
  ...overrides,
});

const renderPage = () => {
  const store = createAppStore();
  const utils = render(
    <Provider store={store}>
      <Tracking tripId={TEST_TRIP_ID} />
    </Provider>,
  );
  return { store, ...utils };
};

describe("Tracking page", () => {
  it("renders the google map", () => {
    renderPage();
    expect(screen.getByTestId("google-map")).toBeInTheDocument();
  });

  it("starts the live stream for the trip", () => {
    renderPage();
    expect(trackingAction).toHaveBeenCalledWith(
      { tripID: TEST_TRIP_ID },
      expect.any(AbortSignal),
    );
  });

  it("stops tracking on unmount", () => {
    const { unmount } = renderPage();
    const signal = vi.mocked(trackingAction).mock.lastCall?.[1] as AbortSignal;
    unmount();
    expect(signal.aborted).toBe(true);
  });

  it("shows no car before the first location", () => {
    renderPage();
    expect(screen.queryByTestId("car-marker")).not.toBeInTheDocument();
  });

  it("drives the car to the new location from redux and keeps it in view", () => {
    vi.useFakeTimers();
    const { store } = renderPage();
    act(() => {
      store.dispatch(trackingUpdate(point()));
    });
    act(() => {
      store.dispatch(
        trackingUpdate(
          point({ lat: 22.5736, timestamp: "2026-09-15T12:30:30.000Z" }),
        ),
      );
    });

    act(() => {
      vi.advanceTimersByTime(8000);
    });
    const marker = screen.getByTestId("car-marker");
    expect(JSON.parse(marker.dataset.position!)).toEqual({
      lat: 22.5736,
      lng: 88.3639,
    });
    // The camera follows the car. React applies renders when act() ends, so give the
    // camera loop frames after the car's final position has rendered.
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(fakeMap.center.lat).toBeCloseTo(22.5736, 6);
    vi.useRealTimers();
  });

  it("ignores a GPS spike", () => {
    vi.useFakeTimers();
    const { store } = renderPage();
    act(() => {
      store.dispatch(trackingUpdate(point()));
    });
    act(() => {
      // ~11 km in one second.
      store.dispatch(
        trackingUpdate(
          point({ lat: 22.6726, timestamp: "2026-09-15T12:30:16.000Z" }),
        ),
      );
    });
    act(() => {
      vi.advanceTimersByTime(5000);
    });

    const marker = screen.getByTestId("car-marker");
    expect(JSON.parse(marker.dataset.position!)).toEqual({
      lat: 22.5726,
      lng: 88.3639,
    });
    vi.useRealTimers();
  });
});
