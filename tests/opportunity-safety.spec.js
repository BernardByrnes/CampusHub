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
  return page.evaluate(() => JSON.parse(localStorage.getItem('campushub:state')));
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
    await expect(page.locator('#oppReport')).toHaveText('Report suspicious opportunity');
    await expect(page.locator('#leaveCampusHubContinue')).toHaveAttribute('href', 'https://www.mak.ac.ug/');
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
    expect(after.xp).toBe(before.xp);
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
      const current = JSON.parse(localStorage.getItem('campushub:state'));
      localStorage.setItem('campushub:state', JSON.stringify({
        ...current,
        saveOpp: true,
        xp: 321,
        legacyMarker: 'preserved'
      }));
    });
    await page.reload();
    await expect(page.locator('#oppSave')).toHaveText('Saved ✓');
    const migrated = await storedState(page);
    expect(migrated.reportedOpportunityIds).toEqual([]);
    expect(migrated.legacyMarker).toBe('preserved');
    expect(migrated.xp).toBe(321);
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
});
