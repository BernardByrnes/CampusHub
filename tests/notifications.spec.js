import { expect, test } from '@playwright/test';

async function goTo(page, hash) {
  await page.goto(`/${hash}`);
}

async function resetDemo(page) {
  await goTo(page, '#home');
  await page.waitForFunction(() => typeof window.CampusHubDebug?.resetDemo === 'function');
  await page.evaluate(() => window.CampusHubDebug.resetDemo());
}

async function openNotifications(page) {
  await goTo(page, '#notifications');
  await expect(page.locator('#view-notifications')).toBeVisible();
}

function notification(page, id) {
  return page.locator(`[data-notification-id="${id}"]`);
}

function notificationRow(page, id) {
  return page.locator(`li.notification-item:has([data-notification-id="${id}"])`);
}

// CSS specifies the 44px Back target exactly; Chromium/Windows can expose a
// tiny floating-point bounding-box error, so this epsilon is measurement
// precision only, not a design tolerance.
function expectAtLeastWithSubpixelTolerance(actual, minimum, epsilon = 0.01) {
  expect(actual + epsilon).toBeGreaterThanOrEqual(minimum);
}

test.describe('Phase 8O canonical Notifications centre', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'canonical-mobile', 'Notifications contract coverage runs once in canonical-mobile.');
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

  test('renders the truthful four-item reset fixture and chronological groups', async ({ page }) => {
    await openNotifications(page);

    await expect(page.locator('#notifList [data-notification-id]')).toHaveCount(4);
    await expect(page.locator('#notifList .notification-title')).toHaveText([
      'Wednesday Classes Rescheduled',
      'New poll available',
      'New Innovation Lab Opens at CoCIS',
      'Verification updated'
    ]);
    await expect(page.locator('#notifList h2')).toHaveText(['Today', 'Yesterday', 'This Week']);
    await expect(page.locator('#notifList')).not.toContainText(/This week/);
    await expect(page.locator('#notifList')).not.toContainText(/Poll closing soon|Event reminder|Opportunity deadline|Sports result|Student Voice update/);
    await expect(page.locator('#notifList')).not.toContainText(/closes tomorrow|3 days left|tomorrow/);
  });

  test('uses the canonical reset read state and bell label', async ({ page }) => {
    await openNotifications(page);

    await expect(page.locator('.notification-row--unread')).toHaveCount(2);
    await expect(notificationRow(page, 'notification-priority-rescheduled')).toHaveClass(/notification-row--unread/);
    await expect(notificationRow(page, 'notification-poll-opened')).toHaveClass(/notification-row--unread/);
    await expect(notificationRow(page, 'notification-cocis-story')).not.toHaveClass(/notification-row--unread/);
    await expect(notificationRow(page, 'notification-verification-updated')).not.toHaveClass(/notification-row--unread/);
    await expect(page.locator('#notifBtn')).toHaveAttribute('aria-label', 'Notifications, 2 unread');
    await expect(page.locator('#notifBadge')).toHaveText('2');
  });

  test('opens by notification ID, marks only that item read, and navigates to Polls', async ({ page }) => {
    await openNotifications(page);
    const poll = notification(page, 'notification-poll-opened');

    await Promise.all([
      page.waitForURL(/#participate$/),
      poll.click()
    ]);
    await expect(page.locator('#view-participate')).toBeVisible();

    await openNotifications(page);
    await expect(page.locator('.notification-row--unread')).toHaveCount(1);
    await expect(notificationRow(page, 'notification-priority-rescheduled')).toHaveClass(/notification-row--unread/);
    await expect(notificationRow(page, 'notification-poll-opened')).not.toHaveClass(/notification-row--unread/);
    await expect(page.locator('#notifBtn')).toHaveAttribute('aria-label', 'Notifications, 1 unread');
  });

  test('opens the Priority notification source Publication and marks only that row read', async ({ page }) => {
    await openNotifications(page);
    const priority = notification(page, 'notification-priority-rescheduled');
    await expect(priority).toHaveAttribute('href', '#news/notice-classes-rescheduled');

    await priority.click();
    await expect(page).toHaveURL(/#news\/notice-classes-rescheduled$/);
    await expect(page.locator('#view-news')).toBeVisible();
    await expect(page.locator('#newsDetailTitle')).toHaveText('Wednesday Classes Rescheduled');
    await expect(page.locator('#tab-discover')).toHaveAttribute('aria-current', 'page');

    const persisted = await page.evaluate(() => JSON.parse(localStorage.getItem('campushub:state:v2:tenant-makerere:membership-demo-001') || '{}'));
    expect(persisted.notificationReadIds).toContain('notification-priority-rescheduled');
    expect(persisted.notificationReadIds).not.toContain('notification-poll-opened');

    await page.locator('#view-news [data-back]').click();
    await expect(page).toHaveURL(/#notifications$/);
    await expect(page.locator('#view-notifications')).toBeVisible();
    await expect(page.locator('.notification-row--unread')).toHaveCount(1);
    await expect(notificationRow(page, 'notification-priority-rescheduled')).not.toHaveClass(/notification-row--unread/);
    await expect(notificationRow(page, 'notification-poll-opened')).toHaveClass(/notification-row--unread/);
    await expect(page.locator('#notifBtn')).toHaveAttribute('aria-label', 'Notifications, 1 unread');
  });

  test('persists one read receipt across reload without mutating fixture content', async ({ page }) => {
    await openNotifications(page);
    await notification(page, 'notification-poll-opened').click();
    await expect(page).toHaveURL(/#participate$/);
    await page.reload();
    await openNotifications(page);

    await expect(page.locator('.notification-row--unread')).toHaveCount(1);
    await expect(page.locator('#notifBtn')).toHaveAttribute('aria-label', 'Notifications, 1 unread');
    const persisted = await page.evaluate(() => JSON.parse(localStorage.getItem('campushub:state:v2:tenant-makerere:membership-demo-001') || '{}'));
    expect(persisted.notificationReadIds).toEqual(expect.arrayContaining(['notification-poll-opened', 'notification-cocis-story', 'notification-verification-updated']));
    expect(persisted.notificationReadIds).not.toContain('notification-priority-rescheduled');
  });

  test('marks all read, disables the action, persists, and does not repeat a toast', async ({ page }) => {
    await openNotifications(page);
    await page.locator('#markAllRead').click();

    await expect(page.locator('.notification-row--unread')).toHaveCount(0);
    await expect(page.locator('#notifBadge')).toBeHidden();
    await expect(page.locator('#notifBtn')).toHaveAttribute('aria-label', 'Notifications');
    await expect(page.locator('#markAllRead')).toBeDisabled();
    await expect(page.locator('#toastWrap')).toContainText('All notifications marked read.');
    const toastCount = await page.locator('#toastWrap .toast').count();
    await page.locator('#markAllRead').click({ force: true });
    await expect(page.locator('#toastWrap .toast')).toHaveCount(toastCount);

    await page.reload();
    await openNotifications(page);
    await expect(page.locator('.notification-row--unread')).toHaveCount(0);
    await expect(page.locator('#markAllRead')).toBeDisabled();
  });

  test('resetDemo restores two unread receipts without changing D.notifications', async ({ page }) => {
    await openNotifications(page);
    await page.locator('#markAllRead').click();
    await page.evaluate(() => window.CampusHubDebug.resetDemo());
    await expect(page.locator('.notification-row--unread')).toHaveCount(2);
    const fixture = await page.evaluate(() => window.CampusHubDemo.notifications.map(({ id, unread }) => ({ id, unread })));
    expect(fixture).toEqual([
      { id: 'notification-priority-rescheduled', unread: true },
      { id: 'notification-poll-opened', unread: true },
      { id: 'notification-cocis-story', unread: false },
      { id: 'notification-verification-updated', unread: false }
    ]);
  });

  test('resolves every canonical source route', async ({ page }) => {
    const routes = [
      ['notification-priority-rescheduled', /#news\/notice-classes-rescheduled$/],
      ['notification-poll-opened', /#participate$/],
      ['notification-cocis-story', /#news\/cocis-innovation-lab$/],
      ['notification-verification-updated', /#verification$/]
    ];
    for (const [id, route] of routes) {
      await resetDemo(page);
      await openNotifications(page);
      await notification(page, id).click();
      await expect(page).toHaveURL(route);
    }
  });

  test('keeps an unavailable source readable without a broken link', async ({ page }) => {
    await openNotifications(page);
    await page.evaluate(() => window.CampusHubDebug.setNotificationScenario('unavailable'));
    const unavailable = notification(page, 'notification-source-unavailable');
    await expect(unavailable).toContainText('No longer available.');
    await expect(unavailable.locator('a')).toHaveCount(0);
    await expect(page.locator('#notifList a[href="#news/removed-story"]')).toHaveCount(0);
    await unavailable.click();
    await expect(page).toHaveURL(/#notifications$/);
    await expect(page.locator('#view-notifications')).toBeVisible();
  });

  test('shows the quiet empty state without a CTA or celebration', async ({ page }) => {
    await openNotifications(page);
    await page.evaluate(() => window.CampusHubDebug.setNotificationScenario('empty'));
    await expect(page.locator('#notifList')).toHaveText('No notifications yet.');
    await expect(page.locator('#notifList a, #notifList button')).toHaveCount(0);
    await expect(page.locator('#notifList')).not.toContainText(/caught up|🎉/);
  });

  test('keeps notification rows semantic, labelled, and free of sponsor or play pressure', async ({ page }) => {
    await openNotifications(page);
    const screen = page.locator('#view-notifications');
    await expect(screen.locator('section[aria-labelledby]')).toHaveCount(3);
    await expect(screen.locator('ul.notification-list')).toHaveCount(3);
    await expect(screen.locator('li.notification-item a.notification-link')).toHaveCount(4);
    await expect(screen.locator('li.notification-item a.notification-link').evaluateAll(links => links.every(link => !link.querySelector('a')))).toBeTruthy();
    await expect(screen).not.toContainText(/Sponsored|Don't lose your streak|Streak at risk|Daily Quiz available/);
    await expect(screen.locator('.notification-row--unread .notification-state.visually-hidden')).toHaveCount(2);
  });

  test('enters directly with title focus, Home parent navigation, and a usable Back target', async ({ page }) => {
    await openNotifications(page);
    await expect.poll(() => page.evaluate(() => document.activeElement?.id)).toBe('notifTitle');
    await expect(page.locator('#tab-home')).toHaveAttribute('aria-current', 'page');
    await expect(page.locator('.nav-item[aria-current="page"]')).toHaveCount(1);
    const back = page.locator('.notifications-back');
    const box = await back.boundingBox();
    expect(box?.width ?? 0).toBeGreaterThanOrEqual(44);
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
  });

  test('bell entry and Back return to Home', async ({ page }) => {
    await goTo(page, '#home');
    await page.locator('#notifBtn').click();
    await expect(page).toHaveURL(/#notifications$/);
    await expect.poll(() => page.evaluate(() => document.activeElement?.id)).toBe('notifTitle');
    await page.locator('.notifications-back').click();
    await expect(page).toHaveURL(/#home$/);
    await expect(page.locator('#view-home')).toBeVisible();
  });
});

test.describe('Phase 8O Notifications responsive matrix', () => {
  test.beforeEach(async ({ page }) => {
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
    await openNotifications(page);
  });

  test('keeps the centre within the viewport at every configured size', async ({ page }) => {
    const measurements = await page.evaluate(() => {
      const list = document.querySelector('#notifList');
      const back = document.querySelector('.notifications-back');
      const rows = [...document.querySelectorAll('.notification-link')];
      const body = document.body;
      return {
        viewportWidth: window.innerWidth,
        listWidth: list?.getBoundingClientRect().width || 0,
        bodyScrollWidth: body.scrollWidth,
        backWidth: back?.getBoundingClientRect().width || 0,
        backHeight: back?.getBoundingClientRect().height || 0,
        rowHeights: rows.map(row => row.getBoundingClientRect().height),
        markAllVisible: getComputedStyle(document.querySelector('#markAllRead')).display !== 'none'
      };
    });
    expect(measurements.bodyScrollWidth).toBeLessThanOrEqual(measurements.viewportWidth + 1);
    expect(measurements.listWidth).toBeLessThanOrEqual(measurements.viewportWidth + 1);
    expect(measurements.backWidth).toBeGreaterThanOrEqual(44);
    expectAtLeastWithSubpixelTolerance(measurements.backHeight, 44);
    expect(measurements.rowHeights.every(height => height >= 44)).toBe(true);
    expect(measurements.markAllVisible).toBe(true);
  });
});
