import { expect, test } from '@playwright/test';

const coreRoutes = [
  { name: 'Home', hash: '#home', view: '#view-home' },
  { name: 'Discover', hash: '#discover', view: '#view-discover' },
  { name: 'Participate', hash: '#participate', view: '#view-participate' },
  { name: 'Play', hash: '#play', view: '#view-play' },
  { name: 'Me', hash: '#me', view: '#view-me' }
];

function captureRuntimeErrors(page) {
  const runtime = { pageErrors: [], consoleErrors: [] };
  page.on('pageerror', error => runtime.pageErrors.push(error.message));
  page.on('console', message => {
    if (message.type() === 'error') runtime.consoleErrors.push(message.text());
  });
  return runtime;
}

function expectNoRuntimeErrors(runtime) {
  expect(runtime.pageErrors, `page errors: ${runtime.pageErrors.join('; ')}`).toEqual([]);
  expect(runtime.consoleErrors, `console errors: ${runtime.consoleErrors.join('; ')}`).toEqual([]);
}

async function goTo(page, hash) {
  await page.goto(`/${hash}`);
}

test.describe('CampusHub Phase 1 baseline', () => {
  test.beforeEach(async ({ page }) => {
    // The prototype references Google Fonts, but the test environment blocks
    // external network requests. Keep runtime-error checks focused on the app.
    await page.route('https://fonts.googleapis.com/**', route => route.fulfill({
      status: 200,
      contentType: 'text/css',
      body: ''
    }));
    await page.route('https://fonts.gstatic.com/**', route => route.fulfill({
      status: 200,
      contentType: 'font/woff2',
      body: ''
    }));
  });

  test('application loads without runtime errors', async ({ page }) => {
    const runtime = captureRuntimeErrors(page);
    await goTo(page, '#home');

    await expect(page.locator('#shell')).toBeVisible();
    await expect(page.locator('#view-home')).toBeVisible();
    expectNoRuntimeErrors(runtime);
  });

  test('core student routes fit their configured viewport', async ({ page }) => {
    for (const route of coreRoutes) {
      await goTo(page, route.hash);
      await expect(page.locator(route.view)).toBeVisible();
      const fitsViewport = await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth
      );
      expect(fitsViewport, `${route.name} should not overflow horizontally`).toBe(true);
    }
  });

  test('primary navigation reaches the five student destinations', async ({ page }) => {
    await goTo(page, '#home');

    for (const route of coreRoutes) {
      await page.locator(`#tab-${route.hash.slice(1)}`).click();
      await expect(page.locator(route.view)).toBeVisible();
      expect(new URL(page.url()).hash).toBe(route.hash);
    }
  });

  test('Phase 1 canonical baseline data is rendered', async ({ page }) => {
    await goTo(page, '#home');
    await expect(page.locator('[data-field="tenantYear"]')).toHaveText('Academic Year 2026/2027');
    await expect(page.locator('[data-field="priorityBody"]')).toContainText('Wednesday, 20 May 2026');

    await goTo(page, '#me');
    await expect(page.locator('#view-me [data-field="assuranceBadge"]')).toHaveText('L2 — Roster Match');

    await goTo(page, '#verification');
    await expect(page.locator('#view-verification [data-field="assuranceTitle"]')).toHaveText('L2 — Roster Match');

    await goTo(page, '#event');
    await expect(page.locator('#view-event [data-field="eventDate"]')).toContainText('Fri, 22 May 2026');

    await goTo(page, '#voice');
    const issueTitles = page.locator('#voiceAllList .voice-issue-card .title');
    await expect(issueTitles).toHaveText([
      'Irregular water supply in Halls',
      'Need for more buses during evenings',
      'Slow Wi-Fi at Main Library upper floor'
    ]);
    await expect(issueTitles).toHaveCount(3);
  });

  test('poll privacy copy remains visible without universal XP copy', async ({ page }) => {
    await goTo(page, '#participate');

    await expect(page.locator('#pollPrivacy')).toContainText('Your individual response is private.');
    await expect(page.locator('#view-participate')).not.toContainText('You earned +5 XP');
  });
});
