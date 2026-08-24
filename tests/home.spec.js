import { expect, test } from '@playwright/test';

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

async function goTo(page, hash = '#home') {
  await page.goto(`/${hash}`);
}

test.describe('Phase 5 frozen Home composition', () => {
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

  test('keeps the frozen card order, one Home heading, and no strategy slogan', async ({ page }) => {
    await goTo(page);

    const expectedOrder = [
      'homePriority',
      'homeHero',
      'homePoll',
      'homeEvent',
      'homeSports',
      'homeOpp',
      'homeVoice',
      'homeQuiz',
      'homePlaySummary'
    ];
    const actualOrder = await page.locator('#view-home > [id]').evaluateAll(
      (nodes, expected) => nodes.map(node => node.id).filter(id => expected.includes(id)),
      expectedOrder
    );
    expect(actualOrder).toEqual(expectedOrder);

    await expect(page.locator('#view-home h1')).toHaveCount(1);
    await expect(page.locator('#view-home h1')).toHaveText('Home');
    await expect(page.locator('#view-home')).not.toContainText(
      'KNOW is the product. PARTICIPATE creates value. PLAY amplifies engagement.'
    );
  });

  test('renders the canonical hero and Quick Poll immediately after it', async ({ page }) => {
    await goTo(page);

    await expect(page.locator('#globalSearch')).toHaveAttribute(
      'placeholder',
      'Search news, events, opportunities...'
    );
    await expect(page.locator('#homeHero [data-field="heroTitle"]')).toHaveText(
      'Makerere Innovation Week opens Monday'
    );
    await expect(page.locator('#homeHero [data-testid="hero-read"]')).toHaveAttribute(
      'href',
      '#news/innovation-week'
    );

    await expect(page.locator('#homePoll')).toContainText('What should be improved most around Main Campus?');
    await expect(page.locator('#homePoll')).toContainText('Non-binding sentiment poll');
    await expect(page.locator('#homePoll [data-testid="home-poll-respond"]')).toHaveText('Respond');
    await expect(page.locator('#homePoll [data-testid="home-poll-respond"]')).toHaveAttribute(
      'href',
      '#participate'
    );
    await expect(page.locator('#homePoll')).not.toContainText('Submit Vote');
    await expect(page.locator('#homePoll')).not.toContainText('Take Poll');
  });

  test('renders the canonical Event, Sports, and Opportunity teasers and routes', async ({ page }) => {
    await goTo(page);

    await expect(page.locator('#homeEvent')).toContainText('Guild Public Debate: The Future of AI in Africa');
    await expect(page.locator('#homeEvent')).toContainText('Fri, 22 May 2026');
    await expect(page.locator('#homeEvent')).toContainText('Senate Building Auditorium');
    await expect(page.locator('#homeEvent [data-testid="home-event-link"]')).toHaveAttribute(
      'href',
      '#events/guild-debate'
    );
    await expect(page.locator('#homeEvent')).not.toContainText('RSVP');
    await expect(page.locator('#homeEvent')).not.toContainText('Attendees');

    await expect(page.locator('#homeSports')).toContainText('MUBS 1 — 2 Makerere University');
    await expect(page.locator('#homeSports')).toContainText('17 May 2026');
    await expect(page.locator('#homeSports [data-testid="home-sports-link"]')).toHaveAttribute(
      'href',
      '#sports/mubs-mak'
    );

    await expect(page.locator('#homeOpp')).toContainText('Research Assistant — Climate Resilience');
    await expect(page.locator('#homeOpp')).toContainText('Apply by 30 May 2026');
    await expect(page.locator('#homeOpp [data-testid="home-opportunity-link"]')).toHaveAttribute(
      'href',
      '#opportunities/ra-climate'
    );
  });

  test('keeps Student Voice separate, detail-routed, and canonical', async ({ page }) => {
    await goTo(page);

    await expect(page.locator('#homeVoice')).toContainText('Irregular water supply in Halls');
    await expect(page.locator('#homeVoice')).toContainText('Water & Sanitation');
    await expect(page.locator('#homeVoice')).toContainText('124 supporters');
    await expect(page.locator('#homeVoice')).toContainText('Acknowledged');
    await expect(page.locator('#homeVoice [data-testid="home-voice-link"]')).toHaveAttribute(
      'href',
      '#voice-detail/voice-water-halls'
    );
    await expect(page.locator('#homeVoice')).not.toContainText('rank');
    await expect(page.locator('#homeVoice')).not.toContainText('comments');
  });

  test('shows the Daily Quiz question with split participation and accuracy XP', async ({ page }) => {
    await goTo(page);

    await expect(page.locator('#homeQuiz')).toContainText('Which lake is the largest in East Africa?');
    await expect(page.locator('#homeQuiz')).toContainText('+5 XP');
    await expect(page.locator('#homeQuiz')).toContainText('to take part');
    await expect(page.locator('#homeQuiz')).toContainText('accuracy bonus');
    await expect(page.locator('#homeQuiz')).not.toContainText('+10 XP');
    await expect(page.locator('#homeQuiz [data-testid="home-quiz-play"]')).toHaveAttribute('href', '#play');
  });

  test('shows the quiet Play summary using the canonical student state', async ({ page }) => {
    await goTo(page);

    await expect(page.locator('#homePlaySummary')).toContainText('Level 4');
    await expect(page.locator('#homePlaySummary')).toContainText('340 XP');
    await expect(page.locator('#homePlaySummary')).toContainText('3 day streak');
    await expect(page.locator('#homePlaySummary [data-testid="home-play-link"]')).toHaveAttribute('href', '#play');
    await expect(page.locator('#homePlaySummary')).not.toContainText('badges');
    await expect(page.locator('#homePlaySummary')).not.toContainText('leaderboard');
    await expect(page.locator('#homePlaySummary')).not.toContainText('Energy');
    await expect(page.locator('#homePlaySummary')).not.toContainText('rewards');
  });

  test('loads the Home hero asset without runtime errors', async ({ page }) => {
    const runtime = captureRuntimeErrors(page);
    await goTo(page);

    await expect(page.locator('#shell')).toBeVisible();
    await expect(page.locator('#heroImg')).toBeVisible();
    const imageLoaded = await page.locator('#heroImg').evaluate(image => image.complete && image.naturalWidth > 0);
    expect(imageLoaded).toBe(true);
    expectNoRuntimeErrors(runtime);
  });

  test('fits the frozen Home composition at the focused tablet width', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await goTo(page);

    const fitsViewport = await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth
    );
    expect(fitsViewport).toBe(true);
    await expect(page.locator('#homePlaySummary')).toBeVisible();
  });
});
