import { render } from "@testing-library/react";
import TripMetrics from "@/pages/liveTracking/dashboard/components/TripMetrics";

/** The Duration column's text, e.g. "1hr25min". */
const durationText = (duration: number | null) => {
  const { container } = render(
    <TripMetrics metrics={{ duration, distance: null, dropOffTime: null }} />,
  );
  return container.querySelector(".grid > div")!.textContent!.replace("Duration", "");
};

describe("TripMetrics duration", () => {
  it("shows hours and minutes", () => {
    expect(durationText(85)).toBe("1hr25min");
  });

  it("shows only minutes under an hour", () => {
    expect(durationText(45)).toBe("45min");
    expect(durationText(0)).toBe("0min");
  });

  it("drops 0 minutes on a whole hour", () => {
    expect(durationText(120)).toBe("2hr");
  });

  it("shows -- without an ETA", () => {
    expect(durationText(null)).toBe("--min");
  });
});
