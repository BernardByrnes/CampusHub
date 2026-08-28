import { expect, test } from '@playwright/test';

const STATE_KEY = 'campushub:state:v3:tenant-makerere:membership-demo-001';

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
  return page.evaluate(key => JSON.parse(localStorage.getItem(key) || 'null'), STATE_KEY);
}

async function readXp(page) {
  return page.evaluate(() => window.CampusHubDebug.getXpTotal());
}

async function setStoredState(page, patch) {
  await page.evaluate(({ key, patch: changes }) => {
    const state = JSON.parse(localStorage.getItem(key) || '{}');
    if(changes.removeStreakState) delete state.streakState;
    if(changes.state) Object.assign(state, changes.state);
    if(changes.streakState) state.streakState = changes.streakState;
    if(changes.membership) state.membership = { ...(state.membership || {}), ...changes.membership };
    localStorage.setItem(key, JSON.stringify(state));
  }, { key: STATE_KEY, patch });
}

async function completeVoiceSubmission(page, title = 'Broken water tap near North Court') {
  await goTo(page, '#voice');
  await page.locator('#voiceListNewBtn').click();
  await page.locator('input[name="voiceCategory"][value="Facilities"]').check();
  await page.locator('#voiceCategoryContinue').click();
  await page.locator('#voiceIssueTitle').fill(title);
  await page.locator('#voiceIssueDescription').fill('The tap near North Court has been broken since Monday.');
  await page.locator('#voiceDetailsContinue').click();
  await expect(page.locator('#voiceStepReview')).toBeVisible();
  await page.locator('#voiceSubmitIssue').click();
  await expect(page.locator('#voiceStepConfirmation')).toBeVisible();
}

async function submitPoll(page) {
  await goTo(page, '#participate');
  await submitPollOnCurrentPage(page);
}

async function submitPollOnCurrentPage(page) {
  await page.locator('#pollForm input[type="radio"]').first().check();
  await page.locator('#submitPoll').click();
  await expect(page.locator('#pollSuccess')).toBeVisible();
}

test.describe('Phase 8C canonical tenant-day streak integration', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'canonical-mobile', 'Detailed streak integration runs once in canonical-mobile.');
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

  test('normalizes the initial state and keeps all streak surfaces at three across reload', async ({ page }) => {
    await resetDemo(page);
    expect((await readState(page)).streakState).toEqual({ count:3, lastQualifiedTenantDay:'2026-05-19' });

    await expect(page.locator('#homePlaySummary')).toContainText('3 day streak');
    await goTo(page, '#play');
    await expect(page.locator('[data-field="streakDuration"]')).toHaveText('3 days');
    await goTo(page, '#me');
    await expect(page.locator('[data-field="meStreak"]')).toHaveText('Streak 3 days');

    await page.reload();
    await expect(page.locator('[data-field="meStreak"]')).toHaveText('Streak 3 days');
    expect((await readState(page)).streakState.count).toBe(3);
  });

  test('qualifies a successful Poll once and persists four across UI and reload', async ({ page }) => {
    await resetDemo(page);
    const startingXp = await readXp(page);
    const pollXp = await page.evaluate(() => Number(window.CampusHubDemo.demoConfig.xp.pollParticipation));
    await submitPoll(page);

    expect((await readState(page)).streakState).toEqual({ count:4, lastQualifiedTenantDay:'2026-05-20' });
    expect(await readXp(page)).toBe(startingXp + pollXp);
    await goTo(page, '#play');
    await expect(page.locator('[data-field="streakDuration"]')).toHaveText('4 days');
    await goTo(page, '#home');
    await expect(page.locator('#homePlaySummary')).toContainText('4 day streak');
    await goTo(page, '#me');
    await expect(page.locator('[data-field="meStreak"]')).toHaveText('Streak 4 days');

    await page.reload();
    await expect(page.locator('[data-field="meStreak"]')).toHaveText('Streak 4 days');
    await goTo(page, '#participate');
    await expect(page.locator('#pollSuccess')).toBeVisible();
    expect((await readState(page)).streakState.count).toBe(4);
  });

  test('qualifies affirmative RSVP but not RSVP clearing', async ({ page }) => {
    await resetDemo(page);
    const startingXp = await page.evaluate(() => window.CampusHubDemo.student.xp);
    await goTo(page, '#events/guild-debate');
    await page.locator('#rsvpGoing').click();
    await expect(page.locator('#rsvpGoing')).toHaveAttribute('aria-pressed', 'true');
    expect((await readState(page)).streakState.count).toBe(4);
    expect(await page.evaluate(() => window.CampusHubDemo.student.xp)).toBe(startingXp);

    await resetDemo(page);
    await setStoredState(page, { state:{ rsvp:'going' } });
    await page.reload();
    await goTo(page, '#events/guild-debate');
    await page.locator('#rsvpGoing').click();
    expect((await readState(page)).rsvp).toBe(null);
    expect((await readState(page)).streakState.count).toBe(3);
  });

  test('qualifies both correct and incorrect Quiz answers independently of XP correctness', async ({ page }) => {
    await resetDemo(page);
    await goTo(page, '#play');
    const correctStartingXp = await readXp(page);
    await page.locator('#quizOptions input[value="0"]').check();
    await page.locator('#quizSubmit').click();
    await expect(page.locator('#quizFeedback')).toContainText('Correct!');
    expect((await readState(page)).streakState.count).toBe(4);
    expect(await readXp(page)).toBe(correctStartingXp + 10);

    await resetDemo(page);
    await goTo(page, '#play');
    const incorrectStartingXp = await readXp(page);
    await page.locator('#quizOptions input[value="1"]').check();
    await page.locator('#quizSubmit').click();
    await expect(page.locator('#quizFeedback')).toContainText('Not quite.');
    expect((await readState(page)).streakState.count).toBe(4);
    expect(await readXp(page)).toBe(incorrectStartingXp + 5);
  });

  test('qualifies final Voice submission silently without publishing or XP', async ({ page }) => {
    await resetDemo(page);
    const startingXp = await readXp(page);
    await completeVoiceSubmission(page);
    const state = await readState(page);
    expect(state.streakState).toEqual({ count:4, lastQualifiedTenantDay:'2026-05-20' });
    expect(state.voiceSubmissions).toHaveLength(1);
    expect(await page.evaluate(() => window.CampusHubDemo.student.xp)).toBe(startingXp);
    await expect(page.locator('#voiceStepConfirmation')).not.toContainText(/XP|streak|day streak|gamification/i);
    await goTo(page, '#voice');
    await expect(page.locator('#voiceAllList')).not.toContainText('Broken water tap near North Court');
  });

  test('increments only once across Poll, RSVP, Quiz, and Voice on one tenant day', async ({ page }) => {
    await resetDemo(page);
    await submitPoll(page);
    expect((await readState(page)).streakState.count).toBe(4);

    await goTo(page, '#events/guild-debate');
    await page.locator('#rsvpGoing').click();
    expect((await readState(page)).rsvp).toBe('going');
    expect((await readState(page)).streakState.count).toBe(4);

    await goTo(page, '#play');
    await page.locator('#quizOptions input[value="1"]').check();
    await page.locator('#quizSubmit').click();
    await expect(page.locator('#quizFeedback')).toContainText('Not quite.');
    expect((await readState(page)).streakState.count).toBe(4);

    await completeVoiceSubmission(page, 'Evening water access remains unreliable');
    expect((await readState(page)).streakState.count).toBe(4);
  });

  test('does not qualify denied Poll, RSVP, Quiz, or Voice final submissions', async ({ page }) => {
    await resetDemo(page, 'assurance-required');
    await goTo(page, '#participate');
    await page.locator('#pollForm input[type="radio"]').first().check();
    await page.locator('#submitPoll').click();
    await expect(page.locator('#participationGate')).toBeVisible();
    expect((await readState(page)).streakState.count).toBe(3);
    await page.locator('#participationGateSecondary').click();

    await resetDemo(page, 'membership-refresh');
    await goTo(page, '#events/guild-debate');
    await page.locator('#rsvpGoing').click();
    await expect(page.locator('#participationGate')).toBeVisible();
    expect((await readState(page)).streakState.count).toBe(3);
    await page.locator('#participationGateSecondary').click();

    await resetDemo(page, 'membership-refresh');
    await goTo(page, '#play');
    await page.locator('#quizOptions input[value="0"]').check();
    await page.locator('#quizSubmit').click();
    await expect(page.locator('#participationGate')).toBeVisible();
    expect((await readState(page)).streakState.count).toBe(3);
    await page.locator('#participationGateSecondary').click();

    await resetDemo(page);
    await goTo(page, '#voice');
    await page.locator('#voiceListNewBtn').click();
    await page.locator('input[name="voiceCategory"][value="Facilities"]').check();
    await page.locator('#voiceCategoryContinue').click();
    await page.locator('#voiceIssueTitle').fill('Denied final submission');
    await page.locator('#voiceIssueDescription').fill('This draft must remain pending when assurance fails.');
    await page.locator('#voiceDetailsContinue').click();
    await setStoredState(page, { membership:{ assuranceLevel:1, status:'active' } });
    await page.locator('#voiceSubmitIssue').click();
    await expect(page.locator('#participationGate')).toBeVisible();
    expect((await readState(page)).streakState.count).toBe(3);
    expect((await readState(page)).voiceSubmissions).toHaveLength(0);
    await expect(page.locator('#voiceStepReview')).toBeVisible();
  });

  test('excludes Voice support and opportunity saves', async ({ page }) => {
    await resetDemo(page);
    await goTo(page, '#voice-detail/voice-water-halls');
    await page.locator('#voiceSupportButton').click();
    await expect(page.locator('#voiceSupportFeedback')).toHaveText('Support recorded.');
    expect((await readState(page)).streakState.count).toBe(3);

    await resetDemo(page);
    await goTo(page, '#opportunities/ra-climate');
    await page.locator('#oppSave').click();
    expect((await readState(page)).streakState.count).toBe(3);

    await resetDemo(page);
    await goTo(page, '#home');
    expect((await readState(page)).streakState.count).toBe(3);
  });

  test('resets to one after a missed active day without loss messaging', async ({ page }) => {
    await resetDemo(page);
    await setStoredState(page, { streakState:{ count:4, lastQualifiedTenantDay:'2026-05-18' } });
    await page.reload();
    await submitPoll(page);
    expect((await readState(page)).streakState).toEqual({ count:1, lastQualifiedTenantDay:'2026-05-20' });
    await expect(page.locator('#toastWrap')).not.toContainText(/lost|missed|reset/i);
  });

  test('pauses during recess while Poll behavior and XP remain normal', async ({ page }) => {
    await resetDemo(page);
    await page.evaluate(() => { window.CampusHubDemo.demoConfig.calendar.isInRecess = true; });
    await page.evaluate(() => { window.location.hash = '#play'; });
    await expect(page.locator('[data-field="streakPauseNote"]')).toHaveText('Your streak is paused for the recess.');
    const startingXp = await readXp(page);
    await page.evaluate(() => { window.location.hash = '#participate'; });
    await submitPollOnCurrentPage(page);
    const state = await readState(page);
    expect(state.streakState).toEqual({ count:3, lastQualifiedTenantDay:'2026-05-19' });
    expect(await readXp(page)).toBe(startingXp + 5);

    await page.evaluate(() => { window.CampusHubDemo.demoConfig.calendar.isInRecess = false; });
    await goTo(page, '#play');
    await expect(page.locator('[data-field="streakPauseNote"]')).toHaveText('Your streak pauses automatically during university recess.');
  });

  test('continues from the prior active day after recess and protects fixture coherence', async ({ page }) => {
    const facts = await page.evaluate(() => ({
      current: window.CampusHubDemo.demoConfig.calendar.currentTenantDay,
      quizDay: window.CampusHubDemo.quiz.tenantDay,
      previous: window.CampusHubDemo.demoConfig.calendar.previousActiveTenantDay
    }));
    expect(facts.current).toBe('2026-05-20');
    expect(facts.quizDay).toBe(facts.current);
    expect(facts.previous).toBe('2026-05-19');

    await resetDemo(page);
    await setStoredState(page, { streakState:{ count:5, lastQualifiedTenantDay:'2026-05-29' } });
    await page.evaluate(() => {
      window.CampusHubDemo.demoConfig.calendar.currentTenantDay = '2026-06-08';
      window.CampusHubDemo.demoConfig.calendar.previousActiveTenantDay = '2026-05-29';
      window.CampusHubDemo.demoConfig.calendar.isInRecess = false;
      window.CampusHubDemo.quiz.tenantDay = '2026-06-08';
    });
    await page.evaluate(() => { window.location.hash = '#participate'; });
    await submitPollOnCurrentPage(page);
    expect((await readState(page)).streakState).toEqual({ count:6, lastQualifiedTenantDay:'2026-06-08' });
  });

  test('migrates pre-8B state without losing existing participation fields', async ({ page }) => {
    await resetDemo(page);
    await setStoredState(page, {
      removeStreakState:true,
      state:{ pollDone:true, pollChoice:1 },
      membership:{ assuranceLevel:2, status:'active' }
    });
    await page.reload();
    const state = await readState(page);
    expect(state.streakState).toEqual({ count:3, lastQualifiedTenantDay:'2026-05-19' });
    expect(await readXp(page)).toBe(340);
    expect(state.membership).toEqual({ assuranceLevel:2, status:'active' });
    expect(state.pollDone).toBe(true);
    expect(state.pollChoice).toBe(1);
  });
});
