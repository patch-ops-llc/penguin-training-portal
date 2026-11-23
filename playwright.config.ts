import { defineConfig } from "@playwright/test";

const PORT = Number(process.env.PORT ?? 3000);
const BASE_URL = process.env.E2E_BASE_URL ?? `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "tests",
  timeout: 60_000,
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: BASE_URL,
    channel: "chrome",
    viewport: { width: 1440, height: 900 },
    trace: "retain-on-failure",
  },
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: `npx next start -p ${PORT}`,
        url: `${BASE_URL}/api/health`,
        reuseExistingServer: false,
        timeout: 60_000,
        env: {
          ...process.env,
          APP_URL: BASE_URL,
        },
      },
});
