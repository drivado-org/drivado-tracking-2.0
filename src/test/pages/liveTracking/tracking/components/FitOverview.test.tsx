import { render } from "@testing-library/react";
import FitOverview from "@/pages/liveTracking/tracking/components/FitOverview";
import { OVERVIEW_PADDING_PX } from "@/pages/liveTracking/tracking/constants/tracking";

const CAR = { lat: 22.57, lng: 88.4 };
const DROP_OFF = { lat: 22.58, lng: 88.42 };

type Bounds = { north: number; south: number; east: number; west: number };

/** Google map stand-in: what is on screen follows the last fitBounds. */
const createFakeMap = () => {
  const listeners: Record<string, () => void> = {};
  const map = {
    visible: null as Bounds | null,
    getBounds: () =>
      map.visible && {
        contains: ({ lat, lng }: { lat: number; lng: number }) =>
          lat <= map.visible!.north &&
          lat >= map.visible!.south &&
          lng <= map.visible!.east &&
          lng >= map.visible!.west,
      },
    fitBounds: vi.fn((bounds: Bounds) => {
      map.visible = bounds;
    }),
    panTo: vi.fn(),
    addListener: vi.fn((event: string, handler: () => void) => {
      listeners[event] = handler;
      return { remove: vi.fn() };
    }),
    fire: (event: string) => listeners[event]?.(),
  };
  return map;
};

let mapInstance: ReturnType<typeof createFakeMap>;

vi.mock("@vis.gl/react-google-maps", () => ({
  useMap: () => mapInstance,
}));

beforeEach(() => {
  mapInstance = createFakeMap();
});

describe("FitOverview", () => {
  it("fits the car and the drop-off when shown", () => {
    render(<FitOverview car={CAR} dropOff={DROP_OFF} />);
    expect(mapInstance.fitBounds).toHaveBeenCalledWith(
      { north: 22.58, south: 22.57, east: 88.42, west: 88.4 },
      OVERVIEW_PADDING_PX,
    );
  });

  it("does not refit while both stay on screen", () => {
    const { rerender } = render(<FitOverview car={CAR} dropOff={DROP_OFF} />);
    rerender(<FitOverview car={{ lat: 22.575, lng: 88.41 }} dropOff={DROP_OFF} />);
    expect(mapInstance.fitBounds).toHaveBeenCalledTimes(1);
  });

  it("refits when the car leaves the screen", () => {
    const { rerender } = render(<FitOverview car={CAR} dropOff={DROP_OFF} />);
    rerender(<FitOverview car={{ lat: 22.56, lng: 88.4 }} dropOff={DROP_OFF} />);
    expect(mapInstance.fitBounds).toHaveBeenCalledTimes(2);
  });

  it("leaves the map alone right after a drag", () => {
    const { rerender } = render(<FitOverview car={CAR} dropOff={DROP_OFF} />);
    mapInstance.fire("dragstart");
    rerender(<FitOverview car={{ lat: 22.56, lng: 88.4 }} dropOff={DROP_OFF} />);
    expect(mapInstance.fitBounds).toHaveBeenCalledTimes(1);
  });

  it("centres on the car without a drop-off", () => {
    render(<FitOverview car={CAR} dropOff={null} />);
    expect(mapInstance.panTo).toHaveBeenCalledWith(CAR);
    expect(mapInstance.fitBounds).not.toHaveBeenCalled();
  });
});
