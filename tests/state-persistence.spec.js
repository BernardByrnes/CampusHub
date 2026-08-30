import { expect, test } from '@playwright/test';

const LEGACY_STATE_KEY = 'campushub:state';
const LEGACY_DRAFT_KEY = 'campushub:voice-draft';
const STATE_V3_KEY = 'campushub:state:v3:tenant-makerere:membership-demo-001';
const STATE_V2_KEY = 'campushub:state:v2:tenant-makerere:membership-demo-001';
const FOREIGN_STATE_KEY = 'campushub:state:v3:tenant-other:membership-other-001';
const FOREIGN_DRAFT_KEY = 'campushub:voice-draft:v3:tenant-other:membership-other-001';
const PERSISTENCE_SCENARIO_KEY = 'campushub:debug:persistence-scenario';
const GENERIC_FAILURE = 'We couldn’t save that change. Try again.';

async function goTo(page, hash) {
  await page.goto(`/${hash}`);
  await page.waitForFunction(() => typeof window.CampusHubDebug?.getStateStorageKey === 'function');
}

async function stateKey(page) {
  return page.evaluate(() => window.CampusHubDebug.getStateStorageKey());
}

async function draftKey(page) {
  return page.evaluate(() => window.CampusHubDebug.getVoiceDraftStorageKey());
}

async function readState(page) {
  const key = await stateKey(page);
  return page.evaluate(storageKey => JSON.parse(localStorage.getItem(storageKey) || 'null'), key);
}

async function readXp(page) {
  return page.evaluate(() => window.CampusHubDebug.getXpTotal());
}

async function readQuizOutcome(page) {
  return page.evaluate(() => window.CampusHubDebug.getDailyQuizCompletionOutcome());
}

async function readEvents(page) {
  return page.evaluate(() => window.CampusHubDebug.getXpEvents());
}

async function readSessionDraft(page) {
  const key = await draftKey(page);
  return page.evaluate(storageKey => JSON.parse(sessionStorage.getItem(storageKey) || 'null'), key);
}

async function resetDemo(page) {
  await page.evaluate(() => window.CampusHubDebug.resetDemo());
}

async function setPersistence(page, scenario) {
  await page.evaluate(value => window.CampusHubDebug.setPersistenceScenario(value), scenario);
}

async function expectFailureToast(page) {
  await expect(page.locator('.toast').last()).toContainText(GENERIC_FAILURE);
}

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

async function reachVoiceReview(page) {
  await goTo(page, '#voice-new');
  await page.locator('input[name="voiceCategory"]').first().check();
  await page.locator('#voiceCategoryContinue').click();
  await page.locator('#voiceIssueTitle').fill('Water disruption');
  await page.locator('#voiceIssueDescription').fill('A short description of the campus issue.');
  await page.locator('#voiceDetailsContinue').click();
  await expect(page.locator('#voiceStepReview')).toBeVisible();
}

test.describe('Phase 8T state ownership, persistence truth, and navigation history', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'canonical-mobile', 'Detailed state contracts run once in canonical-mobile.');
    await blockRemoteFonts(page);
    await goTo(page, '#home');
    await resetDemo(page);
  });

  test('keeps the canonical fixture immutable across an ordinary persisted journey', async ({ page }) => {
    const before = await page.evaluate(() => JSON.stringify(window.CampusHubDemo));

    await goTo(page, '#participate');
    await page.locator('#pollForm input[value="0"]').check();
    await page.locator('#submitPoll').click();
    await expect(page.locator('#pollSuccess')).toBeVisible();

    await goTo(page, '#play');
    await page.locator('#quizOptions input[value="0"]').check();
    await page.locator('#quizSubmit').click();
    await expect(page.locator('#quizFeedback')).toBeVisible();

    await goTo(page, '#events/guild-debate');
    await page.locator('#eventSave').click();
    await page.locator('#rsvpGoing').click();
    await expect(page.locator('#rsvpGoing')).toHaveText('Going ✓');
    expect(await readXp(page)).toBe(360);
    expect((await readEvents(page)).filter(event => event.ruleRef === 'event-rsvp')).toHaveLength(1);

    await goTo(page, '#opportunities/ra-climate');
    await page.locator('#oppSave').click();

    await goTo(page, '#voice-detail/voice-water-halls');
    await page.locator('#voiceSupportButton').click();
    await expect(page.locator('#voiceSupportFeedback')).toHaveText('Support recorded.');

    await goTo(page, '#notifications');
    await page.locator('[data-notification-id="notification-priority-rescheduled"]').click();
    await expect(page.locator('#view-news')).toBeVisible();

    const after = await page.evaluate(() => JSON.stringify(window.CampusHubDemo));
    expect(after).toBe(before);
  });

  test('keeps D.student seeds unchanged while state drives XP, level, and assurance UI', async ({ page }) => {
    const seed = await page.evaluate(() => ({
      xp: window.CampusHubDemo.student.xp,
      level: window.CampusHubDemo.student.level,
      assuranceLevel: window.CampusHubDemo.student.assuranceLevel,
      assurance: window.CampusHubDemo.student.assurance
    }));

    await goTo(page, '#participate');
    await page.locator('#pollForm input[value="0"]').check();
    await page.locator('#submitPoll').click();
    await expect(page.locator('#pollSuccess')).toBeVisible();
    await goTo(page, '#play');
    await page.locator('#quizOptions input[value="0"]').check();
    await page.locator('#quizSubmit').click();
    await expect(page.locator('#quizFeedback')).toBeVisible();

    await page.evaluate(() => window.CampusHubDebug.setScenario('assurance-required'));
    await goTo(page, '#verification');
    await expect(page.locator('[data-field="assuranceTitle"]')).toHaveText('L1 — Weak Affiliation');
    expect((await readState(page)).membership.assuranceLevel).toBe(1);

    expect(await page.evaluate(() => ({
      xp: window.CampusHubDemo.student.xp,
      level: window.CampusHubDemo.student.level,
      assuranceLevel: window.CampusHubDemo.student.assuranceLevel,
      assurance: window.CampusHubDemo.student.assurance
    }))).toEqual(seed);
    await goTo(page, '#play');
    await expect(page.locator('[data-field="xpCount"]')).toHaveText('355');
    await expect(page.locator('[data-field="levelDisplay"]')).toHaveText('Level 4');
  });

  test('uses one versioned opaque namespace and a flat ownership envelope', async ({ page }) => {
    const key = await stateKey(page);
    const draft = await draftKey(page);
    expect(key).toBe(STATE_V3_KEY);
    expect(draft).toBe('campushub:voice-draft:v3:tenant-makerere:membership-demo-001');
    expect(key).not.toMatch(/21\/U\/04218|Nakato Grace|email|phone/i);
    expect(draft).not.toMatch(/21\/U\/04218|Nakato Grace|email|phone/i);

    const state = await readState(page);
    expect(state).toMatchObject({
      schemaVersion: 3,
      tenantId: 'tenant-makerere',
      membershipId: 'membership-demo-001'
    });
    expect(state).not.toHaveProperty('metadata');
    expect(state).not.toHaveProperty('xp');
    expect(state.xpEvents).toHaveLength(1);
    expect(state.xpEvents[0]).toMatchObject({ ruleRef:'prototype-opening-balance', amount:340, studentVisible:false });
  });

  test('migrates legacy durable state and removes it only after the namespaced write succeeds', async ({ page }) => {
    const key = await stateKey(page);
    const legacy = {
      xp: 500,
      level: 5,
      rsvp: 'going',
      saveEvent: true,
      notificationReadIds: ['notification-priority-rescheduled']
    };
    await page.evaluate(({ stateKey, legacyState }) => {
      localStorage.removeItem(stateKey);
      localStorage.setItem('campushub:state', JSON.stringify(legacyState));
    }, { stateKey: key, legacyState: legacy });

    await page.reload();
    const migrated = await readState(page);
    expect(migrated).toMatchObject({
      schemaVersion: 3,
      tenantId: 'tenant-makerere',
      membershipId: 'membership-demo-001',
      level: 5,
      rsvp: 'going',
      saveEvent: true
    });
    expect(migrated).not.toHaveProperty('xp');
    expect(migrated.xpEvents).toHaveLength(1);
    expect(migrated.xpEvents[0]).toMatchObject({ ruleRef:'prototype-opening-balance', amount:500, studentVisible:false });
    expect(migrated.notificationReadIds).toContain('notification-priority-rescheduled');
    expect(await page.evaluate(() => localStorage.getItem('campushub:state'))).toBeNull();
    expect(await page.evaluate(stateKey => Boolean(localStorage.getItem(stateKey)), key)).toBe(true);
  });

  test('keeps zero legacy XP as a valid empty ledger and rejects malformed scalar values', async ({ page }) => {
    test.setTimeout(60000);
    const key = await stateKey(page);
    for (const xp of [0, -1, 'garbage']) {
      await page.evaluate(({ stateKey, v2Key, value }) => {
        localStorage.removeItem(stateKey);
        localStorage.setItem(v2Key, JSON.stringify({
          schemaVersion: 2,
          tenantId: 'tenant-makerere',
          membershipId: 'membership-demo-001',
          xp: value
        }));
      }, { stateKey:key, v2Key:STATE_V2_KEY, value:xp });
      await page.reload();
      expect(await page.evaluate(() => window.CampusHubDebug.getXpTotal())).toBe(0);
      expect(await page.evaluate(() => window.CampusHubDebug.getXpEvents())).toEqual([]);
      expect(await page.evaluate(() => window.CampusHubDebug.reconcileXpLedger())).toMatchObject({ valid:true, total:0, eventCount:0 });
    }
  });

  test('quarantines malformed legacy events while recovering a valid scalar, without double-counting mixed state', async ({ page }) => {
    const key = await stateKey(page);
    const malformed = {
      id:'malformed-legacy', tenantId:'tenant-makerere', membershipId:'membership-demo-001',
      ruleRef:'legacy', amount:0, timestamp:'2026-05-20T00:00:00.000Z', idempotencyKey:'legacy-malformed',
      type:'award', sourceType:'legacy', sourceId:'legacy', sourceAction:'award'
    };
    await page.evaluate(({ stateKey, v2Key, event }) => {
      localStorage.removeItem(stateKey);
      localStorage.setItem(v2Key, JSON.stringify({
        schemaVersion:2, tenantId:'tenant-makerere', membershipId:'membership-demo-001', xp:340, xpEvents:[event]
      }));
    }, { stateKey:key, v2Key:STATE_V2_KEY, event:malformed });
    await page.reload();
    expect(await page.evaluate(() => window.CampusHubDebug.getXpTotal())).toBe(340);
    expect(await page.evaluate(() => window.CampusHubDebug.getXpEvents())).toEqual(expect.arrayContaining([
      expect.objectContaining({ id:'malformed-legacy', amount:0 }),
      expect.objectContaining({ ruleRef:'prototype-opening-balance', amount:340, studentVisible:false })
    ]));
    expect(await page.evaluate(() => window.CampusHubDebug.reconcileXpLedger())).toMatchObject({ valid:false, total:340 });

    const valid = {
      id:'valid-legacy', tenantId:'tenant-makerere', membershipId:'membership-demo-001',
      ruleRef:'legacy', amount:300, timestamp:'2026-05-20T00:00:00.000Z', idempotencyKey:'legacy-valid',
      type:'award', sourceType:'legacy', sourceId:'legacy-valid', sourceAction:'award', studentLabel:'Legacy award', studentVisible:true
    };
    await page.evaluate(({ stateKey, v2Key, valid, malformed }) => {
      localStorage.removeItem(stateKey);
      localStorage.setItem(v2Key, JSON.stringify({
        schemaVersion:2, tenantId:'tenant-makerere', membershipId:'membership-demo-001', xp:340, xpEvents:[valid, malformed]
      }));
    }, { stateKey:key, v2Key:STATE_V2_KEY, valid, malformed });
    await page.reload();
    expect(await page.evaluate(() => window.CampusHubDebug.getXpTotal())).toBe(300);
    expect(await page.evaluate(() => window.CampusHubDebug.getXpEvents())).toHaveLength(2);
    expect(await page.evaluate(() => window.CampusHubDebug.reconcileXpLedger())).toMatchObject({ valid:false, total:300 });
  });

  test('preserves legacy state when migration write fails, then recovers normally', async ({ page }) => {
    const key = await stateKey(page);
    const legacy = { xp: 501, level: 5, rsvp: 'interested' };
    const rawLegacy = JSON.stringify(legacy);
    await page.evaluate(({ stateKey, raw }) => {
      localStorage.removeItem(stateKey);
      localStorage.setItem('campushub:state', raw);
      sessionStorage.setItem('campushub:debug:persistence-scenario', 'fail');
    }, { stateKey: key, raw: rawLegacy });

    await page.reload();
    expect(await page.evaluate(() => localStorage.getItem('campushub:state'))).toBe(rawLegacy);
    expect(await page.evaluate(stateKey => localStorage.getItem(stateKey), key)).toBeNull();

    await setPersistence(page, 'normal');
    await page.reload();
    expect((await page.evaluate(() => window.CampusHubDebug.getXpTotal()))).toBe(501);
    expect((await readState(page))).not.toHaveProperty('xp');
    expect(await page.evaluate(() => localStorage.getItem('campushub:state'))).toBeNull();
  });

  test('recovers safely from malformed, primitive, and foreign current records', async ({ page }) => {
    const key = await stateKey(page);
    const records = ['not-json', JSON.stringify(42), JSON.stringify({
      schemaVersion: 3,
      tenantId: 'tenant-other',
      membershipId: 'membership-other-001',
      xp: 999999
    })];
    for (const raw of records) {
      await page.evaluate(({ stateKey, value }) => {
        localStorage.removeItem('campushub:state');
        localStorage.setItem(stateKey, value);
      }, { stateKey: key, value: raw });
      await page.reload();
      expect(await page.evaluate(() => window.CampusHubDebug.getXpTotal())).toBe(340);
      expect((await page.evaluate(() => window.CampusHubDebug.getCurrentState())).tenantId).toBe('tenant-makerere');
    }
  });

  test('keeps an unknown future schema readable in memory without overwriting its raw record', async ({ page }) => {
    const key = await stateKey(page);
    const future = {
      schemaVersion: 999,
      tenantId: 'tenant-makerere',
      membershipId: 'membership-demo-001',
      xp: 999999,
      level: 99
    };
    const rawFuture = JSON.stringify(future);
    await page.evaluate(({ stateKey, raw }) => localStorage.setItem(stateKey, raw), { stateKey: key, raw: rawFuture });
    await page.reload();

    expect(await page.evaluate(() => window.CampusHubDebug.getXpTotal())).toBe(340);
    expect(await page.evaluate(stateKey => localStorage.getItem(stateKey), key)).toBe(rawFuture);
    await goTo(page, '#play');
    await expect(page.locator('[data-field="xpCount"]')).toHaveText('340');
  });

  test('isolates foreign state and resets only the current namespace', async ({ page }) => {
    const key = await stateKey(page);
    const unrelated = 'campushub:unrelated-fixture';
    await page.evaluate(({ stateKey, foreignKey, unrelatedKey }) => {
      const state = JSON.parse(localStorage.getItem(stateKey));
      localStorage.setItem(stateKey, JSON.stringify(state));
      localStorage.setItem(foreignKey, JSON.stringify({
        schemaVersion: 3,
        tenantId: 'tenant-other',
        membershipId: 'membership-other-001',
        xp: 999999
      }));
      localStorage.setItem(unrelatedKey, 'leave me alone');
    }, { stateKey: key, foreignKey: FOREIGN_STATE_KEY, unrelatedKey: unrelated });

    await page.evaluate(() => window.CampusHubDebug.resetDemo());
    expect(await page.evaluate(() => window.CampusHubDebug.getXpTotal())).toBe(340);
    expect(await page.evaluate(foreignKey => JSON.parse(localStorage.getItem(foreignKey)).xp, FOREIGN_STATE_KEY)).toBe(999999);
    expect(await page.evaluate(unrelatedKey => localStorage.getItem(unrelatedKey), unrelated)).toBe('leave me alone');

    await page.evaluate(stateKey => localStorage.removeItem(stateKey), key);
    await page.reload();
    expect(await page.evaluate(() => window.CampusHubDebug.getXpTotal())).toBe(340);
    expect(await page.evaluate(foreignKey => Boolean(localStorage.getItem(foreignKey)), FOREIGN_STATE_KEY)).toBe(true);
  });

  test('migrates a legacy Voice draft into the scoped session key and ignores foreign drafts', async ({ page }) => {
    const key = await draftKey(page);
    await page.evaluate(({ draftKey, legacyKey }) => {
      sessionStorage.removeItem(draftKey);
      sessionStorage.setItem(legacyKey, JSON.stringify({
        category: 'Facilities',
        title: 'T'.repeat(120),
        description: 'D'.repeat(1000),
        step: 9
      }));
    }, { draftKey: key, legacyKey: LEGACY_DRAFT_KEY });
    await page.reload();
    await goTo(page, '#voice-new');
    await expect(page.locator('#voiceIssueTitle')).toHaveCount(1);
    await expect(page.locator('#voiceIssueTitle')).toHaveValue('T'.repeat(80));
    await expect(page.locator('#voiceIssueDescription')).toHaveValue('D'.repeat(500));
    expect((await readSessionDraft(page)).category).toBe('Facilities');
    expect((await readSessionDraft(page)).step).toBe(1);
    expect(await page.evaluate(legacyKey => sessionStorage.getItem(legacyKey), LEGACY_DRAFT_KEY)).toBeNull();

    await page.evaluate(({ foreignKey, scopedKey }) => {
      sessionStorage.removeItem(scopedKey);
      sessionStorage.setItem(foreignKey, JSON.stringify({ category: 'Lighting', title: 'FOREIGN DRAFT', description: 'Do not bleed.', step: 2 }));
    }, { foreignKey: FOREIGN_DRAFT_KEY, scopedKey: key });
    await page.reload();
    await goTo(page, '#voice-new');
    await expect(page.locator('#voiceIssueTitle')).toHaveValue('');
    expect(await page.evaluate(foreignKey => Boolean(sessionStorage.getItem(foreignKey)), FOREIGN_DRAFT_KEY)).toBe(true);
  });

  test('fails Poll and Quiz without durable completion, XP, streak, or success claims', async ({ page }) => {
    await setPersistence(page, 'fail');
    await goTo(page, '#participate');
    await page.locator('#pollForm input[value="0"]').check();
    await page.locator('#submitPoll').click();
    await page.waitForTimeout(700);
    await expect(page.locator('#pollSuccess')).toBeHidden();
    await expectFailureToast(page);
    expect(await readState(page)).toMatchObject({ pollDone: false, streakState: { count: 3 } });
    expect(await page.evaluate(() => window.CampusHubDebug.getXpTotal())).toBe(340);

    await goTo(page, '#play');
    await page.locator('#quizOptions input[value="0"]').check();
    await page.locator('#quizSubmit').click();
    await page.waitForTimeout(250);
    await expect(page.locator('#quizCompleteNote')).toBeHidden();
    await expectFailureToast(page);
    expect(await readState(page)).toMatchObject({ quizDone: false, streakState: { count: 3 } });
    expect(await page.evaluate(() => window.CampusHubDebug.getXpTotal())).toBe(340);
    expect(await page.evaluate(() => window.CampusHubDemo.student.xp)).toBe(340);

    await page.reload();
    expect(await readState(page)).toMatchObject({ pollDone: false, quizDone: false, streakState: { count: 3 } });
    expect(await page.evaluate(() => window.CampusHubDebug.getXpTotal())).toBe(340);
  });

  test('keeps an already-completed Quiz replay read-only after reload', async ({ page }) => {
    await goTo(page, '#play');
    await page.locator('#quizOptions input[value="0"]').check();
    await page.locator('#quizSubmit').click();
    await expect(page.locator('#quizFeedback')).toContainText('Correct!');
    const before = {
      raw: await page.evaluate(() => localStorage.getItem('campushub:state:v3:tenant-makerere:membership-demo-001')),
      state: await readState(page),
      xp: await readXp(page),
      events: await readEvents(page)
    };

    await page.reload();
    await expect(page.locator('#quizCompleteNote')).toBeVisible();
    await page.locator('#quizSubmit').evaluate(button => button.onclick());
    await expect(page.locator('#participationGate')).toBeHidden();
    await expect(page.locator('#quizFeedback')).toContainText('Correct!');
    expect(await readQuizOutcome(page)).toEqual({
      completed:true,
      code:'ALREADY_COMPLETED',
      currentResult:before.state.quizParticipation
    });
    expect(await page.evaluate(() => localStorage.getItem('campushub:state:v3:tenant-makerere:membership-demo-001'))).toBe(before.raw);
    expect(await readState(page)).toEqual(before.state);
    expect(await readXp(page)).toBe(before.xp);
    expect(await readEvents(page)).toEqual(before.events);
  });

  test('fails Save, RSVP, Voice support, and Opportunity report without success state', async ({ page }) => {
    await setPersistence(page, 'fail');
    await goTo(page, '#events/guild-debate');
    await page.locator('#eventSave').click();
    await expect(page.locator('#eventSave')).toHaveText('Save');
    await expectFailureToast(page);
    await page.locator('#rsvpGoing').click();
    await expect(page.locator('#rsvpGoing')).toHaveText('Going');
    expect(await readState(page)).toMatchObject({ saveEvent: false, rsvp: null, streakState: { count: 3 } });
    expect(await readXp(page)).toBe(340);
    expect((await readEvents(page)).filter(event => event.ruleRef === 'event-rsvp')).toHaveLength(0);

    await goTo(page, '#voice-detail/voice-water-halls');
    await page.locator('#voiceSupportButton').click();
    await expect(page.locator('#voiceSupportButton')).toHaveText('Support this issue');
    await expect(page.locator('#voiceSupportFeedback')).not.toHaveText('Support recorded.');
    expect((await readState(page)).supportedVoiceIssues).toEqual([]);

    await goTo(page, '#opportunities/ra-climate');
    await page.locator('#oppReport').click();
    await expect(page.locator('#oppReport')).toHaveText('Report suspicious opportunity');
    expect((await readState(page)).reportedOpportunityIds).toEqual([]);
  });

  test('fails a first affirmative RSVP atomically without durable state, XP, streak, or success', async ({ page }) => {
    await setPersistence(page, 'fail');
    await goTo(page, '#events/guild-debate');
    await page.locator('#rsvpGoing').click();
    await expectFailureToast(page);
    await expect(page.locator('#rsvpGoing')).toHaveText('Going');
    await expect(page.locator('.toast').filter({ hasText: "You're on the list." })).toHaveCount(0);
    expect(await readState(page)).toMatchObject({ rsvp: null, streakState: { count: 3 } });
    expect(await readXp(page)).toBe(340);
    expect((await readEvents(page)).filter(event => event.ruleRef === 'event-rsvp')).toHaveLength(0);

    await page.reload();
    expect(await readState(page)).toMatchObject({ rsvp: null, streakState: { count: 3 } });
    expect(await readXp(page)).toBe(340);
    expect((await readEvents(page)).filter(event => event.ruleRef === 'event-rsvp')).toHaveLength(0);
  });

  test('keeps an existing RSVP and award durable when withdrawal persistence fails', async ({ page }) => {
    await goTo(page, '#events/guild-debate');
    await page.locator('#rsvpGoing').click();
    await expect(page.locator('#rsvpGoing')).toHaveText('Going ✓');
    expect(await readXp(page)).toBe(345);
    expect((await readEvents(page)).filter(event => event.ruleRef === 'event-rsvp')).toHaveLength(1);

    await setPersistence(page, 'fail');
    await page.locator('#rsvpGoing').click();
    await expectFailureToast(page);
    await expect(page.locator('#rsvpGoing')).toHaveText('Going ✓');
    expect(await readState(page)).toMatchObject({ rsvp: 'going' });
    expect(await readXp(page)).toBe(345);
    expect((await readEvents(page)).filter(event => event.ruleRef === 'event-rsvp')).toHaveLength(1);

    await page.reload();
    expect(await readState(page)).toMatchObject({ rsvp: 'going' });
    expect(await readXp(page)).toBe(345);
    expect((await readEvents(page)).filter(event => event.ruleRef === 'event-rsvp')).toHaveLength(1);
  });

  test('rejects an unsafe RSVP award append without saving RSVP or streak state', async ({ page }) => {
    await goTo(page, '#events/guild-debate');
    const conflicting = await page.evaluate(() => window.CampusHubDebug.appendXpEvent({
      type: 'award',
      ruleRef: 'event-rsvp',
      amount: 6,
      idempotencyKey: 'xp:award:event-rsvp:guild-debate',
      sourceType: 'event-rsvp',
      sourceId: 'guild-debate',
      sourceAction: 'rsvp',
      tenantDay: '2026-05-20',
      studentLabel: 'Event RSVP',
      studentVisible: true
    }));
    expect(conflicting.added).toBe(true);
    const before = { state: await readState(page), xp: await readXp(page), events: await readEvents(page) };

    await page.locator('#rsvpGoing').click();
    await expectFailureToast(page);
    await expect(page.locator('#rsvpGoing')).toHaveText('Going');
    await expect(page.locator('.toast').filter({ hasText: "You're on the list." })).toHaveCount(0);
    expect((await readState(page)).rsvp).toBe(before.state.rsvp);
    expect((await readState(page)).streakState).toEqual(before.state.streakState);
    expect(await readXp(page)).toBe(before.xp);
    expect(await readEvents(page)).toEqual(before.events);
  });

  test('fails Voice submission without publishing, XP, streak, or a confirmation claim', async ({ page }) => {
    await reachVoiceReview(page);
    await setPersistence(page, 'fail');
    await page.locator('#voiceSubmitIssue').click();
    await page.waitForTimeout(250);
    await expect(page.locator('#voiceStepConfirmation')).toBeHidden();
    await expect(page.locator('#voiceSubmitError')).toHaveText(GENERIC_FAILURE);
    expect(await readState(page)).toMatchObject({ voiceSubmissions: [], streakState: { count: 3 } });
    expect(await page.evaluate(() => window.CampusHubDebug.getXpTotal())).toBe(340);
    expect((await readSessionDraft(page)).title).toBe('Water disruption');
  });

  test('keeps notification read failures truthful while allowing valid source navigation', async ({ page }) => {
    await goTo(page, '#notifications');
    await setPersistence(page, 'fail');
    await page.locator('#markAllRead').click();
    await expect(page.locator('.notification-row--unread')).toHaveCount(2);
    await expect(page.locator('#markAllRead')).toBeEnabled();
    await expectFailureToast(page);
    expect((await readState(page)).notificationReadIds).not.toEqual(expect.arrayContaining(['notification-priority-rescheduled', 'notification-poll-opened']));

    await setPersistence(page, 'normal');
    const key = await stateKey(page);
    await page.evaluate(stateKey => {
      const state = JSON.parse(localStorage.getItem(stateKey));
      state.notificationReadIds = state.notificationReadIds.filter(id => id !== 'notification-cocis-story');
      localStorage.setItem(stateKey, JSON.stringify(state));
    }, key);
    await goTo(page, '#notifications');
    await setPersistence(page, 'fail');
    await page.locator('[data-notification-id="notification-cocis-story"]').click();
    await expect(page.locator('#view-news')).toBeVisible();
    await expect(page.locator('#newsDetailTitle')).toHaveText('New Innovation Lab Opens at CoCIS');
    await goTo(page, '#notifications');
    expect((await readState(page)).notificationReadIds).not.toContain('notification-cocis-story');
    await expect(page.locator('li.notification-item:has([data-notification-id="notification-cocis-story"])')).toHaveClass(/notification-row--unread/);
  });

  test('keeps verification refresh truthful when its persistence write fails', async ({ page }) => {
    await page.evaluate(() => window.CampusHubDebug.setScenario('membership-refresh'));
    await goTo(page, '#verification');
    await setPersistence(page, 'fail');
    await page.locator('#startRosterMatch').click();
    await page.waitForTimeout(900);
    await expect(page.locator('#verificationSuccess')).toBeHidden();
    await expect(page.locator('#startRosterMatch')).toHaveText('Refresh membership');
    await expectFailureToast(page);
    expect(await readState(page)).toMatchObject({ membership: { assuranceLevel: 2, status: 'refresh' } });
  });

  test('recovers normal persistence after a forced failure', async ({ page }) => {
    await goTo(page, '#participate');
    await setPersistence(page, 'fail');
    await page.locator('#pollForm input[value="0"]').check();
    await page.locator('#submitPoll').click();
    await page.waitForTimeout(700);
    await setPersistence(page, 'normal');
    await page.locator('#pollForm input[value="0"]').check();
    await page.locator('#submitPoll').click();
    await expect(page.locator('#pollSuccess')).toBeVisible();

    await goTo(page, '#play');
    await page.locator('#quizOptions input[value="0"]').check();
    await page.locator('#quizSubmit').click();
    await expect(page.locator('#quizFeedback')).toBeVisible();
    await goTo(page, '#events/guild-debate');
    await page.locator('#eventSave').click();
    await page.locator('#rsvpGoing').click();
    await goTo(page, '#voice-detail/voice-water-halls');
    await page.locator('#voiceSupportButton').click();
    await expect(page.locator('#voiceSupportFeedback')).toHaveText('Support recorded.');
    await goTo(page, '#notifications');
    await page.locator('[data-notification-id="notification-priority-rescheduled"]').click();
    await page.reload();
    const state = await readState(page);
    expect(state).toMatchObject({ pollDone: true, quizDone: true, saveEvent: true, rsvp: 'going' });
    expect(state.supportedVoiceIssues).toContain('voice-water-halls');
    expect(state.notificationReadIds).toContain('notification-priority-rescheduled');
  });
});
