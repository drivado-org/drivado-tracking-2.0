import { render } from "@testing-library/react";
import GeofenceArea from "@/pages/liveTracking/tracking/components/GeofenceArea";
import { GEOFENCE_RADIUS_METERS } from "@/pages/liveTracking/tracking/constants/tracking";

const circles: { setOptions: ReturnType<typeof vi.fn>; setMap: ReturnType<typeof vi.fn>; init: unknown }[] = [];

class FakeCircle {
  setOptions = vi.fn();
  setMap = vi.fn();
  init: unknown;
  constructor(init: unknown) {
    this.init = init;
    circles.push(this);
  }
}

// Stable like the real hooks: a new map would recreate the circle.
const fakeMap = {};
const fakeMapsLibrary = { Circle: FakeCircle };

vi.mock("@vis.gl/react-google-maps", () => ({
  useMap: () => fakeMap,
  useMapsLibrary: () => fakeMapsLibrary,
}));

const CENTER = { lat: 22.58, lng: 88.45 };

beforeEach(() => {
  circles.length = 0;
});

describe("GeofenceArea", () => {
  it("draws the radius around the center", () => {
    render(<GeofenceArea center={CENTER} />);

    expect(circles).toHaveLength(1);
    expect(circles[0].init).toMatchObject({ radius: GEOFENCE_RADIUS_METERS });
    expect(circles[0].setOptions.mock.lastCall![0]).toMatchObject({
      center: CENTER,
      visible: true,
      fillOpacity: 0.1,
    });
  });

  it("draws darker while the car is inside and reuses the same circle", () => {
    const { rerender } = render(<GeofenceArea center={CENTER} />);
    rerender(<GeofenceArea center={CENTER} active />);

    expect(circles).toHaveLength(1);
    expect(circles[0].setOptions.mock.lastCall![0]).toMatchObject({
      fillOpacity: 0.16,
      strokeOpacity: 0.8,
    });
  });

  it("hides without a center and removes the circle on unmount", () => {
    const { unmount } = render(<GeofenceArea center={null} />);
    expect(circles[0].setOptions.mock.lastCall![0].visible).toBe(false);

    unmount();
    expect(circles[0].setMap).toHaveBeenCalledWith(null);
  });
});
