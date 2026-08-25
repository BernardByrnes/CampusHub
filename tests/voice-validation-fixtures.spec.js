import { expect, test } from '@playwright/test';

const STATE_KEY = 'campushub:state';
const ACTION_PLANNED_UPDATE = 'A lighting survey of the Mary Stuart–Library path is complete. Replacement fittings are scheduled this week.';
const RESOLVED_UPDATE = 'Sunday opening hours have been extended through the assessment period. Students who still cannot access a space can raise a new issue.';

async function goTo(page, hash) {
  await page.goto(`/${hash}`);
}

async function resetDemo(page, scenario = null) {
  await goTo(page, '#home');
  await page.waitForFunction(() => typeof window.CampusHubDebug?.resetDemo === 'function');
  await page.evaluate(nextScenario => {
    window.CampusHubDebug.resetDemo();
    if(nextScenario) window.CampusHubDebug.setScenario(nextScenario);
  }, scenario);
}

async function readState(page) {
  return page.evaluate(key => JSON.parse(localStorage.getItem(key) || 'null'), STATE_KEY);
}

async function expectNoHorizontalOverflow(page) {
  const fits = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
  expect(fits).toBe(true);
}

async function expectVoiceDetailGeometry(page) {
  const geometry = await page.evaluate(() => {
    const rect = selector => document.querySelector(selector)?.getBoundingClientRect() || null;
    const shell = rect('.shell');
    const title = document.querySelector('#voiceDetailTitle');
    const update = document.querySelector('.voice-official-update');
    const support = rect('#voiceSupportButton');
    const nav = rect('.bottom-nav');
    const detail = rect('#view-voice-detail');
    const timelineItems = [...document.querySelectorAll('#voiceTimeline > li .voice-timeline__event')]
      .map(item => item.getBoundingClientRect().left);
    const timelineAligned = timelineItems.length > 0 && Math.max(...timelineItems) - Math.min(...timelineItems) <= 1;
    const shellCentered = shell && Math.abs(shell.left - ((window.innerWidth - shell.width) / 2)) <= 1;
    const detailBottom = detail ? detail.bottom + window.scrollY : 0;
    const pageBottomClear = nav && document.documentElement.scrollHeight - detailBottom >= nav.height - 1;
    return {
      titleFits: Boolean(title && title.scrollWidth <= title.clientWidth),
      updateFits: Boolean(update && update.scrollWidth <= update.clientWidth),
      supportFits: Boolean(support && support.right <= window.innerWidth + 1),
      timelineAligned,
      shellCentered: Boolean(shellCentered),
      pageBottomClear: Boolean(pageBottomClear)
    };
  });
  expect(geometry.titleFits).toBe(true);
  expect(geometry.updateFits).toBe(true);
  expect(geometry.supportFits).toBe(true);
  expect(geometry.timelineAligned).toBe(true);
  expect(geometry.shellCentered).toBe(true);
  expect(geometry.pageBottomClear).toBe(true);
}

async function blockExternalFonts(page) {
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
}

test.describe('Phase 8A Student Voice dedicated validation fixtures', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'canonical-mobile', 'Detailed Voice fixture validation runs once at the canonical 390px viewport.');
    await blockExternalFonts(page);
  });

  test('maps each Voice status scenario to its canonical entity and route', async ({ page }) => {
    const scenarios = [
      { scenario: 'voice-under-review', id: 'voice-evening-buses', category: 'Transport', title: 'Need for more buses during evenings', status: 'Under Review', supporters: '87' },
      { scenario: 'voice-action-planned', id: 'voice-lighting-path', category: 'Lighting', title: 'Dark stretch between Mary Stuart and the Main Library', status: 'Action Planned', supporters: '41' },
      { scenario: 'voice-resolved', id: 'voice-library-sunday-hours', category: 'Library', title: 'Sunday library hours during the assessment period', status: 'Resolved', supporters: '156' }
    ];

    for(const expected of scenarios){
      await resetDemo(page, expected.scenario);
      const state = await readState(page);
      expect(state.voiceStatusScenario).toBe(expected.scenario);
      expect(state.selectedVoiceIssueId).toBe(expected.id);

      await goTo(page, `#voice-detail/${expected.id}`);
      await expect(page.locator('#view-voice-detail')).toBeVisible();
      expect(new URL(page.url()).hash).toBe(`#voice-detail/${expected.id}`);
      await expect(page.locator('#voiceDetailCategory')).toHaveText(expected.category);
      await expect(page.locator('#voiceDetailTitle')).toHaveText(expected.title);
      await expect(page.locator('#voiceDetailStatus')).toHaveText(expected.status);
      await expect(page.locator('#voiceDetailSupporterCount')).toHaveText(expected.supporters);
      await expect(page.locator('#voiceTimeline > li[aria-current="step"]')).toHaveCount(1);
    }
  });

  test('switching scenarios from an open detail follows the newly selected entity', async ({ page }) => {
    await resetDemo(page, 'voice-action-planned');
    await goTo(page, '#voice-detail/voice-lighting-path');
    await page.evaluate(() => window.CampusHubDebug.setScenario('voice-resolved'));

    await expect.poll(() => new URL(page.url()).hash).toBe('#voice-detail/voice-library-sunday-hours');
    await expect(page.locator('#voiceDetailTitle')).toHaveText('Sunday library hours during the assessment period');
    expect((await readState(page)).selectedVoiceIssueId).toBe('voice-library-sunday-hours');
  });

  test('validates Action Planned detail history and its official update', async ({ page }) => {
    await resetDemo(page, 'voice-action-planned');
    await goTo(page, '#voice-detail/voice-lighting-path');

    await expect(page.locator('#voiceDetailCategory')).toHaveText('Lighting');
    await expect(page.locator('#voiceDetailTitle')).toHaveText('Dark stretch between Mary Stuart and the Main Library');
    await expect(page.locator('#voiceDetailSupporterCount')).toHaveText('41');
    await expect(page.locator('#voiceDetailStatus')).toHaveText('Action Planned');
    await expect(page.locator('#voiceTimeline > li')).toHaveCount(4);
    await expect(page.locator('#voiceTimeline .voice-timeline__status')).toHaveText([
      'Submitted', 'Acknowledged', 'Under Review', 'Action Planned'
    ]);
    await expect(page.locator('#voiceTimeline')).not.toContainText('Resolved');
    await expect(page.locator('#voiceTimeline > li[aria-current="step"]')).toHaveCount(1);

    const update = page.locator('.voice-official-update');
    await expect(update).toHaveCount(1);
    await expect(update.locator('.voice-official-update__source')).toHaveText('Facilities Directorate');
    await expect(update.locator('.voice-official-update__date')).toHaveText('21 May 2026');
    await expect(update.locator('p')).toHaveText(ACTION_PLANNED_UPDATE);
  });

  test('validates Resolved detail history, update, and support availability', async ({ page }) => {
    await resetDemo(page, 'voice-resolved');
    await goTo(page, '#voice-detail/voice-library-sunday-hours');

    await expect(page.locator('#voiceDetailCategory')).toHaveText('Library');
    await expect(page.locator('#voiceDetailTitle')).toHaveText('Sunday library hours during the assessment period');
    await expect(page.locator('#voiceDetailSupporterCount')).toHaveText('156');
    await expect(page.locator('#voiceDetailStatus')).toHaveText('Resolved');
    await expect(page.locator('#voiceTimeline > li')).toHaveCount(5);
    await expect(page.locator('#voiceTimeline .voice-timeline__status')).toHaveText([
      'Submitted', 'Acknowledged', 'Under Review', 'Action Planned', 'Resolved'
    ]);
    await expect(page.locator('#voiceTimeline > li[aria-current="step"]')).toHaveCount(1);

    const update = page.locator('.voice-official-update');
    await expect(update).toHaveCount(1);
    await expect(update.locator('.voice-official-update__source')).toHaveText('University Library');
    await expect(update.locator('.voice-official-update__date')).toHaveText('28 May 2026');
    await expect(update.locator('p')).toHaveText(RESOLVED_UPDATE);
    await expect(page.locator('#voiceSupportButton')).toBeVisible();
    await expect(page.locator('#voiceSupportButton')).toBeEnabled();
  });

  test('keeps Action Planned and Resolved support idempotent without XP', async ({ page }) => {
    for(const expected of [
      { scenario: 'voice-action-planned', id: 'voice-lighting-path', initial: 41 },
      { scenario: 'voice-resolved', id: 'voice-library-sunday-hours', initial: 156 }
    ]){
      await resetDemo(page, expected.scenario);
      await goTo(page, `#voice-detail/${expected.id}`);
      const startingXp = await page.evaluate(() => window.CampusHubDemo.student.xp);
      await expect(page.locator('#voiceDetailSupporterCount')).toHaveText(String(expected.initial));

      await page.locator('#voiceSupportButton').click();
      await expect(page.locator('#voiceSupportButton')).toHaveText('Supported ✓');
      await expect(page.locator('#voiceDetailSupporterCount')).toHaveText(String(expected.initial + 1));
      expect(await page.evaluate(() => window.CampusHubDemo.student.xp)).toBe(startingXp);

      await page.reload();
      await expect(page.locator('#voiceDetailSupporterCount')).toHaveText(String(expected.initial + 1));
      await expect(page.locator('#voiceSupportButton')).toHaveText('Supported ✓');
      await page.locator('#voiceSupportButton').click({ force:true });
      await page.waitForTimeout(100);
      await expect(page.locator('#voiceDetailSupporterCount')).toHaveText(String(expected.initial + 1));
      expect(await page.evaluate(() => window.CampusHubDemo.student.xp)).toBe(startingXp);
    }
  });

  test('keeps the normal three-issue list and Home Voice slot immutable', async ({ page }) => {
    for(const scenario of [null, 'voice-action-planned', 'voice-resolved']){
      await resetDemo(page, scenario);
      await goTo(page, '#voice');
      await expect(page.locator('#voiceAllList .voice-issue-card')).toHaveCount(3);
      await expect(page.locator('#voiceAllList')).not.toContainText('Dark stretch between Mary Stuart and the Main Library');
      await expect(page.locator('#voiceAllList')).not.toContainText('Sunday library hours during the assessment period');
      expect(await page.locator('#voiceAllList .voice-issue-card').evaluateAll(cards => cards.map(card => card.dataset.voiceIssueId))).toEqual([
        'voice-water-halls', 'voice-evening-buses', 'voice-library-wifi'
      ]);
      await goTo(page, '#home');
      await expect(page.locator('#homeVoice [data-field="homeVoiceCategory"]')).toHaveText('Water & Sanitation');
      await expect(page.locator('#homeVoice [data-field="homeVoiceTitle"]')).toHaveText('Irregular water supply in Halls');
      await expect(page.locator('#homeVoice [data-field="homeVoiceSupporters"]')).toHaveText('124 supporters');
      await expect(page.locator('#homeVoice [data-field="homeVoiceStatus"]')).toHaveText('Acknowledged');
    }
  });

  test('restores the canonical water issue without a scenario overlay', async ({ page }) => {
    await resetDemo(page, 'voice-action-planned');
    await goTo(page, '#voice-detail/voice-lighting-path');
    await page.evaluate(() => window.CampusHubDebug.resetDemo());
    await goTo(page, '#voice-detail/voice-water-halls');

    await expect(page.locator('#voiceDetailCategory')).toHaveText('Water & Sanitation');
    await expect(page.locator('#voiceDetailTitle')).toHaveText('Irregular water supply in Halls');
    await expect(page.locator('#voiceDetailSupporterCount')).toHaveText('124');
    await expect(page.locator('#voiceDetailStatus')).toHaveText('Acknowledged');
    await expect(page.locator('#voiceTimeline > li')).toHaveCount(2);
    await expect(page.locator('#voiceTimeline .voice-timeline__status')).toHaveText(['Submitted', 'Acknowledged']);
    await expect(page.locator('#voiceTimeline > li[aria-current="step"]')).toHaveCount(1);
    await expect(page.locator('#voiceOfficialUpdatesSection')).toBeHidden();
    await expect(page.locator('#voiceOfficialUpdates')).toBeEmpty();
    await expect(page.locator('#voiceDetailTitle')).not.toContainText('Lighting');
  });

  test('keeps validation fixture routes gated by their active scenario', async ({ page }) => {
    await resetDemo(page);
    for(const id of ['voice-lighting-path', 'voice-library-sunday-hours']){
      await goTo(page, `#voice-detail/${id}`);
      await expect(page.locator('#view-voice')).toBeVisible();
      await expect(page.locator('#view-voice-detail')).toBeHidden();
      expect(new URL(page.url()).hash).toBe('#voice');
    }

    await resetDemo(page, 'voice-action-planned');
    await goTo(page, '#voice-detail/voice-lighting-path');
    await expect(page.locator('#voiceDetailTitle')).toHaveText('Dark stretch between Mary Stuart and the Main Library');
    await resetDemo(page, 'voice-resolved');
    await goTo(page, '#voice-detail/voice-library-sunday-hours');
    await expect(page.locator('#voiceDetailTitle')).toHaveText('Sunday library hours during the assessment period');
  });

  test('keeps GSC-14 assurance gating active for validation-fixture support', async ({ page }) => {
    await resetDemo(page, 'voice-action-planned');
    await goTo(page, '#voice-detail/voice-lighting-path');
    const startingXp = await page.evaluate(() => window.CampusHubDemo.student.xp);
    const startingCount = Number(await page.locator('#voiceDetailSupporterCount').textContent());

    await page.evaluate(key => {
      const state = JSON.parse(localStorage.getItem(key));
      state.membership.assuranceLevel = 1;
      state.membership.status = 'active';
      localStorage.setItem(key, JSON.stringify(state));
    }, STATE_KEY);
    await page.reload();
    await page.locator('#voiceSupportButton').click();
    await expect(page.locator('#participationGate')).toBeVisible();
    await expect.poll(() => page.evaluate(() => window.CampusHubDebug.getLastGateDecision())).toEqual({
      allowed:false,
      reason:{ step:'assurance', variant:'assurance-required', resourceContext:'voice-support' }
    });
    await expect(page.locator('#participationGateReason')).toContainText('university membership');
    await expect(page.locator('#voiceDetailSupporterCount')).toHaveText(String(startingCount));
    expect(await page.evaluate(() => window.CampusHubDemo.student.xp)).toBe(startingXp);

    await page.evaluate(key => {
      const state = JSON.parse(localStorage.getItem(key));
      state.membership.assuranceLevel = 2;
      state.membership.status = 'active';
      localStorage.setItem(key, JSON.stringify(state));
    }, STATE_KEY);
    await page.reload();
    await page.locator('#voiceSupportButton').click();
    await expect(page.locator('#voiceDetailSupporterCount')).toHaveText(String(startingCount + 1));
    expect(await page.evaluate(() => window.CampusHubDemo.student.xp)).toBe(startingXp);
  });

  test('keeps validation details free of horizontal overflow at frozen widths', async ({ page }) => {
    for(const viewport of [
      { width:320, height:844 },
      { width:390, height:844 },
      { width:430, height:932 },
      { width:768, height:1024 },
      { width:1280, height:900 }
    ]){
      await page.setViewportSize(viewport);
      for(const expected of [
        { scenario:'voice-action-planned', id:'voice-lighting-path', title:'Dark stretch between Mary Stuart and the Main Library' },
        { scenario:'voice-resolved', id:'voice-library-sunday-hours', title:'Sunday library hours during the assessment period' }
      ]){
        await resetDemo(page, expected.scenario);
        await goTo(page, `#voice-detail/${expected.id}`);
        await expect(page.locator('#voiceDetailTitle')).toHaveText(expected.title);
        await expect(page.locator('#voiceTimeline')).toBeVisible();
        await expect(page.locator('#voiceOfficialUpdatesSection')).toBeVisible();
        await expect(page.locator('.voice-official-update')).toHaveCount(1);
        await expect(page.locator('#voiceSupportButton')).toBeVisible();
        await expectNoHorizontalOverflow(page);
        await expectVoiceDetailGeometry(page);
      }
    }
  });
});
