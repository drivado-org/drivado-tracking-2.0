import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import CarMarker from "@/pages/liveTracking/tracking/components/CarMarker";

vi.mock("@vis.gl/react-google-maps", () => ({
  AdvancedMarker: (props: { position: unknown; title?: string; children?: ReactNode }) => (
    <div data-testid="car-marker" data-position={JSON.stringify(props.position)} title={props.title}>
      {props.children}
    </div>
  ),
  AdvancedMarkerAnchorPoint: { CENTER: ["-50%", "-50%"] },
}));

describe("CarMarker", () => {
  it("renders nothing without a position", () => {
    const { container } = render(<CarMarker position={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders the car at the given position", () => {
    const position = { lat: 22.5726, lng: 88.3639 };
    render(<CarMarker position={position} />);

    const marker = screen.getByTestId("car-marker");
    expect(JSON.parse(marker.dataset.position!)).toEqual(position);
    expect(marker).toHaveAttribute("title", "Car");
  });

  it("uses the vehicle.svg asset as the icon", () => {
    render(<CarMarker position={{ lat: 22.5726, lng: 88.3639 }} />);
    const img = screen.getByTestId("car-marker").querySelector("img");
    expect(img?.getAttribute("src")).toMatch(/vehicle.*\.svg/);
  });
});
