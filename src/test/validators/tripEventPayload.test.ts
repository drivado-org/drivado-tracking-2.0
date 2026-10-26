import {
  isEtaPending,
  parseEtaEvent,
  parseRouteChange,
  parseVehicleMeta,
} from "@/validators/tripEventPayload";

const BASE = { driverID: "D1", bookingID: "B1", tripID: "T1", tripType: "TRIP_S" };
const PATH = [
  { lat: 22.5785, lng: 88.446 },
  { lat: 22.5763, lng: 88.4375 },
  { lat: 22.5726, lng: 88.4197 },
];

/** Rules shared by every event: required ids and tripType oneof TRIP_S TRIP_D. */
type Case = [label: string, raw: Record<string, unknown>];

const BAD_BASES: Case[] = [
  ["no driverID", { ...BASE, driverID: undefined }],
  ["empty bookingID", { ...BASE, bookingID: "  " }],
  ["numeric tripID", { ...BASE, tripID: 1 }],
  ["no tripType", { ...BASE, tripType: undefined }],
  ["unknown tripType", { ...BASE, tripType: "TRIP_X" }],
  ["lowercase tripType", { ...BASE, tripType: "trip_s" }],
];

describe("parseEtaEvent (ETAUpdate)", () => {
  const NOW = Date.parse("2026-10-15T10:00:00.000Z");
  const valid = { ...BASE, driverStatus: "ENROUTE", eta: 300, distance: 1500.5 };

  it("keeps every field and computes the arrival time", () => {
    expect(parseEtaEvent(JSON.stringify(valid), NOW)).toEqual({
      ...BASE,
      driverStatus: "ENROUTE",
      etaSeconds: 300,
      distanceMeters: 1500.5,
      arrivalTime: "2026-10-15T10:05:00.000Z",
    });
  });

  it.each([undefined, ""])("allows driverStatus %p (omitempty)", (driverStatus) => {
    expect(parseEtaEvent({ ...valid, driverStatus }, NOW)?.driverStatus).toBeNull();
  });

  it("reads bookingStatus before driverStatus, in any case", () => {
    expect(
      parseEtaEvent({ ...valid, bookingStatus: "pob", driverStatus: "ENROUTE" }, NOW)?.driverStatus,
    ).toBe("POB");
    expect(parseEtaEvent({ ...valid, bookingStatus: "" }, NOW)?.driverStatus).toBe("ENROUTE");
  });

  it("reads ARRIVE as ARRIVED", () => {
    expect(parseEtaEvent({ ...valid, bookingStatus: "ARRIVE" }, NOW)?.driverStatus).toBe(
      "ARRIVED",
    );
  });

  it("accepts eta 0 and distance 0 (arrived)", () => {
    expect(parseEtaEvent({ ...valid, eta: 0, distance: 0 }, NOW)).toMatchObject({
      etaSeconds: 0,
      distanceMeters: 0,
    });
  });

  it.each<Case>([
    ...BAD_BASES,
    ["unknown driverStatus", { ...BASE, driverStatus: "FLYING", eta: 1, distance: 1 }],
    ["unknown bookingStatus", { ...BASE, bookingStatus: "FLYING", eta: 1, distance: 1 }],
    ["no eta", { ...BASE, distance: 1 }],
    ["negative eta", { ...BASE, eta: -1, distance: 1 }],
    ["fractional eta", { ...BASE, eta: 1.5, distance: 1 }],
    ["string eta", { ...BASE, eta: "300", distance: 1 }],
    ["no distance", { ...BASE, eta: 1 }],
    ["negative distance", { ...BASE, eta: 1, distance: -0.1 }],
  ])("rejects %s", (_label, raw) => {
    const payload = "eta" in raw || "distance" in raw ? raw : { ...raw, eta: 1, distance: 1 };
    expect(parseEtaEvent(payload, NOW)).toBeNull();
  });

  it("marks the opening { driverStatus: '', eta: 0, distance: 0 } as pending", () => {
    const opening = parseEtaEvent({ ...BASE, driverStatus: "", eta: 0, distance: 0 }, NOW)!;
    expect(isEtaPending(opening)).toBe(true);
    expect(isEtaPending(parseEtaEvent({ ...valid, eta: 0, distance: 0 }, NOW)!)).toBe(false);
    expect(isEtaPending(parseEtaEvent(valid, NOW)!)).toBe(false);
  });

  it.each([null, "not json", []])("rejects %p", (raw) => {
    expect(parseEtaEvent(raw, NOW)).toBeNull();
  });
});

describe("parseRouteChange (RouteChange)", () => {
  const valid = { ...BASE, driverStatus: "POB", routePath: PATH };

  it("keeps every field", () => {
    expect(parseRouteChange(JSON.stringify(valid))).toEqual(valid);
  });

  it.each<Case>([
    ...BAD_BASES.map(([label, base]): Case => [label, { ...base, driverStatus: "POB", routePath: PATH }]),
    ["no driverStatus", { ...BASE, routePath: PATH }],
    ["no routePath", { ...BASE, driverStatus: "POB" }],
    ["one point", { ...valid, routePath: [PATH[0]] }],
    ["a point out of range", { ...valid, routePath: [PATH[0], { lat: 91, lng: 88 }] }],
    ["a 0,0 point", { ...valid, routePath: [...PATH, { lat: 0, lng: 0 }] }],
    ["a string coordinate", { ...valid, routePath: [PATH[0], { lat: "22.5", lng: 88.4 }] }],
    ["a latitude/longitude point", { ...valid, routePath: [PATH[0], { latitude: 22.5, longitude: 88.4 }] }],
    ["a string routePath", { ...valid, routePath: "_p~iF~ps|U" }],
  ])("rejects %s", (_label, raw) => {
    expect(parseRouteChange(raw)).toBeNull();
  });
});

describe("parseVehicleMeta (TripVehicleMeta)", () => {
  const valid = { ...BASE, driverStatus: "ENROUTE", reroute: true, bearing: 359 };

  it("keeps every field", () => {
    expect(parseVehicleMeta(JSON.stringify(valid))).toEqual(valid);
  });

  it("accepts bearing 0", () => {
    expect(parseVehicleMeta({ ...valid, bearing: 0 })?.bearing).toBe(0);
  });

  it("accepts an event without bearing (the backend leaves it out)", () => {
    expect(parseVehicleMeta({ ...valid, bearing: undefined })).toEqual({ ...valid, bearing: null });
  });

  it.each<Case>([
    ...BAD_BASES.map(
      ([label, base]): Case => [label, { ...base, driverStatus: "ENROUTE", reroute: false, bearing: 1 }],
    ),
    ["no driverStatus", { ...valid, driverStatus: undefined }],
    ["no reroute", { ...valid, reroute: undefined }],
    ["string reroute", { ...valid, reroute: "true" }],
    ["bearing 360", { ...valid, bearing: 360 }],
    ["negative bearing", { ...valid, bearing: -1 }],
    ["string bearing", { ...valid, bearing: "90" }],
  ])("rejects %s", (_label, raw) => {
    expect(parseVehicleMeta(raw)).toBeNull();
  });
});
