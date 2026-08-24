import { expect, test } from '@playwright/test';

async function goTo(page, hash) {
  await page.goto(`/${hash}`);
}

async function resetDemo(page) {
  await page.evaluate(() => window.CampusHubDebug.resetDemo());
}

test.describe('Phase 6E Participate ARIA tabs', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'canonical-mobile', 'Detailed Participate tab coverage runs once in canonical-mobile.');
    await page.route('https://fonts.googleapis.com/**', route => route.fulfill({ status:200, contentType:'text/css', body:'' }));
    await page.route('https://fonts.gstatic.com/**', route => route.fulfill({ status:200, contentType:'font/woff2', body:'' }));
    await goTo(page, '#participate');
    await resetDemo(page);
    await goTo(page, '#participate');
  });

  test('exposes the complete tab and panel semantic relationships', async ({ page }) => {
    await expect(page.locator('[role="tablist"][aria-label="Participate sections"]')).toHaveCount(1);
    for(const id of ['seg-polls', 'seg-voice']){
      const tab = page.locator(`#${id}`);
      await expect(tab).toHaveAttribute('role', 'tab');
      await expect(tab).toHaveAttribute('aria-controls', id === 'seg-polls' ? 'pane-polls' : 'pane-voice');
    }
    await expect(page.locator('#pane-polls')).toHaveAttribute('role', 'tabpanel');
    await expect(page.locator('#pane-polls')).toHaveAttribute('aria-labelledby', 'seg-polls');
    await expect(page.locator('#pane-voice')).toHaveAttribute('role', 'tabpanel');
    await expect(page.locator('#pane-voice')).toHaveAttribute('aria-labelledby', 'seg-voice');
  });

  test('starts on Polls with a single active tab and visible panel', async ({ page }) => {
    await expect(page.locator('#seg-polls')).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('#seg-polls')).toHaveAttribute('tabindex', '0');
    await expect(page.locator('#seg-voice')).toHaveAttribute('aria-selected', 'false');
    await expect(page.locator('#seg-voice')).toHaveAttribute('tabindex', '-1');
    await expect(page.locator('#pane-polls')).toBeVisible();
    await expect(page.locator('#pane-voice')).toBeHidden();
  });

  test('clicking Student Voice updates selection, roving tabindex and panels', async ({ page }) => {
    await page.locator('#seg-voice').click();
    await expect(page.locator('#seg-voice')).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('#seg-voice')).toHaveAttribute('tabindex', '0');
    await expect(page.locator('#seg-polls')).toHaveAttribute('aria-selected', 'false');
    await expect(page.locator('#seg-polls')).toHaveAttribute('tabindex', '-1');
    await expect(page.locator('#pane-voice')).toBeVisible();
    await expect(page.locator('#pane-polls')).toBeHidden();
  });

  test('ArrowRight and ArrowLeft wrap between the two tabs', async ({ page }) => {
    await page.locator('#seg-polls').focus();
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('#seg-voice')).toBeFocused();
    await expect(page.locator('#seg-voice')).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('#pane-voice')).toBeVisible();

    await page.keyboard.press('ArrowLeft');
    await expect(page.locator('#seg-polls')).toBeFocused();
    await expect(page.locator('#seg-polls')).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('#pane-polls')).toBeVisible();

    await page.keyboard.press('ArrowLeft');
    await expect(page.locator('#seg-voice')).toBeFocused();
  });

  test('Home activates Polls and End activates Student Voice', async ({ page }) => {
    await page.locator('#seg-voice').focus();
    await page.keyboard.press('Home');
    await expect(page.locator('#seg-polls')).toBeFocused();
    await expect(page.locator('#seg-polls')).toHaveAttribute('aria-selected', 'true');

    await page.keyboard.press('End');
    await expect(page.locator('#seg-voice')).toBeFocused();
    await expect(page.locator('#seg-voice')).toHaveAttribute('aria-selected', 'true');
  });

  test('Poll controls still work on Polls and Voice entry works on Student Voice', async ({ page }) => {
    await page.locator('#pollForm input[type="radio"]').first().check();
    await page.locator('#submitPoll').click();
    await expect(page.locator('#pollSuccess')).toBeVisible();

    await page.locator('#seg-voice').click();
    await expect(page.locator('#voiceList')).toBeVisible();
    await page.locator('#voiceNewBtn').click();
    await expect(page.locator('#view-voice-new')).toBeVisible();
  });
});
