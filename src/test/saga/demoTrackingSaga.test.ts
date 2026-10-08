import { createAppStore } from "@/redux/store";
import { startTracking, stopTracking } from "@/redux/tracking/trackingSlice";
import { trackingAction } from "@/sse/tracking-action";
import { DEMO_INTERVAL_MS } from "@/pages/liveTracking/tracking/constants/tracking";
import { buildDemoPoints } from "@/pages/liveTracking/tracking/mock/demoPoints";

vi.mock("@/pages/liveTracking/tracking/constants/tracking", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  USE_DEMO_TRACKING: true,
}));

vi.mock("@/sse/tracking-action", () => ({ trackingAction: vi.fn() }));

const pointCount = buildDemoPoints("T123", 0, DEMO_INTERVAL_MS).length;

const start = () => {
  const store = createAppStore();
  store.dispatch(startTracking({ tripID: "T123" }));
  return store;
};

beforeEach(() => {
  vi.useFakeTimers();
  vi.spyOn(console, "log").mockImplementation(() => {});
});

afterEach(() => {
  vi.useRealTimers();
});

describe("demo tracking", () => {
  it("does not call the real API", async () => {
    start();
    await vi.advanceTimersByTimeAsync(DEMO_INTERVAL_MS * 3);
    expect(trackingAction).not.toHaveBeenCalled();
  });

  it("puts the first demo point into redux right away", async () => {
    const store = start();
    await vi.advanceTimersByTimeAsync(0);

    expect(store.getState().tracking).toMatchObject({ connected: true, loading: false });
    expect(store.getState().tracking.data).toMatchObject({ tripID: "T123", driverStatus: "ENROUTE" });
  });

  it("moves to the next point every interval", async () => {
    const store = start();
    await vi.advanceTimersByTimeAsync(0);
    const first = store.getState().tracking.data!;

    await vi.advanceTimersByTimeAsync(DEMO_INTERVAL_MS);
    const second = store.getState().tracking.data!;

    expect(second).not.toEqual(first);
    expect([second.lat, second.lng]).not.toEqual([first.lat, first.lng]);
  });

  it("ends with COMPLETED and disconnects", async () => {
    const store = start();
    await vi.advanceTimersByTimeAsync(DEMO_INTERVAL_MS * pointCount);

    expect(store.getState().tracking).toMatchObject({
      connected: false,
      data: { driverStatus: "COMPLETED" },
    });
  });

  it("stopTracking stops the demo", async () => {
    const store = start();
    await vi.advanceTimersByTimeAsync(DEMO_INTERVAL_MS);
    store.dispatch(stopTracking());
    const frozen = store.getState().tracking.data;

    await vi.advanceTimersByTimeAsync(DEMO_INTERVAL_MS * 5);
    expect(store.getState().tracking.data).toBe(frozen);
  });
});
