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
    verified: true
  },

  student: {
    displayName: "Nakato Grace",
    studentNumber: "21/U/04218",
    faculty: "College of Computing & Information Sciences",
    programme: "BSc Computer Science",
    year: "Year 3",
    campus: "Main Campus",
    residence: "Mary Stuart Hall",
    assurance: "L1 — Weak Affiliation",
    assuranceLevel: 1,
    assuranceNext: "L3 — Strong Institutional Proof",
    xp: 340,
    level: 4,
    streak: 3,
    streakLabel: "Active on Monday, Tuesday and Wednesday",
    savesCount: 6,
    rsvpsCount: 3
  },

  priorityNotice: {
    kicker: "Priority Notice",
    title: "Wednesday Classes Rescheduled",
    body: "Due to the Guild General Assembly, all teaching on Wednesday, 21 May 2026 will start at 2:00 PM.",
    meta: "19 May 2026  •  Office of the Academic Registrar",
    href: "#notifications"
  },

  heroStory: {
    kicker: "Innovation Week",
    title: "Makerere Innovation Week opens Monday",
    body: "32 student teams will showcase projects across Main Campus. Exhibitions run 09:00 — 17:00 in Freedom Square.",
    image: "assets/images/hero-innovation.webp",
    imageAlt: "Students collaborating on a campus project",
    cta: "Read story",
    href: "#discover"
  },

  sportsResult: {
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
    awayCrest: "MUK"
  },

  opportunity: {
    kicker: "Verified Opportunity",
    title: "Research Assistant — Climate Resilience",
    provider: "Makerere University — Department of Geography",
    summary: "Support ongoing research on climate adaptation strategies in East Africa.",
    deadline: "Apply by 30 May 2026",
    deadlineDate: "30 May 2026",
    location: "Main Campus • Part-time",
    stipend: "UGX 600,000 / month",
    type: "Research",
    verified: true,
    eligibility: "Open to Year 2+ Geography, Environmental Science and related programmes. L2 verification required.",
    requirements: ["CV (1 page)", "Brief motivation (250 words)", "Academic transcript (unofficial accepted)"],
    href: "#opportunity"
  },

  featuredEvent: {
    kicker: "Upcoming Event",
    title: "Guild Public Debate: The Future of AI in Africa",
    date: "Thu, 22 May 2026",
    time: "2:00 PM — 4:30 PM",
    venue: "Senate Building Auditorium",
    organiser: "Makerere University Guild — Debate Union",
    image: "assets/images/event-debate.webp",
    imageAlt: "University building exterior in daylight",
    description: "Join leading researchers, Guild leaders and student innovators for a debate on AI opportunities, ethics and skills for Africa's next decade.",
    rsvpState: null // 'going' | 'interested' | null
  },

  campusStory: {
    kicker: "Campus Story",
    title: "New Innovation Lab Opens at CoCIS",
    body: "The College of Computing and Information Sciences launches a state-of-the-art innovation lab.",
    date: "19 May 2026",
    source: "CoCIS",
    image: "assets/images/campus-cocis.webp",
    imageAlt: "Modern academic building with glass facade",
    href: "#discover"
  },

  poll: {
    kicker: "Non-binding student sentiment poll",
    question: "How would you rate the cleanliness of public restrooms on campus?",
    help: "Your feedback helps the Guild advocate for improvements.",
    options: ["Very good","Good","Average","Poor","Very poor"],
    closes: "Closes 25 May 2026",
    eligible: true,
    status: "open",
    privacyNote: "Your individual response is private.",
    trustNote: "CampusHub does not provide Guild or university users with a way to see how a named student responded to a poll.",
    hasVoted: false,
    selected: null
  },

  quickPollForHome: {
    kicker: "Quick Poll",
    title: "What should be improved most around Main Campus?",
    cta: "Respond",
    href: "#participate"
  },

  voiceIssues: [
    {
      id: "v1",
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
      id: "v2",
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
      id: "v3",
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

  voiceStatusScenarios: {
    "voice-under-review": {
      label: "Student Voice — Under Review",
      issueId: "v1",
      status: "Under Review",
      statusVariant: "review",
      historyAdditions: [
        { status:"Under Review", date:"17 May 2026", note:"The issue is being reviewed by the responsible campus team." }
      ],
      officialUpdates: []
    },
    "voice-action-planned": {
      label: "Student Voice — Action Planned",
      issueId: "v1",
      status: "Action Planned",
      statusVariant: "planned",
      historyAdditions: [
        { status:"Under Review", date:"17 May 2026", note:"The issue is being reviewed by the responsible campus team." },
        { status:"Action Planned", date:"21 May 2026", note:"An action has been identified to address this issue." }
      ],
      officialUpdates: [
        {
          department:"Facilities Directorate",
          date:"21 May 2026",
          body:"Water supply interruptions have been traced to maintenance work on the western hall line. Repairs are scheduled this week."
        }
      ]
    },
    "voice-resolved": {
      label: "Student Voice — Resolved",
      issueId: "v1",
      status: "Resolved",
      statusVariant: "resolved",
      historyAdditions: [
        { status:"Under Review", date:"17 May 2026", note:"The issue is being reviewed by the responsible campus team." },
        { status:"Action Planned", date:"21 May 2026", note:"An action has been identified to address this issue." },
        { status:"Resolved", date:"28 May 2026", note:"The reported issue has been marked as resolved." }
      ],
      officialUpdates: [
        {
          department:"Facilities Directorate",
          date:"21 May 2026",
          body:"Water supply interruptions have been traced to maintenance work on the western hall line. Repairs are scheduled this week."
        },
        {
          department:"Facilities Directorate",
          date:"28 May 2026",
          body:"Repairs to the affected water line have been completed. Students experiencing continued disruption can raise a new issue."
        }
      ]
    }
  },

  voiceMeta: {
    disclosure: "Your identity is visible only to authorised handlers and is not shared publicly.",
    moderation: "Student Voice submissions are reviewed before publication and must stay within the permitted campus issue categories.",
    noComments: "Student Voice does not include public comments."
  },

  notifications: [
    { id:1, group:"Today", title:"Poll closing soon", body:"“Cleanliness of restrooms” closes tomorrow — your response is still pending.", time:"09:12", unread:true, type:"poll", href:"#participate" },
    { id:2, group:"Today", title:"Event reminder", body:"Guild Public Debate is tomorrow at 2:00 PM — Senate Building Auditorium.", time:"08:30", unread:true, type:"event", href:"#event" },
    { id:3, group:"Yesterday", title:"Opportunity deadline", body:"Research Assistant — Climate Resilience: 3 days left to apply.", time:"19:40", unread:false, type:"opportunity", href:"#opportunity" },
    { id:4, group:"Yesterday", title:"Sports result", body:"MUBS 1 — 2 Makerere University (Final). Tap to see details.", time:"18:05", unread:false, type:"sports", href:"#sports" },
    { id:5, group:"This week", title:"Verification updated", body:"Your membership is now L2 — Roster Match. Strengthen to L3 in Verification.", time:"15 May", unread:false, type:"system", href:"#verification" },
    { id:6, group:"This week", title:"Student Voice update", body:"“Irregular water supply in Halls” is now Acknowledged.", time:"14 May", unread:false, type:"voice", href:"#voice" }
  ],

  quiz: {
    kicker: "Daily Quiz",
    question: "Which lake is the largest in East Africa?",
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
    { action:"Poll response", xp:"+5 XP", note:"Non-binding sentiment poll" },
    { action:"Event RSVP — Going", xp:"+3 XP", note:"RSVP only, attendance not tracked" },
    { action:"Profile completion", xp:"+10 XP", note:"One-time" }
  ],

  saves: [
    { id:"s1", type:"Event", title:"Guild Public Debate: The Future of AI in Africa", meta:"22 May • Senate Building" },
    { id:"s2", type:"Opportunity", title:"Research Assistant — Climate Resilience", meta:"Apply by 30 May" },
    { id:"s3", type:"Campus Story", title:"New Innovation Lab Opens at CoCIS", meta:"19 May • CoCIS" }
  ],

  discoverItems: [] // populated at runtime from other entities
};

// Build discoverItems index
(function(){
  const d = window.CampusHubDemo;
  d.discoverItems = [
    { id:"e1", kind:"Events", kicker:"Upcoming Event", title:d.featuredEvent.title, meta:`${d.featuredEvent.date} • ${d.featuredEvent.time}`, venue:d.featuredEvent.venue, image:d.featuredEvent.image, imageAlt:d.featuredEvent.imageAlt, href:"#event" },
    { id:"n1", kind:"News", kicker:"Campus Story", title:d.campusStory.title, body:d.campusStory.body, meta:`${d.campusStory.date} • ${d.campusStory.source}`, image:d.campusStory.image, imageAlt:d.campusStory.imageAlt, href:"#discover" },
    { id:"o1", kind:"Opportunities", kicker:"Verified Opportunity", title:d.opportunity.title, provider:d.opportunity.provider, body:d.opportunity.summary, deadline:d.opportunity.deadline, href:"#opportunity", verified:true },
    { id:"s1", kind:"Sports", kicker:"Sports Result", title:`${d.sportsResult.homeTeam} ${d.sportsResult.homeScore} — ${d.sportsResult.awayScore} ${d.sportsResult.awayTeam}`, provider:`${d.sportsResult.sport} • ${d.sportsResult.competition}`, meta:`${d.sportsResult.date} • ${d.sportsResult.status}`, href:"#sports", isResult:true, score:`${d.sportsResult.homeScore} — ${d.sportsResult.awayScore}` }
  ];
})();
