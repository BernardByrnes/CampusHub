/* CampusHub Demo Data — Canonical single source of truth
   Prevents contradictions across Home, Discover, etc.
*/
window.CampusHubDemo = {
  tenant: {
    name: "Makerere University Guild",
    short: "Makerere",
    campusLabel: "Main Campus",
    academicYear: "2026/2027",
    logo: "MUK", // text fallback; real crest would be image
    primary: "#1a5c2e", // tenant green
    verified: true,
    strongerVerificationMethods: []
  },

  // Prototype-only arithmetic configuration; this is not student-facing XP policy.
  demoConfig: {
    calendar: {
      // Canonical prototype facts; the browser/device date is not authoritative.
      currentTenantDay: "2026-05-20",
      previousActiveTenantDay: "2026-05-19",
      isInRecess: false
    },
    xp: {
      pollParticipation: 5
    },
    voiceParticipation: {
      requiredAssurance: "L2",
      audienceEligible: true
    }
  },

  student: {
    displayName: "Nakato Grace",
    studentNumber: "21/U/04218",
    faculty: "College of Computing & Information Sciences",
    programme: "BSc Computer Science",
    year: "Year 3",
    campus: "Main Campus",
    residence: "Mary Stuart Hall",
    assurance: "L2 — Roster Match",
    assuranceLevel: 2,
    assuranceNext: null,
    xp: 340,
    level: 4,
    streak: 3,
    streakLabel: "Active on Monday, Tuesday and Wednesday",
    savesCount: 6,
    rsvpsCount: 3
  },

  // Phase 8B starting fixture. This historical demo fact preserves the
  // existing 3-day presentation until Phase 8C wires persistence/rendering.
  streakState: {
    count: 3,
    lastQualifiedTenantDay: "2026-05-19"
  },

  priorityNotice: {
    id: "notice-classes-rescheduled",
    kicker: "Priority Notice",
    title: "Wednesday Classes Rescheduled",
    body: "Due to the Guild General Assembly, all teaching on Wednesday, 20 May 2026 will start at 2:00 PM.",
    meta: "19 May 2026  •  Office of the Academic Registrar",
    href: "#notifications"
  },

  publications: [
    {
      id: "innovation-week",
      kicker: "Innovation Week",
      title: "Makerere Innovation Week opens Monday",
      excerpt: "32 student teams will showcase projects across Main Campus.",
      body: "32 student teams will showcase projects across Main Campus.\n\nExhibitions run 09:00 — 17:00 in Freedom Square.",
      date: "25 May 2026",
      source: "CampusHub editorial",
      image: "assets/images/hero-innovation.webp",
      imageAlt: "Students collaborating on a campus project",
      visibility: "MEMBERS",
      cta: "Read story",
      href: "#news/innovation-week"
    },
    {
      id: "cocis-innovation-lab",
      kicker: "Campus Story",
      title: "New Innovation Lab Opens at CoCIS",
      excerpt: "The College of Computing and Information Sciences launches a state-of-the-art innovation lab.",
      body: "The College of Computing and Information Sciences launches a state-of-the-art innovation lab.\n\nThe new space strengthens the college's support for student innovation on campus.",
      date: "19 May 2026",
      source: "CoCIS",
      image: "assets/images/campus-cocis.webp",
      imageAlt: "Modern academic building with glass facade",
      visibility: "MEMBERS",
      href: "#news/cocis-innovation-lab"
    }
  ],

  sportsResult: {
    id: "mubs-mak",
    homeTeam: "MUBS",
    awayTeam: "Makerere University",
    homeScore: 1,
    awayScore: 2,
    competition: "University League",
    sport: "Football (Men)",
    status: "Final",
    date: "17 May 2026",
    time: "4:00 PM",
    venue: "MUBS Arena",
    homeCrest: "MUBS",
    awayCrest: "MUK",
    href: "#sports/mubs-mak"
  },

  opportunity: {
    id: "ra-climate",
    kicker: "Verified Opportunity",
    title: "Research Assistant — Climate Resilience",
    provider: "Makerere University — Department of Geography",
    summary: "Support ongoing research on climate adaptation strategies in East Africa.",
    description: "Support ongoing research on climate adaptation strategies in East Africa.",
    deadline: "Apply by 30 May 2026",
    deadlineDate: "30 May 2026",
    location: "Main Campus",
    stipend: "UGX 600,000 / month",
    type: "Part-time",
    verified: true,
    eligibility: "Year 2+ Geography, Environmental Science and related programmes.",
    requiredAssurance: "L2",
    requirements: ["CV", "Brief motivation", "Academic transcript"],
    // Production records must contain the actual provider application URL.
    externalUrl: "https://www.mak.ac.ug/",
    href: "#opportunities/ra-climate"
  },

  featuredEvent: {
    id: "guild-debate",
    kicker: "Upcoming Event",
    title: "Guild Public Debate: The Future of AI in Africa",
    date: "Fri, 22 May 2026",
    time: "2:00 PM — 4:30 PM",
    venue: "Senate Building Auditorium",
    organiser: "Makerere University Guild — Debate Union",
    image: "assets/images/event-debate.webp",
    imageAlt: "University building exterior in daylight",
    description: "Join leading researchers, Guild leaders and student innovators for a debate on AI opportunities, ethics and skills for Africa's next decade.",
    requiredAssurance: "L0",
    rsvpEnabled: true,
    rsvpActionable: true,
    audienceEligible: true,
    rsvpState: null, // 'going' | 'interested' | null
    href: "#events/guild-debate"
  },

  poll: {
    id: "poll-restroom-cleanliness",
    kicker: "Non-binding student sentiment poll",
    question: "How would you rate the cleanliness of public restrooms on campus?",
    help: "Your feedback helps the Guild advocate for improvements.",
    options: ["Very good","Good","Average","Poor","Very poor"],
    closes: "Closes 25 May 2026",
    eligible: true,
    status: "open",
    requiredAssurance: "L2",
    privacyNote: "Your individual response is private.",
    trustNote: "CampusHub does not provide Guild or university users with a way to see how a named student responded to a poll.",
    hasVoted: false,
    selected: null
  },

  quickPollForHome: {
    id: "poll-campus-improvements",
    kicker: "Quick Poll",
    title: "What should be improved most around Main Campus?",
    meta: "Non-binding sentiment poll • Closes 25 May 2026",
    cta: "Respond",
    href: "#participate"
  },

  voiceIssues: [
    {
      id: "voice-water-halls",
      category: "Water & Sanitation",
      title: "Irregular water supply in Halls",
      body: "Frequent disruptions are affecting daily routines and hygiene.",
      supporters: 124,
      status: "Acknowledged",
      statusVariant: "acknowledged",
      submittedAt: "14 May 2026",
      history: [
        { status:"Submitted", date:"14 May 2026", note:"Issue submitted to Student Voice." },
        { status:"Acknowledged", date:"15 May 2026", note:"The issue has been acknowledged and is awaiting further review." }
      ],
      officialUpdates: []
    },
    {
      id: "voice-evening-buses",
      category: "Transport",
      title: "Need for more buses during evenings",
      body: "Limited buses after 7 PM make it hard for students to get home.",
      supporters: 87,
      status: "Under Review",
      statusVariant: "review",
      submittedAt: "12 May 2026",
      history: [
        { status:"Submitted", date:"12 May 2026", note:"Issue submitted to Student Voice." },
        { status:"Acknowledged", date:"13 May 2026", note:"The issue has been acknowledged." },
        { status:"Under Review", date:"17 May 2026", note:"The issue is being reviewed by the responsible campus team." }
      ],
      officialUpdates: []
    },
    {
      id: "voice-library-wifi",
      category: "Wi-Fi",
      title: "Slow Wi-Fi at Main Library upper floor",
      body: "Connectivity drops during peak hours near the graduate wing.",
      supporters: 63,
      status: "Submitted",
      statusVariant: "submitted",
      submittedAt: "16 May 2026",
      history: [
        { status:"Submitted", date:"16 May 2026", note:"Your issue has been submitted for review." }
      ],
      officialUpdates: []
    }
  ],

  // Dedicated debug/validation records. These are not part of the normal public list.
  voiceValidationFixtures: {
    "voice-lighting-path": {
      id: "voice-lighting-path",
      category: "Lighting",
      title: "Dark stretch between Mary Stuart and the Main Library",
      body: "The path between Mary Stuart and the Main Library is poorly lit after evening classes.",
      supporters: 41,
      status: "Action Planned",
      statusVariant: "planned",
      submittedAt: "18 May 2026",
      history: [
        { status:"Submitted", date:"18 May 2026", note:"Issue submitted to Student Voice." },
        { status:"Acknowledged", date:"19 May 2026", note:"The issue has been acknowledged." },
        { status:"Under Review", date:"20 May 2026", note:"The issue is being reviewed by the responsible campus team." },
        { status:"Action Planned", date:"21 May 2026", note:"A repair window has been scheduled." }
      ],
      officialUpdates: [
        {
          department:"Facilities Directorate",
          date:"21 May 2026",
          body:"A lighting survey of the Mary Stuart–Library path is complete. Replacement fittings are scheduled this week."
        }
      ]
    },
    "voice-library-sunday-hours": {
      id: "voice-library-sunday-hours",
      category: "Library",
      title: "Sunday library hours during the assessment period",
      body: "Students need dependable Sunday library access during the assessment period.",
      supporters: 156,
      status: "Resolved",
      statusVariant: "resolved",
      submittedAt: "2 May 2026",
      history: [
        { status:"Submitted", date:"2 May 2026", note:"Issue submitted to Student Voice." },
        { status:"Acknowledged", date:"9 May 2026", note:"The issue has been acknowledged." },
        { status:"Under Review", date:"16 May 2026", note:"The issue is being reviewed by the responsible campus team." },
        { status:"Action Planned", date:"21 May 2026", note:"An action has been identified to address this issue." },
        { status:"Resolved", date:"28 May 2026", note:"The reported issue has been marked as resolved." }
      ],
      officialUpdates: [
        {
          department:"University Library",
          date:"28 May 2026",
          body:"Sunday opening hours have been extended through the assessment period. Students who still cannot access a space can raise a new issue."
        }
      ]
    }
  },

  voiceStatusScenarios: {
    "voice-under-review": {
      label: "Student Voice — Under Review",
      fixtureId: "voice-evening-buses"
    },
    "voice-action-planned": {
      label: "Student Voice — Action Planned",
      fixtureId: "voice-lighting-path"
    },
    "voice-resolved": {
      label: "Student Voice — Resolved",
      fixtureId: "voice-library-sunday-hours"
    }
  },

  voiceMeta: {
    disclosure: "Your identity is visible only to authorised handlers and is not shared publicly.",
    moderation: "Student Voice submissions are reviewed before publication and must stay within the permitted campus issue categories.",
    noComments: "Student Voice does not include public comments."
  },

  notifications: [
    { id:"notification-poll-closing", group:"Today", title:"Poll closing soon", body:"“Cleanliness of restrooms” closes tomorrow — your response is still pending.", time:"09:12", unread:true, type:"poll", href:"#participate" },
    { id:"notification-event-reminder", group:"Today", title:"Event reminder", body:"Guild Public Debate is tomorrow at 2:00 PM — Senate Building Auditorium.", time:"08:30", unread:true, type:"event", href:"#events/guild-debate" },
    { id:"notification-opportunity-deadline", group:"Yesterday", title:"Opportunity deadline", body:"Research Assistant — Climate Resilience: 3 days left to apply.", time:"19:40", unread:false, type:"opportunity", href:"#opportunities/ra-climate" },
    { id:"notification-sports-result", group:"Yesterday", title:"Sports result", body:"MUBS 1 — 2 Makerere University (Final). Tap to see details.", time:"18:05", unread:false, type:"sports", href:"#sports/mubs-mak" },
    { id:"notification-verification-updated", group:"This week", title:"Verification updated", body:"Your membership is now L2 — Roster Match.", time:"15 May", unread:false, type:"system", href:"#verification" },
    { id:"notification-voice-update", group:"This week", title:"Student Voice update", body:"“Irregular water supply in Halls” is now Acknowledged.", time:"14 May", unread:false, type:"voice", href:"#voice" }
  ],

  quiz: {
    id: "daily-quiz-2026-05-20",
    tenantDay: "2026-05-20",
    kicker: "Daily Quiz",
    question: "Which lake is the largest in East Africa?",
    requiredAssurance: "L0",
    moduleEnabled: true,
    available: true,
    audienceEligible: true,
    xp: 10, // total possible: 5 participation + 5 accuracy bonus
    xpParticipation: 5,
    xpBonus: 5,
    options: ["Lake Victoria","Lake Tanganyika","Lake Albert","Lake Edward"],
    correctIndex: 0,
    explanation: "Lake Victoria is the largest lake in Africa and the chief reservoir of the Nile.",
    streakBonus: false
  },

  // U2 UX hypothesis — level names are placeholders pending student research.
  levels: [
    { level:1, title:"Newcomer", xpMin:0, xpMax:99 },
    { level:2, title:"Explorer", xpMin:100, xpMax:199 },
    { level:3, title:"Contributor", xpMin:200, xpMax:299 },
    { level:4, title:"Campus Regular", xpMin:300, xpMax:499 },
    { level:5, title:"Campus Leader", xpMin:500, xpMax:799 }
  ],

  // XP ledger-derived (TI-9) — append-only, explainable. Student-facing copy must stay natural, not spec-ID heavy.
  xpRules: [
    { action:"Daily Quiz participation", xp:"+5 XP", note:"One attempt per day" },
    { action:"Daily Quiz correct answer bonus", xp:"+5 XP", note:"Added when your answer is correct" },
    { action:"Poll participation", xp:"Configured", note:"Awarded once per poll; identical regardless of option; amount set by this tenant" },
    { action:"Profile completion", xp:"+10 XP", note:"One-time" }
  ],

  saves: [
    { id:"s1", type:"Event", title:"Guild Public Debate: The Future of AI in Africa", meta:"22 May • Senate Building" },
    { id:"s2", type:"Opportunity", title:"Research Assistant — Climate Resilience", meta:"Apply by 30 May" },
    { id:"s3", type:"Campus Story", title:"New Innovation Lab Opens at CoCIS", meta:"19 May • CoCIS" }
  ],

  discoverItems: [] // populated at runtime from other entities
};

// Compatibility aliases keep existing Home/Discover consumers on the same records.
(function(){
  const d = window.CampusHubDemo;
  const publicationById = id => d.publications.find(publication => publication.id === id);
  d.heroStory = publicationById("innovation-week");
  d.campusStory = publicationById("cocis-innovation-lab");
})();

// Build discoverItems index
(function(){
  const d = window.CampusHubDemo;
  d.discoverItems = [
    { id:d.featuredEvent.id, kind:"Events", kicker:"Upcoming Event", title:d.featuredEvent.title, meta:`${d.featuredEvent.date} • ${d.featuredEvent.time}`, venue:d.featuredEvent.venue, image:d.featuredEvent.image, imageAlt:d.featuredEvent.imageAlt, href:d.featuredEvent.href },
    { id:d.campusStory.id, kind:"News", kicker:d.campusStory.kicker, title:d.campusStory.title, body:d.campusStory.excerpt, meta:`${d.campusStory.date} • ${d.campusStory.source}`, image:d.campusStory.image, imageAlt:d.campusStory.imageAlt, href:d.campusStory.href },
    { id:d.opportunity.id, kind:"Opportunities", kicker:"Verified Opportunity", title:d.opportunity.title, provider:d.opportunity.provider, body:d.opportunity.summary, deadline:d.opportunity.deadline, href:d.opportunity.href, verified:true },
    { id:d.sportsResult.id, kind:"Sports", kicker:"Sports Result", title:`${d.sportsResult.homeTeam} ${d.sportsResult.homeScore} — ${d.sportsResult.awayScore} ${d.sportsResult.awayTeam}`, provider:`${d.sportsResult.sport} • ${d.sportsResult.competition}`, meta:`${d.sportsResult.date} • ${d.sportsResult.status}`, href:d.sportsResult.href, isResult:true, score:`${d.sportsResult.homeScore} — ${d.sportsResult.awayScore}` }
  ];
})();
