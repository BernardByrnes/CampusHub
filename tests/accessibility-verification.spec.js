import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import {
  assertFocusedElementNotObscured,
  assertMinimumTarget,
  assertNoHorizontalOverflow,
  assertNoTextClipping,
  assertVisibleFocusIndicator,
  injectTextSpacingStress
} from './helpers/accessibility.js';

const TEXT_SPACING_ROUTES = [
  ['#home', ['#globalSearch', '#homePlaySummary [data-testid="home-play-link"]']],
  ['#discover', ['#globalSearch', '#discoverList']],
  ['#participate', ['#seg-polls', '#submitPoll']],
  ['#voice-new', ['#voiceCategoryHeading', '#voiceCategoryCancel']],
  ['#play', ['#quizQuestion', '#quizSubmit']],
  ['#me', ['#meActivity', '#meActivity a[href="#verification"]']],
  ['#privacy', ['#privacyTitle', '#privacyLimitsHeading']],
  ['#notifications', ['#notifTitle', '#markAllRead']],
  ['#news/innovation-week', ['#newsDetailTitle', '#view-news [data-back]']],
  ['#events/guild-debate', ['#eventDetailTitle', '#rsvpGoing']],
  ['#opportunities/ra-climate', ['#opportunityDetailTitle', '#oppReport']]
];

const TEXT_SPACING_320_ROUTES = [
  ['#home', ['#homePlaySummary [data-testid="home-play-link"]']],
  ['#voice-new', ['#voiceCategoryHeading', '#voiceCategoryCancel']],
  ['#opportunities/ra-climate', ['#opportunityDetailTitle', '#oppReport']]
];

const FOCUS_NOT_OBSCURED_CASES = [
  ['#privacy', '#view-privacy .privacy-back', 'Privacy back control'],
  ['#notifications', '#notifList a[data-notification-id]', 'last Notifications item'],
  ['#play', '#quizOptions input[type="radio"]', 'Daily Quiz option'],
  ['#me', '#meActivity a[href="#verification"]', 'Me verification link'],
  ['#opportunities/ra-climate', '#oppReport', 'Opportunity report action'],
  ['#voice-new', '#voiceCategoryCancel', 'Voice Composer cancel action'],
  ['#home', '#homePlaySummary [data-testid="home-play-link"]', 'Home Play control near bottom navigation']
];

const CRITICAL_SMALL_TARGET_CASES = [
  '#home',
  '#voice-new',
  '#opportunities/ra-climate'
];

const ROUTE_VIEW_NAMES = Object.freeze({
  events: 'event',
  opportunities: 'opportunity',
  sports: 'sports',
  news: 'news',
  'voice-detail': 'voice-detail',
  'voice-new': 'voice-new'
});

function onlyProject(testInfo, projectName) {
  test.skip(testInfo.project.name !== projectName, `This check runs once in ${projectName}.`);
}

async function resetDemo(page) {
  await page.evaluate(() => {
    window.CampusHubDebug.resetDemo();
    document.querySelectorAll('#toastWrap .toast').forEach(toast => toast.remove());
  });
}

async function waitForActiveViewSettled(page) {
  await page.evaluate(async () => {
    const activeView = document.querySelector('.view.is-active');
    const animations = activeView?.getAnimations?.() || [];
    await Promise.all(animations.map(animation => animation.finished.catch(() => undefined)));
  });
}

async function openRoute(page, route) {
  const path = route.replace(/^#/, '').split('/')[0];
  const expectedView = ROUTE_VIEW_NAMES[path] || path || 'home';
  await page.goto(`/${route}`);
  await resetDemo(page);
  await page.goto(`/${route}`);
  await expect(page.locator(`#view-${expectedView}.is-active`)).toHaveCount(1);
  await waitForActiveViewSettled(page);
}

async function focusAndAssertNotObscured(page, selector, label) {
  const locator = page.locator(selector).last();
  await expect(locator).toBeVisible();
  await locator.focus();
  await expect(locator).toBeFocused();
  return assertFocusedElementNotObscured(page, label);
}

async function assertTextSpacingRoute(page, route, selectors) {
  await openRoute(page, route);
  await injectTextSpacingStress(page);
  await assertNoHorizontalOverflow(page, `${route} under WCAG text-spacing stress`);
  await assertNoTextClipping(page, `${route} under WCAG text-spacing stress`);
  for (const selector of selectors) {
    await expect(page.locator(selector).last()).toBeVisible();
  }
}

test.describe('Phase 8U.9 automated accessibility verification', () => {
  test('full accessibility command keeps the intended project and suite contract', async ({}, testInfo) => {
    onlyProject(testInfo, 'canonical-mobile');
    const packageJson = JSON.parse(await readFile(resolve(process.cwd(), 'package.json'), 'utf8'));
    const fastCommand = packageJson.scripts?.['test:a11y'];
    const fullCommand = packageJson.scripts?.['test:a11y:full'];

    expect(fastCommand).toContain('tests/accessibility.spec.js');
    expect(fastCommand).toContain('--project=canonical-mobile');
    expect(fullCommand).toContain('tests/accessibility.spec.js');
    expect(fullCommand).toContain('tests/accessibility-verification.spec.js');
    for (const project of ['canonical-mobile', 'small-mobile', 'desktop']) {
      expect(fullCommand).toContain(`--project=${project}`);
    }
    expect(fullCommand).not.toMatch(/visual-regression|test:visual/i);
    console.log(JSON.stringify({
      fastA11yCommand: fastCommand,
      fullA11yCommand: fullCommand,
      fullGateProjects: ['canonical-mobile', 'small-mobile', 'desktop'],
      excludedFromFullGate: ['large-mobile', 'visual snapshot projects']
    }));
  });

  test('focused content is not obscured by persistent shell or dialog chrome', async ({ page }, testInfo) => {
    onlyProject(testInfo, 'canonical-mobile');
    test.setTimeout(120_000);
    for (const [route, selector, label] of FOCUS_NOT_OBSCURED_CASES) {
      await openRoute(page, route);
      await focusAndAssertNotObscured(page, selector, label);
    }
    console.log(JSON.stringify({
      focusNotObscuredRoutes: FOCUS_NOT_OBSCURED_CASES.map(([route]) => route),
      focusObscuredViolations: 0,
      helper: 'assertFocusedElementNotObscured(page)'
    }));
  });

  test('390px text-spacing stress keeps content, labels, actions, and fixed-height components usable', async ({ page }, testInfo) => {
    onlyProject(testInfo, 'canonical-mobile');
    test.setTimeout(120_000);
    for (const [route, selectors] of TEXT_SPACING_ROUTES) {
      await assertTextSpacingRoute(page, route, selectors);
    }
    console.log(JSON.stringify({
      textSpacingViewport: '390px',
      textSpacingRoutes: TEXT_SPACING_ROUTES.length,
      textSpacingFailures: 0
    }));
  });

  test('320px text-spacing sanity keeps critical surfaces reflowed and actionable', async ({ page }, testInfo) => {
    onlyProject(testInfo, 'small-mobile');
    test.setTimeout(60_000);
    for (const [route, selectors] of TEXT_SPACING_320_ROUTES) {
      await assertTextSpacingRoute(page, route, selectors);
    }
    console.log(JSON.stringify({
      textSpacingViewport: '320px',
      textSpacingRoutes: TEXT_SPACING_320_ROUTES.length,
      textSpacingFailures: 0
    }));
  });

  test('small-mobile critical controls retain the existing 44px practical target contract', async ({ page }, testInfo) => {
    onlyProject(testInfo, 'small-mobile');
    test.setTimeout(60_000);
    let checkedTargets = 0;
    for (const route of CRITICAL_SMALL_TARGET_CASES) {
      await openRoute(page, route);
      checkedTargets += await assertMinimumTarget(page, route);
    }
    expect(checkedTargets).toBeGreaterThan(0);
    console.log(JSON.stringify({
      touchTargetRoutes: CRITICAL_SMALL_TARGET_CASES,
      touchTargetsChecked: checkedTargets,
      touchTargetFailures: 0
    }));
  });

  test('desktop selected layout and focus checks remain usable', async ({ page }, testInfo) => {
    onlyProject(testInfo, 'desktop');
    for (const route of ['#home', '#privacy', '#opportunities/ra-climate']) {
      await openRoute(page, route);
      await assertNoHorizontalOverflow(page, `${route} on desktop`);
      await expect(page.locator('main#main')).toHaveCount(1);
      await expect(page.locator('nav.bottom-nav[aria-label="Primary"]')).toHaveCount(1);
    }
    await openRoute(page, '#home');
    await assertVisibleFocusIndicator(page, '#globalSearch');
    await focusAndAssertNotObscured(page, '#homePlaySummary [data-testid="home-play-link"]', 'desktop Home Play control');
    console.log(JSON.stringify({
      desktopRoutes: ['#home', '#privacy', '#opportunities/ra-climate'],
      desktopHorizontalOverflowFailures: 0
    }));
  });

  test('forced-colors smoke preserves semantic state identity when emulation is supported', async ({ page }, testInfo) => {
    onlyProject(testInfo, 'canonical-mobile');
    await page.emulateMedia({ forcedColors: 'active' });
    const supported = await page.evaluate(() => window.matchMedia('(forced-colors: active)').matches);
    if (!supported) {
      console.log('FORCED-COLORS AUTOMATION — NOT AVAILABLE');
      test.skip(true, 'This browser does not expose reliable forced-colors emulation.');
      return;
    }

    await openRoute(page, '#home');
    await assertVisibleFocusIndicator(page, '#globalSearch');
    await expect(page.locator('#globalSearch')).toBeVisible();

    await openRoute(page, '#participate');
    const pollOption = page.getByRole('radio', { name: 'Very good', exact: true });
    await pollOption.check();
    await expect(pollOption).toBeChecked();
    await expect(pollOption).toHaveAccessibleName('Very good');

    await openRoute(page, '#events/guild-debate');
    await page.locator('#rsvpGoing').click();
    await expect(page.locator('#rsvpGoing')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('#rsvpGoing')).toContainText('Going');

    await openRoute(page, '#notifications');
    await expect(page.locator('.notification-row--unread .notification-state').first()).toHaveText('Unread notification');

    await openRoute(page, '#verification');
    await expect(page.locator('#verificationStatusKicker')).toContainText('Current');
    await expect(page.locator('[data-tier-current="2"]')).toContainText('Current');

    for (const locator of [page.locator('#tab-home'), page.locator('#notifBtn')]) {
      await expect(locator).toBeVisible();
      await expect(locator).toHaveAccessibleName(/.+/);
    }
    console.log(JSON.stringify({ forcedColors: 'active', forcedColorsResult: 'PASS' }));
  });

  test('manual matrix keeps human evidence separate from automation', async ({}, testInfo) => {
    onlyProject(testInfo, 'canonical-mobile');
    const matrix = await readFile(resolve(process.cwd(), 'tests/manual-accessibility-matrix.md'), 'utf8');
    expect(matrix).toContain('NVDA');
    expect(matrix).toContain('VoiceOver');
    expect(matrix).toContain('TalkBack');
    expect(matrix).toContain('200%');
    expect(matrix).toMatch(/MANUAL SCREEN-READER:[^\r\n]*NOT VERIFIED/);
    expect(matrix).toMatch(/200% BROWSER ZOOM[^\r\n]*NOT VERIFIED/);
    expect(matrix).toMatch(/NOT RUN/);
    expect(matrix).not.toMatch(/WCAG 2\.2 AA\s+(?:fully\s+)?PASS/i);
    console.log('MANUAL SCREEN-READER: NOT VERIFIED');
    console.log('200% BROWSER ZOOM: NOT VERIFIED');
  });
});
