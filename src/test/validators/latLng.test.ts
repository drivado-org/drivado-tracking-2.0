import { isValidLatitude, isValidLongitude, parseLatLng } from "@/validators/latLng";

describe("isValidLatitude", () => {
  it.each([0, 25.2048, -90, 90])("accepts %p", (value) => {
    expect(isValidLatitude(value)).toBe(true);
  });

  it.each([-90.0001, 90.0001, NaN, Infinity, undefined, null, "25.2"])(
    "rejects %p",
    (value) => {
      expect(isValidLatitude(value)).toBe(false);
    },
  );
});

describe("isValidLongitude", () => {
  it.each([0, 55.2708, -180, 180])("accepts %p", (value) => {
    expect(isValidLongitude(value)).toBe(true);
  });

  it.each([-180.0001, 180.0001, NaN, -Infinity, undefined, null, "55.2"])(
    "rejects %p",
    (value) => {
      expect(isValidLongitude(value)).toBe(false);
    },
  );
});

describe("parseLatLng", () => {
  it("returns LatLng for valid numbers", () => {
    expect(parseLatLng(25.2048, 55.2708)).toEqual({
      lat: 25.2048,
      lng: 55.2708,
    });
  });

  it("accepts numeric strings", () => {
    expect(parseLatLng("25.2048", " 55.2708 ")).toEqual({
      lat: 25.2048,
      lng: 55.2708,
    });
  });

  it("rejects 0,0 (common GPS fallback when no fix)", () => {
    expect(parseLatLng(0, 0)).toBeNull();
  });

  it("allows lat 0 or lng 0 on their own", () => {
    expect(parseLatLng(0, 55.27)).toEqual({ lat: 0, lng: 55.27 });
    expect(parseLatLng(25.2, 0)).toEqual({ lat: 25.2, lng: 0 });
  });

  it.each([
    [undefined, 55.27],
    [25.2, undefined],
    [null, null],
    [91, 55.27],
    [25.2, 181],
    ["abc", 55.27],
    [NaN, 55.27],
    [{}, []],
  ])("returns null for lat=%p lng=%p", (lat, lng) => {
    expect(parseLatLng(lat, lng)).toBeNull();
  });
});
