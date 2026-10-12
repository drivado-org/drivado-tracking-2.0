import { all, fork } from "redux-saga/effects";
import trackingSaga from "./trackingSaga";
import { watchLiveBookingAsync } from "../liveBooking/liveBookingSaga";

export default function* rootSaga() {
  yield all([fork(trackingSaga), fork(watchLiveBookingAsync)]);
}
