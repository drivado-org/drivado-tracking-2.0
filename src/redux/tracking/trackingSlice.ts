import {
  createSelector,
  createSlice,
  type PayloadAction,
} from "@reduxjs/toolkit";
import type {
  TrackingActionPayload,
  TrackingPayload,
  TrackingState,
} from "@/types/tracking";

const initialState: TrackingState = {
  data: null,

  loading: false,

  connected: false,

  error: null,
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
      state.loading = false;
      state.connected = true;
      state.error = null;
    },

    trackingUpdate: (state, action: PayloadAction<TrackingPayload>) => {
      state.data = action.payload;

      state.loading = false;

      state.connected = true;

      state.error = null;
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
  trackingDisconnected,
  trackingError,
  stopTracking,
} = trackingSlice.actions;

type TrackingRootState = { tracking: TrackingState };

/** Car position for the map. Memoized so the car only re-renders when it moves. */
export const selectDriverPosition = createSelector(
  [
    (state: TrackingRootState) => state.tracking.data?.lat,
    (state: TrackingRootState) => state.tracking.data?.lng,
  ],
  (lat, lng) => (lat === undefined || lng === undefined ? null : { lat, lng }),
);

export default trackingSlice.reducer;

// EventSource()

// WebSocket()
