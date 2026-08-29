import { defineConfig } from "@playwright/test"

const baseURL = "http://localhost:3100"

export default defineConfig({
  forbidOnly: true,
  fullyParallel: false,
  globalSetup: "./e2e/instant-navigation-global-setup.ts",
  outputDir: ".scratch/instant-nav/test-results",
  projects: [
    {
      name: "desktop-chromium",
      use: {
        browserName: "chromium",
        viewport: { height: 800, width: 1280 },
      },
    },
    {
      name: "mobile-chromium",
      use: {
        browserName: "chromium",
        hasTouch: true,
        isMobile: true,
        viewport: { height: 844, width: 390 },
      },
    },
  ],
  reporter: "line",
  retries: 0,
  testDir: "./e2e",
  testMatch: "**/*.e2e.ts",
  use: {
    baseURL,
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "bun run build && PORT=3100 bun run start",
    env: {
      ...process.env,
      BETTER_AUTH_URL: baseURL,
      INSTANT_E2E: "1",
    },
    reuseExistingServer: false,
    stderr: "pipe",
    stdout: "pipe",
    timeout: 120_000,
    url: `${baseURL}/sign-in`,
  },
})
