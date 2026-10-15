import type { AxiosResponse } from "axios";
import { trackingAction } from "@/server/sse/tracking-action";
import { createAppStore } from "@/store";
import { reconnectDelay } from "@/store/tracking/trackingSaga";
import { startTracking, stopTracking } from "@/store/tracking/trackingSlice";

vi.mock("@/server/sse/tracking-action", () => ({ trackingAction: vi.fn() }));

const trackingActionMock = vi.mocked(trackingAction);

/** What axios returns with responseType "stream": the body is in data. */
const axiosResponse = (
  status: number,
  data: ReadableStream<Uint8Array> | null,
) => ({ status, data }) as unknown as AxiosResponse<ReadableStream<Uint8Array>>;

const fakeStream = () => {
  let controller!: ReadableStreamDefaultController<Uint8Array>;
  const body = new ReadableStream<Uint8Array>({
    start: (c) => {
      controller = c;
    },
  });
  const encoder = new TextEncoder();
  return {
    response: axiosResponse(200, body),
    send: (text: string) => controller.enqueue(encoder.encode(text)),
    sendEvent: (data: unknown, event = "snapshot") =>
      controller.enqueue(
        encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`),
      ),
    close: () => controller.close(),
    fail: () => controller.error(new Error("network down")),
  };
};

/** The shape the live backend sends: lat/lng/timestamp inside location. */
const payload = ({
  lat = 22.5726,
  lng = 88.3639,
  timestamp = "2026-09-15T12:30:15.000Z",
  ...rest
}: Record<string, unknown> = {}) => ({
  driverID: "DRIVER_123",
  bookingID: "B1",
  tripID: "T123",
  tripType: "TRIP_S",
  driverStatus: "ENROUTE",
  location: { lat, lng, timestamp },
  sequence: 1,
  ...rest,
});

/** Real backend output for trip T146 (route shortened). */
const SAMPLE_STREAM = `event: eta
data: {"driverID":"DR3","bookingID":"T146","tripID":"T146","tripType":"TRIP_S","driverStatus":"","eta":0,"distance":0}

event: location
data: {"Lat":22.47128,"Lng":88.38932,"Timestamp":"2026-10-15T07:18:32.059547Z"}

event: route_change
data: {"driverID":"DR3","bookingID":"T146","tripID":"T146","tripType":"TRIP_D","driverStatus":"POB","routePath":[{"lat":22.47128,"lng":88.38932000000001},{"lat":22.471570000000003,"lng":88.38917000000001},{"lat":22.471330000000002,"lng":88.38863},{"lat":22.456290000000003,"lng":88.39985}]}

event: eta
data: {"driverID":"DR3","bookingID":"T146","tripID":"T146","tripType":"TRIP_D","driverStatus":"POB","eta":651,"distance":2666}

event: vehicle_meta
data: {"driverID":"DR3","bookingID":"T146","tripID":"T146","tripType":"TRIP_D","driverStatus":"POB","reroute":false}

event: location
data: {"Lat":22.471505388984138,"Lng":88.38920341949095,"Timestamp":"2026-10-15T07:18:33.832644Z"}

event: eta
data: {"driverID":"DR3","bookingID":"T146","tripID":"T146","tripType":"TRIP_D","driverStatus":"POB","eta":644,"distance":2638.222221017453}

event: vehicle_meta
data: {"driverID":"DR3","bookingID":"T146","tripID":"T146","tripType":"TRIP_D","driverStatus":"POB","reroute":false,"bearing":334}

`;

/** Let fetch promises, stream reads and saga effects run. */
const settle = async () => {
  for (let i = 0; i < 5; i++) {
    if (vi.isFakeTimers()) await vi.advanceTimersByTimeAsync(0);
    else await new Promise((resolve) => setTimeout(resolve, 0));
  }
};

const lastSignal = () => trackingActionMock.mock.lastCall?.[1] as AbortSignal;

const stores: ReturnType<typeof createAppStore>[] = [];

const startWith = async (
  response: AxiosResponse<ReadableStream<Uint8Array>> | Promise<never>,
) => {
  trackingActionMock.mockReturnValue(Promise.resolve(response));
  const store = createAppStore();
  stores.push(store);
  store.dispatch(startTracking({ tripID: "T123" }));
  await settle();
  return store;
};

beforeEach(() => {
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  // Stop reconnect loops so nothing leaks into the next test.
  stores.splice(0).forEach((store) => store.dispatch(stopTracking()));
  vi.useRealTimers();
});

describe("reconnectDelay", () => {
  it.each([
    [0, 1000],
    [1, 2000],
    [2, 4000],
    [4, 16000],
    [5, 30000],
    [20, 30000],
  ])("attempt %i waits %i ms", (attempt, ms) => {
    expect(reconnectDelay(attempt)).toBe(ms);
  });
});

describe("trackingSaga", () => {
  it("calls the API with the trip", async () => {
    const stream = fakeStream();
    const store = await startWith(stream.response);

    expect(trackingActionMock).toHaveBeenCalledWith(
      { tripID: "T123" },
      expect.any(AbortSignal),
    );
    expect(store.getState().tracking).toMatchObject({
      connected: true,
      loading: false,
    });
  });

  it("puts each location into redux", async () => {
    const stream = fakeStream();
    const store = await startWith(stream.response);

    stream.sendEvent(payload());
    await settle();
    expect(store.getState().tracking.data).toMatchObject({
      lat: 22.5726,
      lng: 88.3639,
    });

    stream.sendEvent(payload({ lat: 22.5736 }), "location");
    await settle();
    expect(store.getState().tracking.data).toMatchObject({ lat: 22.5736 });
  });

  it("moves the car with the live location events that follow the snapshot", async () => {
    const stream = fakeStream();
    const store = await startWith(stream.response);

    stream.sendEvent(payload());
    stream.send(
      "event: location\n" +
        'data: {"lat":22.49557263429034,"lng":88.37082800511205,"timestamp":"2026-10-08T12:32:55.404759Z"}\n\n',
    );
    await settle();

    expect(store.getState().tracking.data).toMatchObject({
      tripID: "T123",
      driverID: "DRIVER_123",
      lat: 22.49557263429034,
      lng: 88.37082800511205,
    });
    expect(console.warn).not.toHaveBeenCalled();
  });

  describe("eta, route_change and vehicle_meta", () => {
    const ids = { driverID: "DRIVER_123", bookingID: "B1", tripID: "T123", tripType: "TRIP_S" };
    const routePath = [
      { lat: 22.5726, lng: 88.3639 },
      { lat: 22.5736, lng: 88.3649 },
    ];

    it("puts each event into redux without moving the car", async () => {
      const stream = fakeStream();
      const store = await startWith(stream.response);

      stream.sendEvent({ ...ids, eta: 300, distance: 1500 }, "eta");
      stream.sendEvent({ ...ids, driverStatus: "ENROUTE", routePath }, "route_change");
      stream.sendEvent(
        { ...ids, driverStatus: "ENROUTE", reroute: false, bearing: 90 },
        "vehicle_meta",
      );
      await settle();

      const { route, tracking } = store.getState();
      expect(route.eta).toMatchObject({ ...ids, etaSeconds: 300, distanceMeters: 1500 });
      expect(route.route).toEqual({ ...ids, driverStatus: "ENROUTE", routePath });
      expect(route.vehicleMeta).toEqual({
        ...ids,
        driverStatus: "ENROUTE",
        reroute: false,
        bearing: 90,
      });
      expect(tracking.data).toBeNull();
      expect(console.warn).not.toHaveBeenCalled();
    });

    it("ignores invalid events, other trips, trip_stage and status", async () => {
      const stream = fakeStream();
      const store = await startWith(stream.response);

      stream.sendEvent({ ...ids, driverStatus: "ENROUTE", routePath: [routePath[0]] }, "route_change");
      stream.sendEvent({ ...ids, eta: -1, distance: 10 }, "eta");
      stream.sendEvent({ ...ids, tripID: "OTHER", eta: 60, distance: 10 }, "eta");
      stream.sendEvent({ stage: "PICKUP" }, "trip_stage");
      stream.sendEvent({ status: "ok" }, "status");
      await settle();

      expect(store.getState().route).toEqual({ route: null, eta: null, vehicleMeta: null });
      expect(store.getState().tracking.data).toBeNull();
    });

    it("updates the driver status of the trip", async () => {
      const stream = fakeStream();
      const store = await startWith(stream.response);

      stream.sendEvent(payload());
      stream.sendEvent({ ...ids, driverStatus: "POB", reroute: false, bearing: 10 }, "vehicle_meta");
      await settle();

      expect(store.getState().tracking.data?.driverStatus).toBe("POB");
    });

    it("ends the trip on COMPLETED without reconnecting", async () => {
      vi.useFakeTimers();
      const stream = fakeStream();
      const store = await startWith(stream.response);

      const calls = trackingActionMock.mock.calls.length;

      stream.sendEvent({ ...ids, driverStatus: "COMPLETED", eta: 0, distance: 0 }, "eta");
      await settle();
      expect(store.getState().tracking.connected).toBe(false);

      await vi.advanceTimersByTimeAsync(60_000);
      expect(trackingActionMock).toHaveBeenCalledTimes(calls);
    });
  });

  it("moves the car with a location event that arrives before any snapshot", async () => {
    const stream = fakeStream();
    const store = await startWith(stream.response);

    stream.sendEvent(
      { lat: 22.6, lng: 88.4, timestamp: "2026-10-08T12:32:55Z" },
      "location",
    );
    await settle();
    expect(store.getState().tracking.data).toBeNull();
    expect(store.getState().tracking.points).toEqual([
      { lat: 22.6, lng: 88.4, timestamp: "2026-10-08T12:32:55.000Z" },
    ]);

    stream.sendEvent(payload({ timestamp: "2026-10-08T12:32:56Z" }));
    await settle();
    expect(store.getState().tracking.data).toMatchObject({ lat: 22.5726 });
  });

  it("handles the live backend stream (no snapshot, capitalized location keys)", async () => {
    const stream = fakeStream();
    trackingActionMock.mockReturnValue(Promise.resolve(stream.response));
    const store = createAppStore();
    stores.push(store);
    store.dispatch(startTracking({ tripID: "T146" }));
    await settle();

    stream.send(SAMPLE_STREAM);
    await settle();

    const { tracking, route } = store.getState();
    expect(tracking.points).toEqual([
      { lat: 22.47128, lng: 88.38932, timestamp: "2026-10-15T07:18:32.059Z" },
      {
        lat: 22.471505388984138,
        lng: 88.38920341949095,
        timestamp: "2026-10-15T07:18:33.832Z",
      },
    ]);
    expect(tracking.driverStatus).toBe("POB");
    expect(tracking.connected).toBe(true);
    // The opening { eta: 0, distance: 0 } is skipped; the newest real estimate is kept.
    expect(route.eta).toMatchObject({ etaSeconds: 644, distanceMeters: 2638.222221017453 });
    expect(route.route?.routePath).toHaveLength(4);
    // The first vehicle_meta had no bearing; the second one's is kept.
    expect(route.vehicleMeta).toMatchObject({ bearing: 334, reroute: false });
    expect(console.warn).not.toHaveBeenCalled();
  });

  it("reads the exact snapshot the backend sends", async () => {
    const stream = fakeStream();
    const store = await startWith(stream.response);

    stream.send(
      ": connected\n\nevent: snapshot\n" +
        'data: {"driverID":"D0002","bookingID":"B0002","tripID":"T123","tripType":"TRIP_S","driverStatus":"ENROUTE","location":{"lat":22.3627,"lng":123.32793,"timestamp":"2026-10-03T07:15:29Z"},"sequence":0}\n\n',
    );
    await settle();

    expect(store.getState().tracking.data).toMatchObject({
      lat: 22.3627,
      lng: 123.32793,
      driverStatus: "ENROUTE",
    });
  });

  it("moves the car to the newest point of a { data: [...] } batch", async () => {
    const stream = fakeStream();
    const store = await startWith(stream.response);

    stream.sendEvent({
      data: [
        {
          driverID: "D1",
          bookingID: "B1",
          tripID: "T123",
          lat: 22.1,
          lng: 88.1,
          clientTimeUTC: "2026-10-03T07:15:31Z",
        },
        {
          driverID: "D1",
          bookingID: "B1",
          tripID: "T123",
          lat: 22.0,
          lng: 88.0,
          clientTimeUTC: "2026-10-03T07:15:29Z",
        },
      ],
    });
    await settle();

    expect(store.getState().tracking.data).toMatchObject({
      lat: 22.1,
      lng: 88.1,
    });
  });

  it("handles an event split across network chunks", async () => {
    const stream = fakeStream();
    const store = await startWith(stream.response);

    const text = `data: ${JSON.stringify(payload())}\n\n`;
    stream.send(text.slice(0, 20));
    await settle();
    expect(store.getState().tracking.data).toBeNull();

    stream.send(text.slice(20));
    await settle();
    expect(store.getState().tracking.data).toMatchObject({ lat: 22.5726 });
  });

  it("ignores invalid payloads and keeps the last good location", async () => {
    const stream = fakeStream();
    const store = await startWith(stream.response);

    stream.sendEvent(payload());
    stream.send("data: not json\n\n");
    stream.sendEvent({ ...payload(), location: null });
    await settle();

    expect(store.getState().tracking).toMatchObject({
      data: { lat: 22.5726 },
      connected: true,
      error: null,
    });
  });

  it("ignores a late point older than the one shown", async () => {
    const stream = fakeStream();
    const store = await startWith(stream.response);

    stream.sendEvent(payload());
    stream.sendEvent(
      payload({ lat: 1, timestamp: "2026-09-15T12:30:00.000Z" }),
    );
    await settle();

    expect(store.getState().tracking.data).toMatchObject({ lat: 22.5726 });
  });

  it("keeps tracking when driverStatus is missing", async () => {
    const stream = fakeStream();
    const store = await startWith(stream.response);

    stream.sendEvent(payload({ driverStatus: undefined }));
    await settle();

    expect(store.getState().tracking).toMatchObject({
      connected: true,
      data: { lat: 22.5726, driverStatus: null },
    });
  });

  it.each(["COMPLETED", "NOSHOW"])(
    "closes the stream on %s and does not reconnect",
    async (status) => {
      vi.useFakeTimers();
      const stream = fakeStream();
      const store = await startWith(stream.response);

      stream.sendEvent(payload({ driverStatus: status }));
      await settle();

      expect(store.getState().tracking).toMatchObject({
        connected: false,
        data: { driverStatus: status },
      });
      expect(lastSignal().aborted).toBe(true);

      await vi.advanceTimersByTimeAsync(60_000);
      expect(trackingActionMock).toHaveBeenCalledTimes(1);
    },
  );

  it.each([401, 500])(
    "puts an error when the API returns %i",
    async (status) => {
      const store = await startWith(axiosResponse(status, null));
      expect(store.getState().tracking).toMatchObject({
        connected: false,
        loading: false,
        error: `Tracking API failed with status ${status}`,
      });
    },
  );

  it("puts an error when the request throws", async () => {
    const store = await startWith(Promise.reject(new Error("Failed to fetch")));
    expect(store.getState().tracking.error).toBe("Failed to fetch");
  });

  it("puts an error when the network drops mid-stream", async () => {
    const stream = fakeStream();
    const store = await startWith(stream.response);

    stream.sendEvent(payload());
    stream.fail();
    await settle();

    expect(store.getState().tracking).toMatchObject({
      connected: false,
      error: "network down",
      data: { lat: 22.5726 },
    });
  });

  it("marks disconnected when the server closes the stream", async () => {
    const stream = fakeStream();
    const store = await startWith(stream.response);

    stream.sendEvent(payload());
    stream.close();
    await settle();

    expect(store.getState().tracking).toMatchObject({
      connected: false,
      data: { lat: 22.5726 },
    });
  });

  describe("reconnect", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    it("reconnects after the server closes, and keeps the car", async () => {
      const first = fakeStream();
      const second = fakeStream();
      const store = await startWith(first.response);
      trackingActionMock.mockReturnValue(Promise.resolve(second.response));

      first.sendEvent(payload());
      first.close();
      await settle();
      expect(store.getState().tracking).toMatchObject({
        connected: false,
        data: { lat: 22.5726 },
      });

      await vi.advanceTimersByTimeAsync(999);
      expect(trackingActionMock).toHaveBeenCalledTimes(1);

      await vi.advanceTimersByTimeAsync(1);
      await settle();
      expect(trackingActionMock).toHaveBeenCalledTimes(2);
      expect(store.getState().tracking).toMatchObject({
        connected: true,
        error: null,
        data: { lat: 22.5726 },
      });

      second.sendEvent(
        payload({ lat: 22.6, timestamp: "2026-09-15T12:30:20.000Z" }),
      );
      await settle();
      expect(store.getState().tracking.data).toMatchObject({ lat: 22.6 });
    });

    it("backs off 1s, 2s, 4s while the request keeps failing", async () => {
      await startWith(Promise.reject(new Error("Failed to fetch")));
      expect(trackingActionMock).toHaveBeenCalledTimes(1);

      await vi.advanceTimersByTimeAsync(1000);
      expect(trackingActionMock).toHaveBeenCalledTimes(2);

      await vi.advanceTimersByTimeAsync(1999);
      expect(trackingActionMock).toHaveBeenCalledTimes(2);
      await vi.advanceTimersByTimeAsync(1);
      expect(trackingActionMock).toHaveBeenCalledTimes(3);

      await vi.advanceTimersByTimeAsync(4000);
      expect(trackingActionMock).toHaveBeenCalledTimes(4);
    });

    it("resets the backoff after a valid location arrives", async () => {
      const failing = Promise.reject(new Error("Failed to fetch"));
      failing.catch(() => {});
      const stream = fakeStream();
      const store = createAppStore();
      stores.push(store);
      trackingActionMock
        .mockReturnValueOnce(failing)
        .mockReturnValueOnce(Promise.resolve(stream.response))
        .mockReturnValue(new Promise(() => {}));

      store.dispatch(startTracking({ tripID: "T123" }));
      await settle();
      await vi.advanceTimersByTimeAsync(1000); // attempt 2: connects
      await settle();

      stream.sendEvent(payload());
      stream.close();
      await settle();

      await vi.advanceTimersByTimeAsync(1000); // back to 1s, not 2s
      expect(trackingActionMock).toHaveBeenCalledTimes(3);
    });

    it("stopTracking during the wait cancels the reconnect", async () => {
      const store = await startWith(
        Promise.reject(new Error("Failed to fetch")),
      );

      store.dispatch(stopTracking());
      await vi.advanceTimersByTimeAsync(60_000);

      expect(trackingActionMock).toHaveBeenCalledTimes(1);
    });
  });

  it("stopTracking aborts the request", async () => {
    const stream = fakeStream();
    const store = await startWith(stream.response);

    store.dispatch(stopTracking());
    await settle();

    expect(lastSignal().aborted).toBe(true);
    expect(store.getState().tracking).toMatchObject({
      connected: false,
      loading: false,
    });
  });

  it("a new startTracking closes the old stream", async () => {
    const oldStream = fakeStream();
    const store = await startWith(oldStream.response);
    const oldSignal = lastSignal();

    const newStream = fakeStream();
    trackingActionMock.mockReturnValue(Promise.resolve(newStream.response));
    store.dispatch(startTracking({ tripID: "T456" }));
    await settle();

    expect(oldSignal.aborted).toBe(true);
    newStream.sendEvent(payload({ tripID: "T456" }));
    await settle();
    expect(store.getState().tracking.data?.tripID).toBe("T456");
  });
});
