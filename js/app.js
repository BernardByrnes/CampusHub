/* CampusHub Prototype Interactions */
(function(){
  const D = window.CampusHubDemo;
  const $ = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));
  const LEGACY_STATE_KEY = "campushub:state";
  const LEGACY_VOICE_DRAFT_SESSION_KEY = "campushub:voice-draft";
  const PERSISTENCE_SCENARIO_SESSION_KEY = "campushub:debug:persistence-scenario";
  const CURRENT_STATE_SCHEMA_VERSION = 3;
  const PREVIOUS_STATE_SCHEMA_VERSION = 2;
  const DEFAULT_STATE_NAMESPACE = Object.freeze({
    schemaVersion: CURRENT_STATE_SCHEMA_VERSION,
    tenantId: "tenant-makerere",
    membershipId: "membership-demo-001"
  });
  const POLL_RETURN_ROUTE = "participate/poll/restroom-cleanliness";
  const RSVP_RETURN_ROUTE = "events/guild-debate";
  const QUIZ_RETURN_ROUTE = "play";
  const VOICE_NEW_RETURN_ROUTE = "participate/voice/new";
  const VOICE_DETAIL_RETURN_PREFIX = "participate/voice/";
  const VOICE_DETAIL_ROUTE_PREFIX = "voice-detail/";
  const LEGACY_DETAIL_ALIASES = Object.freeze({
    event: "events/guild-debate",
    opportunity: "opportunities/ra-climate",
    sports: "sports/mubs-mak"
  });
  const DETAIL_ROUTE_DEFINITIONS = Object.freeze({
    events: { view: "event", parent: "discover", resolve: id => findCanonicalEntity("featuredEvent", id) },
    opportunities: { view: "opportunity", parent: "discover", resolve: id => findCanonicalEntity("opportunity", id) },
    sports: { view: "sports", parent: "discover", resolve: id => findCanonicalEntity("sportsResult", id) },
    news: { view: "news", parent: "discover", resolve: findPublication },
    "voice-detail": { view: "voice-detail", parent: "participate", resolve: resolveVoiceDetailEntity }
  });
  const VOICE_CATEGORIES = Object.freeze([
    "Wi-Fi",
    "Water & Sanitation",
    "Facilities",
    "Lighting",
    "Library",
    "Transport",
    "Academic Facilities",
    "Campus Services"
  ]);
  let persistenceScenario = "normal";
  const PERSISTENCE_FAILURE_MESSAGE = "We couldn’t save that change. Try again.";
  const VOICE_TITLE_MAX = 80;
  const VOICE_DESCRIPTION_MAX = 500;
  const DISCOVER_FILTERS = Object.freeze(["All", "Events", "Opportunities", "Sports", "News"]);
  const DISCOVER_SYSTEM_STATES = Object.freeze(["ready", "loading", "error", "offline"]);
  const discoverSearchState = { query:"", filter:"All" };
  let discoverSystemState = "ready";
  // Test-only notification fixtures never alter the canonical content dataset.
  let notificationTestMode = null;
  // Test-only Opportunity lifecycle scenarios never alter the tenant calendar.
  let opportunityTestScenario = "normal";
  let meSavesOpen = false;
  let meRsvpsOpen = false;

  function currentStateNamespace(){
    const configured = D.demoConfig?.stateNamespace || {};
    const schemaVersion = Number(configured.schemaVersion);
    const tenantId = typeof configured.tenantId === "string" && configured.tenantId.trim()
      ? configured.tenantId.trim()
      : DEFAULT_STATE_NAMESPACE.tenantId;
    const membershipId = typeof configured.membershipId === "string" && configured.membershipId.trim()
      ? configured.membershipId.trim()
      : DEFAULT_STATE_NAMESPACE.membershipId;
    return {
      schemaVersion: Number.isInteger(schemaVersion) && schemaVersion > 0 ? schemaVersion : CURRENT_STATE_SCHEMA_VERSION,
      tenantId,
      membershipId
    };
  }

  function stateStorageKey(){
    const namespace = currentStateNamespace();
    return `campushub:state:v${namespace.schemaVersion}:${namespace.tenantId}:${namespace.membershipId}`;
  }

  function stateStorageKeyForSchema(schemaVersion){
    const namespace = currentStateNamespace();
    return `campushub:state:v${schemaVersion}:${namespace.tenantId}:${namespace.membershipId}`;
  }

  function previousStateStorageKey(){
    return stateStorageKeyForSchema(PREVIOUS_STATE_SCHEMA_VERSION);
  }

  function voiceDraftStorageKey(){
    const namespace = currentStateNamespace();
    return `campushub:voice-draft:v${namespace.schemaVersion}:${namespace.tenantId}:${namespace.membershipId}`;
  }

  function previousVoiceDraftStorageKey(){
    return `campushub:voice-draft:v${PREVIOUS_STATE_SCHEMA_VERSION}:${currentStateNamespace().tenantId}:${currentStateNamespace().membershipId}`;
  }

  function stateOwnershipFields(){
    const namespace = currentStateNamespace();
    return {
      schemaVersion: namespace.schemaVersion,
      tenantId: namespace.tenantId,
      membershipId: namespace.membershipId
    };
  }

  function stateOwnsCurrentMembership(state){
    const ownership = stateOwnershipFields();
    return Boolean(state && typeof state === "object" && !Array.isArray(state)
      && state.schemaVersion === ownership.schemaVersion
      && state.tenantId === ownership.tenantId
      && state.membershipId === ownership.membershipId);
  }

  function isFutureStateVersion(state){
    return Boolean(state && typeof state === "object" && !Array.isArray(state)
      && Number.isInteger(Number(state.schemaVersion))
      && Number(state.schemaVersion) > CURRENT_STATE_SCHEMA_VERSION);
  }

  function persistenceScenarioFromSession(){
    try{
      const stored = sessionStorage.getItem(PERSISTENCE_SCENARIO_SESSION_KEY);
      return stored === "fail" ? "fail" : "normal";
    }catch(error){
      return "normal";
    }
  }

  persistenceScenario = persistenceScenarioFromSession();

  function setPersistenceScenarioValue(value){
    persistenceScenario = value === "fail" ? "fail" : "normal";
    try{
      if(persistenceScenario === "fail") sessionStorage.setItem(PERSISTENCE_SCENARIO_SESSION_KEY, "fail");
      else sessionStorage.removeItem(PERSISTENCE_SCENARIO_SESSION_KEY);
    }catch(error){}
    return persistenceScenario;
  }

  const CANONICAL_PARTICIPATION_SCENARIOS = Object.freeze({
    "assurance-required": {
      membership: { assuranceLevel: 1, status: "active" },
      participation: { resourceStatus: "active", audienceEligible: true, moduleEnabled: true }
    },
    "membership-refresh": {
      membership: { assuranceLevel: 2, status: "refresh" },
      participation: { resourceStatus: "active", audienceEligible: true, moduleEnabled: true }
    },
    "poll-closed": {
      membership: { assuranceLevel: 2, status: "active" },
      participation: { resourceStatus: "closed", audienceEligible: true, moduleEnabled: true }
    },
    "audience-ineligible": {
      membership: { assuranceLevel: 2, status: "active" },
      participation: { resourceStatus: "active", audienceEligible: false, moduleEnabled: true }
    },
    "voice-disabled": {
      membership: { assuranceLevel: 2, status: "active" },
      participation: { resourceStatus: "active", audienceEligible: true, moduleEnabled: false }
    }
  });
  const LEGACY_PARTICIPATION_SCENARIO_ALIASES = Object.freeze({
    eligible: "normal",
    assurance: "assurance-required",
    membership: "membership-refresh",
    resource: "poll-closed",
    audience: "audience-ineligible",
    module: "voice-disabled"
  });

  function findCanonicalEntity(key, entityId){
    const entity = D[key];
    if(!entity || !entityId) return null;
    return entity.id.toLowerCase() === entityId.toLowerCase() ? entity : null;
  }

  const OPPORTUNITY_SCENARIO_DAYS = Object.freeze({
    normal: null,
    expired: "2026-05-31"
  });

  function opportunityEffectiveTenantDay(){
    return OPPORTUNITY_SCENARIO_DAYS[opportunityTestScenario]
      || D.demoConfig?.calendar?.currentTenantDay
      || null;
  }

  function isOpportunityExpired(opportunity=D.opportunity, tenantDay=opportunityEffectiveTenantDay()){
    const deadline = opportunity?.deadlineTenantDay;
    if(!isCanonicalTenantDay(deadline) || !isCanonicalTenantDay(tenantDay)) return false;
    // ISO tenant days compare chronologically; the deadline day itself remains active.
    return tenantDay > deadline;
  }

  function opportunityLifecycle(opportunity=D.opportunity){
    const tenantDay = opportunityEffectiveTenantDay();
    const expired = isOpportunityExpired(opportunity, tenantDay);
    return {
      status: expired ? "expired" : "active",
      active: !expired,
      expired,
      tenantDay,
      deadlineTenantDay: opportunity?.deadlineTenantDay || null
    };
  }

  function assuranceRank(value){
    if(typeof value === "number" || (typeof value === "string" && /^\s*\d+\s*$/.test(value))){
      const numeric = Number(value);
      return Number.isInteger(numeric) && numeric >= 0 && numeric < ASSURANCE_CODES.length ? numeric : null;
    }
    const code = String(value == null ? "" : value).trim().toUpperCase();
    const rank = ASSURANCE_CODES.indexOf(code);
    return rank >= 0 ? rank : null;
  }

  // Opportunity Apply is an external hand-off policy, not a GSC-14 participation
  // context. The resource's declared assurance requirement is enforced here
  // without changing the shared participation evaluator.
  function evaluateOpportunityAction(opportunity=D.opportunity, state=participationState()){
    const requiredRank = assuranceRank(opportunity?.requiredAssurance);
    const requiredAssurance = requiredRank === null ? null : ASSURANCE_CODES[requiredRank];
    const currentRank = assuranceRank(state?.membership?.assuranceLevel);
    const currentAssurance = currentRank === null ? null : ASSURANCE_CODES[currentRank];
    const base = { allowed:false, reason:null, requiredAssurance, currentAssurance };

    if(!opportunity || typeof opportunity !== "object"){
      return { ...base, reason:"RESOURCE_UNAVAILABLE" };
    }
    if(!opportunityLifecycle(opportunity).active){
      return { ...base, reason:"LIFECYCLE_UNAVAILABLE" };
    }
    if(!isSafeExternalHttpsUrl(opportunity.externalUrl)){
      return { ...base, reason:"INVALID_DESTINATION" };
    }
    if(requiredRank === null || currentRank === null){
      return { ...base, reason:"INVALID_POLICY" };
    }
    if(currentRank < requiredRank){
      return { ...base, reason:"ASSURANCE_REQUIRED" };
    }
    return { ...base, allowed:true };
  }

  function findPublication(entityId){
    if(!entityId || !Array.isArray(D.publications)) return null;
    return D.publications.find(publication => publication.id.toLowerCase() === entityId.toLowerCase()) || null;
  }

  function voiceScenarioFixtureId(state){
    const scenario = state?.voiceStatusScenario ? D.voiceStatusScenarios?.[state.voiceStatusScenario] : null;
    return scenario?.fixtureId || null;
  }

  function findVoiceIssue(issueId){
    if(!issueId || !Array.isArray(D.voiceIssues)) return null;
    const normalizedId = String(issueId).toLowerCase();
    return D.voiceIssues.find(issue => issue.id.toLowerCase() === normalizedId) || null;
  }

  const VOICE_MONTHS = Object.freeze([
    "january", "february", "march", "april", "may", "june",
    "july", "august", "september", "october", "november", "december"
  ]);

  function voiceHistoryDateRank(value){
    if(typeof value !== "string") return Number.NEGATIVE_INFINITY;
    const normalized = value.trim().toLowerCase();
    if(isCanonicalTenantDay(normalized)){
      const [year, month, day] = normalized.split("-").map(Number);
      return Date.UTC(year, month - 1, day);
    }
    const match = normalized.match(/^(\d{1,2})\s+([a-z]+)\s+(\d{4})$/);
    if(!match) return Number.NEGATIVE_INFINITY;
    const day = Number(match[1]);
    const month = VOICE_MONTHS.findIndex(name => name === match[2] || name.startsWith(match[2]));
    const year = Number(match[3]);
    if(month < 0 || !Number.isInteger(day) || day < 1 || day > 31 || !Number.isInteger(year)){
      return Number.NEGATIVE_INFINITY;
    }
    const timestamp = Date.UTC(year, month, day);
    const date = new Date(timestamp);
    return date.getUTCFullYear() === year && date.getUTCMonth() === month && date.getUTCDate() === day
      ? timestamp
      : Number.NEGATIVE_INFINITY;
  }

  function latestVoiceOperationalUpdateRank(issue){
    const updates = [
      ...(Array.isArray(issue?.history) ? issue.history : []),
      ...(Array.isArray(issue?.officialUpdates) ? issue.officialUpdates : [])
    ];
    return updates.reduce((latest, update) => {
      const value = update?.tenantDay || update?.date || update?.updatedAt;
      return Math.max(latest, voiceHistoryDateRank(value));
    }, Number.NEGATIVE_INFINITY);
  }

  function featuredVoiceForHome(issues=D.voiceIssues){
    const candidates = Array.isArray(issues)
      ? issues.filter(issue => issue && typeof issue.id === "string")
      : [];
    const configured = candidates.find(issue => issue.featured === true);
    if(configured) return configured;

    let selected = null;
    let selectedRank = Number.NEGATIVE_INFINITY;
    candidates.forEach(issue => {
      const rank = latestVoiceOperationalUpdateRank(issue);
      if(!selected || rank > selectedRank){
        selected = issue;
        selectedRank = rank;
      }
    });
    return selected;
  }

  function normalizeHomeKind(kind){
    const normalized = String(kind == null ? "" : kind).trim().toLowerCase().replace(/[\s_]+/g, "-");
    return ({
      news: "publication",
      publication: "publication",
      story: "publication",
      opportunity: "opportunity",
      opportunities: "opportunity",
      event: "event",
      events: "event",
      sports: "sports",
      "student-voice": "voice",
      "daily-quiz": "quiz"
    })[normalized] || normalized;
  }

  function pollParticipationForCurrentPoll(state, entity=D.poll){
    if(state?.pollDone !== true) return false;
    // The prototype has one canonical Poll. An explicitly supplied entity is
    // still checked so a future candidate cannot inherit another poll's receipt.
    return !entity?.id || !D.poll?.id || entity.id === D.poll.id;
  }

  // Cross-section order is frozen by Blueprint §16.1. Membership acted-state
  // is a within-slot demotion/preference signal under CH-HOM-001.
  function homeActedStateFor(input={}){
    const { kind, entity, state } = input || {};
    const normalizedKind = normalizeHomeKind(kind);
    let acted = false;
    let stateName = "pending";
    if(normalizedKind === "poll"){
      acted = pollParticipationForCurrentPoll(state, entity || D.poll);
      stateName = acted ? "responded" : "pending";
    } else if(normalizedKind === "event"){
      acted = state?.rsvp === "going" || state?.rsvp === "interested";
      stateName = acted ? state.rsvp : "pending";
    } else if(normalizedKind === "quiz"){
      acted = Boolean(quizParticipationForCurrentDay(state, entity || D.quiz));
      stateName = acted ? "complete" : "pending";
    }
    return { acted, state: stateName, rankPenalty: acted ? 1 : 0 };
  }

  function candidateIdForHome(candidate){
    const value = candidate?.canonicalId ?? candidate?.id ?? candidate?.entityId;
    return value == null ? "" : String(value);
  }

  function candidateOrderForHome(candidate){
    const value = candidate?.canonicalOrder ?? candidate?.order ?? candidate?.position;
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : Number.POSITIVE_INFINITY;
  }

  function candidateActedStateForHome(candidate, actedStateFor){
    const resolved = typeof actedStateFor === "function"
      ? actedStateFor(candidate)
      : (candidate?.actedState || (Object.prototype.hasOwnProperty.call(candidate || {}, "acted")
        ? { acted: candidate.acted }
        : homeActedStateFor({
          kind: candidate?.kind,
          entity: candidate?.entity || candidate,
          state: candidate?.state
        })));
    if(typeof resolved === "boolean") return { acted: resolved };
    return resolved && typeof resolved === "object" ? resolved : { acted:false };
  }

  function primaryRankForHome(candidate, primaryRankFor){
    const value = typeof primaryRankFor === "function"
      ? primaryRankFor(candidate)
      : candidate?.primaryRank;
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : 0;
  }

  function selectHomeCandidate(candidates, options={}){
    if(!Array.isArray(candidates)) return null;
    const records = [];
    candidates.forEach((candidate, index)=>{
      if(!candidate || typeof candidate !== "object") return;
      if(candidate.eligible === false || candidate.renderable === false || candidate.hidden === true) return;
      if(typeof options.isEligible === "function" && !options.isEligible(candidate)) return;
      if(typeof options.isRenderable === "function" && !options.isRenderable(candidate)) return;
      records.push({
        candidate,
        index,
        actedState: candidateActedStateForHome(candidate, options.actedStateFor),
        primaryRank: primaryRankForHome(candidate, options.primaryRankFor)
      });
    });
    records.sort((left, right)=>{
      const actedCompare = Number(Boolean(left.actedState.acted)) - Number(Boolean(right.actedState.acted));
      if(actedCompare) return actedCompare;
      if(left.primaryRank !== right.primaryRank) return right.primaryRank - left.primaryRank;
      const leftId = candidateIdForHome(left.candidate);
      const rightId = candidateIdForHome(right.candidate);
      if(leftId !== rightId) return leftId < rightId ? -1 : 1;
      const leftOrder = candidateOrderForHome(left.candidate);
      const rightOrder = candidateOrderForHome(right.candidate);
      if(leftOrder !== rightOrder){
        if(Number.isFinite(leftOrder) && Number.isFinite(rightOrder)) return leftOrder - rightOrder;
        if(Number.isFinite(leftOrder)) return -1;
        if(Number.isFinite(rightOrder)) return 1;
      }
      return left.index - right.index;
    });
    return records[0]?.candidate || null;
  }

  function resolveVoiceDetailEntity(issueId){
    const publicIssue = findVoiceIssue(issueId);
    if(publicIssue) return publicIssue;
    const state = participationState();
    const fixtureId = voiceScenarioFixtureId(state);
    if(!fixtureId || fixtureId.toLowerCase() !== String(issueId || "").toLowerCase()) return null;
    return D.voiceValidationFixtures?.[fixtureId] || null;
  }

  function parseHashRoute(hash=location.hash){
    const raw = String(hash || "").replace(/^#/, "").trim();
    if(!raw) return { kind:"view", view:"home" };
    const slash = raw.indexOf("/");
    const routeName = (slash === -1 ? raw : raw.slice(0, slash)).toLowerCase();
    const entityPart = slash === -1 ? "" : raw.slice(slash + 1);
    const definition = DETAIL_ROUTE_DEFINITIONS[routeName];
    if(!definition) return { kind:"view", view:routeName };
    if(!entityPart) return { kind:"detail", routeName, definition, entityId:null, entity:null };
    let entityId = "";
    try{
      entityId = decodeURIComponent(entityPart);
    }catch(error){
      return { kind:"detail", routeName, definition, entityId:null, entity:null };
    }
    const entity = definition.resolve(entityId);
    return { kind:"detail", routeName, definition, entityId, entity };
  }

  function setEntityField(selector, value){
    const element = $(selector);
    if(element) element.textContent = value == null ? "" : String(value);
  }

  function syncHomeActedSurface(cardSelector, actedState, options={}){
    const card = $(cardSelector);
    if(!card) return;
    const acted = Boolean(actedState?.acted);
    card.classList.toggle("home-card--acted", acted);
    card.dataset.homeState = actedState?.state || "pending";
    card.dataset.homeActed = acted ? "true" : "false";

    if(options.chipSelector){
      const chip = card.querySelector(options.chipSelector);
      if(chip){
        const label = typeof options.stateLabel === "function"
          ? options.stateLabel(actedState)
          : options.stateLabel;
        chip.textContent = acted ? (label || actedState?.state || "Acted") : "";
        chip.dataset.homeState = actedState?.state || "pending";
        chip.hidden = !acted;
      }
    }
    if(options.actionSelector){
      const action = card.querySelector(options.actionSelector);
      if(action){
        action.classList.toggle("home-action--acted", acted);
        if(acted && options.actedAriaLabel) action.setAttribute("aria-label", options.actedAriaLabel);
        else if(!acted && options.defaultAriaLabel) action.setAttribute("aria-label", options.defaultAriaLabel);
      }
    }
  }

  // Opportunity destinations are deliberately strict: malformed, relative,
  // non-HTTPS and scheme-smuggling values never become actionable links.
  function isSafeExternalHttpsUrl(value){
    if(typeof value !== "string" || !value.trim()) return false;
    try{
      const parsed = new URL(value);
      return parsed.protocol === "https:" && Boolean(parsed.hostname);
    }catch(error){
      return false;
    }
  }

  function renderEventEntity(event){
    if(!event) return;
    const eventView = $('#view-event');
    if(eventView){
      eventView.dataset.eventId = event.id || '';
      eventView.dataset.requiredAssurance = event.requiredAssurance || '';
    }
    setEntityField('[data-field="eventKicker"]', event.kicker);
    setEntityField('[data-field="eventTitle"]', event.title);
    setEntityField('[data-field="eventDate"]', event.date);
    setEntityField('[data-field="eventTime"]', event.time);
    setEntityField('[data-field="eventVenue"]', event.venue);
    setEntityField('[data-field="eventOrg"]', event.organiser);
    setEntityField('[data-field="eventDescription"]', event.description);
    const image = $('#eventImg');
    if(image){
      image.src = event.image;
      image.alt = event.imageAlt;
    }
  }

  function renderOpportunityEntity(opportunity){
    if(!opportunity) return;
    const lifecycle = opportunityLifecycle(opportunity);
    const view = $('#view-opportunity');
    if(view){
      view.dataset.opportunityId = opportunity.id || '';
      view.dataset.opportunityLifecycle = lifecycle.status;
      view.dataset.opportunityTenantDay = lifecycle.tenantDay || '';
    }
    setEntityField('[data-field="oppKicker"]', opportunity.kicker || "Verified Opportunity");
    setEntityField('[data-field="oppTitle"]', opportunity.title);
    setEntityField('[data-field="oppProvider"]', opportunity.provider);
    setEntityField('[data-field="oppDeadline"]', opportunity.deadline);
    setEntityField('[data-field="oppProvider2"]', opportunity.provider);
    setEntityField('[data-field="oppDeadline2"]', opportunity.deadlineDate || opportunity.deadline);
    setEntityField('[data-field="oppDetailTitle"]', opportunity.title);
    setEntityField('[data-field="oppLocation"]', opportunity.location);
    setEntityField('[data-field="oppWorkArrangement"]', opportunity.workArrangement);
    setEntityField('[data-field="oppStipend"]', opportunity.stipend);
    setEntityField('[data-field="oppDescription"]', opportunity.description || opportunity.summary);
    setEntityField('[data-field="oppEligibility"]', opportunity.eligibility);
    setEntityField('[data-field="oppRequiredAssurance"]', `${opportunity.requiredAssurance || "L2"} required`);

    const status = $('#oppStatus');
    if(status){
      status.hidden = !lifecycle.expired;
      status.textContent = lifecycle.expired ? "Expired" : "";
    }
    const expiredCopy = $('#oppExpiredCopy');
    if(expiredCopy){
      expiredCopy.hidden = !lifecycle.expired;
    }

    const requirements = $('#oppRequirements');
    if(requirements){
      requirements.replaceChildren();
      (Array.isArray(opportunity.requirements) ? opportunity.requirements : []).forEach(requirement=>{
        const item = document.createElement("li");
        item.textContent = requirement;
        requirements.appendChild(item);
      });
    }

    const policy = evaluateOpportunityAction(opportunity, participationState());
    const assuranceDenied = policy.reason === "ASSURANCE_REQUIRED";
    const requiredLabel = policy.requiredAssurance
      ? assuranceLabel(assuranceRank(policy.requiredAssurance))
      : "Required assurance";
    const assuranceNote = $('#oppAssuranceNote');
    if(assuranceNote){
      assuranceNote.hidden = !assuranceDenied;
      assuranceNote.textContent = assuranceDenied
        ? `${requiredLabel} is required to continue to the provider application.`
        : "";
    }
    const verificationLink = $('#oppReviewVerification');
    if(verificationLink){
      verificationLink.hidden = !assuranceDenied;
      verificationLink.href = "#verification";
      verificationLink.setAttribute("aria-label", `Review verification to continue to ${opportunity.title}`);
    }

    const opportunityView = $('#view-opportunity');
    if(opportunityView){
      opportunityView.dataset.opportunityApplyPolicy = policy.allowed ? "allowed" : (policy.reason || "unavailable");
    }
    const apply = $('#oppApply');
    const destination = !lifecycle.expired && isSafeExternalHttpsUrl(opportunity.externalUrl) ? opportunity.externalUrl : "";
    if(apply){
      apply.hidden = !policy.allowed;
      apply.disabled = !policy.allowed;
    }
    const continueLink = $('#leaveCampusHubContinue');
    if(continueLink){
      continueLink.hidden = !policy.allowed;
      if(policy.allowed && destination){
        continueLink.href = destination;
        continueLink.target = "_blank";
        continueLink.rel = "noopener noreferrer";
      }
      else {
        continueLink.removeAttribute("href");
        continueLink.removeAttribute("target");
        continueLink.removeAttribute("rel");
      }
    }
    if(!policy.allowed || !destination){
      const dialog = $('#leaveCampusHubDialog');
      if(dialog?.open && typeof dialog.close === "function") dialog.close();
    }
    syncOpportunityReportButton(opportunity);
  }

  function syncOpportunityReportButton(opportunity=D.opportunity){
    const report = $('#oppReport');
    if(!report || !opportunity) return;
    const state = participationState();
    const reported = Array.isArray(state.reportedOpportunityIds)
      && state.reportedOpportunityIds.includes(opportunity.id);
    report.disabled = reported;
    report.textContent = reported ? "Report sent ✓" : "Report suspicious opportunity";
    report.setAttribute("aria-disabled", reported ? "true" : "false");
  }

  function renderSportsEntity(sports){
    if(!sports) return;
    const title = `${sports.homeTeam} ${sports.homeScore} — ${sports.awayScore} ${sports.awayTeam}`;
    const league = `${sports.sport} • ${sports.competition}`;
    const score = `${sports.homeScore} — ${sports.awayScore}`;
    const accessibleScore = `${sports.status} result: ${sports.homeTeam} ${sports.homeScore}, ${sports.awayTeam} ${sports.awayScore}`;
    setEntityField('[data-field="sportsTitle"]', title);
    setEntityField('[data-field="sportsLeague"]', league);
    setEntityField('[data-field="sportsMeta"]', `${sports.date} • ${sports.status}`);
    setEntityField('[data-field="sportsTitle2"]', title);
    setEntityField('[data-field="sportsLeague2"]', league);
    setEntityField('[data-field="sportsScore"]', score);
    setEntityField('[data-field="sportsStatus"]', sports.status);
    setEntityField('[data-field="sportsDetailDate"]', sports.date);
    setEntityField('[data-field="sportsDetailTime"]', sports.time);
    setEntityField('[data-field="sportsDetailVenue"]', sports.venue);
    setEntityField('[data-field="sportsDetailSport"]', sports.sport);
    setEntityField('[data-field="sportsDetailCompetition"]', sports.competition);
    setEntityField('[data-field="sportsReportNote"]', sports.reportNote || "");
    setEntityField('[data-field="sportsHomeCrest"]', sports.homeCrest || sports.homeTeam);
    setEntityField('[data-field="sportsAwayCrest"]', sports.awayCrest || sports.awayTeam);
    const scoreboard = $('#sportsScoreboard');
    if(scoreboard) scoreboard.setAttribute('aria-label', accessibleScore);
  }

  function clearPublicationEntity(){
    setEntityField('#newsDetailKicker', '');
    setEntityField('#newsDetailTitle', '');
    setEntityField('#newsDetailDate', '');
    setEntityField('#newsDetailSource', '');

    const body = $('#newsDetailBody');
    if(body) body.textContent = '';

    const media = $('#newsDetailMedia');
    const image = $('#newsDetailImage');
    if(media){
      media.hidden = true;
      media.removeAttribute('aria-label');
      media.style.removeProperty('background');
    }
    if(image){
      image.hidden = true;
      image.removeAttribute('src');
      image.alt = '';
      image.style.removeProperty('display');
    }
  }

  function renderPublicationEntity(publication){
    clearPublicationEntity();
    if(!publication) return;
    setEntityField('#newsDetailKicker', publication.kicker);
    setEntityField('#newsDetailTitle', publication.title);
    setEntityField('#newsDetailDate', publication.date);
    setEntityField('#newsDetailSource', publication.source);

    const body = $('#newsDetailBody');
    if(body){
      const paragraphs = (Array.isArray(publication.body) ? publication.body : String(publication.body || publication.excerpt || "").split(/\n\s*\n/))
        .map(paragraph => String(paragraph).trim())
        .filter(Boolean);
      body.innerHTML = paragraphs.map(paragraph => `<p>${escapeHtml(paragraph)}</p>`).join("");
    }

    const media = $('#newsDetailMedia');
    const image = $('#newsDetailImage');
    const imageSource = typeof publication.image === 'string' ? publication.image.trim() : '';
    const hasImage = Boolean(imageSource);
    if(media){
      media.hidden = !hasImage;
      media.removeAttribute('aria-label');
      media.style.removeProperty('background');
    }
    if(image){
      image.hidden = !hasImage;
      image.style.removeProperty('display');
      if(hasImage){
        image.src = imageSource;
        image.alt = publication.imageAlt || "";
      } else {
        image.removeAttribute('src');
        image.alt = '';
      }
    }
  }

  function hydratePollContent(){
    const poll = D.poll;
    if(!poll) return;
    setEntityField('#pollQuestion', poll.question);
    setEntityField('#pollCard [data-field="pollKicker"]', poll.kicker);
    setEntityField('#pollCard [data-field="pollHelp"]', poll.help);
    setEntityField('#pollCard [data-field="pollPrivacy"]', poll.privacyNote);
    setEntityField('#pollCard [data-field="pollTrust"]', poll.trustNote);
    $$('#pollForm [data-field="pollOptionLabel"]').forEach((label, index)=>{
      label.textContent = poll.options?.[index] || '';
    });
  }

  // Populate tenant header
  function hydrateTenant(state=participationState()){
    const normalizedState = ensureParticipationState(state || {});
    const progress = studentProgressForState(normalizedState);
    syncStreakPresentation(normalizedState, progress);
    $('[data-field="tenantCampus"]').textContent = D.tenant.campusLabel;
    $('[data-field="tenantYear"]').textContent = `Academic Year ${D.tenant.academicYear}`;
    // priority
    const priorityPublication = findPublication("notice-classes-rescheduled");
    if(priorityPublication){
      setEntityField('[data-field="priorityKicker"]', priorityPublication.kicker);
      setEntityField('[data-field="priorityTitle"]', priorityPublication.title);
      setEntityField('[data-field="priorityBody"]', priorityPublication.body);
      setEntityField('[data-field="priorityMeta"]', [priorityPublication.date, priorityPublication.source].filter(Boolean).join(" • "));
    }
    const priorityLink = $('#homePriority [data-testid="home-priority-link"]');
    if(priorityLink) priorityLink.href = priorityPublication?.href || "#news/notice-classes-rescheduled";
    // hero
    $('[data-field="heroKicker"]').textContent = D.heroStory.kicker.toUpperCase();
    $('[data-field="heroTitle"]').textContent = D.heroStory.title;
    $('[data-field="heroBody"]').textContent = D.heroStory.body;
    $('#heroImg').src = D.heroStory.image;
    $('#heroImg').alt = D.heroStory.imageAlt;
    const heroLink = $('[data-testid="hero-read"]');
    if(heroLink) heroLink.href = D.heroStory.href;
    // Home composition uses the same canonical records as the destination views.
    const homePoll = D.poll;
    if(homePoll){
      const homePollCard = $('#homePoll');
      if(homePollCard) homePollCard.dataset.pollId = homePoll.id || '';
      setEntityField('[data-field="homePollKicker"]', homePoll.kicker);
      setEntityField('[data-field="homePollTitle"]', homePoll.question);
      setEntityField('[data-field="homePollMeta"]', homePoll.closes);
      const pollActedState = homeActedStateFor({ kind:"poll", entity:homePoll, state:normalizedState });
      const pollLink = $('#homePoll [data-testid="home-poll-respond"]');
      if(pollLink){
        pollLink.href = homePoll.href || "#participate";
        pollLink.textContent = pollActedState.acted ? "Review" : (homePoll.cta || "Respond");
        pollLink.setAttribute("aria-label", pollActedState.acted
          ? "Review your recorded poll response"
          : "Respond to the campus poll");
      }
      syncHomeActedSurface('#homePoll', pollActedState, {
        chipSelector:'[data-field="homePollState"]',
        stateLabel:"Responded",
        actionSelector:'[data-testid="home-poll-respond"]'
      });
    }
    hydratePollContent();
    const homeEvent = D.featuredEvent;
    if(homeEvent){
      setEntityField('[data-field="homeEventKicker"]', homeEvent.kicker);
      setEntityField('[data-field="homeEventTitle"]', homeEvent.title);
      setEntityField('[data-field="homeEventDate"]', `${homeEvent.date} • ${homeEvent.time}`);
      setEntityField('[data-field="homeEventVenue"]', homeEvent.venue);
      const eventActedState = homeActedStateFor({ kind:"event", entity:homeEvent, state:normalizedState });
      const eventLink = $('#homeEvent [data-testid="home-event-link"]');
      if(eventLink){
        eventLink.href = homeEvent.href;
        eventLink.setAttribute("aria-label", `View ${homeEvent.title} details`);
      }
      syncHomeActedSurface('#homeEvent', eventActedState, {
        chipSelector:'[data-field="homeEventState"]',
        stateLabel:state => state.state === "going" ? "Going" : "Interested",
        actionSelector:'[data-testid="home-event-link"]'
      });
    }
    const homeOpportunity = D.opportunity;
    if(homeOpportunity){
      const lifecycle = opportunityLifecycle(homeOpportunity);
      const homeOpp = $('#homeOpp');
      if(homeOpp){
        homeOpp.hidden = lifecycle.expired;
        homeOpp.dataset.opportunityLifecycle = lifecycle.status;
      }
      setEntityField('[data-field="oppTitle"]', homeOpportunity.title);
      setEntityField('[data-field="oppProvider"]', homeOpportunity.provider);
      setEntityField('[data-field="oppDeadline"]', homeOpportunity.deadline);
      const homeOpportunityLink = $('#homeOpp [data-testid="home-opportunity-link"]');
      if(homeOpportunityLink) homeOpportunityLink.href = homeOpportunity.href;
    }
    const homeVoice = featuredVoiceForHome();
    if(homeVoice){
      setEntityField('[data-field="homeVoiceCategory"]', homeVoice.category);
      setEntityField('[data-field="homeVoiceTitle"]', homeVoice.title);
      setEntityField('[data-field="homeVoiceSupporters"]', `${homeVoice.supporters} supporters`);
      setEntityField('[data-field="homeVoiceStatus"]', homeVoice.status);
      const voiceLink = $('#homeVoice [data-testid="home-voice-link"]');
      if(voiceLink) voiceLink.href = `#voice-detail/${encodeURIComponent(homeVoice.id)}`;
    }
    // Entity surfaces share the canonical records used by detail routes.
    renderSportsEntity(D.sportsResult);
    renderOpportunityEntity(D.opportunity);
    renderEventEntity(D.featuredEvent);
    // me
    renderMe(normalizedState, progress);
    renderRecentXpHistory(normalizedState);
    // play header
    const levelInfo = progress.levelInfo;
    const next = D.levels.find(l=> Number(l.level)===progress.level+1);
    $('[data-field="levelDisplay"]').textContent = `Level ${progress.level}`;
    $('[data-field="levelTitle"]').textContent = levelInfo.title;
    $('[data-field="xpCount"]').textContent = progress.xp;
    $('[data-field="xpNext"]').textContent = next ? `${next.xpMin - progress.xp} XP to Level ${next.level}` : `Max level`;
    $('[data-field="levelTitle"]') && void 0;
    // xp bar
    const xpBar = $('#xpBar');
    if(xpBar){
      const span = next
        ? Number(next.xpMin) - Number(levelInfo.xpMin)
        : Number(levelInfo.xpMax) - Number(levelInfo.xpMin) + 1;
      const prog = span > 0 ? ((progress.xp - Number(levelInfo.xpMin))/span)*100 : 0;
      xpBar.style.width = Math.max(8, Math.min(100, prog)) + '%';
    }
    $('[data-field="quizQ"]').textContent = D.quiz.question;
    setEntityField('[data-field="homeQuizQuestion"]', D.quiz.question);
    setEntityField('[data-field="homeQuizXpParticipation"]', `+${D.quiz.xpParticipation || 5} XP`);
    setEntityField('[data-field="homeQuizXpBonus"]', `+${D.quiz.xpBonus || 5} XP`);
    const quizActedState = homeActedStateFor({ kind:"quiz", entity:D.quiz, state:normalizedState });
    setEntityField('[data-field="homeQuizCta"]', quizActedState.acted ? "Review" : "Play");
    const quizLink = $('#homeQuiz [data-testid="home-quiz-play"]');
    if(quizLink){
      quizLink.setAttribute("aria-label", quizActedState.acted
        ? "Review today's quiz result"
        : "Play today's quiz");
    }
    syncHomeActedSurface('#homeQuiz', quizActedState, {
      actionSelector:'[data-testid="home-quiz-play"]'
    });
    setEntityField('[data-field="homeLevel"]', `Level ${progress.level}`);
    setEntityField('[data-field="homeXp"]', `${progress.xp} XP`);
  }

  // Discover search is deliberately bounded to the already-permitted derived index.
  function normalizeDiscoverQuery(value){
    return String(value == null ? "" : value).trim().toLowerCase();
  }

  function discoverSearchText(item){
    return [
      item.kind,
      item.kicker,
      item.title,
      item.body,
      item.summary,
      item.provider,
      item.source,
      item.organiser,
      item.venue,
      item.location,
      item.deadline,
      item.sport,
      item.competition,
      item.meta
    ].filter(value => value != null && String(value).trim()).join(" ").toLowerCase();
  }

  function syncDiscoverSearchControls(){
    const input = $('#globalSearch');
    if(input && input.value !== discoverSearchState.query) input.value = discoverSearchState.query;
    $$('#discoverFilters .filter-chip').forEach(button=>{
      const pressed = button.getAttribute('data-filter') === discoverSearchState.filter;
      button.setAttribute('aria-pressed', pressed ? 'true' : 'false');
    });
  }

  function updateDiscoverSearchState(next={}){
    const filter = next.filter == null ? discoverSearchState.filter : next.filter;
    discoverSearchState.filter = DISCOVER_FILTERS.includes(filter) ? filter : "All";
    if(next.query !== undefined) discoverSearchState.query = String(next.query == null ? "" : next.query);
    renderDiscover();
  }

  // Production data loading/offline behavior belongs to the production data layer;
  // this static prototype models the required student-facing states only.
  function syncDiscoverSystemBanner(){
    const host = $('#discoverSystemState');
    if(!host) return;
    if(discoverSystemState !== "offline"){
      host.replaceChildren();
      return;
    }
    if(host.querySelector('.discover-offline-banner')) return;
    host.innerHTML = '<div class="discover-offline-banner" role="status" aria-atomic="true">You’re offline. Showing cached campus information.</div>';
  }

  function renderDiscoverLoading(list){
    list.setAttribute('aria-busy', 'true');
    list.innerHTML = `<div class="discover-loading">
      <p class="sr-only">Loading campus information.</p>
      <div class="discover-skeletons" aria-hidden="true">
        <div class="discover-skeleton"><span class="discover-skeleton__line discover-skeleton__line--kicker"></span><span class="discover-skeleton__line discover-skeleton__line--title"></span><span class="discover-skeleton__line discover-skeleton__line--body"></span></div>
        <div class="discover-skeleton"><span class="discover-skeleton__line discover-skeleton__line--kicker"></span><span class="discover-skeleton__line discover-skeleton__line--title"></span><span class="discover-skeleton__line discover-skeleton__line--body"></span></div>
        <div class="discover-skeleton"><span class="discover-skeleton__line discover-skeleton__line--kicker"></span><span class="discover-skeleton__line discover-skeleton__line--title"></span><span class="discover-skeleton__line discover-skeleton__line--body"></span></div>
      </div>
    </div>`;
  }

  function renderDiscoverError(list){
    list.removeAttribute('aria-busy');
    list.innerHTML = `<div class="discover-state discover-error">
      <p>We couldn’t load campus information.</p>
      <button id="discoverTryAgain" class="btn" type="button">Try again</button>
    </div>`;
  }

  // Discover rendering: filter and normalized query are one deterministic intersection.
  function renderDiscover(){
    const list = $('#discoverList');
    if(!list) return;
    syncDiscoverSearchControls();
    syncDiscoverSystemBanner();
    // Cached offline content is not re-announced as a whole list; the offline
    // status banner is the single intentional announcement for that state.
    if(discoverSystemState === "offline") list.removeAttribute('aria-live');
    else list.setAttribute('aria-live', 'polite');
    if(discoverSystemState === "loading"){
      renderDiscoverLoading(list);
      return;
    }
    if(discoverSystemState === "error"){
      renderDiscoverError(list);
      return;
    }
    list.removeAttribute('aria-busy');
    const opportunityState = opportunityLifecycle(D.opportunity);
    // Lifecycle filtering happens before category/search presentation so expired
    // Opportunity facts cannot leak through cards, snippets, counts, or search.
    let items = D.discoverItems.filter(item => (
      item.kind !== "Opportunities"
      || item.id !== D.opportunity?.id
      || opportunityState.active
    ));
    const filter = discoverSearchState.filter;
    const query = normalizeDiscoverQuery(discoverSearchState.query);

    if(filter !== "All") items = items.filter(item => item.kind === filter);
    if(query) items = items.filter(item => discoverSearchText(item).includes(query));

    if(items.length===0){
      list.innerHTML = `<div class="empty discover-empty"><p>No campus information matches that search.</p><button id="discoverClearSearch" class="btn btn--small" type="button">Clear search</button></div>`;
      return;
    }

    list.innerHTML = items.map(item=>{
      const identity = `data-discover-id="${escapeHtml(item.id)}" data-discover-kind="${escapeHtml(item.kind)}"`;
      if(item.kind==="Events"){
        return `<article class="card list-card" ${identity}>
          <div style="display:flex; gap:12px;">
            <div style="flex:1; min-width:0;">
              <div class="kicker kicker--info">${escapeHtml(item.kicker)}</div>
              <div class="title" style="margin-top:6px;">${escapeHtml(item.title)}</div>
              <div class="inline-meta" style="margin-top:8px; flex-direction:column; align-items:flex-start;">
                <span style="display:flex; gap:6px; align-items:center;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18"/></svg> ${escapeHtml(item.meta)}</span>
                <span style="display:flex; gap:6px; align-items:center;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M12 21s7-6 7-11a7 7 0 1 0-14 0c0 5 7 11 7 11z"/></svg> ${escapeHtml(item.venue)}</span>
              </div>
              <a href="${escapeHtml(item.href)}" class="btn btn--small" style="margin-top:10px; background:var(--info-soft); border-color:var(--info-border); color:var(--info);">View details →</a>
            </div>
            <div class="cover" style="width:42%; max-width:170px; flex:0 0 42%; height:auto;">
              <img src="${item.image}" alt="${escapeHtml(item.imageAlt)}" width="300" height="220" loading="lazy" decoding="async" />
            </div>
          </div>
        </article>`;
      }
      if(item.kind==="News"){
        return `<article class="card list-card" ${identity}>
          <div style="display:flex; gap:12px;">
            <div style="flex:1; min-width:0;">
              <div class="kicker">${escapeHtml(item.kicker)}</div>
              <div class="title" style="margin-top:6px;">${escapeHtml(item.title)}</div>
              <p class="body-sm" style="margin:6px 0 0;">${escapeHtml(item.body)}</p>
              <div class="meta" style="margin-top:8px;">${escapeHtml(item.meta)} <a href="${escapeHtml(item.href)}" class="section-action" style="margin-left:8px;">Read more →</a></div>
            </div>
            <div class="cover" style="width:42%; max-width:170px; flex:0 0 42%;">
              <img src="${item.image}" alt="${escapeHtml(item.imageAlt)}" width="300" height="220" loading="lazy" decoding="async" />
            </div>
          </div>
        </article>`;
      }
      if(item.kind==="Opportunities"){
        return `<article class="card list-card" ${identity}>
          <div class="row">
            <div class="icon-tile icon-tile--brand" aria-hidden="true"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M3 12h18"/></svg></div>
            <div style="flex:1; min-width:0;">
              <div class="kicker">${escapeHtml(item.kicker)}</div>
              <div class="title" style="margin-top:4px;">${escapeHtml(item.title)}</div>
              <div class="meta" style="margin-top:4px;">${escapeHtml(item.provider)}</div>
              <p class="body-sm" style="margin:4px 0 0;">${escapeHtml(item.body)}</p>
              <div class="inline-meta" style="margin-top:8px; justify-content:space-between; width:100%;"><span style="display:flex; gap:6px; align-items:center;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18"/></svg> ${escapeHtml(item.deadline)}</span><a href="${escapeHtml(item.href)}" class="section-action">Makerere University →</a></div>
            </div>
          </div>
        </article>`;
      }
      if(item.kind==="Sports"){
        // Canonical: result 1 — 2 Final on Home and Discover (no contradictory upcoming fixture)
        return `<article class="card list-card" ${identity}>
          <div style="display:flex; gap:12px; align-items:center; justify-content:space-between;">
            <div style="min-width:0; flex:1;">
              <div class="kicker">${escapeHtml(item.kicker)}</div>
              <div class="small-card-title" style="margin-top:4px;">${escapeHtml(item.title)}</div>
              <div class="meta" style="margin-top:4px;">${escapeHtml(item.provider)}</div>
              <div class="meta" style="margin-top:4px; font-weight:600;">${escapeHtml(item.meta)}</div>
            </div>
            <div style="display:flex; flex-direction:column; align-items:center; gap:8px;">
              <div class="vs"><span class="crest">MUBS</span><span class="score">${escapeHtml(item.score||'1 — 2')}</span><span class="crest" style="background:var(--brand-soft); color:var(--brand); border-color:var(--brand-border);">MUK</span></div>
              <a href="${escapeHtml(item.href)}" class="section-action">View details →</a>
            </div>
          </div>
        </article>`;
      }
      return "";
    }).join("");
  }

  function voiceDetailRoute(issueId){
    return `#${VOICE_DETAIL_ROUTE_PREFIX}${encodeURIComponent(issueId)}`;
  }

  function voiceDetailReturnIntent(issueId){
    return `${VOICE_DETAIL_RETURN_PREFIX}${issueId}`;
  }

  function isVoiceDetailReturnIntent(value){
    return typeof value==="string" && value.startsWith(VOICE_DETAIL_RETURN_PREFIX);
  }

  function voiceIssueIdFromReturnIntent(value){
    return isVoiceDetailReturnIntent(value) ? value.slice(VOICE_DETAIL_RETURN_PREFIX.length) : null;
  }

  function voiceStatusVariant(status){
    return ({
      "Submitted":"submitted",
      "Acknowledged":"acknowledged",
      "Under Review":"review",
      "Action Planned":"planned",
      "Resolved":"resolved"
    })[status] || "submitted";
  }

  function voiceStatusChipClass(status, variant){
    const key = variant || voiceStatusVariant(status);
    return ({
      acknowledged:"chip-acknowledged",
      review:"chip-review",
      planned:"chip-planned",
      resolved:"chip-resolved",
      submitted:"chip-submitted"
    })[key] || "chip-submitted";
  }

  function formatVoiceDate(value){
    if(typeof value!=="string") return "";
    if(/^\d{1,2}\s+[A-Za-z]+\s+\d{4}$/.test(value)) return value;
    const parsed = new Date(value);
    if(Number.isNaN(parsed.getTime())) return value;
    return new Intl.DateTimeFormat("en-GB", { day:"numeric", month:"long", year:"numeric" }).format(parsed);
  }

  function voiceIssueView(record, state){
    const isSupported = state.supportedVoiceIssues.includes(record.id);
    return {
      ...record,
      supporters: record.supporters + (isSupported ? 1 : 0),
      isPublic:true,
      isSupported
    };
  }

  function getVoiceIssue(issueId, state=participationState()){
    const publicIssue = findVoiceIssue(issueId);
    if(publicIssue) return voiceIssueView(publicIssue, state);

    const fixtureId = voiceScenarioFixtureId(state);
    if(fixtureId && fixtureId.toLowerCase() === String(issueId || "").toLowerCase()){
      const fixture = D.voiceValidationFixtures?.[fixtureId];
      if(fixture) return voiceIssueView(fixture, state);
    }

    const submission = state.voiceSubmissions.find(item=>item?.id===issueId);
    if(!submission) return null;
    const submittedAt = formatVoiceDate(submission.submittedAt);
    return {
      id:submission.id,
      category:submission.category,
      title:submission.title,
      body:submission.description,
      supporters:0,
      status:"Submitted",
      statusVariant:"submitted",
      submittedAt,
      history:[{ status:"Submitted", date:submittedAt, note:"Your issue has been submitted for review." }],
      officialUpdates:[],
      isPublic:false,
      isLocalSubmission:true,
      isSupported:false
    };
  }

  function renderVoiceLists(){
    const state = participationState();
    const issues = D.voiceIssues.map(issue=> getVoiceIssue(issue.id, state));
    const toCard = (it) => `
      <a class="card list-card voice-issue-card" href="${voiceDetailRoute(it.id)}" data-voice-issue-id="${escapeHtml(it.id)}" aria-label="View Student Voice issue: ${escapeHtml(it.title)}">
        <div style="display:flex; gap:12px;">
          <div class="icon-tile ${it.category.includes('Water')?'icon-tile--info': (it.category==='Transport'?'icon-tile--brand':'')}" aria-hidden="true" style="width:42px; height:42px;">
            ${it.category==='Water & Sanitation' ? waterIcon() : it.category==='Transport' ? busIcon() : wifiIcon()}
          </div>
          <div style="flex:1; min-width:0;">
            <div class="kicker kicker--info" style="font-size:11px;">${escapeHtml(it.category)}</div>
            <div class="title small-card-title" style="margin-top:4px;">${escapeHtml(it.title)}</div>
            <p class="body-sm" style="margin:4px 0 0;">${escapeHtml(it.body)}</p>
            <div style="display:flex; justify-content:space-between; align-items:center; margin-top:10px; gap:8px;">
              <span class="meta" style="display:flex; gap:6px; align-items:center;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> ${it.supporters} supporters</span>
              <span class="status-chip ${voiceStatusChipClass(it.status, it.statusVariant)}">${escapeHtml(it.status)}</span>
            </div>
          </div>
          <span aria-hidden="true" style="align-self:center; color:var(--text-muted);">›</span>
        </div>
      </a>
    `;
    $('#voiceList').innerHTML = issues.slice(0,2).map(toCard).join("");
    $('#voiceAllList').innerHTML = issues.map(toCard).join("");
  }

  function waterIcon(){ return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M12 2.7l7 10.5a7 7 0 1 1-14 0L12 2.7z"/></svg>`; }
  function busIcon(){ return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="3" y="5" width="18" height="12" rx="2"/><path d="M7 15v3"/><path d="M17 15v3"/><path d="M3 10h18"/><circle cx="7" cy="18" r="1" fill="currentColor"/><circle cx="17" cy="18" r="1" fill="currentColor"/></svg>`; }
  function wifiIcon(){ return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M5 12a11 11 0 0 1 14 0"/><path d="M8 15a7 7 0 0 1 8 0"/><path d="M11 18a3 3 0 0 1 2 0"/><circle cx="12" cy="20" r=".5" fill="currentColor"/></svg>`; }

  function selectVoiceIssue(issueId){
    const state = participationState();
    const issue = getVoiceIssue(issueId, state);
    if(!issue) return null;
    const scenarioFixtureId = voiceScenarioFixtureId(state);
    if(state.voiceStatusScenario && scenarioFixtureId && issue.id!==scenarioFixtureId){
      state.voiceStatusScenario = null;
    }
    if(state.selectedVoiceIssueId!==issue.id){
      state.selectedVoiceIssueId = issue.id;
      if(!saveState(state)) persistenceFailure(nextState=>{
        renderVoiceLists();
        renderVoiceDetail(nextState.selectedVoiceIssueId || issue.id);
      });
    } else if(!state.voiceStatusScenario && scenarioFixtureId){
      if(!saveState(state)) persistenceFailure();
    }
    return issue;
  }

  function focusVoiceDetailTitle(){
    const title = $('#voiceDetailTitle');
    if(!title) return;
    title.focus({preventScroll:true});
    title.scrollIntoView({block:"start", behavior:"auto"});
  }

  function focusNewsDetailTitle(){
    const title = $('#newsDetailTitle');
    if(!title) return;
    title.focus({preventScroll:true});
    title.scrollIntoView({block:"start", behavior:"auto"});
  }

  function focusSportsDetailTitle(){
    const title = $('#sportsDetailTitle');
    if(!title) return;
    title.focus({preventScroll:true});
    title.scrollIntoView({block:"start", behavior:"auto"});
  }

  function focusEventDetailTitle(){
    const title = $('#eventDetailTitle');
    if(!title) return;
    title.focus({preventScroll:true});
    title.scrollIntoView({block:"start", behavior:"auto"});
  }

  function focusVerificationTitle(){
    const title = $('#verificationTitle');
    if(!title) return;
    title.focus({preventScroll:true});
    title.scrollIntoView({block:"start", behavior:"auto"});
  }

  function focusPrivacyTitle(){
    const title = $('#privacyTitle');
    if(!title) return;
    title.focus({preventScroll:true});
  }

  function focusNotificationsTitle(){
    const title = $('#notifTitle');
    if(!title) return;
    title.focus({preventScroll:true});
    title.scrollIntoView({block:"start", behavior:"auto"});
  }

  function focusOpportunityDetailTitle(){
    const title = $('#opportunityDetailTitle');
    if(!title) return;
    title.focus({preventScroll:true});
    title.scrollIntoView({block:"start", behavior:"auto"});
  }

  function renderVoiceDetail(issueId){
    const selected = selectVoiceIssue(issueId || participationState().selectedVoiceIssueId);
    if(!selected) return null;
    const status = $('#voiceDetailStatus');
    const supporters = $('.voice-detail-supporters');
    const supportAction = $('#voiceDetailSupportAction');
    const supportButton = $('#voiceSupportButton');
    const supportFeedback = $('#voiceSupportFeedback');
    const resolvedNote = $('#voiceResolvedSupportNote');

    $('#voiceDetailKicker').textContent = selected.isLocalSubmission ? 'Your submission' : 'Student Voice';
    $('#voiceDetailCategory').textContent = selected.category;
    $('#voiceDetailTitle').textContent = selected.title;
    $('#voiceDetailDescription').textContent = selected.body;
    $('#voiceDetailSupporterCount').textContent = String(selected.supporters);
    $('#voiceDetailSubmitted').textContent = formatVoiceDate(selected.submittedAt);
    $('#voiceDetailAwaiting').hidden = !selected.isLocalSubmission;
    if(supporters) supporters.hidden = !!selected.isLocalSubmission;
    if(status){
      status.textContent = selected.status;
      status.className = `status-chip ${voiceStatusChipClass(selected.status, selected.statusVariant)}`;
    }

    const canSupport = selected.isPublic;
    if(supportAction) supportAction.hidden = !canSupport;
    if(supportButton){
      supportButton.disabled = selected.isSupported;
      supportButton.textContent = selected.isSupported ? 'Supported ✓' : 'Support this issue';
    }
    if(supportFeedback) supportFeedback.textContent = '';
    if(resolvedNote) resolvedNote.hidden = !(selected.isPublic && selected.status==="Resolved");

    const timeline = $('#voiceTimeline');
    if(timeline){
      timeline.innerHTML = selected.history.map((event, index)=>{
        const variant = voiceStatusVariant(event.status);
        return `<li class="voice-timeline__item voice-timeline__item--${escapeHtml(variant)}"${index===selected.history.length-1 ? ' aria-current="step"' : ''}>
          <div class="voice-timeline__event">
            <span class="voice-timeline__status">${escapeHtml(event.status)}</span>
            <time class="voice-timeline__date">${escapeHtml(event.date)}</time>
          </div>
          <p class="voice-timeline__note">${escapeHtml(event.note)}</p>
        </li>`;
      }).join('');
    }

    const updateSection = $('#voiceOfficialUpdatesSection');
    const updates = $('#voiceOfficialUpdates');
    const officialUpdates = selected.officialUpdates || [];
    if(updateSection) updateSection.hidden = officialUpdates.length===0;
    if(updates){
      updates.innerHTML = officialUpdates.map(update=> `
        <article class="voice-official-update">
          <div class="kicker kicker--info">Official update</div>
          <div class="voice-official-update__meta">
            <strong class="voice-official-update__source">${escapeHtml(update.department)}</strong>
            <time class="voice-official-update__date">${escapeHtml(update.date)}</time>
          </div>
          <p>${escapeHtml(update.body)}</p>
        </article>
      `).join('');
    }
    return selected;
  }

  function supportSelectedVoiceIssue(trigger){
    const state = participationState();
    const issue = getVoiceIssue(state.selectedVoiceIssueId, state);
    if(!issue || !issue.isPublic || issue.isSupported) return;
    const decision = evaluateParticipationAction('voice-support', { state, issue });
    if(openParticipationGate(decision, trigger, {
        returnTo:voiceDetailReturnIntent(issue.id),
        returnAction:'voice-support'
      })){
      return;
    }
    state.supportedVoiceIssues.push(issue.id);
    state.supportedVoiceIssues = [...new Set(state.supportedVoiceIssues)];
    if(!saveState(state)){
      const restored = persistenceFailure(nextState=>{
        renderVoiceLists();
        renderVoiceDetail(nextState.selectedVoiceIssueId || issue.id);
      });
      renderVoiceDetail(restored.selectedVoiceIssueId || issue.id);
      return;
    }
    renderVoiceLists();
    renderVoiceDetail(issue.id);
    const feedback = $('#voiceSupportFeedback');
    if(feedback) feedback.textContent = 'Support recorded.';
    toast('Support recorded.');
  }

  function applyVoiceStatusScenario(name, announce=false){
    const scenario = D.voiceStatusScenarios?.[name] || null;
    const state = participationState();
    const fixtureId = scenario?.fixtureId || "voice-water-halls";
    state.voiceStatusScenario = scenario ? name : null;
    state.selectedVoiceIssueId = fixtureId;
    if(!saveState(state)) return false;
    renderVoiceLists();
    if(!$('#view-voice-detail')?.hidden){
      const nextRoute = voiceDetailRoute(fixtureId);
      if(location.hash.toLowerCase()===nextRoute.toLowerCase()) renderVoiceDetail(fixtureId);
      else navigateToHash(nextRoute);
    }
    if(announce) toast(scenario ? `${scenario.label} selected for this prototype.` : 'Student Voice — Acknowledged selected for this prototype.');
    return true;
  }

  function returnFromVoiceDetail(){
    const previous = historyStack[historyStack.length-2] || '';
    if(previous==='voice' || previous==='participate') navigateInAppBack();
    else navigateToHash('#voice');
  }

  function initVoiceDetail(){
    $('#voiceDetailBack')?.addEventListener('click', returnFromVoiceDetail);
    $('#voiceSupportButton')?.addEventListener('click', event=> supportSelectedVoiceIssue(event.currentTarget));
  }

  // Notifications
  const NOTIFICATION_GROUPS = Object.freeze(["Today", "Yesterday", "This Week", "Earlier"]);
  const NOTIFICATION_ICON_TYPES = Object.freeze({ priority:"brand", poll:"brand", publication:"info", verification:"neutral" });

  function notificationDefaultReadIds(){
    return (Array.isArray(D.notifications) ? D.notifications : [])
      .filter(notification => notification && notification.unread === false)
      .map(notification => notification.id)
      .filter(id => typeof id === "string" && id);
  }

  function notificationFixtureList(){
    if(notificationTestMode === "empty") return [];
    if(notificationTestMode === "unavailable"){
      return [
        ...(Array.isArray(D.notifications) ? D.notifications : []),
        {
          id: "notification-source-unavailable",
          group: "Earlier",
          title: "Campus story unavailable",
          body: "The campus story that generated this notice is no longer published.",
          time: "12 May",
          unread: false,
          type: "publication",
          available: false,
          href: "#news/removed-story"
        }
      ];
    }
    return Array.isArray(D.notifications) ? D.notifications : [];
  }

  function isNotificationUnread(notification, state=participationState()){
    if(!notification || typeof notification.id !== "string") return false;
    return Array.isArray(state?.notificationReadIds)
      ? !state.notificationReadIds.includes(notification.id)
      : notification.unread === true;
  }

  function notificationDestination(notification){
    if(!notification || notification.available === false) return null;
    const href = typeof notification.href === "string" ? notification.href : "";
    if(href === "#home" || href === "#participate" || href === "#verification") return href;
    const match = href.match(/^#news\/([^/?#]+)$/i);
    if(match){
      try{
        if(findPublication(decodeURIComponent(match[1]))) return href;
      }catch(error){}
    }
    return null;
  }

  function notificationIcon(type){
    const iconType = NOTIFICATION_ICON_TYPES[type] || "neutral";
    const icon = type === "priority"
      ? '<path d="M4 11h5l6-3v8l-6-3H4z"/><path d="M9 14l1.2 5"/><circle cx="19" cy="8" r="1.5" fill="currentColor" stroke="none"/>'
      : type === "poll"
        ? '<path d="M5 5h14v14H5z"/><path d="M8 9h8M8 12h5M8 15h8"/>'
        : type === "publication"
          ? '<path d="M5 4h14v16H5z"/><path d="M8 8h8M8 12h8M8 16h5"/>'
          : '<path d="M12 3l7 3v5c0 4.5-3 7.8-7 10-4-2.2-7-5.5-7-10V6z"/><path d="M9 12l2 2 4-4"/>';
    return `<span class="notification-icon notification-icon--${iconType}" aria-hidden="true"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${icon}</svg></span>`;
  }

  function syncNotificationBell(unread){
    const badge = $('#notifBadge');
    const button = $('#notifBtn');
    if(badge){
      badge.textContent = String(unread);
      badge.style.display = unread ? 'grid' : 'none';
    }
    if(button) button.setAttribute('aria-label', unread ? `Notifications, ${unread} unread` : 'Notifications');
  }

  function markNotificationRead(notificationId){
    const notification = D.notifications.find(item => item?.id === notificationId);
    if(!notification) return false;
    const state = participationState();
    if(!Array.isArray(state.notificationReadIds)) state.notificationReadIds = notificationDefaultReadIds();
    if(state.notificationReadIds.includes(notificationId)) return false;
    state.notificationReadIds = [...state.notificationReadIds, notificationId];
    if(!saveState(state)){
      persistenceFailure(rendered=> renderNotifications(rendered));
      return false;
    }
    renderNotifications();
    return true;
  }

  function markAllNotificationsRead(){
    const state = participationState();
    const ids = D.notifications.map(notification => notification?.id).filter(id => typeof id === "string" && id);
    const current = new Set(Array.isArray(state.notificationReadIds) ? state.notificationReadIds : notificationDefaultReadIds());
    const changed = ids.some(id => !current.has(id));
    if(!changed) return false;
    ids.forEach(id => current.add(id));
    state.notificationReadIds = [...current];
    if(!saveState(state)){
      persistenceFailure(rendered=> renderNotifications(rendered));
      return false;
    }
    renderNotifications();
    return true;
  }

  function renderNotifications(){
    const wrap = $('#notifList');
    if(!wrap) return;
    const state = participationState();
    const notifications = notificationFixtureList();
    const unread = notifications.filter(notification => isNotificationUnread(notification, state)).length;
    syncNotificationBell(unread);
    const markAll = $('#markAllRead');
    if(markAll) markAll.disabled = unread === 0;

    if(!notifications.length){
      wrap.innerHTML = '<p class="notification-empty">No notifications yet.</p>';
      return;
    }

    let html = "";
    NOTIFICATION_GROUPS.forEach(group => {
      const items = notifications.filter(notification => notification.group === group);
      if(!items.length) return;
      const groupId = `notif-group-${group.toLowerCase().replace(/\s+/g, '-')}`;
      html += `<section class="notification-group" aria-labelledby="${groupId}"><h2 id="${groupId}" class="notification-group-title">${escapeHtml(group)}</h2><ul class="notification-list">`;
      items.forEach(notification => {
        const unreadItem = isNotificationUnread(notification, state);
        const destination = notificationDestination(notification);
        const itemClass = `notification-row${unreadItem ? ' notification-row--unread' : ''}`;
        const stateText = unreadItem ? "Unread notification" : "Read notification";
        const content = `${notificationIcon(notification.type)}<span class="notification-content"><span class="notification-title">${escapeHtml(notification.title)}</span><span class="notification-body">${escapeHtml(notification.body)}</span><span class="notification-state visually-hidden">${stateText}</span>${destination ? '' : '<span class="notification-state">No longer available.</span>'}</span><span class="notification-status"><span class="notification-time">${escapeHtml(notification.time)}</span><span class="notif-dot${unreadItem ? '' : ' notif-dot--read'}" aria-hidden="true"></span></span>`;
        if(destination){
          html += `<li class="notification-item ${itemClass}"><a class="notification-link" href="${escapeHtml(destination)}" data-notification-id="${escapeHtml(notification.id)}">${content}</a></li>`;
        } else {
          html += `<li class="notification-item ${itemClass}"><div class="notification-unavailable" data-notification-id="${escapeHtml(notification.id)}">${content}</div></li>`;
        }
      });
      html += '</ul></section>';
    });
    wrap.innerHTML = html;
    $$('[data-notification-id][href]', wrap).forEach(link => link.addEventListener('click', event => {
      const destination = link.getAttribute('href');
      const notificationId = link.getAttribute('data-notification-id');
      event.preventDefault();
      markNotificationRead(notificationId);
      if(destination) navigateToHash(destination);
    }));
  }

  // Quiz — participation + accuracy model (v1.2): +5 for taking part, +5 bonus if correct, max +10
  let pendingQuizChoice = null;
  function renderQuiz(){
    const opts = D.quiz.options;
    const wrap = $('#quizOptions');
    const saved = participationState();
    const participation = quizParticipationForCurrentDay(saved, D.quiz);
    const done = Boolean(participation);
    const selectedChoice = participation ? participation.optionIndex : pendingQuizChoice;
    const xpPart = D.quiz.xpParticipation || 5;
    const xpBonus = D.quiz.xpBonus || 5;
    wrap.innerHTML = opts.map((o,i)=> `
      <label class="quiz-opt ${done ? (i===D.quiz.correctIndex ? 'correct' : (selectedChoice===i ? 'wrong':'')) : ''}">
        <input type="radio" name="quiz" value="${i}" ${selectedChoice===i?'checked':''} ${done?'disabled':''} />
        <span style="flex:1; font-size:14px; font-weight:600;">${escapeHtml(o)}</span>
        ${done && i===D.quiz.correctIndex ? '<span class="pill pill--brand" style="font-size:11px;">Correct</span>' : ''}
      </label>
    `).join("");
    const btn = $('#quizSubmit');
    const fb = $('#quizFeedback');
    const note = $('#quizCompleteNote');
    if(done){
      pendingQuizChoice = null;
      btn.hidden = true;
      btn.disabled = true;
      fb.hidden = false;
      if(note) note.hidden = false;
      const correct = participation.optionIndex===D.quiz.correctIndex;
      fb.style.background = correct ? 'var(--success-soft)' : 'var(--danger-soft)';
      fb.style.borderColor = correct ? 'var(--border)' : 'var(--danger)';
      fb.style.color = correct ? 'var(--success)' : 'var(--danger)';
      const earned = participation.xpAwarded || quizAwardForChoice(participation.optionIndex, D.quiz);
      fb.innerHTML = correct
        ? `<strong>Correct!</strong> ${escapeHtml(D.quiz.explanation)} <br/><span class="pill pill--brand" style="margin-top:6px;">+${earned} XP earned — +${xpPart} for taking part +${xpBonus} bonus for correct answer</span>`
        : `<strong>Not quite.</strong> Correct answer: ${escapeHtml(D.quiz.options[D.quiz.correctIndex])}.<br/><span style="font-size:12px; color:var(--text-muted);">${escapeHtml(D.quiz.explanation)}</span><br/><span class="pill pill--brand" style="margin-top:6px;">+${earned} XP earned — +${xpPart} for taking part</span>`;
    } else {
      btn.hidden = false;
      fb.hidden = true;
      if(note) note.hidden = true;
      btn.disabled = selectedChoice === null || selectedChoice === undefined;
      // enable submit when choice made
      wrap.onchange = ()=> {
        const c = wrap.querySelector('input[name="quiz"]:checked');
        pendingQuizChoice = c ? parseInt(c.value, 10) : null;
        btn.disabled = !c;
      };
    }
    btn.onclick = ()=> {
      const c = wrap.querySelector('input[name="quiz"]:checked');
      if(!c) return;
      const choice = parseInt(c.value,10);
      const state = participationState();
      const decision = evaluateParticipationAction('daily-quiz', { state, quiz:D.quiz });
      if(openParticipationGate(decision, btn, {
        returnTo:QUIZ_RETURN_ROUTE,
        returnAction:'quiz-submit'
      })) return;
      const completion = dailyQuizCompletionOutcome(state, D.quiz);
      if(completion.completed){
        // GSC established current eligibility; the action layer now returns
        // the authoritative existing result without saving or awarding again.
        renderQuiz();
        return;
      }
      pendingQuizChoice = choice;
      const correct = choice===D.quiz.correctIndex;
      const earned = correct ? (xpPart + xpBonus) : xpPart;
      state.quizDone = true;
      state.quizChoice = choice;
      state.quizParticipation = {
        quizId:D.quiz.id,
        tenantDay:D.quiz.tenantDay,
        optionIndex:choice,
        xpAwarded:earned
      };
      const participationEvent = appendXpEvent(state, {
        type:"award",
        ruleRef:"daily-quiz-participation",
        amount:xpPart,
        idempotencyKey:`xp:award:daily-quiz-participation:${D.quiz.id}`,
        sourceType:"daily-quiz",
        sourceId:D.quiz.id,
        sourceAction:"participate",
        tenantDay:D.quiz.tenantDay,
        studentLabel:"Daily Quiz participation"
      });
      const accuracyEvent = correct ? appendXpEvent(state, {
        type:"award",
        ruleRef:"daily-quiz-accuracy",
        amount:xpBonus,
        idempotencyKey:`xp:award:daily-quiz-accuracy:${D.quiz.id}`,
        sourceType:"daily-quiz",
        sourceId:D.quiz.id,
        sourceAction:"accuracy",
        tenantDay:D.quiz.tenantDay,
        studentLabel:"Daily Quiz accuracy bonus"
      }) : { added:false, reason:"not-applicable" };
      const appendFailures = [participationEvent, accuracyEvent]
        .filter(result => !result.added && !["idempotent", "source-duplicate", "not-applicable"].includes(result.reason));
      if(appendFailures.length){
        pendingQuizChoice = choice;
        renderQuiz();
        return;
      }
      applyStreakQualification("daily-quiz", state);
      pendingQuizChoice = null;
      if(!saveState(state)){
        pendingQuizChoice = choice;
        persistenceFailure(restored=>{
          hydrateTenant(restored);
          renderXPRules();
          renderQuiz();
        });
        return;
      }
      hydrateTenant(state);
      renderXPRules();
      toast(correct ? `Correct — +${earned} XP (+${xpPart} +${xpBonus} bonus). A new quiz will be available tomorrow.` : `Answer recorded — +${earned} XP for taking part. A new quiz will be available tomorrow.`);
      renderQuiz();
    };
  }
  function onQuizChange(){ /* placeholder */ }

  function renderXPRules(){
    const wrap = $('#xpRules');
    wrap.innerHTML = D.xpRules.map(r=> `
      <div style="display:flex; justify-content:space-between; gap:12px; padding:10px 12px; border:1px solid var(--border); border-radius:10px; background:#fff;">
        <span style="font-size:13px; font-weight:600;">${escapeHtml(r.action)}</span>
        <span style="font-size:13px; font-weight:800; color: var(--brand); white-space:nowrap;">${escapeHtml(r.xp)}</span>
      </div>
      <div class="meta" style="margin-top:-6px; margin-left:2px; font-size:11px;">${escapeHtml(r.note)}</div>
    `).join("");
  }

  function formatXpHistoryAmount(amount){
    const numeric = Number(amount);
    if(!Number.isFinite(numeric)) return "";
    if(numeric > 0) return `+${numeric} XP`;
    if(numeric < 0) return `−${Math.abs(numeric)} XP`;
    return "0 XP";
  }

  function renderRecentXpHistory(state=participationState()){
    const wrap = $('#xpHistory');
    if(!wrap) return;
    const events = balanceXpEventsForState(state)
      .filter(event => event.studentVisible !== false)
      .slice()
      .sort((a, b) => String(b.timestamp).localeCompare(String(a.timestamp)));
    if(!events.length){
      wrap.innerHTML = '<p class="meta" data-xp-history-empty>No recent XP activity yet.</p>';
      return;
    }
    wrap.innerHTML = events.map(event => `
      <div class="xp-history-row" style="display:flex; align-items:center; justify-content:space-between; gap:12px; padding:9px 0; border-bottom:1px solid var(--border);">
        <span style="font-size:13px; font-weight:600; min-width:0;">${escapeHtml(xpEventLabel(event))}</span>
        <span style="font-size:13px; font-weight:800; color:${event.amount < 0 ? 'var(--danger)' : 'var(--brand)'}; white-space:nowrap;">${escapeHtml(formatXpHistoryAmount(event.amount))}</span>
      </div>
    `).join("");
  }

  function configuredStudentLevels(){
    return (Array.isArray(D.levels) ? D.levels : [])
      .filter(level => level && Number.isFinite(Number(level.level)))
      .slice()
      .sort((a, b) => Number(a.level) - Number(b.level));
  }

  function studentLevelForXp(xp){
    const levels = configuredStudentLevels();
    if(!levels.length) return { level:1, title:"", xpMin:0, xpMax:0 };
    const parsedXp = Number(xp);
    const normalizedXp = Number.isFinite(parsedXp) && parsedXp >= 0 ? parsedXp : 0;
    const match = levels.find(level => normalizedXp >= Number(level.xpMin) && normalizedXp <= Number(level.xpMax));
    if(match) return match;
    return normalizedXp < Number(levels[0].xpMin) ? levels[0] : levels[levels.length - 1];
  }

  function studentLevelRecord(level){
    const levels = configuredStudentLevels();
    return levels.find(record => Number(record.level) === Number(level)) || studentLevelForXp(0);
  }

  // XP is derived solely from the append-only ledger; the persisted level is
  // only the highest level already reached, preserving the frozen
  // non-decrease/grandfathering rule.
  function studentProgressForState(state){
    const ledgerTotal = xpTotalForState(state);
    // Never show a negative balance even if a malformed hand-edited ledger is
    // present; reconciliation still reports that impossible state.
    const xp = Number.isFinite(ledgerTotal) && ledgerTotal >= 0 ? ledgerTotal : 0;
    const thresholdRecord = studentLevelForXp(xp);
    const thresholdLevel = Number(thresholdRecord.level) || 1;
    const levels = configuredStudentLevels();
    const maximumLevel = levels.length ? Number(levels[levels.length - 1].level) : thresholdLevel;
    const parsedStoredLevel = Number(state?.level);
    const storedLevel = Number.isInteger(parsedStoredLevel) && parsedStoredLevel >= 1
      ? Math.min(parsedStoredLevel, maximumLevel)
      : thresholdLevel;
    const level = Math.max(thresholdLevel, storedLevel);
    return { xp, level, levelInfo:studentLevelRecord(level) };
  }

  function ensureStudentProgress(state){
    const progress = studentProgressForState(state);
    state.level = progress.level;
    delete state.xp;
    return progress;
  }

  function savedItems(state){
    return Array.isArray(state?.saves) ? state.saves : D.saves.slice();
  }

  function canonicalOpportunitySourceId(item){
    if(item?.sourceId === D.opportunity?.id) return D.opportunity.id;
    const id = String(item?.id || "");
    const title = String(item?.title || "");
    if(id === "s2" || id === "opp1" || title === String(D.opportunity?.title || "")) return D.opportunity?.id || null;
    return null;
  }

  function saveRecordMatches(item, kind){
    const id = String(item?.id || "");
    const title = String(item?.title || "");
    if(kind === "event") return id === "s1" || id === "evt1" || title === String(D.featuredEvent?.title || "");
    if(kind === "opportunity") return canonicalOpportunitySourceId(item) === D.opportunity?.id;
    return false;
  }

  function renderSavesList(state){
    const wrap = $('#savesList');
    if(!wrap) return;
    const items = savedItems(state);
    const opportunityState = opportunityLifecycle(D.opportunity);
    wrap.innerHTML = items.map(s=> `
      <div class="list-row" style="gap:10px;">
        <div style="flex:1; min-width:0;">
          <div style="font-size:11px; letter-spacing:.06em; text-transform:uppercase; font-weight:700; color:var(--text-muted);">${escapeHtml(s.type)}</div>
          ${canonicalOpportunitySourceId(s) === D.opportunity?.id
            ? `<a class="title saves-list-link" data-save-source-id="${escapeHtml(D.opportunity.id)}" href="#opportunities/${encodeURIComponent(D.opportunity.id)}" style="font-size:13px; margin-top:2px;">${escapeHtml(s.title)}</a>`
            : `<div class="title" style="font-size:13px; margin-top:2px;">${escapeHtml(s.title)}</div>`}
          <div class="meta">${escapeHtml(s.meta)}</div>
          ${canonicalOpportunitySourceId(s) === D.opportunity?.id && opportunityState.expired
            ? '<span class="pill pill--info save-expired-status">Expired</span>'
            : ''}
        </div>
        <button class="btn btn--small" data-unsave="${escapeHtml(s.id)}">Remove</button>
      </div>
    `).join("") || `<div class="empty">Nothing saved yet.</div>`;
    wrap.querySelectorAll('[data-unsave]').forEach(button=> button.addEventListener('click', ()=>{
      const id = button.getAttribute('data-unsave');
      const nextState = participationState();
      nextState.saves = savedItems(nextState).filter(item => String(item.id) !== String(id));
      if(nextState.saves.some(item => saveRecordMatches(item, "event")) === false) nextState.saveEvent = false;
      if(nextState.saves.some(item => saveRecordMatches(item, "opportunity")) === false) nextState.saveOpp = false;
      if(!saveState(nextState)){
        persistenceFailure(rendered=> renderMe(rendered));
        return;
      }
      renderMe(nextState);
      toast("Removed from saves.");
    }));
  }

  function renderMeRsvps(state){
    const list = $('#meRsvpsList');
    if(!list) return;
    const event = D.featuredEvent;
    if(!state.rsvp){
      list.innerHTML = '<p class="empty">No RSVPs yet.</p>';
      return;
    }
    const status = state.rsvp === "interested" ? "Interested" : "Going";
    list.innerHTML = `
      <div class="list-row" style="gap:10px; align-items:flex-start;">
        <div style="min-width:0; flex:1;">
          <a class="title" style="font-size:13px;" href="#events/guild-debate">${escapeHtml(event.title)}</a>
          <div class="meta" style="margin-top:3px;">${escapeHtml(event.date)} • ${escapeHtml(event.time)}</div>
          <div class="meta">${escapeHtml(event.venue)}</div>
        </div>
        <span class="pill pill--brand">${status}</span>
      </div>
    `;
  }

  function renderMe(state=participationState(), progress=null){
    const normalizedState = ensureParticipationState(state || {});
    const currentProgress = progress || studentProgressForState(normalizedState);
    const membershipStatus = normalizedState.membership.status === "refresh" ? "Needs refreshing" : "Current";
    const currentAssurance = assuranceLabel(normalizedState.membership.assuranceLevel);
    const level = currentProgress.level;
    const xp = currentProgress.xp;
    const items = savedItems(normalizedState);
    const rsvpSummary = normalizedState.rsvp === "going"
      ? "1 RSVP • Going"
      : normalizedState.rsvp === "interested"
        ? "1 RSVP • Interested"
        : "No RSVPs yet.";

    setEntityField('[data-field="studentName"]', D.student.displayName);
    setEntityField('[data-field="studentProg"]', `${D.student.programme} • ${D.student.year}`);
    setEntityField('[data-field="studentCampus"]', `${D.student.campus} • ${D.student.residence}`);
    setEntityField('[data-field="studentNo"]', D.student.studentNumber);
    setEntityField('[data-field="studentFaculty"]', D.student.faculty);
    setEntityField('[data-field="studentEnrolment"]', membershipStatus);
    setEntityField('[data-field="studentDisplayName"]', D.student.displayName);
    setEntityField('[data-field="assuranceBadge"]', currentAssurance);
    setEntityField('[data-field="meLevelXp"]', `Level ${level} • ${xp} XP`);
    setEntityField('[data-field="savesMeta"]', items.length ? `${items.length} saved` : "Nothing saved yet.");
    setEntityField('[data-field="meRsvpMeta"]', rsvpSummary);
    setEntityField('[data-field="mePlayLevel"]', `Level ${level}`);
    setEntityField('[data-field="meVerificationMeta"]', `${currentAssurance} • ${membershipStatus}`);

    const savesPanel = $('#meSaves');
    if(savesPanel) savesPanel.hidden = !meSavesOpen;
    const rsvpsPanel = $('#meRsvps');
    if(rsvpsPanel) rsvpsPanel.hidden = !meRsvpsOpen;
    [['#eventSave', 'saveEvent'], ['#oppSave', 'saveOpp']].forEach(([selector, key])=>{
      const button = $(selector);
      if(!button) return;
      const on = normalizedState[key] === true;
      button.setAttribute('aria-pressed', on ? 'true' : 'false');
      button.textContent = on ? 'Saved ✓' : 'Save';
      button.classList.toggle('is-saved', on);
    });
    renderSavesList(normalizedState);
    renderMeRsvps(normalizedState);
  }

  function renderSaves(){
    renderMe(participationState());
  }

  function openMeActivity(section){
    if(section === "saves") { meSavesOpen = true; meRsvpsOpen = false; }
    if(section === "rsvps") { meRsvpsOpen = true; meSavesOpen = false; }
    const state = participationState();
    renderMe(state);
    const panel = section === "saves" ? $('#meSaves') : $('#meRsvps');
    const heading = section === "saves" ? $('#meSavesHeading') : $('#meRsvpsHeading');
    panel?.scrollIntoView({block:"start", behavior:"auto"});
    setTimeout(()=> heading?.focus({preventScroll:true}), 0);
  }

  function initMeActivity(){
    $('#meSaveLink')?.addEventListener('click', ()=> openMeActivity("saves"));
    $('#meRsvpLink')?.addEventListener('click', ()=> openMeActivity("rsvps"));
  }

  // Contextual participation gating — demo-only local state, ordered by the canonical decision path.
  function assuranceLabel(level){
    return ({ 0:"L0 — Registered", 1:"L1 — Weak Affiliation", 2:"L2 — Roster Match", 3:"L3 — Strong Institutional Proof" })[Number(level)] || "L1 — Weak Affiliation";
  }

  function defaultMembership(){
    return { assuranceLevel:2, status:"active" };
  }

  function defaultParticipation(){
    return {
      tenantLifecycle:"active",
      moduleEnabled:true,
      pollModuleEnabled:true,
      rsvpModuleEnabled:true,
      quizModuleEnabled:true,
      resourceStatus:"active",
      audienceEligible:true,
      rsvpAudienceEligible:true,
      quizAudienceEligible:true,
      voiceAudienceEligible: D.demoConfig?.voiceParticipation?.audienceEligible !== false,
      verifiedAttributes:true,
      storyPrerequisites:true,
      returnTo:null,
      returnAction:null,
      demoScenario:"normal"
    };
  }

  function defaultVoiceDraft(){
    return { category:"", title:"", description:"", step:1 };
  }

  function normalizeVoiceDraft(draft){
    const source = draft && typeof draft === "object" && !Array.isArray(draft) ? draft : {};
    const title = typeof source.title === "string" ? source.title.slice(0, VOICE_TITLE_MAX) : "";
    const description = typeof source.description === "string" ? source.description.slice(0, VOICE_DESCRIPTION_MAX) : "";
    return {
      category: VOICE_CATEGORIES.includes(source.category) ? source.category : "",
      title,
      description,
      step: [1,2,3].includes(Number(source.step)) ? Number(source.step) : 1
    };
  }

  function readVoiceDraftSession(){
    let currentRaw = null;
    let previousRaw = null;
    let legacyRaw = null;
    try{
      currentRaw = sessionStorage.getItem(voiceDraftStorageKey());
      if(!currentRaw) previousRaw = sessionStorage.getItem(previousVoiceDraftStorageKey());
      if(!currentRaw && !previousRaw) legacyRaw = sessionStorage.getItem(LEGACY_VOICE_DRAFT_SESSION_KEY);
    }catch(e){
      return null;
    }

    const parseDraft = raw => {
      if(!raw) return null;
      try{
        return normalizeVoiceDraft(JSON.parse(raw));
      }catch(error){
        return null;
      }
    };

    const current = parseDraft(currentRaw);
    if(current) return current;

    const previous = parseDraft(previousRaw);
    if(previous){
      // Preserve a v2 draft through the schema bump only after the v3 session
      // write succeeds; the old copy remains recoverable on failure.
      if(writeVoiceDraftSession(previous)){
        try{ sessionStorage.removeItem(previousVoiceDraftStorageKey()); }catch(error){}
      }
      return previous;
    }

    const legacy = parseDraft(legacyRaw);
    if(!legacy) return null;

    // Legacy session drafts are migrated only after the scoped write succeeds.
    if(writeVoiceDraftSession(legacy)){
      try{ sessionStorage.removeItem(LEGACY_VOICE_DRAFT_SESSION_KEY); }catch(error){}
    }
    return legacy;
  }

  function writeVoiceDraftSession(draft){
    try{
      sessionStorage.setItem(voiceDraftStorageKey(), JSON.stringify(normalizeVoiceDraft(draft)));
      return true;
    }catch(e){}
    return false;
  }

  function clearVoiceDraftSession(){
    try{
      sessionStorage.removeItem(voiceDraftStorageKey());
      sessionStorage.removeItem(previousVoiceDraftStorageKey());
      sessionStorage.removeItem(LEGACY_VOICE_DRAFT_SESSION_KEY);
    }catch(e){}
  }

  function ensureVoiceState(state){
    state.voiceDraft = normalizeVoiceDraft(state.voiceDraft);
    if(!Array.isArray(state.voiceSubmissions)) state.voiceSubmissions = [];
    state.voiceSubmissionCounter = Number.isInteger(state.voiceSubmissionCounter) && state.voiceSubmissionCounter>=0
      ? state.voiceSubmissionCounter
      : 0;
    if(typeof state.voiceLastSubmissionId!=="string") state.voiceLastSubmissionId = null;
    if(!Array.isArray(state.supportedVoiceIssues)) state.supportedVoiceIssues = [];
    state.supportedVoiceIssues = [...new Set(state.supportedVoiceIssues.filter(id=>typeof id==="string"))];
    if(typeof state.voiceStatusScenario!=="string" || !D.voiceStatusScenarios?.[state.voiceStatusScenario]){
      state.voiceStatusScenario = null;
    }
    if(typeof state.selectedVoiceIssueId!=="string") state.selectedVoiceIssueId = "voice-water-halls";
    const fixtureId = voiceScenarioFixtureId(state);
    const selectedIsPublic = Boolean(findVoiceIssue(state.selectedVoiceIssueId));
    const selectedIsFixture = Boolean(fixtureId && fixtureId.toLowerCase()===state.selectedVoiceIssueId.toLowerCase());
    const selectedIsLocal = state.voiceSubmissions.some(issue=>issue?.id===state.selectedVoiceIssueId);
    if(!selectedIsPublic && !selectedIsFixture && !selectedIsLocal){
      state.selectedVoiceIssueId = "voice-water-halls";
    }
    if(fixtureId) state.selectedVoiceIssueId = fixtureId;
    return state;
  }

  function safeLegacyXpSeed(value){
    if(typeof value === "number" && Number.isFinite(value) && value >= 0) return value;
    // Legacy values are untrusted input. A malformed, negative, string, NaN,
    // or Infinity value must not become a fabricated opening-balance event.
    return null;
  }

  // This prototype-only event stands in for the pre-ledger scalar. Production
  // data migration must use a controlled migration process; this is not a
  // normal XP rule or a fabricated activity history.
  function prototypeOpeningBalanceEvent(amount){
    const ownership = stateOwnershipFields();
    return {
      id: `xp-opening-balance-${ownership.tenantId}-${ownership.membershipId}`,
      tenantId: ownership.tenantId,
      membershipId: ownership.membershipId,
      ruleRef: "prototype-opening-balance",
      amount,
      timestamp: new Date().toISOString(),
      idempotencyKey: "xp:correction:prototype-opening-balance",
      type: "correction",
      sourceType: "prototype-migration",
      sourceId: "pre-ledger-balance",
      sourceAction: "opening-balance",
      reason: "Migrated from the pre-ledger prototype balance.",
      studentLabel: "Starting XP balance",
      studentVisible: false
    };
  }

  function hasPrototypeOpeningBalance(events){
    return Array.isArray(events) && events.some(event => event
      && event.ruleRef === "prototype-opening-balance"
      && event.sourceType === "prototype-migration"
      && event.sourceId === "pre-ledger-balance"
      && event.sourceAction === "opening-balance"
      && validateXpEvent(event).valid
      && event.type === "correction"
      && event.amount > 0);
  }

  function ensureXpLedgerState(state, options={}){
    if(!state || typeof state !== "object" || Array.isArray(state)) return state;
    const currentEvents = Array.isArray(state.xpEvents) ? state.xpEvents.slice() : [];
    const hasScalar = Object.prototype.hasOwnProperty.call(state, "xp");
    const scalarValue = hasScalar ? safeLegacyXpSeed(state.xp) : null;
    const shouldCreateOpening = hasScalar && scalarValue !== null && scalarValue > 0;
    if(shouldCreateOpening){
      // Migration precedence: a usable accepted ledger wins; only a wholly
      // unusable event array may receive one hidden scalar opening event.
      const projection = projectXpLedger({ ...state, xpEvents: currentEvents });
      const hasUsableBalance = projection.acceptedEvents.some(event =>
        (event.type === "award" || event.type === "correction") && event.amount > 0);
      if(!hasUsableBalance && !hasPrototypeOpeningBalance(currentEvents)){
        currentEvents.unshift(prototypeOpeningBalanceEvent(scalarValue));
      }
    }
    state.xpEvents = currentEvents;
    // A scalar may be read only while migrating an older record; it is never
    // retained in the v3 durable shape or used as current XP authority.
    delete state.xp;
    return state;
  }

  function ensureParticipationState(state){
    if(!state || typeof state!=="object") state = {};
    const ownership = stateOwnershipFields();
    state.schemaVersion = ownership.schemaVersion;
    state.tenantId = ownership.tenantId;
    state.membershipId = ownership.membershipId;
    ensureStreakState(state);
    const membershipDefaults = defaultMembership();
    const participationDefaults = defaultParticipation();
    if(!state.membership || typeof state.membership!=="object") state.membership = {};
    if(!state.participation || typeof state.participation!=="object") state.participation = {};

    ensureXpLedgerState(state);
    ensureStudentProgress(state);
    if(!Array.isArray(state.saves)) state.saves = D.saves.slice();
    // Keep the canonical saved Opportunity addressable by entity ID while
    // preserving older records and unrelated legitimate saves.
    state.saves = state.saves.map(item => {
      if(canonicalOpportunitySourceId(item) !== D.opportunity?.id || item?.sourceId === D.opportunity.id) return item;
      return { ...item, sourceId: D.opportunity.id };
    });
    if(typeof state.saveEvent !== "boolean") state.saveEvent = false;
    if(typeof state.saveOpp !== "boolean") state.saveOpp = false;
    if(state.rsvp !== "going" && state.rsvp !== "interested") state.rsvp = null;

    // Notification content is canonical; only the student's read receipts are
    // persisted. Migrate the pre-8O notifsRead shape without clearing state.
    const notificationIds = new Set((Array.isArray(D.notifications) ? D.notifications : [])
      .map(notification => notification?.id)
      .filter(id => typeof id === "string" && id));
    if(!Array.isArray(state.notificationReadIds)){
      const legacyReadIds = Array.isArray(state.notifsRead)
        ? state.notifsRead.filter(id => notificationIds.has(id))
        : [];
      state.notificationReadIds = [...new Set([...notificationDefaultReadIds(), ...legacyReadIds])];
    }
    state.notificationReadIds = [...new Set(state.notificationReadIds.filter(id => notificationIds.has(id)))];
    delete state.notifsRead;

    Object.keys(membershipDefaults).forEach(key=>{
      if(state.membership[key]===undefined || state.membership[key]===null) state.membership[key] = membershipDefaults[key];
    });
    const parsedLevel = Number(state.membership.assuranceLevel);
    state.membership.assuranceLevel = [0,1,2,3].includes(parsedLevel) ? parsedLevel : membershipDefaults.assuranceLevel;
    if(!["active","refresh"].includes(state.membership.status)) state.membership.status = membershipDefaults.status;

    Object.keys(participationDefaults).forEach(key=>{
      if(state.participation[key]===undefined) state.participation[key] = participationDefaults[key];
    });
    const storedScenario = state.participation.demoScenario;
    const migratedScenario = LEGACY_PARTICIPATION_SCENARIO_ALIASES[storedScenario] || storedScenario;
    state.participation.demoScenario = migratedScenario === "normal" || CANONICAL_PARTICIPATION_SCENARIOS[migratedScenario]
      ? migratedScenario
      : "normal";
    if(typeof state.participation.returnTo!=="string") state.participation.returnTo = null;
    if(typeof state.participation.returnAction!=="string") state.participation.returnAction = null;
    ensureVoiceState(state);
    if(!Array.isArray(state.reportedOpportunityIds)) state.reportedOpportunityIds = [];
    state.reportedOpportunityIds = [...new Set(state.reportedOpportunityIds.filter(id => typeof id === "string" && id))];

    if(state.quizParticipation && typeof state.quizParticipation!=="object") state.quizParticipation = null;
    if(state.quizParticipation){
      const record = state.quizParticipation;
      record.quizId = typeof record.quizId === "string" ? record.quizId : null;
      record.tenantDay = typeof record.tenantDay === "string" ? record.tenantDay : null;
      record.optionIndex = Number.isInteger(Number(record.optionIndex)) ? Number(record.optionIndex) : null;
      record.xpAwarded = Number.isFinite(Number(record.xpAwarded)) && Number(record.xpAwarded)>=0 ? Number(record.xpAwarded) : 0;
    }
    if(!state.quizParticipation && state.quizDone===true && Number.isInteger(Number(state.quizChoice))){
      const compatibilityChoice = Number(state.quizChoice);
      if(compatibilityChoice>=0 && compatibilityChoice<(D.quiz.options || []).length){
        state.quizParticipation = {
          quizId:D.quiz.id,
          tenantDay:D.quiz.tenantDay,
          optionIndex:compatibilityChoice,
          xpAwarded:quizAwardForChoice(compatibilityChoice)
        };
      }
    }
    return state;
  }

  function participationState(){
    return loadState();
  }

  function syncStudentTrustState(state=participationState()){
    return assuranceLabel(state?.membership?.assuranceLevel);
  }

  const ASSURANCE_CODES = Object.freeze(["L0", "L1", "L2", "L3"]);
  let lastParticipationDecision = null;

  function cloneParticipationDecision(decision){
    if(!decision) return null;
    if(decision.allowed) return { allowed:true };
    return {
      allowed:false,
      reason: { ...decision.reason }
    };
  }

  function assuranceCode(level){
    if(!Number.isInteger(level) || level<0 || level>3){
      throw new TypeError("Invalid prototype assurance level for canonical participation evaluation.");
    }
    return ASSURANCE_CODES[level];
  }

  function requiredAssuranceFor(resourceContext, options={}){
    if(resourceContext==="poll") return D.poll?.requiredAssurance;
    if(["voice-submission", "voice-support"].includes(resourceContext)){
      return D.demoConfig?.voiceParticipation?.requiredAssurance;
    }
    if(resourceContext==="rsvp"){
      return (options.event || D.featuredEvent)?.requiredAssurance || "L0";
    }
    if(resourceContext==="daily-quiz"){
      return (options.quiz || D.quiz)?.requiredAssurance || "L0";
    }
    throw new TypeError(`Unsupported migrated participation context: ${resourceContext}.`);
  }

  // Adapter only: collect resource facts; the canonical evaluator owns all precedence.
  function buildCanonicalParticipationInput(resourceContext, state=participationState(), options={}){
    const p = state.participation;
    const issue = options.issue || null;
    let moduleEnabled;
    let resourceActionable;
    let audienceEligible;

    if(resourceContext==="poll"){
      moduleEnabled = p.pollModuleEnabled;
      resourceActionable = Boolean(D.poll && D.poll.status==="open" && p.resourceStatus==="active");
      audienceEligible = p.audienceEligible;
    } else if(resourceContext==="voice-submission"){
      moduleEnabled = p.moduleEnabled;
      resourceActionable = true;
      audienceEligible = p.voiceAudienceEligible;
    } else if(resourceContext==="voice-support"){
      moduleEnabled = p.moduleEnabled;
      resourceActionable = Boolean(issue && issue.isPublic);
      audienceEligible = p.voiceAudienceEligible;
    } else if(resourceContext==="rsvp"){
      const event = options.event || D.featuredEvent;
      moduleEnabled = p.rsvpModuleEnabled !== false && event?.rsvpEnabled !== false;
      resourceActionable = Boolean(event && event.rsvpActionable !== false);
      audienceEligible = p.rsvpAudienceEligible !== false && event?.audienceEligible !== false;
    } else if(resourceContext==="daily-quiz"){
      const quiz = options.quiz || D.quiz;
      moduleEnabled = p.quizModuleEnabled !== false && quiz?.moduleEnabled !== false;
      resourceActionable = Boolean(quiz && quiz.available !== false);
      audienceEligible = p.quizAudienceEligible !== false && quiz.audienceEligible !== false;
    } else {
      throw new TypeError(`Unsupported migrated participation context: ${resourceContext}.`);
    }

    return {
      resourceContext,
      tenantLifecycle:p.tenantLifecycle,
      moduleEnabled,
      resourceActionable,
      membershipState:state.membership.status,
      currentAssurance:assuranceCode(state.membership.assuranceLevel),
      requiredAssurance:requiredAssuranceFor(resourceContext, options),
      audienceEligible,
      verifiedAttributesPresent:p.verifiedAttributes,
      storyPrerequisitesMet:p.storyPrerequisites
    };
  }

  function evaluateParticipationAction(resourceContext, options={}){
    const state = options.state || participationState();
    const input = buildCanonicalParticipationInput(resourceContext, state, options);
    const decision = window.CampusHubParticipation.evaluate(input);
    lastParticipationDecision = cloneParticipationDecision(decision);
    return decision;
  }

  let gateTrigger = null;
  let gateFocusAfterClose = null;
  let gateContinuation = null;
  let gateNavigationHash = null;

  function returnRouteHash(resourceContext, returnTo){
    if(isVoiceDetailReturnIntent(returnTo)) return voiceDetailRoute(voiceIssueIdFromReturnIntent(returnTo));
    if(returnTo===VOICE_NEW_RETURN_ROUTE) return "#voice-new";
    if(returnTo===RSVP_RETURN_ROUTE) return `#${RSVP_RETURN_ROUTE}`;
    if(returnTo===QUIZ_RETURN_ROUTE) return `#${QUIZ_RETURN_ROUTE}`;
    if(returnTo===POLL_RETURN_ROUTE) return "#participate";
    return resourceContext === "voice-submission" ? "#voice" : resourceContext === "voice-support" ? "#voice" : resourceContext === "rsvp" ? `#${RSVP_RETURN_ROUTE}` : resourceContext === "daily-quiz" ? `#${QUIZ_RETURN_ROUTE}` : "#participate";
  }

  function isKnownContinuationRoute(returnTo){
    if([POLL_RETURN_ROUTE, RSVP_RETURN_ROUTE, QUIZ_RETURN_ROUTE, VOICE_NEW_RETURN_ROUTE].includes(returnTo)) return true;
    if(!isVoiceDetailReturnIntent(returnTo)) return false;
    const issueId = voiceIssueIdFromReturnIntent(returnTo);
    return Boolean(issueId && getVoiceIssue(issueId));
  }

  function gateAssuranceBody(resourceContext){
    return ({
      poll: "This poll is available to students whose university membership has been matched to the current student roster.",
      "voice-submission": "Raising an issue is available to students whose university membership has been matched to the current student roster.",
      "voice-support": "Supporting an issue is available to students whose university membership has been matched to the current student roster.",
      rsvp: "This RSVP is available to students whose university membership has been matched to the current student roster.",
      "daily-quiz": "The Daily Quiz is available to students whose university membership has been matched to the current student roster."
    })[resourceContext] || "This action is available to students whose university membership has been matched to the current student roster.";
  }

  function gatePresentationForDecision(decision, state, options={}){
    const reason = decision?.reason;
    const resourceContext = reason?.resourceContext;
    const variant = reason?.variant;
    if(!reason || !resourceContext || !variant) throw new TypeError("A denied canonical GateDecision is required for gate presentation.");
    const returnTo = options.returnTo || ({
      poll:POLL_RETURN_ROUTE,
      "voice-submission":VOICE_NEW_RETURN_ROUTE,
      "voice-support":voiceDetailReturnIntent(state.selectedVoiceIssueId || D.voiceIssues[0]?.id),
      rsvp:RSVP_RETURN_ROUTE,
      "daily-quiz":QUIZ_RETURN_ROUTE
    })[resourceContext];
    const base = {
      title:"Participation update",
      currentLabel:"Your current status",
      currentValue:null,
      requiredLabel:"Required",
      requiredValue:null,
      secondary:"Not now",
      action:"navigate",
      navigationHash:returnRouteHash(resourceContext, returnTo)
    };
    if(variant === "assurance-required"){
      return {
        ...base,
        kicker:"Verify your student status",
        title:"Verify your student status",
        reason:gateAssuranceBody(resourceContext),
        currentValue:assuranceLabel(state.membership.assuranceLevel),
        requiredValue:assuranceLabel(ASSURANCE_CODES.indexOf(requiredAssuranceFor(resourceContext, options))),
        primary:"Verify student status",
        action:"verify",
        navigationHash:null
      };
    }
    if(variant === "membership-refresh"){
      return {
        ...base,
        kicker:"Membership needs refreshing",
        title:"Membership needs refreshing",
        reason:"Your roster match is from a previous term. Refresh it to keep taking part.",
        currentLabel:"Membership status",
        currentValue:"Needs refreshing",
        requiredLabel:"Required",
        requiredValue:"Current membership",
        primary:"Refresh membership",
        action:"refresh",
        navigationHash:null
      };
    }
    if(variant === "poll-closed"){
      return {
        ...base,
        kicker:"Poll has closed",
        title:"Poll has closed",
        reason:"This poll closed on 25 May 2026. Results appear once privacy thresholds are met.",
        primary:"See other polls"
      };
    }
    if(variant === "audience-ineligible"){
      return {
        ...base,
        kicker:"Different student group",
        title:"Different student group",
        reason:"This poll is open to a specific student group. Your current membership does not include that group.",
        primary:"See open polls"
      };
    }
    if(variant === "module-unavailable"){
      if(["voice-submission", "voice-support"].includes(resourceContext)){
        return {
          ...base,
          kicker:"Student Voice unavailable",
          title:"Student Voice unavailable",
          reason:"New issues are paused while published issues are reviewed. You can still follow existing issues.",
          primary:"View issues",
          navigationHash:"#voice"
        };
      }
      if(resourceContext === "poll"){
        return {
          ...base,
          kicker:"Poll unavailable",
          title:"Poll unavailable",
          reason:"This poll is not accepting responses right now. You can view other available polls.",
          primary:"See other polls"
        };
      }
      if(resourceContext === "rsvp"){
        return {
          ...base,
          kicker:"RSVP unavailable",
          title:"RSVP unavailable",
          reason:"RSVP is not available for this event right now. You can still view the event details.",
          primary:"Back to event"
        };
      }
      if(resourceContext === "daily-quiz"){
        return {
          ...base,
          kicker:"Daily Quiz unavailable",
          title:"Daily Quiz unavailable",
          reason:"The Daily Quiz is not available right now. You can return to Play and try again later.",
          primary:"Back to Play"
        };
      }
      throw new TypeError(`Unknown resource context for module-unavailable presentation: ${resourceContext}.`);
    }
    if(variant === "tenant-inactive"){
      return {
        ...base,
        kicker:"Participation paused",
        title:"Participation is paused",
        reason:"Participation is temporarily paused for this campus. You can still read campus information.",
        primary:"Back to Participate"
      };
    }
    if(variant === "resource-unavailable"){
      return {
        ...base,
        kicker:"Resource unavailable",
        title:"This resource is unavailable",
        reason:"This action is not available right now. You can continue with other campus information.",
        primary:resourceContext === "voice-support" ? "View issues" : resourceContext === "rsvp" ? "See event" : resourceContext === "daily-quiz" ? "Back to Play" : "See other polls"
      };
    }
    if(variant === "attributes-required"){
      return {
        ...base,
        kicker:"Details need updating",
        title:"Your student details need updating",
        reason:"Some details needed for this action are not available yet. You can continue with other campus information.",
        primary:"Back to Participate"
      };
    }
    if(variant === "prerequisites-unmet"){
      return {
        ...base,
        kicker:"One more step is needed",
        title:"One more step is needed",
        reason:"Please complete the required step before continuing.",
        primary:resourceContext === "daily-quiz" ? "Back to Play" : "Back to Participate"
      };
    }
    throw new TypeError(`No presentation for canonical GateDecision variant: ${variant}.`);
  }

  function openParticipationGate(decision, trigger, options={}){
    const dialog = $('#participationGate');
    if(!dialog) return;
    if(decision?.allowed) return false;
    const state = participationState();
    const resourceContext = decision?.reason?.resourceContext;
    const returnTo = options.returnTo || ({ poll:POLL_RETURN_ROUTE, "voice-submission":VOICE_NEW_RETURN_ROUTE, "voice-support":voiceDetailReturnIntent(state.selectedVoiceIssueId || D.voiceIssues[0]?.id), rsvp:RSVP_RETURN_ROUTE, "daily-quiz":QUIZ_RETURN_ROUTE })[resourceContext];
    if(!isKnownContinuationRoute(returnTo)) throw new TypeError(`Unknown internal participation continuation route: ${returnTo}`);
    const copy = gatePresentationForDecision(decision, state, { ...options, returnTo });
    gateTrigger = trigger || document.activeElement;
    gateFocusAfterClose = null;
    gateContinuation = { returnTo, returnAction: options.returnAction || resourceContext };
    gateNavigationHash = copy.navigationHash;

    $('#participationGateKicker').textContent = copy.kicker;
    $('#participationGateTitle').textContent = copy.title;
    $('#participationGateReason').textContent = copy.reason;
    const stateWrap = $('#participationGateState');
    const currentRow = $('#participationGateCurrentRow');
    const requiredRow = $('#participationGateRequiredRow');
    stateWrap.hidden = !copy.currentValue && !copy.requiredValue;
    currentRow.hidden = !copy.currentValue;
    requiredRow.hidden = !copy.requiredValue;
    if(copy.currentValue){
      $('#participationGateCurrentLabel').textContent = copy.currentLabel;
      $('#participationGateCurrentValue').textContent = copy.currentValue;
    }
    if(copy.requiredValue){
      $('#participationGateRequiredLabel').textContent = copy.requiredLabel;
      $('#participationGateRequiredValue').textContent = copy.requiredValue;
    }
    const primary = $('#participationGatePrimary');
    const secondary = $('#participationGateSecondary');
    primary.textContent = copy.primary;
    primary.dataset.gateAction = copy.action;
    secondary.hidden = !copy.secondary;
    secondary.textContent = copy.secondary || "Not now";

    if(!dialog.open){
      if(typeof dialog.showModal==="function") dialog.showModal();
      else dialog.setAttribute("open", "");
    }
    setTimeout(()=> $('#participationGateTitle')?.focus({preventScroll:true}), 0);
    return true;
  }

  function closeParticipationGate(focusTarget=gateTrigger){
    const dialog = $('#participationGate');
    if(!dialog) return;
    gateFocusAfterClose = focusTarget;
    gateContinuation = null;
    gateNavigationHash = null;
    if(dialog.open && typeof dialog.close==="function") dialog.close();
    else dialog.removeAttribute("open");
  }

  function dismissGateForNavigation(){
    const dialog = $('#participationGate');
    gateTrigger = null;
    gateFocusAfterClose = null;
    gateContinuation = null;
    gateNavigationHash = null;
    if(dialog?.open && typeof dialog.close==="function") dialog.close();
    else dialog?.removeAttribute("open");
  }

  function syncVerificationUi(){
    const state = participationState();
    const level = state.membership.assuranceLevel;
    const membershipRefresh = state.membership.status === "refresh";
    const title = assuranceLabel(level);
    const titleEl = $('[data-field="assuranceTitle"]');
    if(!titleEl) return;

    const descriptions = {
      0: "Your account is registered, but there is no credible proof of current university affiliation yet.",
      1: "Your campus invite or self-declared details show a weak affiliation. A current roster match is needed for higher-assurance participation.",
      2: "Your membership is matched to the current student roster provided by your university.",
      3: "Your roster match is supported by strong institutional proof where a university-configured method is available."
    };
    $('#verificationStatusKicker').textContent = "Current assurance";
    titleEl.textContent = title;
    $('#verificationStatusDescription').textContent = descriptions[level] || descriptions[1];
    const separation = $('#verificationAssuranceSeparation');
    if(separation) separation.textContent = "Assurance is separate from enrolment. Your enrolment status is Current.";

    const refreshBanner = $('#verificationMembershipRefresh');
    if(refreshBanner) refreshBanner.hidden = !membershipRefresh;

    [0,1,2,3].forEach(tierLevel=>{
      const tier = $(`#verificationTierL${tierLevel}`);
      const badge = tier?.querySelector("[data-tier-badge]");
      const current = tier?.querySelector("[data-tier-current]");
      const isCurrent = level===tierLevel;
      tier?.classList.toggle("tier--active", isCurrent);
      if(tier){
        if(isCurrent) tier.setAttribute("aria-current", "step");
        else tier.removeAttribute("aria-current");
      }
      if(badge) badge.textContent = isCurrent ? "✓" : String(tierLevel);
      if(current) current.hidden = !isCurrent;
    });

    const matchBtn = $('#startRosterMatch');
    const matchHelp = $('#rosterMatchHelp');
    const actionSlot = $('#verificationActionSlot');
    const canMatchRoster = membershipRefresh || level===1;
    if(actionSlot) actionSlot.hidden = !canMatchRoster;
    if(matchBtn){
      matchBtn.hidden = !canMatchRoster;
      if(canMatchRoster){
        matchBtn.disabled = false;
        matchBtn.textContent = membershipRefresh ? "Refresh membership" : "Match my student record";
      }
    }
    if(matchHelp){
      matchHelp.hidden = !canMatchRoster;
      if(canMatchRoster) matchHelp.textContent = membershipRefresh
        ? "We will refresh your current membership against the university roster."
        : "We will check your current enrolment against the university roster.";
    }
  }

  function renderPollState(){
    const form = $('#pollForm');
    const btn = $('#submitPoll');
    const success = $('#pollSuccess');
    if(!form || !btn || !success) return;
    hydratePollContent();
    const state = participationState();
    if(state.pollDone){
      form.querySelectorAll('input').forEach(i=> i.disabled=true);
      const input = form.querySelector(`input[value="${state.pollChoice}"]`);
      if(input) input.checked=true;
      btn.disabled = true;
      btn.textContent = "Response recorded";
      success.hidden=false;
      return;
    }
    form.querySelectorAll('input').forEach(i=>{
      i.disabled = false;
      if(state.pollChoice===null) i.checked = false;
    });
    btn.disabled = !form.querySelector('input:checked');
    btn.textContent = "Submit response";
    success.hidden = true;
  }

  function initPoll(){
    const form = $('#pollForm');
    const btn = $('#submitPoll');
    if(!form || !btn) return;
    renderPollState();

    form.addEventListener('change', event=>{
      if(!event.target.matches('input[type="radio"]')) return;
      btn.disabled = !form.querySelector('input:checked');
    });

    btn.addEventListener('click', ()=>{
      const chosen = form.querySelector('input:checked');
      if(!chosen) return;
      const decision = evaluateParticipationAction('poll');
      if(openParticipationGate(decision, btn, {
        returnTo:POLL_RETURN_ROUTE,
        returnAction:'poll-submit'
      })) return;
      const idx = parseInt(chosen.value,10);
      btn.disabled = true;
      btn.textContent = "Submitting…";
      setTimeout(()=>{
        const state = participationState();
        if(state.pollDone){
          renderPollState();
          return;
        }
        state.pollDone = true;
        state.pollChoice = idx;
        const pollXp = Number(D.demoConfig?.xp?.pollParticipation) || 0;
        const pollEvent = appendXpEvent(state, {
          type:"award",
          ruleRef:"poll-participation",
          amount:pollXp,
          idempotencyKey:`xp:award:poll-participation:${D.poll?.id || "poll"}`,
          sourceType:"poll-participation",
          sourceId:D.poll?.id || "poll-restroom-cleanliness",
          sourceAction:"participate",
          tenantDay:D.demoConfig?.calendar?.currentTenantDay,
          studentLabel:"Poll participation"
        });
        if(!pollEvent.added && !["idempotent", "source-duplicate"].includes(pollEvent.reason)){
          persistenceFailure(restored=>{
            hydrateTenant(restored);
            renderXPRules();
            renderPollState();
          });
          return;
        }
        applyStreakQualification("poll-response", state);
        if(!saveState(state)){
          persistenceFailure(restored=>{
            hydrateTenant(restored);
            renderXPRules();
            renderPollState();
          });
          return;
        }
        hydrateTenant(state);
        renderXPRules();
        renderPollState();
        toast("Response recorded. Your individual response remains private.");
      }, 500);
    });
  }

  function applyCanonicalParticipationScenario(name, announce=false){
    const scenario = CANONICAL_PARTICIPATION_SCENARIOS[name];
    if(!scenario) throw new TypeError(`Unknown canonical participation scenario: ${name}`);
    const state = participationState();
    state.membership = { ...defaultMembership(), ...scenario.membership };
    state.participation = { ...defaultParticipation(), ...scenario.participation, demoScenario:name, returnTo:null, returnAction:null };
    state.pollDone = false;
    state.pollChoice = null;
    if(!saveState(state)) return false;
    syncStudentTrustState(state);
    hydrateTenant(state);
    renderPollState();
    syncVerificationUi();
    renderQuiz();
    const success = $('#verificationSuccess');
    if(success) success.hidden = true;
    if(announce) toast(`${name} selected for this prototype.`);
    return true;
  }

  function restoreOriginalParticipationIntent(){
    const state = participationState();
    const returnTo = state.participation.returnTo;
    const returnAction = state.participation.returnAction;
    state.participation.returnTo = null;
    state.participation.returnAction = null;
    if(!saveState(state)){
      persistenceFailure();
      return;
    }
    if(returnTo===POLL_RETURN_ROUTE){
      pendingReturnFocus = true;
      navigateToHash("#participate");
      return;
    }
    if(returnTo===VOICE_NEW_RETURN_ROUTE){
      pendingVoiceComposerFocus = true;
      pendingVoiceComposerAction = returnAction || "voice-composer-entry";
      navigateToHash("#voice-new");
      return;
    }
    if(returnTo===RSVP_RETURN_ROUTE){
      pendingRsvpFocus = true;
      pendingRsvpAction = returnAction || "rsvp";
      navigateToHash(`#${RSVP_RETURN_ROUTE}`);
      return;
    }
    if(returnTo===QUIZ_RETURN_ROUTE){
      pendingQuizFocus = true;
      navigateToHash(`#${QUIZ_RETURN_ROUTE}`);
      return;
    }
    if(isVoiceDetailReturnIntent(returnTo)){
      const issueId = voiceIssueIdFromReturnIntent(returnTo);
      if(getVoiceIssue(issueId)){
        pendingVoiceDetailFocus = true;
        pendingVoiceDetailAction = returnAction || "voice-support";
        navigateToHash(voiceDetailRoute(issueId));
      }
    }
  }

  function startRosterMatch(){
    const state = participationState();
    const refreshing = state.membership.status === "refresh";
    if(!refreshing && state.membership.assuranceLevel!==1) return;
    const button = $('#startRosterMatch');
    const help = $('#rosterMatchHelp');
    if(button){ button.disabled=true; button.textContent=refreshing ? "Refreshing…" : "Checking enrolment…"; }
    if(help){ help.hidden=false; help.textContent=refreshing ? "Refreshing your current membership against the university roster…" : "Checking your current enrolment against the university roster…"; }

    setTimeout(()=>{
      const updated = participationState();
      if(updated.membership.status !== "refresh") updated.membership.assuranceLevel = 2;
      updated.membership.status = "active";
      updated.participation.demoScenario = "normal";
      const returnTo = updated.participation.returnTo;
      const returning = [POLL_RETURN_ROUTE, VOICE_NEW_RETURN_ROUTE, RSVP_RETURN_ROUTE, QUIZ_RETURN_ROUTE].includes(returnTo) || isVoiceDetailReturnIntent(returnTo);
      if(!saveState(updated)){
        const restored = persistenceFailure(state=>{
          hydrateTenant(state);
          syncVerificationUi();
          renderPollState();
          renderQuiz();
        });
        if(button){ button.disabled = false; button.textContent = restored.membership.status === "refresh" ? "Refresh membership" : "Match my student record"; }
        if(help){ help.hidden = false; help.textContent = restored.membership.status === "refresh"
          ? "We will refresh your current membership against the university roster."
          : "We will check your current enrolment against the university roster."; }
        return;
      }
      syncStudentTrustState(updated);
      hydrateTenant(updated);
      renderPollState();
      syncVerificationUi();
      renderQuiz();
      const success = $('#verificationSuccess');
      const detail = $('#verificationSuccessDetail');
      const refreshedCopy = "Your membership has been refreshed. Returning you to the original action…";
      if(detail) detail.textContent = refreshing
        ? (returning ? refreshedCopy : "Your membership has been refreshed.")
        : returnTo===VOICE_NEW_RETURN_ROUTE || isVoiceDetailReturnIntent(returnTo)
        ? "Your university membership now matches the current student roster. Returning you to Student Voice…"
        : returnTo===RSVP_RETURN_ROUTE
          ? "Your university membership now matches the current student roster. Returning you to the event…"
          : returnTo===QUIZ_RETURN_ROUTE
            ? "Your university membership now matches the current student roster. Returning you to the quiz…"
            : returning
          ? "Your university membership now matches the current student roster. Returning you to the poll…"
          : "Your university membership now matches the current student roster.";
      if(success){ success.hidden=false; success.focus({preventScroll:true}); }
      toast(refreshing ? "Membership refreshed." : "Student status confirmed.");
      if(returning) setTimeout(restoreOriginalParticipationIntent, 1100);
    }, 750);
  }

  function initParticipationGate(){
    const initial = participationState();
    saveState(initial);
    syncStudentTrustState(initial);
    syncVerificationUi();

    const dialog = $('#participationGate');
    dialog?.addEventListener('close', ()=>{
      const target = gateFocusAfterClose || gateTrigger;
      gateFocusAfterClose = null;
      gateTrigger = null;
      gateContinuation = null;
      gateNavigationHash = null;
      if(target && document.contains(target)) setTimeout(()=> target.focus({preventScroll:true}), 0);
    });
    document.addEventListener('keydown', event=>{
      if(event.key==="Escape" && dialog?.open){
        event.preventDefault();
        closeParticipationGate();
      }
    });
    $('#participationGatePrimary')?.addEventListener('click', event=>{
      const action = event.currentTarget.dataset.gateAction;
      if(action==="verify" || action==="refresh"){
        const state = participationState();
        state.participation.returnTo = gateContinuation?.returnTo || POLL_RETURN_ROUTE;
        state.participation.returnAction = gateContinuation?.returnAction || null;
        if(!saveState(state)){
          persistenceFailure();
          return;
        }
        dismissGateForNavigation();
        navigateToHash("#verification");
      } else if(action==="navigate"){
        const hash = gateNavigationHash || "#participate";
        dismissGateForNavigation();
        navigateToHash(hash);
      } else {
        closeParticipationGate();
      }
    });
    $('#participationGateSecondary')?.addEventListener('click', ()=> closeParticipationGate());
    $('#startRosterMatch')?.addEventListener('click', startRosterMatch);
  }

  // Student Voice composer — local prototype state only. Submitted issues are not added to the public issue list.
  let voiceComposerStep = 1;
  let voiceSubmitInFlight = false;
  let voiceSubmitTimer = null;

  function voiceHeadingForStep(step=voiceComposerStep){
    return ({
      1: '#voiceCategoryHeading',
      2: '#voiceDetailsHeading',
      3: '#voiceReviewHeading',
      4: '#voiceConfirmationHeading'
    })[step];
  }

  function focusVoiceStepHeading(){
    const heading = $(voiceHeadingForStep());
    if(!heading) return;
    heading.focus({preventScroll:true});
    heading.scrollIntoView({block:"start", behavior:"auto"});
  }

  function setVoiceStatus(message){
    const status = $('#voiceComposerStatus');
    if(status) status.textContent = message;
  }

  function updateVoiceStepper(step){
    $$('.voice-stepper__step').forEach(item=>{
      const itemStep = Number(item.dataset.voiceProgress);
      const current = itemStep===step;
      item.classList.toggle('is-current', current);
      item.classList.toggle('is-complete', itemStep<step);
      if(current) item.setAttribute('aria-current', 'step');
      else item.removeAttribute('aria-current');
    });
  }

  function setVoiceStep(step, options={}){
    const { focus=true, persist=true } = options;
    const nextStep = [1,2,3,4].includes(Number(step)) ? Number(step) : 1;
    voiceComposerStep = nextStep;
    const panels = {
      1: '#voiceStepCategory',
      2: '#voiceStepDetails',
      3: '#voiceStepReview',
      4: '#voiceStepConfirmation'
    };
    Object.entries(panels).forEach(([panelStep, selector])=>{
      const panel = $(selector);
      if(panel) panel.hidden = Number(panelStep)!==nextStep;
    });
    const stepper = $('#voiceStepper');
    if(stepper) stepper.hidden = nextStep===4;
    updateVoiceStepper(nextStep);
    if(nextStep<=3 && persist){
      const state = participationState();
      state.voiceDraft.step = nextStep;
      writeVoiceDraftSession(state.voiceDraft);
    }
    if(nextStep===3) renderVoiceReview();
    if(nextStep===4) renderVoiceConfirmation();
    const labels = {
      1:'Step 1 of 3: Category',
      2:'Step 2 of 3: Issue details',
      3:'Step 3 of 3: Review and submit',
      4:'Issue submitted. Status: Submitted.'
    };
    setVoiceStatus(labels[nextStep]);
    if(focus) setTimeout(focusVoiceStepHeading, 0);
  }

  function clearVoiceError(errorSelector, inputSelector){
    const error = $(errorSelector);
    const input = inputSelector ? $(inputSelector) : null;
    if(error){ error.textContent = ''; error.hidden = true; }
    if(input) input.removeAttribute('aria-invalid');
  }

  function showVoiceError(errorSelector, inputSelector, message){
    const error = $(errorSelector);
    const input = inputSelector ? $(inputSelector) : null;
    if(error){ error.textContent = message; error.hidden = false; }
    if(input) input.setAttribute('aria-invalid', 'true');
  }

  function clearVoiceValidation(){
    clearVoiceError('#voiceCategoryError');
    clearVoiceError('#voiceDetailsError');
    clearVoiceError('#voiceTitleError', '#voiceIssueTitle');
    clearVoiceError('#voiceDescriptionError', '#voiceIssueDescription');
    clearVoiceError('#voiceSubmitError');
  }

  function updateVoiceCategoryContinue(){
    const button = $('#voiceCategoryContinue');
    const selected = $('#voiceComposerForm input[name="voiceCategory"]:checked');
    if(button) button.disabled = !selected;
  }

  function updateVoiceCounters(){
    const title = $('#voiceIssueTitle');
    const description = $('#voiceIssueDescription');
    const titleCount = $('#voiceIssueTitleCount');
    const descriptionCount = $('#voiceIssueDescriptionCount');
    if(titleCount) titleCount.textContent = `${Math.min(title?.value.length || 0, VOICE_TITLE_MAX)} / ${VOICE_TITLE_MAX}`;
    if(descriptionCount) descriptionCount.textContent = `${Math.min(description?.value.length || 0, VOICE_DESCRIPTION_MAX)} / ${VOICE_DESCRIPTION_MAX}`;
  }

  function saveVoiceDraft(){
    const state = participationState();
    const selected = $('#voiceComposerForm input[name="voiceCategory"]:checked');
    const title = $('#voiceIssueTitle');
    const description = $('#voiceIssueDescription');
    state.voiceDraft.category = selected?.value || '';
    state.voiceDraft.title = title?.value || '';
    state.voiceDraft.description = description?.value || '';
    if([1,2,3].includes(voiceComposerStep)) state.voiceDraft.step = voiceComposerStep;
    writeVoiceDraftSession(state.voiceDraft);
    return state.voiceDraft;
  }

  function validateVoiceCategory(){
    const selected = $('#voiceComposerForm input[name="voiceCategory"]:checked');
    if(!selected){
      showVoiceError('#voiceCategoryError', null, 'Choose a category.');
      setVoiceStatus('Choose a category.');
      return false;
    }
    clearVoiceError('#voiceCategoryError');
    saveVoiceDraft();
    return true;
  }

  function validateVoiceDetails(){
    const title = $('#voiceIssueTitle');
    const description = $('#voiceIssueDescription');
    const titleValue = title?.value.trim() || '';
    const descriptionValue = description?.value.trim() || '';
    let valid = true;
    const bothMissing = !titleValue && !descriptionValue;
    if(bothMissing) showVoiceError('#voiceDetailsError', null, 'Add a title and a description.');
    else clearVoiceError('#voiceDetailsError');
    if(!titleValue){
      showVoiceError('#voiceTitleError', '#voiceIssueTitle', 'Add a title.');
      valid = false;
    } else {
      clearVoiceError('#voiceTitleError', '#voiceIssueTitle');
    }
    if(!descriptionValue){
      showVoiceError('#voiceDescriptionError', '#voiceIssueDescription', 'Add a description.');
      valid = false;
    } else {
      clearVoiceError('#voiceDescriptionError', '#voiceIssueDescription');
    }
    saveVoiceDraft();
    if(valid){
      const draft = readVoiceDraftSession() || defaultVoiceDraft();
      draft.title = titleValue;
      draft.description = descriptionValue;
      writeVoiceDraftSession(draft);
    }
    return valid;
  }

  function renderVoiceReview(){
    const draft = participationState().voiceDraft;
    const category = $('#voiceReviewCategory');
    const title = $('#voiceReviewTitle');
    const description = $('#voiceReviewDescription');
    if(category) category.textContent = draft.category || '—';
    if(title) title.textContent = draft.title || '—';
    if(description) description.textContent = draft.description || '—';
  }

  function renderVoiceConfirmation(){
    const state = participationState();
    const submission = state.voiceSubmissions.find(item=>item?.id===state.voiceLastSubmissionId) || state.voiceSubmissions[0];
    const status = $('#voiceConfirmationStatus');
    if(status) status.textContent = submission?.status || 'Submitted';
  }

  function renderVoiceComposer(){
    const form = $('#voiceComposerForm');
    if(!form) return;
    const draft = participationState().voiceDraft;
    form.querySelectorAll('input[name="voiceCategory"]').forEach(input=>{
      input.checked = input.value===draft.category;
    });
    const title = $('#voiceIssueTitle');
    const description = $('#voiceIssueDescription');
    if(title) title.value = draft.title;
    if(description) description.value = draft.description;
    clearVoiceValidation();
    const submitButton = $('#voiceSubmitIssue');
    if(submitButton && !voiceSubmitInFlight){
      submitButton.disabled = false;
      submitButton.textContent = 'Submit issue';
    }
    updateVoiceCounters();
    updateVoiceCategoryContinue();
    setVoiceStep(draft.step, { focus:false, persist:false });
  }

  function resetVoiceDraft(){
    if(voiceSubmitTimer){
      clearTimeout(voiceSubmitTimer);
      voiceSubmitTimer = null;
    }
    voiceSubmitInFlight = false;
    clearVoiceDraftSession();
    voiceComposerStep = 1;
    clearVoiceValidation();
    updateVoiceCounters();
  }

  function cancelVoiceComposer(){
    resetVoiceDraft();
    navigateToHash('#voice');
  }

  function submitVoiceIssue(){
    if(voiceSubmitInFlight) return;
    if(!validateVoiceCategory()){
      setVoiceStep(1);
      return;
    }
    if(!validateVoiceDetails()){
      setVoiceStep(2);
      return;
    }
    const state = participationState();
    const draft = state.voiceDraft;
    const decision = evaluateParticipationAction('voice-submission', { state });
    if(openParticipationGate(decision, $('#voiceSubmitIssue'), {
      returnTo:VOICE_NEW_RETURN_ROUTE,
      returnAction:'voice-submit'
    })){
      saveVoiceDraft();
      setVoiceStep(3, { focus:false, persist:true });
      return;
    }
    const submittedDraft = { ...draft };
    const submitButton = $('#voiceSubmitIssue');
    voiceSubmitInFlight = true;
    clearVoiceError('#voiceSubmitError');
    if(submitButton){
      submitButton.disabled = true;
      submitButton.textContent = 'Submitting…';
    }
    setVoiceStatus('Submitting issue.');
    voiceSubmitTimer = setTimeout(()=>{
      voiceSubmitTimer = null;
      try{
        const currentState = participationState();
        currentState.voiceSubmissionCounter += 1;
        const submission = {
          id:`voice-local-${currentState.voiceSubmissionCounter}`,
          category:submittedDraft.category,
          title:submittedDraft.title,
          description:submittedDraft.description,
          submittedAt:new Date().toISOString(),
          status:'Submitted',
          moderationState:'submitted'
        };
        currentState.voiceSubmissions.unshift(submission);
        currentState.voiceLastSubmissionId = submission.id;
        currentState.voiceDraft = defaultVoiceDraft();
        applyStreakQualification("voice-submission", currentState);
        if(!saveState(currentState)) throw new Error('Unable to persist the Voice submission.');
        clearVoiceDraftSession();
        voiceSubmitInFlight = false;
        setVoiceStep(4);
      }catch(error){
        voiceSubmitInFlight = false;
        writeVoiceDraftSession(submittedDraft);
        const button = $('#voiceSubmitIssue');
        if(button){
          button.disabled = false;
          button.textContent = 'Submit issue';
        }
        showVoiceError('#voiceSubmitError', null, PERSISTENCE_FAILURE_MESSAGE);
        setVoiceStatus('Submission failed. Please try again.');
      }
    }, 120);
  }

  function requestVoiceComposer(trigger){
    const decision = evaluateParticipationAction('voice-submission');
    if(openParticipationGate(decision, trigger, { returnTo:VOICE_NEW_RETURN_ROUTE, returnAction:'voice-composer-entry' })){
      return;
    }
    pendingVoiceComposerFocus = true;
    if(location.hash==='#voice-new') showView('voice-new');
    else navigateToHash('#voice-new');
  }

  function initVoiceComposer(){
    const form = $('#voiceComposerForm');
    if(!form) return;
    form.addEventListener('submit', event=> event.preventDefault());
    form.querySelectorAll('input[name="voiceCategory"]').forEach(input=>{
      input.addEventListener('change', ()=>{
        clearVoiceError('#voiceCategoryError');
        saveVoiceDraft();
        updateVoiceCategoryContinue();
      });
    });
    $('#voiceIssueTitle')?.addEventListener('input', ()=>{
      saveVoiceDraft();
      updateVoiceCounters();
      if($('#voiceIssueTitle').value.trim()) clearVoiceError('#voiceDetailsError');
      if($('#voiceIssueTitle').value.trim()) clearVoiceError('#voiceTitleError', '#voiceIssueTitle');
    });
    $('#voiceIssueDescription')?.addEventListener('input', ()=>{
      saveVoiceDraft();
      updateVoiceCounters();
      if($('#voiceIssueDescription').value.trim()) clearVoiceError('#voiceDetailsError');
      if($('#voiceIssueDescription').value.trim()) clearVoiceError('#voiceDescriptionError', '#voiceIssueDescription');
    });
    $('#voiceCategoryContinue')?.addEventListener('click', ()=>{
      if(validateVoiceCategory()) setVoiceStep(2);
    });
    $('#voiceDetailsBack')?.addEventListener('click', ()=>{
      saveVoiceDraft();
      setVoiceStep(1);
    });
    $('#voiceDetailsCancel')?.addEventListener('click', cancelVoiceComposer);
    $('#voiceDetailsContinue')?.addEventListener('click', ()=>{
      if(validateVoiceDetails()) setVoiceStep(3);
    });
    $('#voiceReviewBack')?.addEventListener('click', ()=>{
      saveVoiceDraft();
      setVoiceStep(2);
    });
    $('#voiceReviewCancel')?.addEventListener('click', cancelVoiceComposer);
    $('#voiceSubmitIssue')?.addEventListener('click', submitVoiceIssue);
    $('#voiceCategoryCancel')?.addEventListener('click', cancelVoiceComposer);
    $('#voiceConfirmationBack')?.addEventListener('click', ()=>{
      const previous = historyStack[historyStack.length - 2] || '';
      if(previous === 'voice' || previous === 'participate') navigateInAppBack();
      else navigateToHash('#voice');
    });
  }

  // Navigation (hash routing)
  const views = ["home","discover","participate","play","me","verification","notifications","event","opportunity","voice","voice-new","voice-detail","privacy","sports","news"];
  const primaryTabs = ["home","discover","participate","play","me"];
  const parentPrimaryTabs = Object.freeze({
    event: "discover",
    opportunity: "discover",
    sports: "discover",
    voice: "participate",
    "voice-new": "participate",
    "voice-detail": "participate",
    news: "discover",
    verification: "me",
    privacy: "me",
    notifications: "home"
  });
  let pendingReturnFocus = false;
  let pendingVoiceComposerFocus = false;
  let pendingVoiceComposerAction = null;
  let pendingVoiceDetailFocus = false;
  let pendingVoiceDetailAction = null;
  let pendingRsvpFocus = false;
  let pendingRsvpAction = null;
  let pendingQuizFocus = false;
  let pendingVerificationFocus = false;
  let pendingPrivacyFocus = false;
  let pendingNotificationsFocus = false;
  let pendingOpportunityDetailFocus = false;
  let pendingNewsDetailFocus = false;
  let pendingSportsDetailFocus = false;
  let pendingEventDetailFocus = false;
  let pendingDiscoverSearchFocus = false;
  let pendingDiscoverFilterFocus = false;
  let hasPresentedInitialView = false;

  function showView(name){
    const target = views.includes(name) ? name : "home";
    if(target === "home" || target === "play") hydrateTenant(participationState());
    else syncStreakPresentation(participationState());
    // hide all
    views.forEach(v=>{
      const el = document.getElementById(`view-${v}`);
      if(el){
        const active = v===target;
        el.hidden = !active;
        el.classList.toggle('is-active', active);
        if(active){
          el.setAttribute('tabindex','-1');
        }
      }
    });
    if(target==="voice-new") renderVoiceComposer();
    if(target==="voice-detail") renderVoiceDetail();
    if(target==="verification") syncVerificationUi();
    if(target==="notifications") renderNotifications();
    if(target==="me") renderMe(participationState());
    // Secondary screens inherit the active primary destination.
    const primary = primaryTabs.includes(target) ? target : (parentPrimaryTabs[target] || null);
    $$('.nav-item').forEach(a=>{
      const nav = a.getAttribute('data-nav');
      if(primary && nav===primary){
        a.setAttribute('aria-current','page');
      } else {
        a.removeAttribute('aria-current');
      }
    });
    $('#notifBtn')?.classList.toggle('home-bell-target', target === "home");
    // search visibility
    const searchWrap = $('#searchWrap');
    if(["home","discover"].includes(target)){
      searchWrap.style.display = "flex";
      if(target==="home"){
        $('#globalSearch').placeholder = "Search news, events, opportunities...";
      } else {
        $('#globalSearch').placeholder = "Search news, events, opportunities, sports...";
        renderDiscover();
      }
    } else {
      searchWrap.style.display = "none";
    }
    // scroll top
    window.scrollTo({top:0, behavior:'auto'});
    const main = $('#main');
    if(target==="participate" && pendingReturnFocus){
      pendingReturnFocus = false;
      setTimeout(()=>{
        const pollOption = $('#pollForm input[type="radio"]:not(:disabled)') || $('#pollForm input[type="radio"]');
        if(pollOption) pollOption.focus({preventScroll:true});
      }, 60);
    } else if(target==="verification" && pendingVerificationFocus){
      pendingVerificationFocus = false;
      setTimeout(focusVerificationTitle, 60);
    } else if(target==="privacy" && pendingPrivacyFocus){
      pendingPrivacyFocus = false;
      setTimeout(focusPrivacyTitle, 60);
    } else if(target==="notifications" && pendingNotificationsFocus){
      pendingNotificationsFocus = false;
      setTimeout(focusNotificationsTitle, 60);
    } else if(target==="opportunity" && pendingOpportunityDetailFocus){
      pendingOpportunityDetailFocus = false;
      setTimeout(focusOpportunityDetailTitle, 60);
    } else if(target==="voice-new" && pendingVoiceComposerFocus){
      pendingVoiceComposerFocus = false;
      const action = pendingVoiceComposerAction;
      pendingVoiceComposerAction = null;
      setTimeout(()=>{
        if(action === "voice-submit") $('#voiceSubmitIssue')?.focus({preventScroll:true});
        else focusVoiceStepHeading();
      }, 60);
    } else if(target==="voice-detail" && pendingVoiceDetailFocus){
      pendingVoiceDetailFocus = false;
      const action = pendingVoiceDetailAction;
      pendingVoiceDetailAction = null;
      setTimeout(()=> action === "voice-support" ? $('#voiceSupportButton')?.focus({preventScroll:true}) : focusVoiceDetailTitle(), 60);
    } else if(target==="event" && pendingRsvpFocus){
      pendingRsvpFocus = false;
      pendingEventDetailFocus = false;
      const action = pendingRsvpAction;
      pendingRsvpAction = null;
      setTimeout(()=> $(action === "rsvp-interested" ? '#rsvpInterested' : '#rsvpGoing')?.focus({preventScroll:true}), 60);
    } else if(target==="play" && pendingQuizFocus){
      pendingQuizFocus = false;
      setTimeout(()=> $('#quizSubmit')?.focus({preventScroll:true}), 60);
    } else if(target==="news" && pendingNewsDetailFocus){
      pendingNewsDetailFocus = false;
      setTimeout(focusNewsDetailTitle, 60);
    } else if(target==="sports" && pendingSportsDetailFocus){
      pendingSportsDetailFocus = false;
      setTimeout(focusSportsDetailTitle, 60);
    } else if(target==="event" && pendingEventDetailFocus){
      pendingEventDetailFocus = false;
      setTimeout(focusEventDetailTitle, 60);
    } else if(target==="discover" && (pendingDiscoverSearchFocus || pendingDiscoverFilterFocus)) {
      const focusSearch = pendingDiscoverSearchFocus;
      pendingDiscoverSearchFocus = false;
      pendingDiscoverFilterFocus = false;
      if(focusSearch){
        $('#globalSearch')?.focus({preventScroll:true});
      } else {
        const activeFilter = $('#discoverFilters .filter-chip[aria-pressed="true"]');
        activeFilter?.scrollIntoView({block:'nearest', inline:'nearest'});
        activeFilter?.focus({preventScroll:true});
      }
    } else if(main && hasPresentedInitialView) {
      main.focus({preventScroll:true});
    }

    hasPresentedInitialView = true;

    // analytics-like: no op
  }

  function handleHash(){
    const route = parseHashRoute();
    const rawPath = String(location.hash || "").replace(/^#/, "").trim();
    const normalizedPath = rawPath.toLowerCase();
    const legacyTarget = LEGACY_DETAIL_ALIASES[normalizedPath];
    if(legacyTarget){
      history.replaceState(null, "", `#${legacyTarget}`);
      replaceCurrentHistoryRoute(legacyTarget);
      handleHash();
      return;
    }

    if(route.kind==="detail"){
      if(!route.entity){
        if(route.definition.view === "news"){
          clearPublicationEntity();
          pendingNewsDetailFocus = false;
        }
        const fallback = route.definition.parent === "participate" ? "#voice" : "#discover";
        history.replaceState(null, "", fallback);
        replaceCurrentHistoryRoute(fallback);
        showView(route.definition.parent === "participate" ? "voice" : "discover");
        return;
      }
      if(route.definition.view === "event"){
        renderEventEntity(route.entity);
        // RSVP continuation restores focus to the attempted action; normal
        // route entry moves focus to the canonical Event heading instead.
        pendingEventDetailFocus = !pendingRsvpFocus;
      }
      if(route.definition.view === "opportunity"){
        renderOpportunityEntity(route.entity);
        pendingOpportunityDetailFocus = true;
      }
      if(route.definition.view === "sports"){
        renderSportsEntity(route.entity);
        pendingSportsDetailFocus = true;
      }
      if(route.definition.view === "news"){
        renderPublicationEntity(route.entity);
        pendingNewsDetailFocus = true;
      }
      if(route.definition.view === "voice-detail"){
        if(!selectVoiceIssue(route.entity.id)){
          history.replaceState(null, "", "#voice");
          replaceCurrentHistoryRoute("voice");
          showView("voice");
          return;
        }
        pendingVoiceDetailFocus = true;
      }
      showView(route.definition.view);
      return;
    }

    const h = route.view || "home";
    if(h==="voice-new"){
      const decision = evaluateParticipationAction('voice-submission');
      if(openParticipationGate(decision, $('#voiceNewBtn') || document.body, {
          returnTo:VOICE_NEW_RETURN_ROUTE,
          returnAction:'voice-composer-entry'
        })){
        history.replaceState(null, '', '#participate');
        replaceCurrentHistoryRoute('participate');
        showView('participate');
        return;
      }
      pendingVoiceComposerFocus = true;
    }
    if(h==="verification") pendingVerificationFocus = true;
    if(h==="privacy") pendingPrivacyFocus = true;
    if(h==="notifications") pendingNotificationsFocus = true;
    showView(h);
  }

  // Save toggles
  function initSavesToggles(){
    const s1 = $('#eventSave');
    const s2 = $('#oppSave');
    if(!s1 || !s2) return;
    function reflect(btn, key, state){
      const on = !!state[key];
      btn.setAttribute('aria-pressed', on ? 'true':'false');
      btn.textContent = on ? 'Saved ✓' : 'Save';
      if(on) { btn.classList.add('is-saved'); } else { btn.classList.remove('is-saved'); }
    }
    const initialState = participationState();
    reflect(s1,'saveEvent', initialState);
    reflect(s2,'saveOpp', initialState);
    s1.addEventListener('click', ()=>{
      const state = participationState();
      state.saveEvent = !state.saveEvent;
      state.saves = savedItems(state);
      if(state.saveEvent){
        if(!state.saves.some(item => saveRecordMatches(item, "event"))){
          state.saves.unshift({id:'evt1', type:'Event', title:D.featuredEvent.title, meta: `${D.featuredEvent.date} • ${D.featuredEvent.venue}`});
        }
      } else {
        state.saves = state.saves.filter(item => !saveRecordMatches(item, "event"));
      }
      if(!saveState(state)){
        persistenceFailure(restored=> reflect(s1,'saveEvent', restored));
        return;
      }
      reflect(s1,'saveEvent', state);
      renderMe(state);
      toast(state.saveEvent ? "Saved." : "Removed from saves.");
    });
    s2.addEventListener('click', ()=>{
      const state = participationState();
      state.saveOpp = !state.saveOpp;
      state.saves = savedItems(state);
      if(state.saveOpp){
        if(!state.saves.some(item => saveRecordMatches(item, "opportunity"))){
          state.saves.unshift({id:'opp1', sourceId:D.opportunity.id, type:'Opportunity', title:D.opportunity.title, meta: D.opportunity.deadline});
        }
      } else {
        state.saves = state.saves.filter(item => !saveRecordMatches(item, "opportunity"));
      }
      if(!saveState(state)){
        persistenceFailure(restored=> reflect(s2,'saveOpp', restored));
        return;
      }
      reflect(s2,'saveOpp', state);
      renderMe(state);
      toast(state.saveOpp ? "Saved." : "Removed from saves.");
    });
  }

  // Opportunity external destinations use their own native dialog so the
  // provider URL is never opened before the student sees the leave-campus copy.
  function initLeaveCampusHubFlow(){
    const dialog = $('#leaveCampusHubDialog');
    const apply = $('#oppApply');
    const continueLink = $('#leaveCampusHubContinue');
    const stay = $('#leaveCampusHubStay');
    const report = $('#oppReport');
    const title = $('#leaveCampusHubTitle');
    if(!dialog) return;

    let applyTrigger = null;

    const restoreFocus = () => {
      const target = applyTrigger;
      applyTrigger = null;
      if(target && document.contains(target) && !target.hidden){
        setTimeout(()=> target.focus({preventScroll:true}), 0);
      }
    };

    const closeDialog = () => {
      if(dialog.open && typeof dialog.close === "function") dialog.close();
      else {
        dialog.removeAttribute("open");
        restoreFocus();
      }
    };

    apply?.addEventListener('click', event=>{
      event.preventDefault();
      const opportunity = D.opportunity;
      const policy = evaluateOpportunityAction(opportunity, participationState());
      if(!policy.allowed){
        renderOpportunityEntity(opportunity);
        return;
      }
      applyTrigger = event.currentTarget;
      continueLink.href = opportunity.externalUrl;
      continueLink.target = "_blank";
      continueLink.rel = "noopener noreferrer";
      if(!dialog.open){
        if(typeof dialog.showModal === "function") dialog.showModal();
        else dialog.setAttribute("open", "");
      }
      setTimeout(()=> title?.focus({preventScroll:true}), 0);
    });

    continueLink?.addEventListener('click', event=>{
      // Keep the validated destination on the dedicated anchor; the browser
      // owns opening it in a new tab and applies noopener protection.
      const opportunity = D.opportunity;
      const policy = evaluateOpportunityAction(opportunity, participationState());
      if(!policy.allowed){
        event.preventDefault();
        closeDialog();
        renderOpportunityEntity(opportunity);
        return;
      }
      continueLink.href = opportunity.externalUrl;
      continueLink.target = "_blank";
      continueLink.rel = "noopener noreferrer";
    });
    stay?.addEventListener('click', closeDialog);
    dialog.addEventListener('close', restoreFocus);
    dialog.addEventListener('cancel', ()=>{
      // Native cancel semantics close the dialog; the close listener restores focus.
    });

    report?.addEventListener('click', ()=>{
      const opportunity = D.opportunity;
      const state = participationState();
      if(state.reportedOpportunityIds.includes(opportunity.id)){
        syncOpportunityReportButton(opportunity);
        return;
      }
      state.reportedOpportunityIds.push(opportunity.id);
      if(!saveState(state)){
        persistenceFailure(restored=> syncOpportunityReportButton(opportunity));
        return;
      }
      syncOpportunityReportButton(opportunity);
      toast("Report received. The Guild office reviews every report.");
    });
  }

  // RSVP
  function initRSVP(){
    const going = $('#rsvpGoing');
    const inter = $('#rsvpInterested');
    const meta = $('#rsvpState');
    let state = participationState();
    const event = D.featuredEvent;
    function reflect(){
      const goingSelected = state.rsvp==='going';
      const interestedSelected = state.rsvp==='interested';
      going.setAttribute('aria-pressed', goingSelected ? 'true' : 'false');
      inter.setAttribute('aria-pressed', interestedSelected ? 'true' : 'false');
      if(state.rsvp==='going'){
        going.classList.add('btn--primary'); going.classList.remove('btn'); going.textContent="Going ✓";
        inter.classList.remove('btn--primary'); inter.classList.add('btn'); inter.textContent="Interested";
        meta.style.display='block'; meta.textContent='You are going — reminder will appear in notifications.';
        meta.style.color='var(--brand)';
      } else if(state.rsvp==='interested'){
        inter.classList.add('btn--primary'); inter.textContent="Interested ✓";
        going.classList.remove('btn--primary'); going.textContent="Going";
        meta.style.display='block'; meta.textContent='Marked as interested — we will remind you before it starts.';
        meta.style.color='var(--text-muted)';
      } else {
        going.classList.add('btn--primary'); going.textContent="Going";
        inter.classList.remove('btn--primary'); inter.textContent="Interested";
        meta.style.display='none';
      }
    }
    reflect();
    function attemptRsvp(trigger, nextState, successMessage){
      const currentState = participationState();
      const decision = evaluateParticipationAction('rsvp', { state:currentState, event });
      if(openParticipationGate(decision, trigger, {
        returnTo:RSVP_RETURN_ROUTE,
        returnAction:trigger?.id === 'rsvpInterested' ? 'rsvp-interested' : 'rsvp-going'
      })) return;
      currentState.rsvp = nextState;
      if(nextState === 'going' || nextState === 'interested'){
        applyStreakQualification("event-rsvp", currentState);
        const eventRsvpXp = Number(D.demoConfig?.xp?.eventRsvp);
        const rsvpAward = appendXpEvent(currentState, {
          type:"award",
          ruleRef:"event-rsvp",
          amount:eventRsvpXp,
          idempotencyKey:`xp:award:event-rsvp:${event.id}`,
          sourceType:"event-rsvp",
          sourceId:event.id,
          sourceAction:"rsvp",
          tenantDay:D.demoConfig?.calendar?.currentTenantDay,
          studentLabel:"Event RSVP",
          studentVisible:true
        });
        if(!rsvpAward.added && !["idempotent", "source-duplicate"].includes(rsvpAward.reason)){
          persistenceFailure(restored=>{
            state = restored;
            syncStreakPresentation(restored);
            renderMe(restored);
            reflect();
          });
          return;
        }
      }
      if(!saveState(currentState)){
        persistenceFailure(restored=>{
          state = restored;
          syncStreakPresentation(restored);
          renderMe(restored);
          reflect();
        });
        return;
      }
      state = currentState;
      syncStreakPresentation(currentState);
      reflect();
      renderMe(currentState);
      toast(successMessage);
    }
    going.addEventListener('click', eventTrigger=>{
      const currentState = participationState();
      if(currentState.rsvp==='going'){
        attemptRsvp(eventTrigger.currentTarget, null, "RSVP cleared.");
      } else {
        attemptRsvp(eventTrigger.currentTarget, 'going', "You're on the list.");
      }
    });
    inter.addEventListener('click', eventTrigger=>{
      const currentState = participationState();
      if(currentState.rsvp==='interested'){
        attemptRsvp(eventTrigger.currentTarget, null, "RSVP cleared.");
      } else {
        attemptRsvp(eventTrigger.currentTarget, 'interested', "Marked as interested.");
      }
    });
  }

  // Search
  function initSearch(){
    const input = $('#globalSearch');
    const filterButton = $('#searchFilterBtn');
    const list = $('#discoverList');
    if(!input) return;
    const update = ()=>{
      const isDiscover = !$('#view-discover').hidden;
      const q = input.value;
      if(isDiscover){
        updateDiscoverSearchState({ query:q });
      } else {
        if(normalizeDiscoverQuery(q)){
          discoverSearchState.filter = "All";
          discoverSearchState.query = q;
          pendingDiscoverSearchFocus = true;
          pendingDiscoverFilterFocus = false;
          navigateToHash("#discover");
        } else {
          discoverSearchState.query = q;
        }
      }
    };
    input.addEventListener('input', update);
    input.addEventListener('keydown', (e)=>{
      if(e.key==='Enter'){
        e.preventDefault();
        update();
      }
    });
    $$('#discoverFilters .filter-chip').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        updateDiscoverSearchState({ filter:btn.getAttribute('data-filter'), query:input.value });
      });
    });
    list?.addEventListener('click', event=>{
      if(event.target.closest('#discoverClearSearch')){
        discoverSearchState.query = "";
        renderDiscover();
        input.focus({preventScroll:true});
        return;
      }
      if(event.target.closest('#discoverTryAgain')){
        discoverSystemState = "ready";
        renderDiscover();
        input.focus({preventScroll:true});
      }
    });
    filterButton?.addEventListener('click', ()=>{
      discoverSearchState.query = input.value;
      if(!$('#view-discover').hidden){
        renderDiscover();
        const activeFilter = $('#discoverFilters .filter-chip[aria-pressed="true"]');
        activeFilter?.scrollIntoView({block:'nearest', inline:'nearest'});
        activeFilter?.focus({preventScroll:true});
        return;
      }
      discoverSearchState.filter = "All";
      pendingDiscoverSearchFocus = false;
      pendingDiscoverFilterFocus = true;
      navigateToHash("#discover");
    });
  }

  function debounce(fn, ms){ let t; return (...a)=>{ clearTimeout(t); t=setTimeout(()=>fn(...a), ms); }; }

  // Segmented
  function initParticipateTabs(){
    const tabs = [$('#seg-polls'), $('#seg-voice')];
    const panes = [$('#pane-polls'), $('#pane-voice')];
    if(tabs.some(tab=>!tab) || panes.some(pane=>!pane)) return;

    function activateTab(index, { focus=false }={}){
      const activeIndex = (index + tabs.length) % tabs.length;
      tabs.forEach((tab, tabIndex)=>{
        const active = tabIndex===activeIndex;
        tab.setAttribute('aria-selected', active ? 'true' : 'false');
        tab.tabIndex = active ? 0 : -1;
        panes[tabIndex].hidden = !active;
      });
      if(focus) tabs[activeIndex].focus({preventScroll:true});
    }

    tabs.forEach((tab, index)=>{
      tab.addEventListener('click', ()=> activateTab(index));
      tab.addEventListener('keydown', event=>{
        let nextIndex = null;
        if(event.key==='ArrowRight') nextIndex = index + 1;
        if(event.key==='ArrowLeft') nextIndex = index - 1;
        if(event.key==='Home') nextIndex = 0;
        if(event.key==='End') nextIndex = tabs.length - 1;
        if(nextIndex===null) return;
        event.preventDefault();
        activateTab(nextIndex, { focus:true });
      });
    });

    const initialIndex = tabs.findIndex(tab=>tab.getAttribute('aria-selected')==='true');
    activateTab(initialIndex >= 0 ? initialIndex : 0);
    // deep link ?voice
    if(location.hash==="#participate-voice"){
      location.hash="#participate";
      setTimeout(()=> activateTab(1),0);
    }
  }

  // Back buttons. The stack is the app's compact in-memory route history;
  // browser Back/Forward remains authoritative when no in-app intent is set.
  let historyStack = ["home"];
  let pendingHistoryIntent = null;
  function routeHistoryPath(){
    return String(location.hash || "").replace(/^#/, "").trim() || "home";
  }

  function sameHistoryRoute(left, right){
    return String(left || "").toLowerCase() === String(right || "").toLowerCase();
  }

  function setRouteHash(hash, intent="forward"){
    const next = String(hash || "#home").startsWith("#") ? String(hash || "#home") : `#${hash}`;
    const nextPath = next.replace(/^#/, "").trim() || "home";
    if(sameHistoryRoute(routeHistoryPath(), nextPath)){
      pendingHistoryIntent = null;
      return false;
    }
    pendingHistoryIntent = intent;
    location.hash = next;
    return true;
  }

  function navigateToHash(hash){
    return setRouteHash(hash, "forward");
  }

  function replaceCurrentHistoryRoute(path){
    const next = String(path || "home").replace(/^#/, "") || "home";
    if(!historyStack.length) historyStack = [next];
    else historyStack[historyStack.length - 1] = next;
    for(let index=historyStack.length-2; index>=0; index--){
      if(sameHistoryRoute(historyStack[index], next)){
        historyStack = historyStack.slice(0, index + 1);
        break;
      }
    }
  }

  function navigateInAppBack(){
    const current = routeHistoryPath();
    const currentIndex = historyStack.length - 1;
    if(currentIndex > 0 && sameHistoryRoute(historyStack[currentIndex], current)){
      setRouteHash(`#${historyStack[currentIndex - 1]}`, "back");
      return;
    }
    const existingIndex = historyStack.findIndex(path => sameHistoryRoute(path, current));
    if(existingIndex > 0){
      setRouteHash(`#${historyStack[existingIndex - 1]}`, "back");
      return;
    }
    setRouteHash("#home", "back");
  }

  // Skip navigation is document-local, not an application route. Keep the
  // semantic anchor for keyboard/native link behaviour, but prevent its
  // fragment from reaching the hash router and focus the real main landmark.
  function initSkipNavigation(){
    const skipLink = $('.skip-link');
    const main = $('#main');
    if(!skipLink || !main) return;
    skipLink.addEventListener('click', event=>{
      event.preventDefault();
      main.focus({preventScroll:false});
    });
  }

  function initBack(){
    const initialPath = routeHistoryPath();
    const initialRoute = parseHashRoute();
    const initialParent = initialRoute.kind === "detail" ? initialRoute.definition?.parent : null;
    historyStack = initialParent && initialParent !== initialPath
      ? [initialParent, initialPath]
      : [initialPath];
    $$('[data-back]').forEach(b=> b.addEventListener('click', navigateInAppBack));
    // Mark normal in-app anchor navigation as forward intent. Browser
    // Back/Forward and direct hash entry arrive without this marker.
    document.addEventListener('click', event=>{
      const link = event.target.closest?.('a[href^="#"]');
      if(link && !link.matches('.skip-link') && link.getAttribute('href') !== '#') pendingHistoryIntent = 'forward';
    }, true);
    window.addEventListener('hashchange', ()=>{
      const h = routeHistoryPath();
      const intent = pendingHistoryIntent;
      pendingHistoryIntent = null;
      const current = historyStack[historyStack.length - 1];
      if(intent === 'back'){
        if(historyStack.length > 1) historyStack.pop();
        else {
          const existingIndex = historyStack.findIndex(path => sameHistoryRoute(path, h));
          if(existingIndex >= 0) historyStack = historyStack.slice(0, existingIndex + 1);
        }
      } else if(intent === 'forward'){
        if(!sameHistoryRoute(current, h)){
          historyStack.push(h);
          if(historyStack.length>20) historyStack.shift();
        }
      } else {
        // Browser Back/Forward (or a direct hash navigation) has no app
        // intent. Returning to a known route truncates the stack; a new route
        // is appended. This avoids duplicating the immediate browser Back.
        const existingIndex = historyStack.findIndex(path => sameHistoryRoute(path, h));
        if(existingIndex >= 0 && existingIndex < historyStack.length - 1){
          historyStack = historyStack.slice(0, existingIndex + 1);
        } else if(!sameHistoryRoute(current, h)) {
          historyStack.push(h);
          if(historyStack.length>20) historyStack.shift();
        }
      }
      handleHash();
    });
  }

  // Toast
  function toast(msg){
    const wrap = $('#toastWrap');
    const t = document.createElement('div');
    t.className='toast';
    t.setAttribute('role','status');
    t.innerHTML = `<span aria-hidden="true" style="flex:0 0 auto; width:22px; height:22px; border-radius:999px; background:rgba(255,255,255,.18); display:grid; place-items:center;">✓</span><span>${escapeHtml(msg)}</span>`;
    wrap.appendChild(t);
    setTimeout(()=> { t.style.opacity='0'; t.style.transform='translateY(4px)'; t.style.transition='all .25s'; }, 2600);
    setTimeout(()=> t.remove(), 3000);
  }

  function persistenceFailure(render){
    const restored = participationState();
    if(typeof render === "function") render(restored);
    toast(PERSISTENCE_FAILURE_MESSAGE);
    return restored;
  }

  // State
  function quizAwardForChoice(choice, quiz=D.quiz){
    const participationXp = Number(quiz?.xpParticipation) || 5;
    const accuracyXp = Number(quiz?.xpBonus) || 5;
    return Number(choice)===Number(quiz?.correctIndex) ? participationXp + accuracyXp : participationXp;
  }

  const XP_EVENT_TYPES = Object.freeze(["award", "reversal", "correction", "capped_award"]);
  const XP_EVENT_ALLOWED_FIELDS = Object.freeze([
    "id", "tenantId", "membershipId", "ruleRef", "amount", "timestamp",
    "idempotencyKey", "type", "sourceType", "sourceId", "sourceAction",
    "studentLabel", "studentVisible", "tenantDay", "reason", "referencesEventId"
  ]);
  const XP_EVENT_INTENT_FIELDS = Object.freeze([
    "tenantId", "membershipId", "type", "ruleRef", "amount", "sourceType",
    "sourceId", "sourceAction", "tenantDay", "reason", "referencesEventId",
    "studentVisible"
  ]);

  function xpEventTimestampIsUtc(value){
    if(typeof value !== "string" || !value.endsWith("Z")) return false;
    const parsed = new Date(value);
    return !Number.isNaN(parsed.getTime());
  }

  function xpEventSourceIdentity(event){
    if(!event || typeof event !== "object") return "";
    return [event.tenantId, event.membershipId, event.ruleRef, event.sourceType, event.sourceId, event.sourceAction].join("\u001f");
  }

  function xpEventIsBalanceAffecting(event){
    return Boolean(event && typeof event === "object"
      && (event.type === "award" || event.type === "correction" || event.type === "reversal")
      && Number.isFinite(event.amount)
      && event.amount !== 0);
  }

  // JSON persistence gives us plain values, but this stable serializer also
  // keeps diagnostics and projection selection deterministic for hand-edited
  // records and test fixtures without depending on insertion order.
  function stableXpJson(value, stack=[]){
    if(value === null) return "null";
    if(typeof value === "string" || typeof value === "number" || typeof value === "boolean"){
      const encoded = JSON.stringify(value);
      return encoded === undefined ? String(value) : encoded;
    }
    if(typeof value === "undefined") return "undefined";
    if(typeof value !== "object") return JSON.stringify(String(value));
    if(stack.includes(value)) return '"[Circular]"';
    const nextStack = stack.concat(value);
    if(Array.isArray(value)) return `[${value.map(item => stableXpJson(item, nextStack)).join(",")}]`;
    return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${stableXpJson(value[key], nextStack)}`).join(",")}}`;
  }

  function xpEventStableKey(event){
    return stableXpJson(event);
  }

  function xpEventIntent(event){
    const intent = {};
    XP_EVENT_INTENT_FIELDS.forEach(key => {
      if(key === "tenantDay" || key === "reason" || key === "referencesEventId"){
        intent[key] = event?.[key] === undefined ? null : event[key];
      } else if(key === "studentVisible"){
        intent[key] = event?.[key] === undefined ? event?.type !== "capped_award" : event[key];
      } else {
        intent[key] = event?.[key];
      }
    });
    return stableXpJson(intent);
  }

  function xpEventHasUnknownFields(event){
    if(!event || typeof event !== "object" || Array.isArray(event)) return false;
    return Object.keys(event).some(key => !XP_EVENT_ALLOWED_FIELDS.includes(key));
  }

  function validateXpEvent(event, options={}){
    const requireOwnership = options.requireOwnership !== false;
    if(!event || typeof event !== "object" || Array.isArray(event)) return { valid:false, code:"INVALID_EVENT" };
    if(xpEventHasUnknownFields(event)) return { valid:false, code:"UNKNOWN_EVENT_FIELD" };
    const requiredStrings = ["id", "ruleRef", "timestamp", "idempotencyKey", "type", "sourceType", "sourceId", "sourceAction"];
    if(requiredStrings.some(key => typeof event[key] !== "string" || !event[key].trim())) return { valid:false, code:"INVALID_EVENT_FIELDS" };
    if(typeof event.tenantId !== "string" || !event.tenantId.trim()
      || typeof event.membershipId !== "string" || !event.membershipId.trim()) return { valid:false, code:"INVALID_OWNERSHIP" };
    if(!Number.isFinite(event.amount)) return { valid:false, code:"INVALID_AMOUNT" };
    if(!XP_EVENT_TYPES.includes(event.type)) return { valid:false, code:"INVALID_TYPE" };
    if(!xpEventTimestampIsUtc(event.timestamp)) return { valid:false, code:"INVALID_TIMESTAMP" };
    if(requireOwnership){
      const ownership = stateOwnershipFields();
      if(event.tenantId !== ownership.tenantId || event.membershipId !== ownership.membershipId){
        return { valid:false, code:"OWNERSHIP_MISMATCH" };
      }
    }
    if(event.type === "award" && !(event.amount > 0)) return { valid:false, code:"INVALID_AWARD_AMOUNT" };
    if(event.type === "correction" && !(event.amount > 0)) return { valid:false, code:"INVALID_CORRECTION_AMOUNT" };
    if(event.type === "reversal" && !(event.amount < 0)) return { valid:false, code:"INVALID_REVERSAL_AMOUNT" };
    if(event.type === "capped_award" && event.amount !== 0) return { valid:false, code:"INVALID_CAPPED_AMOUNT" };
    if((event.type === "correction" || event.type === "reversal")
      && (typeof event.reason !== "string" || !event.reason.trim())){
      return { valid:false, code:"REASON_REQUIRED" };
    }
    if(event.type === "reversal"
      && (typeof event.referencesEventId !== "string" || !event.referencesEventId.trim())){
      return { valid:false, code:"REFERENCED_EVENT_REQUIRED" };
    }
    if(event.studentLabel !== undefined && typeof event.studentLabel !== "string"){
      return { valid:false, code:"INVALID_LABEL" };
    }
    if(event.studentVisible !== undefined && typeof event.studentVisible !== "boolean"){
      return { valid:false, code:"INVALID_VISIBILITY" };
    }
    if(event.reason !== undefined && (typeof event.reason !== "string" || !event.reason.trim())){
      return { valid:false, code:"INVALID_REASON" };
    }
    if(event.referencesEventId !== undefined
      && (typeof event.referencesEventId !== "string" || !event.referencesEventId.trim())){
      return { valid:false, code:"INVALID_REFERENCE" };
    }
    if(event.tenantDay !== undefined && event.tenantDay !== null && !isCanonicalTenantDay(event.tenantDay)){
      return { valid:false, code:"INVALID_TENANT_DAY" };
    }
    return { valid:true };
  }

  function createXpEventId(){
    try{
      if(window.crypto && typeof window.crypto.randomUUID === "function") return window.crypto.randomUUID();
    }catch(error){}
    return `xp-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }

  function xpEventLabel(event){
    if(event?.type === "reversal") return "XP reversal";
    if(event?.type === "correction") return "XP correction";
    if(event?.ruleRef === "poll-participation") return "Poll participation";
    if(event?.ruleRef === "event-rsvp") return "Event RSVP";
    if(event?.ruleRef === "daily-quiz-participation") return "Daily Quiz participation";
    if(event?.ruleRef === "daily-quiz-accuracy") return "Daily Quiz accuracy bonus";
    if(typeof event?.studentLabel === "string" && event.studentLabel.trim()) return event.studentLabel.trim();
    return "XP activity";
  }

  function buildXpEvent(eventInput={}){
    const ownership = stateOwnershipFields();
    const type = eventInput.type;
    const hasId = Object.prototype.hasOwnProperty.call(eventInput, "id");
    const hasTimestamp = Object.prototype.hasOwnProperty.call(eventInput, "timestamp");
    const hasStudentLabel = Object.prototype.hasOwnProperty.call(eventInput, "studentLabel");
    const hasTenantId = Object.prototype.hasOwnProperty.call(eventInput, "tenantId");
    const hasMembershipId = Object.prototype.hasOwnProperty.call(eventInput, "membershipId");
    const event = {
      id: hasId ? eventInput.id : createXpEventId(),
      tenantId: hasTenantId ? eventInput.tenantId : ownership.tenantId,
      membershipId: hasMembershipId ? eventInput.membershipId : ownership.membershipId,
      ruleRef: eventInput.ruleRef,
      amount: eventInput.amount,
      timestamp: hasTimestamp ? eventInput.timestamp : new Date().toISOString(),
      idempotencyKey: eventInput.idempotencyKey,
      type,
      sourceType: eventInput.sourceType,
      sourceId: eventInput.sourceId,
      sourceAction: eventInput.sourceAction,
      studentLabel: hasStudentLabel ? eventInput.studentLabel : xpEventLabel({ ...eventInput, type }),
      studentVisible: eventInput.studentVisible === undefined ? type !== "capped_award" : eventInput.studentVisible
    };
    ["reason", "referencesEventId", "tenantDay"].forEach(key=>{
      if(eventInput[key] !== undefined) event[key] = eventInput[key];
    });
    return event;
  }

  function compareXpRecords(a, b){
    const keyCompare = a.stableKey.localeCompare(b.stableKey);
    return keyCompare || a.index - b.index;
  }

  function projectXpLedger(state){
    const events = Array.isArray(state?.xpEvents) ? state.xpEvents : [];
    const records = events.map((event, index) => ({
      event,
      index,
      stableKey: xpEventStableKey(event),
      intent: xpEventIntent(event),
      validation: validateXpEvent(event)
    }));
    const problems = new Set();
    const quarantinedIndexes = new Set();
    const quarantine = (record, code) => {
      if(record) quarantinedIndexes.add(record.index);
      if(code) problems.add(code);
    };

    // Structural validation and ownership are the first gate. Grouping by ID
    // before selecting candidates prevents a malformed duplicate from winning
    // merely because it appeared earlier in persisted JSON.
    const idGroups = new Map();
    records.forEach(record => {
      const id = record.event?.id;
      if(typeof id !== "string" || !id.trim()){
        if(!record.validation.valid) quarantine(record, record.validation.code);
        else quarantine(record, "INVALID_EVENT_FIELDS");
        return;
      }
      if(!idGroups.has(id)) idGroups.set(id, []);
      idGroups.get(id).push(record);
    });
    const idCandidates = [];
    idGroups.forEach(group => {
      group.sort(compareXpRecords);
      if(group.length === 1){
        if(group[0].validation.valid) idCandidates.push(group[0]);
        else quarantine(group[0], group[0].validation.code);
        return;
      }
      problems.add("DUPLICATE_EVENT_ID");
      const allValid = group.every(record => record.validation.valid);
      const exactEquivalent = allValid && group.every(record => record.stableKey === group[0].stableKey);
      if(exactEquivalent){
        idCandidates.push(group[0]);
        group.slice(1).forEach(record => quarantine(record, "DUPLICATE_EVENT_ID"));
      } else {
        group.forEach(record => quarantine(record, record.validation.valid ? "DUPLICATE_EVENT_ID" : record.validation.code));
      }
    });

    // An idempotency key represents one operation intent. Same-intent replay
    // is reduced to one deterministic record; conflicting intent quarantines
    // the complete group so input order cannot change the balance.
    const idempotencyGroups = new Map();
    idCandidates.forEach(record => {
      const key = record.event.idempotencyKey;
      if(!idempotencyGroups.has(key)) idempotencyGroups.set(key, []);
      idempotencyGroups.get(key).push(record);
    });
    const intentCandidates = [];
    idempotencyGroups.forEach(group => {
      group.sort(compareXpRecords);
      if(group.length === 1){
        intentCandidates.push(group[0]);
        return;
      }
      problems.add("DUPLICATE_IDEMPOTENCY_KEY");
      const sameIntent = group.every(record => record.intent === group[0].intent);
      if(sameIntent){
        intentCandidates.push(group[0]);
        group.slice(1).forEach(record => quarantine(record, "DUPLICATE_IDEMPOTENCY_KEY"));
      } else {
        problems.add("IDEMPOTENCY_CONFLICT");
        group.forEach(record => quarantine(record, "IDEMPOTENCY_CONFLICT"));
      }
    });

    // Automatic awards have a second, conceptual source uniqueness rule.
    // Corrections remain append-only and may share a source intentionally.
    const sourceGroups = new Map();
    intentCandidates.filter(record => record.event.type === "award").forEach(record => {
      const source = xpEventSourceIdentity(record.event);
      if(!sourceGroups.has(source)) sourceGroups.set(source, []);
      sourceGroups.get(source).push(record);
    });
    const sourceAccepted = new Set(intentCandidates.filter(record => record.event.type !== "award"));
    sourceGroups.forEach(group => {
      group.sort(compareXpRecords);
      if(group.length === 1){
        sourceAccepted.add(group[0]);
        return;
      }
      problems.add("DUPLICATE_SOURCE");
      const sameIntent = group.every(record => record.intent === group[0].intent);
      if(!sameIntent){
        problems.add("DUPLICATE_SOURCE_CONFLICT");
        group.forEach(record => quarantine(record, "DUPLICATE_SOURCE_CONFLICT"));
      } else {
        sourceAccepted.add(group[0]);
        group.slice(1).forEach(record => quarantine(record, "DUPLICATE_SOURCE"));
      }
    });

    const baseCandidates = [...sourceAccepted].sort(compareXpRecords);
    const positiveSources = new Map();
    baseCandidates.forEach(record => {
      const event = record.event;
      if((event.type === "award" || event.type === "correction") && event.amount > 0){
        positiveSources.set(event.id, record);
      }
    });
    const acceptedRecords = new Set(baseCandidates.filter(record => record.event.type !== "reversal"));
    const reversalGroups = new Map();
    baseCandidates.filter(record => record.event.type === "reversal").forEach(record => {
      const referencedId = record.event.referencesEventId;
      const source = positiveSources.get(referencedId);
      if(!source){
        quarantine(record, "PREREQUISITE_MISSING");
        return;
      }
      if(!reversalGroups.has(referencedId)) reversalGroups.set(referencedId, { source, records:[] });
      reversalGroups.get(referencedId).records.push(record);
    });
    reversalGroups.forEach(group => {
      group.records.sort(compareXpRecords);
      const totalReversed = group.records.reduce((sum, record) => sum + Math.abs(record.event.amount), 0);
      if(totalReversed > group.source.event.amount){
        problems.add("EXCESS_REVERSAL");
        group.records.forEach(record => quarantine(record, "EXCESS_REVERSAL"));
      } else {
        group.records.forEach(record => acceptedRecords.add(record));
      }
    });

    const acceptedEvents = [...acceptedRecords].sort(compareXpRecords).map(record => record.event);
    const quarantinedEvents = records
      .filter(record => quarantinedIndexes.has(record.index))
      .sort(compareXpRecords)
      .map(record => record.event);
    const acceptedBalanceEvents = acceptedEvents.filter(xpEventIsBalanceAffecting);
    const total = acceptedBalanceEvents.reduce((sum, event) => sum + event.amount, 0);
    if(total < 0) problems.add("NEGATIVE_TOTAL");
    const acceptedEventIds = [...new Set(acceptedEvents.map(event => event?.id).filter(id => typeof id === "string"))].sort();
    const quarantinedEventIds = [...new Set(quarantinedEvents.map(event => event?.id).filter(id => typeof id === "string"))].sort();
    const problemList = [...problems].sort();
    return {
      valid: problemList.length === 0,
      total,
      eventCount: events.length,
      acceptedEvents,
      acceptedEventIds,
      acceptedEventCount: acceptedEvents.length,
      quarantinedEvents,
      quarantinedEventIds,
      quarantinedEventCount: quarantinedEvents.length,
      problems: problemList
    };
  }

  // Canonical append-only boundary. Existing events are never edited or
  // removed; corrections and reversals are represented by new events.
  function appendXpEvent(state, eventInput={}){
    if(!state || typeof state !== "object" || Array.isArray(state)) return { added:false, reason:"INVALID_STATE" };
    if(!eventInput || typeof eventInput !== "object" || Array.isArray(eventInput)) return { added:false, reason:"INVALID_EVENT" };
    if(xpEventHasUnknownFields(eventInput)) return { added:false, reason:"UNKNOWN_EVENT_FIELD" };
    const existingEvents = Array.isArray(state.xpEvents) ? state.xpEvents : [];
    if(!Array.isArray(state.xpEvents)) state.xpEvents = existingEvents;
    const event = buildXpEvent(eventInput);
    const validation = validateXpEvent(event);
    if(!validation.valid) return { added:false, reason:validation.code };
    const existingProjection = projectXpLedger(state);
    const existingAcceptedIds = new Set(existingProjection.acceptedEventIds);
    const sameId = existingEvents.find(existing => existing && existing.id === event.id);
    if(sameId) return { added:false, reason:"duplicate-event-id" };
    const sameIdempotency = existingEvents
      .filter(existing => existing
        && existing.tenantId === event.tenantId
        && existing.membershipId === event.membershipId
        && existing.idempotencyKey === event.idempotencyKey)
      .sort((a, b) => xpEventStableKey(a).localeCompare(xpEventStableKey(b)));
    if(sameIdempotency.length){
      const replay = sameIdempotency.find(existing => existingAcceptedIds.has(existing.id)
        && validateXpEvent(existing).valid
        && xpEventIntent(existing) === xpEventIntent(event));
      if(replay) return { added:false, reason:"idempotent", event:replay };
      return { added:false, reason:"IDEMPOTENCY_CONFLICT" };
    }

    // Automatic positive awards are unique by conceptual source as well as
    // by the exact idempotency key. Prototype opening balance is a migration
    // correction, so it is intentionally outside this automatic-award rule.
    if(event.type === "award"){
      const duplicateSource = existingProjection.acceptedEvents.find(existing => existing
        && existing.type === "award"
        && xpEventSourceIdentity(existing) === xpEventSourceIdentity(event));
      if(duplicateSource) return { added:false, reason:"source-duplicate", event:duplicateSource };
    }

    if(event.type === "reversal"){
      const referenced = existingProjection.acceptedEvents.find(existing => existing
        && existing.id === event.referencesEventId
        && (existing.type === "award" || existing.type === "correction")
        && existing.amount > 0);
      if(!referenced) return { added:false, reason:"PREREQUISITE_MISSING" };
      const priorReversalAmount = existingProjection.acceptedEvents
        .filter(existing => existing && existing.type === "reversal" && existing.referencesEventId === referenced.id)
        .reduce((sum, existing) => sum + Math.abs(existing.amount), 0);
      if(priorReversalAmount + Math.abs(event.amount) > referenced.amount){
        return { added:false, reason:"EXCESS_REVERSAL" };
      }
    }

    const nextEvents = existingEvents.concat(event);
    state.xpEvents = nextEvents;
    return { added:true, event };
  }

  function balanceXpEventsForState(state){
    return projectXpLedger(state).acceptedEvents.filter(xpEventIsBalanceAffecting);
  }

  function xpTotalForState(state){
    return projectXpLedger(state).total;
  }

  function reconcileXpLedger(state){
    return projectXpLedger(state);
  }

  function canonicalDemoStreakState(){
    const fixture = D.streakState || {};
    return {
      count: typeof fixture.count === "number" && Number.isInteger(fixture.count) && fixture.count>=0 ? fixture.count : 0,
      lastQualifiedTenantDay: typeof fixture.lastQualifiedTenantDay === "string" ? fixture.lastQualifiedTenantDay : null
    };
  }

  function isCanonicalTenantDay(value){
    if(typeof value !== "string" || !/^(\d{4})-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(value)) return false;
    const date = new Date(`${value}T00:00:00Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
  }

  const TENANT_WEEKDAY_NAMES = Object.freeze([
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday"
  ]);

  // Tenant calendar dates are explicit UTC midnights; the browser clock and
  // device timezone never participate in the Play week calculation.
  function parseTenantDay(value){
    if(!isCanonicalTenantDay(value)) return null;
    const date = new Date(`${value}T00:00:00Z`);
    return date;
  }

  function buildTenantWeek(currentTenantDay){
    const currentDate = parseTenantDay(currentTenantDay);
    if(!currentDate) return [];
    const mondayOffset = (currentDate.getUTCDay() + 6) % 7;
    const monday = new Date(currentDate.getTime());
    monday.setUTCDate(monday.getUTCDate() - mondayOffset);
    return Array.from({length:7}, (_, index)=>{
      const date = new Date(monday.getTime());
      date.setUTCDate(monday.getUTCDate() + index);
      return {
        tenantDay: date.toISOString().slice(0, 10),
        shortName: TENANT_WEEKDAY_NAMES[date.getUTCDay()].slice(0, 3),
        name: TENANT_WEEKDAY_NAMES[date.getUTCDay()]
      };
    });
  }

  function weekdayNameForTenantDay(tenantDay){
    const date = parseTenantDay(tenantDay);
    return date ? TENANT_WEEKDAY_NAMES[date.getUTCDay()] : null;
  }

  function formatStreakCopy(value){
    const count = Number.isInteger(value) && value>=0 ? value : 0;
    const unit = count===1 ? "day" : "days";
    return {
      count,
      duration: `${count} ${unit}`,
      compact: `${count} day streak`
    };
  }

  function ensureStreakState(state){
    const fallback = canonicalDemoStreakState();
    const stored = state?.streakState;
    const count = stored && typeof stored.count === "number" && Number.isInteger(stored.count) && stored.count>=0
      ? stored.count
      : fallback.count;
    const lastQualifiedTenantDay = stored && (stored.lastQualifiedTenantDay===null || isCanonicalTenantDay(stored.lastQualifiedTenantDay))
      ? stored.lastQualifiedTenantDay
      : fallback.lastQualifiedTenantDay;
    state.streakState = { count, lastQualifiedTenantDay };
    return state;
  }

  // One integration boundary for all qualifying product actions. The pure
  // engine owns arithmetic; this adapter only supplies tenant facts and copies
  // the result into the caller's state. It deliberately does not persist.
  function applyStreakQualification(activityType, state){
    const normalizedState = ensureStreakState(state);
    const calendar = D.demoConfig?.calendar || {};
    const result = window.CampusHubStreak.applyQualifyingActivity({
      activityType,
      tenantDay: calendar.currentTenantDay,
      currentStreak: normalizedState.streakState.count,
      lastQualifiedTenantDay: normalizedState.streakState.lastQualifiedTenantDay,
      previousActiveTenantDay: calendar.previousActiveTenantDay ?? null,
      isInRecess: calendar.isInRecess === true
    });
    normalizedState.streakState.count = result.streak;
    normalizedState.streakState.lastQualifiedTenantDay = result.lastQualifiedTenantDay;
    return result;
  }

  // All visible streak surfaces are synchronized from persistent state here.
  function syncStreakPresentation(state, progress=null){
    const normalizedState = ensureStreakState(state || {});
    const currentProgress = progress || studentProgressForState(normalizedState);
    const streak = normalizedState.streakState.count;
    const lastQualifiedTenantDay = normalizedState.streakState.lastQualifiedTenantDay;
    const calendar = D.demoConfig?.calendar || {};
    const currentTenantDay = calendar.currentTenantDay;
    const inRecess = calendar.isInRecess === true;
    const streakCopy = formatStreakCopy(streak);
    const lastQualifiedWeekday = weekdayNameForTenantDay(lastQualifiedTenantDay);
    const summary = lastQualifiedWeekday
      ? (lastQualifiedTenantDay===currentTenantDay && !inRecess
        ? "Active today"
        : `Last active ${lastQualifiedWeekday}`)
      : "No qualifying activity yet";
    setEntityField('[data-field="streakDuration"]', streakCopy.duration);
    setEntityField('[data-field="streakActivitySummary"]', summary);
    setEntityField('[data-field="homeStreak"]', streakCopy.compact);
    setEntityField('[data-field="meStreak"]', `Streak ${streakCopy.duration}`);
    setEntityField('[data-field="streakPauseNote"]', inRecess
      ? "Your streak is paused for the recess."
      : "Your streak pauses automatically during university recess.");

    const week = buildTenantWeek(currentTenantDay);
    const weekElement = $('#view-play .streak-days');
    if(weekElement){
      weekElement.setAttribute('role', 'list');
      weekElement.setAttribute('aria-label', 'Current tenant week');
      weekElement.innerHTML = week.map(day=>{
        const isToday = day.tenantDay===currentTenantDay;
        const isQualifiedToday = isToday && !inRecess && lastQualifiedTenantDay===currentTenantDay;
        const isLastQualified = !isToday && day.tenantDay===lastQualifiedTenantDay;
        const isPausedToday = isToday && inRecess;
        const classes = ['day-pill'];
        if(isToday) classes.push('is-today');
        if(isLastQualified) classes.push('is-done', 'is-last-qualified');
        if(isQualifiedToday) classes.push('is-done', 'is-qualified-today');
        if(isPausedToday) classes.push('is-paused');
        let label = day.name;
        if(isToday) label += ' — today';
        if(isLastQualified) label += ' — last qualifying day';
        if(isQualifiedToday) label += ', qualifying activity completed';
        if(isPausedToday) label += ', streak paused';
        return `<div class="${classes.join(' ')}" role="listitem" aria-label="${escapeHtml(label)}"${isToday ? ' aria-current="date"' : ''}>${day.shortName}</div>`;
      }).join('');
    }
    const homePlayLink = $('#homePlaySummary [data-testid="home-play-link"]');
    if(homePlayLink){
      homePlayLink.href = "#play";
      homePlayLink.setAttribute("aria-label", `Open Play: Level ${currentProgress.level}, ${currentProgress.xp} XP, ${streakCopy.compact}`);
    }
    return normalizedState;
  }

  function quizParticipationForCurrentDay(state, quiz=D.quiz){
    const record = state?.quizParticipation;
    if(!record || typeof record!=="object") return null;
    if(record.quizId!==quiz?.id || record.tenantDay!==quiz?.tenantDay) return null;
    if(!Number.isInteger(record.optionIndex) || record.optionIndex<0 || record.optionIndex>=((quiz?.options || []).length)) return null;
    return record;
  }

  // Completion is an action/finalisation outcome, not a GSC prerequisite.
  // The existing participation record is authoritative for replay rendering.
  function dailyQuizCompletionOutcome(state, quiz=D.quiz){
    const currentResult = quizParticipationForCurrentDay(state, quiz);
    if(!currentResult) return { completed:false };
    return {
      completed:true,
      code:"ALREADY_COMPLETED",
      currentResult:{ ...currentResult }
    };
  }

  function defaultState(){
    const ownership = stateOwnershipFields();
    const seedXp = Number(D.student?.xp);
    const seedLevel = Number(D.student?.level);
    const openingBalance = Number.isFinite(seedXp) && seedXp >= 0 ? seedXp : 340;
    return {
      ...ownership,
      pollDone:false,
      pollChoice:null,
      quizDone:false,
      quizChoice:null,
      quizParticipation:null,
      level:Number.isInteger(seedLevel) && seedLevel >= 1 ? seedLevel : 1,
      xpEvents:[prototypeOpeningBalanceEvent(openingBalance)],
      rsvp:null,
      saveEvent:false,
      saveOpp:false,
      reportedOpportunityIds:[],
      saves:Array.isArray(D.saves) ? D.saves.map(item => ({ ...item })) : [],
      notificationReadIds:notificationDefaultReadIds(),
      membership:defaultMembership(),
      participation:defaultParticipation(),
      streakState:canonicalDemoStreakState(),
      voiceDraft:defaultVoiceDraft(),
      voiceSubmissions:[],
      voiceSubmissionCounter:0,
      voiceLastSubmissionId:null,
      supportedVoiceIssues:[],
      voiceStatusScenario:null,
      selectedVoiceIssueId:"voice-water-halls"
    };
  }

  function readStorageRecord(key){
    try{
      const raw = localStorage.getItem(key);
      if(raw === null) return { exists:false, raw:null, value:null, parseError:false };
      try{
        return { exists:true, raw, value:JSON.parse(raw), parseError:false };
      }catch(error){
        return { exists:true, raw, value:null, parseError:true };
      }
    }catch(error){
      return { exists:false, raw:null, value:null, parseError:true, readError:true };
    }
  }

  function writeStateRecord(state){
    if(persistenceScenario === "fail") return false;
    const normalized = ensureParticipationState(state);
    const durable = { ...normalized };
    delete durable.voiceDraft;
    delete durable.xp;
    try{
      localStorage.setItem(stateStorageKey(), JSON.stringify(durable));
      return true;
    }catch(error){
      return false;
    }
  }

  function removeLegacyStateAfterMigration(){
    try{
      localStorage.removeItem(LEGACY_STATE_KEY);
      return true;
    }catch(error){
      return false;
    }
  }

  function hasFutureStateRecord(){
    const currentRecord = readStorageRecord(stateStorageKey());
    if(currentRecord.exists && isFutureStateVersion(currentRecord.value)) return true;
    const previousRecord = readStorageRecord(previousStateStorageKey());
    return previousRecord.exists && isFutureStateVersion(previousRecord.value);
  }

  function stateOwnsMembershipAtSchema(state, schemaVersion){
    const namespace = currentStateNamespace();
    return Boolean(state && typeof state === "object" && !Array.isArray(state)
      && Number(state.schemaVersion) === Number(schemaVersion)
      && state.tenantId === namespace.tenantId
      && state.membershipId === namespace.membershipId);
  }

  function normalizeCurrentStateRecord(value){
    const state = { ...value };
    state.xpEvents = Array.isArray(value?.xpEvents) ? value.xpEvents.slice() : [];
    if(!state.xpEvents.length && Object.prototype.hasOwnProperty.call(value || {}, "xp")){
      state.xp = safeLegacyXpSeed(value.xp);
    }
    return ensureParticipationState(state);
  }

  function migrateOlderStateRecord(value){
    const state = { ...value };
    const sourceEvents = Array.isArray(value?.xpEvents) ? value.xpEvents.slice() : [];
    state.xpEvents = sourceEvents;
    state.schemaVersion = CURRENT_STATE_SCHEMA_VERSION;
    const ownership = stateOwnershipFields();
    state.tenantId = ownership.tenantId;
    state.membershipId = ownership.membershipId;
    if(!sourceEvents.length) state.xp = safeLegacyXpSeed(value?.xp);
    ensureXpLedgerState(state, { createOpening: !sourceEvents.length });
    return ensureParticipationState(state);
  }

  function loadState(){
    const currentRecord = readStorageRecord(stateStorageKey());
    let state;
    let durableVoiceDraft = null;

    if(currentRecord.exists && isFutureStateVersion(currentRecord.value)){
      // Never reinterpret or overwrite a state schema this prototype does not
      // understand. A separate in-memory default keeps the UI usable.
      state = defaultState();
    } else if(currentRecord.exists && !currentRecord.parseError && stateOwnsCurrentMembership(currentRecord.value)){
      state = normalizeCurrentStateRecord(currentRecord.value);
      // ensureVoiceState supplies an in-memory default, so inspect the raw
      // record when deciding whether a durable draft really existed.
      if(Object.prototype.hasOwnProperty.call(currentRecord.value || {}, "voiceDraft")){
        durableVoiceDraft = normalizeVoiceDraft(currentRecord.value.voiceDraft);
      }
    } else {
      const previousRecord = readStorageRecord(previousStateStorageKey());
      const previousFuture = previousRecord.exists && isFutureStateVersion(previousRecord.value);
      if(previousRecord.exists && !previousRecord.parseError && !previousFuture
        && stateOwnsMembershipAtSchema(previousRecord.value, PREVIOUS_STATE_SCHEMA_VERSION)){
        const hasPreviousDraft = Object.prototype.hasOwnProperty.call(previousRecord.value || {}, "voiceDraft");
        const previousDraft = hasPreviousDraft ? normalizeVoiceDraft(previousRecord.value.voiceDraft) : null;
        const previousState = migrateOlderStateRecord(previousRecord.value);
        state = previousState;
        const stateWritten = writeStateRecord(state);
        const draftWritten = !hasPreviousDraft || writeVoiceDraftSession(previousDraft);
        if(stateWritten && draftWritten){
          try{ localStorage.removeItem(previousStateStorageKey()); }catch(error){}
        }
      } else if(!previousFuture){
        // A malformed or foreign v2 record is not a usable source for this
        // membership, so continue the precedence chain without deleting it.
        const legacyRecord = readStorageRecord(LEGACY_STATE_KEY);
        if(legacyRecord.exists){
          const legacyState = !legacyRecord.parseError && legacyRecord.value && typeof legacyRecord.value === "object" && !Array.isArray(legacyRecord.value)
            ? legacyRecord.value
            : defaultState();
          const hasLegacyDraft = Object.prototype.hasOwnProperty.call(legacyState, "voiceDraft");
          const legacyDraft = hasLegacyDraft ? normalizeVoiceDraft(legacyState.voiceDraft) : null;
          state = migrateOlderStateRecord(legacyState);
          const stateWritten = writeStateRecord(state);
          const draftWritten = !hasLegacyDraft || writeVoiceDraftSession(legacyDraft);
          if(stateWritten && draftWritten) removeLegacyStateAfterMigration();
        } else {
          state = defaultState();
          writeStateRecord(state);
        }
      } else {
        // A malformed, primitive, mismatched, or future record is not allowed
        // to contribute behaviour to the active membership. Replace it with
        // safe in-memory defaults while preserving unsupported records.
        state = defaultState();
        if(!currentRecord.exists && !previousFuture) writeStateRecord(state);
      }
    }

    const sessionDraft = readVoiceDraftSession();
    const draftToUse = sessionDraft || durableVoiceDraft;
    if(draftToUse){
      state.voiceDraft = draftToUse;
      // Pre-8T records kept the draft in durable state. Move it to the
      // namespaced session key, then remove the durable copy when the write
      // succeeds; a failure leaves the old record recoverable for retry.
      const sessionWritten = Boolean(sessionDraft) || writeVoiceDraftSession(draftToUse);
      if(sessionWritten && durableVoiceDraft && Object.prototype.hasOwnProperty.call(state, "voiceDraft")){
        const cleaned = { ...state };
        delete cleaned.voiceDraft;
        writeStateRecord(cleaned);
      }
    }
    return ensureParticipationState(state);
  }

  function saveState(s){
    if(persistenceScenario === "fail" || hasFutureStateRecord()) return false;
    return writeStateRecord(s);
  }

  function escapeHtml(s){
    return String(s).replace(/[&<>"']/g, c=> ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  // Helpers: image fallback + debug
  function initImageFallbacks(){
    const heroImg = $('#heroImg');
    const heroMedia = $('#heroMedia');
    if(heroImg && heroMedia){
      heroImg.addEventListener('error', ()=>{
        heroMedia.classList.add('has-image-error');
        heroImg.style.display='none';
      });
      // also check if already broken
      if(heroImg.complete && heroImg.naturalWidth===0){
        heroMedia.classList.add('has-image-error');
        heroImg.style.display='none';
      }
    }
    // cover images (Discover) — hide broken img, keep card readable
    $$('.cover img, .detail-hero img').forEach(img=>{
      img.addEventListener('error', ()=>{
        img.style.display='none';
        const parent = img.closest('.cover, .detail-hero');
        if(parent) parent.style.background = 'var(--muted-bg)';
        parent && parent.setAttribute('aria-label','Image unavailable');
      });
    });
  }

  function resetDiscoverSearchState(){
    discoverSearchState.query = "";
    discoverSearchState.filter = "All";
    discoverSystemState = "ready";
    pendingDiscoverSearchFocus = false;
    pendingDiscoverFilterFocus = false;
    renderDiscover();
  }

  // Debug helper (not visible in normal prototype)
  function initDebug(){
    const params = new URLSearchParams(location.search);
    const debugEnabled = params.get('debug') === '1';
    // Always expose console helper, but only show UI badge if debug=1
    window.CampusHubDebug = {
      resetDemo(){
        if(voiceSubmitTimer){
          clearTimeout(voiceSubmitTimer);
          voiceSubmitTimer = null;
        }
        voiceSubmitInFlight = false;
        setPersistenceScenarioValue("normal");
        // An explicit reset must not overwrite a state schema this runtime
        // does not understand; the unsupported record remains recoverable.
        if(hasFutureStateRecord()) return false;
        const resetState = defaultState();
        const persisted = writeStateRecord(resetState);
        if(!persisted) return false;
        removeLegacyStateAfterMigration();
        clearVoiceDraftSession();
        // Reset mutable demo controls without rewriting canonical fixture data.
        notificationTestMode = null;
        opportunityTestScenario = "normal";
        const state = participationState();
        state.membership = { ...defaultMembership() };
        state.participation = { ...defaultParticipation(), demoScenario:"normal", returnTo:null, returnAction:null };
        state.pollDone = false;
        state.pollChoice = null;
        state.quizDone = false;
        state.quizChoice = null;
        state.quizParticipation = null;
        pendingQuizChoice = null;
        state.rsvp = null;
        state.reportedOpportunityIds = [];
        state.voiceStatusScenario = null;
        state.selectedVoiceIssueId = "voice-water-halls";
        state.supportedVoiceIssues = [];
        state.notificationReadIds = notificationDefaultReadIds();
        state.streakState = { count:3, lastQualifiedTenantDay:"2026-05-19" };
        state.xpEvents = [prototypeOpeningBalanceEvent(340)];
        state.level = studentLevelForXp(xpTotalForState(state)).level;
        meSavesOpen = false;
        meRsvpsOpen = false;
        lastParticipationDecision = null;
        if(!saveState(state)) return false;
        clearVoiceDraftSession();
        syncStudentTrustState(state);
        hydrateTenant(state);
        resetDiscoverSearchState();
        renderQuiz();
        renderSaves();
        renderVoiceLists();
        renderVoiceComposer();
        renderVoiceDetail();
        renderNotifications();
        renderPollState();
        syncVerificationUi();
        const success = $('#verificationSuccess');
        if(success) success.hidden = true;
        toast('Demo state reset.');
        return true;
      },
      resetQuiz(){
        const s = participationState(); s.quizDone=false; s.quizChoice=null; s.quizParticipation=null; pendingQuizChoice=null;
        if(!saveState(s)) return false;
        renderQuiz(); toast('Quiz reset (debug).');
        return true;
      },
      resetPoll(){
        const s = participationState(); s.pollDone=false; s.pollChoice=null;
        if(!saveState(s)) return false;
        location.reload();
        return true;
      },
      resetVoiceDraft(){
        resetVoiceDraft();
        if(location.hash==='#voice-new') renderVoiceComposer();
        toast('Student Voice draft reset (debug).');
      },
      setPersistenceScenario(name){
        if(name !== "normal" && name !== "fail"){
          throw new TypeError(`Unknown CampusHub persistence scenario: ${name}`);
        }
        return setPersistenceScenarioValue(name);
      },
      getPersistenceScenario(){
        return persistenceScenario;
      },
      getStateStorageKey(){
        return stateStorageKey();
      },
      getVoiceDraftStorageKey(){
        return voiceDraftStorageKey();
      },
      getCurrentState(){
        return JSON.parse(JSON.stringify(participationState()));
      },
      getXpEvents(){
        return JSON.parse(JSON.stringify(participationState().xpEvents || []));
      },
      getXpTotal(){
        return xpTotalForState(participationState());
      },
      projectXpLedger(){
        return JSON.parse(JSON.stringify(projectXpLedger(participationState())));
      },
      reconcileXpLedger(){
        return JSON.parse(JSON.stringify(reconcileXpLedger(participationState())));
      },
      appendXpEvent(eventInput={}){
        const state = participationState();
        const result = appendXpEvent(state, eventInput);
        if(!result.added) return result;
        if(!saveState(state)) return { added:false, reason:"PERSISTENCE_FAILURE" };
        hydrateTenant(state);
        renderXPRules();
        return { added:true, event:JSON.parse(JSON.stringify(result.event)) };
      },
      appendXpCorrection(eventInput={}){
        const state = participationState();
        const result = appendXpEvent(state, { ...eventInput, type:"correction" });
        if(!result.added) return result;
        if(!saveState(state)) return { added:false, reason:"PERSISTENCE_FAILURE" };
        hydrateTenant(state);
        renderXPRules();
        return { added:true, event:JSON.parse(JSON.stringify(result.event)) };
      },
      appendXpReversal(referencesEventId, eventInput={}){
        const state = participationState();
        const result = appendXpEvent(state, { ...eventInput, type:"reversal", referencesEventId });
        if(!result.added) return result;
        if(!saveState(state)) return { added:false, reason:"PERSISTENCE_FAILURE" };
        hydrateTenant(state);
        renderXPRules();
        return { added:true, event:JSON.parse(JSON.stringify(result.event)) };
      },
      getRouteStack(){
        return historyStack.slice();
      },
      getLastGateDecision(){
        return cloneParticipationDecision(lastParticipationDecision);
      },
      getDailyQuizCompletionOutcome(){
        return JSON.parse(JSON.stringify(dailyQuizCompletionOutcome(participationState(), D.quiz)));
      },
      homeActedStateFor(input={}){
        return { ...homeActedStateFor(input) };
      },
      selectHomeCandidate(candidates, options={}){
        const selected = selectHomeCandidate(candidates, options);
        return selected == null ? null : JSON.parse(JSON.stringify(selected));
      },
      setScenario(name){
        if(name==='voice-canonical' || D.voiceStatusScenarios?.[name]){
          applyVoiceStatusScenario(name, true);
          return;
        }
        if(!Object.prototype.hasOwnProperty.call(CANONICAL_PARTICIPATION_SCENARIOS, name)){
          throw new TypeError(`Unknown CampusHub canonical scenario: ${name}`);
        }
        applyCanonicalParticipationScenario(name, true);
      },
      setVoiceStatusScenario(name){
        applyVoiceStatusScenario(name, true);
      },
      getDiscoverState(){
        return discoverSystemState;
      },
      setDiscoverState(name){
        if(!DISCOVER_SYSTEM_STATES.includes(name)){
          throw new TypeError(`Unknown Discover system state: ${name}`);
        }
        discoverSystemState = name;
        renderDiscover();
      },
      setNotificationScenario(name){
        const normalized = name === "normal" ? null : name;
        if(normalized !== null && !["empty", "unavailable"].includes(normalized)){
          throw new TypeError(`Unknown Notifications test scenario: ${name}`);
        }
        notificationTestMode = normalized;
        renderNotifications();
      },
      setOpportunityScenario(name){
        if(!Object.prototype.hasOwnProperty.call(OPPORTUNITY_SCENARIO_DAYS, name)){
          throw new TypeError(`Unknown Opportunity test scenario: ${name}`);
        }
        opportunityTestScenario = name;
        const state = participationState();
        hydrateTenant(state);
        renderDiscover();
        if(location.hash.toLowerCase() === "#opportunities/ra-climate") renderOpportunityEntity(D.opportunity);
      },
      assuranceRank(value){
        return assuranceRank(value);
      },
      evaluateOpportunityAction(opportunity=D.opportunity, state=participationState()){
        return { ...evaluateOpportunityAction(opportunity, state) };
      },
      getOpportunityLifecycle(){
        return { ...opportunityLifecycle(D.opportunity) };
      }
    };
    if(debugEnabled){
      const voiceScenario = document.createElement('select');
      voiceScenario.id = 'debugVoiceScenario';
      voiceScenario.setAttribute('aria-label', 'Debug Student Voice status scenario');
      voiceScenario.style.cssText = 'position:fixed; bottom:126px; left:50%; transform:translateX(-50%); z-index:100; max-width:calc(100% - 28px); background:#0f1a13; color:#fff; border:1px solid rgba(255,255,255,.25); border-radius:999px; padding:8px 12px; font-size:12px; font-weight:700; cursor:pointer;';
      voiceScenario.innerHTML = '<option value="voice-canonical">Voice: Acknowledged</option><option value="voice-under-review">Voice: Under Review</option><option value="voice-action-planned">Voice: Action Planned</option><option value="voice-resolved">Voice: Resolved</option>';
      voiceScenario.value = participationState().voiceStatusScenario || 'voice-canonical';
      voiceScenario.addEventListener('change', event=> window.CampusHubDebug.setScenario(event.currentTarget.value));
      document.body.appendChild(voiceScenario);
      const badge = document.createElement('button');
      badge.textContent = 'Debug: Reset demo';
      badge.style.cssText = 'position:fixed; bottom:80px; left:50%; transform:translateX(-50%); z-index:100; background:#0f1a13; color:#fff; border:0; border-radius:999px; padding:8px 14px; font-size:12px; font-weight:700; cursor:pointer; box-shadow:0 4px 12px rgba(0,0,0,.2);';
      badge.addEventListener('click', ()=> window.CampusHubDebug.resetDemo());
      document.body.appendChild(badge);
      console.info('CampusHub debug enabled. Use window.CampusHubDebug.resetDemo()');
    }
  }

  // Init
  document.addEventListener('DOMContentLoaded', ()=>{
    const initialParticipationState = participationState();
    saveState(initialParticipationState);
    syncStudentTrustState(initialParticipationState);
    hydrateTenant(initialParticipationState);
    renderDiscover();
    renderVoiceLists();
    renderNotifications();
    renderQuiz();
    renderXPRules();
    renderSaves();
    initPoll();
    initSearch();
    initParticipateTabs();
    initVoiceComposer();
    initVoiceDetail();
    initSavesToggles();
    initMeActivity();
    initLeaveCampusHubFlow();
    initRSVP();
    initSkipNavigation();
    initBack();
    initImageFallbacks();
    initParticipationGate();
    initDebug();

    // The header bell is the only Notifications entry point.
    $('#markAllRead')?.addEventListener('click', ()=>{
      if(markAllNotificationsRead()) toast("All notifications marked read.");
    });

    // Student Voice entry points reuse the existing participation-gate decision path.
    $('#voiceNewBtn')?.addEventListener('click', event=> requestVoiceComposer(event.currentTarget));
    $('#voiceListNewBtn')?.addEventListener('click', event=> requestVoiceComposer(event.currentTarget));

    // handle initial hash
    if(location.hash) handleHash(); else showView('home');
  });

  // expose for debugging
  window.CampusHubToast = toast;

})();
