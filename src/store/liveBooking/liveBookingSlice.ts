import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { DriverData } from "@/types/liveBooking";

interface LiveBookingState {
  driver: DriverData | null;
  loading: boolean;
  error: string | null;
}

const initialState: LiveBookingState = {
  driver: null,
  loading: false,
  error: null,
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
      state.loading = false;
      state.driver = action.payload;
    },

    getDriverDetailsFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
  },
});

export const {
  getDriverDetailsRequest,
  getDriverDetailsSuccess,
  getDriverDetailsFailure,
} = liveBookingSlice.actions;

export default liveBookingSlice.reducer;
