import { call, put, takeLatest } from "redux-saga/effects";

import { getDriverDetailsApi } from "@/server/api/liveBookingApi";
import type { DriverData } from "@/types/liveBooking";

import {
  getDriverDetailsRequest,
  getDriverDetailsSuccess,
  getDriverDetailsFailure,
} from "./liveBookingSlice";

function* getDriverDetailsSaga() {
  try {
    const response: DriverData = yield call(getDriverDetailsApi);

    yield put(getDriverDetailsSuccess(response));
  } catch (error) {
    yield put(
      getDriverDetailsFailure(
        error instanceof Error
          ? error.message
          : "Failed to fetch driver details",
      ),
    );
  }
}

export function* watchLiveBookingAsync() {
  yield takeLatest(getDriverDetailsRequest.type, getDriverDetailsSaga);
}
