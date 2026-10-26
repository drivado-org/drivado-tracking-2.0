import { combineReducers, configureStore } from "@reduxjs/toolkit";
import createSagaMiddleware from "redux-saga";

import trackingReducer from "@/store/tracking/trackingSlice";
import liveBookingReducer from "@/store/liveBooking/liveBookingSlice";
import routeReducer from "@/store/route/routeSlice";
import rootSaga from "./rootSaga";

const rootReducer = combineReducers({
  tracking: trackingReducer,
  liveBooking: liveBookingReducer,
  route: routeReducer,
});

export const createAppStore = () => {
  const sagaMiddleware = createSagaMiddleware();

  const store = configureStore({
    reducer: rootReducer,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        thunk: false,
      }).concat(sagaMiddleware),
  });

  sagaMiddleware.run(rootSaga);

  return store;
};

export const store = createAppStore();

export type RootState = ReturnType<typeof rootReducer>;
export type AppStore = ReturnType<typeof createAppStore>;
export type AppDispatch = AppStore["dispatch"];
