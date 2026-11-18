import { call, put, takeLatest } from "redux-saga/effects";

import {
  getBookingDetailsApi,
  saveDriverReviewApi,
} from "@/server/api/liveBookingApi";
import type {
  BookingDetailsResponse,
  DriverReviewResponse,
} from "@/types/liveBooking";

import {
  getBookingDetailsRequest,
  getBookingDetailsSuccess,
  getBookingDetailsFailure,
  submitDriverReviewRequest,
  submitDriverReviewSuccess,
  submitDriverReviewFailure,
} from "./liveBookingSlice";
import axios from "axios";

// --------- Get Booking Details Saga ---------

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
          bookingId: data.bookingId,
          driverId: data.driverId,
          passengerId: data.passengerId,
          vehicleType: data.vehicleType,
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
          rating: data.driverRating,
          trips: data.driverTotalTrips,
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

// --------- Submit Driver Review Saga ---------

function* submitDriverReviewSaga(
  action: ReturnType<typeof submitDriverReviewRequest>,
) {
  try {
    const response: DriverReviewResponse = yield call(
      saveDriverReviewApi,
      action.payload,
    );

    console.log("Driver review response:", response);

    yield put(submitDriverReviewSuccess(response));
  } catch (error: unknown) {
    let errorMessage = "Failed to submit feedback";

    if (axios.isAxiosError(error)) {
      errorMessage =
        error.response?.data?.message || error.message || errorMessage;
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    yield put(submitDriverReviewFailure(errorMessage));
  }
}

export function* watchLiveBookingAsync() {
  yield takeLatest(getBookingDetailsRequest.type, getBookingDetailsSaga);
  yield takeLatest(submitDriverReviewRequest.type, submitDriverReviewSaga);
}
