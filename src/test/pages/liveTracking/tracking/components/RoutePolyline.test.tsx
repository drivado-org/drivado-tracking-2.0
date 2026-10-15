import { render } from "@testing-library/react";
import RoutePolyline from "@/pages/liveTracking/tracking/components/RoutePolyline";

const lines: { setOptions: ReturnType<typeof vi.fn>; setMap: ReturnType<typeof vi.fn>; init: unknown }[] = [];

class FakePolyline {
  setOptions = vi.fn();
  setMap = vi.fn();
  init: unknown;
  constructor(init: unknown) {
    this.init = init;
    lines.push(this);
  }
}

// Stable like the real hooks: a new map would recreate the line.
const fakeMap = {};
const fakeMapsLibrary = { Polyline: FakePolyline };

vi.mock("@vis.gl/react-google-maps", () => ({
  useMap: () => fakeMap,
  useMapsLibrary: () => fakeMapsLibrary,
}));

const PATH = [
  { lat: 22.57, lng: 88.4 },
  { lat: 22.57, lng: 88.401 },
  { lat: 22.57, lng: 88.402 },
];

beforeEach(() => {
  lines.length = 0;
});

describe("RoutePolyline", () => {
  it("draws the route ahead of the car", () => {
    render(<RoutePolyline path={PATH} carPosition={{ lat: 22.57, lng: 88.4015 }} />);

    expect(lines).toHaveLength(1);
    const { path, strokeOpacity } = lines[0].setOptions.mock.lastCall![0];
    expect(path).toHaveLength(2);
    expect(path[0].lng).toBeCloseTo(88.4015, 6);
    expect(strokeOpacity).toBe(0.85);
  });

  it("dims the route while rerouting and reuses the same line", () => {
    const { rerender } = render(<RoutePolyline path={PATH} carPosition={null} />);
    rerender(<RoutePolyline path={PATH} carPosition={null} rerouting />);

    expect(lines).toHaveLength(1);
    expect(lines[0].setOptions.mock.lastCall![0]).toMatchObject({
      path: PATH,
      strokeOpacity: 0.35,
    });
  });

  it("draws nothing without a route and removes the line on unmount", () => {
    const { unmount } = render(<RoutePolyline path={null} carPosition={null} />);
    expect(lines[0].setOptions.mock.lastCall![0].path).toEqual([]);

    unmount();
    expect(lines[0].setMap).toHaveBeenCalledWith(null);
  });
});
