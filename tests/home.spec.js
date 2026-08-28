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

function expectAtLeastWithSubpixelTolerance(actual, minimum, epsilon = 0.01, message) {
  expect(actual + epsilon, message).toBeGreaterThanOrEqual(minimum);
}

test.describe('Canonical Home', () => {
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

  test('uses meaningful H2 headings for the major Home content items', async ({ page }) => {
    await goTo(page);

    const home = page.locator('#view-home');
    await expect(home.locator('h1')).toHaveCount(1);
    await expect(home.locator('h1')).toHaveText('Home');
    await expect(home.locator('h2')).toHaveCount(8);
    for (const selector of [
      '#homePriority [data-field="priorityTitle"]',
      '#homeHero [data-field="heroTitle"]',
      '#homePoll [data-field="homePollTitle"]',
      '#homeEvent [data-field="homeEventTitle"]',
      '#homeSports [data-field="sportsTitle"]',
      '#homeOpp [data-field="oppTitle"]',
      '#homeVoice [data-field="homeVoiceTitle"]',
      '#homeQuiz [data-field="homeQuizQuestion"]'
    ]) {
      await expect(home.locator(`${selector}:is(h2)`)).toHaveCount(1);
    }
    await expect(home.locator('#homePlaySummary h2')).toHaveCount(0);
  });

  test('makes the Priority Notice a full-row Notifications link', async ({ page }) => {
    await goTo(page);

    const priority = page.locator('#homePriority');
    const link = priority.locator('[data-testid="home-priority-link"]');
    await expect(priority).toHaveAttribute('role', 'note');
    await expect(link).toHaveCount(1);
    await expect(link).toHaveAttribute('href', '#notifications');
    await expect(link).toContainText('Wednesday Classes Rescheduled');
    await expect(priority.locator('a[href]')).toHaveCount(1);
    const box = await link.boundingBox();
    expect(box).not.toBeNull();
    expectAtLeastWithSubpixelTolerance(box?.height || 0, 44);
    await link.click();
    await expect(page.locator('#view-notifications')).toBeVisible();
    await expect(page.locator('.nav-item[data-nav="home"]')).toHaveAttribute('aria-current', 'page');
  });

  test('keeps every Home affordance at a practical touch target', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'The Home touch-target matrix runs once from the desktop project.');

    const viewports = [
      { width: 320, height: 844 },
      { width: 390, height: 844 },
      { width: 430, height: 932 },
      { width: 768, height: 1024 },
      { width: 1280, height: 900 }
    ];
    const selectors = [
      '#searchWrap .search',
      '#searchFilterBtn',
      '#homePriority [data-testid="home-priority-link"]',
      '#homeHero [data-testid="hero-read"]',
      '#homePoll [data-testid="home-poll-respond"]',
      '#homeEvent [data-testid="home-event-link"]',
      '#homeSports [data-testid="home-sports-link"]',
      '#homeOpp [data-testid="home-opportunity-link"]',
      '#homeVoice [data-testid="home-voice-link"]',
      '#homeQuiz [data-testid="home-quiz-play"]',
      '#homePlaySummary [data-testid="home-play-link"]',
      '#notifBtn'
    ];

    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await goTo(page);
      for (const selector of selectors) {
        const target = page.locator(selector);
        await expect(target).toBeVisible();
        const box = await target.boundingBox();
        expect(box, `${selector} should have a measurable hit area`).not.toBeNull();
        expectAtLeastWithSubpixelTolerance(box?.width || 0, 44, 0.01, `${selector} width`);
        expectAtLeastWithSubpixelTolerance(box?.height || 0, 44, 0.01, `${selector} height`);
      }
      const metrics = await page.evaluate(() => ({
        documentWidth: document.documentElement.scrollWidth,
        bodyWidth: document.body.scrollWidth,
        viewportWidth: window.innerWidth,
        shellWidth: document.querySelector('#shell')?.getBoundingClientRect().width || 0,
        navHeight: document.querySelector('.bottom-nav')?.getBoundingClientRect().height || 0,
        mainPaddingBottom: parseFloat(getComputedStyle(document.querySelector('#main')).paddingBottom) || 0
      }));
      expect(metrics.documentWidth).toBeLessThanOrEqual(metrics.viewportWidth + 1);
      expect(metrics.bodyWidth).toBeLessThanOrEqual(metrics.viewportWidth + 1);
      expect(metrics.shellWidth).toBeLessThanOrEqual(430 + 1);
      if(metrics.navHeight) expect(metrics.mainPaddingBottom + 1).toBeGreaterThanOrEqual(metrics.navHeight);
    }
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

  test('routes Home search to Discover with the bounded query', async ({ page }) => {
    await goTo(page);

    await page.locator('#globalSearch').fill('Climate');
    await expect(page.locator('#view-discover')).toBeVisible();
    await expect(page.locator('#globalSearch')).toHaveValue('Climate');
    await expect(page.locator('#discoverList')).toContainText('Research Assistant — Climate Resilience');
    await expect(page.locator('.nav-item[data-nav="discover"]')).toHaveAttribute('aria-current', 'page');
  });

  test('routes Home Filters to Discover and focuses the filter group', async ({ page }) => {
    await goTo(page);

    await page.locator('#searchFilterBtn').click();
    await expect(page.locator('#view-discover')).toBeVisible();
    await expect(page.locator('#discoverFilters')).toBeVisible();
    await expect(page.locator('#discoverFilters .filter-chip[aria-pressed="true"]')).toHaveText('All');
    await expect.poll(() => page.evaluate(() => document.activeElement?.closest('#discoverFilters')?.id || '')).toBe('discoverFilters');
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

  test('preserves the canonical entity IDs for every Home route', async ({ page }) => {
    const routes = [
      ['#homeHero [data-testid="hero-read"]', '#news/innovation-week'],
      ['#homePoll [data-testid="home-poll-respond"]', '#participate'],
      ['#homeEvent [data-testid="home-event-link"]', '#events/guild-debate'],
      ['#homeSports [data-testid="home-sports-link"]', '#sports/mubs-mak'],
      ['#homeOpp [data-testid="home-opportunity-link"]', '#opportunities/ra-climate'],
      ['#homeVoice [data-testid="home-voice-link"]', '#voice-detail/voice-water-halls'],
      ['#homeQuiz [data-testid="home-quiz-play"]', '#play'],
      ['#homePlaySummary [data-testid="home-play-link"]', '#play']
    ];

    for (const [selector, hash] of routes) {
      await goTo(page);
      await page.locator(selector).click();
      await expect.poll(() => new URL(page.url()).hash).toBe(hash);
    }
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

  test('uses exactly one editorially featured Voice issue for the canonical Home slot', async ({ page }) => {
    await goTo(page);

    const featured = await page.evaluate(() => window.CampusHubDemo.voiceIssues
      .filter(issue => issue.featured === true)
      .map(issue => issue.id));
    expect(featured).toEqual(['voice-water-halls']);
    await expect(page.locator('#homeVoice [data-testid="home-voice-link"]')).toHaveAttribute(
      'href',
      '#voice-detail/voice-water-halls'
    );
  });

  test('falls back to the latest Voice operational update without mutating data or ranking by supporters', async ({ page }) => {
    await goTo(page);
    const before = await page.evaluate(() => window.CampusHubDemo.voiceIssues.map(issue => ({
      id: issue.id,
      category: issue.category,
      title: issue.title,
      supporters: issue.supporters,
      status: issue.status,
      history: JSON.stringify(issue.history),
      officialUpdates: JSON.stringify(issue.officialUpdates)
    })));

    await page.evaluate(() => {
      window.CampusHubDemo.voiceIssues.forEach(issue => { issue.featured = false; });
      location.hash = '#discover';
    });
    await expect(page.locator('#view-discover')).toBeVisible();
    await page.evaluate(() => { location.hash = '#home'; });
    await expect(page.locator('#view-home')).toBeVisible();
    await expect(page.locator('#homeVoice [data-field="homeVoiceTitle"]')).toHaveText(
      'Need for more buses during evenings'
    );
    await expect(page.locator('#homeVoice [data-field="homeVoiceCategory"]')).toHaveText('Transport');
    await expect(page.locator('#homeVoice [data-testid="home-voice-link"]')).toHaveAttribute(
      'href',
      '#voice-detail/voice-evening-buses'
    );
    await page.locator('#homeVoice [data-testid="home-voice-link"]').click();
    await expect.poll(() => new URL(page.url()).hash).toBe('#voice-detail/voice-evening-buses');
    await expect(page.locator('#voiceDetailTitle')).toHaveText('Need for more buses during evenings');

    const after = await page.evaluate(() => window.CampusHubDemo.voiceIssues.map(issue => ({
      id: issue.id,
      category: issue.category,
      title: issue.title,
      supporters: issue.supporters,
      status: issue.status,
      history: JSON.stringify(issue.history),
      officialUpdates: JSON.stringify(issue.officialUpdates)
    })));
    expect(after).toEqual(before);

    await page.evaluate(() => {
      window.CampusHubDemo.voiceIssues.forEach(issue => {
        if(issue.id === 'voice-water-halls') issue.featured = true;
        else delete issue.featured;
      });
      location.hash = '#home';
    });
    await expect(page.locator('#view-home')).toBeVisible();
    await expect(page.locator('#homeVoice [data-field="homeVoiceTitle"]')).toHaveText('Irregular water supply in Halls');
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

  test('reflects the already-acted-on Quiz state without changing the Home poll', async ({ page }) => {
    await goTo(page);
    await expect(page.locator('[data-field="homeQuizCta"]')).toHaveText('Play');
    await expect(page.locator('#homePoll [data-testid="home-poll-respond"]')).toHaveText('Respond');

    await page.evaluate(() => {
      const state = JSON.parse(localStorage.getItem('campushub:state'));
      state.quizDone = true;
      state.quizChoice = 0;
      localStorage.setItem('campushub:state', JSON.stringify(state));
      location.hash = '#discover';
    });
    await expect(page.locator('#view-discover')).toBeVisible();
    await page.evaluate(() => { location.hash = '#home'; });
    await expect(page.locator('#view-home')).toBeVisible();
    await expect(page.locator('[data-field="homeQuizCta"]')).toHaveText('Review');
    await expect(page.locator('#homeQuiz [data-testid="home-quiz-play"]')).toHaveAttribute('href', '#play');
    await expect(page.locator('#homePoll [data-testid="home-poll-respond"]')).toHaveText('Respond');
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

  test('omits an expired Opportunity without disturbing the remaining Home order', async ({ page }) => {
    await goTo(page);
    await page.evaluate(() => window.CampusHubDebug.setOpportunityScenario('expired'));

    await expect(page.locator('#homeOpp')).toBeHidden();
    await expect(page.locator('#homeVoice')).toBeVisible();
    await expect(page.locator('#homeQuiz')).toBeVisible();
    await expect(page.locator('#homePlaySummary')).toBeVisible();
    const visibleIds = await page.locator('#view-home > [id]').evaluateAll(nodes => nodes
      .filter(node => !node.hidden)
      .map(node => node.id));
    expect(visibleIds).toEqual([
      'homePriority',
      'homeHero',
      'homePoll',
      'homeEvent',
      'homeSports',
      'homeVoice',
      'homeQuiz',
      'homePlaySummary'
    ]);
  });

  test('keeps Home free of prohibited engagement and social drift', async ({ page }) => {
    await goTo(page);
    const home = page.locator('#view-home');
    await expect(home).not.toContainText(/leaderboard|Energy|rewards|Attendees|betting|Sponsored|Comments/i);
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
