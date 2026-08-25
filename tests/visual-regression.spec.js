import { expect, test } from '@playwright/test';

// Phase 7D captures a deliberately small, curated checkpoint set. The suite
// keeps normal visual comparisons explicit: snapshots are only rewritten when
// the developer passes --update-snapshots.
const SNAPSHOT_OPTIONS = Object.freeze({
  animations: 'disabled',
  caret: 'hide',
  maxDiffPixelRatio: 0.01,
  scale: 'css',
  threshold: 0.2
});

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

async function clearTransientUi(page) {
  await page.evaluate(() => {
    document.querySelectorAll('#toastWrap .toast').forEach(toast => toast.remove());
    document.activeElement?.blur?.();
    window.scrollTo(0, 0);
  });
}

async function waitForImages(page) {
  await page.evaluate(async () => {
    const images = [...document.images];
    images.forEach(image => {
      // Test-only DOM preparation: production lazy-loading remains unchanged.
      image.loading = 'eager';
    });
    await Promise.all(images.map(image => {
      const loaded = image.complete
        ? Promise.resolve()
        : new Promise(resolve => {
          image.addEventListener('load', resolve, { once: true });
          image.addEventListener('error', resolve, { once: true });
        });
      return loaded.then(() => image.decode?.().catch(() => undefined));
    }));
  });

  const brokenImages = await page.locator('img').evaluateAll(images => images
    .filter(image => {
      const style = getComputedStyle(image);
      return style.display !== 'none' && style.visibility !== 'hidden' && image.src && image.naturalWidth === 0;
    })
    .map(image => image.getAttribute('src')));
  expect(brokenImages, `visible images must load before a baseline: ${brokenImages.join(', ')}`).toEqual([]);
}

async function settle(page) {
  await page.waitForLoadState('domcontentloaded');
  await page.evaluate(() => document.fonts?.ready);
  await waitForImages(page);
  await page.waitForTimeout(80);
}

async function resetAndGo(page, hash) {
  await page.goto('/#home');
  await page.waitForFunction(() => typeof window.CampusHubDebug?.resetDemo === 'function');
  await page.evaluate(() => window.CampusHubDebug.resetDemo());
  await clearTransientUi(page);
  await page.goto(`/${hash}`);
  await expect(page.locator('#shell')).toBeVisible();
  await settle(page);
  await clearTransientUi(page);
}

async function resetAndGoVoiceValidation(page, scenario, issueId) {
  await resetAndGo(page, '#home');
  await page.evaluate(name => window.CampusHubDebug.setScenario(name), scenario);
  await clearTransientUi(page);
  await page.goto(`/#voice-detail/${issueId}`);
  await expect(page.locator('#view-voice-detail')).toBeVisible();
  await settle(page);
  await clearTransientUi(page);
}

async function captureShell(page, name) {
  // Mobile baselines target the complete student shell, not browser chrome or
  // an arbitrary pixel rectangle. The fixed bottom nav remains part of this
  // deterministic shell capture.
  await expect(page.locator('#shell')).toHaveScreenshot(name, SNAPSHOT_OPTIONS);
}

async function captureViewport(page, name) {
  // Desktop baselines keep the neutral outer page visible. Dialog baselines
  // also use the viewport so the fixed backdrop and modal placement are kept.
  await expect(page).toHaveScreenshot(name, SNAPSHOT_OPTIONS);
}

async function openPollAssuranceGate(page) {
  await resetAndGo(page, '#participate');
  await page.evaluate(() => window.CampusHubDebug.setScenario('assurance-required'));
  await clearTransientUi(page);
  await page.locator('#pollForm input[type="radio"]').first().check();
  await page.locator('#submitPoll').click();
  await expect(page.locator('#participationGate')).toBeVisible();
  await expect.poll(() => page.evaluate(() => document.activeElement?.id)).toBe('participationGateTitle');
  await settle(page);
}

test.describe('Phase 7D canonical visual regression baselines', () => {
  test.beforeEach(async ({ page }) => {
    // The frozen prototype permits Inter/system-sans. Empty font responses
    // make this Windows baseline deterministic with the system-sans fallback.
    await blockRemoteFonts(page);
    await page.emulateMedia({ reducedMotion: 'reduce' });
  });

  test.describe('canonical-mobile 390x844', () => {
    test.beforeEach(async ({ page }, testInfo) => {
      test.skip(testInfo.project.name !== 'canonical-mobile', 'The curated mobile matrix runs once at 390x844.');
    });

    test('home-390', async ({ page }) => {
      await resetAndGo(page, '#home');
      await captureShell(page, 'home-390.png');
    });

    test('discover-390', async ({ page }) => {
      await resetAndGo(page, '#discover');
      await captureShell(page, 'discover-390.png');
    });

    test('participate-polls-390', async ({ page }) => {
      await resetAndGo(page, '#participate');
      await captureShell(page, 'participate-polls-390.png');
    });

    test('participate-voice-390', async ({ page }) => {
      await resetAndGo(page, '#voice');
      await captureShell(page, 'participate-voice-390.png');
    });

    test('play-390', async ({ page }) => {
      await resetAndGo(page, '#play');
      await captureShell(page, 'play-390.png');
    });

    test('me-390', async ({ page }) => {
      await resetAndGo(page, '#me');
      await captureShell(page, 'me-390.png');
    });

    test('event-guild-debate-390', async ({ page }) => {
      await resetAndGo(page, '#events/guild-debate');
      await captureShell(page, 'event-guild-debate-390.png');
    });

    test('news-innovation-week-390', async ({ page }) => {
      await resetAndGo(page, '#news/innovation-week');
      await captureShell(page, 'news-innovation-week-390.png');
    });

    test('voice-water-halls-390', async ({ page }) => {
      await resetAndGo(page, '#voice-detail/voice-water-halls');
      await captureShell(page, 'voice-water-halls-390.png');
    });

    test('voice-action-planned-390', async ({ page }) => {
      await resetAndGoVoiceValidation(page, 'voice-action-planned', 'voice-lighting-path');
      await captureShell(page, 'voice-action-planned-390.png');
    });

    test('voice-resolved-390', async ({ page }) => {
      await resetAndGoVoiceValidation(page, 'voice-resolved', 'voice-library-sunday-hours');
      await captureShell(page, 'voice-resolved-390.png');
    });

    test('voice-composer-category-390', async ({ page }) => {
      await resetAndGo(page, '#voice-new');
      await expect(page.locator('#voiceStepCategory')).toBeVisible();
      await captureShell(page, 'voice-composer-category-390.png');
    });

    test('verification-l2-390', async ({ page }) => {
      await resetAndGo(page, '#verification');
      await captureShell(page, 'verification-l2-390.png');
    });

    test('gate-poll-assurance-390', async ({ page }) => {
      await openPollAssuranceGate(page);
      await captureViewport(page, 'gate-poll-assurance-390.png');
    });
  });

  test.describe('desktop 1280x900', () => {
    test.beforeEach(async ({ page }, testInfo) => {
      test.skip(testInfo.project.name !== 'desktop', 'The desktop checkpoint set runs once at 1280x900.');
    });

    test('home-1280', async ({ page }) => {
      await resetAndGo(page, '#home');
      await captureViewport(page, 'home-1280.png');
    });

    test('participate-polls-1280', async ({ page }) => {
      await resetAndGo(page, '#participate');
      await captureViewport(page, 'participate-polls-1280.png');
    });

    test('play-1280', async ({ page }) => {
      await resetAndGo(page, '#play');
      await captureViewport(page, 'play-1280.png');
    });

    test('gate-poll-assurance-1280', async ({ page }) => {
      await openPollAssuranceGate(page);
      await captureViewport(page, 'gate-poll-assurance-1280.png');
    });
  });

  test.describe('small-mobile 320x844', () => {
    test.beforeEach(async ({ page }, testInfo) => {
      test.skip(testInfo.project.name !== 'small-mobile', 'The small-mobile sentinel runs once at 320x844.');
    });

    test('home-320', async ({ page }) => {
      await resetAndGo(page, '#home');
      await captureShell(page, 'home-320.png');
    });

    test('participate-polls-320', async ({ page }) => {
      await resetAndGo(page, '#participate');
      await captureShell(page, 'participate-polls-320.png');
    });
  });
});
