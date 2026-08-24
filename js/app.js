/* CampusHub Prototype Interactions */
(function(){
  const D = window.CampusHubDemo;
  const $ = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));

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
    // sports
    $('[data-field="sportsTitle"]').textContent = `${D.sportsResult.homeTeam} ${D.sportsResult.homeScore} — ${D.sportsResult.awayScore} ${D.sportsResult.awayTeam}`;
    $('[data-field="sportsLeague"]').textContent = `${D.sportsResult.sport} • ${D.sportsResult.competition}`;
    $('[data-field="sportsMeta"]').textContent = `${D.sportsResult.date} • ${D.sportsResult.status}`;
    // sports detail (same canonical object)
    const sTitle2 = $('[data-field="sportsTitle2"]');
    if(sTitle2) sTitle2.textContent = `${D.sportsResult.homeTeam} ${D.sportsResult.homeScore} — ${D.sportsResult.awayScore} ${D.sportsResult.awayTeam}`;
    const sLeague2 = $('[data-field="sportsLeague2"]');
    if(sLeague2) sLeague2.textContent = `${D.sportsResult.sport} • ${D.sportsResult.competition}`;
    const sMeta2 = $('[data-field="sportsMeta2"]');
    if(sMeta2) sMeta2.textContent = `${D.sportsResult.date} • ${D.sportsResult.venue}`;
    const sScore = $('[data-field="sportsScore"]');
    if(sScore) sScore.textContent = `${D.sportsResult.homeScore} — ${D.sportsResult.awayScore}`;
    const sDateLong = $('[data-field="sportsDateLong"]');
    if(sDateLong) sDateLong.textContent = `${D.sportsResult.date} • ${D.sportsResult.status}`;
    // opportunity
    $('[data-field="oppTitle"]').textContent = D.opportunity.title;
    $('[data-field="oppProvider"]').textContent = D.opportunity.provider;
    $('[data-field="oppDeadline"]').textContent = D.opportunity.deadline;
    $('[data-field="oppProvider2"]').textContent = D.opportunity.provider;
    $('[data-field="oppDeadline2"]').textContent = D.opportunity.deadlineDate;
    $('[data-field="oppDetailTitle"]').textContent = D.opportunity.title;
    // event
    $('[data-field="eventTitle"]').textContent = D.featuredEvent.title;
    $('[data-field="eventDate"]').textContent = `${D.featuredEvent.date} • ${D.featuredEvent.time}`;
    $('[data-field="eventVenue"]').textContent = D.featuredEvent.venue;
    $('[data-field="eventOrg"]').textContent = D.featuredEvent.organiser;
    $('#eventImg').src = D.featuredEvent.image;
    $('#eventImg').alt = D.featuredEvent.imageAlt;
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
              <a href="#event" class="btn btn--small" style="margin-top:10px; background:var(--info-soft); border-color:#c9ddf1; color:var(--info);">View details →</a>
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
              <div class="meta" style="margin-top:8px;">${escapeHtml(item.meta)} <a href="#discover" class="section-action" style="margin-left:8px;">Read more →</a></div>
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
              <div class="inline-meta" style="margin-top:8px; justify-content:space-between; width:100%;"><span style="display:flex; gap:6px; align-items:center;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18"/></svg> ${escapeHtml(item.deadline)}</span><a href="#opportunity" class="section-action">Makerere University →</a></div>
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
              <a href="#sports" class="section-action">View details →</a>
            </div>
          </div>
        </article>`;
      }
      return "";
    }).join("");

    // Update sports card on Home to ensure same date venue consistent
    // Attach lazy behaviour
  }

  // Voice lists
  function renderVoiceLists(){
    const issues = D.voiceIssues;
    const toCard = (it) => `
      <article class="card list-card">
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
              <span class="status-chip ${it.statusVariant==='acknowledged'?'chip-acknowledged': it.statusVariant==='review'?'chip-review':'chip-submitted'}">${escapeHtml(it.status)}</span>
            </div>
          </div>
          <span aria-hidden="true" style="align-self:center; color:var(--text-muted);">›</span>
        </div>
      </article>
    `;
    $('#voiceList').innerHTML = issues.slice(0,2).map(toCard).join("");
    $('#voiceAllList').innerHTML = issues.map(it=> toCard(it)).join("") + `<button class="btn" style="width:100%; margin-top:6px;" id="voiceSupportDemo">Support an issue (+1) — demo</button>`;
    // wire support demo
    const btn = document.getElementById('voiceSupportDemo');
    if(btn) btn.addEventListener('click', ()=> {
      D.voiceIssues[0].supporters += 1;
      renderVoiceLists();
      toast("Support recorded.");
    });
  }

  function waterIcon(){ return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M12 2.7l7 10.5a7 7 0 1 1-14 0L12 2.7z"/></svg>`; }
  function busIcon(){ return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="3" y="5" width="18" height="12" rx="2"/><path d="M7 15v3"/><path d="M17 15v3"/><path d="M3 10h18"/><circle cx="7" cy="18" r="1" fill="currentColor"/><circle cx="17" cy="18" r="1" fill="currentColor"/></svg>`; }
  function wifiIcon(){ return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M5 12a11 11 0 0 1 14 0"/><path d="M8 15a7 7 0 0 1 8 0"/><path d="M11 18a3 3 0 0 1 2 0"/><circle cx="12" cy="20" r=".5" fill="currentColor"/></svg>`; }

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

  // Poll
  function initPoll(){
    const form = $('#pollForm');
    const btn = $('#submitPoll');
    const success = $('#pollSuccess');
    const state = loadState();
    if(state.pollDone){
      // disable and show success
      form.querySelectorAll('input').forEach(i=> i.disabled=true);
      // check the saved choice
      const idx = state.pollChoice;
      const input = form.querySelector(`input[value="${idx}"]`);
      if(input) input.checked=true;
      btn.disabled = true;
      btn.textContent = "Response recorded";
      success.hidden=false;
      // hide privacy duplicate? keep
      return;
    }

    form.addEventListener('change', ()=>{
      const any = form.querySelector('input:checked');
      btn.disabled = !any;
    });

    btn.addEventListener('click', ()=>{
      const chosen = form.querySelector('input:checked');
      if(!chosen) return;
      const idx = parseInt(chosen.value,10);
      // Simulate submit
      btn.disabled = true;
      btn.textContent = "Submitting…";
      setTimeout(()=>{
        state.pollDone = true;
        state.pollChoice = idx;
        D.student.xp += 5;
        hydrateTenant();
        renderXPRules();
        saveState(state);
        btn.textContent = "Response recorded";
        success.hidden=false;
        form.querySelectorAll('input').forEach(i=> i.disabled=true);
        toast("Response recorded — +5 XP. Your individual response remains private.");
      }, 500);
    });
  }

  // Navigation (hash routing)
  const views = ["home","discover","participate","play","me","verification","notifications","event","opportunity","voice","privacy","sports"];
  const primaryTabs = ["home","discover","participate","play","me"];

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
    // bottom nav active
    const primary = primaryTabs.includes(target) ? target : null;
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
    if(main) main.focus({preventScroll:true});

    // analytics-like: no op
  }

  function handleHash(){
    const h = location.hash.replace('#','').trim().toLowerCase() || 'home';
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
        meta.style.display='block'; meta.textContent='You are going — reminder will appear in notifications. +3 XP earned (once).';
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
        const first = !state.rsvp;
        state.rsvp='going';
        if(first){ D.student.xp+=3; hydrateTenant(); }
      }
      saveState(state); reflect(); toast(state.rsvp? `RSVP: ${state.rsvp} — zero XP beyond first Going` : 'RSVP cleared');
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
        D.student.assurance = "L2 — Roster Match";
        D.student.assuranceLevel = 2;
        D.voiceIssues[0].supporters = 124;
        D.notifications.forEach((n,i)=> n.unread = i<2);
        hydrateTenant();
        renderQuiz();
        renderSaves();
        renderVoiceLists();
        renderNotifications();
        // reset poll UI
        const pollForm = $('#pollForm');
        if(pollForm){
          pollForm.querySelectorAll('input').forEach(i=>{ i.disabled=false; i.checked=false; });
          const btn = $('#submitPoll');
          if(btn){ btn.disabled=true; btn.textContent='Submit response'; }
          const succ = $('#pollSuccess');
          if(succ) succ.hidden=true;
        }
        toast('Demo state reset.');
      },
      resetQuiz(){
        const s = loadState(); s.quizDone=false; s.quizChoice=null; saveState(s); renderQuiz(); toast('Quiz reset (debug).');
      },
      resetPoll(){
        const s = loadState(); s.pollDone=false; s.pollChoice=null; saveState(s); location.reload();
      }
    };
    if(debugEnabled){
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
    initSavesToggles();
    initRSVP();
    initBack();
    initImageFallbacks();
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

    // L3 handler
    $('#toL3')?.addEventListener('click', ()=>{
      toast("Code sent to your roster email — enter it to reach L3 (demo).");
      setTimeout(()=>{
        D.student.assurance = "L3 — Strong Institutional Proof";
        D.student.assuranceLevel = 3;
        hydrateTenant();
        toast("Verified — now L3. High-integrity polls unlocked.");
      }, 900);
    });

    // Voice new
    $('#voiceNewBtn')?.addEventListener('click', ()=>{
      toast("Student Voice submission — reviewed before publication. Category required.");
    });

    // handle initial hash
    if(location.hash) handleHash(); else showView('home');
  });

  // expose for debugging
  window.CampusHubToast = toast;

})();
