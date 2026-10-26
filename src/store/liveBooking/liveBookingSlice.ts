import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { DriverData, TrackingEventType } from "@/types/liveBooking";

interface LiveBookingState {
  driver: DriverData | null;
  loading: boolean;
  error: string | null;

  sseConnected: boolean;
  sseEvents: Partial<Record<TrackingEventType, unknown>>;
}

const initialState: LiveBookingState = {
  driver: null,
  loading: false,
  error: null,

  sseConnected: false,
  sseEvents: {},
};

const liveBookingSlice = createSlice({
  name: "liveBooking",
  initialState,
  reducers: {
    getDriverDetailsRequest: (state) => {
      state.loading = true;
      state.error = null;
    },

    getDriverDetailsSuccess: (state, action: PayloadAction<DriverData>) => {
      console.log("Success payload:", action.payload);
      state.loading = false;
      state.driver = action.payload;
    },

    getDriverDetailsFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },

    trackingEventReceived: (
      state,
      action: PayloadAction<{
        type: TrackingEventType;
        data: unknown;
      }>,
    ) => {
      state.sseEvents[action.payload.type] = action.payload.data;
    },

    trackingConnectionChanged: (state, action: PayloadAction<boolean>) => {
      state.sseConnected = action.payload;
    },

    clearTrackingEvents: (state) => {
      state.sseEvents = {};
      state.sseConnected = false;
    },
  },
});

export const {
  getDriverDetailsRequest,
  getDriverDetailsSuccess,
  getDriverDetailsFailure,
  trackingEventReceived,
  trackingConnectionChanged,
  clearTrackingEvents,
} = liveBookingSlice.actions;

export default liveBookingSlice.reducer;
