import { call, put, takeLatest } from "redux-saga/effects";

import { getBookingDetailsApi } from "@/server/api/liveBookingApi";
import type { BookingDetailsResponse } from "@/types/liveBooking";

import {
  getBookingDetailsRequest,
  getBookingDetailsSuccess,
  getBookingDetailsFailure,
} from "./liveBookingSlice";

function* getBookingDetailsSaga(
  action: ReturnType<typeof getBookingDetailsRequest>,
) {
  try {
    const response: BookingDetailsResponse = yield call(
      getBookingDetailsApi,
      action.payload,
    );

    console.log("Saga response:", response);

    const data = response.data;

    yield put(
      getBookingDetailsSuccess({
        bookingDetails: {
          bookingId: data?.bookingId,
          vehicleType: data?.vehicleType,
          pickUpName: data.pickUpName,
          dropOffName: data.dropOffName,
          passengerName: data.passengerName,
          passengers: data.passengers,
          luggage: data.luggage,
          flightNo: data.flightNo,
        },
        driver: {
          driverName: data.driverName,
          driverContact: data.driverContact,
          vehicleRegNo: data.vehicleRegNo,
        },
        bookingMetrics: {
          distance: data.distance,
          duration: data.duration,
        },
      }),
    );
  } catch (error) {
    yield put(
      getBookingDetailsFailure(
        error instanceof Error
          ? error.message
          : "Failed to fetch booking details",
      ),
    );
  }
}

export function* watchLiveBookingAsync() {
  yield takeLatest(getBookingDetailsRequest.type, getBookingDetailsSaga);
}
