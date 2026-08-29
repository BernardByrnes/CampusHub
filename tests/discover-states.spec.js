import { expect, test } from '@playwright/test';

const DISCOVER_VIEWPORTS = [
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

async function resetAndGo(page) {
  await page.goto('/#home');
  await page.waitForFunction(() => typeof window.CampusHubDebug?.resetDemo === 'function');
  await page.evaluate(() => window.CampusHubDebug.resetDemo());
  await page.evaluate(() => document.querySelectorAll('#toastWrap .toast').forEach(toast => toast.remove()));
  await page.goto('/#discover');
  await expect(page.locator('#view-discover')).toBeVisible();
}

async function setDiscoverState(page, state) {
  await page.evaluate(nextState => window.CampusHubDebug.setDiscoverState(nextState), state);
}

async function discoverState(page) {
  return page.evaluate(() => window.CampusHubDebug.getDiscoverState());
}

async function expectNoHorizontalOverflow(page) {
  await expect.poll(() => page.evaluate(() => (
    document.documentElement.scrollWidth <= window.innerWidth + 1
    && document.body.scrollWidth <= window.innerWidth + 1
  ))).toBe(true);
}

test.describe('Phase 8H Discover resilient system states', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'canonical-mobile', 'Discover state tests run once at the canonical mobile project.');
    await blockRemoteFonts(page);
    await page.emulateMedia({ reducedMotion: 'reduce' });
  });

  test('ready is the default state and preserves the canonical Discover list', async ({ page }) => {
    await resetAndGo(page);

    expect(await discoverState(page)).toBe('ready');
    await expect(page.locator('#discoverList [data-discover-id]')).toHaveCount(4);
    await expect(page.locator('#discoverSystemState')).toBeEmpty();
    await expect(page.locator('#discoverList .discover-skeleton')).toHaveCount(0);
    await expect(page.locator('#discoverList .discover-error')).toHaveCount(0);
    await expect(page.locator('#discoverList')).not.toHaveAttribute('aria-busy', 'true');
  });

  test('loading shows accessible skeletons while keeping search controls and route', async ({ page }) => {
    await resetAndGo(page);
    const search = page.getByLabel('Search campus content');
    await search.focus();
    await setDiscoverState(page, 'loading');

    expect(new URL(page.url()).hash).toBe('#discover');
    await expect(page.locator('#discoverList')).toHaveAttribute('aria-busy', 'true');
    await expect(page.locator('#discoverList .sr-only')).toHaveText('Loading campus information.');
    await expect(page.locator('#discoverList .discover-skeleton')).toHaveCount(3);
    await expect(page.locator('#discoverList .discover-skeletons')).toHaveAttribute('aria-hidden', 'true');
    await expect(page.locator('#discoverList [data-discover-id]')).toHaveCount(0);
    await expect(page.locator('#discoverList .spinner')).toHaveCount(0);
    await expect(page.getByLabel('Search campus content')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Filters' })).toBeVisible();
    await expect(page.locator('#discoverFilters')).toBeVisible();
    await expect(search).toBeFocused();
  });

  test('loading and ready preserve the existing query and filter state', async ({ page }) => {
    await resetAndGo(page);
    await page.locator('[data-filter="Opportunities"]').click();
    await page.getByLabel('Search campus content').fill('climate');

    await setDiscoverState(page, 'loading');
    await expect(page.locator('#discoverList [data-discover-id]')).toHaveCount(0);
    await setDiscoverState(page, 'ready');

    await expect(page.getByLabel('Search campus content')).toHaveValue('climate');
    await expect(page.locator('[data-filter="Opportunities"]')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('#discoverList [data-discover-id="ra-climate"]')).toBeVisible();
    await expect(page.locator('#discoverList [data-discover-id]')).toHaveCount(1);
  });

  test('error is distinct from search-empty and retry restores ready with focus', async ({ page }) => {
    await resetAndGo(page);
    await page.locator('[data-filter="News"]').click();
    await page.getByLabel('Search campus content').fill('CoCIS');
    await setDiscoverState(page, 'error');

    await expect(page.locator('#discoverList')).toHaveAttribute('aria-live', 'polite');
    await expect(page.locator('#discoverList')).toContainText('We couldn’t load campus information.');
    await expect(page.getByRole('button', { name: 'Try again' })).toBeVisible();
    await expect(page.locator('#discoverList')).not.toContainText('No campus information matches that search.');
    await expect(page.locator('#discoverList')).not.toContainText('ACCESS DENIED');
    await expect(page.locator('#discoverList [data-discover-id]')).toHaveCount(0);
    await expect(page.locator('#discoverList')).not.toHaveAttribute('aria-busy', 'true');

    await page.getByRole('button', { name: 'Try again' }).click();
    expect(await discoverState(page)).toBe('ready');
    await expect(page.getByLabel('Search campus content')).toHaveValue('CoCIS');
    await expect(page.locator('[data-filter="News"]')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('#discoverList [data-discover-id="cocis-innovation-lab"]')).toBeVisible();
    await expect(page.getByLabel('Search campus content')).toBeFocused();
  });

  test('offline keeps cached content and remains distinct from error', async ({ page }) => {
    await resetAndGo(page);
    await setDiscoverState(page, 'offline');

    await expect(page.locator('#discoverSystemState .discover-offline-banner')).toHaveAttribute('role', 'status');
    await expect(page.locator('#discoverSystemState')).toContainText('You’re offline. Showing cached campus information.');
    await expect(page.locator('#discoverList [data-discover-id]')).toHaveCount(4);
    await expect(page.getByRole('button', { name: 'Try again' })).toHaveCount(0);
    await expect(page.locator('#discoverList')).not.toContainText('We couldn’t load campus information.');
    await expect(page.locator('#discoverList')).not.toHaveAttribute('aria-busy', 'true');
  });

  test('offline filtering, searching, and search-empty retain the offline context', async ({ page }) => {
    await resetAndGo(page);
    await setDiscoverState(page, 'offline');
    const search = page.getByLabel('Search campus content');

    await search.fill('climate');
    await expect(page.locator('#discoverList [data-discover-id="ra-climate"]')).toBeVisible();
    await expect(page.locator('#discoverList [data-discover-id]')).toHaveCount(1);
    await expect(page.locator('#discoverSystemState')).toContainText('You’re offline. Showing cached campus information.');

    await search.fill('');
    await page.locator('[data-filter="Sports"]').click();
    await expect(page.locator('#discoverList [data-discover-id="mubs-mak"]')).toBeVisible();
    await expect(page.locator('#discoverList [data-discover-id]')).toHaveCount(1);
    await expect(page.locator('#discoverSystemState')).toContainText('You’re offline. Showing cached campus information.');

    await search.fill('zz-campus-no-match');
    await expect(page.locator('#discoverList')).toContainText('No campus information matches that search.');
    await expect(page.getByRole('button', { name: 'Clear search' })).toBeVisible();
    await expect(page.locator('#discoverSystemState')).toContainText('You’re offline. Showing cached campus information.');
    await page.getByRole('button', { name: 'Clear search' }).click();
    expect(await discoverState(page)).toBe('offline');
    await expect(page.locator('[data-filter="Sports"]')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('#discoverList [data-discover-id="mubs-mak"]')).toBeVisible();
    await expect(search).toBeFocused();
  });

  test('rejects unknown debug states without changing the current valid state', async ({ page }) => {
    await resetAndGo(page);
    await setDiscoverState(page, 'error');
    const thrown = await page.evaluate(() => {
      try {
        window.CampusHubDebug.setDiscoverState('banana');
        return null;
      } catch (error) {
        return { name: error.name, message: error.message };
      }
    });

    expect(thrown?.name).toBe('TypeError');
    expect(thrown?.message).toContain('Unknown Discover system state');
    expect(await discoverState(page)).toBe('error');
  });

  test('resetDemo restores ready, All, empty query, and the four canonical items', async ({ page }) => {
    await resetAndGo(page);
    await setDiscoverState(page, 'offline');
    await page.locator('[data-filter="Sports"]').click();
    await page.getByLabel('Search campus content').fill('MUBS');
    await page.evaluate(() => window.CampusHubDebug.resetDemo());

    expect(await discoverState(page)).toBe('ready');
    await expect(page.getByLabel('Search campus content')).toHaveValue('');
    await expect(page.locator('[data-filter="All"]')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('#discoverList [data-discover-id]')).toHaveCount(4);
    await expect(page.locator('#discoverSystemState')).toBeEmpty();
  });

  test('keeps resilient states accessible and contained across frozen widths', async ({ page }) => {
    await resetAndGo(page);
    const search = page.getByLabel('Search campus content');
    await search.focus();
    await setDiscoverState(page, 'loading');
    await expect(search).toBeFocused();
    await setDiscoverState(page, 'offline');
    await expect(search).toBeFocused();
    await setDiscoverState(page, 'error');
    await expect(search).toBeFocused();

    for (const viewport of DISCOVER_VIEWPORTS) {
      await page.setViewportSize(viewport);
      await page.evaluate(() => window.CampusHubDebug.resetDemo());
      await page.evaluate(() => document.querySelectorAll('#toastWrap .toast').forEach(toast => toast.remove()));
      await expectNoHorizontalOverflow(page);

      await setDiscoverState(page, 'loading');
      await expectNoHorizontalOverflow(page);
      await expect(page.locator('.discover-skeleton')).toHaveCount(3);
      const skeletonRight = await page.locator('.discover-skeleton').first().evaluate(element => element.getBoundingClientRect().right);
      expect(skeletonRight).toBeLessThanOrEqual(viewport.width + 1);

      await setDiscoverState(page, 'error');
      await expectNoHorizontalOverflow(page);
      const retryMetrics = await page.getByRole('button', { name: 'Try again' }).evaluate(element => {
        const box = element.getBoundingClientRect();
        return { width:box.width, height:box.height };
      });
      expect(retryMetrics.width).toBeGreaterThanOrEqual(44);
      expect(retryMetrics.height).toBeGreaterThanOrEqual(44);

      await setDiscoverState(page, 'offline');
      await expectNoHorizontalOverflow(page);
      const offlineRight = await page.locator('.discover-offline-banner').evaluate(element => element.getBoundingClientRect().right);
      expect(offlineRight).toBeLessThanOrEqual(viewport.width + 1);
      await expect(page.locator('#discoverFilters')).toBeVisible();
      await expect(page.locator('.bottom-nav')).toBeVisible();
    }
  });
});
