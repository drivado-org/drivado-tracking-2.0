import {
  parseDriverStatus,
  parseTrackingPayload,
  parseTripType,
} from "@/validators/trackingPayload";

const validRaw = {
  driverID: "DRIVER_123",
  bookingID: "B1",
  tripID: "T123",
  tripType: "TRIP_S",
  driverStatus: "ENROUTE",
  lat: 22.5726,
  lng: 88.3639,
  timestamp: "2026-09-15T12:30:15.123Z",
  sequence: 7,
};

describe("parseTrackingPayload", () => {
  it("parses a fully valid payload", () => {
    expect(parseTrackingPayload(validRaw)).toEqual({
      driverID: "DRIVER_123",
      bookingID: "B1",
      tripID: "T123",
      tripType: "TRIP_S",
      driverStatus: "ENROUTE",
      lat: 22.5726,
      lng: 88.3639,
      timestamp: "2026-09-15T12:30:15.123Z",
      sequence: 7,
    });
  });

  it("parses a JSON string (raw SSE data)", () => {
    expect(parseTrackingPayload(JSON.stringify(validRaw))).toEqual(
      parseTrackingPayload(validRaw),
    );
  });

  it("accepts numeric strings for lat/lng", () => {
    const parsed = parseTrackingPayload({ ...validRaw, lat: "22.5726", lng: "88.3639" });
    expect(parsed?.lat).toBe(22.5726);
    expect(parsed?.lng).toBe(88.3639);
  });

  it("normalises the timestamp to an ISO string", () => {
    expect(
      parseTrackingPayload({ ...validRaw, timestamp: Date.UTC(2026, 8, 15, 12, 30, 15, 123) })
        ?.timestamp,
    ).toBe("2026-09-15T12:30:15.123Z");
  });

  describe("required fields", () => {
    it.each([
      ["lat missing", { lat: undefined }],
      ["lng missing", { lng: undefined }],
      ["lat null", { lat: null }],
      ["lat out of range", { lat: 91 }],
      ["lng out of range", { lng: 181 }],
      ["lat not a number", { lat: "abc" }],
      ["0,0 (no GPS fix)", { lat: 0, lng: 0 }],
      ["timestamp missing", { timestamp: undefined }],
      ["timestamp invalid", { timestamp: "not a date" }],
      ["driverID missing", { driverID: undefined }],
      ["driverID empty", { driverID: "" }],
      ["bookingID null", { bookingID: null }],
      ["tripID not a string", { tripID: {} }],
      ["tripType unknown", { tripType: "TRIP_X" }],
      ["driverStatus unknown", { driverStatus: "FLYING" }],
      ["driverStatus missing", { driverStatus: undefined }],
    ])("returns null when %s", (_label, override) => {
      expect(parseTrackingPayload({ ...validRaw, ...override })).toBeNull();
    });
  });

  it.each([["abc"], [undefined], [null]])("sequence %p becomes null (contract TBD)", (sequence) => {
    expect(parseTrackingPayload({ ...validRaw, sequence })?.sequence).toBeNull();
  });

  it.each([null, undefined, 42, "", "not json", "[1,2]", [], true])(
    "returns null for non-object input %p",
    (raw) => {
      expect(parseTrackingPayload(raw)).toBeNull();
    },
  );

  it("never throws on hostile input", () => {
    const hostile = Object.create({ lat: 1 });
    expect(() => parseTrackingPayload(hostile)).not.toThrow();
  });
});

describe("parseDriverStatus", () => {
  it.each(["ENROUTE", "ARRIVE", "POB", "COMPLETED", "NOSHOW"])("accepts %s", (status) => {
    expect(parseDriverStatus(status)).toBe(status);
  });

  it("normalises case and spaces", () => {
    expect(parseDriverStatus(" pob ")).toBe("POB");
  });

  it.each([undefined, null, "", "DONE", 1])("returns null for %p", (value) => {
    expect(parseDriverStatus(value)).toBeNull();
  });
});

describe("parseTripType", () => {
  it.each(["TRIP_S", "TRIP_D"])("accepts %s", (type) => {
    expect(parseTripType(type)).toBe(type);
  });

  it("normalises case and spaces", () => {
    expect(parseTripType(" trip_d ")).toBe("TRIP_D");
  });

  it.each([undefined, null, "", "TRIP_X", 1])("returns null for %p", (value) => {
    expect(parseTripType(value)).toBeNull();
  });
});
