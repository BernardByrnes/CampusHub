import { expect, test } from '@playwright/test';

const PARTICIPATION_STATE_KEY = 'campushub:state';

async function goTo(page, hash) {
  await page.goto(`/${hash}`);
}

async function resetDemo(page, scenario = null) {
  await page.evaluate(nextScenario => {
    window.CampusHubDebug.resetDemo();
    if(nextScenario) window.CampusHubDebug.setScenario(nextScenario);
  }, scenario);
}

async function readState(page) {
  return page.evaluate(key => JSON.parse(localStorage.getItem(key) || 'null'), PARTICIPATION_STATE_KEY);
}

async function expectGateDecision(page, expected) {
  await expect(page.locator('#participationGate')).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.CampusHubDebug.getLastGateDecision())).toEqual({
    allowed: false,
    reason: expected
  });
}

async function expectNoHorizontalOverflow(page) {
  const fits = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
  expect(fits).toBe(true);
}

test.describe('Phase 6C RSVP and Daily Quiz GSC-14 integration', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'canonical-mobile', 'Detailed RSVP and Quiz integration runs once in canonical-mobile.');

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
  });

  test('allows mutually exclusive RSVP changes with zero XP', async ({ page }) => {
    await resetDemo(page);
    await goTo(page, '#events/guild-debate');
    const startingXp = await page.evaluate(() => window.CampusHubDemo.student.xp);

    await page.locator('#rsvpGoing').click();
    await expect(page.locator('#rsvpGoing')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('#rsvpInterested')).toHaveAttribute('aria-pressed', 'false');
    await expect(page.locator('#rsvpGoing')).toHaveText('Going ✓');
    await expect(page.locator('.toast').last()).toContainText("You're on the list.");
    expect((await readState(page)).rsvp).toBe('going');
    expect(await page.evaluate(() => window.CampusHubDemo.student.xp)).toBe(startingXp);

    await page.locator('#rsvpInterested').click();
    await expect(page.locator('#rsvpGoing')).toHaveAttribute('aria-pressed', 'false');
    await expect(page.locator('#rsvpInterested')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('.toast').last()).toContainText('Marked as interested.');
    expect((await readState(page)).rsvp).toBe('interested');
    expect(await page.evaluate(() => window.CampusHubDemo.student.xp)).toBe(startingXp);

    await page.locator('#rsvpInterested').click();
    await expect(page.locator('#rsvpGoing')).toHaveAttribute('aria-pressed', 'false');
    await expect(page.locator('#rsvpInterested')).toHaveAttribute('aria-pressed', 'false');
    expect((await readState(page)).rsvp).toBe(null);
    expect(await page.evaluate(() => window.CampusHubDemo.student.xp)).toBe(startingXp);
  });

  test('gates RSVP on membership refresh without changing RSVP or XP', async ({ page }) => {
    await resetDemo(page, 'membership-refresh');
    await goTo(page, '#events/guild-debate');
    const startingXp = await page.evaluate(() => window.CampusHubDemo.student.xp);

    await page.locator('#rsvpGoing').click();
    await expectGateDecision(page, {
      step:'membership-state',
      variant:'membership-refresh',
      resourceContext:'rsvp'
    });
    expect((await readState(page)).rsvp).toBe(null);
    expect(await page.evaluate(() => window.CampusHubDemo.student.xp)).toBe(startingXp);
  });

  test('returns the first canonical RSVP failure when several facts fail', async ({ page }) => {
    await resetDemo(page);
    await page.evaluate(key => {
      const state = JSON.parse(localStorage.getItem(key));
      state.membership.status = 'refresh';
      state.participation.tenantLifecycle = 'inactive';
      state.participation.rsvpModuleEnabled = false;
      state.participation.rsvpAudienceEligible = false;
      localStorage.setItem(key, JSON.stringify(state));
    }, PARTICIPATION_STATE_KEY);
    await page.reload();
    await goTo(page, '#events/guild-debate');
    await page.locator('#rsvpGoing').click();

    await expectGateDecision(page, {
      step:'tenant-lifecycle',
      variant:'tenant-inactive',
      resourceContext:'rsvp'
    });
    expect((await readState(page)).rsvp).toBe(null);
  });

  test('keeps RSVP and Daily Quiz available when Voice is disabled', async ({ page }) => {
    await resetDemo(page, 'voice-disabled');
    await goTo(page, '#events/guild-debate');
    await page.locator('#rsvpGoing').click();
    await expect(page.locator('#rsvpGoing')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('#participationGate')).toBeHidden();

    await goTo(page, '#play');
    await page.locator('#quizOptions input[value="1"]').check();
    await page.locator('#quizSubmit').click();
    await expect(page.locator('#quizFeedback')).toBeVisible();
    await expect(page.locator('#participationGate')).toBeHidden();
    expect((await readState(page)).quizParticipation.quizId).toBe('daily-quiz-2026-05-20');
  });

  test('does not inherit Poll audience denial for RSVP or Daily Quiz', async ({ page }) => {
    await resetDemo(page, 'audience-ineligible');
    await goTo(page, '#events/guild-debate');
    await page.locator('#rsvpGoing').click();
    await expect(page.locator('#rsvpGoing')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('#participationGate')).toBeHidden();

    await goTo(page, '#play');
    await page.locator('#quizOptions input[value="0"]').check();
    await page.locator('#quizSubmit').click();
    await expect(page.locator('#quizFeedback')).toContainText('Correct!');
    await expect(page.locator('#participationGate')).toBeHidden();
  });

  test('honors the configured L0 baseline instead of imposing an L2 requirement', async ({ page }) => {
    await resetDemo(page);
    await page.evaluate(key => {
      const state = JSON.parse(localStorage.getItem(key));
      state.membership.assuranceLevel = 0;
      localStorage.setItem(key, JSON.stringify(state));
    }, PARTICIPATION_STATE_KEY);
    await page.reload();

    await goTo(page, '#events/guild-debate');
    await page.locator('#rsvpGoing').click();
    await expect(page.locator('#rsvpGoing')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('#participationGate')).toBeHidden();

    await goTo(page, '#play');
    await page.locator('#quizOptions input[value="1"]').check();
    await page.locator('#quizSubmit').click();
    await expect(page.locator('#quizFeedback')).toContainText('Not quite.');
    await expect(page.locator('#participationGate')).toBeHidden();
  });

  test('awards correct-answer Quiz XP once and persists completion across reload', async ({ page }) => {
    await resetDemo(page);
    await goTo(page, '#play');
    const startingXp = await page.evaluate(() => window.CampusHubDemo.student.xp);

    await page.locator('#quizOptions input[value="0"]').check();
    await page.locator('#quizSubmit').click();
    await expect(page.locator('#quizFeedback')).toContainText('Correct!');
    await expect(page.locator('#quizCompleteNote')).toContainText('quiz is complete');
    await expect(page.locator('#quizSubmit')).toBeHidden();
    expect(await page.evaluate(() => window.CampusHubDemo.student.xp)).toBe(startingXp + 10);
    expect(await readState(page)).toMatchObject({
      quizDone:true,
      quizChoice:0,
      quizParticipation:{
        quizId:'daily-quiz-2026-05-20',
        tenantDay:'2026-05-20',
        optionIndex:0,
        xpAwarded:10
      }
    });

    await page.reload();
    await expect(page.locator('#quizFeedback')).toContainText('Correct!');
    await expect(page.locator('#quizCompleteNote')).toContainText('quiz is complete');
    await expect(page.locator('#quizSubmit')).toBeHidden();
    expect(await page.evaluate(() => window.CampusHubDemo.student.xp)).toBe(startingXp + 10);
  });

  test('awards only participation XP for an incorrect Quiz answer and reveals the answer after submit', async ({ page }) => {
    await resetDemo(page);
    await goTo(page, '#play');
    const startingXp = await page.evaluate(() => window.CampusHubDemo.student.xp);

    await page.locator('#quizOptions input[value="1"]').check();
    await page.locator('#quizSubmit').click();
    await expect(page.locator('#quizFeedback')).toContainText('Not quite.');
    await expect(page.locator('#quizFeedback')).toContainText('Correct answer: Lake Victoria.');
    await expect(page.locator('#quizCompleteNote')).toContainText('quiz is complete');
    await expect(page.locator('#quizSubmit')).toBeHidden();
    expect(await page.evaluate(() => window.CampusHubDemo.student.xp)).toBe(startingXp + 5);
    expect((await readState(page)).quizParticipation.xpAwarded).toBe(5);
  });

  test('gates Daily Quiz on membership without grading, recording, or awarding XP', async ({ page }) => {
    await resetDemo(page, 'membership-refresh');
    await goTo(page, '#play');
    const startingXp = await page.evaluate(() => window.CampusHubDemo.student.xp);

    await page.locator('#quizOptions input[value="0"]').check();
    await page.locator('#quizSubmit').click();
    await expectGateDecision(page, {
      step:'membership-state',
      variant:'membership-refresh',
      resourceContext:'daily-quiz'
    });
    await expect(page.locator('#quizFeedback')).toBeHidden();
    await expect(page.locator('#quizSubmit')).toBeVisible();
    const state = await readState(page);
    expect(state.quizDone).toBe(false);
    expect(state.quizChoice).toBe(null);
    expect(state.quizParticipation).toBe(null);
    expect(await page.evaluate(() => window.CampusHubDemo.student.xp)).toBe(startingXp);
  });

  test('uses tenant-day identity so stale completion does not block the current Quiz', async ({ page }) => {
    await resetDemo(page);
    await page.evaluate(key => {
      const state = JSON.parse(localStorage.getItem(key));
      state.quizDone = true;
      state.quizChoice = 0;
      state.quizParticipation = {
        quizId:'daily-quiz-2026-05-19',
        tenantDay:'2026-05-19',
        optionIndex:0,
        xpAwarded:10
      };
      localStorage.setItem(key, JSON.stringify(state));
    }, PARTICIPATION_STATE_KEY);
    await page.reload();
    await goTo(page, '#play');
    await expect(page.locator('#quizSubmit')).toBeVisible();
    await expect(page.locator('#quizFeedback')).toBeHidden();

    await page.locator('#quizOptions input[value="1"]').check();
    await page.locator('#quizSubmit').click();
    await expect(page.locator('#quizFeedback')).toContainText('Not quite.');
    const state = await readState(page);
    expect(state.quizParticipation).toMatchObject({
      quizId:'daily-quiz-2026-05-20',
      tenantDay:'2026-05-20',
      optionIndex:1,
      xpAwarded:5
    });
  });

  test('prevents a second same-tenant-day Quiz award after navigation and a stale action', async ({ page }) => {
    await resetDemo(page);
    await goTo(page, '#play');
    await page.locator('#quizOptions input[value="0"]').check();
    await page.locator('#quizSubmit').click();
    await expect(page.locator('#quizFeedback')).toContainText('Correct!');
    const completedXp = await page.evaluate(() => window.CampusHubDemo.student.xp);
    const completedState = await readState(page);

    await goTo(page, '#home');
    await goTo(page, '#play');
    await page.locator('#quizSubmit').evaluate(button => button.click());
    await expectGateDecision(page, {
      step:'story-prerequisites',
      variant:'prerequisites-unmet',
      resourceContext:'daily-quiz'
    });
    expect(await page.evaluate(() => window.CampusHubDemo.student.xp)).toBe(completedXp);
    expect(await readState(page)).toMatchObject({
      quizParticipation:completedState.quizParticipation,
      xp:completedState.xp
    });
  });

  test('keeps Event Detail and Play usable without horizontal overflow at all focused widths', async ({ page }) => {
    await resetDemo(page);
    for (const viewport of [
      { width:320, height:844 },
      { width:390, height:844 },
      { width:430, height:932 },
      { width:1280, height:900 }
    ]) {
      await page.setViewportSize(viewport);
      await goTo(page, '#events/guild-debate');
      await expect(page.locator('#rsvpGoing')).toBeVisible();
      await expect(page.locator('#rsvpInterested')).toBeVisible();
      await expectNoHorizontalOverflow(page);

      await goTo(page, '#play');
      await expect(page.locator('#quizOptions input[type="radio"]').first()).toBeVisible();
      await expect(page.locator('#quizSubmit')).toBeVisible();
      await expectNoHorizontalOverflow(page);
    }
  });
});
