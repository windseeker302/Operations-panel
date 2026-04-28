import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

export default defineConfig({
  root: path.resolve(__dirname, "frontend"),
  publicDir: path.resolve(__dirname, "frontend/public"),
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "frontend/src"),
    },
  },
  build: {
    outDir: path.resolve(__dirname, "html"),
    emptyOutDir: false,
  },
  server: {
    port: 5173,
    host: "0.0.0.0",
  },
});
