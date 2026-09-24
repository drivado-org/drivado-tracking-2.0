import { BrowserRouter, useRoutes } from "react-router-dom";

import { routes } from "../routes/routeConfig";

const AppRoutes = () => {
  return useRoutes(routes);
};

export const AppRouter = () => {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
};
