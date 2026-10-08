import type { AxiosResponse } from "axios";
import { trackingAction } from "@/sse/tracking-action";
import { createAppStore } from "@/redux/store";
import { startTracking, stopTracking } from "@/redux/tracking/trackingSlice";

vi.mock("@/pages/liveTracking/tracking/constants/tracking", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  USE_DEMO_TRACKING: false,
}));

vi.mock("@/sse/tracking-action", () => ({ trackingAction: vi.fn() }));

const trackingActionMock = vi.mocked(trackingAction);

/** What axios returns with responseType "stream": the body is in data. */
const axiosResponse = (status: number, data: ReadableStream<Uint8Array> | null) =>
  ({ status, data }) as unknown as AxiosResponse<ReadableStream<Uint8Array>>;

/** A server stream the test writes to. */
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
    sendEvent: (data: unknown) =>
      controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`)),
    close: () => controller.close(),
    fail: () => controller.error(new Error("network down")),
  };
};

const payload = (overrides: Record<string, unknown> = {}) => ({
  driverID: "DRIVER_123",
  bookingID: "B1",
  tripID: "T123",
  tripType: "TRIP_S",
  driverStatus: "ENROUTE",
  lat: 22.5726,
  lng: 88.3639,
  timestamp: "2026-09-15T12:30:15.000Z",
  sequence: 1,
  ...overrides,
});

/** Let fetch promises, stream reads and saga effects run. */
const settle = async () => {
  for (let i = 0; i < 5; i++) await new Promise((resolve) => setTimeout(resolve, 0));
};

const lastSignal = () => trackingActionMock.mock.lastCall?.[1] as AbortSignal;

const startWith = async (
  response: AxiosResponse<ReadableStream<Uint8Array>> | Promise<never>,
) => {
  trackingActionMock.mockReturnValue(Promise.resolve(response));
  const store = createAppStore();
  store.dispatch(startTracking({ tripID: "T123", token: "Bearer abc" }));
  await settle();
  return store;
};

beforeEach(() => {
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("trackingSaga", () => {
  it("calls the API with the trip and token", async () => {
    const stream = fakeStream();
    const store = await startWith(stream.response);

    expect(trackingActionMock).toHaveBeenCalledWith(
      { tripID: "T123", token: "Bearer abc" },
      expect.any(AbortSignal),
    );
    expect(store.getState().tracking).toMatchObject({ connected: true, loading: false });
  });

  it("puts each location into redux", async () => {
    const stream = fakeStream();
    const store = await startWith(stream.response);

    stream.sendEvent(payload());
    await settle();
    expect(store.getState().tracking.data).toMatchObject({ lat: 22.5726, lng: 88.3639 });

    stream.sendEvent(payload({ lat: 22.5736 }));
    await settle();
    expect(store.getState().tracking.data).toMatchObject({ lat: 22.5736 });
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
    stream.sendEvent(payload({ lat: undefined }));
    await settle();

    expect(store.getState().tracking).toMatchObject({
      data: { lat: 22.5726 },
      connected: true,
      error: null,
    });
  });

  it.each(["COMPLETED", "NOSHOW"])("closes the stream on %s", async (status) => {
    const stream = fakeStream();
    const store = await startWith(stream.response);

    stream.sendEvent(payload({ driverStatus: status }));
    await settle();

    expect(store.getState().tracking).toMatchObject({
      connected: false,
      data: { driverStatus: status },
    });
    expect(lastSignal().aborted).toBe(true);
  });

  it.each([401, 500])("puts an error when the API returns %i", async (status) => {
    const store = await startWith(axiosResponse(status, null));
    expect(store.getState().tracking).toMatchObject({
      connected: false,
      loading: false,
      error: `Tracking API failed with status ${status}`,
    });
  });

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

    expect(store.getState().tracking).toMatchObject({ connected: false, data: { lat: 22.5726 } });
  });

  it("stopTracking aborts the request", async () => {
    const stream = fakeStream();
    const store = await startWith(stream.response);

    store.dispatch(stopTracking());
    await settle();

    expect(lastSignal().aborted).toBe(true);
    expect(store.getState().tracking).toMatchObject({ connected: false, loading: false });
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
