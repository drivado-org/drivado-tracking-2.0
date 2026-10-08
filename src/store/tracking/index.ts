import { all, fork } from "redux-saga/effects";
import trackingSaga from "./trackingSaga";

export default function* rootSaga() {
  yield all([fork(trackingSaga)]);
}
