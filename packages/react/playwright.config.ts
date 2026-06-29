import { defineConfig, devices } from '@playwright/test';

const HOST = process.env.PLAYWRIGHT_HOST || '0.0.0.0';
const PORT = process.env.PLAYWRIGHT_PORT || '5173';
const BASE_URL_HOST = process.env.PLAYWRIGHT_BASEURL_HOST || '127.0.0.1';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: `http://${BASE_URL_HOST}:${PORT}`,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'msedge',
      use: { ...devices['Desktop Edge'], channel: 'msedge' },
    },
  ],
  webServer: {
    command: `npm run dev -- --host ${HOST} --port ${PORT}`,
    url: `http://${BASE_URL_HOST}:${PORT}`,
    reuseExistingServer: !process.env.CI,
  },
});
