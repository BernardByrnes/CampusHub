import { expect, test } from '@playwright/test';

const voiceRoutes = [
  { id: 'voice-water-halls', title: 'Irregular water supply in Halls' },
  { id: 'voice-evening-buses', title: 'Need for more buses during evenings' },
  { id: 'voice-library-wifi', title: 'Slow Wi-Fi at Main Library upper floor' }
];

async function goTo(page, hash) {
  await page.goto(`/${hash}`);
}

async function expectNoHorizontalOverflow(page, route) {
  const fitsViewport = await page.evaluate(
    () => document.documentElement.scrollWidth <= window.innerWidth
  );
  expect(fitsViewport, `${route} should not overflow horizontally`).toBe(true);
}

async function expectOnlyPrimaryTab(page, tab) {
  await expect(page.locator(`#tab-${tab}`)).toHaveAttribute('aria-current', 'page');
  await expect(page.locator('.nav-item[aria-current="page"]')).toHaveCount(1);
}

test.describe('Phase 3 entity-aware detail routing', () => {
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

  test('event detail resolves guild-debate and inherits Discover', async ({ page }) => {
    await goTo(page, '#events/guild-debate');

    await expect(page.locator('#view-event')).toBeVisible();
    await expect(page.locator('#view-event [data-field="eventTitle"]')).toHaveText(
      'Guild Public Debate: The Future of AI in Africa'
    );
    expect(new URL(page.url()).hash).toBe('#events/guild-debate');
    await expectOnlyPrimaryTab(page, 'discover');
    await expectNoHorizontalOverflow(page, '#events/guild-debate');
  });

  test('opportunity detail resolves ra-climate and inherits Discover', async ({ page }) => {
    await goTo(page, '#opportunities/ra-climate');

    await expect(page.locator('#view-opportunity')).toBeVisible();
    await expect(page.locator('#view-opportunity [data-field="oppDetailTitle"]')).toHaveText(
      'Research Assistant — Climate Resilience'
    );
    expect(new URL(page.url()).hash).toBe('#opportunities/ra-climate');
    await expectOnlyPrimaryTab(page, 'discover');
    await expectNoHorizontalOverflow(page, '#opportunities/ra-climate');
  });

  test('sports detail resolves mubs-mak and inherits Discover', async ({ page }) => {
    await goTo(page, '#sports/mubs-mak');

    await expect(page.locator('#view-sports')).toBeVisible();
    await expect(page.locator('#view-sports [data-field="sportsTitle2"]')).toHaveText(
      'MUBS 1 — 2 Makerere University'
    );
    expect(new URL(page.url()).hash).toBe('#sports/mubs-mak');
    await expectOnlyPrimaryTab(page, 'discover');
    await expectNoHorizontalOverflow(page, '#sports/mubs-mak');
  });

  test('each normal Student Voice card and detail route keeps its own issue ID', async ({ page }) => {
    await goTo(page, '#voice');
    await expect(page.locator('#voiceAllList .voice-issue-card')).toHaveCount(3);
    const voiceCardHashes = await page.locator('#voiceAllList .voice-issue-card').evaluateAll(cards =>
      cards.map(card => new URL(card.href).hash)
    );
    expect(voiceCardHashes).toEqual([
      '#voice-detail/voice-water-halls',
      '#voice-detail/voice-evening-buses',
      '#voice-detail/voice-library-wifi'
    ]);

    for (const route of voiceRoutes) {
      await goTo(page, `#voice-detail/${route.id}`);
      await expect(page.locator('#view-voice-detail')).toBeVisible();
      await expect(page.locator('#voiceDetailTitle')).toHaveText(route.title);
      expect(new URL(page.url()).hash).toBe(`#voice-detail/${route.id}`);
      await expectOnlyPrimaryTab(page, 'participate');
      await expectNoHorizontalOverflow(page, `#voice-detail/${route.id}`);
    }
  });

  test('secondary screens inherit exactly one parent primary tab', async ({ page }) => {
    const inheritedRoutes = [
      { hash: '#voice', view: '#view-voice', tab: 'participate' },
      { hash: '#voice-new', view: '#view-voice-new', tab: 'participate' },
      { hash: '#verification', view: '#view-verification', tab: 'me' },
      { hash: '#privacy', view: '#view-privacy', tab: 'me' },
      { hash: '#notifications', view: '#view-notifications', tab: 'home' }
    ];

    for (const route of inheritedRoutes) {
      await goTo(page, route.hash);
      await expect(page.locator(route.view)).toBeVisible();
      await expectOnlyPrimaryTab(page, route.tab);
    }
  });

  test('invalid detail IDs fall back to their parent list without another entity', async ({ page }) => {
    for (const route of ['#events/not-real', '#opportunities/not-real', '#sports/not-real']) {
      await goTo(page, route);
      await expect(page.locator('#view-discover')).toBeVisible();
      await expect(page.locator('#view-event')).toBeHidden();
      await expect(page.locator('#view-opportunity')).toBeHidden();
      await expect(page.locator('#view-sports')).toBeHidden();
      await expectOnlyPrimaryTab(page, 'discover');
    }

    await goTo(page, '#voice-detail/not-real');
    await expect(page.locator('#view-voice')).toBeVisible();
    await expect(page.locator('#view-voice-detail')).toBeHidden();
    await expect(page.locator('#voiceAllList .voice-issue-card')).toHaveCount(3);
    await expect(page.locator('#voiceDetailTitle')).toBeEmpty();
    await expectOnlyPrimaryTab(page, 'participate');
  });

  test('event and Voice deep links survive a reload', async ({ page }) => {
    await goTo(page, '#events/guild-debate');
    await page.reload();
    await expect(page.locator('#view-event')).toBeVisible();
    await expect(page.locator('#view-event [data-field="eventTitle"]')).toHaveText(
      'Guild Public Debate: The Future of AI in Africa'
    );
    expect(new URL(page.url()).hash).toBe('#events/guild-debate');

    await goTo(page, '#voice-detail/voice-evening-buses');
    await page.reload();
    await expect(page.locator('#view-voice-detail')).toBeVisible();
    await expect(page.locator('#voiceDetailTitle')).toHaveText('Need for more buses during evenings');
    expect(new URL(page.url()).hash).toBe('#voice-detail/voice-evening-buses');
    await expectOnlyPrimaryTab(page, 'participate');
  });
});
