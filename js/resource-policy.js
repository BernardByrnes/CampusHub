/*
 * CampusHub resource exposure policy contract.
 *
 * This module models prototype policy composition only. Production Django/DRF
 * must evaluate tenant, membership, visibility and audience server-side before
 * serialization, search, notification or media delivery. Next.js should only
 * render already-authorized results; it must not infer audience from
 * client-provided attributes.
 *
 * Production cache identity must include tenant plus the evaluated
 * visibility/audience policy cohort. This prototype intentionally has no cache
 * implementation.
 */
(function(root){
  "use strict";

  const VISIBILITY_VALUES = Object.freeze(["PUBLIC", "MEMBERS", "VERIFIED_MEMBERS"]);
  const VIEWER_CLASSES = Object.freeze(["PUBLIC_VISITOR", "MEMBER_L0", "MEMBER_L1", "MEMBER_L2", "MEMBER_L3"]);
  const ASSURANCE_RANK = Object.freeze({ L0: 0, L1: 1, L2: 2, L3: 3 });
  const REASONS = Object.freeze({
    RESOURCE_UNAVAILABLE: "RESOURCE_UNAVAILABLE",
    VISIBILITY_REQUIRED: "VISIBILITY_REQUIRED",
    AUDIENCE_EXCLUDED: "AUDIENCE_EXCLUDED",
    AUDIENCE_UNEVALUATED: "AUDIENCE_UNEVALUATED",
    UNSUPPORTED_RESOURCE: "UNSUPPORTED_RESOURCE"
  });
  const VISIBILITY_STATES = Object.freeze({ VISIBLE: "VISIBLE", NOT_VISIBLE: "NOT_VISIBLE" });
  const POLL_POLICY_NOTE = "POLL_ACTION_ELIGIBILITY_HANDLED_BY_GSC";

  const hasOwn = (value, key) => Object.prototype.hasOwnProperty.call(value, key);
  const isRecord = value => value !== null && typeof value === "object" && !Array.isArray(value);

  function viewerAssurance(viewerClass){
    if(!VIEWER_CLASSES.includes(viewerClass) || viewerClass === "PUBLIC_VISITOR") return null;
    return ASSURANCE_RANK[viewerClass.slice(-2)];
  }

  // Visibility is deliberately independent from audience matching. The latter
  // enters this module only as a server/test precomputed boolean.
  function viewerCanPassVisibility(input){
    if(!isRecord(input) || !VISIBILITY_VALUES.includes(input.visibility)) return false;

    if(input.viewerClass === "PUBLIC_VISITOR"){
      return input.visibility === "PUBLIC" && input.tenantPublicSurfaceEnabled === true;
    }

    const assurance = viewerAssurance(input.viewerClass);
    if(assurance === null) return false;
    if(input.visibility === "PUBLIC") return true;
    if(input.visibility === "MEMBERS") return assurance >= ASSURANCE_RANK.L1;
    return assurance >= ASSURANCE_RANK.L2;
  }

  function visibilityEligible(input){
    if(!isRecord(input) || !VISIBILITY_VALUES.includes(input.visibility)) return false;
    if(hasOwn(input, "visibilityEligible")) return input.visibilityEligible === true;
    return viewerCanPassVisibility(input);
  }

  function audienceEligibility(input){
    if(!isRecord(input)) return { known: false, eligible: false };

    const hasAudience = hasOwn(input, "audienceEligible");
    const hasExposureAudience = hasOwn(input, "exposureAudienceEligible");
    if(!hasAudience && !hasExposureAudience) return { known: false, eligible: false };

    const audience = hasAudience ? input.audienceEligible : input.exposureAudienceEligible;
    if(typeof audience !== "boolean") return { known: false, eligible: false };
    if(hasAudience && hasExposureAudience && input.audienceEligible !== input.exposureAudienceEligible){
      return { known: false, eligible: false };
    }
    return { known: true, eligible: audience };
  }

  function exposureResult({ exposed, visibility, audience }, extras){
    return Object.freeze({
      exposed: exposed === true,
      visibilityState: visibility ? VISIBILITY_STATES.VISIBLE : VISIBILITY_STATES.NOT_VISIBLE,
      exposureAudienceEligible: audience.known && audience.eligible === true,
      ...extras
    });
  }

  function publicationExposure(input){
    const lifecycleVisible = isRecord(input) && input.lifecycleVisible === true;
    const visibility = visibilityEligible(input);
    const audience = audienceEligibility(input);
    const denied = reason => exposureResult(
      { exposed: false, visibility, audience },
      { reason, notificationEligible: false, mediaEligible: false }
    );

    // Product Specification CH-PUB-003 is the resource-specific authority:
    // Publication exposure requires lifecycle, visibility AND audience.
    if(!lifecycleVisible) return denied(REASONS.RESOURCE_UNAVAILABLE);
    if(!visibility) return denied(REASONS.VISIBILITY_REQUIRED);
    if(!audience.known) return denied(REASONS.AUDIENCE_UNEVALUATED);
    if(!audience.eligible) return denied(REASONS.AUDIENCE_EXCLUDED);

    return exposureResult(
      { exposed: true, visibility, audience },
      { notificationEligible: true, mediaEligible: true }
    );
  }

  function eventExposure(input){
    const lifecycleVisible = isRecord(input) && input.lifecycleVisible === true;
    const visibility = visibilityEligible(input);
    const audience = audienceEligibility(input);
    const denied = reason => exposureResult({ exposed: false, visibility, audience }, { reason });

    // CH-EVT-001: an active Home/Discover candidate must be in its audience.
    if(!lifecycleVisible) return denied(REASONS.RESOURCE_UNAVAILABLE);
    if(!visibility) return denied(REASONS.VISIBILITY_REQUIRED);
    if(!audience.known) return denied(REASONS.AUDIENCE_UNEVALUATED);
    if(!audience.eligible) return denied(REASONS.AUDIENCE_EXCLUDED);

    return exposureResult({ exposed: true, visibility, audience }, {});
  }

  function opportunityExposure(input){
    const lifecycleVisible = isRecord(input) && input.lifecycleVisible === true;
    const visibility = visibilityEligible(input);
    const audience = audienceEligibility(input);
    const denied = reason => exposureResult(
      { exposed: false, visibility, audience },
      { reason, exposureAllowed: false, actionPolicyHandledElsewhere: true }
    );

    // CH-OPP-001/003 separate targeting exposure from the later Apply policy.
    if(!lifecycleVisible) return denied(REASONS.RESOURCE_UNAVAILABLE);
    if(!visibility) return denied(REASONS.VISIBILITY_REQUIRED);
    if(!audience.known) return denied(REASONS.AUDIENCE_UNEVALUATED);
    if(!audience.eligible) return denied(REASONS.AUDIENCE_EXCLUDED);

    return exposureResult(
      { exposed: true, visibility, audience },
      { exposureAllowed: true, actionPolicyHandledElsewhere: true }
    );
  }

  function pollExposure(input){
    const lifecycleVisible = isRecord(input) && input.lifecycleVisible === true;
    const visibility = visibilityEligible(input);
    const audience = audienceEligibility(input);
    const denied = reason => exposureResult(
      { exposed: false, visibility, audience },
      {
        reason,
        actionEligible: false,
        frozenCohortEligible: null,
        actionPolicyHandledElsewhere: true,
        policyNote: POLL_POLICY_NOTE
      }
    );

    // Poll audience is intentionally not a read-exposure gate. GSC-14 owns
    // membership, assurance, frozen cohort and the single action denial.
    if(!lifecycleVisible) return denied(REASONS.RESOURCE_UNAVAILABLE);
    if(!visibility) return denied(REASONS.VISIBILITY_REQUIRED);
    if(!audience.known) return denied(REASONS.AUDIENCE_UNEVALUATED);

    return exposureResult(
      { exposed: true, visibility, audience },
      {
        actionEligible: audience.eligible ? null : false,
        frozenCohortEligible: null,
        actionPolicyHandledElsewhere: true,
        policyNote: POLL_POLICY_NOTE
      }
    );
  }

  function decisionAllowsExposure(decision){
    return decision === true || (
      isRecord(decision) && (decision.exposed === true || decision.exposureAllowed === true)
    );
  }

  function filterExposedResources(resources, decisionFor){
    if(!Array.isArray(resources)) throw new TypeError("resources must be an array");
    if(typeof decisionFor !== "function") throw new TypeError("decisionFor must be a function");
    return resources.filter(resource => decisionAllowsExposure(decisionFor(resource)));
  }

  function resolveExposedResource(resources, id, decisionFor){
    return filterExposedResources(resources, decisionFor)
      .find(resource => isRecord(resource) && resource.id === id) || null;
  }

  function evaluateResourceExposure(resourceType, input){
    if(resourceType === "publication") return publicationExposure(input);
    if(resourceType === "event") return eventExposure(input);
    if(resourceType === "opportunity") return opportunityExposure(input);
    if(resourceType === "poll") return pollExposure(input);
    return Object.freeze({ exposed: false, reason: REASONS.UNSUPPORTED_RESOURCE });
  }

  root.CampusHubResourcePolicy = Object.freeze({
    VISIBILITY_VALUES,
    VISIBILITY_STATES,
    VIEWER_CLASSES,
    REASONS,
    viewerCanPassVisibility,
    evaluatePublicationExposure: publicationExposure,
    evaluateEventExposure: eventExposure,
    evaluateOpportunityExposure: opportunityExposure,
    evaluatePollExposure: pollExposure,
    evaluateResourceExposure,
    filterExposedResources,
    resolveExposedResource
  });
})(window);
