import { expect, test } from '@playwright/test';

const FONT_ROUTES = Object.freeze([
  'https://fonts.googleapis.com/**',
  'https://fonts.gstatic.com/**'
]);

async function blockRemoteFonts(page) {
  for (const url of FONT_ROUTES) {
    await page.route(url, route => route.fulfill({
      status: 200,
      contentType: url.includes('gstatic') ? 'font/woff2' : 'text/css',
      body: ''
    }));
  }
}

async function resetAndGo(page) {
  await page.goto('/#home');
  await page.waitForFunction(() => typeof window.CampusHubDebug?.resetDemo === 'function');
  await page.evaluate(() => window.CampusHubDebug.resetDemo());
  await page.evaluate(() => document.querySelectorAll('#toastWrap .toast').forEach(toast => toast.remove()));
  await page.goto('/#opportunities/ra-climate');
  await expect(page.locator('#view-opportunity')).toBeVisible();
}

async function storedState(page) {
  return page.evaluate(() => JSON.parse(localStorage.getItem('campushub:state:v3:tenant-makerere:membership-demo-001')));
}

async function setAssuranceLevel(page, level) {
  await page.evaluate(nextLevel => {
    const state = window.CampusHubDebug.getCurrentState();
    state.membership.assuranceLevel = nextLevel;
    state.membership.status = 'active';
    state.participation.demoScenario = 'normal';
    localStorage.setItem(window.CampusHubDebug.getStateStorageKey(), JSON.stringify(state));
  }, level);
  await page.reload();
  await expect(page.locator('#view-opportunity')).toBeVisible();
}

async function setOpportunityScenario(page, name) {
  await page.evaluate(scenario => window.CampusHubDebug.setOpportunityScenario(scenario), name);
  await expect(page.locator('#view-opportunity')).toBeVisible();
}

test.describe('Opportunity external destination safety', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'canonical-mobile', 'Detailed Opportunity contract tests run once on the canonical mobile project.');
    await blockRemoteFonts(page);
    await page.emulateMedia({ reducedMotion: 'reduce' });
  });

  test('renders canonical detail facts and a validated Apply action', async ({ page }) => {
    await resetAndGo(page);

    const opportunityContract = await page.evaluate(() => {
      const opportunity = window.CampusHubDemo.opportunity;
      const acceptedTypes = [
        'internship',
        'scholarship',
        'fellowship',
        'graduate_role',
        'competition',
        'hackathon',
        'volunteering',
        'campus_role'
      ];
      return {
        type: opportunity.type,
        workArrangement: opportunity.workArrangement,
        typeIsAccepted: acceptedTypes.includes(opportunity.type)
      };
    });
    expect(opportunityContract).toEqual({
      type: 'campus_role',
      workArrangement: 'Part-time',
      typeIsAccepted: true
    });

    await expect(page.locator('[data-field="oppDetailTitle"]')).toHaveText('Research Assistant — Climate Resilience');
    await expect(page.locator('[data-field="oppProvider2"]')).toHaveText('Makerere University — Department of Geography');
    await expect(page.locator('[data-field="oppDeadline2"]')).toHaveText('30 May 2026');
    await expect(page.locator('[data-field="oppLocation"]')).toHaveText('Main Campus');
    await expect(page.locator('[data-field="oppWorkArrangement"]')).toHaveText('Part-time');
    await expect(page.locator('[data-field="oppDescription"]')).toContainText('climate adaptation strategies');
    await expect(page.locator('[data-field="oppEligibility"]')).toContainText('Year 2+ Geography');
    await expect(page.locator('[data-field="oppRequiredAssurance"]')).toHaveText('L2 required');
    await expect(page.locator('#oppRequirements')).toContainText('CV');
    await expect(page.locator('#oppRequirements')).toContainText('Brief motivation');
    await expect(page.locator('#oppRequirements')).toContainText('Academic transcript');
    await expect(page.locator('#oppApply')).toHaveText('Apply on provider site');
    await expect(page.locator('#oppApply')).toBeVisible();
    await expect(page.locator('#oppApply')).toBeEnabled();
    await expect(page.locator('#oppAssuranceNote')).toBeHidden();
    await expect(page.locator('#oppReviewVerification')).toBeHidden();
    await expect(page.locator('#view-opportunity')).toHaveAttribute('data-opportunity-apply-policy', 'allowed');
    expect(await page.evaluate(() => window.CampusHubDebug.evaluateOpportunityAction())).toMatchObject({
      allowed: true,
      reason: null,
      requiredAssurance: 'L2',
      currentAssurance: 'L2'
    });
    await expect(page.locator('#oppReport')).toHaveText('Report suspicious opportunity');
    await expect(page.locator('#leaveCampusHubContinue')).toHaveAttribute('href', 'https://www.mak.ac.ug/');
  });

  test('allows L3 assurance without changing the canonical Apply experience', async ({ page }) => {
    await resetAndGo(page);
    await setAssuranceLevel(page, 3);

    await expect(page.locator('[data-field="oppRequiredAssurance"]')).toHaveText('L2 required');
    await expect(page.locator('#oppApply')).toHaveText('Apply on provider site');
    await expect(page.locator('#oppApply')).toBeVisible();
    await expect(page.locator('#oppApply')).toBeEnabled();
    await expect(page.locator('#oppAssuranceNote')).toBeHidden();
    await expect(page.locator('#oppReviewVerification')).toBeHidden();
    expect(await page.evaluate(() => window.CampusHubDebug.evaluateOpportunityAction())).toMatchObject({
      allowed: true,
      requiredAssurance: 'L2',
      currentAssurance: 'L3'
    });

    await page.locator('#oppApply').click();
    await expect(page.locator('#leaveCampusHubDialog')).toBeVisible();
  });

  test('keeps the Opportunity readable but replaces Apply with verification at L1', async ({ page }) => {
    await resetAndGo(page);
    await page.evaluate(() => window.CampusHubDebug.setScenario('assurance-required'));

    await expect(page.locator('#view-opportunity')).toHaveAttribute('data-opportunity-apply-policy', 'ASSURANCE_REQUIRED');
    await expect(page.locator('[data-field="oppRequiredAssurance"]')).toHaveText('L2 required');
    await expect(page.locator('[data-field="oppDetailTitle"]')).toHaveText('Research Assistant — Climate Resilience');
    await expect(page.locator('[data-field="oppProvider2"]')).toContainText('Makerere University');
    await expect(page.locator('[data-field="oppDeadline2"]')).toHaveText('30 May 2026');
    await expect(page.locator('[data-field="oppDescription"]')).toContainText('climate adaptation strategies');
    await expect(page.locator('[data-field="oppEligibility"]')).toContainText('Year 2+ Geography');
    await expect(page.locator('#oppRequirements')).toContainText('Academic transcript');
    await expect(page.locator('#oppApply')).toBeHidden();
    await expect(page.locator('#oppApply')).toBeDisabled();
    await expect(page.locator('#oppReviewVerification')).toBeVisible();
    await expect(page.locator('#oppReviewVerification')).toHaveText('Review verification');
    await expect(page.locator('#oppReviewVerification')).toHaveAttribute('href', '#verification');
    await expect(page.locator('#oppReviewVerification')).toHaveAttribute('aria-label', 'Review verification to continue to Research Assistant — Climate Resilience');
    await expect(page.locator('#oppAssuranceNote')).toHaveText('L2 — Roster Match is required to continue to the provider application.');
    await expect(page.locator('#oppAssuranceNote')).toBeVisible();
    await expect(page.locator('#oppReport')).toBeEnabled();
    await expect(page.locator('#oppSave')).toBeEnabled();
    await expect(page.locator('#leaveCampusHubDialog')).toBeHidden();
    expect(await page.evaluate(() => window.CampusHubDebug.evaluateOpportunityAction())).toEqual({
      allowed: false,
      reason: 'ASSURANCE_REQUIRED',
      requiredAssurance: 'L2',
      currentAssurance: 'L1'
    });

    // Programmatic activation cannot bypass the policy or open the external dialog.
    await page.evaluate(() => document.querySelector('#oppApply')?.click());
    await expect(page.locator('#leaveCampusHubDialog')).toBeHidden();
  });

  test('applies the same calm denial at L0', async ({ page }) => {
    await resetAndGo(page);
    await setAssuranceLevel(page, 0);

    await expect(page.locator('#oppApply')).toBeHidden();
    await expect(page.locator('#oppReviewVerification')).toBeVisible();
    await expect(page.locator('#oppAssuranceNote')).toHaveText('L2 — Roster Match is required to continue to the provider application.');
    await expect(page.locator('#leaveCampusHubDialog')).toBeHidden();
    expect(await page.evaluate(() => window.CampusHubDebug.evaluateOpportunityAction())).toMatchObject({
      allowed: false,
      reason: 'ASSURANCE_REQUIRED',
      requiredAssurance: 'L2',
      currentAssurance: 'L0'
    });
  });

  test('routes denied Apply to Verification and returns to the Opportunity', async ({ page }) => {
    await resetAndGo(page);
    await page.evaluate(() => window.CampusHubDebug.setScenario('assurance-required'));

    await page.locator('#oppReviewVerification').click();
    await expect(page.locator('#view-verification')).toBeVisible();
    await expect(page.locator('[data-field="assuranceTitle"]')).toHaveText('L1 — Weak Affiliation');
    await expect(page.locator('#leaveCampusHubDialog')).toBeHidden();
    expect(new URL(page.url()).hash).toBe('#verification');

    await page.locator('#view-verification [data-back]').click();
    await expect(page.locator('#view-opportunity')).toBeVisible();
    expect(new URL(page.url()).hash).toBe('#opportunities/ra-climate');
    await expect(page.locator('#oppReviewVerification')).toBeVisible();
    await expect(page.locator('#oppApply')).toBeHidden();
  });

  test('does not automatically resume the external hand-off after assurance improves', async ({ page }) => {
    await resetAndGo(page);
    await page.evaluate(() => window.CampusHubDebug.setScenario('assurance-required'));
    await page.locator('#oppReviewVerification').click();
    await expect(page.locator('#view-verification')).toBeVisible();

    await page.locator('#startRosterMatch').click();
    await expect(page.locator('[data-field="assuranceTitle"]')).toHaveText('L2 — Roster Match');
    await expect(page.locator('#leaveCampusHubDialog')).toBeHidden();
    await page.locator('#view-verification [data-back]').click();
    await expect(page.locator('#view-opportunity')).toBeVisible();
    await expect(page.locator('#oppApply')).toBeVisible();
    await expect(page.locator('#oppApply')).toBeEnabled();
    await expect(page.locator('#leaveCampusHubDialog')).toBeHidden();

    await page.locator('#oppApply').click();
    await expect(page.locator('#leaveCampusHubDialog')).toBeVisible();
  });

  test('removes a previously open dialog when assurance drops while the page is open', async ({ page }) => {
    await resetAndGo(page);
    await page.locator('#oppApply').click();
    await expect(page.locator('#leaveCampusHubDialog')).toBeVisible();

    await page.evaluate(() => window.CampusHubDebug.setScenario('assurance-required'));
    await expect(page.locator('#leaveCampusHubDialog')).toBeHidden();
    await expect(page.locator('#oppApply')).toBeHidden();
    await expect(page.locator('#oppReviewVerification')).toBeVisible();
    await expect(page.locator('#leaveCampusHubContinue')).toBeHidden();
    expect(await page.locator('#leaveCampusHubContinue').getAttribute('href')).toBeNull();
  });

  test('opens the dedicated native leave-campus dialog without changing route', async ({ page }) => {
    await resetAndGo(page);
    const routeBefore = page.url();

    await page.locator('#oppApply').click();
    const dialog = page.locator('#leaveCampusHubDialog');
    await expect(dialog).toBeVisible();
    await expect(page.locator('#leaveCampusHubTitle')).toHaveText("You're leaving CampusHub.");
    await expect(page.locator('#leaveCampusHubBody')).toHaveText("The provider's own application rules apply. CampusHub never asks for payments or deposits.");
    await expect(page.locator('#leaveCampusHubContinue')).toHaveText('Continue');
    await expect(page.locator('#leaveCampusHubStay')).toHaveText('Stay here');
    await expect(dialog).toHaveAttribute('aria-labelledby', 'leaveCampusHubTitle');
    await expect(dialog).toHaveAttribute('aria-describedby', 'leaveCampusHubBody');
    await expect(dialog).toHaveAttribute('aria-modal', 'true');
    await expect(page.locator('#leaveCampusHubContinue')).toHaveAttribute('target', '_blank');
    await expect(page.locator('#leaveCampusHubContinue')).toHaveAttribute('rel', 'noopener noreferrer');
    await expect(page.locator('#leaveCampusHubContinue')).toHaveAttribute('href', 'https://www.mak.ac.ug/');
    await expect.poll(() => page.evaluate(() => document.activeElement?.id)).toBe('leaveCampusHubTitle');
    expect(page.url()).toBe(routeBefore);

    const actionSizes = await page.locator('#leaveCampusHubDialog .leave-campus-dialog__actions .btn').evaluateAll(buttons => buttons.map(button => {
      const rect = button.getBoundingClientRect();
      return { width: rect.width, height: rect.height };
    }));
    for (const size of actionSizes) {
      expect(size.width).toBeGreaterThanOrEqual(44);
      expect(size.height).toBeGreaterThanOrEqual(44);
    }
  });

  test('Stay here and Escape close the dialog and restore focus to Apply', async ({ page }) => {
    await resetAndGo(page);
    const apply = page.locator('#oppApply');
    const dialog = page.locator('#leaveCampusHubDialog');

    await apply.click();
    await page.locator('#leaveCampusHubStay').click();
    await expect(dialog).toBeHidden();
    await expect(apply).toBeFocused();

    await apply.click();
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(apply).toBeFocused();
    expect(page.url()).toContain('#opportunities/ra-climate');
  });

  test('invalid or missing destinations hide Apply without fallback navigation', async ({ page }) => {
    await resetAndGo(page);
    const invalidValues = ['http://example.com/apply', 'javascript:alert(1)', 'data:text/html,blocked', '/relative/apply', '#fragment', '', 'not a URL'];

    for (const value of invalidValues) {
      await page.evaluate(nextValue => {
        window.CampusHubDemo.opportunity.externalUrl = nextValue;
        window.location.hash = '#discover';
      }, value);
      await expect(page.locator('#view-discover')).toBeVisible();
      await page.evaluate(() => { window.location.hash = '#opportunities/ra-climate'; });
      await expect(page.locator('#view-opportunity')).toBeVisible();
      await expect(page.locator('#oppApply')).toBeHidden();
      await expect(page.locator('#leaveCampusHubDialog')).toBeHidden();
      expect(await page.locator('#leaveCampusHubContinue').getAttribute('href')).toBeNull();
      expect(page.url()).toContain('#opportunities/ra-climate');
    }
  });

  test('gives lifecycle and destination failures precedence over assurance', async ({ page }) => {
    await resetAndGo(page);
    await setOpportunityScenario(page, 'expired');
    await page.evaluate(() => window.CampusHubDebug.setScenario('assurance-required'));

    await expect(page.locator('#oppStatus')).toHaveText('Expired');
    await expect(page.locator('#oppApply')).toBeHidden();
    await expect(page.locator('#oppReviewVerification')).toBeHidden();
    await expect(page.locator('#oppAssuranceNote')).toBeHidden();
    await expect(page.locator('#oppReport')).toBeEnabled();
    expect(await page.evaluate(() => window.CampusHubDebug.evaluateOpportunityAction())).toMatchObject({
      allowed: false,
      reason: 'LIFECYCLE_UNAVAILABLE'
    });

    await page.evaluate(() => {
      window.CampusHubDemo.opportunity.externalUrl = 'http://example.com/apply';
      window.CampusHubDebug.setOpportunityScenario('normal');
    });
    await expect(page.locator('#oppStatus')).toBeHidden();
    await expect(page.locator('#oppApply')).toBeHidden();
    await expect(page.locator('#oppReviewVerification')).toBeHidden();
    await expect(page.locator('#oppAssuranceNote')).toBeHidden();
    expect(await page.evaluate(() => window.CampusHubDebug.evaluateOpportunityAction())).toMatchObject({
      allowed: false,
      reason: 'INVALID_DESTINATION'
    });
    await expect(page.locator('#leaveCampusHubDialog')).toBeHidden();
  });

  test('keeps Save and Report independent at L1 with no XP or Streak credit', async ({ page }) => {
    await resetAndGo(page);
    await page.evaluate(() => window.CampusHubDebug.setScenario('assurance-required'));
    const before = await storedState(page);

    await page.locator('#oppSave').click();
    await expect(page.locator('#oppSave')).toHaveText('Saved ✓');
    await page.locator('#oppReport').click();
    await expect(page.locator('#oppReport')).toHaveText('Report sent ✓');
    const after = await storedState(page);
    expect(after.saveOpp).toBe(true);
    expect(after.reportedOpportunityIds).toEqual(['ra-climate']);
    expect(after.xpEvents).toEqual(before.xpEvents);
    expect(after.streakState).toEqual(before.streakState);
    await expect(page.locator('#oppReviewVerification')).toBeVisible();
    await expect(page.locator('#leaveCampusHubDialog')).toBeHidden();
  });

  test('keeps the policy pure, safe, and outside GSC-14', async ({ page }) => {
    await resetAndGo(page);
    const decisions = await page.evaluate(() => {
      const opportunity = { ...window.CampusHubDemo.opportunity };
      const state = window.CampusHubDebug.getCurrentState();
      const at = level => ({ ...state, membership: { ...state.membership, assuranceLevel: level } });
      const decide = (entity, level) => window.CampusHubDebug.evaluateOpportunityAction(entity, at(level));
      return {
        ranks: ['L0', 'L1', 'L2', 'L3', 'L9', 'Verified', '', true].map(value => window.CampusHubDebug.assuranceRank(value)),
        l0: decide(opportunity, 0),
        l1: decide(opportunity, 1),
        l2: decide(opportunity, 2),
        l3: decide(opportunity, 3),
        requiredL0: decide({ ...opportunity, requiredAssurance: 'L0' }, 2),
        malformed: decide({ ...opportunity, requiredAssurance: 'L9' }, 3),
        expired: decide({ ...opportunity, deadlineTenantDay: '2020-01-01' }, 1),
        invalidUrl: decide({ ...opportunity, externalUrl: 'http://example.com' }, 1)
      };
    });
    expect(decisions.ranks).toEqual([0, 1, 2, 3, null, null, null, null]);
    expect(decisions.l0).toMatchObject({ allowed: false, reason: 'ASSURANCE_REQUIRED', requiredAssurance: 'L2', currentAssurance: 'L0' });
    expect(decisions.l1).toMatchObject({ allowed: false, reason: 'ASSURANCE_REQUIRED', requiredAssurance: 'L2', currentAssurance: 'L1' });
    expect(decisions.l2).toMatchObject({ allowed: true, reason: null, requiredAssurance: 'L2', currentAssurance: 'L2' });
    expect(decisions.l3).toMatchObject({ allowed: true, reason: null, requiredAssurance: 'L2', currentAssurance: 'L3' });
    expect(decisions.requiredL0).toMatchObject({ allowed: true, reason: null, requiredAssurance: 'L0', currentAssurance: 'L2' });
    expect(decisions.malformed).toMatchObject({ allowed: false, reason: 'INVALID_POLICY' });
    expect(decisions.expired).toMatchObject({ allowed: false, reason: 'LIFECYCLE_UNAVAILABLE' });
    expect(decisions.invalidUrl).toMatchObject({ allowed: false, reason: 'INVALID_DESTINATION' });
  });

  test('reports once, persists idempotently, and does not award XP or streak credit', async ({ page }) => {
    await resetAndGo(page);
    const before = await storedState(page);
    const report = page.locator('#oppReport');

    await report.click();
    await expect(page.locator('#toastWrap .toast span').last()).toHaveText('Report received. The Guild office reviews every report.');
    await expect(report).toHaveText('Report sent ✓');
    await expect(report).toBeDisabled();
    const after = await storedState(page);
    expect(after.reportedOpportunityIds).toEqual(['ra-climate']);
    expect(after.xpEvents).toEqual(before.xpEvents);
    expect(after.streakState).toEqual(before.streakState);

    await page.reload();
    await expect(page.locator('#view-opportunity')).toBeVisible();
    await expect(page.locator('#oppReport')).toHaveText('Report sent ✓');
    await expect(page.locator('#oppReport')).toBeDisabled();
    expect((await storedState(page)).reportedOpportunityIds).toEqual(['ra-climate']);
  });

  test('normalizes old state without reportedOpportunityIds and preserves Save behavior', async ({ page }) => {
    await resetAndGo(page);
    await page.evaluate(() => {
    const current = JSON.parse(localStorage.getItem('campushub:state:v3:tenant-makerere:membership-demo-001'));
    localStorage.setItem('campushub:state:v3:tenant-makerere:membership-demo-001', JSON.stringify({
        ...current,
        saveOpp: true,
        xpEvents: [{ ...current.xpEvents[0], amount: 321 }],
        legacyMarker: 'preserved'
      }));
    });
    await page.reload();
    await expect(page.locator('#oppSave')).toHaveText('Saved ✓');
    const migrated = await storedState(page);
    expect(migrated.reportedOpportunityIds).toEqual([]);
    expect(migrated.legacyMarker).toBe('preserved');
    expect(migrated).not.toHaveProperty('xp');
    expect(migrated.xpEvents[0].amount).toBe(321);
  });

  test('keeps detail and dialog usable across the required responsive matrix', async ({ page }) => {
    await resetAndGo(page);
    const sizes = [
      { width: 320, height: 844 },
      { width: 390, height: 844 },
      { width: 430, height: 932 },
      { width: 768, height: 1024 },
      { width: 1280, height: 900 }
    ];

    for (const size of sizes) {
      await page.setViewportSize(size);
      await page.goto('/#opportunities/ra-climate');
      await expect(page.locator('#view-opportunity')).toBeVisible();
      const detailLayout = await page.evaluate(() => ({
        documentWidth: document.documentElement.scrollWidth,
        viewportWidth: window.innerWidth,
        actions: ['#oppApply', '#oppSave', '#oppReport'].map(selector => {
          const rect = document.querySelector(selector).getBoundingClientRect();
          return { width: rect.width, height: rect.height };
        })
      }));
      expect(detailLayout.documentWidth).toBeLessThanOrEqual(detailLayout.viewportWidth + 1);
      for (const action of detailLayout.actions) {
        expect(action.width).toBeGreaterThan(0);
        expect(action.height).toBeGreaterThan(0);
      }

      await page.locator('#oppApply').click();
      await expect(page.locator('#leaveCampusHubDialog')).toBeVisible();
      const dialogLayout = await page.locator('#leaveCampusHubDialog').evaluate(dialog => {
        const rect = dialog.getBoundingClientRect();
        const actionRects = [...dialog.querySelectorAll('.leave-campus-dialog__actions .btn')]
          .map(button => button.getBoundingClientRect());
        return {
          width: rect.width,
          viewportWidth: window.innerWidth,
          actionHeights: actionRects.map(rect => rect.height)
        };
      });
      expect(dialogLayout.width).toBeLessThanOrEqual(dialogLayout.viewportWidth + 1);
      for (const height of dialogLayout.actionHeights) expect(height).toBeGreaterThanOrEqual(44);
      await page.keyboard.press('Escape');
      await expect(page.locator('#leaveCampusHubDialog')).toBeHidden();
    }
  });

  test('keeps the denied Opportunity action state usable across the required responsive matrix', async ({ page }) => {
    await resetAndGo(page);
    await page.evaluate(() => window.CampusHubDebug.setScenario('assurance-required'));
    const sizes = [
      { width: 320, height: 844 },
      { width: 390, height: 844 },
      { width: 430, height: 932 },
      { width: 768, height: 1024 },
      { width: 1280, height: 900 }
    ];

    for (const size of sizes) {
      await page.setViewportSize(size);
      await page.goto('/#opportunities/ra-climate');
      await expect(page.locator('#view-opportunity')).toBeVisible();
      await expect(page.locator('#oppAssuranceNote')).toBeVisible();
      await expect(page.locator('#oppReviewVerification')).toBeVisible();
      await expect(page.locator('#oppApply')).toBeHidden();
      await expect(page.locator('#leaveCampusHubDialog')).toBeHidden();

      const deniedLayout = await page.evaluate(() => {
        const note = document.querySelector('#oppAssuranceNote')?.getBoundingClientRect();
        const verification = document.querySelector('#oppReviewVerification')?.getBoundingClientRect();
        const shell = document.querySelector('#shell')?.getBoundingClientRect();
        return {
          documentWidth: document.documentElement.scrollWidth,
          viewportWidth: window.innerWidth,
          noteWidth: note?.width ?? 0,
          noteHeight: note?.height ?? 0,
          verificationWidth: verification?.width ?? 0,
          verificationHeight: verification?.height ?? 0,
          shellWidth: shell?.width ?? 0
        };
      });
      expect(deniedLayout.documentWidth).toBeLessThanOrEqual(deniedLayout.viewportWidth + 1);
      expect(deniedLayout.noteWidth).toBeGreaterThan(0);
      expect(deniedLayout.noteWidth).toBeLessThanOrEqual(deniedLayout.shellWidth + 1);
      expect(deniedLayout.noteHeight).toBeGreaterThan(0);
      expect(deniedLayout.verificationWidth).toBeGreaterThanOrEqual(44);
      expect(deniedLayout.verificationHeight).toBeGreaterThanOrEqual(44);
    }
  });
});
