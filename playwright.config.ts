import { defineConfig, devices } from "@playwright/test";

const REAL_BACKEND_MODE = process.env.PLAYWRIGHT_REAL_BACKEND === "1";
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? (REAL_BACKEND_MODE ? "http://localhost:3001" : "http://localhost:3000");
const WEB_SERVER_COMMAND =
  process.env.PLAYWRIGHT_WEB_SERVER_COMMAND ??
  (REAL_BACKEND_MODE ? "npm run dev:3001:api" : "npm run dev:mock");

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 60_000,
  expect: {
    timeout: 8_000,
  },
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    navigationTimeout: 30_000,
    actionTimeout: 10_000,
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
      },
    },
  ],
  webServer: {
    command: WEB_SERVER_COMMAND,
    url: BASE_URL,
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
