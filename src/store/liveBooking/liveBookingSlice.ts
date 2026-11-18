import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

import type {
  BookingDetails,
  BookingMetricsData,
  DriverData,
  DriverReviewPayload,
  DriverReviewResponse,
  TrackingEventType,
} from "@/types/liveBooking";

interface LiveBookingState {
  bookingDetails: BookingDetails | null;
  driver: DriverData | null;
  bookingMetrics: BookingMetricsData | null;

  loading: boolean;
  error: string | null;

  sseConnected: boolean;
  sseEvents: Partial<Record<TrackingEventType, unknown>>;

  reviewLoading: boolean;
  reviewError: string | null;
  reviewSuccess: DriverReviewResponse | null;
}

const initialState: LiveBookingState = {
  bookingDetails: null,
  driver: null,
  bookingMetrics: null,

  loading: false,
  error: null,

  sseConnected: false,
  sseEvents: {},

  reviewLoading: false,
  reviewError: null,
  reviewSuccess: null,
};

const liveBookingSlice = createSlice({
  name: "liveBooking",
  initialState,

  reducers: {
    getBookingDetailsRequest: (state, _action: PayloadAction<string>) => {
      state.loading = true;
      state.error = null;
    },

    getBookingDetailsSuccess: (
      state,
      action: PayloadAction<{
        bookingDetails: BookingDetails;
        driver: DriverData;
        bookingMetrics: BookingMetricsData;
      }>,
    ) => {
      state.loading = false;

      state.bookingDetails = action.payload.bookingDetails;
      state.driver = action.payload.driver;
      state.bookingMetrics = action.payload.bookingMetrics;
    },

    getBookingDetailsFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },

    submitDriverReviewRequest: (
      state,
      _action: PayloadAction<DriverReviewPayload>,
    ) => {
      state.reviewLoading = true;
      state.reviewError = null;
      state.reviewSuccess = null;
    },

    submitDriverReviewSuccess: (
      state,
      action: PayloadAction<DriverReviewResponse>,
    ) => {
      state.reviewLoading = false;
      state.reviewError = null;
      state.reviewSuccess = action.payload;
    },

    submitDriverReviewFailure: (state, action: PayloadAction<string>) => {
      state.reviewLoading = false;
      state.reviewError = action.payload;
    },

    clearDriverReview: (state) => {
      state.reviewLoading = false;
      state.reviewError = null;
      state.reviewSuccess = null;
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
  getBookingDetailsRequest,
  getBookingDetailsSuccess,
  getBookingDetailsFailure,
  submitDriverReviewRequest,
  submitDriverReviewSuccess,
  submitDriverReviewFailure,
  clearDriverReview,
  trackingEventReceived,
  trackingConnectionChanged,
  clearTrackingEvents,
} = liveBookingSlice.actions;

export default liveBookingSlice.reducer;
