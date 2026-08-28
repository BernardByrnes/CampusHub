import { expect, test } from '@playwright/test';

const STATE_KEY = 'campushub:state:v2:tenant-makerere:membership-demo-001';

async function goTo(page, hash) {
  await page.goto(`/${hash}`);
}

async function resetDemo(page, scenario = null) {
  await page.evaluate(name => {
    window.CampusHubDebug.resetDemo();
    if(name) window.CampusHubDebug.setScenario(name);
  }, scenario);
}

async function readState(page) {
  return page.evaluate(key => JSON.parse(localStorage.getItem(key) || 'null'), STATE_KEY);
}

async function expectNoHorizontalOverflow(page) {
  const fits = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
  expect(fits).toBe(true);
}

function expectAtLeastWithSubpixelTolerance(actual, minimum, epsilon = 0.01) {
  // CSS specifies the practical target exactly; Chromium can expose a tiny
  // fractional bounding-box error on Windows, so this is measurement-only.
  expect(actual + epsilon).toBeGreaterThanOrEqual(minimum);
}

test.describe('Phase 8K Verification and membership trust surface', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'canonical-mobile', 'Verification contract coverage runs once in canonical-mobile.');
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
    await page.waitForFunction(() => typeof window.CampusHubDebug?.resetDemo === 'function');
    await resetDemo(page);
  });

  test('shows the canonical default L2 assurance and separate enrolment copy', async ({ page }) => {
    await goTo(page, '#verification');

    await expect(page.locator('#verificationStatusKicker')).toHaveText('Current assurance');
    await expect(page.locator('[data-field="assuranceTitle"]')).toHaveText('L2 — Roster Match');
    await expect(page.locator('#verificationStatusDescription')).toHaveText(
      'Your membership is matched to the current student roster provided by your university.'
    );
    await expect(page.locator('#verificationAssuranceSeparation')).toHaveText(
      'Assurance is separate from enrolment. Your enrolment status is Current.'
    );
    await expect(page.locator('#verificationMembershipRefresh')).toBeHidden();
    await expect(page.locator('#verificationActionSlot')).toBeHidden();

    await expect(page.locator('#view-me')).toContainText('Enrolment status');
    await expect(page.locator('#view-me')).toContainText('Current');
    await expect(page.locator('#view-verification')).not.toContainText(/ACCESS DENIED/i);
    await expect(page.locator('#view-verification')).not.toContainText(/XP|streak|progress|badge/i);
  });

  test('renders exactly four ordered assurance steps and marks only L2 current', async ({ page }) => {
    await goTo(page, '#verification');
    const labels = await page.locator('#assuranceLadder > li .tier-title').allTextContents();
    expect(labels).toEqual([
      'L0 — Registered',
      'L1 — Weak Affiliation',
      'L2 — Roster Match',
      'L3 — Strong Institutional Proof'
    ]);
    await expect(page.locator('#assuranceLadder')).toHaveCount(1);
    await expect(page.locator('#assuranceLadder > li')).toHaveCount(4);
    await expect(page.locator('#assuranceLadder > li[aria-current="step"]')).toHaveCount(1);
    await expect(page.locator('#verificationTierL2')).toHaveAttribute('aria-current', 'step');
    await expect(page.locator('#verificationTierL2 [data-tier-current]')).toHaveText('Current');
    await expect(page.locator('#verificationTierL2 [data-tier-current]')).toBeVisible();
    await expect(page.locator('#verificationTierL0 [data-tier-current]')).toBeHidden();
    await expect(page.locator('#verificationTierL1 [data-tier-current]')).toBeHidden();
    await expect(page.locator('#verificationTierL3 [data-tier-current]')).toBeHidden();
  });

  test('does not expose a generic Verified label, progress visual, or default L3 action', async ({ page }) => {
    await goTo(page, '#verification');
    await expect(page.locator('#view-verification .progress')).toHaveCount(0);
    await expect(page.locator('#view-verification [data-field="assuranceTitle"]')).not.toHaveText(/^Verified$/i);
    await expect(page.locator('#view-verification .pill:visible')).not.toContainText(/^Verified$/i);
    await expect(page.getByRole('button', { name: /stronger verification|L3/i })).toHaveCount(0);
    await expect(page.locator('#verificationActionSlot')).toBeHidden();
  });

  test('qualifies typical access examples instead of presenting entitlements', async ({ page }) => {
    await goTo(page, '#verification');
    const accessDetails = page.locator('details').filter({ hasText: 'Typical access by assurance' });
    await expect(accessDetails).toHaveCount(1);
    await expect(accessDetails.locator('summary')).toHaveText('Typical access by assurance ›');
    await expect(accessDetails).not.toContainText('What each assurance allows');
    await accessDetails.locator('summary').click();
    await expect(accessDetails).toContainText('These are typical defaults.');
    await expect(accessDetails).toContainText(/Membership status/);
    await expect(accessDetails).toContainText(/campus service/);
    await expect(accessDetails).toContainText(/audience/);
    await expect(accessDetails).toContainText(/requirements/);
    await expect(accessDetails).toContainText(/L0: Read public tenant content only\. No participation\./);
    await expect(accessDetails).toContainText(/L1: Read appropriate campus information; save, follow, RSVP and Daily Quiz\./);
    await expect(accessDetails).toContainText(/L2: Everything at L1, plus polls where the tenant permits L2 participation and Student Voice where enabled\./);
    await expect(accessDetails).toContainText(/L3: Full student participation, including polls where the tenant sets a high-integrity threshold\./);
    await expect(page.locator('#view-verification')).not.toContainText('What each assurance allows');
  });

  test('keeps Verification as a Me child with a 44px Back control and route focus', async ({ page }) => {
    await goTo(page, '#me');
    await expect(page.locator('#tab-me')).toHaveAttribute('aria-current', 'page');
    await expect(page.locator('.nav-item[aria-current="page"]')).toHaveCount(1);
    await page.getByRole('link', { name: 'Verification & membership' }).click();
    await expect(page.locator('#view-verification')).toBeVisible();
    await expect.poll(() => page.evaluate(() => document.activeElement?.id)).toBe('verificationTitle');
    const backBox = await page.locator('.verification-back').boundingBox();
    expectAtLeastWithSubpixelTolerance(backBox?.width ?? 0, 44);
    expectAtLeastWithSubpixelTolerance(backBox?.height ?? 0, 44);
    await expect(page.locator('#tab-me')).toHaveAttribute('aria-current', 'page');
    await expect(page.locator('.nav-item[aria-current="page"]')).toHaveCount(1);

    await page.locator('.verification-back').click();
    await expect(page.locator('#view-me')).toBeVisible();
  });

  test('focuses the Verification title on a direct route', async ({ page }) => {
    await page.goto('/#verification');
    await expect(page.locator('#view-verification')).toBeVisible();
    await expect.poll(() => page.evaluate(() => document.activeElement?.id)).toBe('verificationTitle');
    await page.reload();
    await expect(page.locator('#view-verification')).toBeVisible();
    await expect.poll(() => page.evaluate(() => document.activeElement?.id)).toBe('verificationTitle');
  });

  test('keeps stale membership calm, leaves assurance at L2, and preserves membership-first gating', async ({ page }) => {
    await resetDemo(page, 'membership-refresh');
    await goTo(page, '#verification');
    await expect(page.locator('#verificationMembershipRefresh')).toBeVisible();
    await expect(page.locator('#verificationMembershipRefresh')).toContainText('Membership needs refreshing.');
    await expect(page.locator('#verificationMembershipRefresh')).toContainText('Your roster match is from a previous term. Refresh it to keep taking part.');
    await expect(page.locator('[data-field="assuranceTitle"]')).toHaveText('L2 — Roster Match');
    await expect(page.locator('#verificationStatusDescription')).toHaveText(
      'Your membership is matched to the current student roster provided by your university.'
    );
    await expect(page.locator('#startRosterMatch')).toHaveText('Refresh membership');
    await expect(page.locator('#view-verification')).not.toContainText(/ACCESS DENIED|assurance required/i);
    await expect(page.locator('#verificationMembershipRefresh')).not.toHaveClass(/danger|error/);

    await goTo(page, '#participate');
    await page.locator('#pollForm input[type="radio"]').first().check();
    await page.locator('#submitPoll').click();
    await expect(page.locator('#participationGate')).toBeVisible();
    await expect.poll(() => page.evaluate(() => window.CampusHubDebug.getLastGateDecision())).toEqual({
      allowed: false,
      reason: { step:'membership-state', variant:'membership-refresh', resourceContext:'poll' }
    });
  });

  test('preserves the assurance-required roster-match flow and continuation focus', async ({ page }) => {
    await resetDemo(page, 'assurance-required');
    await goTo(page, '#participate');
    await page.locator('#pollForm input[type="radio"]').first().check();
    await page.locator('#submitPoll').click();
    await expect(page.locator('#participationGate')).toBeVisible();
    await expect(page.locator('#participationGatePrimary')).toHaveText('Verify student status');
    await page.locator('#participationGatePrimary').click();
    await expect(page.locator('#view-verification')).toBeVisible();
    await expect(page.locator('[data-field="assuranceTitle"]')).toHaveText('L1 — Weak Affiliation');
    await expect(page.locator('#startRosterMatch')).toHaveText('Match my student record');
    await page.locator('#startRosterMatch').click();
    await expect(page.locator('#verificationSuccess')).toBeVisible();
    await expect.poll(() => new URL(page.url()).hash, { timeout:5_000 }).toBe('#participate');
    await expect.poll(() => page.evaluate(() => document.activeElement?.matches('#pollForm input[type="radio"]'))).toBe(true);
    expect((await readState(page)).pollDone).toBe(false);
  });

  test('explains OTP and institutional email provenance without claiming email alone is L3', async ({ page }) => {
    await goTo(page, '#verification');
    await page.locator('summary').filter({ hasText: 'Why OTP provenance matters' }).click();
    const text = await page.locator('#view-verification').innerText();
    expect(text).toMatch(/channel you provide proves you control that channel/i);
    expect(text).toMatch(/institutional email supports L3 only where the university confirms/i);
    expect(text).toMatch(/bound to the student and reflects current enrolment/i);
    expect(text).toMatch(/reliable status revocation/i);
    expect(text).toMatch(/otherwise it supports affiliation or contact only and is capped at L2/i);
    expect(text).toMatch(/domain suffix alone proves nothing/i);
    expect(text).not.toMatch(/institutional email(?: alone)? (?:proves|gives|upgrades).{0,80}L3/i);
  });

  test('fits the canonical Verification surface at 320, 390, 430, 768, and 1280px', async ({ page }) => {
    for(const viewport of [
      { width:320, height:844 },
      { width:390, height:844 },
      { width:430, height:932 },
      { width:768, height:1024 },
      { width:1280, height:900 }
    ]){
      await page.setViewportSize(viewport);
      await goTo(page, '#verification');
      await expect(page.locator('#view-verification')).toBeVisible();
      await expect(page.locator('#verificationTitle')).toBeVisible();
      await expect(page.locator('#assuranceLadder > li')).toHaveCount(4);
      const backBox = await page.locator('.verification-back').boundingBox();
      expectAtLeastWithSubpixelTolerance(backBox?.width ?? 0, 44);
      expectAtLeastWithSubpixelTolerance(backBox?.height ?? 0, 44);
      await expectNoHorizontalOverflow(page);
    }
  });
});
