import type { TrackingPayload, TrackingState } from "@/types/tracking";
import reducer, {
  selectDriverPosition,
  startTracking,
  stopTracking,
  trackingConnected,
  trackingDisconnected,
  trackingError,
  trackingUpdate,
} from "@/store/tracking/trackingSlice";

const initial: TrackingState = reducer(undefined, { type: "@@INIT" });

const point = (overrides: Partial<TrackingPayload> = {}): TrackingPayload => ({
  driverID: "DRIVER_123",
  bookingID: "B1",
  tripID: "T123",
  tripType: "TRIP_S",
  driverStatus: "ENROUTE",
  lat: 22.5726,
  lng: 88.3639,
  timestamp: "2026-09-15T12:30:15.000Z",
  sequence: null,
  ...overrides,
});

describe("trackingSlice reducers", () => {
  it("starts empty", () => {
    expect(initial).toEqual({
      data: null,
      loading: false,
      connected: false,
      error: null,
    });
  });

  it("startTracking clears the previous trip and sets loading", () => {
    const withData = reducer(
      { ...initial, error: "old" },
      trackingUpdate(point()),
    );
    expect(reducer(withData, startTracking({ tripID: "T999" }))).toEqual({
      ...initial,
      loading: true,
    });
  });

  it("trackingConnected marks the stream connected", () => {
    expect(
      reducer({ ...initial, loading: true }, trackingConnected()),
    ).toMatchObject({
      loading: false,
      connected: true,
      error: null,
    });
  });

  it("trackingUpdate stores the latest location", () => {
    const first = reducer(initial, trackingUpdate(point()));
    const second = reducer(first, trackingUpdate(point({ lat: 22.58 })));
    expect(second.data).toEqual(point({ lat: 22.58 }));
    expect(second).toMatchObject({
      loading: false,
      connected: true,
      error: null,
    });
  });

  it("trackingDisconnected keeps the last location", () => {
    const state = reducer(
      reducer(initial, trackingUpdate(point())),
      trackingDisconnected(),
    );
    expect(state).toMatchObject({
      connected: false,
      loading: false,
      data: point(),
    });
  });

  it("trackingError stores the message and keeps the last location", () => {
    const state = reducer(
      reducer(initial, trackingUpdate(point())),
      trackingError("boom"),
    );
    expect(state).toMatchObject({
      connected: false,
      loading: false,
      error: "boom",
      data: point(),
    });
  });

  it("stopTracking stops loading and connection", () => {
    const state = reducer(
      { ...initial, loading: true, connected: true },
      stopTracking(),
    );
    expect(state).toMatchObject({ connected: false, loading: false });
  });
});

describe("selectDriverPosition", () => {
  it("is null without data", () => {
    expect(selectDriverPosition({ tracking: initial })).toBeNull();
  });

  it("returns lat/lng of the latest location", () => {
    const tracking = reducer(initial, trackingUpdate(point()));
    expect(selectDriverPosition({ tracking })).toEqual({
      lat: 22.5726,
      lng: 88.3639,
    });
  });

  it("returns the same object while the location is unchanged", () => {
    const state = { tracking: reducer(initial, trackingUpdate(point())) };
    expect(selectDriverPosition(state)).toBe(selectDriverPosition(state));
  });
});
