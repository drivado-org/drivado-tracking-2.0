import { render } from "@testing-library/react";
import FollowDriver from "@/pages/liveTracking/tracking/components/FollowDriver";

const fakeMap = { panTo: vi.fn() };
let mapInstance: typeof fakeMap | null = fakeMap;

vi.mock("@vis.gl/react-google-maps", () => ({
  useMap: () => mapInstance,
}));

beforeEach(() => {
  mapInstance = fakeMap;
});

describe("FollowDriver", () => {
  it("does nothing without a position", () => {
    render(<FollowDriver position={null} />);
    expect(fakeMap.panTo).not.toHaveBeenCalled();
  });

  it("pans the map to the driver", () => {
    render(<FollowDriver position={{ lat: 22.5726, lng: 88.3639 }} />);
    expect(fakeMap.panTo).toHaveBeenCalledWith({ lat: 22.5726, lng: 88.3639 });
  });

  it("pans again when the driver moves", () => {
    const { rerender } = render(<FollowDriver position={{ lat: 22.5726, lng: 88.3639 }} />);
    rerender(<FollowDriver position={{ lat: 22.5736, lng: 88.3639 }} />);
    expect(fakeMap.panTo).toHaveBeenCalledTimes(2);
    expect(fakeMap.panTo).toHaveBeenLastCalledWith({ lat: 22.5736, lng: 88.3639 });
  });

  it("does not pan again when the position is unchanged", () => {
    const { rerender } = render(<FollowDriver position={{ lat: 22.5726, lng: 88.3639 }} />);
    rerender(<FollowDriver position={{ lat: 22.5726, lng: 88.3639 }} />);
    expect(fakeMap.panTo).toHaveBeenCalledTimes(1);
  });

  it("waits for the map to be ready", () => {
    mapInstance = null;
    const { rerender } = render(<FollowDriver position={{ lat: 22.5726, lng: 88.3639 }} />);
    expect(fakeMap.panTo).not.toHaveBeenCalled();

    mapInstance = fakeMap;
    rerender(<FollowDriver position={{ lat: 22.5726, lng: 88.3639 }} />);
    expect(fakeMap.panTo).toHaveBeenCalledWith({ lat: 22.5726, lng: 88.3639 });
  });

  it("renders nothing", () => {
    const { container } = render(<FollowDriver position={{ lat: 22.5726, lng: 88.3639 }} />);
    expect(container).toBeEmptyDOMElement();
  });
});
