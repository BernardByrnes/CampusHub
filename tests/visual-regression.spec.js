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

async function expectMobileNavReady(page) {
  const navState = await page.locator('.bottom-nav').evaluate(nav => {
    const shell = document.querySelector('#shell');
    const main = document.querySelector('#main');
    const navRect = nav.getBoundingClientRect();
    const shellRect = shell?.getBoundingClientRect();
    const navStyle = getComputedStyle(nav);
    const mainStyle = main ? getComputedStyle(main) : null;
    return {
      visible: navStyle.display !== 'none'
        && navStyle.visibility !== 'hidden'
        && navRect.width > 0
        && navRect.height > 0,
      position: navStyle.position,
      navBottom: navRect.bottom,
      viewportHeight: window.innerHeight,
      navWidth: navRect.width,
      viewportWidth: window.innerWidth,
      shellWidth: shellRect?.width ?? 0,
      navHeight: navRect.height,
      mainPaddingBottom: Number.parseFloat(mainStyle?.paddingBottom || '0')
    };
  });

  expect(navState.visible).toBe(true);
  expect(navState.position).toBe('fixed');
  expect(Math.abs(navState.navBottom - navState.viewportHeight)).toBeLessThanOrEqual(1);
  expect(navState.navWidth).toBeLessThanOrEqual(Math.min(navState.shellWidth, navState.viewportWidth) + 1);
  expect(navState.mainPaddingBottom + 1).toBeGreaterThanOrEqual(navState.navHeight);
}

async function captureMobileViewport(page, name) {
  // Mobile goldens intentionally represent the real viewport because the
  // student bottom navigation is fixed. Tall locator screenshots are not used
  // because Playwright stitching can relocate fixed elements over lower content.
  await expectMobileNavReady(page);
  await expect(page).toHaveScreenshot(name, SNAPSHOT_OPTIONS);
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
      await captureMobileViewport(page, 'home-390.png');
    });

    test('discover-390', async ({ page }) => {
      await resetAndGo(page, '#discover');
      await captureMobileViewport(page, 'discover-390.png');
    });

    test('discover-search-empty-390', async ({ page }) => {
      await resetAndGo(page, '#discover');
      await page.getByLabel('Search campus content').fill('zz-campus-no-match');
      await expect(page.locator('#discoverList')).toContainText('No campus information matches that search.');
      await expect(page.getByRole('button', { name:'Clear search' })).toBeVisible();
      await clearTransientUi(page);
      await settle(page);
      await captureMobileViewport(page, 'discover-search-empty-390.png');
    });

    test('discover-loading-390', async ({ page }) => {
      await resetAndGo(page, '#discover');
      await page.evaluate(() => window.CampusHubDebug.setDiscoverState('loading'));
      await expect(page.locator('#discoverList')).toHaveAttribute('aria-busy', 'true');
      await expect(page.locator('#discoverList .discover-skeleton')).toHaveCount(3);
      await clearTransientUi(page);
      await settle(page);
      await captureMobileViewport(page, 'discover-loading-390.png');
    });

    test('discover-error-390', async ({ page }) => {
      await resetAndGo(page, '#discover');
      await page.evaluate(() => window.CampusHubDebug.setDiscoverState('error'));
      await expect(page.locator('#discoverList')).toContainText('We couldn’t load campus information.');
      await expect(page.getByRole('button', { name:'Try again' })).toBeVisible();
      await clearTransientUi(page);
      await settle(page);
      await captureMobileViewport(page, 'discover-error-390.png');
    });

    test('discover-offline-390', async ({ page }) => {
      await resetAndGo(page, '#discover');
      await page.evaluate(() => window.CampusHubDebug.setDiscoverState('offline'));
      await expect(page.locator('#discoverSystemState')).toContainText('You’re offline. Showing cached campus information.');
      await expect(page.locator('#discoverList [data-discover-id]')).toHaveCount(4);
      await clearTransientUi(page);
      await settle(page);
      await captureMobileViewport(page, 'discover-offline-390.png');
    });

    test('sports-mubs-mak-390', async ({ page }) => {
      await resetAndGo(page, '#sports/mubs-mak');
      await expect(page.locator('#sportsDetailTitle')).toHaveText('MUBS 1 — 2 Makerere University');
      await expect(page.locator('[data-field="sportsStatus"]')).toHaveText('Final');
      await clearTransientUi(page);
      await settle(page);
      await captureMobileViewport(page, 'sports-mubs-mak-390.png');
    });

    test('participate-polls-390', async ({ page }) => {
      await resetAndGo(page, '#participate');
      await captureMobileViewport(page, 'participate-polls-390.png');
    });

    test('participate-voice-390', async ({ page }) => {
      await resetAndGo(page, '#voice');
      await captureMobileViewport(page, 'participate-voice-390.png');
    });

    test('play-390', async ({ page }) => {
      await resetAndGo(page, '#play');
      await captureMobileViewport(page, 'play-390.png');
    });

    test('me-390', async ({ page }) => {
      await resetAndGo(page, '#me');
      await captureMobileViewport(page, 'me-390.png');
    });

    test('privacy-390', async ({ page }) => {
      await resetAndGo(page, '#privacy');
      await captureMobileViewport(page, 'privacy-390.png');
    });

    test('notifications-390', async ({ page }) => {
      await resetAndGo(page, '#notifications');
      await captureMobileViewport(page, 'notifications-390.png');
    });

    test('event-guild-debate-390', async ({ page }) => {
      await resetAndGo(page, '#events/guild-debate');
      await captureMobileViewport(page, 'event-guild-debate-390.png');
    });

    test('opportunity-ra-climate-390', async ({ page }) => {
      await resetAndGo(page, '#opportunities/ra-climate');
      await captureMobileViewport(page, 'opportunity-ra-climate-390.png');
    });

    test('opportunity-expired-390', async ({ page }) => {
      await resetAndGo(page, '#home');
      await page.evaluate(() => window.CampusHubDebug.setOpportunityScenario('expired'));
      await page.goto('/#opportunities/ra-climate');
      await expect(page.locator('#oppStatus')).toBeVisible();
      await settle(page);
      await clearTransientUi(page);
      await captureMobileViewport(page, 'opportunity-expired-390.png');
    });

    test('opportunity-leave-dialog-390', async ({ page }) => {
      await resetAndGo(page, '#opportunities/ra-climate');
      await page.locator('#oppApply').click();
      await expect(page.locator('#leaveCampusHubDialog')).toBeVisible();
      await expect.poll(() => page.evaluate(() => document.activeElement?.id)).toBe('leaveCampusHubTitle');
      await settle(page);
      await captureMobileViewport(page, 'opportunity-leave-dialog-390.png');
    });

    test('news-innovation-week-390', async ({ page }) => {
      await resetAndGo(page, '#news/innovation-week');
      await captureMobileViewport(page, 'news-innovation-week-390.png');
    });

    test('news-notice-390', async ({ page }) => {
      await resetAndGo(page, '#news/notice-classes-rescheduled');
      await captureMobileViewport(page, 'news-notice-390.png');
    });

    test('voice-water-halls-390', async ({ page }) => {
      await resetAndGo(page, '#voice-detail/voice-water-halls');
      await captureMobileViewport(page, 'voice-water-halls-390.png');
    });

    test('voice-action-planned-390', async ({ page }) => {
      await resetAndGoVoiceValidation(page, 'voice-action-planned', 'voice-lighting-path');
      await captureMobileViewport(page, 'voice-action-planned-390.png');
    });

    test('voice-resolved-390', async ({ page }) => {
      await resetAndGoVoiceValidation(page, 'voice-resolved', 'voice-library-sunday-hours');
      await captureMobileViewport(page, 'voice-resolved-390.png');
    });

    test('voice-composer-category-390', async ({ page }) => {
      await resetAndGo(page, '#voice-new');
      await expect(page.locator('#voiceStepCategory')).toBeVisible();
      await captureMobileViewport(page, 'voice-composer-category-390.png');
    });

    test('voice-composer-details-390', async ({ page }) => {
      await resetAndGo(page, '#voice-new');
      await page.locator('input[name="voiceCategory"]').first().check();
      await page.locator('#voiceCategoryContinue').click();
      await expect(page.locator('#voiceStepDetails')).toBeVisible();
      await clearTransientUi(page);
      await settle(page);
      await captureMobileViewport(page, 'voice-composer-details-390.png');
    });

    test('voice-composer-review-390', async ({ page }) => {
      await resetAndGo(page, '#voice-new');
      await page.locator('input[name="voiceCategory"]').first().check();
      await page.locator('#voiceCategoryContinue').click();
      await page.locator('#voiceIssueTitle').fill('Irregular water supply in Halls');
      await page.locator('#voiceIssueDescription').fill('Water is unavailable most evenings and affects students using the residence facilities.');
      await page.locator('#voiceDetailsContinue').click();
      await expect(page.locator('#voiceStepReview')).toBeVisible();
      await clearTransientUi(page);
      await settle(page);
      await captureMobileViewport(page, 'voice-composer-review-390.png');
    });

    test('voice-composer-submitted-390', async ({ page }) => {
      await resetAndGo(page, '#voice-new');
      await page.locator('input[name="voiceCategory"]').first().check();
      await page.locator('#voiceCategoryContinue').click();
      await page.locator('#voiceIssueTitle').fill('Irregular water supply in Halls');
      await page.locator('#voiceIssueDescription').fill('Water is unavailable most evenings and affects students using the residence facilities.');
      await page.locator('#voiceDetailsContinue').click();
      await page.locator('#voiceSubmitIssue').click();
      await expect(page.locator('#voiceStepConfirmation')).toBeVisible();
      await clearTransientUi(page);
      await settle(page);
      await captureMobileViewport(page, 'voice-composer-submitted-390.png');
    });

    test('verification-l2-390', async ({ page }) => {
      await resetAndGo(page, '#verification');
      await captureMobileViewport(page, 'verification-l2-390.png');
    });

    test('gate-poll-assurance-390', async ({ page }) => {
      await openPollAssuranceGate(page);
      await captureMobileViewport(page, 'gate-poll-assurance-390.png');
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

    test('news-innovation-week-1280', async ({ page }) => {
      await resetAndGo(page, '#news/innovation-week');
      await captureViewport(page, 'news-innovation-week-1280.png');
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

    test('verification-l2-1280', async ({ page }) => {
      await resetAndGo(page, '#verification');
      await captureViewport(page, 'verification-l2-1280.png');
    });

    test('opportunity-leave-dialog-1280', async ({ page }) => {
      await resetAndGo(page, '#opportunities/ra-climate');
      await page.locator('#oppApply').click();
      await expect(page.locator('#leaveCampusHubDialog')).toBeVisible();
      await expect.poll(() => page.evaluate(() => document.activeElement?.id)).toBe('leaveCampusHubTitle');
      await settle(page);
      await captureViewport(page, 'opportunity-leave-dialog-1280.png');
    });

    test('opportunity-ra-climate-1280', async ({ page }) => {
      await resetAndGo(page, '#opportunities/ra-climate');
      await captureViewport(page, 'opportunity-ra-climate-1280.png');
    });

    test('sports-mubs-mak-1280', async ({ page }) => {
      await resetAndGo(page, '#sports/mubs-mak');
      await expect(page.locator('#sportsDetailTitle')).toHaveText('MUBS 1 — 2 Makerere University');
      await expect(page.locator('[data-field="sportsStatus"]')).toHaveText('Final');
      await clearTransientUi(page);
      await settle(page);
      await captureViewport(page, 'sports-mubs-mak-1280.png');
    });

    test('event-guild-debate-1280', async ({ page }) => {
      await resetAndGo(page, '#events/guild-debate');
      await expect(page.locator('#eventDetailTitle')).toHaveText('Guild Public Debate: The Future of AI in Africa');
      await clearTransientUi(page);
      await settle(page);
      await captureViewport(page, 'event-guild-debate-1280.png');
    });

    test('me-1280', async ({ page }) => {
      await resetAndGo(page, '#me');
      await captureViewport(page, 'me-1280.png');
    });

    test('privacy-1280', async ({ page }) => {
      await resetAndGo(page, '#privacy');
      await captureViewport(page, 'privacy-1280.png');
    });

    test('notifications-1280', async ({ page }) => {
      await resetAndGo(page, '#notifications');
      await captureViewport(page, 'notifications-1280.png');
    });
  });

  test.describe('small-mobile 320x844', () => {
    test.beforeEach(async ({ page }, testInfo) => {
      test.skip(testInfo.project.name !== 'small-mobile', 'The small-mobile sentinel runs once at 320x844.');
    });

    test('home-320', async ({ page }) => {
      await resetAndGo(page, '#home');
      await captureMobileViewport(page, 'home-320.png');
    });

    test('participate-polls-320', async ({ page }) => {
      await resetAndGo(page, '#participate');
      await captureMobileViewport(page, 'participate-polls-320.png');
    });
  });
});
