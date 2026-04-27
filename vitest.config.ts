import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    css: false,
    server: {
      deps: {
        // Avoid trying to bundle the TanStack Start server runtime in tests
        inline: [/@tanstack\/react-start/],
      },
    },
  },
});
