import { defineConfig } from '@playwright/test';
import { FIXTURE_ORIGIN } from './tests/e2e/fixture-server';

// Store screenshots and the promo tile, run by `pnpm screenshots`. A separate
// config with its own testDir, so `pnpm test:e2e` and CI never run it. It loads
// the same E2E build and fixture server as the E2E tests.
export default defineConfig({
  testDir: './tests/screenshots',
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  webServer: {
    command: 'node tests/e2e/server.ts',
    url: `${FIXTURE_ORIGIN}/index.html`,
    reuseExistingServer: true,
    stdout: 'ignore',
  },
});
