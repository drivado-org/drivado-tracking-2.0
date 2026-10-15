import type { TrackingPayload, TrackingState } from "@/types/tracking";
import { MAX_TRACK_POINTS } from "@/pages/liveTracking/tracking/constants/tracking";
import reducer, {
  selectDriverPoint,
  selectDriverPosition,
  startTracking,
  stopTracking,
  trackingConnected,
  trackingDisconnected,
  trackingError,
  trackingLocationUpdate,
  trackingStatusUpdate,
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
      points: [],
      driverStatus: null,
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

  it("trackingUpdate ignores a point older than the current one", () => {
    const current = reducer(initial, trackingUpdate(point()));
    const late = reducer(
      current,
      trackingUpdate(point({ lat: 1, timestamp: "2026-09-15T12:30:10.000Z" })),
    );
    expect(late.data).toEqual(point());
  });

  it("trackingUpdate accepts a point with the same timestamp", () => {
    const current = reducer(initial, trackingUpdate(point()));
    expect(reducer(current, trackingUpdate(point({ lat: 22.6 }))).data?.lat).toBe(22.6);
  });

  it("trackingLocationUpdate moves the car and keeps the trip ids", () => {
    const current = reducer(initial, trackingUpdate(point()));
    const moved = reducer(
      current,
      trackingLocationUpdate({ lat: 22.6, lng: 88.4, timestamp: "2026-09-15T12:30:16.000Z" }),
    );
    expect(moved.data).toEqual(
      point({ lat: 22.6, lng: 88.4, timestamp: "2026-09-15T12:30:16.000Z" }),
    );
    expect(moved).toMatchObject({ loading: false, connected: true, error: null });
  });

  it("trackingLocationUpdate ignores a point older than the current one", () => {
    const current = reducer(initial, trackingUpdate(point()));
    const late = reducer(
      current,
      trackingLocationUpdate({ lat: 1, lng: 1, timestamp: "2026-09-15T12:30:10.000Z" }),
    );
    expect(late.data).toEqual(point());
  });

  it("trackingLocationUpdate moves the car before any snapshot", () => {
    const location = { lat: 22.6, lng: 88.4, timestamp: "2026-09-15T12:30:16.000Z" };
    const state = reducer(initial, trackingLocationUpdate(location));
    expect(state.data).toBeNull();
    expect(state.points).toEqual([location]);
    expect(state).toMatchObject({ loading: false, connected: true });
  });

  it("keeps the newest points last and drops the oldest past the cap", () => {
    const at = (second: number) => ({
      lat: 22.5 + second / 10_000,
      lng: 88.4,
      timestamp: new Date(Date.UTC(2026, 9, 15, 7, 0, second)).toISOString(),
    });
    let state = initial;
    for (let second = 0; second < MAX_TRACK_POINTS + 5; second++) {
      state = reducer(state, trackingLocationUpdate(at(second)));
    }
    expect(state.points).toHaveLength(MAX_TRACK_POINTS);
    expect(state.points[0]).toEqual(at(5));
    expect(state.points.at(-1)).toEqual(at(MAX_TRACK_POINTS + 4));
    expect(selectDriverPoint({ tracking: state })).toEqual(at(MAX_TRACK_POINTS + 4));
  });

  it("does not add a late point to the track", () => {
    const current = reducer(initial, trackingUpdate(point()));
    const late = reducer(
      current,
      trackingLocationUpdate({ lat: 1, lng: 1, timestamp: "2026-09-15T12:30:10.000Z" }),
    );
    expect(late.points).toHaveLength(1);
  });

  it("trackingStatusUpdate keeps the status with or without a snapshot", () => {
    expect(reducer(initial, trackingStatusUpdate("POB")).driverStatus).toBe("POB");

    const withSnapshot = reducer(reducer(initial, trackingUpdate(point())), trackingStatusUpdate("POB"));
    expect(withSnapshot.driverStatus).toBe("POB");
    expect(withSnapshot.data?.driverStatus).toBe("POB");
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
