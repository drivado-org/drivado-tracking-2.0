import { fireEvent, render, screen } from "@testing-library/react";
import MapControls from "@/pages/liveTracking/tracking/components/MapControls";
import type { CameraMode } from "@/pages/liveTracking/tracking/constants/map";

const renderControls = (cameraMode: CameraMode) => {
  const onShowRoute = vi.fn();
  const onRecenter = vi.fn();
  render(
    <MapControls cameraMode={cameraMode} onShowRoute={onShowRoute} onRecenter={onRecenter} />,
  );
  return { onShowRoute, onRecenter };
};

const routeButton = () => screen.getByRole("button", { name: "Show the whole route" });

describe("MapControls", () => {
  it("shows the whole route on tap", () => {
    const { onShowRoute } = renderControls("journey");
    fireEvent.click(routeButton());
    expect(onShowRoute).toHaveBeenCalledTimes(1);
  });

  it("offers the lock in the journey view", () => {
    const { onRecenter } = renderControls("journey");
    const recenter = screen.getByRole("button", { name: "Lock the camera to the vehicle" });

    expect(recenter).toHaveAttribute("aria-pressed", "true");
    expect(routeButton()).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(recenter);
    expect(onRecenter).toHaveBeenCalledTimes(1);
  });

  it("offers the journey view while locked on the car", () => {
    renderControls("follow");
    expect(
      screen.getByRole("button", { name: "Show the vehicle and its next stop" }),
    ).toHaveAttribute("aria-pressed", "true");
  });

  it("marks the route button while the whole route is shown", () => {
    renderControls("route");
    expect(routeButton()).toHaveAttribute("aria-pressed", "true");
    expect(
      screen.getByRole("button", { name: "Show the vehicle and its next stop" }),
    ).toHaveAttribute("aria-pressed", "false");
  });

  it("marks neither after the user moved the map", () => {
    renderControls("free");
    for (const button of screen.getAllByRole("button")) {
      expect(button).toHaveAttribute("aria-pressed", "false");
    }
  });
});
