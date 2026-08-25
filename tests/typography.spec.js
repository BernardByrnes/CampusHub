import { expect, test } from '@playwright/test';

async function goTo(page, hash) {
  await page.goto(`/${hash}`);
  await expect(page.locator('.view.is-active')).toBeVisible();
}

async function styleFor(page, selector) {
  return page.locator(selector).first().evaluate(element => {
    const style = getComputedStyle(element);
    return {
      fontSize: Number.parseFloat(style.fontSize),
      fontWeight: Number.parseFloat(style.fontWeight),
      letterSpacing: style.letterSpacing === 'normal' ? 0 : Number.parseFloat(style.letterSpacing),
      textTransform: style.textTransform,
      lineHeight: Number.parseFloat(style.lineHeight)
    };
  });
}

function expectNear(actual, expected, tolerance = 0.06) {
  expect(Math.abs(actual - expected)).toBeLessThanOrEqual(tolerance);
}

async function semanticColors(page, selector, tokens) {
  return page.locator(selector).first().evaluate((element, tokenMap) => {
    const resolve = (property, token) => {
      const probe = document.createElement('span');
      probe.style.cssText = 'position:fixed; opacity:0; pointer-events:none;';
      probe.style.setProperty(property, `var(${token})`);
      document.body.appendChild(probe);
      const value = getComputedStyle(probe)[property];
      probe.remove();
      return value;
    };
    const style = getComputedStyle(element);
    return {
      color: style.color,
      background: style.backgroundColor,
      border: style.borderTopColor,
      expected: {
        color: tokenMap.color ? resolve('color', tokenMap.color) : null,
        background: tokenMap.background ? resolve('background-color', tokenMap.background) : null,
        border: tokenMap.border ? resolve('border-top-color', tokenMap.border) : null
      }
    };
  }, tokens);
}

async function resetDemo(page) {
  await page.evaluate(() => window.CampusHubDebug.resetDemo());
}

test.describe('Phase 7C canonical typography roles', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'canonical-mobile', 'Computed typography checks run once at the canonical mobile viewport.');
    await page.route('https://fonts.googleapis.com/**', route => route.fulfill({ status: 200, contentType: 'text/css', body: '' }));
    await page.route('https://fonts.gstatic.com/**', route => route.fulfill({ status: 200, contentType: 'font/woff2', body: '' }));
    await goTo(page, '#home');
  });

  test('uses the frozen screen-title role on Participate, Me, and Play', async ({ page }) => {
    for (const hash of ['#participate', '#me', '#play']) {
      await goTo(page, hash);
      const style = await styleFor(page, '.view.is-active .view-title');
      expectNear(style.fontSize, 20);
      expect(style.fontWeight).toBe(700);
      expectNear(style.letterSpacing, -0.4, 0.08);
    }
  });

  test('uses the frozen hero and featured poll roles', async ({ page }) => {
    await goTo(page, '#home');
    const hero = await styleFor(page, '.hero-title');
    expectNear(hero.fontSize, 21);
    expect(hero.fontWeight).toBe(700);
    expectNear(hero.letterSpacing, -0.315, 0.08);

    await goTo(page, '#participate');
    const poll = await styleFor(page, '#pollQuestion');
    expectNear(poll.fontSize, 19);
    expect(poll.fontWeight).toBe(650);
    expectNear(poll.letterSpacing, -0.228, 0.08);
  });

  test('uses card, body, and metadata roles without promoting compact copy', async ({ page }) => {
    await goTo(page, '#me');
    const studentTitle = await styleFor(page, '[data-field="studentName"]');
    expectNear(studentTitle.fontSize, 16);
    expect(studentTitle.fontWeight).toBe(650);
    expectNear(studentTitle.letterSpacing, -0.128, 0.08);

    await goTo(page, '#discover');
    const discoverTitle = await styleFor(page, '#discoverList .title');
    expectNear(discoverTitle.fontSize, 16);
    expect(discoverTitle.fontWeight).toBe(650);

    await goTo(page, '#participate');
    const body = await styleFor(page, '#pane-polls .body-sm');
    const meta = await styleFor(page, '#pane-polls .meta');
    expectNear(body.fontSize, 13.5);
    expectNear(body.lineHeight, 20.25, 0.25);
    expectNear(meta.fontSize, 12.5);
  });

  test('normalizes kickers, labels, nav labels, and chips', async ({ page }) => {
    await goTo(page, '#home');
    const kicker = await styleFor(page, '#homePriority .kicker');
    expectNear(kicker.fontSize, 11);
    expect(kicker.fontWeight).toBe(700);
    expect(kicker.textTransform).toBe('uppercase');
    expectNear(kicker.letterSpacing, 0.77, 0.08);

    await page.setViewportSize({ width: 320, height: 844 });
    await goTo(page, '#home');
    const navLabels = page.locator('.bottom-nav .nav-item span');
    await expect(navLabels).toHaveCount(5);
    for (let index = 0; index < 5; index += 1) {
      const style = await styleFor(page, `.bottom-nav .nav-item:nth-child(${index + 1}) span`);
      expectNear(style.fontSize, 10.5);
      expect(style.fontWeight).toBe(600);
      const geometry = await navLabels.nth(index).evaluate(element => {
        const rect = element.getBoundingClientRect();
        const computed = getComputedStyle(element);
        return { height: rect.height, lineHeight: Number.parseFloat(computed.lineHeight), scrollWidth: element.scrollWidth, clientWidth: element.clientWidth };
      });
      expect(geometry.height).toBeLessThanOrEqual(geometry.lineHeight + 1);
      expect(geometry.scrollWidth).toBeLessThanOrEqual(geometry.clientWidth + 1);
    }

    await goTo(page, '#voice-detail/voice-water-halls');
    const pill = await styleFor(page, '#voiceDetailStatus');
    expect(pill.fontSize).toBeGreaterThanOrEqual(11.5);
    expect(pill.fontSize).toBeLessThanOrEqual(12);
    expect(pill.fontWeight).toBe(600);
    const label = await styleFor(page, '.voice-field-label');
    expectNear(label.fontSize, 14);
    expect(label.fontWeight).toBe(600);
  });

  test('keeps Play level identity dominant over the level-name chip', async ({ page }) => {
    await goTo(page, '#play');
    const level = await styleFor(page, '[data-field="levelDisplay"]');
    const levelName = await styleFor(page, '[data-field="levelTitle"]');
    expectNear(level.fontSize, 26);
    expect(level.fontWeight).toBe(800);
    expect(level.fontSize).toBeGreaterThan(levelName.fontSize);
    expect(levelName.fontSize).toBeGreaterThanOrEqual(11.5);
    expect(levelName.fontSize).toBeLessThanOrEqual(12);
  });

  test('uses semantic success, danger, info, and play families for representative states', async ({ page }) => {
    await resetDemo(page);
    await goTo(page, '#play');
    const correctIndex = await page.evaluate(() => window.CampusHubDemo.quiz.correctIndex);
    await page.locator('#quizOptions input').nth(correctIndex).check();
    await page.locator('#quizSubmit').click();
    await expect(page.locator('.quiz-opt.correct')).toBeVisible();
    let colors = await semanticColors(page, '.quiz-opt.correct', { border: '--success', background: '--success-soft' });
    expect(colors.border).toBe(colors.expected.border);
    expect(colors.background).toBe(colors.expected.background);

    await resetDemo(page);
    await goTo(page, '#play');
    const wrongIndex = correctIndex === 0 ? 1 : 0;
    await page.locator('#quizOptions input').nth(wrongIndex).check();
    await page.locator('#quizSubmit').click();
    await expect(page.locator('.quiz-opt.wrong')).toBeVisible();
    colors = await semanticColors(page, '.quiz-opt.wrong', { border: '--danger', background: '--danger-soft' });
    expect(colors.border).toBe(colors.expected.border);
    expect(colors.background).toBe(colors.expected.background);

    await resetDemo(page);
    await goTo(page, '#voice-detail/voice-water-halls');
    colors = await semanticColors(page, '#voiceDetailStatus', { color: '--info', background: '--info-soft', border: '--info-border' });
    expect(colors.color).toBe(colors.expected.color);
    expect(colors.background).toBe(colors.expected.background);
    expect(colors.border).toBe(colors.expected.border);

    await page.evaluate(() => window.CampusHubDebug.setScenario('voice-resolved'));
    await goTo(page, '#voice-detail/voice-library-sunday-hours');
    colors = await semanticColors(page, '#voiceDetailStatus', { color: '--success', background: '--success-soft' });
    expect(colors.color).toBe(colors.expected.color);
    expect(colors.background).toBe(colors.expected.background);

    await goTo(page, '#play');
    colors = await semanticColors(page, '#view-play .kicker--play', { color: '--play' });
    expect(colors.color).toBe(colors.expected.color);
  });
});

test.describe('Phase 7C responsive typography regression', () => {
  test('keeps representative screens readable at all frozen review widths', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'The width matrix runs once from the desktop project.');
    await page.route('https://fonts.googleapis.com/**', route => route.fulfill({ status: 200, contentType: 'text/css', body: '' }));
    await page.route('https://fonts.gstatic.com/**', route => route.fulfill({ status: 200, contentType: 'font/woff2', body: '' }));

    const widths = [
      [320, 844],
      [390, 844],
      [430, 932],
      [768, 1024],
      [1024, 900],
      [1280, 900]
    ];
    const routes = [
      ['#home', 'home'],
      ['#discover', 'discover'],
      ['#participate', 'participate'],
      ['#play', 'play'],
      ['#me', 'me'],
      ['#events/guild-debate', 'event'],
      ['#news/innovation-week', 'news'],
      ['#voice-new', 'voice-new'],
      ['#voice-detail/voice-water-halls', 'voice-detail'],
      ['#verification', 'verification']
    ];

    await page.setViewportSize({ width: widths[0][0], height: widths[0][1] });
    await goTo(page, '#home');

    for (const [width, height] of widths) {
      await page.setViewportSize({ width, height });
      for (const [hash, view] of routes) {
        await page.evaluate(nextHash => { location.hash = nextHash; }, hash);
        await page.waitForFunction(expected => document.querySelector('.view.is-active')?.getAttribute('data-view') === expected, view);
        const snapshot = await page.evaluate(() => {
          const active = document.querySelector('.view.is-active');
          const visible = element => {
            if (!element || element.hidden) return false;
            const style = getComputedStyle(element);
            const rect = element.getBoundingClientRect();
            return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
          };
          const withinViewport = element => {
            const rect = element.getBoundingClientRect();
            return rect.left >= -1 && rect.right <= window.innerWidth + 1;
          };
          const titles = Array.from(active?.querySelectorAll('.view-title, .detail-title, .voice-detail-title, .voice-composer-title, .title, .small-card-title') || []).filter(visible);
          const buttons = Array.from(active?.querySelectorAll('.btn') || []).filter(visible);
          const cards = Array.from(active?.querySelectorAll('.card') || []).filter(visible);
          const navLabels = Array.from(document.querySelectorAll('.bottom-nav .nav-item span')).filter(visible);
          return {
            horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth + 1 || document.body.scrollWidth > window.innerWidth + 1,
            titleClipping: titles.some(element => element.scrollWidth > element.clientWidth + 1),
            titlesWithinViewport: titles.every(withinViewport),
            buttonsWithinViewport: buttons.every(withinViewport),
            cardsWithinViewport: cards.every(withinViewport),
            navLabelsReadable: navLabels.length === 5 && navLabels.every(element => {
              const rect = element.getBoundingClientRect();
              const style = getComputedStyle(element);
              return rect.height <= Number.parseFloat(style.lineHeight) + 1 && element.scrollWidth <= element.clientWidth + 1;
            })
          };
        });
        expect(snapshot.horizontalOverflow, `${view} at ${width}px should not overflow horizontally`).toBe(false);
        expect(snapshot.titleClipping, `${view} at ${width}px has clipped title text`).toBe(false);
        expect(snapshot.titlesWithinViewport, `${view} at ${width}px has an off-screen title`).toBe(true);
        expect(snapshot.buttonsWithinViewport, `${view} at ${width}px has an off-screen button`).toBe(true);
        expect(snapshot.cardsWithinViewport, `${view} at ${width}px has an off-screen card`).toBe(true);
        expect(snapshot.navLabelsReadable, `${view} at ${width}px has an unreadable nav label`).toBe(true);
      }
    }
  });
});
