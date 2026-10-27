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
    allowedHosts: ["tracking-mxfqr.ondigitalocean.app"],

    proxy: {
      "/realtime": {
        target: "https://testapi.drivado.com",
        changeOrigin: true,
      },
    },
  },
});
