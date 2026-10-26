import { act, render } from "@testing-library/react";
import FollowDriver from "@/pages/liveTracking/tracking/components/FollowDriver";
import { FOLLOW_PAUSE_AFTER_DRAG_MS } from "@/pages/liveTracking/tracking/constants/tracking";

const CAR = { lat: 22.5726, lng: 88.3639 };

/** Google map stand-in: getCenter / moveCamera / addListener. */
const createFakeMap = (center: { lat: number; lng: number }) => {
  const listeners: Record<string, () => void> = {};
  const map = {
    center: { ...center },
    getCenter: () => ({ lat: () => map.center.lat, lng: () => map.center.lng }),
    moveCamera: vi.fn((options: { center: { lat: number; lng: number } }) => {
      map.center = { ...options.center };
    }),
    removeListener: vi.fn(),
    addListener: vi.fn((event: string, handler: () => void) => {
      listeners[event] = handler;
      return { remove: map.removeListener };
    }),
    fire: (event: string) => listeners[event]?.(),
  };
  return map;
};

let mapInstance: ReturnType<typeof createFakeMap> | null = null;

vi.mock("@vis.gl/react-google-maps", () => ({
  useMap: () => mapInstance,
}));

const run = (ms: number) =>
  act(() => {
    vi.advanceTimersByTime(ms);
  });

beforeEach(() => {
  vi.useFakeTimers();
  // ~110 m south of the car.
  mapInstance = createFakeMap({ lat: 22.5716, lng: 88.3639 });
});

afterEach(() => {
  vi.useRealTimers();
});

describe("FollowDriver", () => {
  it("does nothing without a position", () => {
    render(<FollowDriver position={null} />);
    run(500);
    expect(mapInstance!.moveCamera).not.toHaveBeenCalled();
  });

  it("glides the camera a share of the way each frame, then settles on the car", () => {
    render(<FollowDriver position={CAR} />);
    run(16);
    const firstStep = mapInstance!.center.lat;
    expect(firstStep).toBeGreaterThan(22.5716);
    expect(firstStep).toBeLessThan(CAR.lat);

    run(2000);
    expect(mapInstance!.center.lat).toBeCloseTo(CAR.lat, 6);

    // On the car: no more camera moves while it stands.
    const calls = mapInstance!.moveCamera.mock.calls.length;
    run(500);
    expect(mapInstance!.moveCamera.mock.calls.length).toBe(calls);
  });

  it("jumps straight to a car that is far away", () => {
    mapInstance = createFakeMap({ lat: 22.0, lng: 88.0 });
    render(<FollowDriver position={CAR} />);
    run(16);
    expect(mapInstance!.center).toEqual(CAR);
  });

  it("follows the car as it moves", () => {
    const { rerender } = render(<FollowDriver position={CAR} />);
    run(2000);
    rerender(<FollowDriver position={{ lat: 22.5736, lng: 88.3639 }} />);
    run(2000);
    expect(mapInstance!.center.lat).toBeCloseTo(22.5736, 6);
  });

  it("stops following after a drag, then glides back", () => {
    render(<FollowDriver position={CAR} />);
    run(2000);

    act(() => mapInstance!.fire("dragstart"));
    mapInstance!.center = { lat: 22.5, lng: 88.3 }; // the user dragged away
    run(FOLLOW_PAUSE_AFTER_DRAG_MS - 100);
    expect(mapInstance!.center).toEqual({ lat: 22.5, lng: 88.3 });

    run(3000);
    expect(mapInstance!.center.lat).toBeCloseTo(CAR.lat, 6);
  });

  it("waits for the map to be ready", () => {
    const map = mapInstance!;
    mapInstance = null;
    const { rerender } = render(<FollowDriver position={CAR} />);
    run(100);
    expect(map.moveCamera).not.toHaveBeenCalled();

    mapInstance = map;
    rerender(<FollowDriver position={CAR} />);
    run(100);
    expect(map.moveCamera).toHaveBeenCalled();
  });

  it("removes its drag listener on unmount", () => {
    const { unmount } = render(<FollowDriver position={CAR} />);
    unmount();
    expect(mapInstance!.removeListener).toHaveBeenCalled();
  });

  it("renders nothing", () => {
    const { container } = render(<FollowDriver position={CAR} />);
    expect(container).toBeEmptyDOMElement();
  });
});
