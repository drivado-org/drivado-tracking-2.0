import {
  isEtaEmpty,
  parseDriverStatusEvent,
  parseEtaEvent,
  parseNotificationEvent,
  parseRouteChange,
  parseTripSnapshot,
  parseVehicleMeta,
} from "@/validators/tripEventPayload";

const BASE = { driverID: "D1", bookingID: "B1", tripID: "T1", tripType: "TRIP_S" };
const PATH = [
  { lat: 22.5785, lng: 88.446 },
  { lat: 22.5763, lng: 88.4375 },
  { lat: 22.5726, lng: 88.4197 },
];

type Case = [label: string, raw: Record<string, unknown>];

/** Snapshot only: required ids and tripType oneof TRIP_S TRIP_D. */
const BAD_BASES: Case[] = [
  ["no driverID", { ...BASE, driverID: undefined }],
  ["empty bookingID", { ...BASE, bookingID: "  " }],
  ["numeric tripID", { ...BASE, tripID: 1 }],
  ["no tripType", { ...BASE, tripType: undefined }],
  ["unknown tripType", { ...BASE, tripType: "TRIP_X" }],
  ["lowercase tripType", { ...BASE, tripType: "trip_s" }],
];

describe("parseEtaEvent { eta, distance }", () => {
  const NOW = Date.parse("2026-10-15T10:00:00.000Z");

  it("reads the backend payload and computes the arrival time", () => {
    expect(parseEtaEvent('{ "eta": 420, "distance": 1234.5 }', NOW)).toEqual({
      etaSeconds: 420,
      distanceMeters: 1234.5,
      arrivalTime: "2026-10-15T10:07:00.000Z",
    });
    expect(parseEtaEvent({ eta: 60, distance: 180 }, NOW)).toMatchObject({
      etaSeconds: 60,
      distanceMeters: 180,
    });
  });

  it("accepts eta 0 and distance 0", () => {
    expect(parseEtaEvent({ eta: 0, distance: 0 }, NOW)).toMatchObject({
      etaSeconds: 0,
      distanceMeters: 0,
    });
  });

  it("ignores extra fields", () => {
    expect(parseEtaEvent({ ...BASE, driverStatus: "POB", eta: 1, distance: 2 }, NOW)).toEqual({
      etaSeconds: 1,
      distanceMeters: 2,
      arrivalTime: "2026-10-15T10:00:01.000Z",
    });
  });

  it.each<Case>([
    ["no eta", { distance: 1 }],
    ["negative eta", { eta: -1, distance: 1 }],
    ["fractional eta", { eta: 1.5, distance: 1 }],
    ["string eta", { eta: "300", distance: 1 }],
    ["no distance", { eta: 1 }],
    ["negative distance", { eta: 1, distance: -0.1 }],
  ])("rejects %s", (_label, raw) => {
    expect(parseEtaEvent(raw, NOW)).toBeNull();
  });

  it.each([null, "not json", []])("rejects %p", (raw) => {
    expect(parseEtaEvent(raw, NOW)).toBeNull();
  });

  it("isEtaEmpty: only 0 / 0", () => {
    expect(isEtaEmpty(parseEtaEvent({ eta: 0, distance: 0 }, NOW)!)).toBe(true);
    expect(isEtaEmpty(parseEtaEvent({ eta: 0, distance: 5 }, NOW)!)).toBe(false);
    expect(isEtaEmpty(parseEtaEvent({ eta: 60, distance: 180 }, NOW)!)).toBe(false);
  });
});

describe("parseRouteChange { route }", () => {
  it("reads the backend payload", () => {
    expect(parseRouteChange(JSON.stringify({ route: PATH }))).toEqual({ routePath: PATH });
    expect(
      parseRouteChange({
        route: [
          { lat: 22.5726, lng: 88.3639 },
          { lat: 22.6, lng: 88.4 },
        ],
      }),
    ).toEqual({
      routePath: [
        { lat: 22.5726, lng: 88.3639 },
        { lat: 22.6, lng: 88.4 },
      ],
    });
  });

  it.each<Case>([
    ["no route", {}],
    ["the old routePath field", { routePath: PATH }],
    ["one point", { route: [PATH[0]] }],
    ["a point out of range", { route: [PATH[0], { lat: 91, lng: 88 }] }],
    ["a 0,0 point", { route: [...PATH, { lat: 0, lng: 0 }] }],
    ["a string coordinate", { route: [PATH[0], { lat: "22.5", lng: 88.4 }] }],
    ["a latitude/longitude point", { route: [PATH[0], { latitude: 22.5, longitude: 88.4 }] }],
    ["a string route", { route: "_p~iF~ps|U" }],
  ])("rejects %s", (_label, raw) => {
    expect(parseRouteChange(raw)).toBeNull();
  });
});

describe("parseVehicleMeta { reroute, bearing? }", () => {
  it.each<[Record<string, unknown>, { reroute: boolean; bearing: number | null }]>([
    [{ reroute: false, bearing: 90 }, { reroute: false, bearing: 90 }],
    [{ reroute: true, bearing: 270 }, { reroute: true, bearing: 270 }],
    [{ reroute: false, bearing: 0 }, { reroute: false, bearing: 0 }],
    [{ reroute: false }, { reroute: false, bearing: null }],
    [{ reroute: true }, { reroute: true, bearing: null }],
  ])("reads %j", (raw, expected) => {
    expect(parseVehicleMeta(JSON.stringify(raw))).toEqual(expected);
  });

  it.each<Case>([
    ["no reroute", { bearing: 90 }],
    ["string reroute", { reroute: "true", bearing: 90 }],
    ["bearing 360", { reroute: false, bearing: 360 }],
    ["negative bearing", { reroute: false, bearing: -1 }],
    ["string bearing", { reroute: false, bearing: "90" }],
  ])("rejects %s", (_label, raw) => {
    expect(parseVehicleMeta(raw)).toBeNull();
  });
});

describe("parseDriverStatusEvent { driverStatus }", () => {
  it.each(["ENROUTE", "ARRIVED", "POB", "COMPLETED"])("reads %s", (driverStatus) => {
    expect(parseDriverStatusEvent(JSON.stringify({ driverStatus }))).toEqual({ driverStatus });
  });

  it.each<Case>([
    ["no driverStatus", {}],
    ["empty driverStatus", { driverStatus: "" }],
    ["unknown driverStatus", { driverStatus: "FLYING" }],
  ])("rejects %s", (_label, raw) => {
    expect(parseDriverStatusEvent(raw)).toBeNull();
  });
});

describe("parseTripSnapshot (TripSnapshot)", () => {
  const minimal = { ...BASE, driverStatus: "ENROUTE" };
  const location = { lat: 22.5757, lng: 88.4264, timestamp: "2026-11-02T05:33:53.452Z" };

  it("reads the exact snapshot the backend sends", () => {
    expect(
      parseTripSnapshot(
        '{"bookingID":"D0726-28641","tripID":"T01a19aba041673cb815fc84a3c0b48fe","driverID":"663b2f36e420aa532c2a98f6","tripType":"TRIP_S","driverStatus":"ENROUTE","location":{"lat":22.57575355505634,"lng":88.42640291543987,"timestamp":"2026-11-02T05:33:53.452Z"}}',
      ),
    ).toEqual({
      bookingID: "D0726-28641",
      tripID: "T01a19aba041673cb815fc84a3c0b48fe",
      driverID: "663b2f36e420aa532c2a98f6",
      tripType: "TRIP_S",
      driverStatus: "ENROUTE",
      location: {
        lat: 22.57575355505634,
        lng: 88.42640291543987,
        timestamp: "2026-11-02T05:33:53.452Z",
      },
    });
  });

  it("reads every optional field", () => {
    expect(
      parseTripSnapshot({ ...minimal, location, eta: 300, distance: 1500.5, route: PATH, bearing: 90 }),
    ).toEqual({ ...minimal, location, eta: 300, distance: 1500.5, route: PATH, bearing: 90 });
  });

  it("is valid before any source reports", () => {
    expect(parseTripSnapshot(minimal)).toEqual(minimal);
  });

  it("keeps 0 as a real value", () => {
    expect(parseTripSnapshot({ ...minimal, eta: 0, distance: 0, bearing: 0 })).toEqual({
      ...minimal,
      eta: 0,
      distance: 0,
      bearing: 0,
    });
  });

  it.each<Case>([
    ["0,0 location", { location: { ...location, lat: 0, lng: 0 } }],
    ["location without timestamp", { location: { lat: 22.5, lng: 88.4 } }],
    ["fractional eta", { eta: 1.5 }],
    ["negative distance", { distance: -1 }],
    ["one-point route", { route: [PATH[0]] }],
    ["route with a bad point", { route: [PATH[0], { lat: 91, lng: 88 }] }],
    ["bearing 360", { bearing: 360 }],
    ["string bearing", { bearing: "90" }],
  ])("drops %s and keeps the rest", (_label, extra) => {
    expect(parseTripSnapshot({ ...minimal, eta: 60, ...extra })).toEqual(
      "eta" in extra ? minimal : { ...minimal, eta: 60 },
    );
  });

  it.each<Case>([
    ...BAD_BASES.map(([label, raw]): Case => [label, { ...raw, driverStatus: "ENROUTE" }]),
    ["no driverStatus", BASE],
    ["unknown driverStatus", { ...BASE, driverStatus: "PARKED" }],
  ])("rejects %s", (_label, raw) => {
    expect(parseTripSnapshot(raw)).toBeNull();
  });
});

describe("parseNotificationEvent { message }", () => {
  const NOW = Date.parse("2026-11-16T10:30:00.000Z");

  it.each(["Your driver is 2 minutes away", "Your driver has arrived"])("reads %s", (message) => {
    expect(parseNotificationEvent(JSON.stringify({ message }), NOW)).toEqual({
      message,
      receivedAt: "2026-11-16T10:30:00.000Z",
    });
  });

  it("trims the message", () => {
    expect(parseNotificationEvent({ message: "  Hi  " }, NOW)?.message).toBe("Hi");
  });

  it.each<Case>([
    ["no message", {}],
    ["empty message", { message: "  " }],
    ["numeric message", { message: 2 }],
  ])("rejects %s", (_label, raw) => {
    expect(parseNotificationEvent(raw, NOW)).toBeNull();
  });

  it("rejects bad JSON", () => {
    expect(parseNotificationEvent("{ message", NOW)).toBeNull();
  });
});
