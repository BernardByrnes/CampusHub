import { expect, test } from '@playwright/test';

const STATE_KEY = 'campushub:state';

async function goTo(page, hash) {
  await page.goto(`/${hash}`);
  await expect(page.locator('#shell')).toBeVisible();
}

async function resetDemo(page) {
  await page.evaluate(() => window.CampusHubDebug.resetDemo());
}

async function setStreakState(page, streakState) {
  await page.evaluate(({ key, nextStreakState }) => {
    const state = JSON.parse(localStorage.getItem(key) || '{}');
    state.streakState = nextStreakState;
    localStorage.setItem(key, JSON.stringify(state));
  }, { key: STATE_KEY, nextStreakState: streakState });
}

async function readStreakState(page) {
  return page.evaluate(key => JSON.parse(localStorage.getItem(key) || '{}').streakState, STATE_KEY);
}

async function submitPoll(page) {
  await goTo(page, '#participate');
  await page.locator('#pollForm input[type="radio"]').first().check();
  await page.locator('#submitPoll').click();
  await expect(page.locator('#pollSuccess')).toBeVisible();
}

async function readWeek(page) {
  return page.locator('#view-play .streak-days .day-pill').evaluateAll(pills => pills.map(pill => ({
    text: pill.textContent.trim(),
    className: pill.className,
    ariaLabel: pill.getAttribute('aria-label'),
    ariaCurrent: pill.getAttribute('aria-current')
  })));
}

async function expectNoHorizontalOverflow(page) {
  const dimensions = await page.evaluate(() => ({
    documentWidth: document.documentElement.scrollWidth,
    viewportWidth: window.innerWidth,
    streakWidth: document.querySelector('#view-play .streak-days')?.scrollWidth || 0,
    streakClientWidth: document.querySelector('#view-play .streak-days')?.clientWidth || 0
  }));
  expect(dimensions.documentWidth).toBeLessThanOrEqual(dimensions.viewportWidth + 1);
  expect(dimensions.streakWidth).toBeLessThanOrEqual(dimensions.streakClientWidth + 1);
}

test.describe('Phase 8E state-driven Play streak presentation', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'canonical-mobile', 'Detailed Play streak presentation runs once in canonical-mobile.');
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
    await goTo(page, '#home');
    await page.waitForFunction(() => typeof window.CampusHubDebug?.resetDemo === 'function');
    await resetDemo(page);
  });

  test('renders only the facts proven by the default canonical streak state', async ({ page }) => {
    await goTo(page, '#play');

    expect(await readStreakState(page)).toEqual({ count:3, lastQualifiedTenantDay:'2026-05-19' });
    await expect(page.locator('[data-field="streakDuration"]')).toHaveText('3 days');
    await expect(page.locator('[data-field="streakActivitySummary"]')).toHaveText('Last active Tuesday');
    await expect(page.locator('#view-play')).not.toContainText('Active on Monday, Tuesday and Wednesday');

    const week = await readWeek(page);
    expect(week.map(day => day.text)).toEqual(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']);
    expect(week[1].className).toContain('is-last-qualified');
    expect(week[1].ariaLabel).toContain('last qualifying day');
    expect(week[2].className).toContain('is-today');
    expect(week[2].className).not.toContain('is-done');
    expect(week[2].ariaLabel).toBe('Wednesday — today');
    expect(week[2].ariaCurrent).toBe('date');

    await goTo(page, '#home');
    await expect(page.locator('[data-field="homeStreak"]')).toHaveText('3 day streak');
    await expect(page.locator('[data-testid="home-play-link"]')).toHaveAttribute('aria-label', 'Open Play: Level 4, 340 XP, 3 day streak');
    await goTo(page, '#me');
    await expect(page.locator('[data-field="meStreak"]')).toHaveText('Streak 3 days');
  });

  test('updates Play, Home, Me, and accessible copy after qualifying today', async ({ page }) => {
    await submitPoll(page);
    expect(await readStreakState(page)).toEqual({ count:4, lastQualifiedTenantDay:'2026-05-20' });

    await goTo(page, '#play');
    await expect(page.locator('[data-field="streakDuration"]')).toHaveText('4 days');
    await expect(page.locator('[data-field="streakActivitySummary"]')).toHaveText('Active today');
    const week = await readWeek(page);
    expect(week[2].className).toContain('is-today');
    expect(week[2].className).toContain('is-qualified-today');
    expect(week[2].ariaLabel).toBe('Wednesday — today, qualifying activity completed');

    await goTo(page, '#home');
    await expect(page.locator('[data-field="homeStreak"]')).toHaveText('4 day streak');
    await expect(page.locator('[data-testid="home-play-link"]')).toHaveAttribute('aria-label', 'Open Play: Level 4, 345 XP, 4 day streak');
    await goTo(page, '#me');
    await expect(page.locator('[data-field="meStreak"]')).toHaveText('Streak 4 days');
  });

  test('uses singular grammar and clears stale completion claims after a missed-day reset', async ({ page }) => {
    await setStreakState(page, { count:4, lastQualifiedTenantDay:'2026-05-18' });
    await page.reload();
    await submitPoll(page);
    expect(await readStreakState(page)).toEqual({ count:1, lastQualifiedTenantDay:'2026-05-20' });

    await goTo(page, '#play');
    await expect(page.locator('[data-field="streakDuration"]')).toHaveText('1 day');
    await expect(page.locator('[data-field="streakDuration"]')).not.toHaveText('1 days');
    await expect(page.locator('[data-field="streakActivitySummary"]')).toHaveText('Active today');
    const week = await readWeek(page);
    expect(week[0].className).not.toContain('is-done');
    expect(week[1].className).not.toContain('is-done');
    expect(week[2].className).toContain('is-qualified-today');

    await goTo(page, '#home');
    await expect(page.locator('[data-field="homeStreak"]')).toHaveText('1 day streak');
    await expect(page.locator('[data-testid="home-play-link"]')).toHaveAttribute('aria-label', 'Open Play: Level 4, 345 XP, 1 day streak');
    await goTo(page, '#me');
    await expect(page.locator('[data-field="meStreak"]')).toHaveText('Streak 1 day');
  });

  test('marks the tenant day paused during recess without implying qualification', async ({ page }) => {
    await page.evaluate(() => {
      window.CampusHubDemo.demoConfig.calendar.isInRecess = true;
      window.location.hash = '#play';
    });
    await expect(page.locator('#view-play')).toBeVisible();
    await expect(page.locator('[data-field="streakPauseNote"]')).toHaveText('Your streak is paused for the recess.');
    expect(await readStreakState(page)).toEqual({ count:3, lastQualifiedTenantDay:'2026-05-19' });
    const week = await readWeek(page);
    expect(week[1].className).toContain('is-last-qualified');
    expect(week[2].className).toContain('is-paused');
    expect(week[2].className).not.toContain('is-done');
    expect(week[2].ariaLabel).toBe('Wednesday — today, streak paused');
    expect(week[2].ariaCurrent).toBe('date');
  });

  test('derives the current week from the explicit tenant day, not the device date', async ({ page }) => {
    await page.evaluate(() => {
      window.CampusHubDemo.demoConfig.calendar.currentTenantDay = '2026-05-20';
      window.CampusHubDemo.demoConfig.calendar.isInRecess = false;
      window.location.hash = '#play';
    });
    await expect(page.locator('#view-play')).toBeVisible();
    const week = await readWeek(page);
    expect(week.map(day => day.text)).toEqual(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']);
    expect(week[2].ariaLabel).toBe('Wednesday — today');
    expect(week[2].ariaCurrent).toBe('date');
  });

  test('keeps the week row contained across the responsive checkpoint sizes', async ({ page }) => {
    test.setTimeout(60_000);
    const sizes = [
      { width:320, height:844 },
      { width:390, height:844 },
      { width:430, height:932 },
      { width:768, height:1024 },
      { width:1280, height:900 }
    ];

    for(const size of sizes){
      await page.setViewportSize(size);
      await resetDemo(page);
      await goTo(page, '#play');
      await expectNoHorizontalOverflow(page);
      await expect(page.locator('[data-field="streakDuration"]')).toHaveText('3 days');

      await submitPoll(page);
      await goTo(page, '#play');
      await expectNoHorizontalOverflow(page);
      await expect(page.locator('[data-field="streakDuration"]')).toHaveText('4 days');
      await expect(page.locator('[data-field="streakActivitySummary"]')).toHaveText('Active today');
    }
  });
});
