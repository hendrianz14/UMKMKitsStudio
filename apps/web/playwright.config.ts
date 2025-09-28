import path from "node:path";
import { defineConfig, devices } from "@playwright/test";

const workspaceRoot = path.resolve(__dirname, "..", "..");

export default defineConfig({
  testDir: "./tests",
  timeout: 60000,
  expect: { timeout: 10000 },
  use: {
    baseURL: "http://localhost:3000",
    viewport: { width: 1440, height: 900 },
    trace: "on-first-retry",
    screenshot: "only-on-failure"
  },
  webServer: {
    cwd: workspaceRoot,
    command: "pnpm -C apps/web start",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] }
    }
  ]
});
