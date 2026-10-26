import type { PayloadAction } from "@reduxjs/toolkit";
import type { AxiosResponse } from "axios";
import { buffers, eventChannel, type EventChannel } from "redux-saga";
import { call, delay, put, race, take, takeLatest } from "redux-saga/effects";

import {
  RECONNECT_BASE_DELAY_MS,
  RECONNECT_MAX_DELAY_MS,
} from "@/pages/liveTracking/tracking/constants/tracking";
import { createSseParser } from "@/server/sse/sseParser";
import { trackingAction } from "@/server/sse/tracking-action";
import { TRACKING_EVENTS } from "@/server/sse/trackingEvents";
import type { DriverStatus, TrackingActionPayload } from "@/types/tracking";
import { isTripFinished } from "@/utils/tripStatus";
import type { TripEventBase } from "@/types/route";
import {
  parseLocationUpdate,
  parseTrackingMessage,
} from "@/validators/trackingPayload";
import {
  isEtaPending,
  parseEtaEvent,
  parseRouteChange,
  parseVehicleMeta,
} from "@/validators/tripEventPayload";
import {
  etaUpdate,
  routeChanged,
  vehicleMetaUpdate,
} from "@/store/route/routeSlice";
import {
  startTracking,
  stopTracking,
  trackingConnected,
  trackingDisconnected,
  trackingError,
  trackingLocationUpdate,
  trackingStatusUpdate,
  trackingUpdate,
} from "@/store/tracking/trackingSlice";

type StreamEvent =
  | { type: "MESSAGE"; data: string; event: string }
  | { type: "CLOSED" }
  | { type: "ERROR"; error: unknown };

const createStreamChannel = (
  body: ReadableStream<Uint8Array>,
): EventChannel<StreamEvent> =>
  eventChannel((emit) => {
    const reader = body.getReader();
    const decoder = new TextDecoder();
    const parser = createSseParser((data, event) =>
      emit({ type: "MESSAGE", data, event }),
    );
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

/** Parses an eta / route_change / vehicle_meta event; null for another trip or a bad payload. */
const readTripEvent = <T extends TripEventBase>(
  parse: (raw: unknown) => T | null,
  name: string,
  data: string,
  tripID: string,
): T | null => {
  const parsed = parse(data);
  if (!parsed) {
    console.warn(`TRACKING invalid ${name} ignored:`, data);
    return null;
  }
  // Same trip whatever the case / spaces the URL uses (t146 vs T146).
  if (parsed.tripID.trim().toUpperCase() !== tripID.trim().toUpperCase()) {
    console.warn(`TRACKING ${name} for another trip ignored:`, parsed.tripID);
    return null;
  }
  return parsed;
};

type ConnectionResult = {
  /** Trip finished (COMPLETED / NOSHOW): don't reconnect. */
  ended: boolean;
  /** At least one valid location arrived: the connection was healthy. */
  receivedLocation: boolean;
};

/** One SSE connection, from request until the stream ends, fails or the trip finishes. */
function* streamTripOnce(action: PayloadAction<TrackingActionPayload>) {
  const controller = new AbortController();
  let channel: EventChannel<StreamEvent> | null = null;
  const result: ConnectionResult = { ended: false, receivedLocation: false };

  try {
    console.log("TRACKING Payload:", { tripID: action.payload.tripID });

    const response: AxiosResponse<ReadableStream<Uint8Array>> = yield call(
      trackingAction,
      action.payload,
      controller.signal,
    );

    console.log("TRACKING Response:", response?.status);

    if (response?.status !== 200 || !response.data) {
      // =======================================================
      // API FAILED
      // =======================================================

      const message =
        response?.status === 200
          ? "Tracking SSE stream is not available"
          : `Tracking API failed with status ${response?.status}`;

      console.error("TRACKING failed:", message);
      yield put(trackingError(message));
      return result;
    }

    yield put(trackingConnected());

    channel = yield call(createStreamChannel, response.data);

    while (true) {
      const event: StreamEvent = yield take(channel!);

      if (event.type === "CLOSED") {
        console.warn("TRACKING stream closed by server");
        yield put(trackingDisconnected());
        return result;
      }

      if (event.type === "ERROR") {
        throw event.error;
      }

      // -----------------------------------------------
      // Route, ETA and bearing events
      // -----------------------------------------------

      const tripID = action.payload.tripID;
      let tripEvent: { driverStatus: DriverStatus | null } | null = null;

      if (event.event === TRACKING_EVENTS.eta) {
        const eta = readTripEvent(parseEtaEvent, event.event, event.data, tripID);
        if (eta && !isEtaPending(eta)) yield put(etaUpdate(eta));
        tripEvent = eta;
      } else if (event.event === TRACKING_EVENTS.routeChange) {
        const route = readTripEvent(parseRouteChange, event.event, event.data, tripID);
        if (route) yield put(routeChanged(route));
        tripEvent = route;
      } else if (event.event === TRACKING_EVENTS.vehicleMeta) {
        const meta = readTripEvent(parseVehicleMeta, event.event, event.data, tripID);
        if (meta) yield put(vehicleMetaUpdate(meta));
        tripEvent = meta;
      }

      if (
        event.event === TRACKING_EVENTS.eta ||
        event.event === TRACKING_EVENTS.routeChange ||
        event.event === TRACKING_EVENTS.vehicleMeta
      ) {
        if (tripEvent?.driverStatus) {
          yield put(trackingStatusUpdate(tripEvent.driverStatus));

          if (isTripFinished(tripEvent.driverStatus)) {
            console.log("TRACKING ended:", tripEvent.driverStatus);
            yield put(trackingDisconnected());
            result.ended = true;
            return result;
          }
        }
        continue;
      }

      // trip_stage / status: payload shape not agreed yet.
      if (
        event.event === TRACKING_EVENTS.tripStage ||
        event.event === TRACKING_EVENTS.status
      ) {
        continue;
      }

      // -----------------------------------------------
      // Validate payload (one point or a { data: [...] } batch)
      // -----------------------------------------------

      const location = parseTrackingMessage(event.data);

      if (!location) {
        // `event: location` carries only { lat, lng, timestamp }.
        const update = parseLocationUpdate(event.data);

        if (!update) {
          console.warn("TRACKING invalid payload ignored:", event.data);
          continue;
        }

        result.receivedLocation = true;
        yield put(trackingLocationUpdate(update));
        continue;
      }

      // -----------------------------------------------
      // Update Redux car location
      // -----------------------------------------------

      result.receivedLocation = true;
      yield put(trackingUpdate(location));

      // -----------------------------------------------
      // Trip finished (only when the backend still sends a status)
      // -----------------------------------------------

      if (isTripFinished(location.driverStatus)) {
        console.log("TRACKING ended:", location.driverStatus);
        yield put(trackingDisconnected());
        result.ended = true;
        return result;
      }
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
    return result;
  } finally {
    // Runs on return, error and cancel (stopTracking / new startTracking).
    channel?.close();
    controller.abort();
  }
}

/** Wait before reconnect attempt n (0-based): 1s, 2s, 4s … capped at 30s. */
export const reconnectDelay = (attempt: number) =>
  Math.min(RECONNECT_BASE_DELAY_MS * 2 ** attempt, RECONNECT_MAX_DELAY_MS);

/** Streams the trip and reconnects with backoff until the trip finishes. */
export function* trackingSaga(action: PayloadAction<TrackingActionPayload>) {
  let attempt = 0;

  while (true) {
    const { ended, receivedLocation }: ConnectionResult = yield call(
      streamTripOnce,
      action,
    );
    if (ended) return;

    // A healthy connection that later dropped starts the backoff from 1s again.
    if (receivedLocation) attempt = 0;

    const wait = reconnectDelay(attempt);
    attempt += 1;
    console.warn(`TRACKING reconnecting in ${wait}ms`);
    yield delay(wait);
  }
}

/** Runs trackingSaga until stopTracking. */
function* trackingFlowSaga(action: PayloadAction<TrackingActionPayload>) {
  yield race({
    tracking: call(trackingSaga, action),
    stop: take(stopTracking.type),
  });
}

/** takeLatest: a new startTracking cancels the previous trip's stream. */
export default function* watchTrackingSaga() {
  yield takeLatest(startTracking.type, trackingFlowSaga);
}
