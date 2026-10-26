import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import DestinationMarker from "@/pages/liveTracking/tracking/components/DestinationMarker";

vi.mock("@vis.gl/react-google-maps", () => ({
  AdvancedMarker: (props: { position: unknown; title?: string; children?: ReactNode }) => (
    <div data-testid="destination" data-position={JSON.stringify(props.position)} title={props.title}>
      {props.children}
    </div>
  ),
  AdvancedMarkerAnchorPoint: { CENTER: ["-50%", "-50%"], BOTTOM_CENTER: ["-50%", "-100%"] },
}));

describe("DestinationMarker", () => {
  it("renders nothing without a position", () => {
    const { container } = render(<DestinationMarker position={null} label="DROP-OFF" />);
    expect(container).toBeEmptyDOMElement();
  });

  it("marks the end of the route with its label", () => {
    const position = { lat: 22.58, lng: 88.45 };
    render(<DestinationMarker position={position} label="DROP-OFF" />);

    const marker = screen.getByTestId("destination");
    expect(JSON.parse(marker.dataset.position!)).toEqual(position);
    expect(marker).toHaveAttribute("title", "DROP-OFF");
    expect(screen.getByText("DROP-OFF")).toBeInTheDocument();
  });

  it("draws only the dot without a label", () => {
    render(<DestinationMarker position={{ lat: 22.58, lng: 88.45 }} />);

    expect(screen.getByTestId("destination")).toHaveTextContent("");
    expect(screen.queryByText("DROP-OFF")).not.toBeInTheDocument();
  });

  it("draws the dot, not a pin, by default", () => {
    render(<DestinationMarker position={{ lat: 22.58, lng: 88.45 }} label="DROP-OFF" />);

    expect(screen.queryByTestId("pickup-pin")).not.toBeInTheDocument();
  });

  it("draws a location pin at the pickup", () => {
    render(<DestinationMarker position={{ lat: 22.58, lng: 88.45 }} label="PICKUP" pin />);

    expect(screen.getByTestId("pickup-pin")).toBeInTheDocument();
    expect(screen.getByText("PICKUP")).toBeInTheDocument();
  });
});
