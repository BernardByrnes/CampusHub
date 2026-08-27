import { expect, test } from '@playwright/test';

const OPPORTUNITY = Object.freeze({
  id: 'ra-climate',
  title: 'Research Assistant — Climate Resilience',
  provider: 'Makerere University — Department of Geography',
  deadline: '30 May 2026',
  deadlineTenantDay: '2026-05-30'
});

const ACTIVE_VIEWPORTS = [
  { width: 320, height: 844 },
  { width: 390, height: 844 },
  { width: 430, height: 932 },
  { width: 768, height: 1024 },
  { width: 1280, height: 900 }
];

const EXPIRED_VIEWPORTS = [
  { width: 320, height: 844 },
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 1280, height: 900 }
];

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

async function goTo(page, hash) {
  await page.goto(`/${hash}`);
}

async function resetDemo(page) {
  await goTo(page, '#home');
  await page.waitForFunction(() => typeof window.CampusHubDebug?.resetDemo === 'function');
  await page.evaluate(() => window.CampusHubDebug.resetDemo());
  await page.evaluate(() => document.querySelectorAll('#toastWrap .toast').forEach(toast => toast.remove()));
}

async function setOpportunityScenario(page, name) {
  await page.evaluate(scenario => window.CampusHubDebug.setOpportunityScenario(scenario), name);
  await page.evaluate(() => document.querySelectorAll('#toastWrap .toast').forEach(toast => toast.remove()));
}

async function storedState(page) {
  return page.evaluate(() => JSON.parse(localStorage.getItem('campushub:state')));
}

async function expectDiscoverNav(page) {
  await expect(page.locator('#tab-discover')).toHaveAttribute('aria-current', 'page');
  await expect(page.locator('.nav-item[aria-current="page"]')).toHaveCount(1);
}

async function expectContained(page, viewSelector = '#view-opportunity') {
  const metrics = await page.evaluate(selector => {
    const view = document.querySelector(selector)?.getBoundingClientRect();
    const shell = document.querySelector('#shell')?.getBoundingClientRect();
    const title = document.querySelector('#opportunityDetailTitle')?.getBoundingClientRect();
    const provider = document.querySelector('[data-field="oppProvider2"]')?.getBoundingClientRect();
    const eligibility = document.querySelector('[data-field="oppEligibility"]')?.getBoundingClientRect();
    const back = document.querySelector('#view-opportunity [data-back]')?.getBoundingClientRect();
    const actions = [...document.querySelectorAll('#view-opportunity .opportunity-actions .btn')]
      .filter(button => getComputedStyle(button).display !== 'none')
      .map(button => button.getBoundingClientRect());
    return {
      viewportWidth: window.innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      bodyWidth: document.body.scrollWidth,
      viewLeft: view?.left ?? 0,
      viewRight: view?.right ?? 0,
      shellLeft: shell?.left ?? 0,
      shellRight: shell?.right ?? 0,
      shellWidth: shell?.width ?? 0,
      titleWidth: title?.width ?? 0,
      providerRight: provider?.right ?? 0,
      eligibilityRight: eligibility?.right ?? 0,
      backWidth: back?.width ?? 0,
      backHeight: back?.height ?? 0,
      actionRects: actions.map(rect => ({ width: rect.width, height: rect.height }))
    };
  }, viewSelector);
  expect(metrics.documentWidth).toBeLessThanOrEqual(metrics.viewportWidth + 1);
  expect(metrics.bodyWidth).toBeLessThanOrEqual(metrics.viewportWidth + 1);
  expect(metrics.viewLeft).toBeGreaterThanOrEqual(metrics.shellLeft - 1);
  expect(metrics.viewRight).toBeLessThanOrEqual(metrics.shellRight + 1);
  expect(metrics.titleWidth).toBeLessThanOrEqual(metrics.shellWidth + 1);
  expect(metrics.providerRight).toBeLessThanOrEqual(metrics.shellRight + 1);
  expect(metrics.eligibilityRight).toBeLessThanOrEqual(metrics.shellRight + 1);
  expect(metrics.backWidth).toBeGreaterThanOrEqual(44);
  expect(metrics.backHeight).toBeGreaterThanOrEqual(44);
  for (const action of metrics.actionRects) {
    expect(action.width).toBeGreaterThanOrEqual(44);
    expect(action.height).toBeGreaterThanOrEqual(44);
  }
  expect(metrics.shellWidth).toBeLessThanOrEqual(431);
}

test.describe('Phase 8P canonical Opportunity lifecycle', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'canonical-mobile', 'Detailed Opportunity lifecycle tests run once at the canonical mobile project.');
    await blockRemoteFonts(page);
    await page.emulateMedia({ reducedMotion: 'reduce' });
  });

  test('keeps the canonical deadline and active reset surfaces coherent', async ({ page }) => {
    await resetDemo(page);
    const lifecycle = await page.evaluate(() => window.CampusHubDebug.getOpportunityLifecycle());
    const opportunity = await page.evaluate(() => window.CampusHubDemo.opportunity);
    expect(opportunity.deadlineTenantDay).toBe(OPPORTUNITY.deadlineTenantDay);
    expect(await page.evaluate(() => window.CampusHubDemo.demoConfig.calendar.currentTenantDay)).toBe('2026-05-20');
    expect(lifecycle).toMatchObject({ status: 'active', active: true, expired: false, tenantDay: '2026-05-20' });

    await goTo(page, '#home');
    await expect(page.locator('#homeOpp')).toBeVisible();
    await goTo(page, '#discover');
    await expect(page.locator('#discoverList [data-discover-id="ra-climate"]')).toHaveCount(1);
    await page.locator('#discoverFilters [data-filter="Opportunities"]').click();
    await expect(page.locator('#discoverList [data-discover-id="ra-climate"]')).toHaveCount(1);
    await page.getByLabel('Search campus content').fill('Research Assistant');
    await expect(page.locator('#discoverList [data-discover-id="ra-climate"]')).toHaveCount(1);

    await goTo(page, '#opportunities/ra-climate');
    await expect(page.locator('#view-opportunity')).toHaveAttribute('data-opportunity-lifecycle', 'active');
    await expect(page.locator('#opportunityDetailTitle')).toHaveText(OPPORTUNITY.title);
    await expect(page.locator('#oppStatus')).toBeHidden();
    await expect(page.locator('#oppApply')).toBeVisible();
  });

  test('uses the entity title as the only detail H1, focuses it, and keeps Discover as parent', async ({ page }) => {
    await resetDemo(page);
    await goTo(page, '#opportunities/ra-climate');

    const view = page.locator('#view-opportunity');
    await expect(view.locator('h1')).toHaveCount(1);
    await expect(page.locator('#opportunityDetailTitle')).toHaveText(OPPORTUNITY.title);
    await expect.poll(() => page.evaluate(() => document.activeElement?.id)).toBe('opportunityDetailTitle');
    await expectDiscoverNav(page);

    const back = page.locator('#view-opportunity [data-back]');
    const backSize = await back.boundingBox();
    expect(backSize?.width || 0).toBeGreaterThanOrEqual(44);
    expect(backSize?.height || 0).toBeGreaterThanOrEqual(44);
    await goTo(page, '#discover');
    await page.locator('#discoverList [data-discover-id="ra-climate"] a').click();
    await back.click();
    await expect(page.locator('#view-discover')).toBeVisible();
    expect(new URL(page.url()).hash).toBe('#discover');
  });

  test('removes expired Opportunity from Home, Discover filters, and search before presentation', async ({ page }) => {
    await resetDemo(page);
    await setOpportunityScenario(page, 'expired');

    await goTo(page, '#home');
    await expect(page.locator('#homeOpp')).toBeHidden();
    await expect(page.locator('#homeOpp [data-testid="home-opportunity-link"]')).toBeHidden();

    await goTo(page, '#discover');
    await expect(page.locator('#discoverList [data-discover-id="ra-climate"]')).toHaveCount(0);
    await page.locator('#discoverFilters [data-filter="Opportunities"]').click();
    await expect(page.locator('#discoverList [data-discover-id="ra-climate"]')).toHaveCount(0);
    await page.getByLabel('Search campus content').fill('Research Assistant');
    await expect(page.locator('#discoverList [data-discover-id="ra-climate"]')).toHaveCount(0);
    await expect(page.locator('#discoverList')).not.toContainText(OPPORTUNITY.title);
    await expect(page.locator('#discoverList')).not.toContainText(OPPORTUNITY.provider);
  });

  test('keeps a direct expired route readable with calm status treatment', async ({ page }) => {
    await resetDemo(page);
    await setOpportunityScenario(page, 'expired');
    await goTo(page, '#opportunities/ra-climate');

    const view = page.locator('#view-opportunity');
    await expect(view).toBeVisible();
    await expect(view).toHaveAttribute('data-opportunity-lifecycle', 'expired');
    await expect(page.locator('#opportunityDetailTitle')).toHaveText(OPPORTUNITY.title);
    await expect(page.locator('[data-field="oppProvider2"]')).toHaveText(OPPORTUNITY.provider);
    await expect(page.locator('[data-field="oppDeadline2"]')).toHaveText(OPPORTUNITY.deadline);
    await expect(page.locator('#oppStatus')).toHaveText('Expired');
    await expect(page.locator('#oppStatus')).toBeVisible();
    await expect(page.locator('#oppExpiredCopy')).toContainText('This opportunity has expired.');
    await expect(page.locator('#oppExpiredCopy')).toContainText('Applications are no longer available through CampusHub.');
    await expect.poll(() => page.evaluate(() => document.activeElement?.id)).toBe('opportunityDetailTitle');
    await expectDiscoverNav(page);
  });

  test('removes Apply and the leave destination after expiry while preserving Report', async ({ page }) => {
    await resetDemo(page);
    await setOpportunityScenario(page, 'expired');
    await goTo(page, '#opportunities/ra-climate');

    await expect(page.locator('#oppApply')).toBeHidden();
    await expect(page.locator('#leaveCampusHubContinue')).toBeHidden();
    expect(await page.locator('#leaveCampusHubContinue').getAttribute('href')).toBeNull();
    expect(await page.locator('#leaveCampusHubContinue').getAttribute('target')).toBeNull();
    await expect(page.locator('#leaveCampusHubDialog')).toBeHidden();
    await expect(page.locator('#oppReport')).toHaveText('Report suspicious opportunity');
    await expect(page.locator('#oppReport')).toBeEnabled();

    await page.evaluate(() => document.querySelector('#oppApply')?.click());
    await expect(page.locator('#leaveCampusHubDialog')).toBeHidden();
  });

  test('retains and marks the saved Opportunity expired in Me, with a stable route back', async ({ page }) => {
    await resetDemo(page);
    await setOpportunityScenario(page, 'expired');
    await goTo(page, '#me');
    await page.locator('#meSaveLink').click();

    await expect(page.locator('[data-field="savesMeta"]')).toHaveText('3 saved');
    const saved = page.locator('[data-save-source-id="ra-climate"]');
    await expect(saved).toHaveCount(1);
    await expect(saved).toHaveText(OPPORTUNITY.title);
    await expect(saved.locator('xpath=..')).toContainText('Expired');
    await expect(page.locator('#savesList')).toContainText('Apply by 30 May');
    await saved.click();
    await expect(page).toHaveURL(/#opportunities\/ra-climate$/);
    await expect(page.locator('#oppStatus')).toBeVisible();
    await expect(page.locator('#oppExpiredCopy')).toBeVisible();
  });

  test('keeps expired reporting idempotent without XP or Streak changes', async ({ page }) => {
    await resetDemo(page);
    await setOpportunityScenario(page, 'expired');
    await goTo(page, '#opportunities/ra-climate');
    const before = await storedState(page);

    await page.locator('#oppReport').click();
    await expect(page.locator('#oppReport')).toHaveText('Report sent ✓');
    await expect(page.locator('#oppReport')).toBeDisabled();
    await expect(page.locator('#toastWrap .toast span').last()).toHaveText('Report received. The Guild office reviews every report.');
    const after = await storedState(page);
    expect(after.reportedOpportunityIds).toEqual(['ra-climate']);
    expect(after.xp).toBe(before.xp);
    expect(after.streakState).toEqual(before.streakState);
  });

  test('resetDemo restores normal Opportunity lifecycle and Apply availability', async ({ page }) => {
    await resetDemo(page);
    await setOpportunityScenario(page, 'expired');
    await goTo(page, '#opportunities/ra-climate');
    await expect(page.locator('#oppStatus')).toBeVisible();

    await page.evaluate(() => window.CampusHubDebug.resetDemo());
    await expect(page.locator('#oppStatus')).toBeHidden();
    await expect(page.locator('#oppApply')).toBeVisible();
    await expect(page.locator('#view-opportunity')).toHaveAttribute('data-opportunity-lifecycle', 'active');
    await goTo(page, '#home');
    await expect(page.locator('#homeOpp')).toBeVisible();
    await goTo(page, '#opportunities/ra-climate');
    await expect(page.locator('#view-opportunity')).toHaveAttribute('data-opportunity-tenant-day', '2026-05-20');
  });

  test('migrates a legacy canonical save to sourceId without losing unrelated saves', async ({ page }) => {
    await resetDemo(page);
    await page.evaluate(() => {
      const state = JSON.parse(localStorage.getItem('campushub:state'));
      state.saves = state.saves.map(item => item.id === 's2' ? { ...item, sourceId: undefined } : item);
      state.saves.push({ id: 'legacy-save', type: 'Campus Story', title: 'A legitimate saved item', meta: '18 May' });
      localStorage.setItem('campushub:state', JSON.stringify(state));
    });
    await page.reload();
    await goTo(page, '#me');
    await page.locator('#meSaveLink').click();

    await expect(page.locator('[data-save-source-id="ra-climate"]')).toHaveCount(1);
    await expect(page.locator('#savesList')).toContainText('A legitimate saved item');
    const migrated = await storedState(page);
    const opportunitySave = migrated.saves.find(item => item.title === OPPORTUNITY.title);
    expect(migrated.saves).toHaveLength(4);
    expect(opportunitySave.sourceId).toBe(OPPORTUNITY.id);
  });

  test('keeps active detail contained across the required responsive matrix', async ({ page }) => {
    await resetDemo(page);
    for (const viewport of ACTIVE_VIEWPORTS) {
      await page.setViewportSize(viewport);
      await goTo(page, '#opportunities/ra-climate');
      await expect(page.locator('#oppStatus')).toBeHidden();
      await expect(page.locator('[data-field="oppProvider2"]')).toContainText('Makerere University');
      await expect(page.locator('[data-field="oppEligibility"]')).toContainText('related programmes');
      await expect(page.locator('#oppRequirements')).toContainText('Academic transcript');
      await expectContained(page);
    }
  });

  test('keeps expired detail contained across the required responsive matrix', async ({ page }) => {
    await resetDemo(page);
    await setOpportunityScenario(page, 'expired');
    for (const viewport of EXPIRED_VIEWPORTS) {
      await page.setViewportSize(viewport);
      await goTo(page, '#opportunities/ra-climate');
      await expect(page.locator('#oppStatus')).toBeVisible();
      await expect(page.locator('#oppExpiredCopy')).toBeVisible();
      await expect(page.locator('#oppApply')).toBeHidden();
      await expectContained(page);
    }
  });
});
