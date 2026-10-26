import {
  createSelector,
  createSlice,
  type PayloadAction,
} from "@reduxjs/toolkit";
import { MAX_TRACK_POINTS } from "@/pages/liveTracking/tracking/constants/tracking";
import type { TrackPoint } from "@/types/geo";
import { isStepBack } from "@/utils/tripStatus";
import type {
  DriverStatus,
  LocationUpdate,
  TrackingActionPayload,
  TrackingPayload,
  TrackingState,
} from "@/types/tracking";

const initialState: TrackingState = {
  data: null,

  points: [],

  driverStatus: null,

  loading: false,

  connected: false,

  error: null,
};

/**
 * Adds a point at the end (newest last) and drops the oldest past MAX_TRACK_POINTS.
 * A point older than the newest one is a late delivery and would move the car backwards: skipped.
 * Returns whether the point was added.
 */
const pushPoint = (state: TrackingState, point: TrackPoint): boolean => {
  const newest = state.points.at(-1);
  if (newest && Date.parse(point.timestamp) < Date.parse(newest.timestamp)) return false;

  state.points.push(point);
  if (state.points.length > MAX_TRACK_POINTS) {
    state.points.splice(0, state.points.length - MAX_TRACK_POINTS);
  }
  return true;
};

/** Keeps the newest status; a late event can't move the trip back a step. */
const setStatus = (state: TrackingState, status: DriverStatus) => {
  if (isStepBack(status, state.driverStatus)) return;
  state.driverStatus = status;
  if (state.data) state.data.driverStatus = status;
};

const markLive = (state: TrackingState) => {
  state.loading = false;
  state.connected = true;
  state.error = null;
};

const trackingSlice = createSlice({
  name: "tracking",

  initialState,

  reducers: {
    startTracking: (_state, _action: PayloadAction<TrackingActionPayload>) => ({
      ...initialState,
      loading: true,
    }),

    trackingConnected: (state) => {
      markLive(state);
    },

    /** Snapshot: the car's position plus the trip ids. */
    trackingUpdate: (state, action: PayloadAction<TrackingPayload>) => {
      const { lat, lng, timestamp, driverStatus } = action.payload;
      if (pushPoint(state, { lat, lng, timestamp })) {
        state.data = { ...action.payload, driverStatus: state.driverStatus };
        if (driverStatus) setStatus(state, driverStatus);
      }
      markLive(state);
    },

    /** `event: location`: position only. Moves the car with or without a snapshot. */
    trackingLocationUpdate: (state, action: PayloadAction<LocationUpdate>) => {
      if (pushPoint(state, action.payload) && state.data) {
        state.data.lat = action.payload.lat;
        state.data.lng = action.payload.lng;
        state.data.timestamp = action.payload.timestamp;
      }
      markLive(state);
    },

    /** Status from eta / route_change / vehicle_meta. */
    trackingStatusUpdate: (state, action: PayloadAction<DriverStatus>) => {
      setStatus(state, action.payload);
    },

    trackingDisconnected: (state) => {
      state.connected = false;
      state.loading = false;
    },

    trackingError: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.connected = false;
      state.error = action.payload;
    },

    stopTracking: (state) => {
      state.loading = false;
      state.connected = false;
    },
  },
});

export const {
  startTracking,
  trackingConnected,
  trackingUpdate,
  trackingLocationUpdate,
  trackingStatusUpdate,
  trackingDisconnected,
  trackingError,
  stopTracking,
} = trackingSlice.actions;

type TrackingRootState = { tracking: TrackingState };

/** Recent car points, newest last. Same array until a point is added. */
export const selectTrackPoints = (state: TrackingRootState) => state.tracking.points;

/** Trip status (ENROUTE → ARRIVED → POB → COMPLETED), from every event; null until one says. */
export const selectDriverStatus = (state: TrackingRootState) => state.tracking.driverStatus;

/** Newest car point, or null before the first one. */
export const selectDriverPoint = (state: TrackingRootState) =>
  state.tracking.points.at(-1) ?? null;

/** Car position for the map. Memoized so the car only re-renders when it moves. */
export const selectDriverPosition = createSelector(
  [
    (state: TrackingRootState) => selectDriverPoint(state)?.lat,
    (state: TrackingRootState) => selectDriverPoint(state)?.lng,
  ],
  (lat, lng) => (lat === undefined || lng === undefined ? null : { lat, lng }),
);

export default trackingSlice.reducer;
