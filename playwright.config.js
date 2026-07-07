// @ts-check
const { defineConfig, devices } = require('@playwright/test');

/**
 * Playwright E2E config.
 *
 * Base URL is configurable via E2E_BASE_URL so this suite can run against:
 *   - a local dev/preview server (default: http://localhost:3000), or
 *   - the containerized Django-backed environment once the cross-repo
 *     integration workflow (itse500-django `.github/workflows/integration.yml`,
 *     per ci-test-conventions.md §4) stands up the full stack.
 *
 * Not gated on PRs yet — see .github/workflows/e2e.yml (workflow_dispatch
 * only for now).
 */
const baseURL = process.env.E2E_BASE_URL || 'http://localhost:3000';

module.exports = defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'html',
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  // Only auto-start a local dev server when targeting the default local
  // baseURL — when pointed at a remote/containerized E2E_BASE_URL, assume
  // the target is already running.
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: 'npx serve -s build -l 3000',
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 120 * 1000,
      },
});
