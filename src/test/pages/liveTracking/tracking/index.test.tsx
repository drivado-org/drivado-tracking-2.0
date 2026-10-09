import type { ReactNode } from "react";
import { act, render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { createAppStore } from "@/store";
import { trackingUpdate } from "@/store/tracking/trackingSlice";
import { trackingAction } from "@/server/sse/tracking-action";
import type { TrackingPayload } from "@/types/tracking";
import { TEST_TRIP_ID } from "@/pages/liveTracking/tracking/constants/tracking";
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
      <Tracking />
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

  it("shows the car at the location from redux and keeps it in view", () => {
    const { store } = renderPage();
    act(() => {
      store.dispatch(trackingUpdate(point()));
    });
    act(() => {
      store.dispatch(trackingUpdate(point({ lat: 22.5736 })));
    });

    const marker = screen.getByTestId("car-marker");
    expect(JSON.parse(marker.dataset.position!)).toEqual({
      lat: 22.5736,
      lng: 88.3639,
    });
    expect(fakeMap.panTo).toHaveBeenLastCalledWith({
      lat: 22.5736,
      lng: 88.3639,
    });
  });
});
