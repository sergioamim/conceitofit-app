import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/unit",
  testMatch: ["*.spec.ts", "*.spec.tsx"],
  fullyParallel: false,
  reporter: [["line"]],
  use: {},
});
