import { expect, test } from '@playwright/test';

const canonicalInput = (overrides = {}) => ({
  activityType: 'daily-quiz',
  tenantDay: '2026-05-20',
  currentStreak: 0,
  lastQualifiedTenantDay: null,
  previousActiveTenantDay: null,
  isInRecess: false,
  ...overrides
});

async function apply(page, overrides = {}) {
  return page.evaluate(input => window.CampusHubStreak.applyQualifyingActivity(input), canonicalInput(overrides));
}

async function thrownError(page, overrides = {}) {
  return page.evaluate(input => {
    try {
      window.CampusHubStreak.applyQualifyingActivity(input);
      return null;
    } catch(error) {
      return { name: error.name, message: error.message };
    }
  }, canonicalInput(overrides));
}

test.describe('Phase 8B canonical tenant-day streak engine', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'canonical-mobile', 'Pure streak contract runs once in canonical-mobile.');
    await page.goto('/#home');
    await page.waitForFunction(() => typeof window.CampusHubStreak?.applyQualifyingActivity === 'function');
  });

  test('exposes exactly the four qualifying activities as frozen data', async ({ page }) => {
    const api = await page.evaluate(() => ({
      keys: Object.keys(window.CampusHubStreak),
      activities: window.CampusHubStreak.QUALIFYING_ACTIVITIES,
      frozen: Object.isFrozen(window.CampusHubStreak.QUALIFYING_ACTIVITIES)
    }));
    expect(api.keys).toEqual(['applyQualifyingActivity', 'QUALIFYING_ACTIVITIES']);
    expect(api.activities).toEqual(['daily-quiz', 'poll-response', 'event-rsvp', 'voice-submission']);
    expect(api.frozen).toBe(true);
  });

  test('starts a first active-day streak at one', async ({ page }) => {
    await expect(apply(page)).resolves.toEqual({
      streak: 1,
      lastQualifiedTenantDay: '2026-05-20',
      qualifiedToday: true,
      outcome: 'incremented'
    });
  });

  test('increments on the immediately preceding active tenant day', async ({ page }) => {
    await expect(apply(page, {
      currentStreak: 3,
      lastQualifiedTenantDay: '2026-05-19',
      previousActiveTenantDay: '2026-05-19'
    })).resolves.toEqual({
      streak: 4,
      lastQualifiedTenantDay: '2026-05-20',
      qualifiedToday: true,
      outcome: 'incremented'
    });
  });

  test('does not increment after a second qualifying activity on the same tenant day', async ({ page }) => {
    await expect(apply(page, {
      currentStreak: 3,
      lastQualifiedTenantDay: '2026-05-20',
      previousActiveTenantDay: '2026-05-19'
    })).resolves.toEqual({
      streak: 3,
      lastQualifiedTenantDay: '2026-05-20',
      qualifiedToday: true,
      outcome: 'already-qualified'
    });
  });

  test('does not increment when a different activity follows on the same tenant day', async ({ page }) => {
    await expect(apply(page, {
      activityType: 'poll-response',
      currentStreak: 3,
      lastQualifiedTenantDay: '2026-05-20',
      previousActiveTenantDay: '2026-05-19'
    })).resolves.toMatchObject({ streak: 3, outcome: 'already-qualified' });
  });

  test('resets and starts at one after a missed in-session day', async ({ page }) => {
    await expect(apply(page, {
      currentStreak: 4,
      lastQualifiedTenantDay: '2026-05-18',
      previousActiveTenantDay: '2026-05-19'
    })).resolves.toEqual({
      streak: 1,
      lastQualifiedTenantDay: '2026-05-20',
      qualifiedToday: true,
      outcome: 'reset-and-started'
    });
  });

  test('pauses without changing state during recess', async ({ page }) => {
    await expect(apply(page, {
      currentStreak: 4,
      lastQualifiedTenantDay: '2026-05-18',
      previousActiveTenantDay: '2026-05-19',
      isInRecess: true
    })).resolves.toEqual({
      streak: 4,
      lastQualifiedTenantDay: '2026-05-18',
      qualifiedToday: false,
      outcome: 'recess-paused'
    });
  });

  test('continues the prior streak on the first active day after recess', async ({ page }) => {
    await expect(apply(page, {
      tenantDay: '2026-06-08',
      currentStreak: 5,
      lastQualifiedTenantDay: '2026-05-29',
      previousActiveTenantDay: '2026-05-29'
    })).resolves.toEqual({
      streak: 6,
      lastQualifiedTenantDay: '2026-06-08',
      qualifiedToday: true,
      outcome: 'incremented'
    });
  });

  test('counts voice submission as a qualifying activity', async ({ page }) => {
    await expect(apply(page, { activityType: 'voice-submission' })).resolves.toMatchObject({
      streak: 1,
      qualifiedToday: true,
      outcome: 'incremented'
    });
  });

  test('rejects voice support as non-qualifying', async ({ page }) => {
    const error = await thrownError(page, { activityType: 'voice-support' });
    expect(error?.name).toBe('TypeError');
  });

  test('rejects an unknown activity type', async ({ page }) => {
    const error = await thrownError(page, { activityType: 'app-open' });
    expect(error?.name).toBe('TypeError');
  });

  test('rejects malformed tenant-day values', async ({ page }) => {
    const errors = await Promise.all([
      thrownError(page, { tenantDay: '20/05/2026' }),
      thrownError(page, { tenantDay: '2026-02-30' }),
      thrownError(page, { tenantDay: 'May 20' })
    ]);
    errors.forEach(error => expect(error?.name).toBe('TypeError'));
  });

  test('rejects malformed previous and last qualified tenant days', async ({ page }) => {
    const previousError = await thrownError(page, { previousActiveTenantDay: '2026-5-19' });
    const lastError = await thrownError(page, { lastQualifiedTenantDay: '2026-13-01' });
    expect(previousError?.name).toBe('TypeError');
    expect(lastError?.name).toBe('TypeError');
  });

  test('rejects negative, fractional and numeric-string streaks', async ({ page }) => {
    const errors = await Promise.all([
      thrownError(page, { currentStreak: -1 }),
      thrownError(page, { currentStreak: 1.5 }),
      thrownError(page, { currentStreak: '1' })
    ]);
    errors.forEach(error => expect(error?.name).toBe('TypeError'));
  });

  test('does not mutate the supplied input object', async ({ page }) => {
    const result = await page.evaluate(input => {
      const before = JSON.stringify(input);
      const output = window.CampusHubStreak.applyQualifyingActivity(input);
      return { before, after: JSON.stringify(input), output };
    }, canonicalInput({ currentStreak: 3, lastQualifiedTenantDay: '2026-05-19', previousActiveTenantDay: '2026-05-19' }));
    expect(result.after).toBe(result.before);
    expect(result.output.streak).toBe(4);
  });

  test('freezes the result and returns no mutable or XP state', async ({ page }) => {
    const result = await page.evaluate(input => {
      const output = window.CampusHubStreak.applyQualifyingActivity(input);
      return {
        frozen: Object.isFrozen(output),
        keys: Object.keys(output),
        hasXp: Object.prototype.hasOwnProperty.call(output, 'xp'),
        hasLedger: Object.prototype.hasOwnProperty.call(output, 'ledger')
      };
    }, canonicalInput());
    expect(result.frozen).toBe(true);
    expect(result.keys).toEqual(['streak', 'lastQualifiedTenantDay', 'qualifiedToday', 'outcome']);
    expect(result.hasXp).toBe(false);
    expect(result.hasLedger).toBe(false);
  });
});
