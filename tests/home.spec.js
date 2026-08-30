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

const FROZEN_HOME_ORDER = [
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

async function resetDemoAndGoHome(page) {
  await goTo(page, '#home');
  await page.waitForFunction(() => typeof window.CampusHubDebug?.resetDemo === 'function');
  await page.evaluate(() => window.CampusHubDebug.resetDemo());
}

async function visibleHomeOrder(page) {
  return page.locator('#view-home > [id]').evaluateAll(nodes => nodes
    .filter(node => !node.hidden)
    .map(node => node.id));
}

async function completeCanonicalPoll(page) {
  await page.locator('#homePoll [data-testid="home-poll-respond"]').click();
  await page.locator('#pollForm input[type="radio"]').first().check();
  await page.locator('#submitPoll').click();
  await expect(page.locator('#pollSuccess')).toBeVisible();
}

async function completeCanonicalQuiz(page) {
  await page.locator('#homeQuiz [data-testid="home-quiz-play"]').click();
  await page.locator('#quizOptions input[type="radio"]').first().check();
  await page.locator('#quizSubmit').click();
  await expect(page.locator('#quizFeedback')).toBeVisible();
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

  test('makes the Priority Notice a full-row Publication link', async ({ page }) => {
    await goTo(page);

    const priority = page.locator('#homePriority');
    const link = priority.locator('[data-testid="home-priority-link"]');
    await expect(priority).toHaveAttribute('role', 'note');
    await expect(link).toHaveCount(1);
    await expect(link).toHaveAttribute('href', '#news/notice-classes-rescheduled');
    await expect(link).toContainText('Wednesday Classes Rescheduled');
    await expect(priority.locator('a[href]')).toHaveCount(1);
    const box = await link.boundingBox();
    expect(box).not.toBeNull();
    expectAtLeastWithSubpixelTolerance(box?.height || 0, 44);
    const before = await page.evaluate(() => JSON.parse(localStorage.getItem('campushub:state:v3:tenant-makerere:membership-demo-001') || '{}').notificationReadIds);
    await link.click();
    await expect(page.locator('#view-news')).toBeVisible();
    await expect(page.locator('#newsDetailTitle')).toHaveText('Wednesday Classes Rescheduled');
    await expect(page.locator('.nav-item[data-nav="discover"]')).toHaveAttribute('aria-current', 'page');
    const after = await page.evaluate(() => JSON.parse(localStorage.getItem('campushub:state:v3:tenant-makerere:membership-demo-001') || '{}').notificationReadIds);
    expect(after).toEqual(before);
    await page.locator('#view-news [data-back]').click();
    await expect(page.locator('#view-home')).toBeVisible();
    expect(new URL(page.url()).hash).toBe('#home');
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

  test('renders the canonical hero and Poll immediately after it', async ({ page }) => {
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

    await expect(page.locator('#homePoll')).toContainText('How would you rate the cleanliness of public restrooms on campus?');
    await expect(page.locator('#homePoll')).toContainText('Non-binding student sentiment poll');
    await expect(page.locator('#homePoll')).toContainText('Closes 25 May 2026');
    await expect(page.locator('#homePoll [data-testid="home-poll-respond"]')).toHaveText('Respond');
    await expect(page.locator('#homePoll [data-testid="home-poll-respond"]')).toHaveAttribute(
      'href',
      '#participate'
    );
    await expect(page.locator('#homePoll')).not.toContainText('Submit Vote');
    await expect(page.locator('#homePoll')).not.toContainText('Take Poll');
  });

  test('keeps Home Poll content on the canonical D.poll and continues to Participate', async ({ page }) => {
    await goTo(page);

    const canonical = await page.evaluate(() => ({
      poll: {
        id: window.CampusHubDemo.poll?.id,
        question: window.CampusHubDemo.poll?.question,
        closes: window.CampusHubDemo.poll?.closes,
        href: window.CampusHubDemo.poll?.href
      },
      hasQuickPollForHome: Object.prototype.hasOwnProperty.call(window.CampusHubDemo, 'quickPollForHome'),
      publicationIds: window.CampusHubDemo.publications.map(publication => publication.id),
      hasPriorityNoticeEntity: Object.prototype.hasOwnProperty.call(window.CampusHubDemo, 'priorityNotice')
    }));
    expect(canonical.poll).toEqual({
      id: 'poll-restroom-cleanliness',
      question: 'How would you rate the cleanliness of public restrooms on campus?',
      closes: 'Closes 25 May 2026',
      href: '#participate'
    });
    expect(canonical.hasQuickPollForHome).toBe(false);
    expect(canonical.hasPriorityNoticeEntity).toBe(false);
    expect(canonical.publicationIds.filter(id => id === 'notice-classes-rescheduled')).toHaveLength(1);

    await expect(page.locator('#homePoll [data-field="homePollTitle"]')).toHaveText(canonical.poll.question);
    await page.locator('#homePoll [data-testid="home-poll-respond"]').click();
    await expect(page.locator('#view-participate')).toBeVisible();
    await expect(page.locator('#seg-polls')).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('#pollQuestion')).toHaveText(canonical.poll.question);
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

  test('labels a responded Poll with a quiet review affordance and preserves it after reload', async ({ page }) => {
    await resetDemoAndGoHome(page);
    const pollLink = page.locator('#homePoll [data-testid="home-poll-respond"]');
    await expect(pollLink).toHaveText('Respond');
    await expect(page.locator('[data-field="homePollState"]')).toBeHidden();

    await completeCanonicalPoll(page);
    await page.locator('#tab-home').click();
    await expect(page.locator('#view-home')).toBeVisible();
    await expect(page.locator('#homePoll [data-field="homePollState"]')).toHaveText('Responded');
    await expect(page.locator('#homePoll [data-field="homePollState"]')).toBeVisible();
    await expect(pollLink).toHaveText('Review');
    await expect(pollLink).toHaveAttribute('href', '#participate');
    await expect(pollLink).toHaveAttribute('aria-label', 'Review your recorded poll response');
    await expect(page.locator('#homePoll')).toHaveClass(/home-card--acted/);
    await expect(page.locator('#homePoll')).not.toContainText('Very good');
    await expect(page.locator('#homePoll')).not.toContainText('Very poor');
    expect(await visibleHomeOrder(page)).toEqual(FROZEN_HOME_ORDER);

    await page.reload();
    await expect(page.locator('#homePoll [data-field="homePollState"]')).toBeVisible();
    await expect(pollLink).toHaveText('Review');
    expect(await visibleHomeOrder(page)).toEqual(FROZEN_HOME_ORDER);
  });

  test('derives Event Going and Interested labels from RSVP state, but not from Save', async ({ page }) => {
    await resetDemoAndGoHome(page);
    await page.goto('/#events/guild-debate');
    await page.locator('#rsvpGoing').click();
    await expect(page.locator('#rsvpGoing')).toHaveText('Going ✓');
    await page.locator('#rsvpInterested').click();
    await expect(page.locator('#rsvpInterested')).toHaveText('Interested ✓');
    await page.locator('#tab-home').click();
    await expect(page.locator('#homeEvent [data-field="homeEventState"]')).toHaveText('Interested');
    await expect(page.locator('#homeEvent [data-field="homeEventState"]')).toBeVisible();
    await expect(page.locator('#homeEvent')).toHaveClass(/home-card--acted/);

    await page.reload();
    await expect(page.locator('#homeEvent [data-field="homeEventState"]')).toHaveText('Interested');

    await page.goto('/#events/guild-debate');
    await page.locator('#rsvpInterested').click();
    await expect(page.locator('#rsvpInterested')).toHaveText('Interested');
    await page.locator('#tab-home').click();
    await expect(page.locator('#homeEvent [data-field="homeEventState"]')).toBeHidden();
    await expect(page.locator('#homeEvent')).not.toHaveClass(/home-card--acted/);
    await expect(page.locator('#homeEvent')).not.toContainText('Going');
    await expect(page.locator('#homeEvent')).not.toContainText('Interested');

    await page.goto('/#events/guild-debate');
    await page.locator('#eventSave').click();
    await expect(page.locator('#eventSave')).toHaveText('Saved ✓');
    await page.locator('#tab-home').click();
    await expect(page.locator('#homeEvent [data-field="homeEventState"]')).toBeHidden();
    await expect(page.locator('#homeEvent')).not.toHaveClass(/home-card--acted/);
  });

  test('keeps the exact frozen Home order when Poll, Event, and Quiz are all acted', async ({ page }) => {
    await resetDemoAndGoHome(page);
    await completeCanonicalPoll(page);
    await page.goto('/#events/guild-debate');
    await page.locator('#rsvpGoing').click();
    await page.locator('#tab-home').click();
    await completeCanonicalQuiz(page);
    await page.locator('#tab-home').click();
    await expect(page.locator('#view-home')).toBeVisible();
    await expect(page.locator('#homePoll [data-field="homePollState"]')).toHaveText('Responded');
    await expect(page.locator('#homeEvent [data-field="homeEventState"]')).toHaveText('Going');
    await expect(page.locator('[data-field="homeQuizCta"]')).toHaveText('Review');
    expect(await visibleHomeOrder(page)).toEqual(FROZEN_HOME_ORDER);
    await page.reload();
    expect(await visibleHomeOrder(page)).toEqual(FROZEN_HOME_ORDER);
    await expect(page.locator('#homePlaySummary')).toBeVisible();
  });

  test('resets acted Home presentation and isolates foreign membership state', async ({ page }) => {
    await resetDemoAndGoHome(page);
    const foreignKey = 'campushub:state:v3:tenant-foreign:membership-foreign-001';
    await page.evaluate(key => localStorage.setItem(key, JSON.stringify({
      schemaVersion: 3,
      tenantId: 'tenant-foreign',
      membershipId: 'membership-foreign-001',
      pollDone: true,
      rsvp: 'going',
      quizDone: true,
      quizParticipation: { quizId: 'daily-quiz-2026-05-20', tenantDay: '2026-05-20', optionIndex: 0, xpAwarded: 10 }
    })), foreignKey);
    await page.reload();
    await expect(page.locator('#homePoll [data-testid="home-poll-respond"]')).toHaveText('Respond');
    await expect(page.locator('#homePoll [data-field="homePollState"]')).toBeHidden();
    await expect(page.locator('#homeEvent [data-field="homeEventState"]')).toBeHidden();
    await expect(page.locator('[data-field="homeQuizCta"]')).toHaveText('Play');

    await completeCanonicalPoll(page);
    await page.locator('#tab-home').click();
    await completeCanonicalQuiz(page);
    await page.locator('#tab-home').click();
    await expect(page.locator('#homePoll [data-field="homePollState"]')).toBeVisible();
    await expect(page.locator('[data-field="homeQuizCta"]')).toHaveText('Review');
    await page.evaluate(() => window.CampusHubDebug.resetDemo());
    await expect(page.locator('#homePoll [data-testid="home-poll-respond"]')).toHaveText('Respond');
    await expect(page.locator('#homePoll [data-field="homePollState"]')).toBeHidden();
    await expect(page.locator('#homeEvent [data-field="homeEventState"]')).toBeHidden();
    await expect(page.locator('[data-field="homeQuizCta"]')).toHaveText('Play');
    expect(await page.evaluate(key => Boolean(localStorage.getItem(key)), foreignKey)).toBe(true);
  });

  test('provides pure acted-state and deterministic within-slot candidate contracts', async ({ page }) => {
    await resetDemoAndGoHome(page);
    const result = await page.evaluate(() => {
      const poll = window.CampusHubDebug.homeActedStateFor({
        kind: 'poll',
        entity: window.CampusHubDemo.poll,
        state: { pollDone: true }
      });
      const event = window.CampusHubDebug.homeActedStateFor({
        kind: 'event',
        entity: window.CampusHubDemo.featuredEvent,
        state: { rsvp: 'interested' }
      });
      const quiz = window.CampusHubDebug.homeActedStateFor({
        kind: 'quiz',
        entity: window.CampusHubDemo.quiz,
        state: { quizParticipation: { quizId: window.CampusHubDemo.quiz.id, tenantDay: window.CampusHubDemo.quiz.tenantDay, optionIndex: 0 } }
      });
      const candidates = [
        { id: 'candidate-a', acted: true, recency: 99 },
        { id: 'candidate-b', acted: false, recency: 1 },
        { id: 'candidate-c', acted: false, recency: 50, eligible: false }
      ];
      const select = input => window.CampusHubDebug.selectHomeCandidate(input, {
        actedStateFor: candidate => ({ acted: candidate.acted }),
        primaryRankFor: candidate => candidate.recency
      });
      const unactedPreferred = select(candidates);
      const primaryRank = select(candidates.map(candidate => ({ ...candidate, acted: false })));
      const tied = [
        { id: 'zeta', acted: false, recency: 10 },
        { id: 'alpha', acted: false, recency: 10 }
      ];
      const permutations = [tied, tied.slice().reverse()].map(select).map(candidate => candidate?.id);
      return { poll, event, quiz, unactedPreferred, primaryRank, permutations };
    });
    expect(result.poll).toEqual({ acted: true, state: 'responded', rankPenalty: 1 });
    expect(result.event).toEqual({ acted: true, state: 'interested', rankPenalty: 1 });
    expect(result.quiz).toEqual({ acted: true, state: 'complete', rankPenalty: 1 });
    expect(result.unactedPreferred.id).toBe('candidate-b');
    expect(result.primaryRank.id).toBe('candidate-a');
    expect(result.permutations).toEqual(['alpha', 'alpha']);
  });

  test('keeps acted Home state usable and restrained across the frozen responsive widths', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'The acted-state responsive matrix runs once from the desktop project.');
    await resetDemoAndGoHome(page);
    await completeCanonicalPoll(page);
    await page.goto('/#events/guild-debate');
    await page.locator('#rsvpGoing').click();
    await page.locator('#tab-home').click();
    await completeCanonicalQuiz(page);
    await page.locator('#tab-home').click();
    for (const viewport of [
      { width: 320, height: 844 },
      { width: 390, height: 844 },
      { width: 430, height: 932 },
      { width: 768, height: 1024 },
      { width: 1280, height: 900 }
    ]) {
      await page.setViewportSize(viewport);
      await page.reload();
      await expect(page.locator('#homePoll [data-field="homePollState"]')).toBeVisible();
      await expect(page.locator('#homeEvent [data-field="homeEventState"]')).toBeVisible();
      await expect(page.locator('[data-field="homeQuizCta"]')).toHaveText('Review');
      const metrics = await page.evaluate(() => ({
        documentWidth: document.documentElement.scrollWidth,
        viewportWidth: window.innerWidth,
        homeWidth: document.querySelector('#view-home')?.getBoundingClientRect().width || 0
      }));
      expect(metrics.documentWidth).toBeLessThanOrEqual(metrics.viewportWidth + 1);
      expect(metrics.homeWidth).toBeLessThanOrEqual(metrics.viewportWidth + 1);
      expect(await visibleHomeOrder(page)).toEqual(FROZEN_HOME_ORDER);
    }
  });

  test('reflects the completed Quiz as Review without changing the Home poll', async ({ page }) => {
    await goTo(page);
    await expect(page.locator('[data-field="homeQuizCta"]')).toHaveText('Play');
    await expect(page.locator('#homePoll [data-testid="home-poll-respond"]')).toHaveText('Respond');

    await page.locator('#homeQuiz [data-testid="home-quiz-play"]').click();
    await expect(page.locator('#view-play')).toBeVisible();
    await page.locator('#quizOptions input[value="0"]').check();
    await page.locator('#quizSubmit').click();
    await expect(page.locator('#quizFeedback')).toContainText('Correct!');
    await page.locator('#tab-home').click();
    await expect(page.locator('#view-home')).toBeVisible();
    await expect(page.locator('[data-field="homeQuizCta"]')).toHaveText('Review');
    await expect(page.locator('#homeQuiz [data-testid="home-quiz-play"]')).toHaveAttribute('href', '#play');
    await expect(page.locator('#homePoll [data-testid="home-poll-respond"]')).toHaveText('Respond');

    const rawBeforeReview = await page.evaluate(() => localStorage.getItem('campushub:state:v3:tenant-makerere:membership-demo-001'));
    await page.locator('#homeQuiz [data-testid="home-quiz-play"]').click();
    await expect(page.locator('#view-play')).toBeVisible();
    await expect(page.locator('#quizFeedback')).toContainText('Correct!');
    await expect(page.locator('#quizCompleteNote')).toBeVisible();
    await expect(page.locator('#quizSubmit')).toBeHidden();
    expect(await page.evaluate(() => localStorage.getItem('campushub:state:v3:tenant-makerere:membership-demo-001'))).toBe(rawBeforeReview);
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
