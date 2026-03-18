import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/unit",
  fullyParallel: false,
  reporter: [["line"]],
  use: {},
});
