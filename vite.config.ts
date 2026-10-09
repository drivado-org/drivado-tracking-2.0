import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    // The tracking API sends no CORS headers, so in dev the browser calls
    // /realtime/... on localhost and Vite forwards it. Production: set
    // VITE_TRACKING_API_BASE_URL once the backend allows our origin.
    proxy: {
      "/realtime": {
        target: "https://testapi.drivado.com",
        changeOrigin: true,
      },
    },
  },
});
