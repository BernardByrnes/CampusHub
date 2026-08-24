import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  globalTeardown: './tests/global-teardown.mjs',
  fullyParallel: true,
  timeout: 30_000,
  expect: {
    timeout: 5_000
  },
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'off',
    screenshot: 'off',
    video: 'off'
  },
  webServer: {
    command: 'node tests/static-server.mjs',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: false,
    gracefulShutdown: { signal: 'SIGTERM', timeout: 1_000 },
    timeout: 30_000
  },
  projects: [
    {
      name: 'small-mobile',
      use: { viewport: { width: 320, height: 844 } }
    },
    {
      name: 'canonical-mobile',
      use: { viewport: { width: 390, height: 844 } }
    },
    {
      name: 'large-mobile',
      use: { viewport: { width: 430, height: 932 } }
    },
    {
      name: 'desktop',
      use: { viewport: { width: 1280, height: 900 } }
    }
  ]
});
