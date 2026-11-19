# Why live tracking didn't work on iPhone, and how it was fixed

Live tracking worked in Chrome on desktop and Android but broke on iPhone. Every browser on iOS (Safari, Chrome, Firefox and the rest) runs on Apple's WebKit engine, so a WebKit bug hits all iPhone users, whatever browser they use. Desktop Safari had the same problems.

There were three separate problems. Commit `e242a20` ("ADD iphone fixes") fixed them, and `513ac9f` ("ADD build fixes") made a small follow-up change to the test.

| #   | Symptom on iPhone                                                      | Cause                                                             | Fix                                                                |
| --- | ---------------------------------------------------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------ |
| 1   | The car never moved, or the trip stream stayed silent                  | WebKit doesn't deliver a streamed `fetch` response piece by piece | Use the browser's own `EventSource` and keep `fetch` as a fallback |
| 2   | Timestamps were missing or wrong (ETA, trip times, ordering of points) | Safari's `Date.parse` rejects date formats that Chrome accepts    | Rewrite dates as strict ISO 8601 before parsing                    |
| 3   | The map threw an error on desktop Safari                               | `instanceof TouchEvent` throws where `TouchEvent` doesn't exist   | Check `event.type` instead                                         |

---

## 1. The trip stream (SSE) didn't arrive

### Problem

The app read the Server-Sent Events stream (`/realtime/trips/{tripId}/stream`) with axios using the `fetch` adapter and `responseType: "stream"` ([tracking-action.ts](../src/server/sse/tracking-action.ts)). It then read the `ReadableStream` body by hand and parsed the SSE frames itself.

In Chrome each chunk arrives as soon as the server sends it. WebKit doesn't reliably hand a streamed `fetch` body to the page chunk by chunk: it may hold the data back or deliver nothing until the response ends. Because a tracking stream never ends, iPhone users got no location events, so the car stayed where it was.

### Fix

- New file [src/server/sse/eventSourceChannel.ts](../src/server/sse/eventSourceChannel.ts) opens the stream with the browser's native `EventSource`, which works in every browser, iOS included. It emits the same `StreamEvent`s (`MESSAGE`, `CLOSED`, `ERROR`) that the fetch reader emits, so the rest of the saga didn't need to change.
  - It listens for every named tracking event (`TRACKING_EVENTS` and the default event).
  - It adds an `OPEN` event, so the app is marked connected only once the stream is actually open.
  - `EventSource` normally reconnects by itself. Here it is closed on error and the drop is reported instead (`CLOSED` if the stream had opened, `ERROR` if it never opened), so the saga's existing backoff (`RECONNECT_BASE_DELAY_MS` / `RECONNECT_MAX_DELAY_MS`) still decides when to reconnect. This prevents two retry loops running at once.
- [src/store/tracking/trackingSaga.ts](../src/store/tracking/trackingSaga.ts):
  - `streamTripOnce` uses `EventSource` whenever `isEventSourceSupported()` is true.
  - The old fetch path moved, unchanged, into `openFetchStream` and is used only as a fallback in browsers without `EventSource`.
  - `trackingConnected()` is now dispatched on the `OPEN` event in the EventSource path.
  - The `StreamEvent` type moved to `eventSourceChannel.ts` so both paths share it.

> Note: `EventSource` can't send custom headers. The stream endpoint currently needs only `Accept: text/event-stream`, which `EventSource` sends itself. If the endpoint later needs an auth header, it will have to accept the token another way, such as a cookie or a query parameter.

### Tests

[src/test/saga/trackingSagaEventSource.test.ts](../src/test/saga/trackingSagaEventSource.test.ts) uses a fake `EventSource` to check that:

- the stream opens through `EventSource`, not `fetch`
- the app is connected only after `open`
- a `location` event moves the car
- a dropped stream is closed and reconnects after the backoff
- a stream that never opens reports an error
- `stopTracking` closes the stream

---

## 2. Dates from the backend parsed as `NaN` on Safari

### Problem

`toTimestampMs` in [src/validators/primitives.ts](../src/validators/primitives.ts) passed backend date strings straight to `Date.parse`. Chrome is lenient about date formats, but Safari only accepts strict ISO 8601 and returns `NaN` for formats such as:

| Input                                             | Chrome | Safari (before fix) |
| ------------------------------------------------- | ------ | ------------------- |
| `2026-10-08 12:32:55` (space instead of `T`)      | ✅     | ❌ `NaN`            |
| `2026-10-08T12:32:55+0000` (offset without colon) | ✅     | ❌ `NaN`            |
| `2026-10-08 12:32:55 UTC`                         | ✅     | ❌ `NaN`            |
| `2026-10-08T12:32:55.404759Z` (microseconds)      | ✅     | inconsistent        |

When the parse returned `NaN`, the validator rejected the timestamp, so on iPhone location points and trip times were dropped or shown wrong.

### Fix

A new `toStrictIso` helper rewrites any ISO-like date into strict ISO 8601 before it reaches `Date.parse`:

- a space between date and time becomes `T`
- fractional seconds are cut or padded to exactly 3 digits (milliseconds)
- `Z`, `UTC` and `GMT` become `Z`
- `+0530` becomes `+05:30`
- a date with no zone keeps no zone, so it is still read as local time, as before
- surrounding whitespace is trimmed
- strings that don't match the pattern are left unchanged

### Tests

New cases in [src/test/validators/primitives.test.ts](../src/test/validators/primitives.test.ts) check that each of the formats above gives the same timestamp in every browser, and that a date with no zone is read as local time.

---

## 3. Map pinch-zoom handler threw on desktop Safari

### Problem

In [MapCamera/index.tsx](../src/pages/liveTracking/tracking/components/MapCamera/index.tsx), the handler that switches the camera from "journey" to "free" mode when the user zooms by hand checked `event instanceof TouchEvent`. Desktop Safari has no global `TouchEvent`, so that check threw a `ReferenceError` on every wheel or pointer event the handler received.

### Fix

The handler now checks the event type instead:

```ts
if (event.type === "touchstart" && (event as TouchEvent).touches.length < 2)
  return;
```

This works the same everywhere and never references `TouchEvent` as a value.

---

## Follow-up: build fix (`513ac9f`)

- The fake `EventSource` in the new test used a TypeScript constructor parameter property (`constructor(public url: string)`), which the build config rejects. It now declares `url` as a field and assigns it in the constructor.
- Unused imports (`X`, `Button`) were removed from [src/pages/liveTracking/index.tsx](../src/pages/liveTracking/index.tsx).

The same commit also changed `GEOFENCE_SHOW_METERS`, but that is geofencing behaviour and has nothing to do with iPhone support.

---

## Checklist for future iPhone/Safari-safe code

- **Streaming:** use `EventSource` for SSE, not `fetch` with a streamed body.
- **Dates:** always send dates through `toTimestampMs` or `toStrictIso`; never call `Date.parse` or `new Date(string)` on raw backend strings.
- **Browser-only globals:** don't use `instanceof` with globals that may not exist (`TouchEvent`, etc.); check `event.type` or use `typeof X !== "undefined"`.
- **Testing:** test on a real iPhone or in desktop Safari, not just Chrome's device emulation, which still runs Chrome's engine.
