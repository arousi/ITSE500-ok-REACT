// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * Smoke E2E: the app loads and its one real user path (the two outbound
 * DigitalOcean links) renders correctly. This app is currently the
 * unmodified `sample-react` scaffold with no routing/auth/data flow, so a
 * single smoke test is deliberately the full scope here — expand this file
 * as real pages/flows are added, rather than fabricating additional
 * "journeys" through a static page.
 */

test('the app loads and renders the DigitalOcean sample links', async ({ page }) => {
  await page.goto('/');

  await expect(
    page.getByRole('heading', { name: /Welcome to Your New React App/i })
  ).toBeVisible();

  const docsLink = page.getByRole('link', { name: /DigitalOcean Docs/i });
  await expect(docsLink).toBeVisible();
  await expect(docsLink).toHaveAttribute(
    'href',
    'https://www.digitalocean.com/docs/app-platform'
  );

  const dashboardLink = page.getByRole('link', { name: /DigitalOcean Dashboard/i });
  await expect(dashboardLink).toBeVisible();
  await expect(dashboardLink).toHaveAttribute(
    'href',
    'https://cloud.digitalocean.com/apps'
  );
});
