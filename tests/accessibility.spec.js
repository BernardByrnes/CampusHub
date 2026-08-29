import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import {
  assertMinimumTarget,
  assertNoHorizontalOverflow,
  assertVisibleFocusIndicator,
  runAxe
} from './helpers/accessibility.js';

const AXE_ROUTES = [
  '#home',
  '#discover',
  '#participate',
  '#voice',
  '#voice-detail/voice-water-halls',
  '#voice-new',
  '#play',
  '#me',
  '#verification',
  '#privacy',
  '#notifications',
  '#news/innovation-week',
  '#news/notice-classes-rescheduled',
  '#events/guild-debate',
  '#opportunities/ra-climate',
  '#sports/mubs-mak'
];

const REFLOW_ROUTES = [...AXE_ROUTES];

const TARGET_ROUTES = [
  '#home',
  '#discover',
  '#participate',
  '#voice',
  '#voice-detail/voice-water-halls',
  '#voice-new',
  '#play',
  '#me',
  '#verification',
  '#privacy',
  '#notifications',
  '#news/innovation-week',
  '#events/guild-debate',
  '#opportunities/ra-climate',
  '#sports/mubs-mak'
];

async function resetDemo(page) {
  await page.evaluate(() => {
    window.CampusHubDebug.resetDemo();
    document.querySelectorAll('#toastWrap .toast').forEach(toast => toast.remove());
  });
}

async function openRoute(page, route, { reset = true } = {}) {
  const path = route.replace(/^#/, '').split('/')[0];
  const expectedView = ({
    events: 'event',
    opportunities: 'opportunity',
    sports: 'sports',
    news: 'news',
    'voice-detail': 'voice-detail',
    'voice-new': 'voice-new'
  })[path] || path || 'home';
  await page.goto(`/${route}`);
  if (reset) {
    await resetDemo(page);
    await page.goto(`/${route}`);
  }
  await expect(page.locator(`#view-${expectedView}.is-active`)).toHaveCount(1);
}

function onlyProject(testInfo, projectName) {
  test.skip(testInfo.project.name !== projectName, `This check runs once in ${projectName}.`);
}

test.describe('Phase 8U WCAG A/AA accessibility gate', () => {
  test('Axe reports zero WCAG A/AA violations on every canonical route', async ({ page }, testInfo) => {
    onlyProject(testInfo, 'canonical-mobile');
    test.setTimeout(180_000);
    const failures = [];
    for (const route of AXE_ROUTES) {
      await openRoute(page, route);
      const results = await runAxe(page);
      if (results.violations.length) failures.push({ route, violations: results.violations });
    }
    expect(failures, JSON.stringify(failures, null, 2)).toEqual([]);
  });

  test('top-level destinations use ordinary sections while Participate keeps true tabs', async ({ page }, testInfo) => {
    onlyProject(testInfo, 'canonical-mobile');
    await openRoute(page, '#participate');
    expect(await page.locator('.main > .view[role="tabpanel"]').count()).toBe(0);
    await expect(page.locator('[role="tablist"][aria-label="Participate sections"]')).toHaveCount(1);
    for (const [tab, panel] of [['#seg-polls', '#pane-polls'], ['#seg-voice', '#pane-voice']]) {
      await expect(page.locator(tab)).toHaveAttribute('role', 'tab');
      await expect(page.locator(tab)).toHaveAttribute('aria-controls', panel.slice(1));
      await expect(page.locator(panel)).toHaveAttribute('role', 'tabpanel');
      await expect(page.locator(panel)).toHaveAttribute('aria-labelledby', tab.slice(1));
    }
  });

  test('Participate tabs implement roving focus and the expected arrow/Home/End pattern', async ({ page }, testInfo) => {
    onlyProject(testInfo, 'canonical-mobile');
    await openRoute(page, '#participate');
    const polls = page.locator('#seg-polls');
    const voice = page.locator('#seg-voice');
    await polls.focus();
    await page.keyboard.press('ArrowRight');
    await expect(voice).toBeFocused();
    await expect(voice).toHaveAttribute('aria-selected', 'true');
    await page.keyboard.press('ArrowLeft');
    await expect(polls).toBeFocused();
    await expect(polls).toHaveAttribute('aria-selected', 'true');
    await page.keyboard.press('End');
    await expect(voice).toBeFocused();
    await page.keyboard.press('Home');
    await expect(polls).toBeFocused();
    await expect(polls).toHaveAttribute('tabindex', '0');
    await expect(voice).toHaveAttribute('tabindex', '-1');
  });

  test('core student journeys remain keyboard-operable end to end', async ({ page }, testInfo) => {
    onlyProject(testInfo, 'canonical-mobile');
    test.setTimeout(120_000);

    // Home search → Discover → publication → Back.
    await openRoute(page, '#home');
    await page.locator('#globalSearch').fill('innovation');
    await page.keyboard.press('Enter');
    await expect(page.locator('#view-discover')).toBeVisible();
    await page.locator('#discoverList a[href^="#news/"]').first().focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#view-news')).toBeVisible();
    await expect(page.locator('#newsDetailTitle')).toBeFocused();
    await page.locator('#view-news [data-back]').focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#view-discover')).toBeVisible();

    // Poll radio → Submit.
    await openRoute(page, '#participate');
    await page.getByRole('radio', { name: 'Very good', exact: true }).focus();
    await page.keyboard.press('Space');
    await page.locator('#submitPoll').focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#pollSuccess')).toBeVisible({ timeout: 2_000 });

    // Event RSVP.
    await openRoute(page, '#events/guild-debate');
    await expect(page.locator('#eventDetailTitle')).toBeFocused();
    const rsvpGoing = page.locator('#rsvpGoing');
    await expect(rsvpGoing).toBeVisible();
    await expect(rsvpGoing).toBeEnabled();
    await rsvpGoing.focus();
    await expect(rsvpGoing).toBeFocused();
    await rsvpGoing.press('Enter');
    await expect(rsvpGoing).toHaveAttribute('aria-pressed', 'true', { timeout: 2_000 });

    // Opportunity Save → external Apply dialog → Escape/focus restore.
    await openRoute(page, '#opportunities/ra-climate');
    await expect(page.locator('#opportunityDetailTitle')).toBeFocused();
    const oppSave = page.locator('#oppSave');
    await expect(oppSave).toBeVisible();
    await expect(oppSave).toBeEnabled();
    await oppSave.focus();
    await expect(oppSave).toBeFocused();
    await oppSave.press('Enter');
    await expect(oppSave).toHaveAttribute('aria-pressed', 'true');
    const oppApply = page.locator('#oppApply');
    await expect(oppApply).toBeVisible();
    await oppApply.focus();
    await expect(oppApply).toBeFocused();
    await oppApply.press('Enter');
    await expect(page.locator('#leaveCampusHubDialog')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(oppApply).toBeFocused();

    // Play quiz answer → Submit.
    await openRoute(page, '#play');
    await page.locator('#quizOptions input[type="radio"]').first().focus();
    await page.keyboard.press('Space');
    await page.locator('#quizSubmit').focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#quizFeedback')).toBeVisible({ timeout: 2_000 });

    // Voice list → issue detail → Back.
    await openRoute(page, '#voice');
    await page.locator('#voiceAllList a[data-voice-issue-id]').first().focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#voiceDetailTitle')).toBeFocused();
    await page.locator('#voiceDetailBack').focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#view-voice')).toBeVisible();

    // Voice composer Category → Details → Review → Submit.
    await page.locator('#voiceListNewBtn').focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#voiceStepCategory')).toBeVisible();
    // The composer schedules its entry-heading focus after the route change;
    // wait for that handoff before beginning the keyboard journey.
    await expect(page.locator('#voiceCategoryHeading')).toBeFocused();
    const voiceCategory = page.getByRole('radio', { name: 'Wi-Fi', exact: true });
    await voiceCategory.focus();
    await expect(voiceCategory).toBeFocused();
    await voiceCategory.press('Space');
    await expect(voiceCategory).toBeChecked();
    const voiceCategoryContinue = page.locator('#voiceCategoryContinue');
    await expect(voiceCategoryContinue).toBeVisible();
    await expect(voiceCategoryContinue).toBeEnabled();
    await voiceCategoryContinue.focus();
    await expect(voiceCategoryContinue).toBeFocused();
    await voiceCategoryContinue.press('Enter');
    await expect(page.locator('#voiceStepDetails')).toBeVisible();
    await page.locator('#voiceIssueTitle').focus();
    await page.keyboard.type('Water disruption');
    await page.locator('#voiceIssueDescription').focus();
    await page.keyboard.type('Water is unavailable most evenings and affects students using residence facilities.');
    await page.locator('#voiceDetailsContinue').focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#voiceStepReview')).toBeVisible();
    await page.locator('#voiceSubmitIssue').focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#voiceStepConfirmation')).toBeVisible({ timeout: 2_000 });
  });

  test('all representative visible actions expose a practical 44px target', async ({ page }, testInfo) => {
    onlyProject(testInfo, 'canonical-mobile');
    test.setTimeout(120_000);
    let count = 0;
    for (const route of TARGET_ROUTES) {
      await openRoute(page, route);
      count += await assertMinimumTarget(page, route);
    }
    expect(count).toBeGreaterThan(0);
  });

  test('skip link is first, visible on focus, and moves focus to the one main landmark', async ({ page }, testInfo) => {
    onlyProject(testInfo, 'canonical-mobile');
    await openRoute(page, '#home');
    await page.keyboard.press('Tab');
    const skip = page.locator('.skip-link');
    await expect(skip).toBeVisible();
    await expect(skip).toBeFocused();
    await expect(skip).toHaveText('Skip to main content');
    await page.keyboard.press('Enter');
    await expect(page.locator('main#main')).toBeFocused();
    expect(await page.locator('main').count()).toBe(1);
    await page.locator('#tab-home').focus();
    await page.keyboard.press('Tab');
    await expect(page.locator('#tab-discover')).toBeFocused();
  });

  test('primary navigation remains a normal navigation with one page-current item', async ({ page }, testInfo) => {
    onlyProject(testInfo, 'canonical-mobile');
    for (const route of ['#home', '#discover', '#participate', '#play', '#me', '#notifications']) {
      await openRoute(page, route);
      await expect(page.locator('nav.bottom-nav')).toHaveCount(1);
      await expect(page.locator('nav.bottom-nav [aria-selected]')).toHaveCount(0);
      await expect(page.locator('nav.bottom-nav [aria-current="page"]')).toHaveCount(1);
    }
  });

  test('direct detail entry focuses the heading and in-app Back does not leave focus hidden', async ({ page }, testInfo) => {
    onlyProject(testInfo, 'canonical-mobile');
    for (const [route, heading] of [
      ['#news/innovation-week', '#newsDetailTitle'],
      ['#events/guild-debate', '#eventDetailTitle'],
      ['#opportunities/ra-climate', '#opportunityDetailTitle'],
      ['#sports/mubs-mak', '#sportsDetailTitle'],
      ['#voice-detail/voice-water-halls', '#voiceDetailTitle'],
      ['#verification', '#verificationTitle'],
      ['#privacy', '#privacyTitle'],
      ['#notifications', '#notifTitle'],
      ['#voice-new', '#voiceCategoryHeading']
    ]) {
      await openRoute(page, route);
      await expect(page.locator(heading)).toBeFocused();
      const back = page.locator('.main > .view.is-active [data-back], .main > .view.is-active #voiceDetailBack').first();
      if (await back.count()) {
        const backHandle = await back.elementHandle();
        expect(backHandle).not.toBeNull();
        await back.click();
        // Wait for the clicked detail control to leave the active view before
        // inspecting focus; the hashchange handler is asynchronous.
        await page.waitForFunction(el => !el.closest('.main > .view.is-active'), backHandle);
        await expect(page.locator('.main > .view.is-active')).toBeVisible();
        const focusState = await page.evaluate(el => {
          const active = document.activeElement;
          return {
            isClickedBackFocused: active === el,
            isBodyFocused: active === document.body,
            isInsideHiddenView: !!active?.closest('.main > .view:not(.is-active)')
          };
        }, backHandle);
        expect(focusState.isClickedBackFocused).toBe(false);
        expect(focusState.isBodyFocused).toBe(false);
        expect(focusState.isInsideHiddenView).toBe(false);
      }
    }
  });

  test('Opportunity leave-campus dialog has a name, initial focus, Escape, and focus restoration', async ({ page }, testInfo) => {
    onlyProject(testInfo, 'canonical-mobile');
    await openRoute(page, '#opportunities/ra-climate');
    const apply = page.locator('#oppApply');
    await expect(apply).toBeVisible();
    await apply.focus();
    await page.keyboard.press('Enter');
    const dialog = page.locator('#leaveCampusHubDialog');
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAttribute('aria-labelledby', 'leaveCampusHubTitle');
    await expect(dialog.locator('#leaveCampusHubTitle')).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(apply).toBeFocused();
  });

  test('canonical form controls have names and validation errors are associated', async ({ page }, testInfo) => {
    onlyProject(testInfo, 'canonical-mobile');
    await openRoute(page, '#participate');
    for (const name of ['Very good', 'Good', 'Average', 'Poor', 'Very poor']) {
      await expect(page.getByRole('radio', { name, exact: true })).toHaveCount(1);
    }
    await openRoute(page, '#play');
    await expect(page.getByRole('radiogroup', { name: 'Which lake is the largest in East Africa?' })).toHaveCount(1);
    await expect(page.locator('#quizOptions input[type="radio"]').first()).toHaveAccessibleName(/.+/);
    await openRoute(page, '#voice-new');
    await expect(page.getByRole('radio', { name: 'Wi-Fi' })).toHaveCount(1);
    await page.locator('#voiceCategoryContinue').evaluate(button => { button.disabled = false; });
    await page.locator('#voiceCategoryContinue').click();
    await expect(page.locator('#voiceCategoryError')).toBeVisible();
    await expect(page.locator('.voice-category-fieldset')).toHaveAttribute('aria-describedby', /voiceCategoryError/);
    await page.locator('input[name="voiceCategory"]').first().check();
    await page.locator('#voiceCategoryContinue').click();
    await page.locator('#voiceDetailsContinue').click();
    await expect(page.locator('#voiceIssueTitle')).toHaveAttribute('aria-invalid', 'true');
    await expect(page.locator('#voiceIssueTitle')).toHaveAttribute('aria-describedby', /voiceTitleError/);
    await expect(page.locator('#voiceTitleError')).toBeVisible();
  });

  test('Discover uses one status announcement path for loading, error, offline, and search-empty', async ({ page }, testInfo) => {
    onlyProject(testInfo, 'canonical-mobile');
    await openRoute(page, '#discover');
    for (const state of ['loading', 'error', 'offline']) {
      await page.evaluate(nextState => window.CampusHubDebug.setDiscoverState(nextState), state);
      const liveRegion = state === 'offline' ? page.locator('#discoverSystemState [role="status"]') : page.locator('#discoverList[aria-live="polite"]');
      await expect(liveRegion).toHaveCount(1);
      expect(await page.locator('#discoverList[aria-live] [role="status"], #discoverSystemState[aria-live]').count()).toBe(0);
    }
    await page.evaluate(() => window.CampusHubDebug.setDiscoverState('ready'));
    await page.locator('#globalSearch').fill('no matching campus result');
    await expect(page.locator('#discoverList .discover-empty')).toHaveCount(1);
    await expect(page.locator('#discoverList')).toHaveAttribute('aria-live', 'polite');
    expect(await page.locator('#discoverList[aria-live] [role="status"], #discoverSystemState[aria-live]').count()).toBe(0);
  });

  test('important states retain text/semantic cues beyond colour', async ({ page }, testInfo) => {
    onlyProject(testInfo, 'canonical-mobile');
    await openRoute(page, '#opportunities/ra-climate');
    await page.evaluate(() => window.CampusHubDebug.setOpportunityScenario('expired'));
    await expect(page.locator('#oppStatus')).toContainText('Expired');
    await openRoute(page, '#verification');
    await expect(page.locator('#verificationStatusKicker')).toContainText('Current');
    await openRoute(page, '#notifications');
    await expect(page.locator('.notification-state').first()).toContainText(/Unread|Read/);
    await openRoute(page, '#voice-detail/voice-water-halls');
    await expect(page.locator('#voiceDetailStatus')).toHaveText(/.+/);
    await openRoute(page, '#events/guild-debate');
    await expect(page.locator('#rsvpGoing')).toHaveAttribute('aria-pressed', 'false');
  });

  test('representative focus indicators are visible', async ({ page }, testInfo) => {
    onlyProject(testInfo, 'canonical-mobile');
    await openRoute(page, '#home');
    for (const selector of ['#globalSearch', '#searchFilterBtn', '#notifBtn', '#tab-home', '#homePriority a']) {
      await assertVisibleFocusIndicator(page, selector);
    }
    await openRoute(page, '#participate');
    await assertVisibleFocusIndicator(page, '#seg-polls');
    await assertVisibleFocusIndicator(page, '#pollForm input[type="radio"]');
    await openRoute(page, '#voice-detail/voice-water-halls');
    await assertVisibleFocusIndicator(page, '#voiceDetailBack');
  });

  test('Sports keeps one complete accessible result announcement', async ({ page }, testInfo) => {
    onlyProject(testInfo, 'canonical-mobile');
    await openRoute(page, '#sports/mubs-mak');
    await expect(page.locator('#sportsScoreboard')).toHaveAttribute('role', 'group');
    await expect(page.locator('#sportsScoreboard')).toHaveAttribute('aria-label', /MUBS 1.*Makerere University 2/);
    await expect(page.locator('#sportsScoreboard [aria-hidden="true"]')).toHaveCount(3);
  });

  test('320px canonical route matrix has no page-level horizontal overflow', async ({ page }, testInfo) => {
    onlyProject(testInfo, 'small-mobile');
    for (const route of REFLOW_ROUTES) {
      await openRoute(page, route);
      await assertNoHorizontalOverflow(page, route);
    }
  });

  test('text-scale stress keeps the shell and controls usable', async ({ page }, testInfo) => {
    onlyProject(testInfo, 'small-mobile');
    await openRoute(page, '#home');
    await page.addStyleTag({ content: 'html { font-size: 125% !important; }' });
    await assertNoHorizontalOverflow(page, '#home at 125% text scale');
    await openRoute(page, '#participate');
    await assertNoHorizontalOverflow(page, '#participate at 125% text scale');
    await expect(page.locator('#seg-polls')).toBeVisible();
  });

  test('reduced motion preserves complete interaction and disables motion timings', async ({ page }, testInfo) => {
    onlyProject(testInfo, 'canonical-mobile');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await openRoute(page, '#home');
    const motion = await page.locator('#view-home').evaluate(element => {
      const style = getComputedStyle(element);
      return { animation: style.animationName, animationDuration: style.animationDuration, transitionDuration: style.transitionDuration, scrollBehavior: getComputedStyle(document.documentElement).scrollBehavior };
    });
    expect(motion.animation).toBe('none');
    expect(motion.scrollBehavior).toBe('auto');
    await page.locator('[data-testid="hero-read"]').click();
    await expect(page.locator('#view-news')).toBeVisible();
    await expect(page.locator('#newsDetailTitle')).toBeFocused();
  });

  test('runtime uses local assets and keeps accessibility utilities canonical', async ({}, testInfo) => {
    onlyProject(testInfo, 'canonical-mobile');
    const root = resolve(process.cwd());
    const files = ['index.html', 'css/tokens.css', 'css/components.css', 'css/app.css', 'js/demo-data.js', 'js/participation-evaluator.js', 'js/streak-engine.js', 'js/app.js'];
    const contents = await Promise.all(files.map(file => readFile(resolve(root, file), 'utf8')));
    const runtime = contents.join('\n');
    const [html, tokens, components, app, ...runtimeScripts] = contents;
    expect(html).not.toMatch(/<(?:link|script|img)[^>]+(?:href|src)=["']https?:\/\//i);
    expect(`${tokens}\n${components}\n${app}`).not.toMatch(/@import\s+url\(|url\(\s*["']https?:\/\//i);
    expect(runtimeScripts.join('\n').replace(/https:\/\/www\.mak\.ac\.ug\//g, '')).not.toMatch(/https?:\/\//i);
    expect(runtime).not.toMatch(/fonts\.googleapis|fonts\.gstatic|cdn\./i);
    expect(tokens).toMatch(/\.sr-only\s*,\s*\.visually-hidden\s*\{/);
    expect(components).not.toMatch(/\.sr-only\s*\{/);
  });

  test('normal product routes expose no accessibility debug UI', async ({ page }, testInfo) => {
    onlyProject(testInfo, 'canonical-mobile');
    await openRoute(page, '#home');
    await expect(page.locator('#debugVoiceScenario, button:has-text("Debug: Reset demo")')).toHaveCount(0);
    await expect(page.locator('body')).not.toContainText(/Axe|WCAG|screen-reader test/i);
  });
});
