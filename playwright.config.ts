import { defineConfig, devices } from "@playwright/test";

const REAL_BACKEND_MODE = process.env.PLAYWRIGHT_REAL_BACKEND === "1";
const DEFAULT_PORT = REAL_BACKEND_MODE ? "3001" : "3000";
const PLAYWRIGHT_PORT = process.env.PLAYWRIGHT_PORT ?? DEFAULT_PORT;
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${PLAYWRIGHT_PORT}`;
const WEB_SERVER_COMMAND_BASE =
  process.env.PLAYWRIGHT_WEB_SERVER_COMMAND ??
  (REAL_BACKEND_MODE ? "npm run dev:3001:api" : `PORT=${PLAYWRIGHT_PORT} npm run dev:mock`);
const WEB_SERVER_COMMAND = `PLAYWRIGHT_TEST=1 ${WEB_SERVER_COMMAND_BASE}`;

export default defineConfig({
  testDir: "./tests/e2e",
  globalSetup: "./tests/e2e/global-setup.ts",
  timeout: 90_000,
  workers: process.env.CI ? 2 : 3,
  expect: {
    timeout: 8_000,
  },
  retries: process.env.CI ? 2 : 1,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: BASE_URL,
    navigationTimeout: 30_000,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
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
