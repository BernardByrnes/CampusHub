import { expect, test } from '@playwright/test';

const innovationTitle = 'Makerere Innovation Week opens Monday';
const cocisTitle = 'New Innovation Lab Opens at CoCIS';
const noticeTitle = 'Wednesday Classes Rescheduled';
const noticeBody = [
  'Due to the Guild General Assembly, all teaching on Wednesday, 20 May 2026 will start at 2:00 PM.'
];
const innovationImageSrc = /assets\/images\/hero-innovation\.webp$/;
const innovationImageAlt = 'A group collaborating around a project planning board';
const cocisImageSrc = /assets\/images\/campus-cocis\.webp$/;
const cocisImageAlt = 'Students walking through a university courtyard';
const innovationBody = [
  '32 student teams will showcase projects across Main Campus.',
  'Exhibitions run 09:00 — 17:00 in Freedom Square.'
];
const cocisBody = [
  'The College of Computing and Information Sciences launches a state-of-the-art innovation lab.',
  "The new space strengthens the college's support for student innovation on campus."
];
const cocisNotificationId = 'notification-cocis-story';
const responsiveViewports = [
  { width: 320, height: 844 },
  { width: 390, height: 844 },
  { width: 430, height: 932 },
  { width: 768, height: 1024 },
  { width: 1280, height: 900 }
];
const INNOVATION = Object.freeze({
  id: 'innovation-week',
  kicker: 'Innovation Week',
  title: innovationTitle,
  date: '25 May 2026',
  source: 'CampusHub editorial',
  body: innovationBody,
  imageSrc: innovationImageSrc,
  imageAlt: innovationImageAlt
});
const COCIS = Object.freeze({
  id: 'cocis-innovation-lab',
  kicker: 'Campus Story',
  title: cocisTitle,
  date: '19 May 2026',
  source: 'CoCIS',
  body: cocisBody,
  imageSrc: cocisImageSrc,
  imageAlt: cocisImageAlt
});
const NOTICE = Object.freeze({
  id: 'notice-classes-rescheduled',
  kicker: 'Priority Notice',
  title: noticeTitle,
  date: '19 May 2026',
  source: 'Office of the Academic Registrar',
  body: noticeBody
});

function expectAtLeastWithSubpixelTolerance(actual, minimum, epsilon = 0.01) {
  expect(actual + epsilon).toBeGreaterThanOrEqual(minimum);
}

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
  const image = page.locator('#newsDetailImage');
  await expect.poll(() => image.evaluate(candidate => (
    candidate.complete && candidate.naturalWidth > 0
  ))).toBe(true);
  await image.evaluate(async candidate => {
    if (typeof candidate.decode === 'function') {
      await candidate.decode().catch(() => undefined);
    }
  });
  const imageState = await image.evaluate(candidate => ({
    complete: candidate.complete,
    naturalWidth: candidate.naturalWidth
  }));
  expect(imageState.complete).toBe(true);
  expect(imageState.naturalWidth).toBeGreaterThan(0);
}

async function expectPublicationImage(page, src, alt) {
  const image = page.locator('#newsDetailImage');
  await expect(image).toHaveAttribute('src', src);
  await expect(image).toHaveAttribute('alt', alt);
  await expect(image).toHaveAttribute('loading', 'lazy');
  await expect(image).toHaveAttribute('decoding', 'async');
  await expectLoadedImage(page);
}

async function expectPublicationDetail(page, publication) {
  const view = page.locator('#view-news');
  await expect(view).toBeVisible();
  await expect(view.locator('h1')).toHaveCount(1);
  await expect(view.locator('h1#newsDetailTitle')).toHaveText(publication.title);
  await expect(page.locator('#newsDetailKicker')).toHaveText(publication.kicker);
  await expect(page.locator('#newsDetailDate')).toHaveText(publication.date);
  await expect(page.locator('#newsDetailSource')).toHaveText(publication.source);
  await expect(page.locator('#newsDetailBody p')).toHaveCount(publication.body.length);
  for (const paragraph of publication.body) {
    await expect(page.locator('#newsDetailBody')).toContainText(paragraph);
  }
  await expectPublicationImage(page, publication.imageSrc, publication.imageAlt);
  await expectDiscoverNav(page);
}

async function expectNoticeDetail(page) {
  const view = page.locator('#view-news');
  await expect(view).toBeVisible();
  await expect(view.locator('h1')).toHaveCount(1);
  await expect(view.locator('h1#newsDetailTitle')).toHaveText(NOTICE.title);
  await expect(page.locator('#newsDetailKicker')).toHaveText(NOTICE.kicker);
  await expect(page.locator('#newsDetailDate')).toHaveText(NOTICE.date);
  await expect(page.locator('#newsDetailSource')).toHaveText(NOTICE.source);
  await expect(page.locator('#newsDetailBody p')).toHaveCount(NOTICE.body.length);
  await expect(page.locator('#newsDetailBody')).toHaveText(NOTICE.body[0]);
  await expect(page.locator('#newsDetailMedia')).toBeHidden();
  await expect(page.locator('#newsDetailImage')).toBeHidden();
  await expect(page.locator('#newsDetailImage')).not.toHaveAttribute('src', /.+/);
  await expect(page.locator('#newsDetailImage')).toHaveAttribute('alt', '');
  await expectDiscoverNav(page);
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

test.describe('Canonical Publication detail', () => {
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

    await expectPublicationDetail(page, INNOVATION);
    await expectNoHorizontalOverflow(page, '#news/innovation-week');
    expect(new URL(page.url()).hash).toBe('#news/innovation-week');
    await expect.poll(() => page.evaluate(() => document.activeElement?.id)).toBe('newsDetailTitle');
    expectNoRuntimeErrors(runtime);
  });

  test('CoCIS direct route resolves the distinct publication and metadata', async ({ page }) => {
    await goTo(page, '#news/cocis-innovation-lab');

    await expectPublicationDetail(page, COCIS);
    await expectNoHorizontalOverflow(page, '#news/cocis-innovation-lab');
    expect(new URL(page.url()).hash).toBe('#news/cocis-innovation-lab');
  });

  test('Priority Notice direct route resolves as the canonical text-only Publication', async ({ page }) => {
    await goTo(page, '#news/notice-classes-rescheduled');

    await expectNoticeDetail(page);
    expect(new URL(page.url()).hash).toBe('#news/notice-classes-rescheduled');
    await expect.poll(() => page.evaluate(() => document.activeElement?.id)).toBe('newsDetailTitle');

    const back = page.locator('#view-news [data-back]');
    const box = await back.boundingBox();
    expectAtLeastWithSubpixelTolerance(box?.width || 0, 44);
    expectAtLeastWithSubpixelTolerance(box?.height || 0, 44);
  });

  test('uses the canonical News SubHeader and one entity-title H1', async ({ page }) => {
    await goTo(page, '#news/innovation-week');

    const view = page.locator('#view-news');
    await expect(view.locator('.news-subheader')).toBeVisible();
    await expect(view.locator('.news-route-label')).toHaveText('News');
    await expect(view.locator('.news-route-label')).not.toHaveJSProperty('tagName', 'H1');
    await expect(view.locator('h1')).toHaveCount(1);
    await expect(view.locator('h1#newsDetailTitle')).toHaveText(innovationTitle);

    const back = view.getByRole('button', { name: 'Back' });
    await expect(back).toHaveCount(1);
    const backSize = await back.boundingBox();
    expect(backSize?.width || 0).toBeGreaterThanOrEqual(44);
    expect(backSize?.height || 0).toBeGreaterThanOrEqual(44);
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

  test('switches Publication entities without stale fields', async ({ page }) => {
    await goTo(page, '#news/innovation-week');
    await expectPublicationDetail(page, INNOVATION);

    await page.evaluate(() => { location.hash = '#news/cocis-innovation-lab'; });
    await expect.poll(() => new URL(page.url()).hash).toBe('#news/cocis-innovation-lab');
    await expectPublicationDetail(page, COCIS);
    await expect(page.locator('#newsDetailBody')).not.toContainText(innovationBody[0]);

    await page.evaluate(() => { location.hash = '#news/innovation-week'; });
    await expect.poll(() => new URL(page.url()).hash).toBe('#news/innovation-week');
    await expectPublicationDetail(page, INNOVATION);
    await expect(page.locator('#newsDetailBody')).not.toContainText(cocisBody[0]);
  });

  test('switches between the text-only Notice and image-bearing Publications without stale media', async ({ page }) => {
    await goTo(page, '#news/notice-classes-rescheduled');
    await expectNoticeDetail(page);

    await page.evaluate(() => { location.hash = '#news/innovation-week'; });
    await expect.poll(() => new URL(page.url()).hash).toBe('#news/innovation-week');
    await expectPublicationDetail(page, INNOVATION);

    await page.evaluate(() => { location.hash = '#news/cocis-innovation-lab'; });
    await expect.poll(() => new URL(page.url()).hash).toBe('#news/cocis-innovation-lab');
    await expectPublicationDetail(page, COCIS);

    await page.evaluate(() => { location.hash = '#news/notice-classes-rescheduled'; });
    await expect.poll(() => new URL(page.url()).hash).toBe('#news/notice-classes-rescheduled');
    await expectNoticeDetail(page);
  });

  test('hides missing Publication media without breaking the detail', async ({ page }) => {
    const runtime = captureRuntimeErrors(page);
    await goTo(page, '#news/innovation-week');
    await expectPublicationDetail(page, INNOVATION);

    await page.evaluate(() => {
      const publication = window.CampusHubDemo.publications.find(item => item.id === 'innovation-week');
      publication.image = null;
    });
    await page.evaluate(() => { location.hash = '#news/cocis-innovation-lab'; });
    await expect.poll(() => new URL(page.url()).hash).toBe('#news/cocis-innovation-lab');
    await page.evaluate(() => { location.hash = '#news/innovation-week'; });
    await expect.poll(() => new URL(page.url()).hash).toBe('#news/innovation-week');

    await expect(page.locator('#newsDetailTitle')).toHaveText(innovationTitle);
    await expect(page.locator('#newsDetailBody')).toContainText(innovationBody[0]);
    await expect(page.locator('#newsDetailMedia')).toBeHidden();
    await expect(page.locator('#newsDetailImage')).toBeHidden();
    await expect(page.locator('#newsDetailImage')).not.toHaveAttribute('src', /hero-innovation/);

    await page.evaluate(() => { location.hash = '#news/cocis-innovation-lab'; });
    await expect.poll(() => new URL(page.url()).hash).toBe('#news/cocis-innovation-lab');
    await expectPublicationImage(page, cocisImageSrc, cocisImageAlt);
    expectNoRuntimeErrors(runtime);
  });

  test('invalid publication IDs fall back safely to Discover', async ({ page }) => {
    await goTo(page, '#news/innovation-week');
    await expect(page.locator('#newsDetailTitle')).toHaveText(innovationTitle);
    await page.evaluate(() => { location.hash = '#news/not-real'; });

    await expect(page.locator('#view-discover')).toBeVisible();
    await expect(page.locator('#view-news')).toBeHidden();
    await expect(page.locator('#newsDetailTitle')).toBeEmpty();
    await expect(page.locator('#newsDetailBody')).toBeEmpty();
    await expect(page.locator('#newsDetailMedia')).toBeHidden();
    await expect(page.locator('#newsDetailImage')).toBeHidden();
    await expectDiscoverNav(page);
    expect(new URL(page.url()).hash).toBe('#discover');
  });

  test('direct-entry Back falls back to Discover', async ({ page }) => {
    await goTo(page, '#news/innovation-week');
    await expect(page.locator('#view-news')).toBeVisible();
    await page.locator('#view-news [data-back]').click();

    await expect(page.locator('#view-discover')).toBeVisible();
    await expectDiscoverNav(page);
    expect(new URL(page.url()).hash).toBe('#discover');
  });

  test('a direct publication deep link survives reload', async ({ page }) => {
    await goTo(page, '#news/cocis-innovation-lab');
    await expect.poll(() => page.evaluate(() => document.activeElement?.id)).toBe('newsDetailTitle');
    await page.reload();

    await expect(page.locator('#view-news')).toBeVisible();
    await expect(page.locator('#newsDetailTitle')).toHaveText(cocisTitle);
    await expect(page.locator('#newsDetailSource')).toHaveText('CoCIS');
    await expectDiscoverNav(page);
    await expect.poll(() => page.evaluate(() => document.activeElement?.id)).toBe('newsDetailTitle');
    expect(new URL(page.url()).hash).toBe('#news/cocis-innovation-lab');
  });

  test('Home Innovation Week hero opens the canonical publication route', async ({ page }) => {
    await goTo(page, '#home');
    await expect(page.locator('#heroImg')).toHaveAttribute('src', innovationImageSrc);
    await expect(page.locator('#heroImg')).toHaveAttribute('alt', innovationImageAlt);
    await page.locator('[data-testid="hero-read"]').click();

    await expect(page.locator('#view-news')).toBeVisible();
    await expect(page.locator('#newsDetailTitle')).toHaveText(innovationTitle);
    expect(new URL(page.url()).hash).toBe('#news/innovation-week');
    await expectDiscoverNav(page);

    await page.locator('#view-news [data-back]').click();
    await expect(page.locator('#view-home')).toBeVisible();
    expect(new URL(page.url()).hash).toBe('#home');
  });

  test('Home Priority Notice opens the Publication detail and Back returns Home', async ({ page }) => {
    await goTo(page, '#home');
    await page.locator('[data-testid="home-priority-link"]').click();

    await expectNoticeDetail(page);
    expect(new URL(page.url()).hash).toBe('#news/notice-classes-rescheduled');

    await page.locator('#view-news [data-back]').click();
    await expect(page.locator('#view-home')).toBeVisible();
    expect(new URL(page.url()).hash).toBe('#home');
  });

  test('Discover CoCIS story opens its publication detail and returns to Discover', async ({ page }) => {
    await goTo(page, '#discover');
    const storyCard = page.locator('#discoverList article').filter({ hasText: cocisTitle });
    await expect(storyCard.locator('img')).toHaveAttribute('src', cocisImageSrc);
    await expect(storyCard.locator('img')).toHaveAttribute('alt', cocisImageAlt);
    await storyCard.getByRole('link', { name: /Read more/ }).click();

    await expect(page.locator('#view-news')).toBeVisible();
    await expect(page.locator('#newsDetailTitle')).toHaveText(cocisTitle);
    expect(new URL(page.url()).hash).toBe('#news/cocis-innovation-lab');
    await expectDiscoverNav(page);

    await page.locator('#view-news [data-back]').click();
    await expect(page.locator('#view-discover')).toBeVisible();
    expect(new URL(page.url()).hash).toBe('#discover');
  });

  test('Notifications opens CoCIS, marks it read, and persists the read state', async ({ page }) => {
    await goTo(page, '#notifications');
    await page.evaluate(notificationId => {
      const state = JSON.parse(localStorage.getItem('campushub:state:v2:tenant-makerere:membership-demo-001'));
      state.notificationReadIds = (state.notificationReadIds || []).filter(id => id !== notificationId);
      localStorage.setItem('campushub:state:v2:tenant-makerere:membership-demo-001', JSON.stringify(state));
    }, cocisNotificationId);
    await page.reload();

    const notification = page.locator(`[data-notification-id="${cocisNotificationId}"]`);
    await expect(notification).toContainText(cocisTitle);
    await notification.click();

    await expect(page.locator('#view-news')).toBeVisible();
    await expect(page.locator('#newsDetailTitle')).toHaveText(cocisTitle);
    await expectDiscoverNav(page);
    await expect.poll(() => page.evaluate(notificationId => {
      const state = JSON.parse(localStorage.getItem('campushub:state:v2:tenant-makerere:membership-demo-001'));
      return state.notificationReadIds?.includes(notificationId) || false;
    }, cocisNotificationId)).toBe(true);

    await goTo(page, '#notifications');
    await expect(page.locator(`[data-notification-id="${cocisNotificationId}"]`).locator('..')).not.toHaveClass(/notification-row--unread/);
  });

  test('keeps News Detail free of social controls', async ({ page }) => {
    await goTo(page, '#news/innovation-week');
    const view = page.locator('#view-news');
    await expect(view).not.toContainText(/Comments|Replies|Like|Follow author|Share count/i);
    await expect(view.getByRole('button', { name: /Comment|Reply|Like|Follow|Share/i })).toHaveCount(0);
  });

  test('stays contained and readable across the frozen responsive matrix', async ({ page }) => {
    for (const viewport of responsiveViewports) {
      await page.setViewportSize(viewport);
      for (const publication of [INNOVATION, COCIS]) {
        await goTo(page, `#news/${publication.id}`);
        const metrics = await page.evaluate(() => {
          const view = document.querySelector('#view-news')?.getBoundingClientRect();
          const shell = document.querySelector('#shell')?.getBoundingClientRect();
          const title = document.querySelector('#newsDetailTitle');
          const image = document.querySelector('#newsDetailImage')?.getBoundingClientRect();
          const back = document.querySelector('#view-news [data-back]')?.getBoundingClientRect();
          const nav = document.querySelector('.bottom-nav')?.getBoundingClientRect();
          const mainStyle = getComputedStyle(document.querySelector('#main'));
          return {
            viewportWidth: window.innerWidth,
            documentWidth: document.documentElement.scrollWidth,
            bodyWidth: document.body.scrollWidth,
            viewLeft: view?.left ?? 0,
            viewRight: view?.right ?? 0,
            shellLeft: shell?.left ?? 0,
            shellRight: shell?.right ?? 0,
            shellWidth: shell?.width ?? 0,
            titleFits: title ? title.scrollWidth <= title.clientWidth : false,
            imageWidth: image?.width ?? 0,
            imageHeight: image?.height ?? 0,
            backWidth: back?.width ?? 0,
            backHeight: back?.height ?? 0,
            navHeight: nav?.height ?? 0,
            mainPaddingBottom: Number.parseFloat(mainStyle.paddingBottom) || 0
          };
        });

        expect(metrics.documentWidth).toBeLessThanOrEqual(metrics.viewportWidth + 1);
        expect(metrics.bodyWidth).toBeLessThanOrEqual(metrics.viewportWidth + 1);
        expect(metrics.viewLeft).toBeGreaterThanOrEqual(metrics.shellLeft - 1);
        expect(metrics.viewRight).toBeLessThanOrEqual(metrics.shellRight + 1);
        expect(metrics.titleFits).toBe(true);
        expect(metrics.imageWidth).toBeGreaterThan(0);
        expect(metrics.imageHeight).toBeGreaterThan(0);
        expectAtLeastWithSubpixelTolerance(metrics.backWidth, 44);
        expectAtLeastWithSubpixelTolerance(metrics.backHeight, 44);
        expect(metrics.shellWidth).toBeLessThanOrEqual(431);
        if (metrics.navHeight) expect(metrics.mainPaddingBottom + 1).toBeGreaterThanOrEqual(metrics.navHeight);
      }
    }
  });

  test('keeps the text-only Notice detail contained across the frozen responsive matrix', async ({ page }) => {
    for (const viewport of responsiveViewports) {
      await page.setViewportSize(viewport);
      await goTo(page, '#news/notice-classes-rescheduled');
      await expectNoticeDetail(page);
      const metrics = await page.evaluate(() => {
        const view = document.querySelector('#view-news')?.getBoundingClientRect();
        const shell = document.querySelector('#shell')?.getBoundingClientRect();
        const title = document.querySelector('#newsDetailTitle');
        const back = document.querySelector('#view-news [data-back]')?.getBoundingClientRect();
        const nav = document.querySelector('.bottom-nav')?.getBoundingClientRect();
        const mainStyle = getComputedStyle(document.querySelector('#main'));
        return {
          viewportWidth: window.innerWidth,
          documentWidth: document.documentElement.scrollWidth,
          bodyWidth: document.body.scrollWidth,
          viewLeft: view?.left ?? 0,
          viewRight: view?.right ?? 0,
          shellLeft: shell?.left ?? 0,
          shellRight: shell?.right ?? 0,
          shellWidth: shell?.width ?? 0,
          titleFits: title ? title.scrollWidth <= title.clientWidth : false,
          backWidth: back?.width ?? 0,
          backHeight: back?.height ?? 0,
          navHeight: nav?.height ?? 0,
          mainPaddingBottom: Number.parseFloat(mainStyle.paddingBottom) || 0
        };
      });

      expect(metrics.documentWidth).toBeLessThanOrEqual(metrics.viewportWidth + 1);
      expect(metrics.bodyWidth).toBeLessThanOrEqual(metrics.viewportWidth + 1);
      expect(metrics.viewLeft).toBeGreaterThanOrEqual(metrics.shellLeft - 1);
      expect(metrics.viewRight).toBeLessThanOrEqual(metrics.shellRight + 1);
      expect(metrics.titleFits).toBe(true);
      expectAtLeastWithSubpixelTolerance(metrics.backWidth, 44);
      expectAtLeastWithSubpixelTolerance(metrics.backHeight, 44);
      expect(metrics.shellWidth).toBeLessThanOrEqual(431);
      if (metrics.navHeight) expect(metrics.mainPaddingBottom + 1).toBeGreaterThanOrEqual(metrics.navHeight);
    }
  });
});
