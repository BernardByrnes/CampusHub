import { expect, test } from '@playwright/test';

const STATE_KEY = 'campushub:state:v3:tenant-makerere:membership-demo-001';
const DRAFT_KEY = 'campushub:voice-draft:v3:tenant-makerere:membership-demo-001';
const CATEGORIES = [
  'Wi-Fi',
  'Water & Sanitation',
  'Facilities',
  'Lighting',
  'Library',
  'Transport',
  'Academic Facilities',
  'Campus Services'
];

async function resetDemo(page, scenario = null) {
  await page.evaluate(nextScenario => {
    window.CampusHubDebug.resetDemo();
    if(nextScenario) window.CampusHubDebug.setScenario(nextScenario);
  }, scenario);
}

async function openComposer(page) {
  await page.goto('/#voice');
  await page.locator('#voiceListNewBtn').click();
  await expect(page.locator('#voiceStepCategory')).toBeVisible();
}

async function reachDetails(page, values = {}) {
  await openComposer(page);
  await page.locator('input[name="voiceCategory"]').first().check();
  await page.locator('#voiceCategoryContinue').click();
  await expect(page.locator('#voiceStepDetails')).toBeVisible();
  if(values.title !== undefined) await page.locator('#voiceIssueTitle').fill(values.title);
  if(values.description !== undefined) await page.locator('#voiceIssueDescription').fill(values.description);
}

async function reachReview(page, values = {
  title: 'Irregular water supply in Halls',
  description: 'Water is unavailable most evenings and affects students using the residence facilities.'
}) {
  await reachDetails(page, values);
  await page.locator('#voiceDetailsContinue').click();
  await expect(page.locator('#voiceStepReview')).toBeVisible();
}

async function readDurableState(page) {
  return page.evaluate(key => JSON.parse(localStorage.getItem(key) || 'null'), STATE_KEY);
}

async function readSessionDraft(page) {
  return page.evaluate(key => JSON.parse(sessionStorage.getItem(key) || 'null'), DRAFT_KEY);
}

async function expectNoHorizontalOverflow(page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
}

test.describe('Phase 8D frozen Student Voice composer contract', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'canonical-mobile', 'Detailed composer contract runs once in canonical-mobile.');
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
    await page.goto('/#home');
    await resetDemo(page);
  });

  test('keeps the exact eight categories, no Other, and no Category Back control', async ({ page }) => {
    await openComposer(page);
    expect(await page.locator('input[name="voiceCategory"]').evaluateAll(inputs => inputs.map(input => input.value))).toEqual(CATEGORIES);
    await expect(page.locator('#voiceStepCategory')).not.toContainText('Other');
    await expect(page.locator('#voiceCategoryHelp')).toHaveText('Choose the campus issue category that fits best.');
    expect(await page.locator('#voiceStepCategory button').filter({ hasText: 'Back' }).count()).toBe(0);
    await expect(page.locator('#voiceCategoryCancel')).toHaveText('Cancel');
    await expect(page.locator('#voiceCategoryContinue')).toBeDisabled();
    await page.locator('#voiceCategoryContinue').evaluate(button => { button.disabled = false; button.click(); });
    await expect(page.locator('#voiceCategoryError')).toHaveText('Choose a category.');
    await page.locator('#voiceCategoryCancel').click();
    await expect(page.locator('#view-voice')).toBeVisible();
    expect(await readSessionDraft(page)).toBeNull();
  });

  test('uses canonical limits, placeholders, counters, guidance, and live updates', async ({ page }) => {
    await reachDetails(page);
    await expect(page.locator('#voiceIssueTitle')).toHaveAttribute('maxlength', '80');
    await expect(page.locator('#voiceIssueDescription')).toHaveAttribute('maxlength', '500');
    await expect(page.locator('#voiceIssueTitle')).toHaveAttribute('placeholder', 'e.g. Irregular water supply in Halls');
    await expect(page.locator('#voiceIssueDescription')).toHaveAttribute('placeholder', 'What is happening, and how does it affect students?');
    await expect(page.locator('#voiceIssueTitleCount')).toHaveText('0 / 80');
    await expect(page.locator('#voiceIssueDescriptionCount')).toHaveText('0 / 500');
    await expect(page.locator('#voiceStepDetails')).toContainText("Do not include other people's names or personal details.");
    await page.locator('#voiceIssueTitle').fill('Water disruption');
    await page.locator('#voiceIssueDescription').fill('A'.repeat(284));
    await expect(page.locator('#voiceIssueTitleCount')).toHaveText('16 / 80');
    await expect(page.locator('#voiceIssueDescriptionCount')).toHaveText('284 / 500');
    await expect(page.locator('#voiceIssueTitle')).toHaveAttribute('aria-describedby', 'voiceIssueTitleHelp voiceIssueTitleCount voiceTitleError');
    await expect(page.locator('#voiceIssueDescription')).toHaveAttribute('aria-describedby', 'voiceIssueDescriptionHelp voiceIssueDescriptionCount voiceDescriptionError');
    await page.locator('#voiceIssueTitle').evaluate(input => { input.value = 'X'.repeat(120); input.dispatchEvent(new Event('input', { bubbles:true })); });
    await page.locator('#voiceIssueDescription').evaluate(input => { input.value = 'Y'.repeat(700); input.dispatchEvent(new Event('input', { bubbles:true })); });
    await expect(page.locator('#voiceIssueTitleCount')).toHaveText('80 / 80');
    await expect(page.locator('#voiceIssueDescriptionCount')).toHaveText('500 / 500');
  });

  test('rejects empty and whitespace-only details with calm validation', async ({ page }) => {
    await reachDetails(page);
    await page.locator('#voiceDetailsContinue').click();
    await expect(page.locator('#voiceDetailsError')).toHaveText('Add a title and a description.');
    await page.locator('#voiceIssueTitle').fill('   ');
    await page.locator('#voiceIssueDescription').fill('\n  ');
    await page.locator('#voiceDetailsContinue').click();
    await expect(page.locator('#voiceDetailsError')).toHaveText('Add a title and a description.');
    await expect(page.locator('#voiceStepDetails')).toBeVisible();
  });

  test('Details Back preserves category, title, description, and counters', async ({ page }) => {
    await reachDetails(page, {
      title: 'Water disruption',
      description: 'A'.repeat(284)
    });
    await page.locator('#voiceDetailsBack').click();
    await expect(page.locator('#voiceStepCategory')).toBeVisible();
    await expect(page.locator('input[name="voiceCategory"]').first()).toBeChecked();
    await page.locator('#voiceCategoryContinue').click();
    await expect(page.locator('#voiceIssueTitle')).toHaveValue('Water disruption');
    await expect(page.locator('#voiceIssueDescription')).toHaveValue('A'.repeat(284));
    await expect(page.locator('#voiceIssueTitleCount')).toHaveText('16 / 80');
    await expect(page.locator('#voiceIssueDescriptionCount')).toHaveText('284 / 500');
  });

  test('same-tab reload restores the session draft and counters', async ({ page }) => {
    await reachDetails(page, {
      title: 'Water disruption',
      description: 'A'.repeat(284)
    });
    await page.reload();
    await expect(page.locator('#voiceStepDetails')).toBeVisible();
    await expect(page.locator('#voiceIssueTitle')).toHaveValue('Water disruption');
    await expect(page.locator('#voiceIssueDescription')).toHaveValue('A'.repeat(284));
    await expect(page.locator('#voiceIssueTitleCount')).toHaveText('16 / 80');
    await expect(page.locator('#voiceIssueDescriptionCount')).toHaveText('284 / 500');
    expect((await readDurableState(page)).voiceDraft).toBeUndefined();
    expect(await readSessionDraft(page)).toMatchObject({ category:'Wi-Fi', step:2 });
  });

  test('legacy durable drafts migrate once, clamp safely, and preserve other state', async ({ page }) => {
    await page.evaluate(key => {
      const state = JSON.parse(localStorage.getItem(key));
      state.voiceDraft = {
        category:'Facilities',
        title:'T'.repeat(120),
        description:'D'.repeat(1000),
        step:9
      };
      state.pollDone = true;
      localStorage.setItem(key, JSON.stringify(state));
      sessionStorage.removeItem('campushub:voice-draft:v3:tenant-makerere:membership-demo-001');
    }, STATE_KEY);
    await page.reload();
    const draft = await readSessionDraft(page);
    expect(draft.category).toBe('Facilities');
    expect(draft.title).toHaveLength(80);
    expect(draft.description).toHaveLength(500);
    expect(draft.step).toBe(1);
    const state = await readDurableState(page);
    expect(state.voiceDraft).toBeUndefined();
    expect(state.xpEvents).toHaveLength(1);
    expect(state.xpEvents[0].amount).toBe(340);
    expect(state.pollDone).toBe(true);
  });

  test('Cancel clears the draft from Details and returns to Student Voice', async ({ page }) => {
    await reachDetails(page, { title:'Water disruption', description:'A short description.' });
    await page.locator('#voiceDetailsCancel').click();
    await expect(page.locator('#view-voice')).toBeVisible();
    expect(await readSessionDraft(page)).toBeNull();
    await openComposer(page);
    await expect(page.locator('#voiceStepCategory')).toBeVisible();
    await expect(page.locator('input[name="voiceCategory"]:checked')).toHaveCount(0);
    await expect(page.locator('#voiceStepDetails')).toBeHidden();
  });

  test('Review shows exact disclosure, publication boundary, and Cancel/Back actions', async ({ page }) => {
    await reachReview(page);
    const disclosure = 'Other students will not see who submitted this issue. Your identity may be accessed only by authorised identity handlers when required for moderation, safety or accountability, and that access is recorded.';
    await expect(page.locator('#voiceStepReview .voice-identity-disclosure')).toContainText(disclosure);
    await expect(page.locator('#voiceStepReview')).toContainText('Submission is not publication.');
    await expect(page.locator('#voiceStepReview')).not.toContainText('authorised CampusHub identity handlers');
    await expect(page.locator('#voiceStepReview')).not.toContainText('Submit anonymously');
    await expect(page.locator('#voiceStepReview')).not.toContainText('Post publicly');
    await expect(page.locator('#voiceReviewCancel')).toHaveText('Cancel');
    await expect(page.locator('#voiceReviewBack')).toHaveText('Back');
    await expect(page.locator('#voiceSubmitIssue')).toHaveText('Submit issue');
  });

  test('Review Back preserves the complete draft and counters', async ({ page }) => {
    await reachReview(page, { title:'Water disruption', description:'A'.repeat(284) });
    await page.locator('#voiceReviewBack').click();
    await expect(page.locator('#voiceStepDetails')).toBeVisible();
    await expect(page.locator('#voiceIssueTitle')).toHaveValue('Water disruption');
    await expect(page.locator('#voiceIssueDescription')).toHaveValue('A'.repeat(284));
    await expect(page.locator('#voiceIssueTitleCount')).toHaveText('16 / 80');
    await expect(page.locator('#voiceIssueDescriptionCount')).toHaveText('284 / 500');
  });

  test('Review Cancel clears the draft and returns to a fresh Category step', async ({ page }) => {
    await reachReview(page);
    await page.locator('#voiceReviewCancel').click();
    await expect(page.locator('#view-voice')).toBeVisible();
    expect(await readSessionDraft(page)).toBeNull();
    await openComposer(page);
    await expect(page.locator('#voiceStepCategory')).toBeVisible();
    await expect(page.locator('input[name="voiceCategory"]:checked')).toHaveCount(0);
  });

  test('fresh browser context does not inherit the previous session draft', async ({ page, browser }) => {
    await reachDetails(page, { title:'Water disruption', description:'A short description.' });
    const durableState = await readDurableState(page);
    const freshContext = await browser.newContext({ baseURL:'http://127.0.0.1:4173' });
    try {
      const freshPage = await freshContext.newPage();
      await freshPage.goto('/#home');
      await freshPage.evaluate(({ key, state }) => localStorage.setItem(key, JSON.stringify(state)), { key:STATE_KEY, state:durableState });
      await freshPage.goto('/#voice-new');
      await expect(freshPage.locator('#voiceStepCategory')).toBeVisible();
      await expect(freshPage.locator('input[name="voiceCategory"]:checked')).toHaveCount(0);
      await expect(freshPage.locator('#voiceCategoryContinue')).toBeDisabled();
    } finally {
      await freshContext.close();
    }
  });

  test('successful submit is submitting-safe, internal, unpublished, silent, and clears session draft', async ({ page }) => {
    await reachReview(page, { title:'Water disruption', description:'A short description.' });
    const startingXp = await page.evaluate(() => window.CampusHubDemo.student.xp);
    const submit = page.locator('#voiceSubmitIssue');
    await submit.click();
    await expect(submit).toBeDisabled();
    await expect(submit).toHaveText('Submitting…');
    await submit.evaluate(button => button.click());
    await expect(page.locator('#voiceStepConfirmation')).toBeVisible();
    await expect(page.locator('#voiceConfirmationHeading')).toBeFocused();
    await expect(page.locator('#voiceStepConfirmation')).toContainText('Issue submitted');
    await expect(page.locator('#voiceStepConfirmation')).toContainText('Your issue has been submitted for review.');
    await expect(page.locator('#voiceConfirmationStatus')).toHaveText('Submitted');
    await expect(page.locator('#voiceStepConfirmation')).toContainText('Submission does not mean publication.');
    await expect(page.locator('#voiceStepConfirmation')).toContainText("You'll be notified when the status changes.");
    await expect(page.locator('#voiceConfirmationBack')).toHaveText('Back to Student Voice');
    await expect(page.locator('#voiceStepConfirmation')).not.toContainText(/XP|streak|gamification/i);
    const state = await readDurableState(page);
    expect(state.voiceSubmissions).toHaveLength(1);
    expect(state.voiceSubmissions[0]).toMatchObject({ status:'Submitted', moderationState:'submitted' });
    expect(await page.evaluate(() => window.CampusHubDemo.student.xp)).toBe(startingXp);
    expect(state.streakState).toEqual({ count:4, lastQualifiedTenantDay:'2026-05-20' });
    expect(await readSessionDraft(page)).toBeNull();
    await page.goto('/#voice');
    await expect(page.locator('#voiceAllList .voice-issue-card')).toHaveCount(3);
    await expect(page.locator('#voiceAllList')).not.toContainText('Water disruption');
  });

  test('denied final submit preserves Review/draft and does not mutate streak or XP', async ({ page }) => {
    await reachReview(page, { title:'Water disruption', description:'A short description.' });
    await page.evaluate(key => {
      const state = JSON.parse(localStorage.getItem(key));
      state.membership.assuranceLevel = 1;
      state.membership.status = 'active';
      localStorage.setItem(key, JSON.stringify(state));
    }, STATE_KEY);
    const startingXp = await page.evaluate(() => window.CampusHubDemo.student.xp);
    await page.locator('#voiceSubmitIssue').click();
    await expect(page.locator('#participationGate')).toBeVisible();
    await expect(page.locator('#voiceStepReview')).toBeVisible();
    const state = await readDurableState(page);
    expect(state.voiceSubmissions).toHaveLength(0);
    expect(state.streakState.count).toBe(3);
    expect(await page.evaluate(() => window.CampusHubDemo.student.xp)).toBe(startingXp);
    expect(await readSessionDraft(page)).toMatchObject({ category:'Wi-Fi', title:'Water disruption', description:'A short description.', step:3 });
    await expect(page.locator('#voiceReviewTitle')).toHaveText('Water disruption');
    await expect(page.locator('#voiceReviewDescription')).toHaveText('A short description.');
  });

  test('keeps all composer stages free of horizontal overflow at required widths', async ({ page }) => {
    for (const viewport of [
      { width:320, height:844 },
      { width:390, height:844 },
      { width:430, height:932 },
      { width:768, height:1024 },
      { width:1280, height:900 }
    ]) {
      await page.setViewportSize(viewport);
      await resetDemo(page);
      await openComposer(page);
      await expectNoHorizontalOverflow(page);
      await page.locator('input[name="voiceCategory"]').first().check();
      await page.locator('#voiceCategoryContinue').click();
      await expectNoHorizontalOverflow(page);
      await page.locator('#voiceIssueTitle').fill('Water disruption');
      await page.locator('#voiceIssueDescription').fill('A short description.');
      await page.locator('#voiceDetailsContinue').click();
      await expectNoHorizontalOverflow(page);
      await page.locator('#voiceReviewBack').click();
      await page.locator('#voiceDetailsContinue').click();
      await page.locator('#voiceSubmitIssue').click();
      await expect(page.locator('#voiceStepConfirmation')).toBeVisible();
      await expectNoHorizontalOverflow(page);
    }
  });
});
