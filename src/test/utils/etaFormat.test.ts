import { formatDuration, splitHours } from "@/utils/etaFormat";

describe("splitHours", () => {
  it("splits minutes into hours and minutes", () => {
    expect(splitHours(85)).toEqual({ hours: 1, minutes: 25 });
    expect(splitHours(45)).toEqual({ hours: 0, minutes: 45 });
  });
});

describe("formatDuration", () => {
  it("shows hours and minutes, minutes only under an hour, and no 0 min", () => {
    expect(formatDuration(85)).toBe("1 hr 25 min");
    expect(formatDuration(14)).toBe("14 min");
    expect(formatDuration(120)).toBe("2 hr");
  });
});
