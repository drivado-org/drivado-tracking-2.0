import type { PayloadAction } from "@reduxjs/toolkit";
import type { AxiosResponse } from "axios";
import { buffers, eventChannel, type EventChannel } from "redux-saga";
import { call, delay, put, race, select, take, takeLatest } from "redux-saga/effects";

import {
  RECONNECT_BASE_DELAY_MS,
  RECONNECT_MAX_DELAY_MS,
} from "@/pages/liveTracking/tracking/constants/tracking";
import {
  createEventSourceChannel,
  isEventSourceSupported,
  type StreamEvent,
} from "@/server/sse/eventSourceChannel";
import { createSseParser } from "@/server/sse/sseParser";
import { trackingAction } from "@/server/sse/tracking-action";
import { TRACKING_EVENTS } from "@/server/sse/trackingEvents";
import type {
  DriverStatus,
  TrackingActionPayload,
  TrackingState,
  TripSnapshot,
} from "@/types/tracking";
import type { EtaUpdate, RouteState } from "@/types/route";
import { isArrivalStatus, isTripFinished } from "@/utils/tripStatus";
import {
  parseLocationUpdate,
  parseTrackingMessage,
} from "@/validators/trackingPayload";
import {
  isEtaEmpty,
  parseDriverStatusEvent,
  parseEtaEvent,
  parseNotificationEvent,
  parseRouteChange,
  parseTripSnapshot,
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
  trackingNotification,
  trackingStatusUpdate,
  trackingUpdate,
} from "@/store/tracking/trackingSlice";

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

/** Same trip whatever the case / spaces the URL uses (t146 vs T146). */
const isSameTrip = (a: string, b: string) =>
  a.trim().toUpperCase() === b.trim().toUpperCase();

/** Parses an eta / route_change / vehicle_meta / driver_status / notification event; null for a bad payload. */
const readTripEvent = <T>(
  parse: (raw: unknown) => T | null,
  name: string,
  data: string,
): T | null => {
  const parsed = parse(data);
  if (!parsed) console.warn(`TRACKING invalid ${name} ignored:`, data);
  return parsed;
};

type StreamRootState = { tracking: TrackingState; route: RouteState };

/**
 * { eta: 0, distance: 0 } before any real ETA means "route not known yet": skipped.
 * After a real ETA, or once the driver has arrived, it is the real "0 min".
 */
function* shouldShowEta(eta: EtaUpdate, status: DriverStatus | null) {
  if (!isEtaEmpty(eta) || isArrivalStatus(status)) return true;
  const shown: EtaUpdate | null = yield select((state: StreamRootState) => state.route.eta);
  return shown !== null;
}

/** Splits the connect snapshot into the actions the live events use; later events overwrite them. */
function* applySnapshot(snapshot: TripSnapshot) {
  const { location, eta, distance, route, bearing, ...trip } = snapshot;

  if (location) {
    yield put(trackingUpdate({ ...trip, ...location, sequence: null }));
  } else {
    // No GPS fix yet: keep the status, the car appears with the first location event.
    yield put(trackingStatusUpdate(trip.driverStatus));
  }

  if (eta !== undefined && distance !== undefined) {
    const update: EtaUpdate = {
      etaSeconds: eta,
      distanceMeters: distance,
      arrivalTime: new Date(Date.now() + eta * 1000).toISOString(),
    };
    const show: boolean = yield call(shouldShowEta, update, trip.driverStatus);
    if (show) yield put(etaUpdate(update));
  }

  if (route) yield put(routeChanged({ routePath: route }));

  if (bearing !== undefined) {
    yield put(vehicleMetaUpdate({ reroute: false, bearing }));
  }
}

type ConnectionResult = {
  /** Trip finished (COMPLETED / NOSHOW): don't reconnect. */
  ended: boolean;
  /** At least one valid location arrived: the connection was healthy. */
  receivedLocation: boolean;
};

/** Fallback for browsers without EventSource: reads the stream through fetch. null on failure. */
function* openFetchStream(
  action: PayloadAction<TrackingActionPayload>,
  signal: AbortSignal,
) {
  const response: AxiosResponse<ReadableStream<Uint8Array>> = yield call(
    trackingAction,
    action.payload,
    signal,
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
    return null;
  }

  yield put(trackingConnected());

  const channel: EventChannel<StreamEvent> = yield call(createStreamChannel, response.data);
  return channel;
}

/** One SSE connection, from request until the stream ends, fails or the trip finishes. */
function* streamTripOnce(action: PayloadAction<TrackingActionPayload>) {
  const controller = new AbortController();
  let channel: EventChannel<StreamEvent> | null = null;
  const result: ConnectionResult = { ended: false, receivedLocation: false };

  try {
    console.log("TRACKING Payload:", { tripID: action.payload.tripID });

    if (isEventSourceSupported()) {
      // trackingConnected waits for the OPEN event.
      channel = yield call(createEventSourceChannel, action.payload.tripID);
    } else {
      channel = yield* openFetchStream(action, controller.signal);
      if (!channel) return result;
    }

    while (true) {
      const event: StreamEvent = yield take(channel!);

      if (event.type === "OPEN") {
        yield put(trackingConnected());
        continue;
      }

      if (event.type === "CLOSED") {
        console.warn("TRACKING stream closed by server");
        yield put(trackingDisconnected());
        return result;
      }

      if (event.type === "ERROR") {
        throw event.error;
      }

      const tripID = action.payload.tripID;

      // -----------------------------------------------
      // Snapshot on connect: ids, status, location, ETA, route and bearing at once
      // -----------------------------------------------

      // A payload that isn't a full snapshot falls through to the location parser below.
      const snapshot =
        event.event === TRACKING_EVENTS.snapshot ? parseTripSnapshot(event.data) : null;

      if (snapshot) {
        if (!isSameTrip(snapshot.tripID, tripID)) {
          console.warn("TRACKING snapshot for another trip ignored:", snapshot.tripID);
          continue;
        }

        yield call(applySnapshot, snapshot);
        if (snapshot.location) result.receivedLocation = true;

        if (isTripFinished(snapshot.driverStatus)) {
          console.log("TRACKING ended:", snapshot.driverStatus);
          yield put(trackingDisconnected());
          result.ended = true;
          return result;
        }
        continue;
      }

      // -----------------------------------------------
      // Live events: ETA, route, bearing / reroute, status, notification
      // -----------------------------------------------

      if (event.event === TRACKING_EVENTS.eta) {
        const eta = readTripEvent(parseEtaEvent, event.event, event.data);
        if (eta) {
          const status: DriverStatus | null = yield select(
            (state: StreamRootState) => state.tracking.driverStatus,
          );
          const show: boolean = yield call(shouldShowEta, eta, status);
          if (show) yield put(etaUpdate(eta));
        }
        continue;
      }

      if (event.event === TRACKING_EVENTS.routeChange) {
        const route = readTripEvent(parseRouteChange, event.event, event.data);
        if (route) yield put(routeChanged(route));
        continue;
      }

      if (event.event === TRACKING_EVENTS.vehicleMeta) {
        const meta = readTripEvent(parseVehicleMeta, event.event, event.data);
        if (meta) yield put(vehicleMetaUpdate(meta));
        continue;
      }

      if (event.event === TRACKING_EVENTS.driverStatus) {
        const update = readTripEvent(parseDriverStatusEvent, event.event, event.data);
        if (!update) continue;

        yield put(trackingStatusUpdate(update.driverStatus));

        if (isTripFinished(update.driverStatus)) {
          console.log("TRACKING ended:", update.driverStatus);
          yield put(trackingDisconnected());
          result.ended = true;
          return result;
        }
        continue;
      }

      if (event.event === TRACKING_EVENTS.notification) {
        const notification = readTripEvent(parseNotificationEvent, event.event, event.data);
        if (notification) yield put(trackingNotification(notification));
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
