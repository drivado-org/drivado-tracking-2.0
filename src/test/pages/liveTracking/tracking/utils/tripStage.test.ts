import {
  destinationLabel,
  isDriving,
  isPickupLeg,
  statusNotice,
} from "@/pages/liveTracking/tracking/utils/tripStage";

describe("tripStage", () => {
  it("names the drop-off only once the passenger is on board", () => {
    expect(destinationLabel("ENROUTE")).toBe("PICKUP");
    expect(destinationLabel("ARRIVED")).toBe("ARRIVED");
    expect(destinationLabel("POB")).toBe("DROP OFF");
    expect(destinationLabel("COMPLETED")).toBe("COMPLETED");
    expect(destinationLabel(null)).toBeNull();
    expect(destinationLabel("NOSHOW")).toBeNull();
  });

  it("is on the pickup leg from en route until the passenger is on board", () => {
    expect(isPickupLeg("ENROUTE")).toBe(true);
    expect(isPickupLeg("ARRIVED")).toBe(true);
    expect(isPickupLeg("POB")).toBe(false);
    expect(isPickupLeg("COMPLETED")).toBe(false);
    expect(isPickupLeg(null)).toBe(false);
  });

  it("shows the time left only while driving", () => {
    expect(isDriving("ENROUTE")).toBe(true);
    expect(isDriving("POB")).toBe(true);
    expect(isDriving("ARRIVED")).toBe(false);
    expect(isDriving("COMPLETED")).toBe(false);
  });

  it("has a long toast for every step", () => {
    expect(statusNotice("ARRIVED")).toEqual({
      text: "Driver has arrived at the pickup",
      icon: "arrived",
      long: true,
    });
    expect(statusNotice("COMPLETED")?.icon).toBe("completed");
    expect(statusNotice(null)).toBeNull();
  });
});
