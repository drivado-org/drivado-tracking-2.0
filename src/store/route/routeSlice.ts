import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type {
  EtaUpdate,
  RouteChange,
  RouteState,
  TripVehicleMeta,
} from "@/types/route";
import { startTracking } from "@/store/tracking/trackingSlice";

const initialState: RouteState = {
  route: null,
  eta: null,
  vehicleMeta: null,
};

const routeSlice = createSlice({
  name: "route",

  initialState,

  reducers: {
    routeChanged: (state, action: PayloadAction<RouteChange>) => {
      state.route = action.payload;
      // The new route is the answer to the reroute.
      if (state.vehicleMeta) state.vehicleMeta.reroute = false;
    },

    etaUpdate: (state, action: PayloadAction<EtaUpdate>) => {
      state.eta = action.payload;
    },

    /** An event without bearing keeps the last one, so the car doesn't snap north. */
    vehicleMetaUpdate: (state, action: PayloadAction<TripVehicleMeta>) => {
      state.vehicleMeta = {
        ...action.payload,
        bearing: action.payload.bearing ?? state.vehicleMeta?.bearing ?? null,
      };
    },
  },

  extraReducers: (builder) => {
    // A new trip starts without the previous trip's route and ETA.
    builder.addCase(startTracking, () => initialState);
  },
});

export const { routeChanged, etaUpdate, vehicleMetaUpdate } = routeSlice.actions;

type RouteRootState = { route: RouteState };

export const selectRoutePath = (state: RouteRootState) =>
  state.route.route?.routePath ?? null;

export const selectEta = (state: RouteRootState) => state.route.eta;

export const selectVehicleMeta = (state: RouteRootState) => state.route.vehicleMeta;

export const selectBearing = (state: RouteRootState) =>
  state.route.vehicleMeta?.bearing ?? null;

export const selectIsRerouting = (state: RouteRootState) =>
  state.route.vehicleMeta?.reroute ?? false;

export default routeSlice.reducer;
