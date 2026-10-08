import {
  isPlainObject,
  toFiniteNumber,
  toNonEmptyString,
  toTimestampMs,
} from "@/validators/primitives";

describe("isPlainObject", () => {
  it("returns true for plain objects", () => {
    expect(isPlainObject({})).toBe(true);
    expect(isPlainObject({ a: 1 })).toBe(true);
  });

  it.each([undefined, null, 0, "text", true, [], [1, 2], () => {}])(
    "returns false for %p",
    (value) => {
      expect(isPlainObject(value)).toBe(false);
    },
  );
});

describe("toFiniteNumber", () => {
  it.each([
    [0, 0],
    [25.2048, 25.2048],
    [-55.27, -55.27],
    ["25.2048", 25.2048],
    ["  -55.27  ", -55.27],
    ["0", 0],
  ])("converts %p to %p", (input, expected) => {
    expect(toFiniteNumber(input)).toBe(expected);
  });

  it.each([
    undefined,
    null,
    "",
    "   ",
    "abc",
    "12abc",
    NaN,
    Infinity,
    -Infinity,
    true,
    false,
    {},
    [],
    [1],
  ])("returns null for %p", (input) => {
    expect(toFiniteNumber(input)).toBeNull();
  });
});

describe("toNonEmptyString", () => {
  it("returns trimmed string", () => {
    expect(toNonEmptyString("  BK-101 ")).toBe("BK-101");
  });

  it("converts finite numbers to string", () => {
    expect(toNonEmptyString(101)).toBe("101");
  });

  it.each([undefined, null, "", "   ", NaN, Infinity, {}, [], true])(
    "returns null for %p",
    (input) => {
      expect(toNonEmptyString(input)).toBeNull();
    },
  );
});

describe("toTimestampMs", () => {
  it("accepts a positive number as milliseconds", () => {
    expect(toTimestampMs(1727600000000)).toBe(1727600000000);
  });

  it("accepts a numeric string as milliseconds", () => {
    expect(toTimestampMs("1727600000000")).toBe(1727600000000);
  });

  it("accepts an ISO date string", () => {
    expect(toTimestampMs("2026-09-29T10:00:00.000Z")).toBe(
      Date.UTC(2026, 8, 29, 10, 0, 0),
    );
  });

  it.each([
    undefined,
    null,
    "",
    "not a date",
    0,
    -1,
    NaN,
    Infinity,
    {},
    [],
    true,
  ])("returns null for %p", (input) => {
    expect(toTimestampMs(input)).toBeNull();
  });
});
