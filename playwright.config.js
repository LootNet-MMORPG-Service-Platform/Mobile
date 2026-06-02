const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './e2e',
  timeout: 45_000,
  expect: {
    timeout: 8_000,
  },
  use: {
    baseURL: 'http://127.0.0.1:8082',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'npx expo start --web --port 8082',
    url: 'http://127.0.0.1:8082/login',
    reuseExistingServer: !process.env.CI,
    timeout: 240_000,
    env: {
      ...process.env,
      BROWSER: 'none',
      EXPO_NO_TELEMETRY: '1',
      EXPO_PUBLIC_API_BASE_URL: 'http://127.0.0.1:3999/api',
    },
  },
  projects: [
    {
      name: 'mobile-web-chromium',
      use: {
        ...devices['Pixel 7'],
      },
    },
  ],
});
