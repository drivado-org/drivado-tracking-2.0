import type { PayloadAction } from "@reduxjs/toolkit";
import { delay, put } from "redux-saga/effects";

import { DEMO_INTERVAL_MS } from "@/pages/liveTracking/tracking/constants/tracking";
import { buildDemoPoints } from "@/pages/liveTracking/tracking/mock/demoPoints";
import type { TrackingActionPayload } from "@/types/tracking";
import { parseTrackingPayload } from "@/validators/trackingPayload";
import {
  trackingConnected,
  trackingDisconnected,
  trackingUpdate,
} from "@/redux/tracking/trackingSlice";

/** Plays demo points into redux exactly like trackingSaga does with real SSE data. */
export function* demoTrackingSaga(action: PayloadAction<TrackingActionPayload>) {
  const points = buildDemoPoints(action.payload.tripID, Date.now(), DEMO_INTERVAL_MS);

  console.log("TRACKING demo mode:", points.length, "points");

  yield put(trackingConnected());

  for (let i = 0; i < points.length; i++) {
    if (i > 0) yield delay(DEMO_INTERVAL_MS);

    // -----------------------------------------------
    // Validate payload (same checker as real SSE)
    // -----------------------------------------------

    const location = parseTrackingPayload(points[i]);
    if (!location) continue;

    // -----------------------------------------------
    // Update Redux car location
    // -----------------------------------------------

    yield put(trackingUpdate(location));
  }

  console.log("TRACKING demo ended");
  yield put(trackingDisconnected());
}
