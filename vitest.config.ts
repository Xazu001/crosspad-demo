/// <reference types="vitest" />
import { defineConfig } from "vitest/config";

import path from "path";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths({ projects: ["./tsconfig.cloudflare.json"] })],
  resolve: {
    alias: {
      "#": path.resolve(__dirname, "./app"),
      $: path.resolve(__dirname, "./server"),
      "@": path.resolve(__dirname, "./shared"),
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./test/setup.ts"],
    include: ["test/**/*.test.{ts,tsx}"],
    css: false,
  },
});
