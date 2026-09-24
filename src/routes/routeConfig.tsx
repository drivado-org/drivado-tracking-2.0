// import { Navigate } from "react-router-dom";

import type { RouteObject } from "react-router-dom";

import ManageBookingPage from "../pages/manageBooking/manageBookingPage";

export const routes: RouteObject[] = [
  {
    path: "/manage-booking",
    element: <ManageBookingPage />,
  },
];
