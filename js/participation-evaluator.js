/*
 * Canonical GSC-14 participation evaluator.
 *
 * This client-side decision is prototype behavior only. Production must
 * re-run the canonical participation decision server-side for every gated
 * mutation; this module is not an authorization boundary.
 */
(function(root){
  "use strict";

  const CONTEXTS = Object.freeze([
    "poll",
    "voice-submission",
    "voice-support",
    "rsvp",
    "daily-quiz"
  ]);
  const STEPS = Object.freeze([
    "tenant-lifecycle",
    "module-enabled",
    "resource-actionable",
    "membership-state",
    "assurance",
    "audience",
    "verified-attributes",
    "story-prerequisites"
  ]);
  const ASSURANCE_RANK = Object.freeze({ L0: 0, L1: 1, L2: 2, L3: 3 });
  const REQUIRED_FIELDS = Object.freeze([
    "resourceContext",
    "tenantLifecycle",
    "moduleEnabled",
    "resourceActionable",
    "membershipState",
    "currentAssurance",
    "requiredAssurance",
    "audienceEligible",
    "verifiedAttributesPresent",
    "storyPrerequisitesMet"
  ]);

  function typeError(field, detail){
    throw new TypeError(`Invalid participation evaluator input: ${field}${detail ? ` ${detail}` : ""}.`);
  }

  function assertBoolean(input, field){
    if(typeof input[field] !== "boolean") typeError(field, "must be a boolean");
  }

  function assertEnum(input, field, values){
    if(!values.includes(input[field])) typeError(field, `must be one of ${values.join(", ")}`);
  }

  function assertInput(input){
    if(!input || typeof input !== "object" || Array.isArray(input)){
      typeError("input", "must be an object");
    }
    REQUIRED_FIELDS.forEach(field => {
      if(!Object.prototype.hasOwnProperty.call(input, field)) typeError(field, "is required");
    });

    assertEnum(input, "resourceContext", CONTEXTS);
    assertEnum(input, "tenantLifecycle", ["active", "inactive"]);
    assertBoolean(input, "moduleEnabled");
    assertBoolean(input, "resourceActionable");
    assertEnum(input, "membershipState", ["active", "refresh"]);
    assertEnum(input, "currentAssurance", Object.keys(ASSURANCE_RANK));
    assertEnum(input, "requiredAssurance", Object.keys(ASSURANCE_RANK));
    assertBoolean(input, "audienceEligible");
    assertBoolean(input, "verifiedAttributesPresent");
    assertBoolean(input, "storyPrerequisitesMet");
  }

  function denial(step, variant, resourceContext){
    return {
      allowed: false,
      reason: { step, variant, resourceContext }
    };
  }

  function evaluate(input){
    assertInput(input);

    if(input.tenantLifecycle !== "active"){
      return denial("tenant-lifecycle", "tenant-inactive", input.resourceContext);
    }
    if(!input.moduleEnabled){
      return denial("module-enabled", "module-unavailable", input.resourceContext);
    }
    if(!input.resourceActionable){
      const variant = input.resourceContext === "poll" ? "poll-closed" : "resource-unavailable";
      return denial("resource-actionable", variant, input.resourceContext);
    }
    if(input.membershipState !== "active"){
      return denial("membership-state", "membership-refresh", input.resourceContext);
    }
    if(ASSURANCE_RANK[input.currentAssurance] < ASSURANCE_RANK[input.requiredAssurance]){
      return denial("assurance", "assurance-required", input.resourceContext);
    }
    if(!input.audienceEligible){
      return denial("audience", "audience-ineligible", input.resourceContext);
    }
    if(!input.verifiedAttributesPresent){
      return denial("verified-attributes", "attributes-required", input.resourceContext);
    }
    if(!input.storyPrerequisitesMet){
      return denial("story-prerequisites", "prerequisites-unmet", input.resourceContext);
    }
    return { allowed: true };
  }

  root.CampusHubParticipation = Object.freeze({
    evaluate,
    STEPS,
    CONTEXTS
  });
})(window);
