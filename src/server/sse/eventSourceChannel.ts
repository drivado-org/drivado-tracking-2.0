import { buffers, eventChannel, type EventChannel } from "redux-saga";
import { DEFAULT_SSE_EVENT, TRACKING_EVENTS } from "./trackingEvents";
import { buildTripStreamUrl } from "./tracking-action";

export type StreamEvent =
  | { type: "OPEN" }
  | { type: "MESSAGE"; data: string; event: string }
  | { type: "CLOSED" }
  | { type: "ERROR"; error: unknown };

const EVENT_NAMES = [...Object.values(TRACKING_EVENTS), DEFAULT_SSE_EVENT];

/**
 * The browser's own EventSource, where there is one. WebKit (Safari and every iPhone
 * browser) does not reliably deliver a fetch-read event stream chunk by chunk, but
 * EventSource works everywhere.
 */
export const isEventSourceSupported = () => typeof EventSource !== "undefined";

/**
 * The trip stream as the same events the fetch reader emits. EventSource retries by itself;
 * here a drop is reported instead (CLOSED once it was open, ERROR if it never opened), so the
 * saga's backoff decides when to reconnect.
 */
export const createEventSourceChannel = (tripID: string): EventChannel<StreamEvent> =>
  eventChannel((emit) => {
    const source = new EventSource(buildTripStreamUrl(tripID));
    let opened = false;

    const onMessage = (event: Event) => {
      const { data, type } = event as MessageEvent<string>;
      emit({ type: "MESSAGE", data, event: type });
    };

    source.onopen = () => {
      opened = true;
      emit({ type: "OPEN" });
    };
    source.onerror = () => {
      source.close();
      emit(
        opened
          ? { type: "CLOSED" }
          : { type: "ERROR", error: new Error("Tracking SSE stream is not available") },
      );
    };
    EVENT_NAMES.forEach((name) => source.addEventListener(name, onMessage));

    return () => {
      EVENT_NAMES.forEach((name) => source.removeEventListener(name, onMessage));
      source.close();
    };
  }, buffers.expanding<StreamEvent>());
