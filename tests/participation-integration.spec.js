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

async function readDecision(page) {
  return page.evaluate(() => window.CampusHubDebug.getLastGateDecision());
}

async function expectGateDecision(page, expected) {
  await expect(page.locator('#participationGate')).toBeVisible();
  await expect.poll(() => readDecision(page)).toEqual({
    allowed: false,
    reason: expected
  });
}

async function expectNoHorizontalOverflow(page) {
  const fits = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
  expect(fits).toBe(true);
}

test.describe('Phase 6B Poll and Student Voice GSC-14 integration', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'canonical-mobile', 'Detailed participation integration runs once in canonical-mobile.');

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

  test('allows an L2 Poll response, awards configured XP once, and persists completion state', async ({ page }) => {
    await resetDemo(page);
    await goTo(page, '#participate');

    const startingXp = await page.evaluate(() => window.CampusHubDemo.student.xp);
    const pollXp = await page.evaluate(() => Number(window.CampusHubDemo.demoConfig.xp.pollParticipation));
    const option = page.locator('#pollForm input[type="radio"]').first();
    await option.check();
    await expect(page.locator('#participationGate')).toBeHidden();

    await page.locator('#submitPoll').click();
    await expect(page.locator('#pollSuccess')).toBeVisible();
    await expect(page.locator('#pollSuccess')).toContainText('Response recorded.');
    await expect(page.locator('#submitPoll')).toBeDisabled();
    await expect(page.locator('#view-participate')).not.toContainText('%');

    const afterXp = await page.evaluate(() => window.CampusHubDemo.student.xp);
    expect(afterXp).toBe(startingXp + pollXp);
    const completedState = await readState(page);
    expect(completedState.pollDone).toBe(true);
    expect(completedState.pollChoice).toBe(0);

    await page.reload();
    await expect(page.locator('#pollSuccess')).toBeVisible();
    await expect(page.locator('#submitPoll')).toBeDisabled();
    const xpAtReload = await page.evaluate(() => window.CampusHubDemo.student.xp);
    await page.locator('#submitPoll').click({ force:true });
    await page.waitForTimeout(100);
    expect(await page.evaluate(() => window.CampusHubDemo.student.xp)).toBe(xpAtReload);
    expect((await readState(page)).pollDone).toBe(true);
  });

  test('lets an L1 student select a Poll option but gates only on Submit response', async ({ page }) => {
    await resetDemo(page, 'assurance-required');
    await goTo(page, '#participate');
    const startingXp = await page.evaluate(() => window.CampusHubDemo.student.xp);

    const option = page.locator('#pollForm input[type="radio"]').first();
    await option.check();
    await expect(option).toBeChecked();
    await expect(page.locator('#participationGate')).toBeHidden();

    await page.locator('#submitPoll').click();
    await expectGateDecision(page, {
      step:'assurance',
      variant:'assurance-required',
      resourceContext:'poll'
    });
    await expect(page.locator('#pollSuccess')).toBeHidden();
    const state = await readState(page);
    expect(state.pollDone).toBe(false);
    expect(state.pollChoice).toBe(null);
    expect(await page.evaluate(() => window.CampusHubDemo.student.xp)).toBe(startingXp);
  });

  test('uses the canonical poll-closed decision without mutating Poll state', async ({ page }) => {
    await resetDemo(page, 'poll-closed');
    await goTo(page, '#participate');
    await page.locator('#pollForm input[type="radio"]').first().check();
    const startingXp = await page.evaluate(() => window.CampusHubDemo.student.xp);

    await page.locator('#submitPoll').click();
    await expectGateDecision(page, {
      step:'resource-actionable',
      variant:'poll-closed',
      resourceContext:'poll'
    });
    expect((await readState(page)).pollDone).toBe(false);
    expect(await page.evaluate(() => window.CampusHubDemo.student.xp)).toBe(startingXp);
  });

  test('uses the canonical audience denial for an ineligible Poll audience', async ({ page }) => {
    await resetDemo(page, 'audience-ineligible');
    await goTo(page, '#participate');
    await page.locator('#pollForm input[type="radio"]').first().check();

    await page.locator('#submitPoll').click();
    await expectGateDecision(page, {
      step:'audience',
      variant:'audience-ineligible',
      resourceContext:'poll'
    });
    expect((await readState(page)).pollDone).toBe(false);
  });

  test('keeps Poll usable when the Student Voice module is disabled', async ({ page }) => {
    await resetDemo(page, 'voice-disabled');
    await goTo(page, '#voice');
    await page.locator('#voiceListNewBtn').click();
    await expectGateDecision(page, {
      step:'module-enabled',
      variant:'module-unavailable',
      resourceContext:'voice-submission'
    });
    await page.locator('#participationGatePrimary').click();
    await expect(page.locator('#participationGate')).toBeHidden();

    await goTo(page, '#participate');
    await page.locator('#pollForm input[type="radio"]').first().check();
    await page.locator('#submitPoll').click();
    await expect(page.locator('#pollSuccess')).toBeVisible();
    expect((await readState(page)).pollDone).toBe(true);
  });

  test('gates L1 Voice composer entry with voice-submission context and no draft mutation', async ({ page }) => {
    await resetDemo(page, 'assurance-required');
    await goTo(page, '#voice');
    const before = await readState(page);

    await page.locator('#voiceListNewBtn').click();
    await expectGateDecision(page, {
      step:'assurance',
      variant:'assurance-required',
      resourceContext:'voice-submission'
    });
    await expect(page.locator('#view-voice')).toBeVisible();
    await expect(page.locator('#view-voice-new')).toBeHidden();
    const after = await readState(page);
    expect(after.voiceDraft).toEqual(before.voiceDraft);
    expect(after.voiceSubmissions).toEqual(before.voiceSubmissions);
  });

  test('gates a direct #voice-new route through the same canonical decision', async ({ page }) => {
    await resetDemo(page, 'assurance-required');
    await goTo(page, '#voice-new');

    await expectGateDecision(page, {
      step:'assurance',
      variant:'assurance-required',
      resourceContext:'voice-submission'
    });
    await expect(page.locator('#view-voice-new')).toBeHidden();
    expect(new URL(page.url()).hash).toBe('#participate');
  });

  test('re-checks Voice eligibility at final Submit issue and preserves the Review draft', async ({ page }) => {
    await resetDemo(page);
    await goTo(page, '#voice');
    await page.locator('#voiceListNewBtn').click();
    await expect(page.locator('#view-voice-new')).toBeVisible();

    await page.locator('input[name="voiceCategory"][value="Water & Sanitation"]').check();
    await page.locator('#voiceCategoryContinue').click();
    await page.locator('#voiceIssueTitle').fill('Water supply interruptions in Lumumba Hall');
    await page.locator('#voiceIssueDescription').fill('Water is frequently unavailable during the evening in Lumumba Hall.');
    await page.locator('#voiceDetailsContinue').click();
    await expect(page.locator('#voiceStepReview')).toBeVisible();

    await page.evaluate(key => {
      const state = JSON.parse(localStorage.getItem(key));
      state.membership.assuranceLevel = 1;
      state.membership.status = 'active';
      localStorage.setItem(key, JSON.stringify(state));
    }, PARTICIPATION_STATE_KEY);

    await page.locator('#voiceSubmitIssue').click();
    await expectGateDecision(page, {
      step:'assurance',
      variant:'assurance-required',
      resourceContext:'voice-submission'
    });
    await expect(page.locator('#view-voice-new')).toBeVisible();
    await expect(page.locator('#voiceStepReview')).toBeVisible();
    const state = await readState(page);
    expect(state.voiceSubmissions).toHaveLength(0);
    expect(state.voiceDraft).toMatchObject({
      category:'Water & Sanitation',
      title:'Water supply interruptions in Lumumba Hall',
      description:'Water is frequently unavailable during the evening in Lumumba Hall.',
      step:3
    });
  });

  test('allows Voice submission internally without publishing or awarding XP', async ({ page }) => {
    await resetDemo(page);
    await goTo(page, '#voice');
    await page.locator('#voiceListNewBtn').click();
    const startingXp = await page.evaluate(() => window.CampusHubDemo.student.xp);
    const title = 'Broken water tap near North Court';

    await page.locator('input[name="voiceCategory"][value="Facilities"]').check();
    await page.locator('#voiceCategoryContinue').click();
    await page.locator('#voiceIssueTitle').fill(title);
    await page.locator('#voiceIssueDescription').fill('The tap near North Court has been broken since Monday.');
    await page.locator('#voiceDetailsContinue').click();
    await page.locator('#voiceSubmitIssue').click();
    await expect(page.locator('#voiceStepConfirmation')).toBeVisible();
    await expect(page.locator('#voiceStepConfirmation')).toContainText('Your issue has been submitted for review.');

    const state = await readState(page);
    expect(state.voiceSubmissions).toHaveLength(1);
    expect(state.voiceSubmissions[0].title).toBe(title);
    expect(await page.evaluate(() => window.CampusHubDemo.student.xp)).toBe(startingXp);

    await goTo(page, '#voice');
    await expect(page.locator('#voiceAllList .voice-issue-card')).toHaveCount(3);
    await expect(page.locator('#voiceAllList')).not.toContainText(title);
    await expect(page.locator('#voiceAllList a[href*="voice-local-"]')).toHaveCount(0);
  });

  test('supports a published Voice issue exactly once without XP', async ({ page }) => {
    await resetDemo(page);
    await goTo(page, '#voice-detail/voice-water-halls');
    const startingCount = Number(await page.locator('#voiceDetailSupporterCount').textContent());
    const startingXp = await page.evaluate(() => window.CampusHubDemo.student.xp);

    await page.locator('#voiceSupportButton').click();
    await expect(page.locator('#voiceSupportButton')).toHaveText('Supported ✓');
    await expect(page.locator('#voiceSupportFeedback')).toHaveText('Support recorded.');
    await expect(page.locator('#voiceDetailSupporterCount')).toHaveText(String(startingCount + 1));
    await expect(page.locator('.toast').last()).toContainText('Support recorded.');
    expect(await page.evaluate(() => window.CampusHubDemo.student.xp)).toBe(startingXp);
    expect((await readState(page)).supportedVoiceIssues).toContain('voice-water-halls');

    await page.reload();
    await expect(page.locator('#voiceDetailSupporterCount')).toHaveText(String(startingCount + 1));
    await expect(page.locator('#voiceSupportButton')).toHaveText('Supported ✓');
  });

  test('gates L1 Voice support without changing support state or XP', async ({ page }) => {
    await resetDemo(page, 'assurance-required');
    await goTo(page, '#voice-detail/voice-water-halls');
    const startingCount = Number(await page.locator('#voiceDetailSupporterCount').textContent());
    const startingXp = await page.evaluate(() => window.CampusHubDemo.student.xp);

    await page.locator('#voiceSupportButton').click();
    await expectGateDecision(page, {
      step:'assurance',
      variant:'assurance-required',
      resourceContext:'voice-support'
    });
    await expect(page.locator('#voiceDetailSupporterCount')).toHaveText(String(startingCount));
    expect((await readState(page)).supportedVoiceIssues).not.toContain('voice-water-halls');
    expect(await page.evaluate(() => window.CampusHubDemo.student.xp)).toBe(startingXp);
  });

  test('keeps Poll and Voice surfaces usable without horizontal overflow at the focused widths', async ({ page }) => {
    await resetDemo(page);
    for (const viewport of [
      { width:320, height:844 },
      { width:390, height:844 },
      { width:430, height:932 },
      { width:1280, height:900 }
    ]) {
      await page.setViewportSize(viewport);
      for (const hash of ['#participate', '#voice', '#voice-new', '#voice-detail/voice-water-halls']) {
        await goTo(page, hash);
        await expectNoHorizontalOverflow(page);
      }
    }
  });
});
