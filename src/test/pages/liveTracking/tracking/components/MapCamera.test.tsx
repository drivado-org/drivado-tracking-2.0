import { act, fireEvent, render } from "@testing-library/react";
import type { ComponentProps } from "react";
import MapCamera from "@/pages/liveTracking/tracking/components/MapCamera";
import {
  APPROACH_ZOOM,
  AUTO_FOLLOW_MS,
  FOLLOW_ZOOM,
  JOURNEY_MAX_ZOOM,
  ROUTE_FLY_MS,
} from "@/pages/liveTracking/tracking/constants/tracking";

type LatLng = { lat: number; lng: number };

const CAR = { lat: 22.5726, lng: 88.3639 };
const DROP_OFF = { lat: 22.5826, lng: 88.3739 }; // ~1.5 km away
const ROUTE = [{ lat: 22.56, lng: 88.35 }, CAR, DROP_OFF];

/** Google map stand-in: a camera, a sized div and the drag listener. */
const createFakeMap = (center: LatLng, zoom = 15) => {
  const listeners: Record<string, () => void> = {};
  const div = document.createElement("div");
  Object.defineProperty(div, "clientWidth", { value: 400 });
  Object.defineProperty(div, "clientHeight", { value: 600 });
  const map = {
    center: { ...center },
    zoom,
    getCenter: () => ({ lat: () => map.center.lat, lng: () => map.center.lng }),
    getZoom: () => map.zoom,
    getDiv: () => div,
    moveCamera: vi.fn((camera: { center?: LatLng; zoom?: number }) => {
      if (camera.center) map.center = { ...camera.center };
      if (camera.zoom !== undefined) map.zoom = camera.zoom;
    }),
    removeListener: vi.fn(),
    addListener: vi.fn((event: string, handler: () => void) => {
      listeners[event] = handler;
      return { remove: map.removeListener };
    }),
    fire: (event: string) => act(() => listeners[event]?.()),
  };
  return map;
};

let mapInstance: ReturnType<typeof createFakeMap> | null = null;
const map = () => mapInstance!;

vi.mock("@vis.gl/react-google-maps", () => ({
  useMap: () => mapInstance,
}));

const run = (ms: number) =>
  act(() => {
    vi.advanceTimersByTime(ms);
  });

type Props = ComponentProps<typeof MapCamera>;
const props = (overrides: Partial<Props> = {}): Props => ({
  mode: "journey",
  tap: 0,
  car: CAR,
  ahead: [CAR, DROP_OFF],
  route: ROUTE,
  dropOff: DROP_OFF,
  onModeChange: vi.fn(),
  onNotice: vi.fn(),
  ...overrides,
});

beforeEach(() => {
  vi.useFakeTimers();
  // ~110 m south of the car.
  mapInstance = createFakeMap({ lat: 22.5716, lng: 88.3639 });
});

afterEach(() => {
  vi.useRealTimers();
});

describe("MapCamera", () => {
  it("renders nothing and leaves the camera alone without a car", () => {
    const { container } = render(<MapCamera {...props({ car: null })} />);
    run(500);
    expect(container).toBeEmptyDOMElement();
    expect(map().moveCamera).not.toHaveBeenCalled();
  });

  describe("journey view", () => {
    it("glides to frame the car and the drop-off together", () => {
      render(<MapCamera {...props()} />);
      run(50);
      const early = map().center.lat;
      expect(early).toBeGreaterThan(22.5716);

      run(5000);
      // Settled between the car and the drop-off, which are both inside the view.
      expect(map().center.lat).toBeGreaterThan(CAR.lat);
      expect(map().center.lat).toBeLessThan(DROP_OFF.lat);
      expect(map().zoom).toBeLessThan(JOURNEY_MAX_ZOOM);

      // Settled: no more camera moves while nothing changes.
      const calls = map().moveCamera.mock.calls.length;
      run(500);
      expect(map().moveCamera.mock.calls.length).toBe(calls);
    });

    it("tightens as the car nears the drop-off", () => {
      const { rerender } = render(<MapCamera {...props()} />);
      run(5000);
      const far = map().zoom;

      const near = { lat: 22.5816, lng: 88.3729 };
      rerender(<MapCamera {...props({ car: near, ahead: [near, DROP_OFF] })} />);
      run(5000);
      expect(map().zoom).toBeGreaterThan(far);
      expect(map().zoom).toBeLessThanOrEqual(JOURNEY_MAX_ZOOM);
    });

    it("zooms in past the usual cap when the car is almost there", () => {
      const close = { lat: 22.5822, lng: 88.3735 }; // ~60 m from the drop-off
      const closeProps = { car: close, ahead: [close, DROP_OFF] };
      const { rerender } = render(<MapCamera {...props(closeProps)} />);
      run(5000);
      expect(map().zoom).toBeCloseTo(JOURNEY_MAX_ZOOM, 2);

      rerender(<MapCamera {...props({ ...closeProps, approaching: true })} />);
      run(5000);
      expect(map().zoom).toBeGreaterThan(JOURNEY_MAX_ZOOM);
      expect(map().zoom).toBeLessThanOrEqual(APPROACH_ZOOM);
    });

    it("jumps to a car that is far away", () => {
      mapInstance = createFakeMap({ lat: 22.0, lng: 88.0 });
      render(<MapCamera {...props()} />);
      run(50);
      expect(map().center.lat).toBeGreaterThan(22.5);
    });

    it("hands the map to the user on a pinch or wheel", () => {
      const onModeChange = vi.fn();
      render(<MapCamera {...props({ onModeChange })} />);

      fireEvent.touchStart(map().getDiv(), { touches: [{}] });
      expect(onModeChange).not.toHaveBeenCalled(); // one finger is a drag, handled below

      fireEvent.touchStart(map().getDiv(), { touches: [{}, {}] });
      expect(onModeChange).toHaveBeenCalledWith("free");
    });

    it("hands the map to the user on a mouse wheel", () => {
      const onModeChange = vi.fn();
      render(<MapCamera {...props({ onModeChange })} />);
      fireEvent.wheel(map().getDiv());
      expect(onModeChange).toHaveBeenCalledWith("free");
    });
  });

  describe("lock on the car", () => {
    it("jumps onto the car at the lock zoom when tapped", () => {
      const { rerender } = render(<MapCamera {...props()} />);
      rerender(<MapCamera {...props({ mode: "follow", tap: 1 })} />);
      expect(map().moveCamera).toHaveBeenLastCalledWith({ center: CAR, zoom: FOLLOW_ZOOM });
    });

    it("follows the car as it moves, keeping the user's zoom", () => {
      const { rerender } = render(<MapCamera {...props({ mode: "follow", tap: 1 })} />);
      map().zoom = 18; // pinched in
      const moved = { lat: 22.5736, lng: 88.3639 };
      rerender(<MapCamera {...props({ mode: "follow", tap: 1, car: moved })} />);
      run(2000);
      expect(map().center.lat).toBeCloseTo(moved.lat, 6);
      expect(map().zoom).toBe(18);
    });

    it("zooms in once when the car is almost there", () => {
      const followProps = { mode: "follow" as const, tap: 1 };
      const { rerender } = render(<MapCamera {...props(followProps)} />);
      expect(map().zoom).toBe(FOLLOW_ZOOM);

      rerender(<MapCamera {...props({ ...followProps, approaching: true })} />);
      run(AUTO_FOLLOW_MS + 100);
      expect(map().zoom).toBe(APPROACH_ZOOM);

      // Pinched back out: it stays where the user put it.
      map().zoom = 16;
      run(2000);
      expect(map().zoom).toBe(16);
    });

    it("keeps the lock through a pinch", () => {
      const onModeChange = vi.fn();
      render(<MapCamera {...props({ mode: "follow", onModeChange })} />);
      fireEvent.touchStart(map().getDiv(), { touches: [{}, {}] });
      expect(onModeChange).not.toHaveBeenCalled();
    });
  });

  describe("whole route", () => {
    it("glides to the whole route when tapped, then stays put", () => {
      const { rerender } = render(<MapCamera {...props()} />);
      run(5000);
      const journeyZoom = map().zoom;
      // The car has not set off yet: the whole route is still ahead of it.
      rerender(<MapCamera {...props({ mode: "route", tap: 1, ahead: ROUTE })} />);

      // Part way, then there: the route starts further south than the journey view shows.
      run(ROUTE_FLY_MS / 2);
      const halfway = map().zoom;
      expect(halfway).toBeLessThan(journeyZoom);
      run(ROUTE_FLY_MS);
      expect(map().zoom).toBeLessThan(halfway);

      const calls = map().moveCamera.mock.calls.length;
      run(500);
      expect(map().moveCamera.mock.calls.length).toBe(calls);
    });

    it("centres the route on the map, even under a notice", () => {
      // A route straight north-south through the middle of the map.
      const route = [
        { lat: 22.56, lng: 88.37 },
        { lat: 22.58, lng: 88.37 },
      ];
      render(
        <MapCamera
          {...props({
            mode: "route",
            tap: 1,
            car: route[0],
            ahead: route,
            route,
            dropOff: route[1],
            topInset: 68,
          })}
        />,
      );
      run(ROUTE_FLY_MS + 100);
      expect(map().center.lat).toBeCloseTo(22.57, 3);
      expect(map().center.lng).toBeCloseTo(88.37, 6);
    });

    it("centres the road still ahead, leaving out the part already driven", () => {
      const ahead = [
        { lat: 22.56, lng: 88.37 },
        { lat: 22.58, lng: 88.37 },
      ];
      // Driven already, far to the south-west: not drawn, so not framed.
      const route = [{ lat: 22.5, lng: 88.3 }, ...ahead];
      render(
        <MapCamera
          {...props({ mode: "route", tap: 1, car: ahead[0], ahead, route, dropOff: ahead[1] })}
        />,
      );
      run(ROUTE_FLY_MS + 100);
      expect(map().center.lat).toBeCloseTo(22.57, 3);
      expect(map().center.lng).toBeCloseTo(88.37, 6);
    });

    it("glides to a new route", () => {
      const { rerender } = render(<MapCamera {...props({ mode: "route", tap: 1 })} />);
      run(ROUTE_FLY_MS + 100);
      const before = { ...map().center };
      rerender(
        <MapCamera
          {...props({
            mode: "route",
            tap: 1,
            car: { lat: 22.5, lng: 88.3 },
            ahead: [{ lat: 22.5, lng: 88.3 }, DROP_OFF],
            route: [{ lat: 22.5, lng: 88.3 }, DROP_OFF],
          })}
        />,
      );
      run(ROUTE_FLY_MS + 100);
      expect(map().center.lat).toBeLessThan(before.lat);
    });

    it("stops gliding to the route on a drag", () => {
      render(<MapCamera {...props({ mode: "route", tap: 1 })} />);
      run(100);
      map().fire("dragstart");
      const calls = map().moveCamera.mock.calls.length;
      run(ROUTE_FLY_MS);
      expect(map().moveCamera.mock.calls.length).toBe(calls);
    });

    it("glides onto the car near the drop-off, once", () => {
      const onModeChange = vi.fn();
      const onNotice = vi.fn();
      const near = { lat: 22.5776, lng: 88.3689 }; // ~750 m before the drop-off
      const nearProps = { mode: "route" as const, tap: 1, car: near, ahead: [near, DROP_OFF] };
      const { rerender } = render(<MapCamera {...props({ ...nearProps, onModeChange, onNotice })} />);
      run(50);

      expect(onModeChange).toHaveBeenCalledWith("follow");
      expect(onNotice).toHaveBeenCalledWith({
        text: "Approaching drop-off — following the vehicle",
        icon: "lock",
      });

      // Part way: neither where it was nor on the car yet.
      run(AUTO_FOLLOW_MS / 2);
      expect(map().zoom).toBeLessThan(FOLLOW_ZOOM);
      run(AUTO_FOLLOW_MS);
      expect(map().center).toEqual(near);
      expect(map().zoom).toBe(FOLLOW_ZOOM);

      // Back to the whole route by hand: it stays there.
      rerender(<MapCamera {...props({ ...nearProps, tap: 2, onModeChange, onNotice })} />);
      run(500);
      expect(onModeChange).toHaveBeenCalledTimes(1);
    });
  });

  it("hands the map to the user on a drag from any view", () => {
    const onModeChange = vi.fn();
    render(<MapCamera {...props({ mode: "follow", onModeChange })} />);
    map().fire("dragstart");
    expect(onModeChange).toHaveBeenCalledWith("free");

    // Already free: the camera stays where the user put it.
    run(2000);
    expect(map().moveCamera).not.toHaveBeenCalled();
  });

  it("waits for the map to be ready", () => {
    const ready = map();
    mapInstance = null;
    const { rerender } = render(<MapCamera {...props()} />);
    run(100);
    expect(ready.moveCamera).not.toHaveBeenCalled();

    mapInstance = ready;
    rerender(<MapCamera {...props()} />);
    run(100);
    expect(ready.moveCamera).toHaveBeenCalled();
  });

  it("removes its listeners on unmount", () => {
    const { unmount } = render(<MapCamera {...props()} />);
    unmount();
    expect(map().removeListener).toHaveBeenCalled();
  });
});
