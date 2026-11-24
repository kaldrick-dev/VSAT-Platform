import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // MapLibre resolves its web worker relative to its own module URL, which
  // dev-time pre-bundling would break.
  optimizeDeps: { exclude: ["maplibre-gl"] },
  server: {
    port: 5173,
    proxy: {
      "/api": "http://localhost:4001"
    }
  }
});

