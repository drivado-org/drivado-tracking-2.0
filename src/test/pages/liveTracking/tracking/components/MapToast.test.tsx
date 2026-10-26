import { act, render, screen } from "@testing-library/react";
import MapToast from "@/pages/liveTracking/tracking/components/MapToast";
import {
  MAP_TOAST_MS,
  STATUS_TOAST_MS,
} from "@/pages/liveTracking/tracking/constants/tracking";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("MapToast", () => {
  it("is hidden until there is a notice", () => {
    render(<MapToast notice={null} />);
    expect(screen.getByRole("status")).toHaveClass("opacity-0");
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
  });

  it("shows the notice, then fades it out keeping the text", () => {
    render(<MapToast notice={{ text: "Locked on the vehicle", icon: "lock" }} />);
    const toast = screen.getByRole("status");
    expect(toast).toHaveClass("opacity-100");
    expect(toast).toHaveTextContent("Locked on the vehicle");

    act(() => {
      vi.advanceTimersByTime(MAP_TOAST_MS);
    });
    expect(toast).toHaveClass("opacity-0");
    expect(toast).toHaveTextContent("Locked on the vehicle");
  });

  it("shows the same text again for a new notice", () => {
    const { rerender } = render(
      <MapToast notice={{ text: "Locked on the vehicle", icon: "lock" }} />,
    );
    act(() => {
      vi.advanceTimersByTime(MAP_TOAST_MS);
    });
    rerender(<MapToast notice={{ text: "Locked on the vehicle", icon: "lock" }} />);
    expect(screen.getByRole("status")).toHaveClass("opacity-100");
  });

  it("sits below what covers the top of the map", () => {
    render(<MapToast notice={null} topInset={68} />);
    expect(screen.getByRole("status")).toHaveStyle({ top: "78px" });
  });
});

describe("MapToast trip steps", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("keeps a trip step up for STATUS_TOAST_MS", () => {
    render(
      <MapToast notice={{ text: "Driver has arrived at the pickup", icon: "arrived", long: true }} />,
    );
    const toast = screen.getByRole("status");

    act(() => {
      vi.advanceTimersByTime(MAP_TOAST_MS);
    });
    expect(toast).toHaveClass("opacity-100");

    act(() => {
      vi.advanceTimersByTime(STATUS_TOAST_MS - MAP_TOAST_MS);
    });
    expect(toast).toHaveClass("opacity-0");
  });
});
