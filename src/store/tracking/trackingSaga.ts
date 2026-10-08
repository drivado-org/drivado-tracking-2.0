import type { PayloadAction } from "@reduxjs/toolkit";
import type { AxiosResponse } from "axios";
import { buffers, eventChannel, type EventChannel } from "redux-saga";
import { call, put, race, take, takeLatest } from "redux-saga/effects";

import { USE_DEMO_TRACKING } from "@/pages/liveTracking/tracking/constants/tracking";
import { createSseParser } from "@/server/sse/sseParser";
import { trackingAction } from "@/server/sse/tracking-action";
import type { TrackingActionPayload } from "@/types/tracking";
import { parseTrackingPayload } from "@/validators/trackingPayload";
import {
  startTracking,
  stopTracking,
  trackingConnected,
  trackingDisconnected,
  trackingError,
  trackingUpdate,
} from "@/store/tracking/trackingSlice";
import { demoTrackingSaga } from "./demoTrackingSaga";

type StreamEvent =
  | { type: "MESSAGE"; data: string }
  | { type: "CLOSED" }
  | { type: "ERROR"; error: unknown };

const createStreamChannel = (
  body: ReadableStream<Uint8Array>,
): EventChannel<StreamEvent> =>
  eventChannel((emit) => {
    const reader = body.getReader();
    const decoder = new TextDecoder();
    const parser = createSseParser((data) => emit({ type: "MESSAGE", data }));
    let closed = false;

    const read = async () => {
      try {
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          parser.push(decoder.decode(value, { stream: true }));
        }
        if (!closed) emit({ type: "CLOSED" });
      } catch (error) {
        if (!closed) emit({ type: "ERROR", error });
      }
    };

    read();

    return () => {
      closed = true;
      reader.cancel().catch(() => {});
    };
  }, buffers.expanding<StreamEvent>());

export function* trackingSaga(action: PayloadAction<TrackingActionPayload>) {
  const controller = new AbortController();
  let channel: EventChannel<StreamEvent> | null = null;

  try {
    console.log("TRACKING Payload:", { tripID: action.payload.tripID });

    const response: AxiosResponse<ReadableStream<Uint8Array>> = yield call(
      trackingAction,
      action.payload,
      controller.signal,
    );

    console.log("TRACKING Response:", response?.status);

    if (response?.status === 200 && response.data) {
      yield put(trackingConnected());

      channel = yield call(createStreamChannel, response.data);

      while (true) {
        const event: StreamEvent = yield take(channel!);

        if (event.type === "CLOSED") {
          console.warn("TRACKING stream closed by server");
          yield put(trackingDisconnected());
          return;
        }

        if (event.type === "ERROR") {
          throw event.error;
        }

        // -----------------------------------------------
        // Validate payload
        // -----------------------------------------------

        const location = parseTrackingPayload(event.data);

        if (!location) {
          console.warn("TRACKING invalid payload ignored:", event.data);
          continue;
        }

        // -----------------------------------------------
        // Update Redux car location
        // -----------------------------------------------

        yield put(trackingUpdate(location));

        // -----------------------------------------------
        // Trip finished
        // -----------------------------------------------

        if (
          location.driverStatus === "COMPLETED" ||
          location.driverStatus === "NOSHOW"
        ) {
          console.log("TRACKING ended:", location.driverStatus);
          yield put(trackingDisconnected());
          return;
        }
      }
    } else {
      // =======================================================
      // API FAILED
      // =======================================================

      const message =
        response?.status === 200
          ? "Tracking SSE stream is not available"
          : `Tracking API failed with status ${response?.status}`;

      console.error("TRACKING failed:", message);
      yield put(trackingError(message));
    }
  } catch (error) {
    // =========================================================
    // API ERROR
    // =========================================================

    console.error("trackingSaga error:", error);
    yield put(
      trackingError(
        error instanceof Error ? error.message : "SSE connection failed",
      ),
    );
  } finally {
    // Runs on return, error and cancel (stopTracking / new startTracking).
    channel?.close();
    controller.abort();
  }
}

/** Runs trackingSaga (or the demo) until stopTracking. */
function* trackingFlowSaga(action: PayloadAction<TrackingActionPayload>) {
  yield race({
    tracking: call(USE_DEMO_TRACKING ? demoTrackingSaga : trackingSaga, action),
    stop: take(stopTracking.type),
  });
}

/** takeLatest: a new startTracking cancels the previous trip's stream. */
export default function* watchTrackingSaga() {
  yield takeLatest(startTracking.type, trackingFlowSaga);
}
