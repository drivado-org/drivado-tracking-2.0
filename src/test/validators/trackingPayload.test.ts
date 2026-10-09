import {
  parseDriverStatus,
  parseLocationUpdate,
  parseTrackingMessage,
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
    ])("returns null when %s", (_label, override) => {
      expect(parseTrackingPayload({ ...validRaw, ...override })).toBeNull();
    });
  });

  // Backend will drop these fields later, so they must never hide the car.
  it.each([
    ["tripType unknown", { tripType: "TRIP_X" }],
    ["tripType missing", { tripType: undefined }],
    ["driverStatus unknown", { driverStatus: "FLYING" }],
    ["driverStatus missing", { driverStatus: undefined }],
  ])("keeps the point with null status/type when %s", (_label, override) => {
    const parsed = parseTrackingPayload({ ...validRaw, ...override });
    expect(parsed).toMatchObject({ lat: 22.5726, lng: 88.3639 });
    const key = Object.keys(override)[0] as "tripType" | "driverStatus";
    expect(parsed?.[key]).toBeNull();
  });

  describe("live SSE shape: lat/lng/timestamp nested in location", () => {
    const nested = {
      driverID: "D0002",
      bookingID: "B0002",
      tripID: "T123",
      tripType: "TRIP_S",
      driverStatus: "ENROUTE",
      location: { lat: 22.3627, lng: 123.32793, timestamp: "2026-10-03T07:15:29Z" },
      sequence: 0,
    };

    it("parses the snapshot event from the backend", () => {
      expect(parseTrackingPayload(JSON.stringify(nested))).toEqual({
        driverID: "D0002",
        bookingID: "B0002",
        tripID: "T123",
        tripType: "TRIP_S",
        driverStatus: "ENROUTE",
        lat: 22.3627,
        lng: 123.32793,
        timestamp: "2026-10-03T07:15:29.000Z",
        sequence: 0,
      });
    });

    it.each([
      ["location missing", { location: undefined }],
      ["location null", { location: null }],
      ["location not an object", { location: "22,88" }],
      ["location.lat missing", { location: { lng: 88, timestamp: "2026-10-03T07:15:29Z" } }],
      ["location.timestamp missing", { location: { lat: 22, lng: 88 } }],
    ])("returns null when %s", (_label, override) => {
      expect(parseTrackingPayload({ ...nested, ...override })).toBeNull();
    });
  });

  describe("location gateway shape: flat lat/lng with clientTimeUTC", () => {
    const flat = {
      bookingID: "B0002",
      tripID: "T12345",
      driverID: "D0002",
      lat: 22.3627,
      lng: 8.32793,
      clientTimeUTC: "2026-10-03T07:15:29Z",
    };

    it("parses it without tripType, driverStatus or sequence", () => {
      expect(parseTrackingPayload(flat)).toEqual({
        driverID: "D0002",
        bookingID: "B0002",
        tripID: "T12345",
        tripType: null,
        driverStatus: null,
        lat: 22.3627,
        lng: 8.32793,
        timestamp: "2026-10-03T07:15:29.000Z",
        sequence: null,
      });
    });

    it("returns null when clientTimeUTC is invalid", () => {
      expect(parseTrackingPayload({ ...flat, clientTimeUTC: "nope" })).toBeNull();
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

describe("parseTrackingMessage", () => {
  const item = (lat: number, time: string, extra: Record<string, unknown> = {}) => ({
    driverID: "D0002",
    bookingID: "B0002",
    tripID: "T123",
    lat,
    lng: 88.3639,
    clientTimeUTC: time,
    ...extra,
  });

  it("parses a single point", () => {
    expect(parseTrackingMessage(item(22.1, "2026-10-03T07:15:29Z"))?.lat).toBe(22.1);
  });

  it("parses a JSON string", () => {
    expect(
      parseTrackingMessage(JSON.stringify({ data: [item(22.1, "2026-10-03T07:15:29Z")] }))?.lat,
    ).toBe(22.1);
  });

  it("returns the newest valid point from { data: [...] } in any order", () => {
    const message = {
      data: [
        item(22.2, "2026-10-03T07:15:31Z"),
        item(22.3, "2026-10-03T07:15:33Z"),
        item(22.1, "2026-10-03T07:15:29Z"),
      ],
    };
    expect(parseTrackingMessage(message)?.lat).toBe(22.3);
  });

  it("returns the newest point from a bare array", () => {
    expect(
      parseTrackingMessage([item(22.1, "2026-10-03T07:15:29Z"), item(22.2, "2026-10-03T07:15:31Z")])
        ?.lat,
    ).toBe(22.2);
  });

  it("uses sequence to break a timestamp tie", () => {
    const time = "2026-10-03T07:15:29Z";
    expect(
      parseTrackingMessage({
        data: [item(22.2, time, { sequence: 5 }), item(22.1, time, { sequence: 4 })],
      })?.lat,
    ).toBe(22.2);
  });

  it("skips invalid items and keeps the valid ones", () => {
    const message = {
      data: [
        null,
        "junk",
        item(91, "2026-10-03T07:15:40Z"),
        item(22.1, "2026-10-03T07:15:29Z"),
        { lat: 22.9 },
      ],
    };
    expect(parseTrackingMessage(message)?.lat).toBe(22.1);
  });

  it.each([
    ["empty data", { data: [] }],
    ["data not an array", { data: "x" }],
    ["data null", { data: null }],
    ["only invalid items", { data: [{}, null] }],
    ["empty array", []],
    ["not json", "not json"],
    ["undefined", undefined],
    ["null", null],
  ])("returns null for %s", (_label, raw) => {
    expect(parseTrackingMessage(raw)).toBeNull();
  });
});

describe("parseLocationUpdate", () => {
  // Exactly what the backend sends as `event: location` after the snapshot.
  const live = {
    lat: 22.49557263429034,
    lng: 88.37082800511205,
    timestamp: "2026-10-08T12:32:55.404759Z",
  };

  it("parses the live location event (no ids)", () => {
    expect(parseLocationUpdate(live)).toEqual({
      lat: 22.49557263429034,
      lng: 88.37082800511205,
      timestamp: "2026-10-08T12:32:55.404Z",
    });
  });

  it("parses a JSON string (raw SSE data)", () => {
    expect(parseLocationUpdate(JSON.stringify(live))).toEqual(parseLocationUpdate(live));
  });

  it("reads lat/lng/timestamp nested in location", () => {
    expect(parseLocationUpdate({ location: live })?.lat).toBe(22.49557263429034);
  });

  it.each([
    ["lat missing", { ...live, lat: undefined }],
    ["lng missing", { ...live, lng: undefined }],
    ["lat out of range", { ...live, lat: 91 }],
    ["no GPS fix (0,0)", { ...live, lat: 0, lng: 0 }],
    ["timestamp missing", { ...live, timestamp: undefined }],
    ["timestamp invalid", { ...live, timestamp: "yesterday" }],
    ["not json", "not json"],
    ["array", [live]],
    ["null", null],
    ["undefined", undefined],
  ])("returns null when %s", (_label, raw) => {
    expect(parseLocationUpdate(raw)).toBeNull();
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
