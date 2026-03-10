import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/unit",
  timeout: 30_000,
  expect: {
    timeout: 5_000,
  },
  reporter: [["list"]],
  workers: 1,
});
