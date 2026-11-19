import { render, waitFor } from "@testing-library/react";
import TripMetrics from "@/pages/liveTracking/dashboard/components/TripMetrics";

/** Waits for the Duration column to finish counting to e.g. "1hr25mins". */
const expectDuration = async (duration: number | null, expected: string) => {
  const { container } = render(
    <TripMetrics metrics={{ duration, distance: null, dropOffTime: null }} />,
  );
  const column = container.querySelector(".grid > div")!;
  await waitFor(() =>
    expect(column.textContent!.replace("Duration", "")).toBe(expected),
  );
};

describe("TripMetrics duration", () => {
  it("shows hours and minutes", async () => {
    await expectDuration(85, "1hr25mins");
  });

  it("shows only minutes under an hour", async () => {
    await expectDuration(45, "45mins");
    await expectDuration(0, "0mins");
  });

  it("drops 0 minutes on a whole hour", async () => {
    await expectDuration(120, "2hr");
  });

  it("shows -- without an ETA", async () => {
    await expectDuration(null, "--min");
  });
});

describe("TripMetrics distance and drop-off", () => {
  it("counts up to the distance and drop-off time", async () => {
    const { container } = render(
      <TripMetrics metrics={{ duration: null, distance: 12.34, dropOffTime: "09:05" }} />,
    );
    const [, distance, dropOff] = container.querySelectorAll(".grid > div");
    await waitFor(() => {
      expect(distance.textContent).toBe("Distance12.34km");
      expect(dropOff.textContent).toBe("Drop-off09:05");
    });
  });
});
