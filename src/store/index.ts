import { configureStore } from "@reduxjs/toolkit";
import liveBookingReducer from "./liveBooking/liveBookingSlice";

export const store = configureStore({
  reducer: {
    liveBooking: liveBookingReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
