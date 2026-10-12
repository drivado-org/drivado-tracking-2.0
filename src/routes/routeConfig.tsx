import { Navigate } from "react-router-dom";

import type { RouteObject } from "react-router-dom";

import LiveTrackingDashboard from "../pages/liveTracking/dashboard";
import TripNotFound from "../pages/liveTracking/tripNotFound";

export const routes: RouteObject[] = [
  {
    path: "/",
    element: <Navigate to="/tracking" replace />,
  },
  {
    path: "/tracking",
    element: <TripNotFound />,
  },
  {
    path: "/tracking/:tripId",
    element: <LiveTrackingDashboard />,
  },
  {
    path: "*",
    element: <Navigate to="/tracking" replace />,
  },
];
