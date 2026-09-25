// import { Navigate } from "react-router-dom";

import type { RouteObject } from "react-router-dom";

import LiveTrackingDashboard from "../pages/liveTracking/dashboard";

export const routes: RouteObject[] = [
  {
    path: "/tracking-dashboard",
    element: <LiveTrackingDashboard />,
  },
];
