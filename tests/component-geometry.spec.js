import { expect, test } from '@playwright/test';

async function goTo(page, hash) {
  await page.goto(`/${hash}`);
}

async function blockExternalFonts(page) {
  await Promise.all([
    page.route('https://fonts.googleapis.com/**', route => route.fulfill({
      status: 200,
      contentType: 'text/css',
      body: ''
    })),
    page.route('https://fonts.gstatic.com/**', route => route.fulfill({
      status: 200,
      contentType: 'font/woff2',
      body: ''
    }))
  ]);
}

async function geometry(page, selector) {
  return page.locator(selector).evaluate(element => {
    const style = getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    return {
      width: rect.width,
      height: rect.height,
      borderRadius: parseFloat(style.borderTopLeftRadius),
      paddingTop: parseFloat(style.paddingTop),
      paddingRight: parseFloat(style.paddingRight),
      paddingBottom: parseFloat(style.paddingBottom),
      paddingLeft: parseFloat(style.paddingLeft),
      marginTop: parseFloat(style.marginTop),
      boxShadow: style.boxShadow
    };
  });
}

async function expectNoHorizontalOverflow(page, route) {
  const metrics = await page.evaluate(() => ({
    viewportWidth: window.innerWidth,
    documentWidth: document.documentElement.scrollWidth,
    bodyWidth: document.body.scrollWidth,
    viewWidth: document.querySelector('.view.is-active')?.getBoundingClientRect().width || 0
  }));
  expect(metrics.documentWidth, `${route} document should fit its viewport`).toBeLessThanOrEqual(metrics.viewportWidth);
  expect(metrics.bodyWidth, `${route} body should fit its viewport`).toBeLessThanOrEqual(metrics.viewportWidth);
  expect(metrics.viewWidth, `${route} active view should fit its viewport`).toBeLessThanOrEqual(metrics.viewportWidth);
}

async function openAssuranceGate(page) {
  await goTo(page, '#home');
  await page.evaluate(() => {
    window.CampusHubDebug.resetDemo();
    window.CampusHubDebug.setScenario('assurance-required');
  });
  await goTo(page, '#participate');
  await page.locator('#pollForm input[type="radio"]').first().check();
  await page.locator('#submitPoll').click();
  await expect(page.locator('#participationGate')).toBeVisible();
}

test.describe('Phase 7B frozen component geometry', () => {
  // Chromium on Windows can report a CSS min-height of 51.99997px for a
  // 52px option after a long multi-project run. Keep the exact assertions,
  // but retry this read-only geometry suite once so subpixel timing noise
  // cannot make the full regression run nondeterministic.
  test.describe.configure({ retries: 1 });

  test.beforeEach(async ({ page }) => {
    await blockExternalFonts(page);
  });

  test('uses the canonical 16px card radius and card-pad on Home and Participate', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'canonical-mobile', 'Detailed geometry runs once at the canonical 390px viewport.');

    for (const card of [
      { route: '#home', selector: '#homePriority' },
      { route: '#participate', selector: '#pollCard' }
    ]) {
      await goTo(page, card.route);
      const metrics = await geometry(page, card.selector);
      expect(metrics.borderRadius).toBeCloseTo(16, 0);
      expect(metrics.paddingTop).toBeCloseTo(16, 0);
      expect(metrics.paddingRight).toBeCloseTo(16, 0);
      expect(metrics.paddingBottom).toBeCloseTo(16, 0);
      expect(metrics.paddingLeft).toBeCloseTo(16, 0);
      expect(metrics.boxShadow).toContain('1px 2px');
    }

    await goTo(page, '#home');
    expect((await geometry(page, '#homePoll')).borderRadius).toBeCloseTo(16, 0);
  });

  test('keeps shared stacks at 12px and section boundaries at 20px', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'canonical-mobile', 'Detailed geometry runs once at the canonical 390px viewport.');

    await goTo(page, '#home');
    expect((await geometry(page, '#homePoll')).marginTop).toBeCloseTo(12, 0);
    expect((await geometry(page, '#homeEvent')).marginTop).toBeCloseTo(12, 0);

    await goTo(page, '#me');
    const sectionHead = page.locator('#view-me .section-head').first();
    await expect(sectionHead).toBeVisible();
    expect(parseFloat(await sectionHead.evaluate(element => getComputedStyle(element).marginTop))).toBeCloseTo(20, 0);
  });

  test('uses 40px icon tiles with 12px radius and approximately 20px SVGs', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'canonical-mobile', 'Detailed geometry runs once at the canonical 390px viewport.');

    await goTo(page, '#home');
    const tile = page.locator('#homeEvent .icon-tile');
    const metrics = await geometry(page, '#homeEvent .icon-tile');
    const icon = await tile.locator('svg').evaluate(element => {
      const rect = element.getBoundingClientRect();
      return { width: rect.width, height: rect.height };
    });
    expect(metrics.width).toBeCloseTo(40, 0);
    expect(metrics.height).toBeCloseTo(40, 0);
    expect(metrics.borderRadius).toBeCloseTo(12, 0);
    expect(icon.width).toBeCloseTo(20, 0);
    expect(icon.height).toBeCloseTo(20, 0);
  });

  test('keeps normal controls at 44px and small controls at 36px minimum height', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'canonical-mobile', 'Detailed geometry runs once at the canonical 390px viewport.');

    await goTo(page, '#participate');
    const normal = await geometry(page, '#submitPoll');
    expect(normal.height).toBeGreaterThanOrEqual(44);

    await goTo(page, '#events/guild-debate');
    const small = await geometry(page, '#eventSave');
    expect(small.height).toBeGreaterThanOrEqual(36);
  });

  test('keeps every Poll option at least 52px at the two canonical mobile widths', async ({ page }, testInfo) => {
    test.skip(!['small-mobile', 'canonical-mobile'].includes(testInfo.project.name), 'Poll option geometry runs at 320px and 390px.');

    await goTo(page, '#participate');
    const options = await page.locator('#pollForm .poll-option').evaluateAll(elements => elements.map(element => {
      const rect = element.getBoundingClientRect();
      const input = element.querySelector('input').getBoundingClientRect();
      return {
        height: rect.height,
        clientHeight: element.clientHeight,
        scrollHeight: element.scrollHeight,
        inputWidth: input.width,
        inputHeight: input.height
      };
    }));
    expect(options).toHaveLength(5);
    for (const option of options) {
      expect(option.height).toBeGreaterThanOrEqual(52);
      expect(option.scrollHeight).toBeLessThanOrEqual(option.clientHeight + 2);
      expect(option.inputWidth).toBeGreaterThan(0);
      expect(option.inputHeight).toBeGreaterThan(0);
    }
  });

  test('keeps Quiz options at least 52px and preserves correct-result rendering', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'canonical-mobile', 'Detailed geometry runs once at the canonical 390px viewport.');

    await goTo(page, '#play');
    const before = await page.locator('#quizOptions .quiz-opt').evaluateAll(elements => elements.map(element => ({
      height: element.getBoundingClientRect().height,
      inputWidth: element.querySelector('input').getBoundingClientRect().width,
      inputHeight: element.querySelector('input').getBoundingClientRect().height
    })));
    expect(before.length).toBeGreaterThan(1);
    for (const option of before) {
      expect(option.height).toBeGreaterThanOrEqual(52);
      expect(option.inputWidth).toBeGreaterThan(0);
      expect(option.inputHeight).toBeGreaterThan(0);
    }

    await page.locator('#quizOptions .quiz-opt').first().click();
    await page.locator('#quizSubmit').click();
    await expect(page.locator('#quizFeedback')).toBeVisible();
    await expect(page.locator('#quizOptions .quiz-opt.correct')).toHaveCount(1);
    const after = await page.locator('#quizOptions .quiz-opt').evaluateAll(elements => elements.map(element => element.getBoundingClientRect().height));
    for (const height of after) expect(height).toBeGreaterThanOrEqual(52);
  });

  test('uses the 12px field radius for Voice title and description inputs', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'canonical-mobile', 'Detailed geometry runs once at the canonical 390px viewport.');

    await goTo(page, '#voice-new');
    await page.locator('#voiceComposerForm input[name="voiceCategory"]').first().check();
    await page.locator('#voiceCategoryContinue').click();
    await expect(page.locator('#voiceIssueTitle')).toBeVisible();
    await expect(page.locator('#voiceIssueDescription')).toBeVisible();
    expect((await geometry(page, '#voiceIssueTitle')).borderRadius).toBeCloseTo(12, 0);
    expect((await geometry(page, '#voiceIssueDescription')).borderRadius).toBeCloseTo(12, 0);
  });

  test('gives filter chips a 38px visual with a 44px practical hit area', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'canonical-mobile', 'Detailed geometry runs once at the canonical 390px viewport.');

    await goTo(page, '#discover');
    const filter = page.locator('#discoverFilters .filter-chip').first();
    const metrics = await filter.evaluate(element => {
      const rect = element.getBoundingClientRect();
      const visual = getComputedStyle(element, '::before');
      const top = parseFloat(visual.top) || 0;
      const bottom = parseFloat(visual.bottom) || 0;
      const borderTop = parseFloat(visual.borderTopWidth) || 0;
      const borderBottom = parseFloat(visual.borderBottomWidth) || 0;
      return {
        tagName: element.tagName,
        targetWidth: rect.width,
        targetHeight: rect.height,
        visualHeight: parseFloat(visual.height) + borderTop + borderBottom,
        insetVisualHeight: rect.height - top - bottom,
        visualBackground: visual.backgroundColor
      };
    });
    expect(metrics.tagName).toBe('BUTTON');
    expect(metrics.targetHeight).toBeGreaterThanOrEqual(44);
    expect(metrics.targetWidth).toBeGreaterThanOrEqual(44);
    expect(metrics.visualHeight).toBeGreaterThanOrEqual(37);
    expect(metrics.visualHeight).toBeLessThanOrEqual(39);
    expect(metrics.insetVisualHeight).toBeGreaterThanOrEqual(37);
    expect(metrics.insetVisualHeight).toBeLessThanOrEqual(39);
    expect(metrics.visualBackground).not.toBe('rgba(0, 0, 0, 0)');
  });

  test('uses the canonical restrained dialog elevation', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'canonical-mobile', 'Detailed geometry runs once at the canonical 390px viewport.');

    await openAssuranceGate(page);
    const metrics = await page.locator('#participationGate .participation-gate__panel').evaluate(element => ({
      boxShadow: getComputedStyle(element).boxShadow,
      token: getComputedStyle(document.documentElement).getPropertyValue('--dialog-shadow').trim()
    }));
    expect(metrics.token).toContain('0 12px 32px');
    expect(metrics.token).toContain('rgba(16,24,40,.16)');
    expect(metrics.boxShadow).toContain('12px 32px');
  });

  test('keeps all required student surfaces overflow-free at frozen responsive widths', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'All frozen responsive widths run from the desktop project.');

    const routes = [
      ['#home', '#view-home'],
      ['#discover', '#view-discover'],
      ['#participate', '#view-participate'],
      ['#play', '#view-play'],
      ['#me', '#view-me'],
      ['#events/guild-debate', '#view-event'],
      ['#voice-new', '#view-voice-new'],
      ['#voice-detail/voice-water-halls', '#view-voice-detail']
    ];
    const widths = [
      { width: 320, height: 844 },
      { width: 390, height: 844 },
      { width: 430, height: 932 },
      { width: 768, height: 1024 },
      { width: 1024, height: 900 },
      { width: 1280, height: 900 }
    ];

    for (const viewport of widths) {
      await page.setViewportSize(viewport);
      for (const [route, view] of routes) {
        await goTo(page, route);
        await expect(page.locator(view)).toBeVisible();
        await expectNoHorizontalOverflow(page, `${route} at ${viewport.width}px`);

        if (route === '#participate') {
          await page.locator('#seg-voice').click();
          await expect(page.locator('#pane-voice')).toBeVisible();
          await expectNoHorizontalOverflow(page, `${route} Student Voice at ${viewport.width}px`);
          await page.locator('#seg-polls').click();
        }
      }

      await openAssuranceGate(page);
      await expectNoHorizontalOverflow(page, `#participate contextual gate at ${viewport.width}px`);
      await page.locator('#participationGateSecondary').click();
      await page.evaluate(() => window.CampusHubDebug.resetDemo());
    }
  });
});
