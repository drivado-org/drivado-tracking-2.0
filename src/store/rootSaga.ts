import { all, fork } from "redux-saga/effects";
import { watchLiveBookingAsync } from "./liveBooking/liveBookingSaga";
import watchTrackingSaga from "./tracking/trackingSaga";

export default function* rootSaga() {
  yield all([fork(watchTrackingSaga), fork(watchLiveBookingAsync)]);
}
