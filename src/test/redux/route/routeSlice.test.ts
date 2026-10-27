import type { RouteChange } from "@/types/route";
import reducer, { routeChanged, selectRoutePath } from "@/store/route/routeSlice";

const initial = reducer(undefined, { type: "@@INIT" });

const change = (routePath: RouteChange["routePath"]): RouteChange => ({
  driverID: "DRIVER_123",
  bookingID: "B1",
  tripID: "T123",
  tripType: "TRIP_S",
  driverStatus: "ENROUTE",
  routePath,
});

const PATH = [
  { lat: 22.57, lng: 88.4 },
  { lat: 22.58, lng: 88.41 },
];

describe("routeSlice routeChanged", () => {
  it("keeps the same route array when the same route is sent again", () => {
    const first = reducer(initial, routeChanged(change(PATH)));
    const again = reducer(first, routeChanged(change(PATH.map((p) => ({ ...p })))));

    expect(selectRoutePath({ route: again })).toBe(selectRoutePath({ route: first }));
  });

  it("takes a different route", () => {
    const first = reducer(initial, routeChanged(change(PATH)));
    const other = [PATH[0], { lat: 22.59, lng: 88.42 }];
    const next = reducer(first, routeChanged(change(other)));

    expect(selectRoutePath({ route: next })).toEqual(other);
  });
});
