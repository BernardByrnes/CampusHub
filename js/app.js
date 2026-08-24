/* CampusHub Prototype Interactions */
(function(){
  const D = window.CampusHubDemo;
  const $ = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));
  const POLL_RETURN_ROUTE = "participate/poll/restroom-cleanliness";
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
    "voice-detail": { view: "voice-detail", parent: "participate", resolve: id => D.voiceIssues.find(issue => issue.id.toLowerCase() === id.toLowerCase()) || null }
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

  const PARTICIPATION_SCENARIOS = {
    assurance: {
      label: "L1 — Roster Match required",
      description: "The primary interruption-and-return journey.",
      membership: { assuranceLevel: 1, status: "active" },
      participation: { moduleEnabled: true, resourceStatus: "active", audienceEligible: true }
    },
    eligible: {
      label: "Eligible L2 experience",
      description: "The unchanged eligible poll experience at L2 — Roster Match.",
      membership: { assuranceLevel: 2, status: "active" },
      participation: { moduleEnabled: true, resourceStatus: "active", audienceEligible: true }
    },
    membership: {
      label: "Membership needs refreshing",
      description: "Membership state is the primary reason, even when assurance is already L2.",
      membership: { assuranceLevel: 2, status: "refresh" },
      participation: { moduleEnabled: true, resourceStatus: "active", audienceEligible: true }
    },
    module: {
      label: "Student Voice unavailable",
      description: "Open Student Voice and choose “Submit a new issue” to preview this gate; available polls remain usable.",
      membership: { assuranceLevel: 2, status: "active" },
      participation: { moduleEnabled: false, resourceStatus: "active", audienceEligible: true }
    },
    resource: {
      label: "Poll has closed",
      description: "The resource is no longer actionable, so verification is not suggested.",
      membership: { assuranceLevel: 2, status: "active" },
      participation: { moduleEnabled: true, resourceStatus: "closed", audienceEligible: true }
    },
    audience: {
      label: "Different student group",
      description: "The poll is active, but is open to another eligible campus group.",
      membership: { assuranceLevel: 2, status: "active" },
      participation: { moduleEnabled: true, resourceStatus: "active", audienceEligible: false }
    }
  };

  function findCanonicalEntity(key, entityId){
    const entity = D[key];
    if(!entity || !entityId) return null;
    return entity.id.toLowerCase() === entityId.toLowerCase() ? entity : null;
  }

  function findPublication(entityId){
    if(!entityId || !Array.isArray(D.publications)) return null;
    return D.publications.find(publication => publication.id.toLowerCase() === entityId.toLowerCase()) || null;
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

  function renderEventEntity(event){
    if(!event) return;
    setEntityField('[data-field="eventTitle"]', event.title);
    setEntityField('[data-field="eventDate"]', `${event.date} • ${event.time}`);
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
    setEntityField('[data-field="oppTitle"]', opportunity.title);
    setEntityField('[data-field="oppProvider"]', opportunity.provider);
    setEntityField('[data-field="oppDeadline"]', opportunity.deadline);
    setEntityField('[data-field="oppProvider2"]', opportunity.provider);
    setEntityField('[data-field="oppDeadline2"]', opportunity.deadlineDate);
    setEntityField('[data-field="oppDetailTitle"]', opportunity.title);
  }

  function renderSportsEntity(sports){
    if(!sports) return;
    const title = `${sports.homeTeam} ${sports.homeScore} — ${sports.awayScore} ${sports.awayTeam}`;
    const league = `${sports.sport} • ${sports.competition}`;
    setEntityField('[data-field="sportsTitle"]', title);
    setEntityField('[data-field="sportsLeague"]', league);
    setEntityField('[data-field="sportsMeta"]', `${sports.date} • ${sports.status}`);
    setEntityField('[data-field="sportsTitle2"]', title);
    setEntityField('[data-field="sportsLeague2"]', league);
    setEntityField('[data-field="sportsMeta2"]', `${sports.date} • ${sports.venue}`);
    setEntityField('[data-field="sportsScore"]', `${sports.homeScore} — ${sports.awayScore}`);
    setEntityField('[data-field="sportsDateLong"]', `${sports.date} • ${sports.status}`);
  }

  function renderPublicationEntity(publication){
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
    if(media) media.hidden = !publication.image;
    if(image && publication.image){
      image.src = publication.image;
      image.alt = publication.imageAlt || "";
      image.hidden = false;
    }
  }

  // Populate tenant header
  function hydrateTenant(){
    $('[data-field="tenantCampus"]').textContent = D.tenant.campusLabel;
    $('[data-field="tenantYear"]').textContent = `Academic Year ${D.tenant.academicYear}`;
    // priority
    $('[data-field="priorityTitle"]').textContent = D.priorityNotice.title;
    $('[data-field="priorityBody"]').textContent = D.priorityNotice.body;
    $('[data-field="priorityMeta"]').textContent = D.priorityNotice.meta;
    // hero
    $('[data-field="heroKicker"]').textContent = D.heroStory.kicker.toUpperCase();
    $('[data-field="heroTitle"]').textContent = D.heroStory.title;
    $('[data-field="heroBody"]').textContent = D.heroStory.body;
    $('#heroImg').src = D.heroStory.image;
    $('#heroImg').alt = D.heroStory.imageAlt;
    const heroLink = $('[data-testid="hero-read"]');
    if(heroLink) heroLink.href = D.heroStory.href;
    // Home composition uses the same canonical records as the destination views.
    const homePoll = D.quickPollForHome;
    if(homePoll){
      setEntityField('[data-field="homePollKicker"]', homePoll.kicker);
      setEntityField('[data-field="homePollTitle"]', homePoll.title);
      setEntityField('[data-field="homePollMeta"]', homePoll.meta || "Non-binding student sentiment poll");
      const pollLink = $('#homePoll [data-testid="home-poll-respond"]');
      if(pollLink){
        pollLink.href = homePoll.href;
        pollLink.textContent = homePoll.cta;
      }
    }
    const homeEvent = D.featuredEvent;
    if(homeEvent){
      setEntityField('[data-field="homeEventKicker"]', homeEvent.kicker);
      setEntityField('[data-field="homeEventTitle"]', homeEvent.title);
      setEntityField('[data-field="homeEventDate"]', `${homeEvent.date} • ${homeEvent.time}`);
      setEntityField('[data-field="homeEventVenue"]', homeEvent.venue);
      const eventLink = $('#homeEvent [data-testid="home-event-link"]');
      if(eventLink) eventLink.href = homeEvent.href;
    }
    const homeVoice = D.voiceIssues.find(issue => issue.id === "voice-water-halls") || D.voiceIssues[0];
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
    $('[data-field="studentName"]').textContent = D.student.displayName;
    $('[data-field="studentProg"]').textContent = `${D.student.programme} • ${D.student.year}`;
    $('[data-field="studentCampus"]').textContent = `${D.student.campus} • ${D.student.residence}`;
    $('[data-field="studentNo"]').textContent = D.student.studentNumber;
    $('[data-field="studentFaculty"]').textContent = D.student.faculty.replace("College of Computing & Information Sciences","College of Computing & Info. Sci.");
    $('[data-field="assuranceBadge"]').textContent = D.student.assurance;
    $('[data-field="assuranceTitle"]') && ($('[data-field="assuranceTitle"]').textContent = D.student.assurance);
    $('[data-field="savesMeta"]').textContent = `${D.student.savesCount} saved • Events, opportunities, news`;
    // play header
    const levelInfo = D.levels.find(l=> l.level===D.student.level) || D.levels[3];
    const next = D.levels.find(l=> l.level===D.student.level+1);
    $('[data-field="levelDisplay"]').textContent = `Level ${D.student.level}`;
    $('[data-field="levelTitle"]').textContent = levelInfo.title;
    $('[data-field="xpCount"]').textContent = D.student.xp;
    $('[data-field="xpNext"]').textContent = next ? `${next.xpMin - D.student.xp} XP to Level ${next.level}` : `Max level`;
    $('[data-field="streakDays"]').textContent = D.student.streak;
    $('[data-field="levelTitle"]') && void 0;
    // xp bar
    if(next){
      const span = next.xpMin - levelInfo.xpMin;
      const prog = ((D.student.xp - levelInfo.xpMin)/span)*100;
      $('#xpBar').style.width = Math.max(8, Math.min(100, prog)) + '%';
    }
    $('[data-field="quizQ"]').textContent = D.quiz.question;
    setEntityField('[data-field="homeQuizQuestion"]', D.quiz.question);
    setEntityField('[data-field="homeQuizXpParticipation"]', `+${D.quiz.xpParticipation || 5} XP`);
    setEntityField('[data-field="homeQuizXpBonus"]', `+${D.quiz.xpBonus || 5} XP`);
    setEntityField('[data-field="homeLevel"]', `Level ${D.student.level}`);
    setEntityField('[data-field="homeXp"]', `${D.student.xp} XP`);
    setEntityField('[data-field="homeStreak"]', `${D.student.streak} day streak`);
    const homePlayLink = $('#homePlaySummary [data-testid="home-play-link"]');
    if(homePlayLink){
      homePlayLink.href = "#play";
      homePlayLink.setAttribute("aria-label", `Open Play: Level ${D.student.level}, ${D.student.xp} XP, ${D.student.streak} day streak`);
    }
  }

  // Discover rendering
  function renderDiscover(filter="All", search=""){
    const list = $('#discoverList');
    let items = D.discoverItems.slice();

    // keep canonical sports state: sports appears as upcoming fixture in Discover? But spec says if Final on Home, must NOT appear as upcoming elsewhere.
    // So show as Sports Result card same identity, not mismatched fixture time.
    // Ensure discover sports item reflects same result (already does via Demo).

    if(filter !== "All"){
      items = items.filter(i=> i.kind===filter);
    }
    if(search.trim()){
      const q = search.trim().toLowerCase();
      items = items.filter(i=> (i.title+" "+(i.body||"")+" "+(i.provider||"")).toLowerCase().includes(q));
    }

    if(items.length===0){
      list.innerHTML = `<div class="empty">No results for “${escapeHtml(search)}” in ${escapeHtml(filter)}. Try another search.</div>`;
      return;
    }

    list.innerHTML = items.map(item=>{
      if(item.kind==="Events"){
        return `<article class="card list-card">
          <div style="display:flex; gap:12px;">
            <div style="flex:1; min-width:0;">
              <div class="kicker kicker--info">${escapeHtml(item.kicker)}</div>
              <div class="title" style="margin-top:6px; font-size:16px;">${escapeHtml(item.title)}</div>
              <div class="inline-meta" style="margin-top:8px; flex-direction:column; align-items:flex-start;">
                <span style="display:flex; gap:6px; align-items:center;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18"/></svg> ${escapeHtml(item.meta)}</span>
                <span style="display:flex; gap:6px; align-items:center;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M12 21s7-6 7-11a7 7 0 1 0-14 0c0 5 7 11 7 11z"/></svg> ${escapeHtml(item.venue)}</span>
              </div>
              <a href="${escapeHtml(item.href)}" class="btn btn--small" style="margin-top:10px; background:var(--info-soft); border-color:#c9ddf1; color:var(--info);">View details →</a>
            </div>
            <div class="cover" style="width:42%; max-width:170px; flex:0 0 42%; height:auto;">
              <img src="${item.image}" alt="${escapeHtml(item.imageAlt)}" width="300" height="220" loading="lazy" decoding="async" />
            </div>
          </div>
        </article>`;
      }
      if(item.kind==="News"){
        return `<article class="card list-card">
          <div style="display:flex; gap:12px;">
            <div style="flex:1; min-width:0;">
              <div class="kicker">${escapeHtml(item.kicker)}</div>
              <div class="title" style="margin-top:6px; font-size:16px;">${escapeHtml(item.title)}</div>
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
        return `<article class="card list-card">
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
        return `<article class="card list-card">
          <div style="display:flex; gap:12px; align-items:center; justify-content:space-between;">
            <div style="min-width:0; flex:1;">
              <div class="kicker">${escapeHtml(item.kicker)}</div>
              <div class="title" style="margin-top:4px; font-size:15px;">${escapeHtml(item.title)}</div>
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

    // Update sports card on Home to ensure same date venue consistent
    // Attach lazy behaviour
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

  function getVoiceIssue(issueId, state=participationState()){
    const publicIssue = D.voiceIssues.find(issue=> issue.id===issueId);
    if(publicIssue){
      const scenario = state.voiceStatusScenario ? D.voiceStatusScenarios?.[state.voiceStatusScenario] : null;
      const hasScenario = scenario?.issueId===publicIssue.id;
      const isSupported = state.supportedVoiceIssues.includes(publicIssue.id);
      return {
        ...publicIssue,
        supporters: publicIssue.supporters + (isSupported ? 1 : 0),
        status: hasScenario ? scenario.status : publicIssue.status,
        statusVariant: hasScenario ? scenario.statusVariant : publicIssue.statusVariant,
        history: [
          ...(publicIssue.history || []),
          ...(hasScenario ? scenario.historyAdditions || [] : [])
        ],
        officialUpdates: [
          ...(publicIssue.officialUpdates || []),
          ...(hasScenario ? scenario.officialUpdates || [] : [])
        ],
        isPublic:true,
        isSupported
      };
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
            <div class="title" style="margin-top:4px; font-size:14px;">${escapeHtml(it.title)}</div>
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
    if(state.selectedVoiceIssueId!==issue.id){
      state.selectedVoiceIssueId = issue.id;
      saveState(state);
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
      timeline.innerHTML = selected.history.map(event=>{
        const variant = voiceStatusVariant(event.status);
        return `<li class="voice-timeline__item voice-timeline__item--${escapeHtml(variant)}">
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
    if(openCanonicalParticipationGate(decision, trigger, {
        returnTo:voiceDetailReturnIntent(issue.id),
        context:'voice'
      })){
      return;
    }
    state.supportedVoiceIssues.push(issue.id);
    state.supportedVoiceIssues = [...new Set(state.supportedVoiceIssues)];
    saveState(state);
    renderVoiceLists();
    renderVoiceDetail(issue.id);
    const feedback = $('#voiceSupportFeedback');
    if(feedback) feedback.textContent = 'Support recorded.';
    toast('Support recorded.');
  }

  function applyVoiceStatusScenario(name, announce=false){
    const scenario = D.voiceStatusScenarios?.[name] || null;
    const state = participationState();
    state.voiceStatusScenario = scenario ? name : null;
    saveState(state);
    renderVoiceLists();
    if(!$('#view-voice-detail')?.hidden) renderVoiceDetail(state.selectedVoiceIssueId);
    if(announce) toast(scenario ? `${scenario.label} selected for this prototype.` : 'Student Voice — Acknowledged selected for this prototype.');
  }

  function returnFromVoiceDetail(){
    const previous = historyStack[historyStack.length-2] || '';
    if(previous==='voice' || previous==='participate'){
      location.hash = `#${previous}`;
      return;
    }
    location.hash = '#voice';
  }

  function initVoiceDetail(){
    $('#voiceDetailBack')?.addEventListener('click', returnFromVoiceDetail);
    $('#voiceSupportButton')?.addEventListener('click', event=> supportSelectedVoiceIssue(event.currentTarget));
  }

  // Notifications
  function renderNotifications(){
    const wrap = $('#notifList');
    const groups = ["Today","Yesterday","This week","Earlier"];
    const unread = D.notifications.filter(n=>n.unread).length;
    $('#notifBadge').textContent = unread;
    $('#notifBadge').style.display = unread? 'grid':'none';
    $('#notifBtn').setAttribute('aria-label', unread? `Notifications, ${unread} unread` : 'Notifications');

    let html = "";
    groups.forEach(g=>{
      const items = D.notifications.filter(n=> n.group===g);
      if(!items.length) return;
      html += `<div class="group-title">${escapeHtml(g)}</div>`;
      items.forEach(n=>{
        html += `<article class="card list-card" style="display:flex; gap:12px; align-items:flex-start;">
          <span class="${n.unread?'notif-dot':'notif-dot notif-dot--read'}" aria-hidden="true"></span>
          <div style="flex:1; min-width:0;">
            <div style="display:flex; justify-content:space-between; gap:8px;">
              <span class="title" style="font-size:14px;">${escapeHtml(n.title)}</span>
              <span class="meta" style="white-space:nowrap;">${escapeHtml(n.time)}</span>
            </div>
            <p class="body-sm" style="margin:4px 0 0;">${escapeHtml(n.body)}</p>
            <a href="${n.href}" class="section-action" style="margin-top:6px; font-size:12px;">Open →</a>
          </div>
        </article>`;
      });
    });
    if(!D.notifications.length) html = `<div class="empty">No notifications</div>`;
    wrap.innerHTML = html;
    // add click handlers to mark read on open
    $$('#notifList a').forEach(a=> a.addEventListener('click', (e)=>{
      const title = e.currentTarget.closest('.card').querySelector('.title').textContent.trim();
      const n = D.notifications.find(x=> x.title===title);
      if(n) n.unread = false;
      // allow navigation
    }));
  }

  // Quiz — participation + accuracy model (v1.2): +5 for taking part, +5 bonus if correct, max +10
  function renderQuiz(){
    const opts = D.quiz.options;
    const wrap = $('#quizOptions');
    const saved = loadState();
    const done = saved.quizDone;
    const xpPart = D.quiz.xpParticipation || 5;
    const xpBonus = D.quiz.xpBonus || 5;
    wrap.innerHTML = opts.map((o,i)=> `
      <label class="quiz-opt ${done ? (i===D.quiz.correctIndex ? 'correct' : (saved.quizChoice===i ? 'wrong':'')) : ''}">
        <input type="radio" name="quiz" value="${i}" ${saved.quizChoice===i?'checked':''} ${done?'disabled':''} />
        <span style="flex:1; font-size:14px; font-weight:600;">${escapeHtml(o)}</span>
        ${done && i===D.quiz.correctIndex ? '<span class="pill pill--brand" style="font-size:11px;">Correct</span>' : ''}
      </label>
    `).join("");
    const btn = $('#quizSubmit');
    const fb = $('#quizFeedback');
    const note = $('#quizCompleteNote');
    if(done){
      btn.hidden = true;
      fb.hidden = false;
      if(note) note.hidden = false;
      const correct = saved.quizChoice===D.quiz.correctIndex;
      fb.style.background = correct ? '#e6f2e9' : '#fef3f2';
      fb.style.borderColor = correct ? '#cfe3d4' : '#fecdc9';
      fb.style.color = correct ? '#115e2b' : '#7a271a';
      const earned = correct ? (xpPart + xpBonus) : xpPart;
      fb.innerHTML = correct
        ? `<strong>Correct!</strong> ${escapeHtml(D.quiz.explanation)} <br/><span class="pill pill--brand" style="margin-top:6px;">+${earned} XP earned — +${xpPart} for taking part +${xpBonus} bonus for correct answer</span>`
        : `<strong>Not quite.</strong> Correct answer: ${escapeHtml(D.quiz.options[D.quiz.correctIndex])}.<br/><span style="font-size:12px; color:var(--text-muted);">${escapeHtml(D.quiz.explanation)}</span><br/><span class="pill pill--brand" style="margin-top:6px;">+${earned} XP earned — +${xpPart} for taking part</span>`;
    } else {
      btn.hidden = false;
      fb.hidden = true;
      if(note) note.hidden = true;
      btn.disabled = true;
      // enable submit when choice made
      wrap.onchange = ()=> {
        const c = wrap.querySelector('input[name="quiz"]:checked');
        btn.disabled = !c;
      };
    }
    btn.onclick = ()=> {
      const c = wrap.querySelector('input[name="quiz"]:checked');
      if(!c) return;
      const choice = parseInt(c.value,10);
      const correct = choice===D.quiz.correctIndex;
      // XP only if not done — prevents multiple awards (idempotent)
      if(!saved.quizDone){
        saved.quizDone = true;
        saved.quizChoice = choice;
        const earned = correct ? (xpPart + xpBonus) : xpPart;
        D.student.xp += earned;
        hydrateTenant();
        saveState(saved);
        toast(correct ? `Correct — +${earned} XP (+${xpPart} +${xpBonus} bonus). A new quiz will be available tomorrow.` : `Answer recorded — +${earned} XP for taking part. A new quiz will be available tomorrow.`);
      }
      renderQuiz();
      renderXPRules();
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

  // Saves
  function renderSaves(){
    const wrap = $('#savesList');
    const state = loadState();
    const items = (state.saves || D.saves).map(s=> `
      <div class="list-row" style="gap:10px;">
        <div style="flex:1; min-width:0;">
          <div style="font-size:11px; letter-spacing:.06em; text-transform:uppercase; font-weight:700; color:var(--text-muted);">${escapeHtml(s.type)}</div>
          <div class="title" style="font-size:13px; margin-top:2px;">${escapeHtml(s.title)}</div>
          <div class="meta">${escapeHtml(s.meta)}</div>
        </div>
        <button class="btn btn--small" data-unsave="${s.id}">Remove</button>
      </div>
    `).join("");
    wrap.innerHTML = items || `<div class="empty">No saves yet — tap Save on any event or opportunity.</div>`;
    wrap.querySelectorAll('[data-unsave]').forEach(b=> b.addEventListener('click', ()=>{
      const id=b.getAttribute('data-unsave');
      state.saves = (state.saves||D.saves).filter(x=> x.id!==id);
      saveState(state);
      renderSaves();
      toast("Removed from saves.");
    }));
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
      resourceStatus:"active",
      audienceEligible:true,
      voiceAudienceEligible: D.demoConfig?.voiceParticipation?.audienceEligible !== false,
      verifiedAttributes:true,
      storyPrerequisites:true,
      returnTo:null,
      demoScenario:"eligible"
    };
  }

  function defaultVoiceDraft(){
    return { category:"", title:"", description:"", step:1 };
  }

  function ensureVoiceState(state){
    const defaults = defaultVoiceDraft();
    if(!state.voiceDraft || typeof state.voiceDraft!=="object") state.voiceDraft = {};
    Object.keys(defaults).forEach(key=>{
      if(state.voiceDraft[key]===undefined || state.voiceDraft[key]===null) state.voiceDraft[key] = defaults[key];
    });
    state.voiceDraft.category = VOICE_CATEGORIES.includes(state.voiceDraft.category) ? state.voiceDraft.category : "";
    state.voiceDraft.title = typeof state.voiceDraft.title==="string" ? state.voiceDraft.title : "";
    state.voiceDraft.description = typeof state.voiceDraft.description==="string" ? state.voiceDraft.description : "";
    state.voiceDraft.step = [1,2,3].includes(Number(state.voiceDraft.step)) ? Number(state.voiceDraft.step) : 1;
    if(!Array.isArray(state.voiceSubmissions)) state.voiceSubmissions = [];
    state.voiceSubmissionCounter = Number.isInteger(state.voiceSubmissionCounter) && state.voiceSubmissionCounter>=0
      ? state.voiceSubmissionCounter
      : 0;
    if(typeof state.voiceLastSubmissionId!=="string") state.voiceLastSubmissionId = null;
    if(!Array.isArray(state.supportedVoiceIssues)) state.supportedVoiceIssues = [];
    state.supportedVoiceIssues = [...new Set(state.supportedVoiceIssues.filter(id=>typeof id==="string"))];
    if(typeof state.selectedVoiceIssueId!=="string") state.selectedVoiceIssueId = "voice-water-halls";
    if(!D.voiceIssues.some(issue=>issue.id===state.selectedVoiceIssueId) && !state.voiceSubmissions.some(issue=>issue?.id===state.selectedVoiceIssueId)){
      state.selectedVoiceIssueId = "voice-water-halls";
    }
    if(typeof state.voiceStatusScenario!=="string" || !D.voiceStatusScenarios?.[state.voiceStatusScenario]){
      state.voiceStatusScenario = null;
    }
    return state;
  }

  function ensureParticipationState(state){
    if(!state || typeof state!=="object") state = {};
    const membershipDefaults = defaultMembership();
    const participationDefaults = defaultParticipation();
    if(!state.membership || typeof state.membership!=="object") state.membership = {};
    if(!state.participation || typeof state.participation!=="object") state.participation = {};

    Object.keys(membershipDefaults).forEach(key=>{
      if(state.membership[key]===undefined || state.membership[key]===null) state.membership[key] = membershipDefaults[key];
    });
    const parsedLevel = Number(state.membership.assuranceLevel);
    state.membership.assuranceLevel = [0,1,2,3].includes(parsedLevel) ? parsedLevel : membershipDefaults.assuranceLevel;
    if(!["active","refresh"].includes(state.membership.status)) state.membership.status = membershipDefaults.status;

    Object.keys(participationDefaults).forEach(key=>{
      if(state.participation[key]===undefined) state.participation[key] = participationDefaults[key];
    });
    if(!PARTICIPATION_SCENARIOS[state.participation.demoScenario]) state.participation.demoScenario = "assurance";
    if(typeof state.participation.returnTo!=="string") state.participation.returnTo = null;
    ensureVoiceState(state);
    return state;
  }

  function participationState(){
    return ensureParticipationState(loadState());
  }

  function syncStudentTrustState(state=participationState()){
    D.student.assuranceLevel = state.membership.assuranceLevel;
    D.student.assurance = assuranceLabel(state.membership.assuranceLevel);
  }

  const ASSURANCE_CODES = Object.freeze(["L0", "L1", "L2", "L3"]);
  const CANONICAL_GATE_PRESENTATION = Object.freeze({
    "tenant-inactive":"tenant",
    "module-unavailable":"module",
    "poll-closed":"resource",
    "resource-unavailable":"resource",
    "membership-refresh":"membership",
    "assurance-required":"assurance",
    "audience-ineligible":"audience",
    "attributes-required":"attributes",
    "prerequisites-unmet":"prerequisite"
  });

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

  function requiredAssuranceFor(resourceContext){
    if(resourceContext==="poll") return D.poll?.requiredAssurance;
    if(["voice-submission", "voice-support"].includes(resourceContext)){
      return D.demoConfig?.voiceParticipation?.requiredAssurance;
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
      requiredAssurance:requiredAssuranceFor(resourceContext),
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

  // Presentation compatibility only. This does not decide eligibility.
  function openCanonicalParticipationGate(decision, trigger, options={}){
    if(decision?.allowed) return false;
    const variant = decision?.reason?.variant;
    const presentationKey = CANONICAL_GATE_PRESENTATION[variant];
    if(!presentationKey) throw new Error(`No gate presentation mapping for canonical variant: ${variant}.`);
    openParticipationGate(presentationKey, trigger, options);
    return true;
  }

  function gateCopy(key, state, context="poll"){
    const currentAssurance = assuranceLabel(state.membership.assuranceLevel);
    const copy = {
      tenant: {
        kicker:"Participation update", title:"Participation is not available right now",
        reason:"This campus is not currently accepting participation. You can still read campus information.",
        primary:"Back to Participate", action:"return"
      },
      module: {
        kicker:"Participation update", title:"Student Voice is not available",
        reason:"Student Voice has not been enabled for this campus. You can still participate in available polls.",
        primary:"Back to Participate", action:"return"
      },
      resource: {
        kicker:"Poll update", title:"This poll has closed",
        reason:"Responses are no longer being accepted.",
        primary:"Back to polls", action:"return"
      },
      membership: {
        kicker:"Membership update", title:"Membership needs refreshing",
        reason:"Your university membership needs to be confirmed again before you can participate. You can still read campus information.",
        currentLabel:"Membership status", currentValue:"Needs refreshing",
        primary:"Review membership", secondary:"Not now", action:"review"
      },
      assurance: {
        kicker:"Participation requirement", title:"Verify your student status",
        reason:context==="voice"
          ? "Student Voice is available to students whose university membership has been matched to the current student roster."
          : "This poll is available to students whose university membership has been matched to the current student roster.",
        currentLabel:"Your current status", currentValue:currentAssurance,
        requiredLabel:"Required", requiredValue:"L2 — Roster Match",
        primary:"Verify student status", secondary:"Not now", action:"verify"
      },
      audience: {
        kicker:"Poll eligibility", title:"This poll is for a different student group",
        reason:"This poll is currently open to another eligible campus group.",
        primary:"Back to polls", action:"return"
      },
      attributes: {
        kicker:"Participation requirement", title:"Your student details need updating",
        reason:"Some details needed for this poll are not available yet. You can review your membership information.",
        primary:"Review membership", secondary:"Not now", action:"review"
      },
      prerequisite: {
        kicker:"Participation requirement", title:"One more step is needed",
        reason:"Please complete the required step for this poll before responding.",
        primary:"Back to polls", action:"return"
      }
    };
    return copy[key] || copy.assurance;
  }

  let gateTrigger = null;
  let gateFocusAfterClose = null;
  let gateReturnIntent = null;

  function openParticipationGate(key, trigger, options={}){
    const dialog = $('#participationGate');
    if(!dialog) return;
    const state = participationState();
    const returnTo = options.returnTo || POLL_RETURN_ROUTE;
    const context = options.context || "poll";
    const copy = gateCopy(key, state, context);
    gateTrigger = trigger || document.activeElement;
    gateFocusAfterClose = null;
    gateReturnIntent = copy.action==="verify" ? returnTo : null;

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
    setTimeout(()=> primary.focus(), 0);
  }

  function closeParticipationGate(focusTarget=gateTrigger){
    const dialog = $('#participationGate');
    if(!dialog) return;
    gateFocusAfterClose = focusTarget;
    gateReturnIntent = null;
    if(dialog.open && typeof dialog.close==="function") dialog.close();
    else dialog.removeAttribute("open");
  }

  function dismissGateForNavigation(){
    const dialog = $('#participationGate');
    gateTrigger = null;
    gateFocusAfterClose = null;
    gateReturnIntent = null;
    if(dialog?.open && typeof dialog.close==="function") dialog.close();
    else dialog?.removeAttribute("open");
  }

  function syncVerificationUi(){
    const state = participationState();
    const level = state.membership.assuranceLevel;
    const membershipRefresh = state.membership.status!=="active";
    const title = assuranceLabel(level);
    const titleEl = $('[data-field="assuranceTitle"]');
    if(!titleEl) return;

    $('#verificationStatusKicker').textContent = membershipRefresh ? "Membership status" : "Current assurance";
    titleEl.textContent = membershipRefresh ? "Membership needs refreshing" : title;
    $('#verificationStatusDescription').textContent = membershipRefresh
      ? "Your university membership needs to be confirmed again before you can participate. Your assurance level is still recorded separately."
      : level===1
        ? "Your campus invite code or self-declared details show an affiliation. A current roster match is needed before you can respond to polls or use Student Voice."
        : level===3
          ? "Your roster match has been strengthened with institutional proof. You can take part in high-integrity polls where they are available."
          : "Your details match an approved university roster. A roster match alone does not prove identity where student numbers and surnames are guessable.";
    $('#assuranceProgressBar').style.width = ({0:"18%",1:"36%",2:"55%",3:"100%"})[level] || "36%";
    $('#assuranceProgressCurrent').textContent = `L${level}`;

    [1,2,3].forEach(tierLevel=>{
      const tier = $(`#verificationTierL${tierLevel}`);
      const badge = tier?.querySelector("[data-tier-badge]");
      const current = tier?.querySelector("[data-tier-current]");
      const isCurrent = level===tierLevel;
      tier?.classList.toggle("tier--active", isCurrent);
      if(badge) badge.textContent = isCurrent ? "✓" : String(tierLevel);
      if(current) current.hidden = !isCurrent;
    });

    const matchBtn = $('#startRosterMatch');
    const matchHelp = $('#rosterMatchHelp');
    if(matchBtn){
      matchBtn.hidden = level!==1 || membershipRefresh;
      if(!matchBtn.hidden){
        matchBtn.disabled = false;
        matchBtn.textContent = "Match my student record";
      }
    }
    if(matchHelp){
      matchHelp.hidden = level!==1 || membershipRefresh;
      if(!matchHelp.hidden) matchHelp.textContent = "We will check your current enrolment against the university roster.";
    }
  }

  function renderPollState(){
    const form = $('#pollForm');
    const btn = $('#submitPoll');
    const success = $('#pollSuccess');
    if(!form || !btn || !success) return;
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
      if(openCanonicalParticipationGate(decision, btn, {
        returnTo:POLL_RETURN_ROUTE,
        context:'poll'
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
        D.student.xp += pollXp;
        hydrateTenant();
        renderXPRules();
        saveState(state);
        renderPollState();
        toast("Response recorded. Your individual response remains private.");
      }, 500);
    });
  }

  function updateParticipationDemoControls(){
    const state = participationState();
    const scenario = PARTICIPATION_SCENARIOS[state.participation.demoScenario] || PARTICIPATION_SCENARIOS.assurance;
    const select = $('#participationDemoState');
    if(select) select.value = state.participation.demoScenario;
    const description = $('#participationDemoDescription');
    if(description) description.textContent = scenario.description;
  }

  function applyParticipationScenario(name, announce=false){
    const scenario = PARTICIPATION_SCENARIOS[name] || PARTICIPATION_SCENARIOS.assurance;
    const state = participationState();
    state.membership = { ...defaultMembership(), ...scenario.membership };
    state.participation = { ...defaultParticipation(), ...scenario.participation, demoScenario:name, returnTo:null };
    state.pollDone = false;
    state.pollChoice = null;
    saveState(state);
    syncStudentTrustState(state);
    hydrateTenant();
    renderPollState();
    syncVerificationUi();
    updateParticipationDemoControls();
    const success = $('#verificationSuccess');
    if(success) success.hidden = true;
    if(announce) toast(`${scenario.label} selected for this prototype.`);
  }

  function restoreOriginalParticipationIntent(){
    const state = participationState();
    const returnTo = state.participation.returnTo;
    state.participation.returnTo = null;
    saveState(state);
    if(returnTo===POLL_RETURN_ROUTE){
      pendingReturnFocus = true;
      location.hash = "#participate";
      return;
    }
    if(returnTo===VOICE_NEW_RETURN_ROUTE){
      pendingVoiceComposerFocus = true;
      location.hash = "#voice-new";
      return;
    }
    if(isVoiceDetailReturnIntent(returnTo)){
      const issueId = voiceIssueIdFromReturnIntent(returnTo);
      if(getVoiceIssue(issueId)){
        pendingVoiceDetailFocus = true;
        location.hash = voiceDetailRoute(issueId);
      }
    }
  }

  function startRosterMatch(){
    const state = participationState();
    if(state.membership.assuranceLevel>=2 || state.membership.status!=="active") return;
    const button = $('#startRosterMatch');
    const help = $('#rosterMatchHelp');
    if(button){ button.disabled=true; button.textContent="Checking enrolment…"; }
    if(help){ help.hidden=false; help.textContent="Checking your current enrolment against the university roster…"; }

    setTimeout(()=>{
      const updated = participationState();
      updated.membership.assuranceLevel = 2;
      updated.membership.status = "active";
      updated.participation.demoScenario = "eligible";
      const returnTo = updated.participation.returnTo;
      const returning = [POLL_RETURN_ROUTE, VOICE_NEW_RETURN_ROUTE].includes(returnTo) || isVoiceDetailReturnIntent(returnTo);
      saveState(updated);
      syncStudentTrustState(updated);
      hydrateTenant();
      renderPollState();
      syncVerificationUi();
      updateParticipationDemoControls();
      const success = $('#verificationSuccess');
      const detail = $('#verificationSuccessDetail');
      if(detail) detail.textContent = returnTo===VOICE_NEW_RETURN_ROUTE || isVoiceDetailReturnIntent(returnTo)
        ? "Your university membership now matches the current student roster. Returning you to Student Voice…"
        : returning
          ? "Your university membership now matches the current student roster. Returning you to the poll…"
          : "Your university membership now matches the current student roster.";
      if(success){ success.hidden=false; success.focus({preventScroll:true}); }
      toast("Student status confirmed.");
      if(returning) setTimeout(restoreOriginalParticipationIntent, 1100);
    }, 750);
  }

  function initParticipationGate(){
    const initial = participationState();
    saveState(initial);
    syncStudentTrustState(initial);
    syncVerificationUi();
    updateParticipationDemoControls();

    const dialog = $('#participationGate');
    dialog?.addEventListener('close', ()=>{
      const target = gateFocusAfterClose || gateTrigger;
      gateFocusAfterClose = null;
      gateTrigger = null;
      gateReturnIntent = null;
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
      if(action==="verify"){
        const state = participationState();
        state.participation.returnTo = gateReturnIntent || POLL_RETURN_ROUTE;
        saveState(state);
        dismissGateForNavigation();
        location.hash = "#verification";
      } else if(action==="review"){
        const state = participationState();
        state.participation.returnTo = null;
        saveState(state);
        dismissGateForNavigation();
        location.hash = "#verification";
      } else {
        closeParticipationGate();
      }
    });
    $('#participationGateSecondary')?.addEventListener('click', ()=> closeParticipationGate());
    $('#startRosterMatch')?.addEventListener('click', startRosterMatch);
    $('#participationDemoState')?.addEventListener('change', event=> applyParticipationScenario(event.target.value, true));
    $('#resetParticipationDemo')?.addEventListener('click', ()=> applyParticipationScenario("assurance", true));
  }

  // Student Voice composer — local prototype state only. Submitted issues are not added to the public issue list.
  let voiceComposerStep = 1;

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
      saveState(state);
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
    clearVoiceError('#voiceTitleError', '#voiceIssueTitle');
    clearVoiceError('#voiceDescriptionError', '#voiceIssueDescription');
  }

  function updateVoiceCategoryContinue(){
    const button = $('#voiceCategoryContinue');
    const selected = $('#voiceComposerForm input[name="voiceCategory"]:checked');
    if(button) button.disabled = !selected;
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
    saveState(state);
    return state.voiceDraft;
  }

  function validateVoiceCategory(){
    const selected = $('#voiceComposerForm input[name="voiceCategory"]:checked');
    if(!selected){
      showVoiceError('#voiceCategoryError', null, 'Choose a category before continuing.');
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
    if(!titleValue){
      showVoiceError('#voiceTitleError', '#voiceIssueTitle', 'Enter a short issue title.');
      valid = false;
    } else {
      clearVoiceError('#voiceTitleError', '#voiceIssueTitle');
    }
    if(!descriptionValue){
      showVoiceError('#voiceDescriptionError', '#voiceIssueDescription', 'Describe the campus issue before continuing.');
      valid = false;
    } else {
      clearVoiceError('#voiceDescriptionError', '#voiceIssueDescription');
    }
    saveVoiceDraft();
    if(valid){
      const state = participationState();
      state.voiceDraft.title = titleValue;
      state.voiceDraft.description = descriptionValue;
      saveState(state);
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
    updateVoiceCategoryContinue();
    setVoiceStep(draft.step, { focus:false, persist:false });
  }

  function resetVoiceDraft(){
    const state = participationState();
    state.voiceDraft = defaultVoiceDraft();
    saveState(state);
    voiceComposerStep = 1;
    clearVoiceValidation();
  }

  function cancelVoiceComposer(){
    resetVoiceDraft();
    location.hash = '#voice';
  }

  function submitVoiceIssue(){
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
    if(openCanonicalParticipationGate(decision, $('#voiceSubmitIssue'), {
      returnTo:VOICE_NEW_RETURN_ROUTE,
      context:'voice'
    })){
      saveVoiceDraft();
      setVoiceStep(3, { focus:false, persist:true });
      return;
    }
    state.voiceSubmissionCounter += 1;
    const submission = {
      id:`voice-local-${state.voiceSubmissionCounter}`,
      category:draft.category,
      title:draft.title,
      description:draft.description,
      submittedAt:new Date().toISOString(),
      status:'Submitted'
    };
    state.voiceSubmissions.unshift(submission);
    state.voiceLastSubmissionId = submission.id;
    state.voiceDraft = defaultVoiceDraft();
    saveState(state);
    setVoiceStep(4);
  }

  function requestVoiceComposer(trigger){
    const decision = evaluateParticipationAction('voice-submission');
    if(openCanonicalParticipationGate(decision, trigger, { returnTo:VOICE_NEW_RETURN_ROUTE, context:'voice' })){
      return;
    }
    pendingVoiceComposerFocus = true;
    if(location.hash==='#voice-new') showView('voice-new');
    else location.hash = '#voice-new';
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
      if($('#voiceIssueTitle').value.trim()) clearVoiceError('#voiceTitleError', '#voiceIssueTitle');
    });
    $('#voiceIssueDescription')?.addEventListener('input', ()=>{
      saveVoiceDraft();
      if($('#voiceIssueDescription').value.trim()) clearVoiceError('#voiceDescriptionError', '#voiceIssueDescription');
    });
    $('#voiceCategoryContinue')?.addEventListener('click', ()=>{
      if(validateVoiceCategory()) setVoiceStep(2);
    });
    $('#voiceDetailsBack')?.addEventListener('click', ()=> setVoiceStep(1));
    $('#voiceDetailsContinue')?.addEventListener('click', ()=>{
      if(validateVoiceDetails()) setVoiceStep(3);
    });
    $('#voiceReviewBack')?.addEventListener('click', ()=> setVoiceStep(2));
    $('#voiceSubmitIssue')?.addEventListener('click', submitVoiceIssue);
    $('#voiceCategoryCancel')?.addEventListener('click', cancelVoiceComposer);
    $('#voiceComposerCancelTop')?.addEventListener('click', cancelVoiceComposer);
    $('#voiceConfirmationBack')?.addEventListener('click', ()=> location.hash = '#voice');
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
  let pendingVoiceDetailFocus = false;
  let pendingNewsDetailFocus = false;

  function showView(name){
    const target = views.includes(name) ? name : "home";
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
    // search visibility
    const searchWrap = $('#searchWrap');
    if(["home","discover"].includes(target)){
      searchWrap.style.display = "flex";
      if(target==="home"){
        $('#globalSearch').placeholder = "Search news, events, opportunities...";
      } else {
        $('#globalSearch').placeholder = "Search events, opportunities, sports, news...";
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
        const pollHeading = $('#pollQuestion');
        if(!pollHeading) return;
        pollHeading.focus({preventScroll:true});
        pollHeading.scrollIntoView({block:"start", behavior:"auto"});
      }, 60);
    } else if(target==="voice-new" && pendingVoiceComposerFocus){
      pendingVoiceComposerFocus = false;
      setTimeout(focusVoiceStepHeading, 60);
    } else if(target==="voice-detail" && pendingVoiceDetailFocus){
      pendingVoiceDetailFocus = false;
      setTimeout(focusVoiceDetailTitle, 60);
    } else if(target==="news" && pendingNewsDetailFocus){
      pendingNewsDetailFocus = false;
      setTimeout(focusNewsDetailTitle, 60);
    } else if(main) {
      main.focus({preventScroll:true});
    }

    // analytics-like: no op
  }

  function handleHash(){
    const route = parseHashRoute();
    const rawPath = String(location.hash || "").replace(/^#/, "").trim();
    const normalizedPath = rawPath.toLowerCase();
    const legacyTarget = LEGACY_DETAIL_ALIASES[normalizedPath];
    if(legacyTarget){
      history.replaceState(null, "", `#${legacyTarget}`);
      handleHash();
      return;
    }

    if(route.kind==="detail"){
      if(!route.entity){
        const fallback = route.definition.parent === "participate" ? "#voice" : "#discover";
        history.replaceState(null, "", fallback);
        showView(route.definition.parent === "participate" ? "voice" : "discover");
        return;
      }
      if(route.definition.view === "event") renderEventEntity(route.entity);
      if(route.definition.view === "opportunity") renderOpportunityEntity(route.entity);
      if(route.definition.view === "sports") renderSportsEntity(route.entity);
      if(route.definition.view === "news"){
        renderPublicationEntity(route.entity);
        pendingNewsDetailFocus = true;
      }
      if(route.definition.view === "voice-detail"){
        if(!selectVoiceIssue(route.entity.id)){
          history.replaceState(null, "", "#voice");
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
      if(openCanonicalParticipationGate(decision, $('#voiceNewBtn') || document.body, {
          returnTo:VOICE_NEW_RETURN_ROUTE,
          context:'voice'
        })){
        history.replaceState(null, '', '#participate');
        showView('participate');
        return;
      }
      pendingVoiceComposerFocus = true;
    }
    showView(h);
  }

  // Save toggles
  function initSavesToggles(){
    const s1 = $('#eventSave');
    const s2 = $('#oppSave');
    const state = loadState();
    function reflect(btn, key){
      const on = !!state[key];
      btn.setAttribute('aria-pressed', on ? 'true':'false');
      btn.textContent = on ? 'Saved ✓' : 'Save';
      if(on) { btn.classList.add('is-saved'); } else { btn.classList.remove('is-saved'); }
    }
    reflect(s1,'saveEvent');
    reflect(s2,'saveOpp');
    s1.addEventListener('click', ()=>{
      state.saveEvent = !state.saveEvent;
      // update saves list
      if(state.saveEvent){
        state.saves = state.saves || D.saves.slice();
        if(!state.saves.find(x=> x.id==='evt1')){
          state.saves.unshift({id:'evt1', type:'Event', title:D.featuredEvent.title, meta: `${D.featuredEvent.date} • ${D.featuredEvent.venue}`});
        }
      } else {
        state.saves = (state.saves||[]).filter(x=> x.id!=='evt1');
      }
      saveState(state);
      reflect(s1,'saveEvent');
      renderSaves();
      toast(state.saveEvent? "Saved." : "Removed from saves.");
    });
    s2.addEventListener('click', ()=>{
      state.saveOpp = !state.saveOpp;
      if(state.saveOpp){
        state.saves = state.saves || D.saves.slice();
        if(!state.saves.find(x=> x.id==='opp1')){
          state.saves.unshift({id:'opp1', type:'Opportunity', title:D.opportunity.title, meta: D.opportunity.deadline});
        }
      } else {
        state.saves = (state.saves||[]).filter(x=> x.id!=='opp1');
      }
      saveState(state);
      reflect(s2,'saveOpp');
      renderSaves();
      toast(state.saveOpp? "Saved." : "Removed from saves.");
    });
  }

  // RSVP
  function initRSVP(){
    const going = $('#rsvpGoing');
    const inter = $('#rsvpInterested');
    const meta = $('#rsvpState');
    const state = loadState();
    function reflect(){
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
    going.addEventListener('click', ()=>{
      if(state.rsvp==='going'){
        state.rsvp=null;
      } else {
        state.rsvp='going';
      }
      saveState(state); reflect(); toast(state.rsvp? `RSVP: ${state.rsvp}` : 'RSVP cleared');
    });
    inter.addEventListener('click', ()=>{
      state.rsvp = state.rsvp==='interested' ? null : 'interested';
      saveState(state); reflect(); toast(state.rsvp? `RSVP: ${state.rsvp}` : 'RSVP cleared');
    });
  }

  // Search
  function initSearch(){
    const input = $('#globalSearch');
    let currentFilter = "All";
    const update = ()=>{
      const isDiscover = !$('#view-discover').hidden;
      const q = input.value;
      if(isDiscover){
        renderDiscover(currentFilter, q);
      } else {
        // if on home, typing should filter discover list? keep simple: jump to discover
        if(q.trim()){
          location.hash = "#discover";
          setTimeout(()=> renderDiscover("All", q), 50);
        }
      }
    };
    input.addEventListener('input', debounce(update, 250));
    input.addEventListener('keydown', (e)=>{
      if(e.key==='Enter'){
        e.preventDefault();
        update();
      }
    });
    $$('[data-filter]').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        $$('[data-filter]').forEach(b=> b.setAttribute('aria-selected','false'));
        btn.setAttribute('aria-selected','true');
        currentFilter = btn.getAttribute('data-filter');
        renderDiscover(currentFilter, input.value);
      });
    });
  }

  function debounce(fn, ms){ let t; return (...a)=>{ clearTimeout(t); t=setTimeout(()=>fn(...a), ms); }; }

  // Segmented
  function initParticipateTabs(){
    const pollsBtn = $('#seg-polls');
    const voiceBtn = $('#seg-voice');
    const panePolls = $('#pane-polls');
    const paneVoice = $('#pane-voice');
    function toPolls(){
      pollsBtn.setAttribute('aria-selected','true');
      voiceBtn.setAttribute('aria-selected','false');
      panePolls.hidden=false; paneVoice.hidden=true;
    }
    function toVoice(){
      voiceBtn.setAttribute('aria-selected','true');
      pollsBtn.setAttribute('aria-selected','false');
      paneVoice.hidden=false; panePolls.hidden=true;
    }
    pollsBtn.addEventListener('click', toPolls);
    voiceBtn.addEventListener('click', toVoice);
    // deep link ?voice
    if(location.hash==="#participate-voice"){
      location.hash="#participate";
      setTimeout(toVoice,0);
    }
  }

  // Back buttons
  let historyStack = ["home"];
  function initBack(){
    historyStack = [location.hash.replace(/^#/, '') || 'home'];
    $$('[data-back]').forEach(b=> b.addEventListener('click', ()=>{
      const prev = historyStack[historyStack.length-2] || 'home';
      location.hash = `#${prev}`;
    }));
    window.addEventListener('hashchange', ()=>{
      const h = location.hash.replace('#','')||'home';
      if(historyStack[historyStack.length-1]!==h){
        historyStack.push(h);
        if(historyStack.length>10) historyStack.shift();
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

  // State
  function loadState(){
    try{
      const raw = localStorage.getItem('campushub:state');
      if(raw) return JSON.parse(raw);
    }catch(e){}
    return {
      pollDone:false, pollChoice:null,
      quizDone:false, quizChoice:null,
      rsvp:null,
      saveEvent:false, saveOpp:false,
      saves: D.saves.slice(),
      notifsRead: []
    };
  }
  function saveState(s){
    try{ localStorage.setItem('campushub:state', JSON.stringify(s)); }catch(e){}
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

  // Debug helper (not visible in normal prototype)
  function initDebug(){
    const params = new URLSearchParams(location.search);
    const debugEnabled = params.get('debug') === '1';
    // Always expose console helper, but only show UI badge if debug=1
    window.CampusHubDebug = {
      resetDemo(){
        localStorage.removeItem('campushub:state');
        // reset in-memory demo state
        D.student.xp = 340;
        D.voiceIssues[0].supporters = 124;
        D.notifications.forEach((n,i)=> n.unread = i<2);
        const state = participationState();
        saveState(state);
        syncStudentTrustState(state);
        hydrateTenant();
        renderQuiz();
        renderSaves();
        renderVoiceLists();
        renderVoiceComposer();
        renderVoiceDetail();
        renderNotifications();
        renderPollState();
        syncVerificationUi();
        updateParticipationDemoControls();
        const success = $('#verificationSuccess');
        if(success) success.hidden = true;
        toast('Demo state reset.');
      },
      resetQuiz(){
        const s = participationState(); s.quizDone=false; s.quizChoice=null; saveState(s); renderQuiz(); toast('Quiz reset (debug).');
      },
      resetPoll(){
        const s = participationState(); s.pollDone=false; s.pollChoice=null; saveState(s); location.reload();
      },
      resetVoiceDraft(){
        resetVoiceDraft();
        if(location.hash==='#voice-new') renderVoiceComposer();
        toast('Student Voice draft reset (debug).');
      },
      getLastGateDecision(){
        return cloneParticipationDecision(lastParticipationDecision);
      },
      setScenario(name){
        if(name==='voice-canonical' || D.voiceStatusScenarios?.[name]){
          applyVoiceStatusScenario(name, true);
          return;
        }
        applyParticipationScenario(name, true);
      },
      setVoiceStatusScenario(name){
        applyVoiceStatusScenario(name, true);
      },
      setParticipationScenario(name){
        applyParticipationScenario(name, true);
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
    hydrateTenant();
    renderDiscover("All","");
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
    initRSVP();
    initBack();
    initImageFallbacks();
    initParticipationGate();
    initDebug();

    // Notif bell -> notifications view
    $('#notifBtn').addEventListener('click', ()=> location.hash="#notifications");
    $('#markAllRead')?.addEventListener('click', ()=>{
      D.notifications.forEach(n=> n.unread=false);
      renderNotifications();
      toast("All notifications marked read.");
    });

    // External link warnings
    $$('[data-external]').forEach(a=> a.addEventListener('click', (e)=>{
      e.preventDefault();
      toast("External destination — verify the URL before submitting documents.");
    }));

    // Student Voice entry points reuse the existing participation-gate decision path.
    $('#voiceNewBtn')?.addEventListener('click', event=> requestVoiceComposer(event.currentTarget));
    $('#voiceListNewBtn')?.addEventListener('click', event=> requestVoiceComposer(event.currentTarget));

    // handle initial hash
    if(location.hash) handleHash(); else showView('home');
  });

  // expose for debugging
  window.CampusHubToast = toast;

})();
