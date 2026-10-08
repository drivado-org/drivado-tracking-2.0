import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { DEFAULT_MAP_CENTER, DEFAULT_MAP_ID, DEFAULT_MAP_ZOOM } from "@/pages/liveTracking/tracking/constants/map";
import TrackingMap from "@/pages/liveTracking/tracking/components/TrackingMap";

// Replace Google Maps with simple stand-ins so tests never load the real SDK.
vi.mock("@vis.gl/react-google-maps", () => ({
  APIProvider: ({ apiKey, children }: { apiKey: string; children: ReactNode }) => (
    <div data-testid="api-provider" data-api-key={apiKey}>
      {children}
    </div>
  ),
  Map: (props: {
    defaultCenter: unknown;
    defaultZoom: number;
    mapId?: string;
    renderingType?: string;
    children?: ReactNode;
  }) => (
    <div
      data-testid="google-map"
      data-center={JSON.stringify(props.defaultCenter)}
      data-zoom={props.defaultZoom}
      data-map-id={props.mapId}
      data-rendering-type={props.renderingType}
    >
      {props.children}
    </div>
  ),
  RenderingType: { VECTOR: "VECTOR", RASTER: "RASTER" },
}));

describe("TrackingMap map id and children", () => {
  it("uses vector rendering (needed for tilt and rotation)", () => {
    render(<TrackingMap apiKey="test-key" />);
    expect(screen.getByTestId("google-map")).toHaveAttribute("data-rendering-type", "VECTOR");
  });

  it("falls back to the default map id when none is given", () => {
    render(<TrackingMap apiKey="test-key" />);
    expect(screen.getByTestId("google-map")).toHaveAttribute("data-map-id", DEFAULT_MAP_ID);
  });

  it.each([null, undefined])("falls back to the default map id for %p", (mapId) => {
    render(<TrackingMap apiKey="test-key" mapId={mapId} />);
    expect(screen.getByTestId("google-map")).toHaveAttribute("data-map-id", DEFAULT_MAP_ID);
  });

  it("uses the given map id", () => {
    render(<TrackingMap apiKey="test-key" mapId="my-map-id" />);
    expect(screen.getByTestId("google-map")).toHaveAttribute("data-map-id", "my-map-id");
  });

  it("renders children inside the map (route, car, etc.)", () => {
    render(
      <TrackingMap apiKey="test-key">
        <span data-testid="overlay" />
      </TrackingMap>,
    );
    expect(screen.getByTestId("google-map")).toContainElement(screen.getByTestId("overlay"));
  });

  it("does not render children when the key is missing", () => {
    render(
      <TrackingMap apiKey={null}>
        <span data-testid="overlay" />
      </TrackingMap>,
    );
    expect(screen.queryByTestId("overlay")).not.toBeInTheDocument();
  });
});

describe("TrackingMap", () => {
  describe("without an API key", () => {
    it.each([null, undefined, ""])("shows a message instead of the map for %p", (apiKey) => {
      render(<TrackingMap apiKey={apiKey as string | null} />);

      expect(screen.getByRole("alert")).toHaveTextContent(/google maps api key is missing/i);
      expect(screen.queryByTestId("api-provider")).not.toBeInTheDocument();
      expect(screen.queryByTestId("google-map")).not.toBeInTheDocument();
    });
  });

  describe("with an API key", () => {
    it("passes the key to the Google Maps provider", () => {
      render(<TrackingMap apiKey="test-key" />);
      expect(screen.getByTestId("api-provider")).toHaveAttribute("data-api-key", "test-key");
    });

    it("renders the map with default center and zoom", () => {
      render(<TrackingMap apiKey="test-key" />);

      const map = screen.getByTestId("google-map");
      expect(JSON.parse(map.dataset.center!)).toEqual(DEFAULT_MAP_CENTER);
      expect(map).toHaveAttribute("data-zoom", String(DEFAULT_MAP_ZOOM));
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    it("uses custom center and zoom when given", () => {
      const center = { lat: 22.6, lng: 88.4 };
      render(<TrackingMap apiKey="test-key" center={center} zoom={12} />);

      const map = screen.getByTestId("google-map");
      expect(JSON.parse(map.dataset.center!)).toEqual(center);
      expect(map).toHaveAttribute("data-zoom", "12");
    });
  });
});
