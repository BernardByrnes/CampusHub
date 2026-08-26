import { expect, test } from '@playwright/test';

const DISCOVER_KINDS = ['Events', 'Opportunities', 'Sports', 'News'];
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

async function resetAndGo(page, hash = '#discover') {
  await page.goto('/#home');
  await page.waitForFunction(() => typeof window.CampusHubDebug?.resetDemo === 'function');
  await page.evaluate(() => window.CampusHubDebug.resetDemo());
  await page.evaluate(() => document.querySelectorAll('#toastWrap .toast').forEach(toast => toast.remove()));
  await page.goto(`/${hash}`);
  await expect(page.locator(hash === '#home' ? '#view-home' : '#view-discover')).toBeVisible();
}

async function resultIds(page) {
  return page.locator('#discoverList [data-discover-id]').evaluateAll(cards => cards.map(card => ({
    id: card.getAttribute('data-discover-id'),
    kind: card.getAttribute('data-discover-kind')
  })));
}

async function expectNoHorizontalOverflow(page) {
  await expect.poll(() => page.evaluate(() => (
    document.documentElement.scrollWidth <= window.innerWidth + 1
    && document.body.scrollWidth <= window.innerWidth + 1
  ))).toBe(true);
}

test.describe('Phase 8G canonical Discover search and filters', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'canonical-mobile', 'Discover contract tests run once at the canonical mobile project.');
    await blockRemoteFonts(page);
    await page.emulateMedia({ reducedMotion: 'reduce' });
  });

  test('renders the bounded default index with canonical filter semantics', async ({ page }) => {
    await resetAndGo(page);

    await expect(page.getByLabel('Search campus content')).toHaveAttribute('placeholder', 'Search news, events, opportunities, sports...');
    await expect(page.locator('#discoverFilters')).toHaveAttribute('role', 'group');
    await expect(page.locator('#discoverFilters')).toHaveAttribute('aria-label', 'Discover filters');
    await expect(page.locator('#discoverList')).toHaveAttribute('aria-live', 'polite');
    await expect(page.locator('#discoverList [data-discover-id]')).toHaveCount(4);
    expect(await resultIds(page)).toEqual([
      { id: 'guild-debate', kind: 'Events' },
      { id: 'cocis-innovation-lab', kind: 'News' },
      { id: 'ra-climate', kind: 'Opportunities' },
      { id: 'mubs-mak', kind: 'Sports' }
    ]);

    const eventImage = page.locator('[data-discover-id="guild-debate"] img');
    await expect(eventImage).toHaveAttribute('src', /assets\/images\/event-debate\.webp$/);
    await expect(eventImage).toHaveAttribute('alt', 'Makerere University Kampala campus entrance with students walking');
    await expect(eventImage).toHaveAttribute('loading', 'lazy');
    await expect(eventImage).toHaveAttribute('decoding', 'async');

    const filters = page.locator('#discoverFilters .filter-chip');
    await expect(filters).toHaveCount(5);
    await expect(filters.nth(0)).toHaveAttribute('aria-pressed', 'true');
    for (let index = 1; index < 5; index += 1) {
      await expect(filters.nth(index)).toHaveAttribute('aria-pressed', 'false');
      expect(await filters.nth(index).getAttribute('role')).toBeNull();
      expect(await filters.nth(index).getAttribute('aria-selected')).toBeNull();
    }
    await expect(page.locator('#discoverList')).not.toContainText('Student Voice');
    await expect(page.locator('#discoverList')).not.toContainText('restrooms');
    await expect(page.locator('#discoverList')).not.toContainText('Nakato');
  });

  test('matches deterministic canonical text fields case-insensitively', async ({ page }) => {
    await resetAndGo(page);
    const cases = [
      ['climate', ['ra-climate']],
      ['  CLIMATE  ', ['ra-climate']],
      ['CoCIS', ['cocis-innovation-lab']],
      ['Senate', ['guild-debate']],
      ['MUBS', ['mubs-mak']],
      ['football', ['mubs-mak']]
    ];

    for (const [query, expected] of cases) {
      await page.getByLabel('Search campus content').fill(query);
      await expect.poll(() => resultIds(page).then(items => items.map(item => item.id))).toEqual(expected);
    }
  });

  test('filters by one canonical category and returns to All in source order', async ({ page }) => {
    await resetAndGo(page);

    const expectedByFilter = {
      Events: ['guild-debate'],
      Opportunities: ['ra-climate'],
      Sports: ['mubs-mak'],
      News: ['cocis-innovation-lab']
    };
    for (const filter of DISCOVER_KINDS) {
      await page.locator(`[data-filter="${filter}"]`).click();
      await expect(page.locator(`[data-filter="${filter}"]`)).toHaveAttribute('aria-pressed', 'true');
      await expect.poll(() => resultIds(page).then(items => items.map(item => item.id))).toEqual(expectedByFilter[filter]);
      for (const other of ['All', ...DISCOVER_KINDS.filter(value => value !== filter)]) {
        await expect(page.locator(`[data-filter="${other}"]`)).toHaveAttribute('aria-pressed', other === filter ? 'true' : 'false');
      }
    }
    await page.locator('[data-filter="All"]').click();
    await expect.poll(() => resultIds(page).then(items => items.map(item => item.id))).toEqual([
      'guild-debate', 'cocis-innovation-lab', 'ra-climate', 'mubs-mak'
    ]);
  });

  test('composes News filter and query, then clears only the query', async ({ page }) => {
    await resetAndGo(page);
    await page.locator('[data-filter="News"]').click();
    await page.getByLabel('Search campus content').fill('climate');

    await expect(page.locator('#discoverList')).toContainText('No campus information matches that search.');
    await expect(page.locator('#discoverList')).toContainText('Clear search');
    await expect(page.locator('#discoverList [data-discover-id]')).toHaveCount(0);

    await page.getByRole('button', { name: 'Clear search' }).click();
    await expect(page.getByLabel('Search campus content')).toHaveValue('');
    await expect(page.locator('[data-filter="News"]')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('[data-filter="All"]')).toHaveAttribute('aria-pressed', 'false');
    await expect.poll(() => resultIds(page).then(items => items.map(item => item.id))).toEqual(['cocis-innovation-lab']);
    await expect(page.getByLabel('Search campus content')).toBeFocused();
  });

  test('keeps people, Voice, and Poll content outside the bounded search index', async ({ page }) => {
    await resetAndGo(page);
    for (const query of ['water', 'restroom', 'Nakato']) {
      await page.getByLabel('Search campus content').fill(query);
      await expect(page.locator('#discoverList')).toContainText('No campus information matches that search.');
      await expect(page.locator('#discoverList [data-discover-id]')).toHaveCount(0);
      await expect(page.locator('#discoverList')).not.toContainText('Student Voice');
      await expect(page.locator('#discoverList')).not.toContainText('Poll');
    }
  });

  test('hands Home search to Discover without stealing input focus', async ({ page }) => {
    await resetAndGo(page, '#home');
    const search = page.getByLabel('Search campus content');
    await search.focus();
    await search.fill('climate');

    await expect.poll(() => new URL(page.url()).hash).toBe('#discover');
    await expect(search).toHaveValue('climate');
    await expect(search).toBeFocused();
    await expect(page.locator('[data-discover-id="ra-climate"]')).toBeVisible();
    await expect(page.locator('#discoverList [data-discover-id]')).toHaveCount(1);
  });

  test('makes the filter icon a real Discover focus shortcut from both surfaces', async ({ page }) => {
    await resetAndGo(page);
    await page.locator('#searchFilterBtn').click();
    await expect(page.locator('[data-filter="All"]')).toBeFocused();

    await resetAndGo(page, '#home');
    await page.locator('#searchFilterBtn').click();
    await expect.poll(() => new URL(page.url()).hash).toBe('#discover');
    await expect(page.locator('[data-filter="All"]')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('[data-filter="All"]')).toBeFocused();
  });

  test('preserves entity identity and canonical routes after search', async ({ page }) => {
    await resetAndGo(page);
    await page.getByLabel('Search campus content').fill('CoCIS');
    await page.locator('[data-discover-id="cocis-innovation-lab"] a').click();
    await expect(page.locator('#view-news')).toBeVisible();
    expect(new URL(page.url()).hash).toBe('#news/cocis-innovation-lab');

    await resetAndGo(page);
    await page.getByLabel('Search campus content').fill('climate');
    await page.locator('[data-discover-id="ra-climate"] a').click();
    await expect(page.locator('#view-opportunity')).toBeVisible();
    expect(new URL(page.url()).hash).toBe('#opportunities/ra-climate');
  });

  test('resets runtime search state and remains usable across frozen widths', async ({ page }) => {
    await resetAndGo(page);
    await page.locator('[data-filter="Sports"]').click();
    await page.getByLabel('Search campus content').fill('MUBS');
    await page.evaluate(() => window.CampusHubDebug.resetDemo());
    await expect(page.getByLabel('Search campus content')).toHaveValue('');
    await expect(page.locator('[data-filter="All"]')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('#discoverList [data-discover-id]')).toHaveCount(4);

    for (const viewport of DISCOVER_VIEWPORTS) {
      await page.setViewportSize(viewport);
      await page.goto('/#discover');
      await expect(page.locator('#view-discover')).toBeVisible();
      await expectNoHorizontalOverflow(page);
      await expect(page.locator('#globalSearch')).toBeVisible();
      await expect(page.locator('#searchFilterBtn')).toBeVisible();
      const metrics = await page.evaluate(() => {
        const filterButton = document.querySelector('#searchFilterBtn').getBoundingClientRect();
        const filters = document.querySelector('#discoverFilters');
        const cards = [...document.querySelectorAll('#discoverList [data-discover-id]')].map(card => card.getBoundingClientRect());
        return {
          filterButton: { width:filterButton.width, height:filterButton.height },
          filtersOverflow: filters.scrollWidth > filters.clientWidth,
          cardFits: cards.every(card => card.left >= -1 && card.right <= window.innerWidth + 1)
        };
      });
      expect(metrics.filterButton.width).toBeGreaterThanOrEqual(44);
      expect(metrics.filterButton.height).toBeGreaterThanOrEqual(44);
      expect(metrics.cardFits).toBe(true);
      if (viewport.width <= 390) expect(metrics.filtersOverflow).toBe(true);

      await page.getByLabel('Search campus content').fill('zz-campus-no-match');
      await expect(page.getByRole('button', { name:'Clear search' })).toBeVisible();
      await expectNoHorizontalOverflow(page);
    }
  });
});
