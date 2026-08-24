import { expect, test } from '@playwright/test';

const innovationTitle = 'Makerere Innovation Week opens Monday';
const cocisTitle = 'New Innovation Lab Opens at CoCIS';

async function goTo(page, hash) {
  await page.goto(`/${hash}`);
}

async function expectDiscoverNav(page) {
  await expect(page.locator('#tab-discover')).toHaveAttribute('aria-current', 'page');
  await expect(page.locator('.nav-item[aria-current="page"]')).toHaveCount(1);
}

async function expectNoHorizontalOverflow(page, route) {
  const fitsViewport = await page.evaluate(
    () => document.documentElement.scrollWidth <= window.innerWidth
  );
  expect(fitsViewport, `${route} should not overflow horizontally`).toBe(true);
}

async function expectLoadedImage(page) {
  const imageState = await page.locator('#newsDetailImage').evaluate(image => ({
    complete: image.complete,
    naturalWidth: image.naturalWidth
  }));
  expect(imageState.complete).toBe(true);
  expect(imageState.naturalWidth).toBeGreaterThan(0);
}

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

test.describe('Phase 4 publication detail routing', () => {
  test.beforeEach(async ({ page }) => {
    // Keep route assertions independent of the blocked external font requests.
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

  test('Innovation Week direct route renders the publication detail', async ({ page }) => {
    const runtime = captureRuntimeErrors(page);
    await goTo(page, '#news/innovation-week');

    await expect(page.locator('#view-news')).toBeVisible();
    await expect(page.locator('#newsDetailTitle')).toHaveText(innovationTitle);
    await expect(page.locator('#newsDetailBody')).toContainText(
      '32 student teams will showcase projects across Main Campus.'
    );
    await expect(page.locator('#newsDetailDate')).toHaveText('25 May 2026');
    await expect(page.locator('#newsDetailSource')).toHaveText('CampusHub editorial');
    await expect(page.locator('#view-news h1')).toHaveCount(1);
    await expectLoadedImage(page);
    await expectDiscoverNav(page);
    await expectNoHorizontalOverflow(page, '#news/innovation-week');
    expect(new URL(page.url()).hash).toBe('#news/innovation-week');
    await expect.poll(() => page.evaluate(() => document.activeElement?.id)).toBe('newsDetailTitle');
    expectNoRuntimeErrors(runtime);
  });

  test('CoCIS direct route resolves the distinct publication and metadata', async ({ page }) => {
    await goTo(page, '#news/cocis-innovation-lab');

    await expect(page.locator('#view-news')).toBeVisible();
    await expect(page.locator('#newsDetailTitle')).toHaveText(cocisTitle);
    await expect(page.locator('#newsDetailBody')).toContainText(
      'The College of Computing and Information Sciences launches a state-of-the-art innovation lab.'
    );
    await expect(page.locator('#newsDetailDate')).toHaveText('19 May 2026');
    await expect(page.locator('#newsDetailSource')).toHaveText('CoCIS');
    await expectLoadedImage(page);
    await expectDiscoverNav(page);
    await expectNoHorizontalOverflow(page, '#news/cocis-innovation-lab');
    expect(new URL(page.url()).hash).toBe('#news/cocis-innovation-lab');
  });

  test('publication IDs render distinct article content', async ({ page }) => {
    await goTo(page, '#news/innovation-week');
    const innovationBody = await page.locator('#newsDetailBody').innerText();

    await goTo(page, '#news/cocis-innovation-lab');
    const cocisBody = await page.locator('#newsDetailBody').innerText();

    expect(innovationBody).not.toBe(cocisBody);
    await expect(page.locator('#newsDetailTitle')).toHaveText(cocisTitle);
    expect(cocisBody).not.toContain('32 student teams');
  });

  test('invalid publication IDs fall back safely to Discover', async ({ page }) => {
    await goTo(page, '#news/not-real');

    await expect(page.locator('#view-discover')).toBeVisible();
    await expect(page.locator('#view-news')).toBeHidden();
    await expect(page.locator('#newsDetailTitle')).toBeEmpty();
    await expectDiscoverNav(page);
    expect(new URL(page.url()).hash).toBe('#discover');
  });

  test('a direct publication deep link survives reload', async ({ page }) => {
    await goTo(page, '#news/cocis-innovation-lab');
    await page.reload();

    await expect(page.locator('#view-news')).toBeVisible();
    await expect(page.locator('#newsDetailTitle')).toHaveText(cocisTitle);
    await expect(page.locator('#newsDetailSource')).toHaveText('CoCIS');
    await expectDiscoverNav(page);
    expect(new URL(page.url()).hash).toBe('#news/cocis-innovation-lab');
  });

  test('Home Innovation Week hero opens the canonical publication route', async ({ page }) => {
    await goTo(page, '#home');
    await page.locator('[data-testid="hero-read"]').click();

    await expect(page.locator('#view-news')).toBeVisible();
    await expect(page.locator('#newsDetailTitle')).toHaveText(innovationTitle);
    expect(new URL(page.url()).hash).toBe('#news/innovation-week');
    await expectDiscoverNav(page);

    await page.locator('#view-news [data-back]').click();
    await expect(page.locator('#view-home')).toBeVisible();
    expect(new URL(page.url()).hash).toBe('#home');
  });

  test('Discover CoCIS story opens its publication detail and returns to Discover', async ({ page }) => {
    await goTo(page, '#discover');
    const storyCard = page.locator('#discoverList article').filter({ hasText: cocisTitle });
    await storyCard.getByRole('link', { name: /Read more/ }).click();

    await expect(page.locator('#view-news')).toBeVisible();
    await expect(page.locator('#newsDetailTitle')).toHaveText(cocisTitle);
    expect(new URL(page.url()).hash).toBe('#news/cocis-innovation-lab');
    await expectDiscoverNav(page);

    await page.locator('#view-news [data-back]').click();
    await expect(page.locator('#view-discover')).toBeVisible();
    expect(new URL(page.url()).hash).toBe('#discover');
  });
});
