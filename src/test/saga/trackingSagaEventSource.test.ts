import { trackingAction } from "@/server/sse/tracking-action";
import { createAppStore } from "@/store";
import { startTracking, stopTracking } from "@/store/tracking/trackingSlice";

vi.mock("@/server/sse/tracking-action", () => ({
  trackingAction: vi.fn(),
  buildTripStreamUrl: (tripId: string) => `/realtime/trips/${tripId}/stream`,
}));

/** Just enough of EventSource: tests fire open / named events / error by hand. */
class FakeEventSource extends EventTarget {
  static instances: FakeEventSource[] = [];
  onopen: (() => void) | null = null;
  onerror: (() => void) | null = null;
  closed = false;
  url: string;

  constructor(url: string) {
    super();
    this.url = url;
    FakeEventSource.instances.push(this);
  }

  close() {
    this.closed = true;
  }

  open() {
    this.onopen?.();
  }

  send(data: unknown, event = "message") {
    this.dispatchEvent(new MessageEvent(event, { data: JSON.stringify(data) }));
  }

  fail() {
    this.onerror?.();
  }
}

const latest = () => FakeEventSource.instances.at(-1)!;

const settle = async () => {
  for (let i = 0; i < 5; i++) await vi.advanceTimersByTimeAsync(0);
};

const stores: ReturnType<typeof createAppStore>[] = [];

const start = async () => {
  const store = createAppStore();
  stores.push(store);
  store.dispatch(startTracking({ tripID: "T123" }));
  await settle();
  return store;
};

beforeEach(() => {
  vi.useFakeTimers();
  FakeEventSource.instances = [];
  vi.stubGlobal("EventSource", FakeEventSource);
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  stores.splice(0).forEach((store) => store.dispatch(stopTracking()));
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("trackingSaga over EventSource", () => {
  it("opens the trip stream with EventSource, not fetch", async () => {
    await start();

    expect(latest().url).toBe("/realtime/trips/T123/stream");
    expect(trackingAction).not.toHaveBeenCalled();
  });

  it("is connected once the stream opens", async () => {
    const store = await start();
    expect(store.getState().tracking.connected).toBe(false);

    latest().open();
    await settle();

    expect(store.getState().tracking.connected).toBe(true);
  });

  it("moves the car on a location event", async () => {
    const store = await start();
    latest().open();
    latest().send(
      { Lat: 22.47128, Lng: 88.38932, Timestamp: "2026-10-15T07:18:32.059547Z" },
      "location",
    );
    await settle();

    expect(store.getState().tracking.points.at(-1)).toMatchObject({
      lat: 22.47128,
      lng: 88.38932,
      timestamp: "2026-10-15T07:18:32.059Z",
    });
  });

  it("closes a dropped stream and reconnects after the backoff", async () => {
    await start();
    const first = latest();
    first.open();
    first.fail();
    await settle();

    expect(first.closed).toBe(true);
    expect(FakeEventSource.instances).toHaveLength(1);

    await vi.advanceTimersByTimeAsync(1000);
    await settle();
    expect(FakeEventSource.instances).toHaveLength(2);
  });

  it("reports an error when the stream never opens", async () => {
    const store = await start();
    latest().fail();
    await settle();

    expect(store.getState().tracking.error).toBe("Tracking SSE stream is not available");
  });

  it("closes the stream on stopTracking", async () => {
    const store = await start();
    store.dispatch(stopTracking());
    await settle();

    expect(latest().closed).toBe(true);
  });
});
