import { expect, test } from '@playwright/test';

const V3_STATE_KEY = 'campushub:state:v3:tenant-makerere:membership-demo-001';
const V2_STATE_KEY = 'campushub:state:v2:tenant-makerere:membership-demo-001';
const FOREIGN_STATE_KEY = 'campushub:state:v3:tenant-other:membership-other-001';
const PERSISTENCE_SCENARIO_KEY = 'campushub:debug:persistence-scenario';

async function goTo(page, hash) {
  await page.goto(`/${hash}`);
  await page.waitForFunction(() => typeof window.CampusHubDebug?.getXpEvents === 'function');
}

async function resetDemo(page) {
  await goTo(page, '#home');
  await page.evaluate(() => window.CampusHubDebug.resetDemo());
  await page.evaluate(() => document.querySelectorAll('#toastWrap .toast').forEach(toast => toast.remove()));
}

async function readState(page) {
  return page.evaluate(key => JSON.parse(localStorage.getItem(key) || 'null'), V3_STATE_KEY);
}

async function readEvents(page) {
  return page.evaluate(() => window.CampusHubDebug.getXpEvents());
}

async function readTotal(page) {
  return page.evaluate(() => window.CampusHubDebug.getXpTotal());
}

async function submitPoll(page, option = '0') {
  await goTo(page, '#participate');
  await page.locator(`#pollForm input[value="${option}"]`).check();
  await page.locator('#submitPoll').click();
  await expect(page.locator('#pollSuccess')).toBeVisible();
}

async function submitQuiz(page, option = '0') {
  await goTo(page, '#play');
  await page.locator(`#quizOptions input[value="${option}"]`).check();
  await page.locator('#quizSubmit').click();
  await expect(page.locator('#quizFeedback')).toBeVisible();
}

async function appendCorrection(page, amount, extra = {}) {
  return page.evaluate(({ amount: nextAmount, extra: input }) => window.CampusHubDebug.appendXpCorrection({
    amount: nextAmount,
    ruleRef: 'test-correction',
    idempotencyKey: `xp:test:correction:${nextAmount}:${Date.now()}`,
    sourceType: 'test',
    sourceId: 'xp-ledger-test',
    sourceAction: 'correction',
    reason: 'Test correction',
    ...input
  }), { amount, extra });
}

function importedXpEvent(overrides = {}) {
  return {
    id: 'imported-event',
    tenantId: 'tenant-makerere',
    membershipId: 'membership-demo-001',
    ruleRef: 'imported-test',
    amount: 1,
    timestamp: '2026-05-20T00:00:00.000Z',
    idempotencyKey: 'imported-key',
    type: 'award',
    sourceType: 'imported-test',
    sourceId: 'imported-source',
    sourceAction: 'complete',
    studentLabel: 'Imported test',
    studentVisible: true,
    ...overrides
  };
}

function eventRsvpInput(overrides = {}) {
  return {
    type: 'award',
    ruleRef: 'event-rsvp',
    amount: 5,
    idempotencyKey: 'xp:award:event-rsvp:guild-debate',
    sourceType: 'event-rsvp',
    sourceId: 'guild-debate',
    sourceAction: 'rsvp',
    tenantDay: '2026-05-20',
    studentLabel: 'Event RSVP',
    studentVisible: true,
    ...overrides
  };
}

test.describe('Phase 8T.1 append-only XP ledger and explainable progress', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'canonical-mobile', 'XP ledger contracts run once in canonical-mobile.');
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

  test('resets to a v3 ledger with one hidden opening balance and no scalar XP', async ({ page }) => {
    const state = await readState(page);
    const events = await readEvents(page);
    expect(state).toMatchObject({
      schemaVersion: 3,
      tenantId: 'tenant-makerere',
      membershipId: 'membership-demo-001',
      level: 4
    });
    expect(state).not.toHaveProperty('xp');
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      type: 'correction',
      ruleRef: 'prototype-opening-balance',
      amount: 340,
      sourceType: 'prototype-migration',
      sourceId: 'pre-ledger-balance',
      sourceAction: 'opening-balance',
      studentLabel: 'Starting XP balance',
      studentVisible: false
    });
    expect(await readTotal(page)).toBe(340);
    await goTo(page, '#play');
    await expect(page.locator('[data-field="xpCount"]')).toHaveText('340');
    await expect(page.locator('[data-field="levelDisplay"]')).toHaveText('Level 4');
    await expect(page.locator('#xpHistory')).toContainText('No recent XP activity yet.');
  });

  test('migrates v2 scalar XP to one opening event and removes v2 only after v3 succeeds', async ({ page }) => {
    const v2 = {
      schemaVersion: 2,
      tenantId: 'tenant-makerere',
      membershipId: 'membership-demo-001',
      xp: 500,
      level: 5,
      rsvp: 'going'
    };
    await page.evaluate(({ v2Key, v3Key, value }) => {
      localStorage.removeItem(v3Key);
      localStorage.setItem(v2Key, JSON.stringify(value));
    }, { v2Key: V2_STATE_KEY, v3Key: V3_STATE_KEY, value: v2 });
    await page.reload();
    const state = await readState(page);
    expect(state.schemaVersion).toBe(3);
    expect(state).not.toHaveProperty('xp');
    expect(state.level).toBe(5);
    expect(state.xpEvents).toHaveLength(1);
    expect(state.xpEvents[0].amount).toBe(500);
    expect(await readTotal(page)).toBe(500);
    expect(await page.evaluate(key => localStorage.getItem(key), V2_STATE_KEY)).toBeNull();
    await page.reload();
    expect((await readEvents(page)).filter(event => event.ruleRef === 'prototype-opening-balance')).toHaveLength(1);
  });

  test('preserves v2 when migration write fails and recovers once persistence returns', async ({ page }) => {
    const raw = JSON.stringify({
      schemaVersion: 2,
      tenantId: 'tenant-makerere',
      membershipId: 'membership-demo-001',
      xp: 501,
      level: 5
    });
    await page.evaluate(({ v2Key, v3Key, scenarioKey, value }) => {
      localStorage.removeItem(v3Key);
      localStorage.setItem(v2Key, value);
      sessionStorage.setItem(scenarioKey, 'fail');
    }, { v2Key: V2_STATE_KEY, v3Key: V3_STATE_KEY, scenarioKey: PERSISTENCE_SCENARIO_KEY, value: raw });
    await page.reload();
    expect(await page.evaluate(key => localStorage.getItem(key), V2_STATE_KEY)).toBe(raw);
    expect(await page.evaluate(key => localStorage.getItem(key), V3_STATE_KEY)).toBeNull();
    await page.evaluate(() => window.CampusHubDebug.setPersistenceScenario('normal'));
    await page.reload();
    expect(await readTotal(page)).toBe(501);
    expect(await page.evaluate(key => localStorage.getItem(key), V2_STATE_KEY)).toBeNull();
  });

  test('appends Poll participation once with privacy-safe ownership and UTC timestamp', async ({ page }) => {
    await submitPoll(page);
    const events = await readEvents(page);
    const pollEvent = events.find(event => event.ruleRef === 'poll-participation');
    expect(pollEvent).toMatchObject({
      tenantId: 'tenant-makerere',
      membershipId: 'membership-demo-001',
      ruleRef: 'poll-participation',
      amount: 5,
      type: 'award',
      sourceType: 'poll-participation',
      sourceId: 'poll-restroom-cleanliness',
      sourceAction: 'participate',
      tenantDay: '2026-05-20',
      studentLabel: 'Poll participation'
    });
    expect(pollEvent.timestamp.endsWith('Z')).toBe(true);
    expect(Number.isNaN(Date.parse(pollEvent.timestamp))).toBe(false);
    expect(JSON.stringify(pollEvent)).not.toMatch(/optionIndex|pollChoice|selected|answer|ballot|Very good|Good|Average|Poor|Very poor/i);
    expect(await readTotal(page)).toBe(345);
    await expect(page.locator('#pollSuccess')).toContainText('Response recorded');
    await expect(page.locator('#xpHistory')).toContainText('Poll participation');
    await expect(page.locator('#xpHistory')).toContainText('+5 XP');
  });

  test('enforces exact idempotency and conceptual source uniqueness', async ({ page }) => {
    const input = {
      type: 'award',
      ruleRef: 'test-award',
      amount: 2,
      idempotencyKey: 'xp:test:exact',
      sourceType: 'test-source',
      sourceId: 'source-1',
      sourceAction: 'complete',
      studentLabel: 'Test award'
    };
    const first = await page.evaluate(value => window.CampusHubDebug.appendXpEvent(value), input);
    const second = await page.evaluate(value => window.CampusHubDebug.appendXpEvent(value), input);
    const sourceDuplicate = await page.evaluate(value => window.CampusHubDebug.appendXpEvent({ ...value, idempotencyKey: 'xp:test:different' }), input);
    expect(first.added).toBe(true);
    expect(second).toMatchObject({ added: false, reason: 'idempotent' });
    expect(sourceDuplicate).toMatchObject({ added: false, reason: 'source-duplicate' });
    expect((await readEvents(page)).filter(event => event.ruleRef === 'test-award')).toHaveLength(1);
    expect(await readTotal(page)).toBe(342);
  });

  test('appends the canonical Event RSVP award with a privacy-safe event shape', async ({ page }) => {
    await goTo(page, '#events/guild-debate');
    await page.locator('#rsvpGoing').click();
    const rsvpEvents = (await readEvents(page)).filter(event => event.ruleRef === 'event-rsvp');
    expect(rsvpEvents).toHaveLength(1);
    expect(rsvpEvents[0]).toMatchObject({
      tenantId: 'tenant-makerere',
      membershipId: 'membership-demo-001',
      ruleRef: 'event-rsvp',
      amount: 5,
      type: 'award',
      sourceType: 'event-rsvp',
      sourceId: 'guild-debate',
      sourceAction: 'rsvp',
      tenantDay: '2026-05-20',
      studentLabel: 'Event RSVP',
      studentVisible: true
    });
    expect(rsvpEvents[0].idempotencyKey).toBe('xp:award:event-rsvp:guild-debate');
    const rsvpEventKeys = Object.keys(rsvpEvents[0]);
    for(const forbiddenKey of ['going', 'interested', 'rsvpState', 'choice']){
      expect(rsvpEventKeys).not.toContain(forbiddenKey);
    }
    Object.values(rsvpEvents[0]).forEach(value => {
      if(typeof value !== 'string') return;
      expect(['going', 'interested', 'rsvpState', 'choice']).not.toContain(value);
    });
    expect(await readTotal(page)).toBe(345);
    await goTo(page, '#play');
    await expect(page.locator('#xpHistory')).toContainText('Event RSVP');
    await expect(page.locator('#xpHistory')).toContainText('+5 XP');
    await expect(page.locator('#xpRules')).toContainText('Event RSVP');
    await expect(page.locator('#xpRules')).toContainText('Awarded once per event; amount set by this tenant');
  });

  test('enforces Event RSVP source uniqueness, replay idempotency, and intent conflicts', async ({ page }) => {
    const amount = await page.evaluate(() => Number(window.CampusHubDemo.demoConfig.xp.eventRsvp));
    const input = eventRsvpInput({ amount });
    const first = await page.evaluate(value => window.CampusHubDebug.appendXpEvent(value), input);
    const replay = await page.evaluate(value => window.CampusHubDebug.appendXpEvent(value), input);
    const differentKey = await page.evaluate(value => window.CampusHubDebug.appendXpEvent({
      ...value,
      idempotencyKey: 'xp:award:event-rsvp:guild-debate:retry'
    }), input);
    const conflict = await page.evaluate(value => window.CampusHubDebug.appendXpEvent({
      ...value,
      amount: value.amount + 1
    }), input);
    expect(first.added).toBe(true);
    expect(replay).toMatchObject({ added: false, reason: 'idempotent' });
    expect(differentKey).toMatchObject({ added: false, reason: 'source-duplicate' });
    expect(conflict).toMatchObject({ added: false, reason: 'IDEMPOTENCY_CONFLICT' });
    expect((await readEvents(page)).filter(event => event.ruleRef === 'event-rsvp')).toHaveLength(1);
    expect(await readTotal(page)).toBe(340 + amount);
  });

  test('allows one Event RSVP award per distinct event source', async ({ page }) => {
    const amount = await page.evaluate(() => Number(window.CampusHubDemo.demoConfig.xp.eventRsvp));
    const first = await page.evaluate(value => window.CampusHubDebug.appendXpEvent(value), eventRsvpInput({
      amount,
      sourceId: 'event-A',
      idempotencyKey: 'xp:award:event-rsvp:event-A'
    }));
    const second = await page.evaluate(value => window.CampusHubDebug.appendXpEvent(value), eventRsvpInput({
      amount,
      sourceId: 'event-B',
      idempotencyKey: 'xp:award:event-rsvp:event-B'
    }));
    expect(first.added).toBe(true);
    expect(second.added).toBe(true);
    expect((await readEvents(page)).filter(event => event.ruleRef === 'event-rsvp')).toHaveLength(2);
    expect(await readTotal(page)).toBe(340 + amount * 2);
  });

  test('ledgerizes incorrect Quiz as participation only and correct Quiz as two explainable events', async ({ page }) => {
    await submitQuiz(page, '1');
    let events = await readEvents(page);
    expect(events.filter(event => event.sourceId === 'daily-quiz-2026-05-20')).toHaveLength(1);
    expect(events.find(event => event.ruleRef === 'daily-quiz-participation')).toMatchObject({ amount: 5, type: 'award' });
    expect(events.find(event => event.ruleRef === 'daily-quiz-accuracy')).toBeUndefined();
    expect(await readTotal(page)).toBe(345);

    await resetDemo(page);
    await submitQuiz(page, '0');
    events = await readEvents(page);
    expect(events.filter(event => event.sourceId === 'daily-quiz-2026-05-20')).toHaveLength(2);
    expect(events.filter(event => event.ruleRef === 'daily-quiz-participation')).toHaveLength(1);
    expect(events.filter(event => event.ruleRef === 'daily-quiz-accuracy')).toHaveLength(1);
    expect(events.some(event => event.ruleRef === 'daily-quiz' || event.amount === 10)).toBe(false);
    expect(await readTotal(page)).toBe(350);
    await expect(page.locator('#xpHistory')).toContainText('Daily Quiz participation');
    await expect(page.locator('#xpHistory')).toContainText('Daily Quiz accuracy bonus');
  });

  test('keeps Quiz duplicate attempts stable across a stale submit and reload', async ({ page }) => {
    await submitQuiz(page, '0');
    const before = await readEvents(page);
    await page.reload();
    await goTo(page, '#play');
    expect(await readEvents(page)).toEqual(before);
    expect(await readTotal(page)).toBe(350);
    await page.locator('#quizSubmit').evaluate(button => button.click());
    expect(await readEvents(page)).toEqual(before);
    expect(await readTotal(page)).toBe(350);
  });

  test('supports append-only correction and bounded reversal semantics', async ({ page }) => {
    await submitPoll(page);
    const original = (await readEvents(page)).find(event => event.ruleRef === 'poll-participation');
    const originalJson = JSON.stringify(original);
    const correction = await appendCorrection(page, 10);
    expect(correction.added).toBe(true);
    expect(await readTotal(page)).toBe(355);
    expect(JSON.stringify((await readEvents(page)).find(event => event.id === original.id))).toBe(originalJson);
    const reversal = await page.evaluate(eventId => window.CampusHubDebug.appendXpReversal(eventId, {
      amount: -5,
      idempotencyKey: 'xp:test:reversal:poll',
      ruleRef: 'poll-participation',
      sourceType: 'test',
      sourceId: 'poll-reversal',
      sourceAction: 'reverse',
      reason: 'Test reversal'
    }), original.id);
    expect(reversal.added).toBe(true);
    expect(await readTotal(page)).toBe(350);
    const invalidCorrection = await appendCorrection(page, -10);
    expect(invalidCorrection).toMatchObject({ added: false, reason: 'INVALID_CORRECTION_AMOUNT' });
    const missing = await page.evaluate(() => window.CampusHubDebug.appendXpReversal('missing-event', {
      amount: -1,
      idempotencyKey: 'xp:test:reversal:missing',
      ruleRef: 'test-reversal', sourceType: 'test', sourceId: 'missing', sourceAction: 'reverse', reason: 'Missing source'
    }));
    expect(missing).toMatchObject({ added: false, reason: 'PREREQUISITE_MISSING' });
    const excess = await page.evaluate(eventId => window.CampusHubDebug.appendXpReversal(eventId, {
      amount: -1,
      idempotencyKey: 'xp:test:reversal:excess',
      ruleRef: 'poll-participation', sourceType: 'test', sourceId: 'poll-reversal-2', sourceAction: 'reverse', reason: 'Excess reversal'
    }), original.id);
    expect(excess).toMatchObject({ added: false, reason: 'EXCESS_REVERSAL' });
  });

  test('keeps reached Level floor after a legitimate reversal lowers ledger XP', async ({ page }) => {
    const correction = await appendCorrection(page, 160);
    expect(correction.added).toBe(true);
    await goTo(page, '#play');
    await expect(page.locator('[data-field="xpCount"]')).toHaveText('500');
    await expect(page.locator('[data-field="levelDisplay"]')).toHaveText('Level 5');
    const reversal = await page.evaluate(eventId => window.CampusHubDebug.appendXpReversal(eventId, {
      amount: -5,
      idempotencyKey: 'xp:test:reversal:level-floor',
      ruleRef: 'test-correction', sourceType: 'test', sourceId: 'level-floor', sourceAction: 'reverse', reason: 'Level floor test'
    }), correction.event.id);
    expect(reversal.added).toBe(true);
    await goTo(page, '#me');
    await expect(page.locator('[data-field="meLevelXp"]')).toHaveText('Level 5 • 495 XP');
  });

  test('reconciles malformed duplicate ledger records and isolates foreign namespaces', async ({ page }) => {
    const events = await readEvents(page);
    await page.evaluate(({ key, foreignKey, duplicate }) => {
      const state = JSON.parse(localStorage.getItem(key));
      state.xpEvents.push(duplicate);
      localStorage.setItem(key, JSON.stringify(state));
      localStorage.setItem(foreignKey, JSON.stringify({
        schemaVersion: 3,
        tenantId: 'tenant-other', membershipId: 'membership-other-001',
        xpEvents: [{ id:'foreign', tenantId:'tenant-other', membershipId:'membership-other-001', ruleRef:'foreign', amount:9999,
          timestamp:new Date().toISOString(), idempotencyKey:'foreign', type:'award', sourceType:'foreign', sourceId:'foreign', sourceAction:'award' }]
      }));
    }, { key: V3_STATE_KEY, foreignKey: FOREIGN_STATE_KEY, duplicate: events[0] });
    await page.reload();
    const reconciliation = await page.evaluate(() => window.CampusHubDebug.reconcileXpLedger());
    expect(reconciliation.valid).toBe(false);
    expect(reconciliation.problems.join(' ')).toMatch(/DUPLICATE_EVENT_ID|DUPLICATE_IDEMPOTENCY_KEY/);
    await goTo(page, '#play');
    await expect(page.locator('[data-field="xpCount"]')).toHaveText('340');
    await expect(page.locator('#xpHistory')).not.toContainText('9999');
  });

  test('uses one permutation-stable projection for corrupt evidence and accepted reversals', async ({ page }) => {
    const baseline = await readState(page);
    const opening = baseline.xpEvents[0];
    const source = importedXpEvent({ id:'partial-source', ruleRef:'partial-source', amount:10, idempotencyKey:'partial-source-key', sourceId:'partial-source-id' });
    const partialA = importedXpEvent({ id:'partial-a', type:'reversal', amount:-3, idempotencyKey:'partial-a-key', sourceId:'partial-a-id', sourceAction:'reverse', referencesEventId:'partial-source', reason:'Partial reversal' });
    const partialB = importedXpEvent({ id:'partial-b', type:'reversal', amount:-2, idempotencyKey:'partial-b-key', sourceId:'partial-b-id', sourceAction:'reverse', referencesEventId:'partial-source', reason:'Partial reversal' });
    const excessSource = importedXpEvent({ id:'excess-source', ruleRef:'excess-source', amount:5, idempotencyKey:'excess-source-key', sourceId:'excess-source-id' });
    const excessA = importedXpEvent({ id:'excess-a', type:'reversal', amount:-4, idempotencyKey:'excess-a-key', sourceId:'excess-a-id', sourceAction:'reverse', referencesEventId:'excess-source', reason:'Excess reversal' });
    const excessB = importedXpEvent({ id:'excess-b', type:'reversal', amount:-2, idempotencyKey:'excess-b-key', sourceId:'excess-b-id', sourceAction:'reverse', referencesEventId:'excess-source', reason:'Excess reversal' });
    const duplicateA = importedXpEvent({ id:'duplicate-id', amount:1, idempotencyKey:'duplicate-a', sourceId:'duplicate-a' });
    const duplicateB = importedXpEvent({ id:'duplicate-id', amount:99, idempotencyKey:'duplicate-b', sourceId:'duplicate-b' });
    const idempotencyA = importedXpEvent({ id:'idempotency-a', amount:2, idempotencyKey:'conflicting-key', sourceId:'idempotency-a' });
    const idempotencyB = importedXpEvent({ id:'idempotency-b', amount:9, idempotencyKey:'conflicting-key', sourceId:'idempotency-b' });
    const sourceConflictA = importedXpEvent({ id:'source-conflict-a', ruleRef:'source-conflict', amount:3, idempotencyKey:'source-conflict-a-key', sourceId:'same-source', sourceAction:'award' });
    const sourceConflictB = importedXpEvent({ id:'source-conflict-b', ruleRef:'source-conflict', amount:7, idempotencyKey:'source-conflict-b-key', sourceId:'same-source', sourceAction:'award' });
    const missing = importedXpEvent({ id:'missing-source-reversal', type:'reversal', amount:-200, idempotencyKey:'missing-source-key', sourceId:'missing-source', sourceAction:'reverse', referencesEventId:'missing-id', reason:'Missing source' });
    const invalidCorrection = importedXpEvent({ id:'invalid-correction', type:'correction', amount:-4, idempotencyKey:'invalid-correction-key', sourceId:'invalid-correction', sourceAction:'correction', reason:'Invalid correction' });
    const invalidCorrectionReversal = importedXpEvent({ id:'invalid-correction-reversal', type:'reversal', amount:-1, idempotencyKey:'invalid-correction-reversal-key', sourceId:'invalid-correction-reversal', sourceAction:'reverse', referencesEventId:'invalid-correction', reason:'Invalid source' });
    const unknown = importedXpEvent({ id:'unknown-field', idempotencyKey:'unknown-field-key', sourceId:'unknown-field', banana:'value' });
    const importedPrivacy = importedXpEvent({ id:'imported-poll-sensitive', idempotencyKey:'imported-poll-sensitive-key', sourceId:'imported-poll-sensitive-source', selectedOption:'Poor' });
    const invalidDate = importedXpEvent({ id:'invalid-date', idempotencyKey:'invalid-date-key', sourceId:'invalid-date', tenantDay:'2026-02-30' });
    const rawEvents = [opening, source, partialA, partialB, excessSource, excessA, excessB, duplicateA, duplicateB, idempotencyA, idempotencyB, sourceConflictA, sourceConflictB, missing, invalidCorrection, invalidCorrectionReversal, unknown, importedPrivacy, invalidDate];
    const rawState = { ...baseline, xpEvents:rawEvents };
    await page.evaluate(({ key, state }) => localStorage.setItem(key, JSON.stringify(state)), { key: V3_STATE_KEY, state:rawState });
    await page.reload();
    const first = await page.evaluate(() => ({
      projection:window.CampusHubDebug.projectXpLedger(),
      reconciliation:window.CampusHubDebug.reconcileXpLedger(),
      total:window.CampusHubDebug.getXpTotal()
    }));
    expect(first.total).toBe(350);
    expect(first.reconciliation.total).toBe(first.total);
    expect(first.reconciliation.valid).toBe(false);
    expect(first.reconciliation.acceptedEventIds).toEqual(first.projection.acceptedEventIds);
    expect(first.projection.acceptedEventIds).toEqual([
      'partial-a', 'partial-b', 'partial-source', 'excess-source',
      opening.id
    ].sort());
    expect(first.projection.quarantinedEventIds).toEqual([
      'duplicate-id', 'excess-a', 'excess-b', 'idempotency-a', 'idempotency-b',
      'invalid-correction', 'invalid-correction-reversal', 'invalid-date',
      'imported-poll-sensitive', 'missing-source-reversal', 'source-conflict-a', 'source-conflict-b', 'unknown-field'
    ].sort());
    expect(first.projection.problems).toEqual([
      'DUPLICATE_EVENT_ID', 'DUPLICATE_IDEMPOTENCY_KEY', 'DUPLICATE_SOURCE', 'DUPLICATE_SOURCE_CONFLICT',
      'EXCESS_REVERSAL', 'IDEMPOTENCY_CONFLICT',
      'INVALID_CORRECTION_AMOUNT', 'INVALID_TENANT_DAY', 'PREREQUISITE_MISSING',
      'UNKNOWN_EVENT_FIELD'
    ].sort());
    await goTo(page, '#play');
    await expect(page.locator('#xpHistory')).not.toContainText('Missing source');
    await expect(page.locator('#xpHistory')).not.toContainText('Excess reversal');

    const permutedState = { ...rawState, xpEvents:rawEvents.slice().reverse() };
    await page.evaluate(({ key, state }) => localStorage.setItem(key, JSON.stringify(state)), { key: V3_STATE_KEY, state:permutedState });
    await page.reload();
    const second = await page.evaluate(() => window.CampusHubDebug.projectXpLedger());
    expect({ total:second.total, accepted:second.acceptedEventIds, quarantined:second.quarantinedEventIds, problems:second.problems })
      .toEqual({ total:first.projection.total, accepted:first.projection.acceptedEventIds, quarantined:first.projection.quarantinedEventIds, problems:first.projection.problems });
  });

  test('binds append idempotency to intent, rejects unknown fields, and validates real tenant days', async ({ page }) => {
    const input = {
      type:'award', ruleRef:'intent-test', amount:2, idempotencyKey:'intent-test-key',
      sourceType:'intent-test', sourceId:'intent-source', sourceAction:'complete', studentLabel:'Intent test'
    };
    const first = await page.evaluate(value => window.CampusHubDebug.appendXpEvent(value), input);
    const replay = await page.evaluate(value => window.CampusHubDebug.appendXpEvent({ ...value, id:'replay-id', timestamp:'2028-02-29T00:00:00Z', studentLabel:'Different presentation' }), input);
    const conflict = await page.evaluate(value => window.CampusHubDebug.appendXpEvent({ ...value, id:'conflict-id', amount:3 }), input);
    const unknown = await page.evaluate(value => window.CampusHubDebug.appendXpEvent({ ...value, id:'unknown-id', idempotencyKey:'unknown-key', banana:'value' }), input);
    const pollSensitive = await page.evaluate(value => window.CampusHubDebug.appendXpEvent({ ...value, id:'poll-sensitive-id', idempotencyKey:'poll-sensitive-key', sourceId:'poll-sensitive-source', selectedOption:'Poor' }), input);
    const impossibleDate = await page.evaluate(value => window.CampusHubDebug.appendXpEvent({ ...value, id:'date-id', idempotencyKey:'date-key', sourceId:'date-source', tenantDay:'2026-02-30' }), input);
    const realLeapDay = await page.evaluate(value => window.CampusHubDebug.appendXpEvent({ ...value, id:'leap-id', idempotencyKey:'leap-key', sourceId:'leap-source', tenantDay:'2028-02-29' }), input);
    expect(first.added).toBe(true);
    expect(replay).toMatchObject({ added:false, reason:'idempotent' });
    expect(conflict).toMatchObject({ added:false, reason:'IDEMPOTENCY_CONFLICT' });
    expect(unknown).toMatchObject({ added:false, reason:'UNKNOWN_EVENT_FIELD' });
    expect(pollSensitive).toMatchObject({ added:false, reason:'UNKNOWN_EVENT_FIELD' });
    expect(impossibleDate).toMatchObject({ added:false, reason:'INVALID_TENANT_DAY' });
    expect(realLeapDay.added).toBe(true);
    expect((await readEvents(page)).filter(event => event.ruleRef === 'intent-test')).toHaveLength(2);
  });

  test('keeps Poll and Quiz state, XP, and Streak atomic on persistence failure', async ({ page }) => {
    await page.evaluate(() => window.CampusHubDebug.setPersistenceScenario('fail'));
    await goTo(page, '#participate');
    await page.locator('#pollForm input[value="0"]').check();
    await page.locator('#submitPoll').click();
    await page.waitForTimeout(700);
    await expect(page.locator('#pollSuccess')).toBeHidden();
    expect(await readState(page)).toMatchObject({ pollDone: false, streakState: { count: 3 } });
    expect(await readTotal(page)).toBe(340);
    expect((await readEvents(page)).filter(event => event.ruleRef === 'poll-participation')).toHaveLength(0);
    await goTo(page, '#play');
    await page.locator('#quizOptions input[value="0"]').check();
    await page.locator('#quizSubmit').click();
    await page.waitForTimeout(250);
    await expect(page.locator('#quizCompleteNote')).toBeHidden();
    expect(await readState(page)).toMatchObject({ quizDone: false, streakState: { count: 3 } });
    expect(await readTotal(page)).toBe(340);
    expect((await readEvents(page)).filter(event => event.sourceId === 'daily-quiz-2026-05-20')).toHaveLength(0);
  });

  test('keeps non-award actions from adding XP except canonical RSVP and preserves fixture data', async ({ page }) => {
    const fixtureBefore = await page.evaluate(() => JSON.stringify(window.CampusHubDemo));
    const beforeEvents = await readEvents(page);
    const beforeTotal = await readTotal(page);
    await goTo(page, '#events/guild-debate');
    await page.locator('#eventSave').click();
    expect(await readTotal(page)).toBe(beforeTotal);
    expect(await readEvents(page)).toEqual(beforeEvents);
    await page.locator('#rsvpGoing').click();
    expect(await readTotal(page)).toBe(beforeTotal + 5);
    expect((await readEvents(page)).filter(event => event.ruleRef === 'event-rsvp')).toHaveLength(1);
    await goTo(page, '#opportunities/ra-climate');
    await page.locator('#oppSave').click();
    await goTo(page, '#voice-detail/voice-water-halls');
    await page.locator('#voiceSupportButton').click();
    await goTo(page, '#news/notice-classes-rescheduled');
    await goTo(page, '#play');
    expect((await readEvents(page)).length).toBe(beforeEvents.length + 1);
    expect(await readTotal(page)).toBe(beforeTotal + 5);
    expect(await page.evaluate(() => JSON.stringify(window.CampusHubDemo))).toBe(fixtureBefore);
  });

  test('renders only own recent XP rows and keeps Home, Play, and Me coherent', async ({ page }) => {
    await submitPoll(page);
    await submitQuiz(page, '0');
    await goTo(page, '#home');
    await expect(page.locator('[data-field="homeXp"]')).toHaveText('355 XP');
    await goTo(page, '#play');
    await expect(page.locator('[data-field="xpCount"]')).toHaveText('355');
    await expect(page.locator('[data-field="levelDisplay"]')).toHaveText('Level 4');
    const historyText = await page.locator('#xpHistory').innerText();
    expect(historyText).toContain('Poll participation');
    expect(historyText).toContain('Daily Quiz participation');
    expect(historyText).toContain('Daily Quiz accuracy bonus');
    expect(historyText).not.toMatch(/membership-demo-001|tenant-makerere|prototype-opening-balance|poll-restroom-cleanliness|idempotency/i);
    await goTo(page, '#me');
    await expect(page.locator('[data-field="meLevelXp"]')).toHaveText('Level 4 • 355 XP');
    const reloadedEvents = await readEvents(page);
    await page.reload();
    expect(await readEvents(page)).toEqual(reloadedEvents);
    expect(await readTotal(page)).toBe(355);
    expect((await readState(page))).not.toHaveProperty('xp');
  });
});
