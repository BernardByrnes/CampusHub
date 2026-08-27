import { expect, test } from '@playwright/test';

const POLL_PRIVACY_CORE = 'CampusHub does not provide Guild or university users with a way to see how a named student responded to a poll. Results are shown only when privacy thresholds are met.';
const UNMANAGED_DEVICE_LIMIT = 'We cannot remotely delete files already downloaded to unmanaged devices.';

async function goTo(page, hash) {
  await page.goto(`/${hash}`);
}

async function resetDemo(page) {
  await goTo(page, '#home');
  await page.waitForFunction(() => typeof window.CampusHubDebug?.resetDemo === 'function');
  await page.evaluate(() => window.CampusHubDebug.resetDemo());
}

function expectAtLeastWithSubpixelTolerance(actual, minimum, epsilon = 0.01) {
  expect(actual + epsilon).toBeGreaterThanOrEqual(minimum);
}

test.describe('Phase 8N Privacy and Transparency', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'canonical-mobile', 'Privacy contract coverage runs once in canonical-mobile.');
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

  test('is directly reachable, focuses its title, and remains a Me child', async ({ page }) => {
    await goTo(page, '#privacy');

    await expect(page.locator('#view-privacy')).toBeVisible();
    await expect(page.locator('#privacyTitle')).toHaveText('Privacy & transparency');
    await expect.poll(() => page.evaluate(() => document.activeElement?.id)).toBe('privacyTitle');
    await expect(page.locator('#tab-me')).toHaveAttribute('aria-current', 'page');
    await expect(page.locator('.nav-item[aria-current="page"]')).toHaveCount(1);

    const backBox = await page.locator('.privacy-back').boundingBox();
    expectAtLeastWithSubpixelTolerance(backBox?.width ?? 0, 44);
    expectAtLeastWithSubpixelTolerance(backBox?.height ?? 0, 44);
  });

  test('keeps the frozen hierarchy and student-facing introduction', async ({ page }) => {
    await goTo(page, '#privacy');

    await expect(page.locator('.privacy-heading .view-sub')).toHaveText(
      'What CampusHub collects, who can see it and the choices you have.'
    );
    await expect(page.locator('.privacy-updated')).toHaveText('Last updated: 20 May 2026');

    const headings = await page.locator('#view-privacy h2').allTextContents();
    expect(headings).toEqual([
      'What we collect',
      'Who can see what',
      'Poll privacy',
      'Student Voice identity',
      'University official access',
      'Sponsors',
      'Your rights',
      'Limits we are honest about'
    ]);
  });

  test('explains collection, purpose, and the date-of-birth boundary', async ({ page }) => {
    const privacy = page.locator('#view-privacy');

    await expect(privacy).toContainText('Display name');
    await expect(privacy).toContainText(/email or phone used for your account/i);
    await expect(privacy).toContainText(/student number/i);
    await expect(privacy).toContainText(/faculty or college/i);
    await expect(privacy).toContainText(/programme/i);
    await expect(privacy).toContainText(/year/i);
    await expect(privacy).toContainText(/campus/i);
    await expect(privacy).toContainText(/residence where supplied\/relevant/i);
    await expect(privacy).toContainText(/assurance \/ verification history/i);
    await expect(privacy).toContainText(/membership state/i);
    await expect(privacy).toContainText(/Saves, RSVPs, notifications, XP, Level and Streak/i);
    await expect(privacy).toContainText(/participated in a poll/i);
    await expect(privacy).toContainText(/Student Voice submissions/i);
    await expect(privacy).toContainText(/login or security history/i);
    await expect(privacy).toContainText(/runs the account/i);
    await expect(privacy).toContainText(/supports eligibility decisions/i);
    await expect(privacy).toContainText(/keeps your own CampusHub history and state/i);
    await expect(privacy).toContainText('CampusHub Pilot does not collect your date of birth.');
    await expect(privacy).not.toContainText(/do not collect your date of birth for advertising/i);
  });

  test('states safe student, Guild, Poll, and Voice boundaries', async ({ page }) => {
    const privacy = page.locator('#view-privacy');

    await expect(privacy).toContainText(/Other students: do not get your contact details, individual poll answers or Student Voice identity/i);
    await expect(privacy).toContainText('CampusHub does not provide a student directory.');
    await expect(privacy).toContainText(/Guild administrators: can access the membership and verification information needed to run CampusHub/i);
    await expect(privacy).toContainText(/support lookups are limited and audited/i);
    await expect(privacy).toContainText(/routine contact-detail bulk export is not available by default/i);
    await expect(privacy).not.toContainText(/Guild administrators only see aggregated counts and trends/i);

    await expect(privacy).toContainText(POLL_PRIVACY_CORE);
    await expect(privacy).toContainText(/participated in a poll/i);
    await expect(privacy).toContainText(/one participation \(one response\)/i);
    await expect(privacy).toContainText(/turnout/i);
    await expect(privacy).toContainText(/participation XP/i);
    await expect(privacy).not.toContainText(/anonymous voting|fully anonymous|unlinkable|nobody can link|we don't know you participated/i);

    await expect(privacy).toContainText(/identity is not shown publicly/i);
    await expect(privacy).toContainText(/authorised Voice handler/i);
    await expect(privacy).toContainText(/separately granted identity access/i);
    await expect(privacy).toContainText(/recorded reason/i);
    await expect(privacy).toContainText(/every identity access is audited/i);
    await expect(privacy).toContainText(/not anonymous/i);
  });

  test('states constrained University Official access and sponsor boundaries', async ({ page }) => {
    const privacy = page.locator('#view-privacy');

    await expect(privacy).toContainText(/University Officials have only the scoped access granted under the licence/i);
    await expect(privacy).toContainText(/where licensed, they may publish official notices/i);
    await expect(privacy).toContainText(/individual poll answers/i);
    await expect(privacy).toContainText(/Student Voice submitter identity/i);
    await expect(privacy).toContainText(/individual member behavioural records/i);
    await expect(privacy).toContainText(/member contact exports/i);
    await expect(privacy).toContainText(/cannot edit the audit log/i);
    await expect(privacy).toContainText(/counts, trends and category-level Student Voice statistics/i);

    await expect(privacy).toContainText('Sponsors do not receive named individual student information through CampusHub.');
    await expect(privacy).toContainText('Sponsors do not receive student personal data.');
    await expect(privacy).toContainText(/assurance/i);
    await expect(privacy).toContainText(/poll participation/i);
    await expect(privacy).toContainText(/Student Voice/i);
    await expect(privacy).toContainText(/quiz activity/i);
    await expect(privacy).toContainText(/browsing behaviour/i);
    await expect(privacy).toContainText(/Betting and predatory-lending sponsorship is prohibited/i);
  });

  test('explains access, correction, deletion, retention, and the honest limit', async ({ page }) => {
    const privacy = page.locator('#view-privacy');

    await expect(privacy).toContainText(/personal data for this active university membership/i);
    await expect(privacy).toContainText(/profile/i);
    await expect(privacy).toContainText(/membership and verification history/i);
    await expect(privacy).toContainText(/XP ledger and Streak/i);
    await expect(privacy).toContainText(/Saves, Follows and RSVPs/i);
    await expect(privacy).toContainText(/Student Voice issues you authored/i);
    await expect(privacy).toContainText(/notifications/i);
    await expect(privacy).toContainText(/login history/i);
    await expect(privacy).toContainText(/excludes another person’s data and individual ballots/i);
    await expect(privacy).toContainText(/Information you supplied can be corrected/i);
    await expect(privacy).toContainText(/roster-derived fields cannot simply be overwritten/i);

    await expect(privacy).toContainText(/membership deletion applies to the active university membership/i);
    await expect(privacy).toContainText(/may delete your profile, contact details, XP ledger, Saves, Follows, RSVPs, notifications and login history/i);
    await expect(privacy).toContainText(/global CampusHub user account is a separate action/i);
    await expect(privacy).toContainText(/published Student Voice issue and its status history may remain as an anonymised institutional record/i);
    await expect(privacy).toContainText(/subject to the final legal position/i);
    await expect(privacy).toContainText(/Aggregate counts may remain/i);
    await expect(privacy).toContainText(/required audit entries remain for security and accountability/i);
    await expect(privacy).toContainText(/Public harmful content can be removed, restricted or redacted/i);
    await expect(privacy).toContainText(/audit record of what happened remains/i);
    await expect(privacy).toContainText(/data-rights contact in the Privacy Notice provided during registration/i);
    await expect(privacy).toContainText(/Pilot fulfilment may be assisted by staff rather than fully automated/i);
    await expect(privacy).toContainText(UNMANAGED_DEVICE_LIMIT);
    await expect(privacy).toContainText(/keeps information needed to operate the active membership/i);
    await expect(privacy).toContainText(/Security and audit records required for accountability may remain/i);
  });

  test('has no fake rights buttons or settled legal-role claim', async ({ page }) => {
    const privacy = page.locator('#view-privacy');

    await expect(privacy.getByRole('button', { name: 'Request my data' })).toHaveCount(0);
    await expect(privacy.getByRole('button', { name: 'Request deletion' })).toHaveCount(0);
    await expect(privacy.getByRole('link', { name: 'Request my data' })).toHaveCount(0);
    await expect(privacy.getByRole('link', { name: 'Request deletion' })).toHaveCount(0);
    await expect(privacy).not.toContainText(/CampusHub is always the data controller/i);
    await expect(privacy).not.toContainText(/the university is always the controller/i);
  });

  test('stays readable and contained across the frozen responsive matrix', async ({ page }) => {
    const viewports = [
      { width: 320, height: 844 },
      { width: 390, height: 844 },
      { width: 430, height: 932 },
      { width: 768, height: 1024 },
      { width: 1280, height: 900 }
    ];

    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await goTo(page, '#privacy');
      await expect(page.locator('#view-privacy')).toBeVisible();

      const metrics = await page.evaluate(() => {
        const shell = document.querySelector('#shell');
        const back = document.querySelector('.privacy-back');
        const main = document.querySelector('#main');
        const card = document.querySelector('.privacy-card');
        const shellRect = shell?.getBoundingClientRect();
        const backRect = back?.getBoundingClientRect();
        const mainStyle = main ? getComputedStyle(main) : null;
        const cardRect = card?.getBoundingClientRect();
        return {
          scrollWidth: document.documentElement.scrollWidth,
          viewportWidth: window.innerWidth,
          shellWidth: shellRect?.width ?? 0,
          backWidth: backRect?.width ?? 0,
          backHeight: backRect?.height ?? 0,
          cardWidth: cardRect?.width ?? 0,
          mainPaddingBottom: Number.parseFloat(mainStyle?.paddingBottom || '0')
        };
      });

      expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.viewportWidth + 1);
      expect(metrics.shellWidth).toBeLessThanOrEqual(430 + 1);
      expect(metrics.cardWidth).toBeLessThanOrEqual(metrics.shellWidth + 1);
      expectAtLeastWithSubpixelTolerance(metrics.backWidth, 44);
      expectAtLeastWithSubpixelTolerance(metrics.backHeight, 44);
      expect(metrics.mainPaddingBottom).toBeGreaterThan(0);
    }
  });
});
