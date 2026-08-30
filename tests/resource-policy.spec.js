import { expect, test } from '@playwright/test';

test.describe('Phase 8U.8 resource exposure policy contract', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'canonical-mobile', 'Pure policy contract runs once in canonical-mobile.');
    await page.goto('/#home');
    await page.waitForFunction(() => typeof window.CampusHubResourcePolicy?.evaluatePublicationExposure === 'function');
  });

  test('exposes a small frozen API without a generic audience rule or cache key', async ({ page }) => {
    const api = await page.evaluate(() => {
      const policy = window.CampusHubResourcePolicy;
      return {
        keys: Object.keys(policy),
        visibility: policy.VISIBILITY_VALUES,
        viewers: policy.VIEWER_CLASSES,
        frozen: Object.isFrozen(policy),
        visibilityFrozen: Object.isFrozen(policy.VISIBILITY_VALUES),
        reasonsFrozen: Object.isFrozen(policy.REASONS),
        hasGenericAudienceEvaluator: typeof policy.evaluateAudience,
        hasCacheKey: typeof policy.cacheKey
      };
    });

    expect(api.frozen).toBe(true);
    expect(api.visibilityFrozen).toBe(true);
    expect(api.reasonsFrozen).toBe(true);
    expect(api.visibility).toEqual(['PUBLIC', 'MEMBERS', 'VERIFIED_MEMBERS']);
    expect(api.viewers).toEqual(['PUBLIC_VISITOR', 'MEMBER_L0', 'MEMBER_L1', 'MEMBER_L2', 'MEMBER_L3']);
    expect(api.keys).toContain('viewerCanPassVisibility');
    expect(api.keys).toContain('evaluatePublicationExposure');
    expect(api.keys).toContain('evaluateEventExposure');
    expect(api.keys).toContain('evaluateOpportunityExposure');
    expect(api.keys).toContain('evaluatePollExposure');
    expect(api.keys).toContain('filterExposedResources');
    expect(api.keys).toContain('resolveExposedResource');
    expect(api.hasGenericAudienceEvaluator).toBe('undefined');
    expect(api.hasCacheKey).toBe('undefined');
  });

  test('enforces the canonical PUBLIC, MEMBERS and VERIFIED_MEMBERS viewer axis', async ({ page }) => {
    const decisions = await page.evaluate(() => {
      const policy = window.CampusHubResourcePolicy;
      const evaluate = (visibility, viewerClass, tenantPublicSurfaceEnabled) => policy.evaluatePublicationExposure({
        visibility,
        viewerClass,
        tenantPublicSurfaceEnabled,
        audienceEligible: true,
        lifecycleVisible: true
      });

      return {
        publicVisitorAllowed: evaluate('PUBLIC', 'PUBLIC_VISITOR', true),
        publicVisitorBlocked: evaluate('PUBLIC', 'PUBLIC_VISITOR', false),
        publicMember: evaluate('PUBLIC', 'MEMBER_L0', false),
        membersL0: evaluate('MEMBERS', 'MEMBER_L0', false),
        membersL1: evaluate('MEMBERS', 'MEMBER_L1', false),
        membersL2: evaluate('MEMBERS', 'MEMBER_L2', false),
        verifiedL1: evaluate('VERIFIED_MEMBERS', 'MEMBER_L1', false),
        verifiedL2: evaluate('VERIFIED_MEMBERS', 'MEMBER_L2', false),
        verifiedL3: evaluate('VERIFIED_MEMBERS', 'MEMBER_L3', false)
      };
    });

    expect(decisions.publicVisitorAllowed.exposed).toBe(true);
    expect(decisions.publicVisitorBlocked).toMatchObject({ exposed: false, reason: 'VISIBILITY_REQUIRED' });
    expect(decisions.publicMember.exposed).toBe(true);
    expect(decisions.membersL0).toMatchObject({ exposed: false, reason: 'VISIBILITY_REQUIRED' });
    expect(decisions.membersL1.exposed).toBe(true);
    expect(decisions.membersL2.exposed).toBe(true);
    expect(decisions.verifiedL1).toMatchObject({ exposed: false, reason: 'VISIBILITY_REQUIRED' });
    expect(decisions.verifiedL2.exposed).toBe(true);
    expect(decisions.verifiedL3.exposed).toBe(true);
  });

  test('fails closed when precomputed visibility conflicts with viewer facts', async ({ page }) => {
    const decisions = await page.evaluate(() => {
      const policy = window.CampusHubResourcePolicy;
      const base = { audienceEligible: true, lifecycleVisible: true };
      const evaluate = overrides => policy.evaluatePublicationExposure({ ...base, ...overrides });
      const invalidValues = ['true', 1, null, {}, []].map(visibilityEligible => evaluate({
        visibility: 'MEMBERS',
        visibilityEligible
      }));

      return {
        membersPublicVisitorConflict: evaluate({
          visibility: 'MEMBERS',
          viewerClass: 'PUBLIC_VISITOR',
          tenantPublicSurfaceEnabled: true,
          visibilityEligible: true
        }),
        membersL1Agreement: evaluate({
          visibility: 'MEMBERS',
          viewerClass: 'MEMBER_L1',
          visibilityEligible: true
        }),
        verifiedL1Agreement: evaluate({
          visibility: 'VERIFIED_MEMBERS',
          viewerClass: 'MEMBER_L1',
          visibilityEligible: false
        }),
        verifiedL2Conflict: evaluate({
          visibility: 'VERIFIED_MEMBERS',
          viewerClass: 'MEMBER_L2',
          visibilityEligible: false
        }),
        publicSurfaceConflict: evaluate({
          visibility: 'PUBLIC',
          viewerClass: 'PUBLIC_VISITOR',
          tenantPublicSurfaceEnabled: false,
          visibilityEligible: true
        }),
        precomputedOnly: evaluate({
          visibility: 'MEMBERS',
          visibilityEligible: true
        }),
        derivedOnly: evaluate({
          visibility: 'MEMBERS',
          viewerClass: 'MEMBER_L1'
        }),
        invalidValues
      };
    });

    expect(decisions.membersPublicVisitorConflict).toMatchObject({ exposed: false, reason: 'VISIBILITY_REQUIRED' });
    expect(decisions.membersL1Agreement.exposed).toBe(true);
    expect(decisions.verifiedL1Agreement).toMatchObject({ exposed: false, reason: 'VISIBILITY_REQUIRED' });
    expect(decisions.verifiedL2Conflict).toMatchObject({ exposed: false, reason: 'VISIBILITY_REQUIRED' });
    expect(decisions.publicSurfaceConflict).toMatchObject({ exposed: false, reason: 'VISIBILITY_REQUIRED' });
    expect(decisions.precomputedOnly.exposed).toBe(true);
    expect(decisions.derivedOnly.exposed).toBe(true);
    expect(decisions.invalidValues).toHaveLength(5);
    for(const decision of decisions.invalidValues){
      expect(decision).toMatchObject({ exposed: false, reason: 'VISIBILITY_REQUIRED' });
    }
  });

  test('requires explicit visibility and audience facts for Publication exposure', async ({ page }) => {
    const decisions = await page.evaluate(() => {
      const policy = window.CampusHubResourcePolicy;
      const base = { visibility: 'MEMBERS', visibilityEligible: true, lifecycleVisible: true };
      const missingAudience = policy.evaluatePublicationExposure(base);
      const invalidAudience = policy.evaluatePublicationExposure({ ...base, audienceEligible: null });
      const audienceExcluded = policy.evaluatePublicationExposure({ ...base, audienceEligible: false });
      const inactive = policy.evaluatePublicationExposure({ ...base, audienceEligible: true, lifecycleVisible: false });
      const allowed = policy.evaluatePublicationExposure({ ...base, audienceEligible: true });
      return { missingAudience, invalidAudience, audienceExcluded, inactive, allowed };
    });

    expect(decisions.missingAudience).toMatchObject({ exposed: false, reason: 'AUDIENCE_UNEVALUATED' });
    expect(decisions.invalidAudience).toMatchObject({ exposed: false, reason: 'AUDIENCE_UNEVALUATED' });
    expect(decisions.audienceExcluded).toMatchObject({
      exposed: false,
      exposureAudienceEligible: false,
      reason: 'AUDIENCE_EXCLUDED',
      notificationEligible: false,
      mediaEligible: false
    });
    expect(decisions.inactive).toMatchObject({ exposed: false, reason: 'RESOURCE_UNAVAILABLE' });
    expect(decisions.allowed).toMatchObject({
      exposed: true,
      visibilityState: 'VISIBLE',
      exposureAudienceEligible: true,
      notificationEligible: true,
      mediaEligible: true
    });
    expect(await page.evaluate(() => Object.isFrozen(window.CampusHubResourcePolicy.evaluatePublicationExposure({
      visibility: 'MEMBERS', visibilityEligible: true, audienceEligible: true, lifecycleVisible: true
    })))).toBe(true);
  });

  test('fails closed for unknown visibility values and malformed viewer inputs', async ({ page }) => {
    const result = await page.evaluate(() => {
      const policy = window.CampusHubResourcePolicy;
      const make = visibility => policy.evaluatePublicationExposure({
        visibility,
        visibilityEligible: true,
        audienceEligible: true,
        lifecycleVisible: true
      });
      return {
        everyOne: make('EVERYONE'),
        empty: make(''),
        nullValue: make(null),
        invalidViewer: policy.viewerCanPassVisibility({
          visibility: 'MEMBERS',
          viewerClass: 'VERIFIED',
          tenantPublicSurfaceEnabled: true
        }),
        malformedViewer: policy.viewerCanPassVisibility(null),
        unsupported: policy.evaluateResourceExposure('voice', {
          visibility: 'MEMBERS',
          visibilityEligible: true,
          audienceEligible: true,
          lifecycleVisible: true
        })
      };
    });

    expect(result.everyOne).toMatchObject({ exposed: false, reason: 'VISIBILITY_REQUIRED' });
    expect(result.empty).toMatchObject({ exposed: false, reason: 'VISIBILITY_REQUIRED' });
    expect(result.nullValue).toMatchObject({ exposed: false, reason: 'VISIBILITY_REQUIRED' });
    expect(result.invalidViewer).toBe(false);
    expect(result.malformedViewer).toBe(false);
    expect(result.unsupported).toEqual({ exposed: false, reason: 'UNSUPPORTED_RESOURCE' });
  });

  test('filters a denied Publication before Home, Discover/search, direct ID, notification, media and analytics surfaces', async ({ page }) => {
    const result = await page.evaluate(() => {
      const policy = window.CampusHubResourcePolicy;
      const resources = [
        { id: 'publication-open-day', title: 'Campus open day', excerpt: 'Join the campus open day.' },
        { id: 'publication-targeted-test', title: 'Secret targeted bursary', excerpt: 'Faculty-specific funding details.' },
        { id: 'publication-third', title: 'Library weekend hours', excerpt: 'The library is open this weekend.' }
      ];
      const decisionFor = resource => policy.evaluatePublicationExposure({
        visibility: 'MEMBERS',
        visibilityEligible: true,
        audienceEligible: resource.id !== 'publication-targeted-test',
        lifecycleVisible: true
      });
      const before = JSON.stringify(resources);
      const home = policy.filterExposedResources(resources, decisionFor);
      const discover = policy.filterExposedResources(resources, decisionFor);
      // Exposure filtering happens before text/category matching, so the
      // denied title cannot affect a result count or produce an unavailable row.
      const search = policy.filterExposedResources(resources, decisionFor)
        .filter(resource => `${resource.title} ${resource.excerpt}`.toLowerCase().includes('bursary'));
      const directDenied = policy.resolveExposedResource(resources, 'publication-targeted-test', decisionFor);
      const directAllowed = policy.resolveExposedResource(resources, 'publication-open-day', decisionFor);
      const deniedDecision = decisionFor(resources[1]);
      const analytics = policy.filterExposedResources(resources, decisionFor).map(({ id }) => ({ id, opened: true }));
      return {
        before,
        after: JSON.stringify(resources),
        homeIds: home.map(resource => resource.id),
        discoverIds: discover.map(resource => resource.id),
        searchCount: search.length,
        searchRows: search,
        directDenied,
        directAllowedId: directAllowed?.id,
        notificationEligible: deniedDecision.notificationEligible,
        mediaEligible: deniedDecision.mediaEligible,
        deniedDecision,
        analytics
      };
    });

    expect(result.homeIds).toEqual(['publication-open-day', 'publication-third']);
    expect(result.discoverIds).toEqual(['publication-open-day', 'publication-third']);
    expect(result.searchCount).toBe(0);
    expect(result.searchRows).toEqual([]);
    expect(result.directDenied).toBeNull();
    expect(result.directAllowedId).toBe('publication-open-day');
    expect(result.notificationEligible).toBe(false);
    expect(result.mediaEligible).toBe(false);
    expect(result.analytics).toEqual([
      { id: 'publication-open-day', opened: true },
      { id: 'publication-third', opened: true }
    ]);
    expect(JSON.stringify(result.homeIds)).not.toContain('publication-targeted-test');
    expect(JSON.stringify(result.deniedDecision)).not.toContain('publication-targeted-test');
    expect(result.before).toBe(result.after);
  });

  test('keeps Poll audience failure visible but non-actionable, unlike Publication', async ({ page }) => {
    const result = await page.evaluate(() => {
      const policy = window.CampusHubResourcePolicy;
      const input = {
        visibility: 'MEMBERS',
        visibilityEligible: true,
        lifecycleVisible: true,
        audienceEligible: false,
        membershipState: 'refresh',
        currentAssurance: 'L0',
        requiredAssurance: 'L3',
        frozenCohortEligible: false
      };
      return {
        poll: policy.evaluatePollExposure(input),
        publication: policy.evaluatePublicationExposure(input)
      };
    });

    expect(result.publication).toMatchObject({ exposed: false, reason: 'AUDIENCE_EXCLUDED' });
    expect(result.poll).toMatchObject({
      exposed: true,
      exposureAudienceEligible: false,
      actionEligible: false,
      frozenCohortEligible: null,
      actionPolicyHandledElsewhere: true,
      policyNote: 'POLL_ACTION_ELIGIBILITY_HANDLED_BY_GSC'
    });
    expect(result.poll).not.toHaveProperty('reason');
  });

  test('does not decide Poll membership, assurance or frozen cohort, and respects lifecycle', async ({ page }) => {
    const result = await page.evaluate(() => {
      const policy = window.CampusHubResourcePolicy;
      const base = {
        visibility: 'MEMBERS',
        visibilityEligible: true,
        lifecycleVisible: true,
        audienceEligible: true,
        membershipState: 'refresh',
        currentAssurance: 'L0',
        requiredAssurance: 'L3',
        frozenCohortEligible: false
      };
      return {
        audiencePass: policy.evaluatePollExposure(base),
        unavailable: policy.evaluatePollExposure({ ...base, lifecycleVisible: false, audienceEligible: false }),
        missingAudience: policy.evaluatePollExposure({
          visibility: 'MEMBERS', visibilityEligible: true, lifecycleVisible: true
        })
      };
    });

    expect(result.audiencePass).toMatchObject({
      exposed: true,
      actionEligible: null,
      frozenCohortEligible: null,
      actionPolicyHandledElsewhere: true
    });
    expect(result.unavailable).toMatchObject({
      exposed: false,
      reason: 'RESOURCE_UNAVAILABLE',
      actionEligible: false
    });
    expect(result.missingAudience).toMatchObject({
      exposed: false,
      reason: 'AUDIENCE_UNEVALUATED',
      actionEligible: false
    });
  });

  test('requires Event audience plus active lifecycle for Home/Discover exposure', async ({ page }) => {
    const result = await page.evaluate(() => {
      const policy = window.CampusHubResourcePolicy;
      const base = { visibility: 'MEMBERS', visibilityEligible: true, lifecycleVisible: true };
      return {
        excluded: policy.evaluateEventExposure({ ...base, audienceEligible: false }),
        allowed: policy.evaluateEventExposure({ ...base, audienceEligible: true }),
        past: policy.evaluateEventExposure({ ...base, audienceEligible: true, lifecycleVisible: false })
      };
    });

    expect(result.excluded).toMatchObject({ exposed: false, reason: 'AUDIENCE_EXCLUDED' });
    expect(result.excluded).not.toHaveProperty('card');
    expect(result.excluded).not.toHaveProperty('message');
    expect(result.allowed.exposed).toBe(true);
    expect(result.past).toMatchObject({ exposed: false, reason: 'RESOURCE_UNAVAILABLE' });
  });

  test('keeps Opportunity exposure separate from Apply assurance', async ({ page }) => {
    const result = await page.evaluate(() => {
      const policy = window.CampusHubResourcePolicy;
      const base = {
        visibility: 'MEMBERS',
        visibilityEligible: true,
        lifecycleVisible: true,
        requiredAssurance: 'L2',
        currentAssurance: 'L0',
        applyAssuranceEligible: false
      };
      return {
        excluded: policy.evaluateOpportunityExposure({ ...base, audienceEligible: false }),
        exposed: policy.evaluateOpportunityExposure({ ...base, audienceEligible: true })
      };
    });

    expect(result.excluded).toMatchObject({
      exposed: false,
      exposureAllowed: false,
      actionPolicyHandledElsewhere: true,
      reason: 'AUDIENCE_EXCLUDED'
    });
    expect(result.exposed).toMatchObject({
      exposed: true,
      exposureAllowed: true,
      actionPolicyHandledElsewhere: true
    });
    expect(result.exposed).not.toHaveProperty('actionEligible');
  });

  test('is deterministic, preserves source order, and does not mutate policy inputs', async ({ page }) => {
    const result = await page.evaluate(() => {
      const policy = window.CampusHubResourcePolicy;
      const input = publicationInputForTest();
      const inputBefore = JSON.stringify(input);
      const first = policy.evaluatePublicationExposure(input);
      const second = policy.evaluatePublicationExposure(input);
      const resources = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
      const resourcesBefore = JSON.stringify(resources);
      const decisionFor = resource => ({ exposed: resource.id !== 'b' });
      const sourceOrder = policy.filterExposedResources(resources, decisionFor).map(resource => resource.id);
      const permutedOrder = policy.filterExposedResources([...resources].reverse(), decisionFor).map(resource => resource.id);
      return {
        first,
        second,
        inputBefore,
        inputAfter: JSON.stringify(input),
        resourcesBefore,
        resourcesAfter: JSON.stringify(resources),
        sourceOrder,
        permutedOrder
      };

      function publicationInputForTest(){
        return {
          visibility: 'MEMBERS',
          visibilityEligible: true,
          audienceEligible: true,
          lifecycleVisible: true,
          nested: { cohortLabel: 'synthetic-campus' }
        };
      }
    });

    expect(result.first).toEqual(result.second);
    expect(result.inputAfter).toBe(result.inputBefore);
    expect(result.resourcesAfter).toBe(result.resourcesBefore);
    expect(result.sourceOrder).toEqual(['a', 'c']);
    expect(result.permutedOrder).toEqual(['c', 'a']);
  });

  test('audits canonical fixtures without inventing an audience schema or wiring policy into current UI', async ({ page }) => {
    const audit = await page.evaluate(() => {
      const has = (value, key) => Object.prototype.hasOwnProperty.call(value, key);
      const data = window.CampusHubDemo;
      return {
        publications: data.publications.map(publication => ({
          id: publication.id,
          visibility: publication.visibility,
          hasAudienceField: has(publication, 'audience')
        })),
        event: {
          hasVisibilityField: has(data.featuredEvent, 'visibility'),
          hasAudienceField: has(data.featuredEvent, 'audience'),
          audienceEligible: data.featuredEvent.audienceEligible
        },
        opportunity: {
          hasVisibilityField: has(data.opportunity, 'visibility'),
          hasAudienceField: has(data.opportunity, 'audience')
        },
        poll: {
          hasVisibilityField: has(data.poll, 'visibility'),
          hasAudienceField: has(data.poll, 'audience'),
          hasLegacyEligibleField: has(data.poll, 'eligible')
        }
      };
    });

    expect(audit.publications).toEqual([
      { id: 'notice-classes-rescheduled', visibility: 'MEMBERS', hasAudienceField: false },
      { id: 'innovation-week', visibility: 'MEMBERS', hasAudienceField: false },
      { id: 'cocis-innovation-lab', visibility: 'MEMBERS', hasAudienceField: false }
    ]);
    expect(audit.event).toEqual({ hasVisibilityField: false, hasAudienceField: false, audienceEligible: true });
    expect(audit.opportunity).toEqual({ hasVisibilityField: false, hasAudienceField: false });
    expect(audit.poll).toEqual({ hasVisibilityField: false, hasAudienceField: false, hasLegacyEligibleField: true });
  });
});
