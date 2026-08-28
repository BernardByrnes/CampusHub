import { expect, test } from '@playwright/test';

const STATE_KEY = 'campushub:state:v2:tenant-makerere:membership-demo-001';
const POLL_BODY = 'This poll is available to students whose university membership has been matched to the current student roster.';
const VOICE_SUBMISSION_BODY = 'Raising an issue is available to students whose university membership has been matched to the current student roster.';
const VOICE_SUPPORT_BODY = 'Supporting an issue is available to students whose university membership has been matched to the current student roster.';
const RSVP_BODY = 'This RSVP is available to students whose university membership has been matched to the current student roster.';
const QUIZ_BODY = 'The Daily Quiz is available to students whose university membership has been matched to the current student roster.';

async function goTo(page, hash) {
  await page.goto(`/${hash}`);
}

async function resetDemo(page, scenario = null) {
  await page.evaluate(name => {
    window.CampusHubDebug.resetDemo();
    if(name) window.CampusHubDebug.setScenario(name);
  }, scenario);
}

async function readState(page) {
  return page.evaluate(key => JSON.parse(localStorage.getItem(key) || 'null'), STATE_KEY);
}

async function expectDecision(page, reason) {
  await expect(page.locator('#participationGate')).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.CampusHubDebug.getLastGateDecision())).toEqual({
    allowed: false,
    reason
  });
}

async function openPollGate(page, scenario = 'assurance-required') {
  await resetDemo(page, scenario);
  await goTo(page, '#participate');
  await page.locator('#pollForm input[type="radio"]').first().check();
  await page.locator('#submitPoll').click();
}

async function openVoiceEntryGate(page, scenario = 'assurance-required') {
  await resetDemo(page, scenario);
  await goTo(page, '#voice');
  await page.locator('#voiceListNewBtn').click();
}

async function matchRosterAndWait(page) {
  await expect(page.locator('#startRosterMatch')).toBeVisible();
  await page.locator('#startRosterMatch').click();
  await expect(page.locator('#verificationSuccess')).toBeVisible();
  await expect.poll(() => new URL(page.url()).hash, { timeout: 5_000 }).not.toBe('#verification');
  await page.waitForTimeout(250);
}

test.describe('Phase 6D contextual gate presentation and continuation', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'canonical-mobile', 'Detailed contextual gate coverage runs once in canonical-mobile.');
    await page.route('https://fonts.googleapis.com/**', route => route.fulfill({ status: 200, contentType: 'text/css', body: '' }));
    await page.route('https://fonts.gstatic.com/**', route => route.fulfill({ status: 200, contentType: 'font/woff2', body: '' }));
    await goTo(page, '#home');
  });

  test('uses exact frozen copy for each canonical demo variant', async ({ page }) => {
    const cases = [
      {
        scenario:'assurance-required', open:() => openPollGate(page),
        kicker:'Verify your student status', body:POLL_BODY, primary:'Verify student status', comparison:true
      },
      {
        scenario:'membership-refresh', open:() => openPollGate(page, 'membership-refresh'),
        kicker:'Membership needs refreshing', body:'Your roster match is from a previous term. Refresh it to keep taking part.', primary:'Refresh membership', comparison:true
      },
      {
        scenario:'poll-closed', open:() => openPollGate(page, 'poll-closed'),
        kicker:'Poll has closed', body:'This poll closed on 25 May 2026. Results appear once privacy thresholds are met.', primary:'See other polls', comparison:false
      },
      {
        scenario:'audience-ineligible', open:() => openPollGate(page, 'audience-ineligible'),
        kicker:'Different student group', body:'This poll is open to a specific student group. Your current membership does not include that group.', primary:'See open polls', comparison:false
      },
      {
        scenario:'voice-disabled', open:() => openVoiceEntryGate(page, 'voice-disabled'),
        kicker:'Student Voice unavailable', body:'New issues are paused while published issues are reviewed. You can still follow existing issues.', primary:'View issues', comparison:false
      }
    ];

    for(const item of cases){
      await item.open();
      await expect(page.locator('#participationGateKicker')).toHaveText(item.kicker);
      await expect(page.locator('#participationGateReason')).toHaveText(item.body);
      await expect(page.locator('#participationGatePrimary')).toHaveText(item.primary);
      if(item.comparison){
        await expect(page.locator('#participationGateCurrentRow')).toBeVisible();
        await expect(page.locator('#participationGateRequiredRow')).toBeVisible();
      } else {
        await expect(page.locator('#participationGateCurrentRow')).toBeHidden();
        await expect(page.locator('#participationGateRequiredRow')).toBeHidden();
      }
      await page.keyboard.press('Escape');
      await expect(page.locator('#participationGate')).toBeHidden();
    }
  });

  test('keeps module-unavailable presentation honest for every migrated context', async ({ page }) => {
    const cases = [
      {
        context:'poll',
        route:'#participate',
        trigger:async () => {
          await page.locator('#pollForm input[type="radio"]').first().check();
          await page.locator('#submitPoll').click();
        },
        kicker:'Poll unavailable',
        body:'This poll is not accepting responses right now. You can view other available polls.',
        primary:'See other polls',
        returnHash:'#participate'
      },
      {
        context:'voice-submission',
        route:'#voice',
        trigger:async () => { await page.locator('#voiceListNewBtn').click(); },
        kicker:'Student Voice unavailable',
        body:'New issues are paused while published issues are reviewed. You can still follow existing issues.',
        primary:'View issues',
        returnHash:'#voice'
      },
      {
        context:'voice-support',
        route:'#voice-detail/voice-water-halls',
        trigger:async () => { await page.locator('#voiceSupportButton').click(); },
        kicker:'Student Voice unavailable',
        body:'New issues are paused while published issues are reviewed. You can still follow existing issues.',
        primary:'View issues',
        returnHash:'#voice'
      },
      {
        context:'rsvp',
        route:'#events/guild-debate',
        trigger:async () => { await page.locator('#rsvpGoing').click(); },
        kicker:'RSVP unavailable',
        body:'RSVP is not available for this event right now. You can still view the event details.',
        primary:'Back to event',
        returnHash:'#events/guild-debate'
      },
      {
        context:'daily-quiz',
        route:'#play',
        trigger:async () => {
          await page.locator('#quizOptions input[value="0"]').check();
          await page.locator('#quizSubmit').click();
        },
        kicker:'Daily Quiz unavailable',
        body:'The Daily Quiz is not available right now. You can return to Play and try again later.',
        primary:'Back to Play',
        returnHash:'#play'
      }
    ];

    for(const item of cases){
      await resetDemo(page);
      await page.evaluate(({ key, disable }) => {
        const state = JSON.parse(localStorage.getItem(key));
        if(disable === 'poll') state.participation.pollModuleEnabled = false;
        if(disable === 'voice') state.participation.moduleEnabled = false;
        if(disable === 'rsvp') state.participation.rsvpModuleEnabled = false;
        if(disable === 'quiz') state.participation.quizModuleEnabled = false;
        localStorage.setItem(key, JSON.stringify(state));
      }, { key:STATE_KEY, disable:item.context === 'poll' ? 'poll' : item.context.startsWith('voice') ? 'voice' : item.context === 'daily-quiz' ? 'quiz' : item.context });
      await goTo(page, item.route);
      await item.trigger();
      await expectDecision(page, { step:'module-enabled', variant:'module-unavailable', resourceContext:item.context });
      await expect(page.locator('#participationGateKicker')).toHaveText(item.kicker);
      await expect(page.locator('#participationGateReason')).toHaveText(item.body);
      await expect(page.locator('#participationGatePrimary')).toHaveText(item.primary);
      if(item.context.startsWith('voice')){
        await expect(page.locator('#participationGate')).toContainText('Student Voice unavailable');
      } else {
        await expect(page.locator('#participationGate')).not.toContainText('Student Voice unavailable');
      }
      await page.locator('#participationGatePrimary').click();
      await expect.poll(() => new URL(page.url()).hash).toBe(item.returnHash);
      await expect(page.locator('#participationGate')).toBeHidden();
    }
  });

  test('uses resource-context assurance copy for Poll, Voice, RSVP and Daily Quiz', async ({ page }) => {
    await openPollGate(page);
    await expect(page.locator('#participationGateReason')).toHaveText(POLL_BODY);
    await page.keyboard.press('Escape');

    await openVoiceEntryGate(page);
    await expect(page.locator('#participationGateReason')).toHaveText(VOICE_SUBMISSION_BODY);
    await page.keyboard.press('Escape');

    await resetDemo(page, 'assurance-required');
    await goTo(page, '#voice-detail/voice-water-halls');
    await page.locator('#voiceSupportButton').click();
    await expect(page.locator('#participationGateReason')).toHaveText(VOICE_SUPPORT_BODY);
    await page.keyboard.press('Escape');

    await page.evaluate(() => { window.CampusHubDemo.featuredEvent.requiredAssurance = 'L2'; });
    await resetDemo(page, 'assurance-required');
    await goTo(page, '#events/guild-debate');
    await page.locator('#rsvpGoing').click();
    await expect(page.locator('#participationGateReason')).toHaveText(RSVP_BODY);
    await page.keyboard.press('Escape');

    await page.evaluate(() => { window.CampusHubDemo.quiz.requiredAssurance = 'L2'; });
    await resetDemo(page, 'assurance-required');
    await goTo(page, '#play');
    await page.locator('#quizOptions input[value="0"]').check();
    await page.locator('#quizSubmit').click();
    await expect(page.locator('#participationGateReason')).toHaveText(QUIZ_BODY);
    await expect(page.locator('#participationGateCurrentValue')).toContainText('L1');
    await expect(page.locator('#participationGateRequiredValue')).toContainText('L2');
  });

  test('focuses the gate title first and restores Poll trigger focus on Escape', async ({ page }) => {
    await openPollGate(page);
    await expect.poll(() => page.evaluate(() => document.activeElement?.id)).toBe('participationGateTitle');
    await page.keyboard.press('Escape');
    await expect.poll(() => page.evaluate(() => document.activeElement?.id)).toBe('submitPoll');
  });

  test('restores Voice support focus on Escape and Not now without mutation', async ({ page }) => {
    await resetDemo(page, 'assurance-required');
    await goTo(page, '#voice-detail/voice-water-halls');
    const before = await readState(page);
    const supporters = await page.locator('#voiceDetailSupporterCount').textContent();
    const xp = await page.evaluate(() => window.CampusHubDemo.student.xp);
    await page.locator('#voiceSupportButton').click();
    await page.locator('#participationGateSecondary').click();
    await expect.poll(() => page.evaluate(() => document.activeElement?.id)).toBe('voiceSupportButton');
    expect(await readState(page)).toEqual(before);
    expect(await page.locator('#voiceDetailSupporterCount').textContent()).toBe(supporters);
    expect(await page.evaluate(() => window.CampusHubDemo.student.xp)).toBe(xp);
  });

  test('completes Poll verification continuation without auto-submit', async ({ page }) => {
    await openPollGate(page);
    await expectDecision(page, { step:'assurance', variant:'assurance-required', resourceContext:'poll' });
    await page.locator('#participationGatePrimary').click();
    await expect(page.locator('#view-verification')).toBeVisible();
    await matchRosterAndWait(page);
    await expect.poll(() => new URL(page.url()).hash).toBe('#participate');
    await expect.poll(() => page.evaluate(() => document.activeElement?.matches('#pollForm input[type="radio"]'))).toBe(true);
    expect((await readState(page)).pollDone).toBe(false);
    await page.locator('#pollForm input[type="radio"]').first().check();
    await page.locator('#submitPoll').click();
    await expect(page.locator('#pollSuccess')).toBeVisible();
  });

  test('refreshes membership in place, preserves L2, and returns to Poll without auto-submit', async ({ page }) => {
    await openPollGate(page, 'membership-refresh');
    await expectDecision(page, { step:'membership-state', variant:'membership-refresh', resourceContext:'poll' });
    await page.locator('#participationGatePrimary').click();
    await expect(page.locator('#view-verification')).toBeVisible();
    await expect(page.locator('#startRosterMatch')).toHaveText('Refresh membership');
    await page.locator('#startRosterMatch').click();
    await expect(page.locator('#verificationSuccess')).toBeVisible();
    await expect.poll(() => new URL(page.url()).hash, { timeout: 5_000 }).toBe('#participate');
    const state = await readState(page);
    expect(state.membership).toEqual({ assuranceLevel:2, status:'active' });
    expect(state.pollDone).toBe(false);
    await expect.poll(() => page.evaluate(() => document.activeElement?.matches('#pollForm input[type="radio"]'))).toBe(true);
  });

  test('preserves Voice final Review through verification and focuses Submit issue', async ({ page }) => {
    await resetDemo(page);
    await goTo(page, '#voice');
    await page.locator('#voiceListNewBtn').click();
    await page.locator('input[name="voiceCategory"][value="Facilities"]').check();
    await page.locator('#voiceCategoryContinue').click();
    await page.locator('#voiceIssueTitle').fill('Broken water tap near North Court');
    await page.locator('#voiceIssueDescription').fill('The tap near North Court has been broken since Monday.');
    await page.locator('#voiceDetailsContinue').click();
    await expect(page.locator('#voiceStepReview')).toBeVisible();
    await page.evaluate(key => {
      const state = JSON.parse(localStorage.getItem(key));
      state.membership.assuranceLevel = 1;
      state.membership.status = 'active';
      localStorage.setItem(key, JSON.stringify(state));
    }, STATE_KEY);
    await page.locator('#voiceSubmitIssue').click();
    await expectDecision(page, { step:'assurance', variant:'assurance-required', resourceContext:'voice-submission' });
    await page.locator('#participationGatePrimary').click();
    await matchRosterAndWait(page);
    await expect.poll(() => new URL(page.url()).hash).toBe('#voice-new');
    await expect(page.locator('#voiceStepReview')).toBeVisible();
    await expect.poll(() => page.evaluate(() => document.activeElement?.id)).toBe('voiceSubmitIssue');
    expect((await readState(page)).voiceSubmissions).toHaveLength(0);
    await page.locator('#voiceSubmitIssue').click();
    await expect(page.locator('#voiceStepConfirmation')).toBeVisible();
  });

  test('returns to Voice support and requires a fresh Support this issue action', async ({ page }) => {
    await resetDemo(page, 'assurance-required');
    await goTo(page, '#voice-detail/voice-water-halls');
    await page.locator('#voiceSupportButton').click();
    await page.locator('#participationGatePrimary').click();
    await matchRosterAndWait(page);
    await expect.poll(() => new URL(page.url()).hash).toBe('#voice-detail/voice-water-halls');
    await expect.poll(() => page.evaluate(() => document.activeElement?.id)).toBe('voiceSupportButton');
    expect((await readState(page)).supportedVoiceIssues).not.toContain('voice-water-halls');
    await page.locator('#voiceSupportButton').click();
    await expect(page.locator('#voiceSupportButton')).toHaveText('Supported ✓');
  });

  test('returns to RSVP, focuses the attempted control, and does not auto-RSVP', async ({ page }) => {
    await page.evaluate(() => { window.CampusHubDemo.featuredEvent.requiredAssurance = 'L2'; });
    await resetDemo(page, 'assurance-required');
    await goTo(page, '#events/guild-debate');
    await page.locator('#rsvpGoing').click();
    await expectDecision(page, { step:'assurance', variant:'assurance-required', resourceContext:'rsvp' });
    await page.locator('#participationGatePrimary').click();
    await matchRosterAndWait(page);
    await expect.poll(() => new URL(page.url()).hash).toBe('#events/guild-debate');
    await expect.poll(() => page.evaluate(() => document.activeElement?.id)).toBe('rsvpGoing');
    expect((await readState(page)).rsvp).toBe(null);
    await page.locator('#rsvpGoing').click();
    expect((await readState(page)).rsvp).toBe('going');
  });

  test('returns to Daily Quiz, preserves no grade, and requires a fresh Submit answer action', async ({ page }) => {
    await page.evaluate(() => { window.CampusHubDemo.quiz.requiredAssurance = 'L2'; });
    await resetDemo(page, 'assurance-required');
    await goTo(page, '#play');
    await page.locator('#quizOptions input[value="0"]').check();
    await page.locator('#quizSubmit').click();
    await expectDecision(page, { step:'assurance', variant:'assurance-required', resourceContext:'daily-quiz' });
    await page.locator('#participationGatePrimary').click();
    await matchRosterAndWait(page);
    await expect.poll(() => new URL(page.url()).hash).toBe('#play');
    await expect.poll(() => page.evaluate(() => document.activeElement?.id)).toBe('quizSubmit');
    expect((await readState(page)).quizParticipation).toBe(null);
    await page.locator('#quizOptions input[value="0"]').check();
    await page.locator('#quizSubmit').click();
    await expect(page.locator('#quizFeedback')).toBeVisible();
  });

  test('exposes only canonical debug scenarios, resets to normal L2, and rejects unknown names', async ({ page }) => {
    const result = await page.evaluate(() => {
      const names = ['assurance-required','membership-refresh','poll-closed','audience-ineligible','voice-disabled'];
      const snapshots = names.map(name => {
        window.CampusHubDebug.resetDemo();
        window.CampusHubDebug.setScenario(name);
        const state = JSON.parse(localStorage.getItem('campushub:state:v2:tenant-makerere:membership-demo-001'));
        return { name, level:state.membership.assuranceLevel, status:state.membership.status, module:state.participation.moduleEnabled, resource:state.participation.resourceStatus, audience:state.participation.audienceEligible };
      });
      window.CampusHubDebug.resetDemo();
      let error;
      try { window.CampusHubDebug.setScenario('not-a-canonical-scenario'); } catch(e) { error = { name:e.name, message:e.message }; }
      const reset = JSON.parse(localStorage.getItem('campushub:state:v2:tenant-makerere:membership-demo-001'));
      window.CampusHubDebug.setScenario('voice-under-review');
      return { snapshots, error, reset, voiceStatus:JSON.parse(localStorage.getItem('campushub:state:v2:tenant-makerere:membership-demo-001')).voiceStatusScenario };
    });
    expect(result.snapshots).toEqual([
      { name:'assurance-required', level:1, status:'active', module:true, resource:'active', audience:true },
      { name:'membership-refresh', level:2, status:'refresh', module:true, resource:'active', audience:true },
      { name:'poll-closed', level:2, status:'active', module:true, resource:'closed', audience:true },
      { name:'audience-ineligible', level:2, status:'active', module:true, resource:'active', audience:false },
      { name:'voice-disabled', level:2, status:'active', module:false, resource:'active', audience:true }
    ]);
    expect(result.error.name).toBe('TypeError');
    expect(result.reset.membership).toEqual({ assuranceLevel:2, status:'active' });
    expect(result.reset.participation).toMatchObject({ demoScenario:'normal', moduleEnabled:true, pollModuleEnabled:true, rsvpModuleEnabled:true, quizModuleEnabled:true, resourceStatus:'active', audienceEligible:true });
    expect(result.voiceStatus).toBe('voice-under-review');
  });

  test('does not expose the removed normal-user prototype participation controls', async ({ page }) => {
    await resetDemo(page);
    await goTo(page, '#participate');
    await expect(page.locator('#participationDemoControls')).toHaveCount(0);
    await expect(page.locator('#view-participate')).not.toContainText('Prototype test state');
    await expect(page.locator('#view-participate')).not.toContainText('Participation scenario');
    await expect(page.locator('#view-participate')).not.toContainText('Reset primary journey');
  });

  test('isolates Voice disabled while Poll, RSVP and Quiz remain usable', async ({ page }) => {
    await resetDemo(page, 'voice-disabled');
    await goTo(page, '#voice');
    await page.locator('#voiceListNewBtn').click();
    await expect(page.locator('#participationGateKicker')).toHaveText('Student Voice unavailable');
    await page.keyboard.press('Escape');
    await goTo(page, '#participate');
    await page.locator('#pollForm input[type="radio"]').first().check();
    await page.locator('#submitPoll').click();
    await expect(page.locator('#pollSuccess')).toBeVisible();
    await goTo(page, '#events/guild-debate');
    await page.locator('#rsvpGoing').click();
    await expect(page.locator('#rsvpGoing')).toHaveAttribute('aria-pressed', 'true');
    await goTo(page, '#play');
    await page.locator('#quizOptions input[value="0"]').check();
    await page.locator('#quizSubmit').click();
    await expect(page.locator('#quizFeedback')).toBeVisible();
  });

  test('returns an exact canonical reason object for one denied action', async ({ page }) => {
    await openPollGate(page, 'audience-ineligible');
    await expectDecision(page, { step:'audience', variant:'audience-ineligible', resourceContext:'poll' });
  });

  test('keeps the gate readable and usable at every required width', async ({ page }) => {
    for(const width of [320, 390, 430, 768, 1280]){
      await page.setViewportSize({ width, height:844 });
      await openPollGate(page);
      const metrics = await page.evaluate(() => {
        const dialog = document.querySelector('#participationGate').getBoundingClientRect();
        const actions = [...document.querySelectorAll('#participationGatePrimary, #participationGateSecondary')].filter(el => !el.hidden).map(el => el.getBoundingClientRect());
        return { overflow:document.documentElement.scrollWidth > window.innerWidth, dialogWidth:dialog.width, actions:actions.map(r => ({ width:r.width, right:r.right })) };
      });
      expect(metrics.overflow).toBe(false);
      expect(metrics.dialogWidth).toBeGreaterThan(0);
      expect(metrics.actions.every(action => action.width > 0 && action.right <= width + 1)).toBe(true);
      await expect.poll(() => page.evaluate(() => document.activeElement?.id)).toBe('participationGateTitle');
      await page.keyboard.press('Escape');
    }
  });

  test('keeps native dialog accessibility wiring intact', async ({ page }) => {
    await openPollGate(page);
    const attributes = await page.locator('#participationGate').evaluate(dialog => ({
      role:dialog.getAttribute('role'), modal:dialog.getAttribute('aria-modal'), labelledby:dialog.getAttribute('aria-labelledby'), describedby:dialog.getAttribute('aria-describedby'), titleTabindex:document.querySelector('#participationGateTitle').getAttribute('tabindex')
    }));
    expect(attributes).toEqual({ role:'dialog', modal:'true', labelledby:'participationGateTitle', describedby:'participationGateReason participationGateState', titleTabindex:'-1' });
    await expect(page.locator('#participationGatePrimary')).toBeVisible();
    await expect(page.locator('#participationGateSecondary')).toBeVisible();
    await expect(page.locator('#participationGate')).not.toContainText(/403|Access denied|Forbidden|Unauthorised/);
  });
});
