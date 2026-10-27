import { render } from "@testing-library/react";
import RoutePolyline from "@/pages/liveTracking/tracking/components/RoutePolyline";
import {
  ROUTE_CASING_WEIGHT,
  ROUTE_STROKE_WEIGHT,
} from "@/pages/liveTracking/tracking/constants/map";

type LatLng = { lat: number; lng: number };

class FakeLatLng {
  private p: LatLng;
  constructor(p: LatLng) {
    this.p = p;
  }
  lat = () => this.p.lat;
  lng = () => this.p.lng;
}

/** MVCArray stand-in that counts the changes made to it. */
class FakeMVCArray {
  items: FakeLatLng[] = [];
  ops = { clear: 0, push: 0, removeAt: 0, setAt: 0 };
  getLength = () => this.items.length;
  getAt = (i: number) => this.items[i];
  clear = () => {
    this.ops.clear++;
    this.items = [];
  };
  push = (p: FakeLatLng) => {
    this.ops.push++;
    this.items.push(p);
  };
  removeAt = (i: number) => {
    this.ops.removeAt++;
    this.items.splice(i, 1);
  };
  setAt = (i: number, p: FakeLatLng) => {
    this.ops.setAt++;
    this.items[i] = p;
  };
  toPoints = () => this.items.map((p) => ({ lat: p.lat(), lng: p.lng() }));
}

const lines: {
  setOptions: ReturnType<typeof vi.fn>;
  setMap: ReturnType<typeof vi.fn>;
  init: { path: FakeMVCArray; strokeWeight: number };
}[] = [];

class FakePolyline {
  setOptions = vi.fn();
  setMap = vi.fn();
  init: { path: FakeMVCArray; strokeWeight: number };
  constructor(init: { path: FakeMVCArray; strokeWeight: number }) {
    this.init = init;
    lines.push(this);
  }
}

// Stable like the real hooks: a new map would recreate the lines.
const fakeMap = {};
const fakeMapsLibrary = { Polyline: FakePolyline };

vi.mock("@vis.gl/react-google-maps", () => ({
  useMap: () => fakeMap,
  useMapsLibrary: () => fakeMapsLibrary,
}));

vi.stubGlobal("google", { maps: { LatLng: FakeLatLng, MVCArray: FakeMVCArray } });

const PATH = [
  { lat: 22.57, lng: 88.4 },
  { lat: 22.57, lng: 88.401 },
  { lat: 22.57, lng: 88.402 },
];

const path = () => lines[0].init.path;
const casing = () => lines.find((l) => l.init.strokeWeight === ROUTE_CASING_WEIGHT)!;
const line = () => lines.find((l) => l.init.strokeWeight === ROUTE_STROKE_WEIGHT)!;

beforeEach(() => {
  lines.length = 0;
});

describe("RoutePolyline", () => {
  it("draws the points as a line on a casing sharing one path", () => {
    render(<RoutePolyline points={PATH} />);

    expect(lines).toHaveLength(2);
    expect(casing().init.path).toBe(line().init.path);
    expect(path().toPoints()).toEqual(PATH);
    expect(line().setOptions.mock.lastCall![0]).toMatchObject({ strokeOpacity: 0.9 });
  });

  it("only moves the first point and drops passed ones as the car drives", () => {
    const { rerender } = render(<RoutePolyline points={PATH} />);
    path().ops = { clear: 0, push: 0, removeAt: 0, setAt: 0 };

    const car = { lat: 22.57, lng: 88.4005 };
    rerender(<RoutePolyline points={[car, PATH[1], PATH[2]]} />);
    expect(path().ops).toEqual({ clear: 0, push: 0, removeAt: 0, setAt: 1 });

    const passed = { lat: 22.57, lng: 88.4015 };
    rerender(<RoutePolyline points={[passed, PATH[2]]} />);
    expect(path().ops).toEqual({ clear: 0, push: 0, removeAt: 1, setAt: 2 });
    expect(path().toPoints()).toEqual([passed, PATH[2]]);
  });

  it("replaces the path for a new route", () => {
    const { rerender } = render(<RoutePolyline points={PATH} />);
    const other = [{ lat: 22.5, lng: 88.3 }, PATH[2]];
    rerender(<RoutePolyline points={other} />);
    expect(path().toPoints()).toEqual(other);
  });

  it("dims the route while rerouting and reuses the same lines", () => {
    const { rerender } = render(<RoutePolyline points={PATH} />);
    rerender(<RoutePolyline points={PATH} rerouting />);

    expect(lines).toHaveLength(2);
    expect(line().setOptions.mock.lastCall![0]).toMatchObject({ strokeOpacity: 0.35 });
  });

  it("draws nothing below 2 points and removes the lines on unmount", () => {
    const { unmount } = render(<RoutePolyline points={[PATH[0]]} />);
    expect(path().getLength()).toBe(0);

    unmount();
    lines.forEach((l) => expect(l.setMap).toHaveBeenCalledWith(null));
  });
});
