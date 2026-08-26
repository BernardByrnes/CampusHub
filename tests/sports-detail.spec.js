import { expect, test } from '@playwright/test';

const SPORTS_RESULT_TITLE = 'MUBS 1 — 2 Makerere University';
const SPORTS_SCORE_LABEL = 'Final result: MUBS 1, Makerere University 2';
const SPORTS_REPORT_NOTE = 'Match reports are published by the Guild sports office.';
const SPORTS_VIEWPORTS = [
  { width: 320, height: 844 },
  { width: 390, height: 844 },
  { width: 430, height: 932 },
  { width: 768, height: 1024 },
  { width: 1280, height: 900 }
];

async function blockRemoteFonts(page) {
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
}

async function resetDemo(page) {
  await page.goto('/#home');
  await page.waitForFunction(() => typeof window.CampusHubDebug?.resetDemo === 'function');
  await page.evaluate(() => window.CampusHubDebug.resetDemo());
  await page.evaluate(() => document.querySelectorAll('#toastWrap .toast').forEach(toast => toast.remove()));
}

async function goTo(page, hash) {
  await page.goto(`/${hash}`);
}

async function expectDiscoverNav(page) {
  await expect(page.locator('#tab-discover')).toHaveAttribute('aria-current', 'page');
  await expect(page.locator('.nav-item[aria-current="page"]')).toHaveCount(1);
}

async function expectNoHorizontalOverflow(page) {
  const metrics = await page.evaluate(() => ({
    documentWidth: document.documentElement.scrollWidth,
    bodyWidth: document.body.scrollWidth,
    viewportWidth: window.innerWidth
  }));
  expect(metrics.documentWidth).toBeLessThanOrEqual(metrics.viewportWidth + 1);
  expect(metrics.bodyWidth).toBeLessThanOrEqual(metrics.viewportWidth + 1);
}

test.describe('Phase 8I canonical Sports result detail', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'canonical-mobile', 'Sports detail tests run once at the canonical mobile project.');
    await blockRemoteFonts(page);
    await page.emulateMedia({ reducedMotion: 'reduce' });
  });

  test('renders the canonical result facts and operational note', async ({ page }) => {
    await resetDemo(page);
    await goTo(page, '#sports/mubs-mak');

    const view = page.locator('#view-sports');
    await expect(view).toBeVisible();
    await expect(view.locator('h1')).toHaveCount(1);
    await expect(page.locator('#sportsDetailTitle')).toHaveText(SPORTS_RESULT_TITLE);
    await expect(page.locator('[data-field="sportsScore"]')).toHaveText('1 — 2');
    await expect(page.locator('[data-field="sportsStatus"]')).toHaveText('Final');
    await expect(page.locator('[data-field="sportsDetailDate"]')).toHaveText('17 May 2026');
    await expect(page.locator('[data-field="sportsDetailTime"]')).toHaveText('4:00 PM');
    await expect(page.locator('[data-field="sportsDetailVenue"]')).toHaveText('MUBS Arena');
    await expect(page.locator('[data-field="sportsDetailSport"]')).toHaveText('Football (Men)');
    await expect(page.locator('[data-field="sportsDetailCompetition"]')).toHaveText('University League');
    await expect(page.locator('[data-field="sportsReportNote"]')).toHaveText(SPORTS_REPORT_NOTE);
  });

  test('removes prototype commentary and prohibited student actions', async ({ page }) => {
    await resetDemo(page);
    await goTo(page, '#sports/mubs-mak');

    const view = page.locator('#view-sports');
    await expect(view).not.toContainText('Simple result view.');
    await expect(view).not.toContainText('No line-ups, brackets, predictor or fan comments');
    const controls = (await view.locator('button, a').allTextContents()).join(' ');
    expect(controls).not.toMatch(/Predict|Odds|Bet|Comments|Line-up/i);
    await expect(view.locator('button, a')).toHaveCount(1);
    await expect(view.getByRole('button', { name: 'Back' })).toBeVisible();
  });

  test('exposes a complete accessible final score while keeping crests decorative', async ({ page }) => {
    await resetDemo(page);
    await goTo(page, '#sports/mubs-mak');

    const scoreboard = page.locator('#sportsScoreboard');
    await expect(scoreboard).toHaveAttribute('role', 'group');
    await expect(scoreboard).toHaveAttribute('aria-label', SPORTS_SCORE_LABEL);
    await expect(page.getByRole('group', { name: SPORTS_SCORE_LABEL })).toHaveCount(1);
    await expect(scoreboard.locator('.sports-crest[aria-hidden="true"]')).toHaveCount(2);
    await expect(scoreboard.locator('.sports-score[aria-hidden="true"]')).toHaveText('1 — 2');
    await expect(scoreboard.locator('.sports-crest').nth(0)).toHaveText('MUBS');
    await expect(scoreboard.locator('.sports-crest').nth(1)).toHaveText('MUK');
  });

  test('focuses the detail title from Discover and preserves Discover navigation state', async ({ page }) => {
    await resetDemo(page);
    await goTo(page, '#discover');
    await page.locator('#discoverList [data-discover-id="mubs-mak"] a').click();

    await expect(page.locator('#view-sports')).toBeVisible();
    await expect(page.locator('#sportsDetailTitle')).toHaveText(SPORTS_RESULT_TITLE);
    await expect.poll(() => page.evaluate(() => document.activeElement?.id)).toBe('sportsDetailTitle');
    expect(new URL(page.url()).hash).toBe('#sports/mubs-mak');
    await expectDiscoverNav(page);

    await page.locator('#view-sports [data-back]').click();
    await expect(page.locator('#view-discover')).toBeVisible();
    expect(new URL(page.url()).hash).toBe('#discover');
  });

  test('resolves and reloads the direct canonical route without prior surface state', async ({ page }) => {
    await goTo(page, '#sports/mubs-mak');
    await expect(page.locator('#view-sports')).toBeVisible();
    await expect(page.locator('#sportsDetailTitle')).toHaveText(SPORTS_RESULT_TITLE);
    await expectDiscoverNav(page);
    await page.reload();
    await expect(page.locator('#view-sports')).toBeVisible();
    await expect(page.locator('#sportsDetailTitle')).toHaveText(SPORTS_RESULT_TITLE);
    await expect.poll(() => page.evaluate(() => document.activeElement?.id)).toBe('sportsDetailTitle');
    expect(new URL(page.url()).hash).toBe('#sports/mubs-mak');
  });

  test('invalid Sports IDs fall back to Discover without showing stale detail', async ({ page }) => {
    await goTo(page, '#sports/not-real');

    await expect(page.locator('#view-discover')).toBeVisible();
    await expect(page.locator('#view-sports')).toBeHidden();
    await expect(page.locator('#sportsDetailTitle')).not.toBeVisible();
    await expectDiscoverNav(page);
    expect(new URL(page.url()).hash).toBe('#discover');
  });

  test('keeps one canonical result identity across Home, Discover, detail, and search', async ({ page }) => {
    await resetDemo(page);
    await goTo(page, '#home');
    await expect(page.locator('#homeSports')).toContainText(SPORTS_RESULT_TITLE);
    await expect(page.locator('#homeSports')).toContainText('17 May 2026');
    await expect(page.locator('#homeSports [data-testid="home-sports-link"]')).toHaveAttribute('href', '#sports/mubs-mak');

    await goTo(page, '#discover');
    const sportsCard = page.locator('#discoverList [data-discover-id="mubs-mak"]');
    await expect(sportsCard).toContainText(SPORTS_RESULT_TITLE);
    await expect(sportsCard).toContainText('Football (Men) • University League');
    await expect(sportsCard.locator('a')).toHaveAttribute('href', '#sports/mubs-mak');

    const search = page.getByLabel('Search campus content');
    await search.fill('MUBS');
    await expect(page.locator('#discoverList [data-discover-id="mubs-mak"]')).toHaveCount(1);
    await search.fill('football');
    await expect(page.locator('#discoverList [data-discover-id="mubs-mak"]')).toHaveCount(1);
    await expect(page.locator('#discoverList [data-discover-id]')).toHaveCount(1);
  });

  test('keeps the result contained and usable across the responsive matrix', async ({ page }) => {
    for (const viewport of SPORTS_VIEWPORTS) {
      await page.setViewportSize(viewport);
      await goTo(page, '#sports/mubs-mak');
      await expect(page.locator('#view-sports')).toBeVisible();
      await expectNoHorizontalOverflow(page);

      const metrics = await page.evaluate(() => {
        const scoreboard = document.querySelector('#sportsScoreboard')?.getBoundingClientRect();
        const shell = document.querySelector('#shell')?.getBoundingClientRect();
        const back = document.querySelector('#view-sports [data-back]')?.getBoundingClientRect();
        return {
          scoreboardLeft: scoreboard?.left ?? 0,
          scoreboardRight: scoreboard?.right ?? 0,
          shellLeft: shell?.left ?? 0,
          shellRight: shell?.right ?? 0,
          shellWidth: shell?.width ?? 0,
          backWidth: back?.width ?? 0,
          backHeight: back?.height ?? 0,
          viewportWidth: window.innerWidth
        };
      });
      expect(metrics.scoreboardLeft).toBeGreaterThanOrEqual(metrics.shellLeft - 1);
      expect(metrics.scoreboardRight).toBeLessThanOrEqual(metrics.shellRight + 1);
      expect(metrics.scoreboardRight).toBeLessThanOrEqual(metrics.viewportWidth + 1);
      expect(metrics.backWidth).toBeGreaterThanOrEqual(44);
      expect(metrics.backHeight).toBeGreaterThanOrEqual(44);
      expect(metrics.shellWidth).toBeLessThanOrEqual(431);
      await expect(page.locator('[data-field="sportsScore"]')).toBeVisible();
    }
  });
});
