import { expect, test } from '@playwright/test';

const STATE_KEY = 'campushub:state:v2:tenant-makerere:membership-demo-001';

async function resetDemo(page) {
  await page.goto('/#home');
  await page.waitForFunction(() => typeof window.CampusHubDebug?.resetDemo === 'function');
  await page.evaluate(() => window.CampusHubDebug.resetDemo());
  await page.goto('/#me');
  await expect(page.locator('#view-me')).toBeVisible();
}

async function readState(page) {
  return page.evaluate(key => JSON.parse(localStorage.getItem(key) || 'null'), STATE_KEY);
}

async function applyStudentProgressState(page, xp, level) {
  await page.evaluate(({ key, xp: nextXp, level: nextLevel }) => {
    const state = JSON.parse(localStorage.getItem(key) || '{}');
    state.xp = nextXp;
    if (nextLevel === null) delete state.level;
    else state.level = nextLevel;
    localStorage.setItem(key, JSON.stringify(state));
  }, { key: STATE_KEY, xp, level });
  await page.reload();
  await page.goto('/#me');
  await expect(page.locator('#view-me')).toBeVisible();
}

test.describe('Phase 8M canonical Me profile and activity coherence', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'canonical-mobile', 'Me contract coverage runs once at canonical-mobile.');
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
    await resetDemo(page);
  });

  test('renders the frozen hierarchy, identity, and accessible activity list', async ({ page }) => {
    const me = page.locator('#view-me');
    await expect(me.locator('.view-sub')).toHaveText('Manage your account, membership and preferences.');
    await expect(me.locator(':scope > .section-head').first().locator('h2')).toHaveText('Provided by your university');
    await expect(me.getByRole('heading', { name:'Provided by your university', exact:true })).toBeVisible();
    await expect(me).toContainText('Provided by you');
    await expect(me).toContainText('Activity & account');
    await expect(me.locator('[data-field="studentName"]')).toHaveText('Nakato Grace');
    await expect(me.locator('[data-field="studentProg"]')).toHaveText('BSc Computer Science • Year 3');
    await expect(me.locator('[data-field="studentCampus"]')).toHaveText('Main Campus • Mary Stuart Hall');
    await expect(me.locator('.avatar')).toHaveText('NG');
    await expect(me.locator('[data-field="assuranceBadge"]')).toHaveText('L2 — Roster Match');
    await expect(me.locator('[data-field="meLevelXp"]')).toHaveText('Level 4 • 340 XP');
    await expect(me.locator('#meActivity')).toHaveAttribute('aria-label', 'Activity and account');
    await expect(me.locator('#meActivity > ul > li')).toHaveCount(5);
    expect(await me.locator('#meActivity .row-label').allTextContents()).toEqual([
      'Saves', 'RSVPs', 'Play', 'Privacy & transparency', 'Verification & membership'
    ]);
    await expect(me.locator('#view-me > article a, #view-me > article button')).toHaveCount(0);
    await expect(me.locator('a[href="#me"]')).toHaveCount(0);
    await expect(me.locator('img')).toHaveCount(0);
    await expect(me).not.toContainText(/Notifications|Sessions & security|Help & support|Date of birth|DOB|\bVerified\b/i);
  });

  test('uses semantic university and student-provided field groups without edit controls', async ({ page }) => {
    const me = page.locator('#view-me');
    await expect(me.locator('section[aria-label="Provided by your university"] dl')).toHaveCount(1);
    expect(await me.locator('section[aria-label="Provided by your university"] dt').allTextContents()).toEqual([
      'Student number', 'Faculty', 'Enrolment status'
    ]);
    await expect(me.locator('[data-field="studentNo"]')).toHaveText('21/U/04218');
    await expect(me.locator('[data-field="studentFaculty"]')).toHaveText('College of Computing & Information Sciences');
    await expect(me.locator('[data-field="studentEnrolment"]')).toHaveText('Current');
    await expect(me.locator('[data-field="studentDisplayName"]')).toHaveText('Nakato Grace');
    await expect(me.locator('[data-field="studentEmail"]')).toHaveText('n.grace@…');
    await expect(me.locator('[data-field="studentPhone"]')).toHaveText('+256 7•• ••• 321');
    await expect(me.locator('[data-field="notificationPrefs"]')).toHaveText('In-app first');
    await expect(me.locator('text=Notification preferences').locator('..').locator('a,button')).toHaveCount(0);
  });

  test('derives Saves from actual state and opens the in-page detail with focus', async ({ page }) => {
    const saveRow = page.locator('#meSaveLink');
    await expect(saveRow.locator('[data-field="savesMeta"]')).toHaveText('3 saved');
    expect((await readState(page)).saves).toHaveLength(3);

    await saveRow.click();
    await expect(page.locator('#meSaves')).toBeVisible();
    await expect.poll(() => page.evaluate(() => document.activeElement?.id)).toBe('meSavesHeading');
    await expect(page).toHaveURL(/#me$/);

    await page.locator('#savesList [data-unsave]').first().click();
    await expect(saveRow.locator('[data-field="savesMeta"]')).toHaveText('2 saved');
    while (await page.locator('#savesList [data-unsave]').count()) {
      await page.locator('#savesList [data-unsave]').first().click();
    }
    await expect(saveRow.locator('[data-field="savesMeta"]')).toHaveText('Nothing saved yet.');
    await expect(page.locator('#savesList')).toHaveText('Nothing saved yet.');
    expect((await readState(page)).saves).toEqual([]);
  });

  test('keeps RSVP summary and compact detail synchronized for Going, Interested, and clear', async ({ page }) => {
    const rsvpRow = page.locator('#meRsvpLink');
    await expect(rsvpRow.locator('[data-field="meRsvpMeta"]')).toHaveText('No RSVPs yet.');
    await rsvpRow.click();
    await expect(page.locator('#meRsvps')).toBeVisible();
    await expect(page.locator('#meRsvpsList')).toHaveText('No RSVPs yet.');
    await expect.poll(() => page.evaluate(() => document.activeElement?.id)).toBe('meRsvpsHeading');

    await page.goto('/#events/guild-debate');
    await page.locator('#rsvpGoing').click();
    await page.goto('/#me');
    await expect(rsvpRow.locator('[data-field="meRsvpMeta"]')).toHaveText('1 RSVP • Going');
    await rsvpRow.click();
    await expect(page.locator('#meRsvpsList a[href="#events/guild-debate"]')).toHaveText('Guild Public Debate: The Future of AI in Africa');
    await expect(page.locator('#meRsvpsList')).toContainText('Fri, 22 May 2026');
    await expect(page.locator('#meRsvpsList')).toContainText('2:00 PM — 4:30 PM');
    await expect(page.locator('#meRsvpsList')).toContainText('Senate Building Auditorium');
    await expect(page.locator('#meRsvpsList .pill')).toHaveText('Going');

    await page.goto('/#events/guild-debate');
    await page.locator('#rsvpGoing').click();
    await page.locator('#rsvpInterested').click();
    await page.goto('/#me');
    await expect(rsvpRow.locator('[data-field="meRsvpMeta"]')).toHaveText('1 RSVP • Interested');
    await rsvpRow.click();
    await expect(page.locator('#meRsvpsList .pill')).toHaveText('Interested');

    await page.goto('/#events/guild-debate');
    await page.locator('#rsvpInterested').click();
    await page.goto('/#me');
    await expect(rsvpRow.locator('[data-field="meRsvpMeta"]')).toHaveText('No RSVPs yet.');
    await rsvpRow.click();
    await expect(page.locator('#meRsvpsList')).toHaveText('No RSVPs yet.');
  });

  test('reflects existing XP and tenant-day streak state in Me and Play', async ({ page }) => {
    await expect(page.locator('[data-field="meLevelXp"]')).toHaveText('Level 4 • 340 XP');
    await expect(page.locator('#meActivity [data-field="mePlayLevel"]')).toHaveText('Level 4');
    await expect(page.locator('#meActivity [data-field="meStreak"]')).toHaveText('Streak 3 days');

    await page.goto('/#participate');
    await page.locator('#pollForm input[type="radio"]').first().check();
    await page.locator('#submitPoll').click();
    await expect(page.locator('#pollSuccess')).toBeVisible();
    await page.goto('/#me');
    await expect(page.locator('[data-field="meLevelXp"]')).toHaveText('Level 4 • 345 XP');
    await expect(page.locator('#meActivity [data-field="mePlayLevel"]')).toHaveText('Level 4');
    await expect(page.locator('#meActivity [data-field="meStreak"]')).toHaveText('Streak 4 days');
  });

  test('keeps Me, Play, and Home on one threshold-derived level with a non-decreasing floor', async ({ page }) => {
    await applyStudentProgressState(page, 499, 4);
    await expect(page.locator('[data-field="meLevelXp"]')).toHaveText('Level 4 • 499 XP');
    expect((await readState(page)).level).toBe(4);

    await applyStudentProgressState(page, 500, 4);
    await expect(page.locator('[data-field="meLevelXp"]')).toHaveText('Level 5 • 500 XP');
    await expect(page.locator('#meActivity [data-field="mePlayLevel"]')).toHaveText('Level 5');
    expect((await readState(page)).level).toBe(5);

    await page.goto('/#play');
    await expect(page.locator('[data-field="levelDisplay"]')).toHaveText('Level 5');
    await expect(page.locator('[data-field="levelTitle"]')).toHaveText('Campus Leader');
    await expect(page.locator('[data-field="xpCount"]')).toHaveText('500');
    await expect(page.locator('[data-field="xpNext"]')).toHaveText('Max level');

    await page.goto('/#home');
    await expect(page.locator('#homePlaySummary [data-field="homeLevel"]')).toHaveText('Level 5');
    await expect(page.locator('#homePlaySummary [data-field="homeXp"]')).toHaveText('500 XP');

    // A permitted correction can lower XP, but a reached level remains grandfathered.
    await applyStudentProgressState(page, 340, 5);
    await expect(page.locator('[data-field="meLevelXp"]')).toHaveText('Level 5 • 340 XP');
    await expect(page.locator('#meActivity [data-field="mePlayLevel"]')).toHaveText('Level 5');
    await page.goto('/#play');
    await expect(page.locator('[data-field="levelDisplay"]')).toHaveText('Level 5');
    await page.goto('/#home');
    await expect(page.locator('#homePlaySummary [data-field="homeLevel"]')).toHaveText('Level 5');

    await page.evaluate(() => window.CampusHubDebug.resetDemo());
    await page.goto('/#me');
    await expect(page.locator('[data-field="meLevelXp"]')).toHaveText('Level 4 • 340 XP');
    await page.goto('/#play');
    await expect(page.locator('[data-field="levelDisplay"]')).toHaveText('Level 4');
    await page.goto('/#home');
    await expect(page.locator('#homePlaySummary [data-field="homeLevel"]')).toHaveText('Level 4');
    expect(await readState(page)).toMatchObject({ xp:340, level:4 });
  });

  test('migrates an XP-only legacy state to the threshold-derived level without a reset', async ({ page }) => {
    await applyStudentProgressState(page, 340, null);
    await expect(page.locator('[data-field="meLevelXp"]')).toHaveText('Level 4 • 340 XP');
    expect(await readState(page)).toMatchObject({ xp:340, level:4 });

    await applyStudentProgressState(page, 500, null);
    await expect(page.locator('[data-field="meLevelXp"]')).toHaveText('Level 5 • 500 XP');
    expect(await readState(page)).toMatchObject({ xp:500, level:5 });

    await page.goto('/#play');
    await expect(page.locator('[data-field="levelDisplay"]')).toHaveText('Level 5');
    await page.goto('/#home');
    await expect(page.locator('#homePlaySummary [data-field="homeLevel"]')).toHaveText('Level 5');
  });

  test('keeps membership refresh truthful while preserving L2 assurance', async ({ page }) => {
    await page.evaluate(() => window.CampusHubDebug.setScenario('membership-refresh'));
    await page.goto('/#me');
    const me = page.locator('#view-me');
    await expect(me.locator('[data-field="assuranceBadge"]')).toHaveText('L2 — Roster Match');
    await expect(me.locator('[data-field="studentEnrolment"]')).toHaveText('Needs refreshing');
    await expect(me.locator('[data-field="meVerificationMeta"]')).toHaveText('L2 — Roster Match • Needs refreshing');
    await expect(me).not.toContainText(/\bCurrent\b/);
    await expect(me).not.toContainText(/\bVerified\b|Suspended|assurance-required/i);
  });

  test('routes Play, Privacy, and Verification from meaningful activity rows', async ({ page }) => {
    await page.locator('#meActivity a[href="#play"]').click();
    await expect(page).toHaveURL(/#play$/);
    await expect(page.locator('#view-play')).toBeVisible();
    await expect(page.locator('.nav-item[data-nav="play"]')).toHaveAttribute('aria-current', 'page');

    await page.goto('/#me');
    await page.locator('#meActivity a[href="#privacy"]').click();
    await expect(page).toHaveURL(/#privacy$/);
    await expect(page.locator('#view-privacy')).toBeVisible();
    await expect(page.locator('.nav-item[data-nav="me"]')).toHaveAttribute('aria-current', 'page');

    await page.goto('/#me');
    await page.locator('#meActivity a[href="#verification"]').click();
    await expect(page).toHaveURL(/#verification$/);
    await expect(page.locator('#view-verification')).toBeVisible();
    await expect(page.locator('.nav-item[data-nav="me"]')).toHaveAttribute('aria-current', 'page');
  });

  test('keeps the Me surface within the shell across the responsive matrix', async ({ page }) => {
    for (const viewport of [{ width:320, height:844 }, { width:390, height:844 }, { width:430, height:932 }, { width:768, height:900 }, { width:1280, height:900 }]) {
      await page.setViewportSize(viewport);
      await page.goto('/#me');
      await expect(page.locator('#view-me')).toBeVisible();
      const metrics = await page.locator('#view-me').evaluate(me => {
        const shell = document.querySelector('#shell')?.getBoundingClientRect();
        const rows = [...me.querySelectorAll('.me-activity-row')].map(row => row.getBoundingClientRect().height);
        return { overflow: document.documentElement.scrollWidth > window.innerWidth, shellWidth: shell?.width || 0, rows };
      });
      expect(metrics.overflow).toBe(false);
      expect(metrics.shellWidth).toBeLessThanOrEqual(Math.min(viewport.width, 431) + 1);
      expect(metrics.rows.every(height => height >= 44)).toBe(true);
    }
  });
});
