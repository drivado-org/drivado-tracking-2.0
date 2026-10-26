import { renderHook } from "@testing-library/react";
import useTurningHeading from "@/pages/liveTracking/tracking/hooks/useTurningHeading";

const render = (target: number) =>
  renderHook(({ target }) => useTurningHeading(target), { initialProps: { target } });

describe("useTurningHeading", () => {
  it("starts at the target", () => {
    expect(render(90).result.current).toBe(90);
  });

  it("turns the short way across north", () => {
    const { result, rerender } = render(350);
    rerender({ target: 10 });
    expect(result.current).toBe(370);
  });

  it("stays put when the target is the same direction in another range", () => {
    const { result, rerender } = render(370);
    rerender({ target: 10 });
    expect(result.current).toBe(370);
  });
});
