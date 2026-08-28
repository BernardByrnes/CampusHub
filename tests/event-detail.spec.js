import { expect, test } from '@playwright/test';

const EVENT = Object.freeze({
  id: 'guild-debate',
  kicker: 'Upcoming Event',
  title: 'Guild Public Debate: The Future of AI in Africa',
  date: 'Fri, 22 May 2026',
  time: '2:00 PM — 4:30 PM',
  venue: 'Senate Building Auditorium',
  organiser: 'Makerere University Guild — Debate Union',
  description: "Join leading researchers, Guild leaders and student innovators for a debate on AI opportunities, ethics and skills for Africa's next decade.",
  image: 'event-debate.webp',
  imageAlt: 'Makerere University Kampala campus entrance with students walking'
});

const STALE_COPY = [
  'Open to all verified members (L1+).',
  'Please arrive by 1:45 PM for seating.',
  'No attendee directory or check-in available.',
  'Organiser is distinct from a clubs system.'
];

const PROHIBITED_CONTROL_NAMES = /Check in|Ticket|Get ticket|Directions|Map|Who'?s going|Attendees|Comments/i;
const RESPONSIVE_VIEWPORTS = [
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

async function goTo(page, hash) {
  await page.goto(`/${hash}`);
}

async function resetDemo(page) {
  await goTo(page, '#home');
  await page.waitForFunction(() => typeof window.CampusHubDebug?.resetDemo === 'function');
  await page.evaluate(() => window.CampusHubDebug.resetDemo());
  await page.evaluate(() => document.querySelectorAll('#toastWrap .toast').forEach(toast => toast.remove()));
}

async function expectDiscoverNav(page) {
  await expect(page.locator('#tab-discover')).toHaveAttribute('aria-current', 'page');
  await expect(page.locator('.nav-item[aria-current="page"]')).toHaveCount(1);
}

async function expectLoadedEventImage(page) {
  const image = page.locator('#eventImg');
  await expect.poll(() => image.evaluate(candidate => (
    candidate.complete && candidate.naturalWidth > 0
  ))).toBe(true);
  await expect(image).toHaveAttribute('alt', EVENT.imageAlt);
  await expect(image).toHaveAttribute('src', /assets\/images\/event-debate\.webp$/);
  await expect(image).toHaveAttribute('loading', 'lazy');
  await expect(image).toHaveAttribute('decoding', 'async');
}

async function expectNoHorizontalOverflow(page) {
  const metrics = await page.evaluate(() => ({
    viewportWidth: window.innerWidth,
    documentWidth: document.documentElement.scrollWidth,
    bodyWidth: document.body.scrollWidth,
    viewWidth: document.querySelector('#view-event')?.getBoundingClientRect().width || 0
  }));
  expect(metrics.documentWidth).toBeLessThanOrEqual(metrics.viewportWidth + 1);
  expect(metrics.bodyWidth).toBeLessThanOrEqual(metrics.viewportWidth + 1);
  expect(metrics.viewWidth).toBeLessThanOrEqual(metrics.viewportWidth + 1);
}

test.describe('Phase 8J canonical Event detail', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'canonical-mobile', 'Event detail semantics run once at the canonical mobile project.');
    await blockRemoteFonts(page);
    await page.emulateMedia({ reducedMotion: 'reduce' });
  });

  test('renders the canonical event facts, metadata, image, and actions', async ({ page }) => {
    await resetDemo(page);
    await goTo(page, '#events/guild-debate');

    const view = page.locator('#view-event');
    await expect(view).toBeVisible();
    await expect(view.locator('h1')).toHaveCount(1);
    await expect(view.locator('[data-field="eventKicker"]')).toHaveText(EVENT.kicker);
    await expect(page.locator('#eventDetailTitle')).toHaveText(EVENT.title);
    await expect(view.locator('[data-field="eventDate"]')).toHaveText(EVENT.date);
    await expect(view.locator('[data-field="eventTime"]')).toHaveText(EVENT.time);
    await expect(view.locator('[data-field="eventVenue"]')).toHaveText(EVENT.venue);
    await expect(view.locator('[data-field="eventOrg"]')).toHaveText(EVENT.organiser);
    await expect(view.locator('[data-field="eventDescription"]')).toHaveText(EVENT.description);
    await expect(view).toHaveAttribute('data-event-id', EVENT.id);
    await expect(view).toHaveAttribute('data-required-assurance', 'L0');
    await expect(view.getByRole('button', { name: 'Going' })).toBeVisible();
    await expect(view.getByRole('button', { name: 'Interested' })).toBeVisible();
    await expect(view.getByRole('button', { name: 'Save' })).toBeVisible();
    await expectLoadedEventImage(page);
  });

  test('removes stale fallback and developer commentary from the active Event view', async ({ page }) => {
    await resetDemo(page);
    await goTo(page, '#events/guild-debate');

    const view = page.locator('#view-event');
    for (const copy of STALE_COPY) await expect(view).not.toContainText(copy);
    const controls = await view.locator('button, a').allTextContents();
    expect(controls.join(' ')).not.toMatch(PROHIBITED_CONTROL_NAMES);
    await expect(view.getByRole('button', { name: 'Back' })).toHaveCount(1);
  });

  test('focuses the Event heading from Discover and returns to Discover with a 44px Back target', async ({ page }) => {
    await resetDemo(page);
    await goTo(page, '#discover');
    await page.locator('#discoverList [data-discover-id="guild-debate"] a').click();

    await expect(page.locator('#view-event')).toBeVisible();
    await expect.poll(() => page.evaluate(() => document.activeElement?.id)).toBe('eventDetailTitle');
    expect(new URL(page.url()).hash).toBe('#events/guild-debate');
    await expectDiscoverNav(page);

    const back = page.locator('#view-event [data-back]');
    const backSize = await back.boundingBox();
    expect(backSize?.width || 0).toBeGreaterThanOrEqual(44);
    expect(backSize?.height || 0).toBeGreaterThanOrEqual(44);
    await back.click();
    await expect(page.locator('#view-discover')).toBeVisible();
    expect(new URL(page.url()).hash).toBe('#discover');
  });

  test('resolves and focuses the direct Event route, including after reload', async ({ page }) => {
    await goTo(page, '#events/guild-debate');
    await expect(page.locator('#view-event')).toBeVisible();
    await expect(page.locator('#eventDetailTitle')).toHaveText(EVENT.title);
    await expect.poll(() => page.evaluate(() => document.activeElement?.id)).toBe('eventDetailTitle');
    await expectDiscoverNav(page);
    await page.reload();
    await expect(page.locator('#view-event')).toBeVisible();
    await expect(page.locator('#eventDetailTitle')).toHaveText(EVENT.title);
    await expect.poll(() => page.evaluate(() => document.activeElement?.id)).toBe('eventDetailTitle');
    expect(new URL(page.url()).hash).toBe('#events/guild-debate');
  });

  test('falls back invalid Event IDs to Discover without showing stale detail', async ({ page }) => {
    await goTo(page, '#events/not-real');
    await expect(page.locator('#view-discover')).toBeVisible();
    await expect(page.locator('#view-event')).toBeHidden();
    await expect(page.locator('#eventDetailTitle')).toBeHidden();
    await expectDiscoverNav(page);
    expect(new URL(page.url()).hash).toBe('#discover');
  });

  test('preserves RSVP Going, Interested, clear, zero XP, and tenant-day streak behavior', async ({ page }) => {
    await resetDemo(page);
    await goTo(page, '#events/guild-debate');
    const startingXp = await page.evaluate(() => window.CampusHubDemo.student.xp);
    const startingStreak = await page.evaluate(() => JSON.parse(localStorage.getItem('campushub:state:v2:tenant-makerere:membership-demo-001')).streakState.count);

    await page.locator('#rsvpGoing').click();
    await expect(page.locator('#rsvpGoing')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('#rsvpGoing')).toHaveText('Going ✓');
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('campushub:state:v2:tenant-makerere:membership-demo-001')).rsvp)).toBe('going');
    expect(await page.evaluate(() => window.CampusHubDemo.student.xp)).toBe(startingXp);
    const afterGoingStreak = await page.evaluate(() => JSON.parse(localStorage.getItem('campushub:state:v2:tenant-makerere:membership-demo-001')).streakState.count);
    expect(afterGoingStreak).toBeGreaterThanOrEqual(startingStreak);

    await page.locator('#rsvpGoing').click();
    await expect(page.locator('#rsvpGoing')).toHaveAttribute('aria-pressed', 'false');
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('campushub:state:v2:tenant-makerere:membership-demo-001')).rsvp)).toBe(null);
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('campushub:state:v2:tenant-makerere:membership-demo-001')).streakState.count)).toBe(afterGoingStreak);
    expect(await page.evaluate(() => window.CampusHubDemo.student.xp)).toBe(startingXp);

    await page.locator('#rsvpInterested').click();
    await expect(page.locator('#rsvpInterested')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('#rsvpInterested')).toHaveText('Interested ✓');
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('campushub:state:v2:tenant-makerere:membership-demo-001')).rsvp)).toBe('interested');
    expect(await page.evaluate(() => window.CampusHubDemo.student.xp)).toBe(startingXp);
  });

  test('keeps Save independent from RSVP, XP, and streak state', async ({ page }) => {
    await resetDemo(page);
    await goTo(page, '#events/guild-debate');
    const before = await page.evaluate(() => {
      const state = JSON.parse(localStorage.getItem('campushub:state:v2:tenant-makerere:membership-demo-001'));
      return { xp: window.CampusHubDemo.student.xp, rsvp: state.rsvp, streak: state.streakState.count };
    });

    await page.locator('#eventSave').click();
    await expect(page.locator('#eventSave')).toHaveText('Saved ✓');
    await expect(page.locator('#eventSave')).toHaveAttribute('aria-pressed', 'true');
    const after = await page.evaluate(() => {
      const state = JSON.parse(localStorage.getItem('campushub:state:v2:tenant-makerere:membership-demo-001'));
      return { xp: window.CampusHubDemo.student.xp, rsvp: state.rsvp, streak: state.streakState.count };
    });
    expect(after).toEqual(before);
  });

  test('keeps one canonical identity across Home, Discover, detail, and bounded search', async ({ page }) => {
    await resetDemo(page);
    await goTo(page, '#home');
    await expect(page.locator('#homeEvent')).toContainText(EVENT.title);
    await expect(page.locator('#homeEvent')).toContainText(EVENT.date);
    await expect(page.locator('#homeEvent')).toContainText(EVENT.time);
    await expect(page.locator('#homeEvent')).toContainText(EVENT.venue);
    await expect(page.locator('#homeEvent [data-testid="home-event-link"]')).toHaveAttribute('href', '#events/guild-debate');

    await goTo(page, '#discover');
    const card = page.locator('#discoverList [data-discover-id="guild-debate"]');
    await expect(card).toContainText(EVENT.title);
    await expect(card).toContainText(EVENT.date);
    await expect(card).toContainText(EVENT.time);
    await expect(card).toContainText(EVENT.venue);
    await expect(card.locator('a')).toHaveAttribute('href', '#events/guild-debate');

    const search = page.getByLabel('Search campus content');
    await search.fill('Senate');
    await expect(page.locator('#discoverList [data-discover-id="guild-debate"]')).toHaveCount(1);
    await search.fill('AI');
    await expect(page.locator('#discoverList [data-discover-id="guild-debate"]')).toHaveCount(1);
    await goTo(page, '#events/guild-debate');
    await expect(page.locator('#view-event')).toHaveAttribute('data-event-id', EVENT.id);
    await expect(page.locator('[data-field="eventDate"]')).toHaveText(EVENT.date);
    await expect(page.locator('[data-field="eventTime"]')).toHaveText(EVENT.time);
    await expect(page.locator('[data-field="eventVenue"]')).toHaveText(EVENT.venue);
  });

  test('stays contained and usable across the frozen responsive matrix', async ({ page }) => {
    for (const viewport of RESPONSIVE_VIEWPORTS) {
      await page.setViewportSize(viewport);
      await goTo(page, '#events/guild-debate');
      await expect(page.locator('#view-event')).toBeVisible();
      await expectNoHorizontalOverflow(page);

      const metrics = await page.evaluate(() => {
        const view = document.querySelector('#view-event')?.getBoundingClientRect();
        const shell = document.querySelector('#shell')?.getBoundingClientRect();
        const hero = document.querySelector('#eventImg')?.getBoundingClientRect();
        const title = document.querySelector('#eventDetailTitle')?.getBoundingClientRect();
        const date = document.querySelector('[data-field="eventDate"]')?.getBoundingClientRect();
        const time = document.querySelector('[data-field="eventTime"]')?.getBoundingClientRect();
        const organiser = document.querySelector('[data-field="eventOrg"]')?.getBoundingClientRect();
        const back = document.querySelector('#view-event [data-back]')?.getBoundingClientRect();
        const save = document.querySelector('#eventSave')?.getBoundingClientRect();
        const going = document.querySelector('#rsvpGoing')?.getBoundingClientRect();
        const interested = document.querySelector('#rsvpInterested')?.getBoundingClientRect();
        const nav = document.querySelector('.bottom-nav')?.getBoundingClientRect();
        const mainStyle = getComputedStyle(document.querySelector('#main'));
        return {
          viewLeft: view?.left ?? 0,
          viewRight: view?.right ?? 0,
          shellLeft: shell?.left ?? 0,
          shellRight: shell?.right ?? 0,
          shellWidth: shell?.width ?? 0,
          heroLeft: hero?.left ?? 0,
          heroRight: hero?.right ?? 0,
          titleWidth: title?.width ?? 0,
          dateRight: date?.right ?? 0,
          timeRight: time?.right ?? 0,
          organiserRight: organiser?.right ?? 0,
          backWidth: back?.width ?? 0,
          backHeight: back?.height ?? 0,
          saveWidth: save?.width ?? 0,
          saveHeight: save?.height ?? 0,
          goingWidth: going?.width ?? 0,
          goingHeight: going?.height ?? 0,
          interestedWidth: interested?.width ?? 0,
          interestedHeight: interested?.height ?? 0,
          navVisible: nav ? getComputedStyle(document.querySelector('.bottom-nav')).display !== 'none' : false,
          navHeight: nav?.height ?? 0,
          mainPaddingBottom: Number.parseFloat(mainStyle.paddingBottom) || 0
        };
      });

      expect(metrics.viewLeft).toBeGreaterThanOrEqual(metrics.shellLeft - 1);
      expect(metrics.viewRight).toBeLessThanOrEqual(metrics.shellRight + 1);
      expect(metrics.heroLeft).toBeGreaterThanOrEqual(metrics.shellLeft - 1);
      expect(metrics.heroRight).toBeLessThanOrEqual(metrics.shellRight + 1);
      expect(metrics.dateRight).toBeLessThanOrEqual(metrics.shellRight + 1);
      expect(metrics.timeRight).toBeLessThanOrEqual(metrics.shellRight + 1);
      expect(metrics.organiserRight).toBeLessThanOrEqual(metrics.shellRight + 1);
      expect(metrics.titleWidth).toBeLessThanOrEqual(metrics.shellWidth + 1);
      expect(metrics.backWidth).toBeGreaterThanOrEqual(44);
      expect(metrics.backHeight).toBeGreaterThanOrEqual(44);
      expect(metrics.saveWidth).toBeGreaterThan(0);
      expect(metrics.saveHeight).toBeGreaterThanOrEqual(36);
      expect(metrics.goingWidth).toBeGreaterThanOrEqual(44);
      expect(metrics.goingHeight).toBeGreaterThanOrEqual(44);
      expect(metrics.interestedWidth).toBeGreaterThanOrEqual(44);
      expect(metrics.interestedHeight).toBeGreaterThanOrEqual(44);
      expect(metrics.shellWidth).toBeLessThanOrEqual(431);
      if (metrics.navVisible) expect(metrics.mainPaddingBottom + 1).toBeGreaterThanOrEqual(metrics.navHeight);
    }
  });
});
