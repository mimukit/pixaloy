import { defineConfig } from '@playwright/test';
import { FIXTURE_ORIGIN } from './tests/e2e/fixture-server';

// E2E tests load the E2E build from .output/chrome-mv3-e2e.
// `pnpm test:e2e` runs `wxt build --mode e2e` first through the `pretest:e2e` script.
// That build differs from production only by host access to the local fixture
// server (see wxt.config.ts).
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'node tests/e2e/server.ts',
    url: `${FIXTURE_ORIGIN}/index.html`,
    reuseExistingServer: !process.env.CI,
    stdout: 'ignore',
  },
});
