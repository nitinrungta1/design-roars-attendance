import { defineConfig } from "vitest/config";
import path from "path";

// We intentionally don't use @vitejs/plugin-react here — Vitest's default
// esbuild transform handles JSX/TSX, and the React plugin trips on Vite's
// internal exports in this monorepo's bundle.
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  esbuild: {
    jsx: "automatic",
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    css: false,
    server: {
      deps: {
        inline: [/@tanstack\/react-start/],
      },
    },
  },
});
