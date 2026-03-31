import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/unit",
  testMatch: "*.spec.ts",
  fullyParallel: false,
  reporter: [["line"]],
  use: {},
});
