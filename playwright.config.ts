import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 120 * 1000,
  expect: {
    timeout: 5 * 1000,
  },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://127.0.0.1:5173',
    trace: 'on-first-retry',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: {
    // Invoke the dev script directly (not `npm start`, which is `npm run dev`):
    // nesting `npm run` swallows the `--host`/`--port` flags, so Vite would
    // bind to its default host and CI's 127.0.0.1 probe would time out.
    command: 'npm run dev -- --host 127.0.0.1 --port 5173',
    env: {
      VITE_AUTH_MOCK: '1',
      VITE_API_URL: 'https://api.example.test',
    },
    url: 'http://127.0.0.1:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
