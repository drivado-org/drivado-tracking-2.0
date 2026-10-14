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

const fakeMap = { panTo: vi.fn() };

vi.mock("@vis.gl/react-google-maps", () => ({
  APIProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
  Map: ({ children }: { children?: ReactNode }) => (
    <div data-testid="google-map">{children}</div>
  ),
  useMap: () => fakeMap,
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

  it("glides the car to the new location from redux and keeps it in view", () => {
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

    // The map pans to the new point at once; the car animates there.
    expect(fakeMap.panTo).toHaveBeenLastCalledWith({
      lat: 22.5736,
      lng: 88.3639,
    });

    act(() => {
      vi.advanceTimersByTime(2100);
    });
    const marker = screen.getByTestId("car-marker");
    expect(JSON.parse(marker.dataset.position!)).toEqual({
      lat: 22.5736,
      lng: 88.3639,
    });
    vi.useRealTimers();
  });

  it("ignores a GPS spike", () => {
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

    const marker = screen.getByTestId("car-marker");
    expect(JSON.parse(marker.dataset.position!)).toEqual({
      lat: 22.5726,
      lng: 88.3639,
    });
  });
});
