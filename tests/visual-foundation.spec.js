import { expect, test } from '@playwright/test';

const coreRoutes = ['#home', '#discover', '#participate', '#play', '#me'];

async function goTo(page, hash) {
  await page.goto(`/${hash}`);
}

function blockExternalFonts(page) {
  return Promise.all([
    page.route('https://fonts.googleapis.com/**', route => route.fulfill({
      status: 200,
      contentType: 'text/css',
      body: ''
    })),
    page.route('https://fonts.gstatic.com/**', route => route.fulfill({
      status: 200,
      contentType: 'font/woff2',
      body: ''
    }))
  ]);
}

async function foundationMetrics(page) {
  return page.evaluate(() => {
    const shell = document.querySelector('#shell');
    const main = document.querySelector('#main');
    const nav = document.querySelector('.bottom-nav');
    const search = document.querySelector('.search');
    const shellRect = shell.getBoundingClientRect();

    return {
      viewportWidth: window.innerWidth,
      shellWidth: shellRect.width,
      shellLeft: shellRect.left,
      mainPaddingLeft: parseFloat(getComputedStyle(main).paddingLeft),
      mainPaddingRight: parseFloat(getComputedStyle(main).paddingRight),
      searchHeight: search.getBoundingClientRect().height,
      navHeight: nav.getBoundingClientRect().height,
      documentWidth: document.documentElement.scrollWidth
    };
  });
}

test.describe('Phase 7A visual foundation', () => {
  test.beforeEach(async ({ page }) => {
    await blockExternalFonts(page);
  });

  test('keeps the student shell centered and capped at 430px', async ({ page }) => {
    await goTo(page, '#home');
    const metrics = await foundationMetrics(page);

    expect(metrics.shellWidth).toBeLessThanOrEqual(metrics.viewportWidth);
    if (metrics.viewportWidth >= 430) {
      expect(metrics.shellWidth).toBeGreaterThanOrEqual(429);
      expect(metrics.shellWidth).toBeLessThanOrEqual(431);
      expect(metrics.shellLeft).toBeCloseTo((metrics.viewportWidth - 430) / 2, 0);
    }
    if (metrics.viewportWidth === 390) {
      expect(metrics.shellWidth).toBeCloseTo(390, 0);
    }
  });

  test('keeps tablet workspaces centered without widening the student shell', async ({ page }) => {
    test.skip(page.viewportSize().width !== 1280, 'tablet validation runs once from the desktop project');

    for (const viewport of [
      { width: 768, height: 1024 },
      { width: 1024, height: 900 }
    ]) {
      await page.setViewportSize(viewport);
      await goTo(page, '#home');
      const metrics = await foundationMetrics(page);

      expect(metrics.shellWidth).toBeCloseTo(430, 0);
      expect(metrics.shellLeft).toBeCloseTo((viewport.width - 430) / 2, 0);
      expect(metrics.documentWidth).toBeLessThanOrEqual(viewport.width);
    }
  });

  test('uses the frozen main-content gutters', async ({ page }) => {
    await goTo(page, '#home');
    const metrics = await foundationMetrics(page);
    const expectedGutter = metrics.viewportWidth <= 359 ? 14 : 16;

    expect(metrics.mainPaddingLeft).toBeCloseTo(expectedGutter, 0);
    expect(metrics.mainPaddingRight).toBeCloseTo(expectedGutter, 0);
  });

  test('uses a 48px shared search primitive on Home and Discover', async ({ page }) => {
    for (const route of ['#home', '#discover']) {
      await goTo(page, route);
      await expect(page.locator('#searchWrap')).toBeVisible();
      const metrics = await foundationMetrics(page);
      expect(metrics.searchHeight, `${route} search height`).toBeGreaterThanOrEqual(47);
      expect(metrics.searchHeight, `${route} search height`).toBeLessThanOrEqual(49);
    }
  });

  test('keeps bottom navigation at the canonical base height', async ({ page }) => {
    await goTo(page, '#home');
    const metrics = await foundationMetrics(page);

    // Playwright's browser context has no device safe-area inset. The range
    // allows a one-pixel border and browser rounding without accepting the
    // previous 72px geometry.
    expect(metrics.navHeight).toBeGreaterThanOrEqual(63);
    expect(metrics.navHeight).toBeLessThanOrEqual(68);
  });

  test('loads the frozen global palette through the token layer', async ({ page }) => {
    await goTo(page, '#home');
    const colors = await page.evaluate(() => {
      const probe = document.createElement('span');
      probe.style.position = 'absolute';
      probe.style.width = '1px';
      probe.style.height = '1px';
      document.body.append(probe);

      const resolve = token => {
        probe.style.color = `var(${token})`;
        return getComputedStyle(probe).color;
      };
      const result = {
        brand: resolve('--brand'),
        page: resolve('--page'),
        ink: resolve('--ink'),
        border: resolve('--border'),
        info: resolve('--info'),
        play: resolve('--play')
      };
      probe.remove();
      return result;
    });

    expect(colors).toEqual({
      brand: 'rgb(20, 107, 58)',
      page: 'rgb(246, 246, 244)',
      ink: 'rgb(16, 24, 40)',
      border: 'rgb(234, 236, 240)',
      info: 'rgb(23, 92, 211)',
      play: 'rgb(181, 71, 8)'
    });
  });

  test('keeps core student routes free of horizontal overflow', async ({ page }) => {
    for (const route of coreRoutes) {
      await goTo(page, route);
      const metrics = await foundationMetrics(page);
      expect(
        metrics.documentWidth,
        `${route} should not overflow its configured viewport`
      ).toBeLessThanOrEqual(metrics.viewportWidth);
    }
  });
});
