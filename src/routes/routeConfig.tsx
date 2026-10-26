import { Navigate } from "react-router-dom";
import type { RouteObject } from "react-router-dom";
import TripNotFound from "../pages/liveTracking/tripNotFound";
import LiveTracking from "@/pages/liveTracking";

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
    element: <LiveTracking />,
  },
  {
    path: "*",
    element: <Navigate to="/tracking" replace />,
  },
];
