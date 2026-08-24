import { expect, test } from '@playwright/test';

const CONTEXTS = [
  'poll',
  'voice-submission',
  'voice-support',
  'rsvp',
  'daily-quiz'
];

const CANONICAL_INPUT = {
  resourceContext: 'poll',
  tenantLifecycle: 'active',
  moduleEnabled: true,
  resourceActionable: true,
  membershipState: 'active',
  currentAssurance: 'L2',
  requiredAssurance: 'L2',
  audienceEligible: true,
  verifiedAttributesPresent: true,
  storyPrerequisitesMet: true
};

function input(overrides = {}) {
  return { ...CANONICAL_INPUT, ...overrides };
}

async function evaluate(page, candidate) {
  return page.evaluate(value => window.CampusHubParticipation.evaluate(value), candidate);
}

function expectDenial(decision, step, variant, resourceContext) {
  expect(decision.allowed).toBe(false);
  expect(decision.reason).toEqual({ step, variant, resourceContext });
  expect(decision).not.toHaveProperty('reasons');
  expect(decision).not.toHaveProperty('errors');
}

async function expectTypeError(page, candidate) {
  const error = await page.evaluate(value => {
    try {
      window.CampusHubParticipation.evaluate(value);
      return null;
    } catch (caught) {
      return { name: caught.name, message: caught.message };
    }
  }, candidate);
  expect(error?.name, `expected TypeError, received ${JSON.stringify(error)}`).toBe('TypeError');
}

test.describe('Phase 6A canonical GSC-14 participation evaluator', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'canonical-mobile', 'Pure evaluator contract runs once in canonical-mobile.');

    // Keep browser loading deterministic without changing the application UI.
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
  });

  test('exposes the small frozen API and allows the canonical all-pass input', async ({ page }) => {
    const api = await page.evaluate(() => ({
      exists: Boolean(window.CampusHubParticipation),
      steps: window.CampusHubParticipation.STEPS,
      contexts: window.CampusHubParticipation.CONTEXTS,
      apiFrozen: Object.isFrozen(window.CampusHubParticipation),
      stepsFrozen: Object.isFrozen(window.CampusHubParticipation.STEPS),
      contextsFrozen: Object.isFrozen(window.CampusHubParticipation.CONTEXTS)
    }));

    expect(api.exists).toBe(true);
    expect(api.apiFrozen).toBe(true);
    expect(api.stepsFrozen).toBe(true);
    expect(api.contextsFrozen).toBe(true);
    expect(api.steps).toEqual([
      'tenant-lifecycle',
      'module-enabled',
      'resource-actionable',
      'membership-state',
      'assurance',
      'audience',
      'verified-attributes',
      'story-prerequisites'
    ]);
    expect(api.contexts).toEqual(CONTEXTS);

    await expect(evaluate(page, input())).resolves.toEqual({ allowed: true });
  });

  const individualFailures = [
    {
      label: 'tenant lifecycle',
      overrides: { tenantLifecycle: 'inactive' },
      step: 'tenant-lifecycle',
      variant: 'tenant-inactive',
      context: 'poll'
    },
    {
      label: 'module enabled',
      overrides: { moduleEnabled: false },
      step: 'module-enabled',
      variant: 'module-unavailable',
      context: 'voice-submission'
    },
    {
      label: 'poll resource actionability',
      overrides: { resourceActionable: false },
      step: 'resource-actionable',
      variant: 'poll-closed',
      context: 'poll'
    },
    {
      label: 'non-poll resource actionability',
      overrides: { resourceActionable: false },
      step: 'resource-actionable',
      variant: 'resource-unavailable',
      context: 'rsvp'
    },
    {
      label: 'membership state',
      overrides: { membershipState: 'refresh' },
      step: 'membership-state',
      variant: 'membership-refresh',
      context: 'voice-support'
    },
    {
      label: 'assurance',
      overrides: { currentAssurance: 'L1', requiredAssurance: 'L2' },
      step: 'assurance',
      variant: 'assurance-required',
      context: 'daily-quiz'
    },
    {
      label: 'audience',
      overrides: { audienceEligible: false },
      step: 'audience',
      variant: 'audience-ineligible',
      context: 'poll'
    },
    {
      label: 'verified attributes',
      overrides: { verifiedAttributesPresent: false },
      step: 'verified-attributes',
      variant: 'attributes-required',
      context: 'voice-submission'
    },
    {
      label: 'story prerequisites',
      overrides: { storyPrerequisitesMet: false },
      step: 'story-prerequisites',
      variant: 'prerequisites-unmet',
      context: 'rsvp'
    }
  ];

  for (const failure of individualFailures) {
    test(`returns the canonical ${failure.label} denial`, async ({ page }) => {
      const decision = await evaluate(page, input({ resourceContext: failure.context, ...failure.overrides }));
      expectDenial(decision, failure.step, failure.variant, failure.context);
    });
  }

  test('enforces first-failure-wins through the complete GSC-14 sequence', async ({ page }) => {
    const allFailures = {
      tenantLifecycle: 'inactive',
      moduleEnabled: false,
      resourceActionable: false,
      membershipState: 'refresh',
      currentAssurance: 'L0',
      requiredAssurance: 'L2',
      audienceEligible: false,
      verifiedAttributesPresent: false,
      storyPrerequisitesMet: false
    };
    const sequence = [
      { pass: {}, step: 'tenant-lifecycle', variant: 'tenant-inactive' },
      { pass: { tenantLifecycle: 'active' }, step: 'module-enabled', variant: 'module-unavailable' },
      { pass: { tenantLifecycle: 'active', moduleEnabled: true }, step: 'resource-actionable', variant: 'poll-closed' },
      { pass: { tenantLifecycle: 'active', moduleEnabled: true, resourceActionable: true }, step: 'membership-state', variant: 'membership-refresh' },
      { pass: { tenantLifecycle: 'active', moduleEnabled: true, resourceActionable: true, membershipState: 'active' }, step: 'assurance', variant: 'assurance-required' },
      { pass: { tenantLifecycle: 'active', moduleEnabled: true, resourceActionable: true, membershipState: 'active', currentAssurance: 'L2' }, step: 'audience', variant: 'audience-ineligible' },
      { pass: { tenantLifecycle: 'active', moduleEnabled: true, resourceActionable: true, membershipState: 'active', currentAssurance: 'L2', audienceEligible: true }, step: 'verified-attributes', variant: 'attributes-required' },
      { pass: { tenantLifecycle: 'active', moduleEnabled: true, resourceActionable: true, membershipState: 'active', currentAssurance: 'L2', audienceEligible: true, verifiedAttributesPresent: true }, step: 'story-prerequisites', variant: 'prerequisites-unmet' },
      { pass: { tenantLifecycle: 'active', moduleEnabled: true, resourceActionable: true, membershipState: 'active', currentAssurance: 'L2', audienceEligible: true, verifiedAttributesPresent: true, storyPrerequisitesMet: true }, allowed: true }
    ];

    for (const stage of sequence) {
      const decision = await evaluate(page, input({ ...allFailures, ...stage.pass }));
      if (stage.allowed) {
        expect(decision).toEqual({ allowed: true });
      } else {
        expectDenial(decision, stage.step, stage.variant, 'poll');
      }
    }
  });

  test('compares assurance using the canonical L0-to-L3 ranking', async ({ page }) => {
    const cases = [
      { currentAssurance: 'L0', requiredAssurance: 'L0', allowed: true },
      { currentAssurance: 'L1', requiredAssurance: 'L2', allowed: false },
      { currentAssurance: 'L2', requiredAssurance: 'L2', allowed: true },
      { currentAssurance: 'L3', requiredAssurance: 'L2', allowed: true },
      { currentAssurance: 'L2', requiredAssurance: 'L3', allowed: false }
    ];

    for (const assuranceCase of cases) {
      const decision = await evaluate(page, input(assuranceCase));
      if (assuranceCase.allowed) {
        expect(decision).toEqual({ allowed: true });
      } else {
        expectDenial(decision, 'assurance', 'assurance-required', 'poll');
      }
    }
  });

  test('keeps context from changing the evaluator order', async ({ page }) => {
    const allFailures = {
      tenantLifecycle: 'inactive',
      moduleEnabled: false,
      resourceActionable: false,
      membershipState: 'refresh',
      currentAssurance: 'L0',
      requiredAssurance: 'L2',
      audienceEligible: false,
      verifiedAttributesPresent: false,
      storyPrerequisitesMet: false
    };

    for (const resourceContext of CONTEXTS) {
      const decision = await evaluate(page, input({ resourceContext, ...allFailures }));
      expectDenial(decision, 'tenant-lifecycle', 'tenant-inactive', resourceContext);
    }
  });

  test('returns exactly one primary reason for every denied decision', async ({ page }) => {
    const deniedInputs = individualFailures.map(failure => input({
      resourceContext: failure.context,
      ...failure.overrides
    }));

    for (const candidate of deniedInputs) {
      const decision = await evaluate(page, candidate);
      expect(decision.allowed).toBe(false);
      expect(Object.keys(decision).sort()).toEqual(['allowed', 'reason']);
      expect(Object.keys(decision.reason).sort()).toEqual(['resourceContext', 'step', 'variant']);
      expect(Array.isArray(decision.reason)).toBe(false);
      expect(decision).not.toHaveProperty('reasons');
      expect(decision).not.toHaveProperty('errors');
    }
  });

  test('throws TypeError for malformed or unknown evaluator input', async ({ page }) => {
    const missingResourceContext = input();
    delete missingResourceContext.resourceContext;
    const missingRequiredAssurance = input();
    delete missingRequiredAssurance.requiredAssurance;
    const missingAudience = input();
    delete missingAudience.audienceEligible;

    const malformedCases = [
      missingResourceContext,
      input({ resourceContext: 'unknown-context' }),
      missingRequiredAssurance,
      input({ currentAssurance: 'verified' }),
      missingAudience
    ];

    for (const candidate of malformedCases) {
      await expectTypeError(page, candidate);
    }
  });

  test('does not mutate a frozen input object', async ({ page }) => {
    const candidate = Object.freeze(input({ resourceContext: 'voice-support' }));
    const snapshot = { ...candidate };

    await expect(evaluate(page, candidate)).resolves.toEqual({ allowed: true });
    expect(candidate).toEqual(snapshot);
  });
});
