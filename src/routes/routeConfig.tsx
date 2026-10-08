// import { Navigate } from "react-router-dom";

import type { RouteObject } from "react-router-dom";

import LiveTrackingDashboard from "../pages/liveTracking/dashboard";
import Tracking from "@/pages/liveTracking/tracking";

export const routes: RouteObject[] = [
  {
    path: "/tracking-dashboard",
    element: <LiveTrackingDashboard />,
  },
  {
    path: "/tracking",
    element: <Tracking />,
  },
];
