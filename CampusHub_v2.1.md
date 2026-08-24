# CampusHub Product Specification v1.0

| Field | Value |
|-------|-------|
| **Status** | Canonical product source of truth |
| **Supersedes** | Draft 0.1 (Opus product specification) and the GPT-5.5 Pro adversarial audit |
| **Audience** | UX/UI design, technical architecture, engineering, QA, commercial, legal review |
| **Document owner** | Principal Product Manager, CampusHub |

---

## Table of Contents

1. [Executive Product Definition](#1-executive-product-definition)
2. [Commercial Model](#2-commercial-model)
3. [Product Goals](#3-product-goals)
4. [Non-Goals](#4-non-goals)
5. [Product Principles](#5-product-principles)
6. [Release Strategy](#6-release-strategy)
7. [Personas](#7-personas)
8. [Governance Authority Matrix](#8-governance-authority-matrix)
9. [Permission Model](#9-permission-model)
10. [Tenant, User & Membership Model](#10-tenant-user--membership-model)
11. [Verification Assurance Model](#11-verification-assurance-model)
12. [Organisational Hierarchy Model](#12-organisational-hierarchy-model)
13. [Major User Journeys](#13-major-user-journeys)
14. [Student Information Architecture Principles](#14-student-information-architecture-principles)
15. [Admin Information Architecture Principles](#15-admin-information-architecture-principles)
16. [CampusHub Trust Invariants](#16-campushub-trust-invariants)
17. [Pilot Epic Map](#17-pilot-epic-map)
18. [Complete Pilot User-Story Backlog](#18-complete-pilot-user-story-backlog)
19. [Pilot Product Metrics](#19-pilot-product-metrics)
20. [Pilot Non-Functional Requirements](#20-pilot-non-functional-requirements)
21. [Pilot Domain Model (Conceptual)](#21-pilot-domain-model-conceptual)
22. [Pilot State Models](#22-pilot-state-models)
23. [Pilot Coverage Matrix](#23-pilot-coverage-matrix)
24. [Commercial V1 Backlog](#24-commercial-v1-backlog)
25. [Phase 2 Backlog](#25-phase-2-backlog)
26. [Explicit Out-of-Scope Register](#26-explicit-out-of-scope-register)
27. [Privacy / Security / Abuse Analysis](#27-privacy--security--abuse-analysis)
28. [Commercial & Operational Risks](#28-commercial--operational-risks)
29. [Architecture Blockers](#29-architecture-blockers)
30. [UX Design Blockers](#30-ux-design-blockers)
31. [Human Review Required](#31-human-review-required)
32. [Assumptions](#32-assumptions)
33. [Open Decisions](#33-open-decisions)
34. [Pre-Implementation Readiness Assessment](#34-pre-implementation-readiness-assessment)
35. [Draft 0.1 → v1.0 Cross-Reference Appendix](#35-draft-01--v10-cross-reference-appendix)
36. [Consistency Statement](#36-consistency-statement)

---

## 1. Executive Product Definition

CampusHub is the digital home of student life — a multi-tenant SaaS platform that gives every university a single, verified, mobile-first place where students find out what is happening on their campus, participate in campus life, and are recognised for doing so.

The product exists because campus information is currently scattered across WhatsApp groups, noticeboards, Instagram pages, PDF circulars and word of mouth. None of these are verifiable, targetable, measurable, or institutionally durable. A Students' Guild cannot prove it reached anyone. A university cannot tell whether a notice landed. A student cannot tell whether an "internship" posted in a group chat is real.

**CampusHub replaces that with:**

- A verified student membership tied to the institution's own roster;
- A canonical campus information layer (publications, events, sports, opportunities);
- Structured participation (polls, saves, follows, and — where the institution is ready — Student Voice);
- Restrained engagement mechanics that give students a reason to return;
- Measurable, privacy-safe evidence that the Guild's communication is working.

The platform is sold as an annual licence to a Students' Guild, a university's Student Affairs office, or both jointly. Students access CampusHub through a mobile-first web/PWA experience. Administrators work in a desktop-efficient responsive workspace.

### 1.1 The Central Product Model

CampusHub supports three complementary behaviours, in strict order of importance:

| Layer | Purpose |
|-------|---------|
| **KNOW** | Students discover what is happening: announcements, campus news, events, opportunities, sports fixtures and results. |
| **PARTICIPATE** | Students act: polls, RSVPs, saves, follows, and appropriately configured Student Voice. |
| **PLAY** | Restrained mechanics encourage return usage: XP, Levels, a simple Streak, and one Daily Campus Quiz. |

> **KNOW is the product. PARTICIPATE creates value. PLAY amplifies engagement.**

Gamification must never dominate the campus-information experience. If a design decision forces a choice between the clarity of campus information and the visibility of a game mechanic, campus information wins.

### 1.2 What CampusHub Is Not

CampusHub is **not**:

- An LMS
- A Student Information System
- An academic-results portal
- A course-registration system
- A tuition-payment system
- A Guild election platform
- An unrestricted social network
- An anonymous confession platform
- A general messaging or chat application
- A student marketplace

These exclusions are structural, not temporary — see §26.

---

## 2. Commercial Model

### 2.1 Licence Structure

CampusHub is licensed annually per university tenant. Two purchase paths exist and both must be supported commercially from the Pilot onward:

| Model | Buyer | Speed | Durability |
|-------|-------|-------|------------|
| **Model A — Guild-funded** | Students' Guild from its own budget | Faster to close, politically simpler | Exposed to annual Guild budget cycles and administration turnover |
| **Model B — Institution-funded** | Student Affairs / university administration | Slower (procurement, security review, data-protection review) | Far more durable across Guild elections |

The commercial strategy is to enter through Model A or a low-cost pilot and convert to Model B at renewal. Product decisions must therefore protect the Guild's autonomy (so the Guild champions the product) while satisfying institutional scrutiny (so the university will eventually pay for it). Where those two pull against each other — most acutely around what a University Official may see — the product takes a constrained-by-default position and pushes the negotiation into the licence agreement rather than into per-deal configuration. See §8.

### 2.2 Secondary Revenue: Sponsorship

Sponsorship is an important part of the Guild sales proposition — it gives a Guild a route to fund its own licence. CampusHub must therefore demonstrate credible sponsorship capability. It must not, however, become an advertising technology company. Pilot sponsorship is deliberately minimal (§18.10, CH-SPN stories) and the business case for year one must not depend on sponsorship revenue.

### 2.3 Pricing and Cost Posture

Pricing is not settled and is a commercial human-review item (§31). The product constraints that bear on it:

- Operating cost per tenant must stay low. This drives the decisions to avoid SMS at scale, to enforce page-weight budgets, to defer web push, and to keep moderation and sponsorship workflows manual and cheap in Pilot.
- Pilot pricing should sit below typical university procurement thresholds so a Guild can transact without a six-month process.
- The renewal artefact is the exported Guild report (CH-ANL-004). A Guild President who can walk into a Dean's office with a one-page impact summary is a Guild President who renews.

---

## 3. Product Goals

| ID | Goal |
|----|------|
| **G1** | **Students return.** A verified student opens CampusHub at least weekly during term because it reliably tells them something they need to know. |
| **G2** | **Guild communication demonstrably reaches students.** The Guild can show, with defensible numbers, how many students saw a notice, voted in a poll, or engaged with an event. |
| **G3** | **Verified membership is real.** The people participating are actually current students of that university, at an assurance level the product states honestly. |
| **G4** | **Institutional trust is earned and kept.** Universities and Guilds can inspect what CampusHub does with student data and find nothing that embarrasses them. Students can read the same thing in plain language before they register. |
| **G5** | **Isolation is absolute.** No university can see another university's private data, through any surface, ever. |
| **G6** | **Small teams can run it.** A Guild communications team of two or three students can operate CampusHub without training beyond onboarding. |
| **G7** | **The Pilot is cheap to build and cheap to run.** Everything in Release 1 must be justifiable as evidence-gathering for a commercial product, not as a finished platform. |
| **G8** | **Nothing in Pilot forces a rewrite.** Tenancy, identity, membership, campus dimension, verification assurance, XP ledgering and audit are built correctly the first time because retrofitting them is a rebuild. |

---

## 4. Non-Goals

These are not "later" — they are explicitly not what CampusHub is:

- **Not an academic system.** No results, transcripts, registration, timetabling, or coursework.
- **Not a payment rail.** CampusHub may record that a sponsor paid; it never moves money.
- **Not an election platform.** Polls are non-binding sentiment instruments and are labelled as such in-product.
- **Not a social network.** No open student posting feed, no student-to-student messaging, no comment threads on Student Voice, no student directory.
- **Not an anonymous confession platform.** Student Voice is pseudonymous-to-peers and accountable to moderators; it is not anonymous, and it is not a place to name individuals.
- **Not an emergency or counselling service.** CampusHub never presents itself as crisis support and never simulates therapeutic engagement.
- **Not an ad-tech platform.** No auctions, no behavioural targeting, no third-party trackers, no data brokerage.
- **Not a cross-university behavioural graph.** See §6 and §10.

---

## 5. Product Principles

| ID | Principle |
|----|-----------|
| **P1** | **Information first.** Every screen is judged on whether it helps a student know something useful about their campus. |
| **P2** | **Isolation by architecture, not by discipline.** Tenant scoping is enforced structurally and tested negatively. "The developer will remember" is not a control. |
| **P3** | **Honest assurance.** The product never claims stronger identity proof than the evidence supports. Assurance levels describe evidence, not aspiration. |
| **P4** | **Privacy that survives contact with a demand.** If a Guild President or a Dean asks to see how a named student voted, the correct answer must be "the product cannot do that," not "we choose not to." |
| **P5** | **Data minimisation.** Collect the least, keep it the shortest time, and ask for it at the moment it is genuinely needed. |
| **P6** | **Restraint in engagement.** No dark patterns, no loss-framing, no purchasable progress, no mechanic that gates essential information. |
| **P7** | **Weight is a feature.** In markets where data costs money, page weight is a product requirement, not an engineering preference. |
| **P8** | **Governance is contractual.** Software roles express agreed authority; they cannot create it. Unresolved authority questions are escalated to the licence agreement, not hidden behind a settings toggle. |
| **P9** | **Audit is immutable; public content is not.** History of what happened is permanent. Public availability of harmful content is not. |
| **P10** | **Build the smallest thing that produces evidence.** Every Pilot feature must be defensible as an answer to a question we cannot otherwise answer. |

---

## 6. Release Strategy

CampusHub is delivered in three explicit stages. Every user story in this document carries a release label. The term "MVP" is retired.

### 6.1 Release 1 — CampusHub Pilot

**Purpose:** Prove that students register, verify, return, consume useful campus information, participate, and create measurable value for the Guild/university.

The Pilot must be safe and architecturally sound, but it must not attempt to implement every future SaaS capability. It is an evidence-gathering release deployed to a small number of tenants under pilot terms.

**In Pilot:**

- Tenant foundation with campus dimension and configurable hierarchy
- Authentication with MFA for privileged roles
- Roster import and evidence-based verification
- Progressive profile with contextual gating
- Campus Home
- Publications
- Events
- Opportunities
- Simplified Sports
- Polls (subject to the architecture blocker in §29)
- Tenant-conditional Student Voice with low-risk categories only
- XP, Levels, simple Streak, one Daily Campus Quiz
- Simple labelled sponsorship
- In-app notifications plus essential email
- Reduced analytics
- Student transparency page
- Guild Term with auto-expiring grants
- Audit log
- Platform support access model

**Not in Pilot:**

- Leaderboards
- Campus Energy
- Badges
- Rewards
- Sponsored challenges
- Sports predictor
- Additional games
- Faculty/hall competitions
- Web push
- Sponsor portal
- Sponsor targeting beyond broad safe audiences
- Delivery pacing
- Sophisticated subscription lifecycle
- Retention cohort dashboards
- Automated Guild Impact Report
- Clubs as account-holding entities

### 6.2 Release 2 — Commercial V1

**Purpose:** Turn the validated Pilot into a robust, repeatable annual SaaS product capable of normal paid operation across universities.

Commercial V1 adds the controls, workflows and reporting that a paying customer and its procurement, legal and security functions require — plus the first engagement features that Pilot evidence justifies. Detailed backlog in §24.

### 6.3 Release 3 — Phase 2

**Purpose:** Expand engagement, sponsorship, games, organisations and advanced functionality based on evidence from real universities.

Every Phase 2 item carries a build trigger. If the trigger has not fired, the item is not built. Detailed backlog in §25.

### 6.4 Release Gating

| Gate | Condition |
|------|-----------|
| Pilot → build start | Architecture blockers §29 resolved; UX blockers §30 resolved; legal items marked "before Pilot" in §31 cleared |
| Pilot → Commercial V1 | Pilot metrics (§19) reviewed against thresholds; no unresolved CRITICAL trust incident |
| Commercial V1 → paid launch | Penetration test complete; backup/restore validated; data-protection position settled; licence templates encode the governance matrix (§8) |
| Any → Phase 2 item | The item's documented trigger has fired |

---

## 7. Personas

| Persona | Role | Key Characteristics |
|---------|------|---------------------|
| **Amina** | First-year student (primary) | Android mid-range phone, metered data, on campus most days. Wants to know where things are, what is on, and whether that internship is real. Will abandon anything that takes more than a few seconds to load or asks for information she does not see the point of. |
| **Brian** | Final-year student (primary) | Cares about opportunities, results, and graduation logistics. Deeply allergic to anything that feels childish. He is the reason gamification must read as adult. |
| **Grace** | Guild Communications Secretary (primary admin) | A student with a full course load doing this in the evenings. Needs to publish quickly from a laptop and occasionally a phone. Will not learn enterprise software. |
| **David** | Guild President (economic champion) | Wants visible wins and evidence for the annual report. Will be lobbied by betting companies and loan apps offering sponsorship money. Will push for priority notices. |
| **Sarah** | Dean of Students / Student Affairs Officer (institutional buyer) | Cares about reach for official notices, student welfare, institutional reputation, and not being surprised. Will ask what she can see and will be told, honestly, that it is limited. |
| **Joseph** | University IT / Data Protection contact (blocker) | Will ask about hosting, isolation, retention, breach process and roster lawful basis. Satisfying him is a procurement requirement. |
| **Miriam** | Tenant Custodian (continuity) | A durable institutional post-holder (typically Student Affairs) who holds emergency authority over roles when a Guild handover is contested or an admin is compromised. Not an everyday user. |
| **Peter** | Sports Coordinator (content supplier) | Enters fixtures and results. Needs the simplest possible tool; will stop using anything that requires a tournament-format decision tree. |
| **Ruth** | CampusHub Platform Operator (internal) | Operates tenants, handles support, holds break-glass authority. Has no standing access to student data. |

---

## 8. Governance Authority Matrix

> **GOVERNANCE AUTHORITY — REQUIRES COMMERCIAL/LEGAL AGREEMENT**
>
> Software roles cannot create authority. They can only express authority that has already been agreed. This section separates what the product enforces absolutely from what must be settled in the licence agreement.

### 8.1 Product-Enforced Non-Negotiable Boundaries

These are not configurable by any tenant, at any price, under any contract. They are implemented as product incapability wherever possible rather than as permission checks.

1. Sponsors never receive student personal data.
2. No role, view, export or support tool reveals an individual student's poll answer.
3. Tenant isolation — no tenant-scoped resource is reachable from another tenant.
4. Platform prohibited advertising categories cannot be relaxed by a tenant.
5. Sponsors cannot target by verification assurance level, or by any behavioural signal.
6. Student Voice submitter identity is accessible only to explicitly capability-granted handlers, and every access is audited.
7. Privileged role revocation removes server-side authority immediately.
8. The audit log cannot be edited or deleted by any role, including Platform.
9. Bulk export of member-identifying data requires exceptional approval and is audited.
10. CampusHub does not process payments.

### 8.2 Tenant / Guild Authority

The Guild (or whichever party holds tenant administration under the licence) decides:

- Ordinary publishing: announcements, campus news, events, opportunities
- Poll subject matter, audience and timing
- Sports content
- Daily Quiz content
- Which low-risk Student Voice categories are enabled, and moderation decisions within them
- Sponsor selection within the platform prohibited list, and stricter local prohibitions
- Tenant branding and terminology labels
- Who holds Guild Administrator and Publisher grants within the current Guild Term

### 8.3 University Authority (Narrowly Defined)

The university, acting through named post-holders under the licence:

- Supplies and attests to the student roster
- Appoints the Tenant Custodian
- Publishes official notices where the licence grants a University Official publishing capability
- Receives the constrained official analytics view (§24, Commercial V1) — counts, trends, and Student Voice category-level statistics only
- May require Student Voice to be disabled, or specific categories to be disabled
- May raise a formal takedown request, which is logged as a request with a recorded outcome

**The university does not get:** individual poll answers, Student Voice submitter identity, individual member behavioural records, member contact exports, or the ability to alter the audit log.

### 8.4 CampusHub Platform Authority

Platform acts only for:

- **Security** — suspending accounts or content that violate platform policy; responding to incidents
- **Platform policy enforcement** — prohibited advertising categories, content policy
- **Tenant operations** — provisioning, lifecycle state, licence status
- **Emergency break-glass** — for continuity or safety (§47 model, CH-PLT-006)

Platform does not arbitrate campus politics. Where a handover is contested, Platform executes the Custodian's documented instruction and logs everything; it takes no position on legitimacy.

### 8.5 Unresolved Governance Questions for the Licence Agreement

These are listed here deliberately rather than being falsely resolved by a settings screen. Each must be answered in the licence template before paid launch, and several before Pilot.

| Question | Needed before |
|----------|---------------|
| GOV-1: Who is the contracting tenant party — Guild, university, or both jointly? | Pilot |
| GOV-2: Who appoints and who may remove the Tenant Custodian? | Pilot |
| GOV-3: Who is data controller for roster data, and who for behavioural data? | Pilot (legal) |
| GOV-4: Who decides a contested Guild handover? | Pilot |
| GOV-5: What is the university's formal takedown authority and its limits? | Commercial V1 |
| GOV-6: Under what conditions may Student Voice be enabled, and who staffs it? | Pilot |
| GOV-7: Who approves a bulk member export and on what basis? | Pilot |
| GOV-8: What happens to sponsor obligations if the tenant is suspended for non-payment? | Commercial V1 |
| GOV-9: Who owns tenant content on exit, and what is exported? | Commercial V1 |
| GOV-10: Which party is accountable for moderation SLA breaches? | Pilot |

---

## 9. Permission Model

### 9.1 Structure

Authorisation is capability-based, evaluated at a single central decision point. Roles are named bundles of capabilities; no feature implements ad-hoc permission logic. Default is deny.

Every authorisation decision evaluates four dimensions together:

1. **Identity** — authenticated global User
2. **Tenant context** — the explicitly active Membership (§10.4)
3. **Capability** — held via an active, unexpired RoleGrant
4. **Resource scope** — the resource belongs to the active tenant, and to a scope the grant covers

### 9.2 Pilot Roles

| Role | Held by | Core capabilities | MFA |
|------|---------|-------------------|-----|
| Student Member | Verified or unverified student | Read tenant content per audience rules; participate per assurance gates; manage own profile and saves | Optional |
| Publisher | Guild comms, sports coordinator, opportunities officer | Create/edit/publish within granted module scopes (publications, events, opportunities, sports, quiz) | Required |
| Guild Administrator | Guild exec | All Publisher capabilities; polls; verification decisions; roster import; grant/revoke Publisher; sponsor records; analytics; tenant settings; audit view | Required |
| Voice Moderator | Designated, trained | Student Voice queue, status transitions, identity access (audited) — only where Voice is enabled | Required |
| Tenant Custodian | Durable university post-holder | Emergency revoke any tenant role; approve bulk export; view audit; cannot publish | Required |
| University Official | Named institutional post-holder | Read constrained official view; publish official notices if licence grants it | Required |
| Platform Operator | CampusHub staff | Tenant provisioning and lifecycle; platform policy enforcement; support tiers per §47 | Required + hardware-backed |

### 9.3 Rules

- No user may grant a capability they do not themselves hold.
- The capability to grant roles (`role.grant`) is not itself grantable by a Publisher.
- Every grant is bound to the current Guild Term and expires with it (§CH-GOV-002).
- Campaign creation and campaign approval are separate capabilities and cannot be exercised on the same campaign by the same person.
- Assurance level is an input to participation gates, never to content-read gates for public tenant information, and never to sponsor targeting.
- Privileged capability changes take effect immediately server-side (§CH-GOV-004).

---

## 10. Tenant, User & Membership Model

### 10.1 The Hard Invariant

CampusHub uses a global User for identity and security, and a tenant-local Membership for everything else. The boundary between them is one of the product's two or three most important invariants.

**Global User may contain only:**

- Authentication credentials
- Verified email and/or phone contact channels
- MFA enrolment and recovery state
- Account recovery state
- Session and security state (sessions, security events, consent version records)

> The global User must never become a cross-university behavioural profile.

**Tenant Membership owns all university-specific behaviour:**

- Student number; university membership state; campus; faculty/school/college; programme; year; residence/hall where relevant
- Verification state and history
- Student profile
- XP; Level; Streak
- Poll participation records
- Campus content engagement
- Student Voice activity
- Event activity; opportunity activity
- Notifications
- Tenant-local analytics identifiers

### 10.2 Hard Rules

- No global engagement score.
- No global student profile.
- No cross-tenant behavioural analytics.
- No cross-university XP, poll history, Voice history, or content engagement.
- Analytics use tenant-local pseudonymous identifiers. Global user IDs never enter analytics stores, tenant reports, or exports.
- Background jobs execute within an explicit tenant context; there is no "for all tenants" job that touches member behavioural data.
- Support and admin tools require explicit tenant context to display any membership data.
- If a student belongs to two universities, the two Memberships are behaviourally isolated. Neither tenant can learn of the other's existence through the product.

### 10.3 Transfer and Multiple Affiliation

University transfer creates a new Membership in the new tenant. Tenant-specific engagement history (XP, Level, Streak, poll participation, Voice history) does not transfer. The old Membership moves to an appropriate terminal state (`transferred_out` or `alumni`) and its historical content attribution remains intact within the old tenant.

### 10.4 Active Tenant Context

Where a global User holds more than one Membership:

- The user must have an explicit active tenant context at all times in the application.
- The active tenant is displayed persistently in the interface.
- Switching tenants is a deliberate action, not an implicit consequence of navigation.
- API requests carry the active tenant context and are authorised against it.
- Notifications are grouped by tenant and never merged into an undifferentiated stream.
- Account recovery and security emails are tenant-neutral and reveal no tenant list.

### 10.5 Tenant Entity

A Tenant represents one university. It owns:

- Branding (name, logo, primary colour, terminology labels)
- One or more Campuses
- A configurable organisational hierarchy (§12)
- An academic calendar
- Feature configuration (which modules are enabled)
- Tenant settings
- Its own audit log

---

## 11. Verification Assurance Model

### 11.1 Principle

Assurance describes evidence, not aspiration. The product must never claim stronger identity proof than the evidence supports.

### 11.2 Levels

| Level | Name | Evidence | Typical grants |
|-------|------|----------|----------------|
| L0 | Registered | Authenticated account. No credible proof of current university affiliation. | Read public tenant content only. No participation. |
| L1 | Weak Affiliation | Campus invite/access code, self-declared student information, or weak/manual evidence. | Read appropriate campus information. Save, follow, RSVP, Daily Quiz. Not polls, not Student Voice. |
| L2 | Roster Match | Student details match an approved university roster. A roster match alone does not prove identity where student numbers and surnames are guessable by a classmate. | Everything at L1, plus polls where the tenant permits L2 participation, plus Student Voice where enabled. |
| L3 | Strong Institutional Proof | Roster match plus OTP/link delivered to a contact channel supplied by the institution or present on the roster; or an institutional identity mechanism tied to current enrolment; or appropriately reviewed strong evidence. | Full student participation. Default requirement for polls where the tenant sets a high-integrity threshold. |

### 11.3 Privileged Identity Assurance — Separate Track

Privileged staff and Guild verification is not "L4 student verification". It is a distinct process:

- Identity confirmed by a named institutional or Guild authority, recorded with the confirming party
- Mandatory MFA enrolment before the grant activates
- Grant bound to the current Guild Term
- Separate audit trail

> Treating administrator identity as a higher rung on the student ladder is a category error and is explicitly rejected.

### 11.4 The OTP Principle

OTP proves control of a contact channel. It does not automatically prove student identity.

If an OTP is sent to an email address or phone number that the applicant entered freely, it proves only that the applicant controls that address. It must not increase identity assurance. Verification logic must reflect the provenance of the contact channel:

| Channel provenance | Effect |
|--------------------|--------|
| Applicant-supplied channel | Contact verification only, no assurance uplift |
| Roster-supplied channel | Assurance uplift to L3 on successful OTP |
| Institutional domain email where the institution attests the domain is issued only to current students | Assurance uplift, but only to the level the attestation supports |

### 11.5 Pilot Verification Methods

- **CSV roster import** — preferred low-integration onboarding mechanism
- **Institutional email** — where the tenant attests it is meaningful
- **Campus invite/access codes** — L1 only, rate-limited, velocity-alerted
- **Limited manual review fallback** — capped, checklist-driven, reviewer identity recorded

CampusHub is not building an enterprise identity-management product. SSO and SIS integration are out of scope for all three releases in this document.

---

## 12. Organisational Hierarchy Model

### 12.1 Structure

A tenant configures its own hierarchy. CampusHub supplies a flexible structure, not any specific university's org chart:

- **Campus** — mandatory, at least one. Not retrofittable; see §34 dangerous assumptions.
- **Academic division** — Faculty / College / School / Department. Tenant chooses the label and the depth (one or two levels in Pilot).
- **Programme** — course of study.
- **Academic year** — year of study (1..n), tenant-configurable range.
- **Residence / Hall** — optional; where used, non-resident students are a first-class cohort, not an omission.
- **Other institution-specific structures** — supported as tenant-defined optional attributes in Commercial V1; Pilot supports the above.

Terminology is tenant-configurable: "Faculty" vs "College" vs "School"; "Guild" vs "Students' Association"; "Hall" vs "Residence".

### 12.2 Change Over Time

Hierarchy changes must never corrupt historical attribution. The requirements:

| Change | Requirement |
|--------|-------------|
| Faculty/programme rename | Identity of the node is preserved; the label changes; historical records display the label current at the time of the record, with the current label available. |
| Programme merge | Both source nodes remain resolvable; memberships move forward from an effective date; historical poll and analytics attribution stays with the node that was current at event time. |
| Year progression | Bulk, tenant-initiated, effective-dated, reversible within a window; does not alter frozen cohort attributions on closed polls or completed periods. |
| Repeat year / leave of absence | Membership year attribute is corrected prospectively; membership state may be `on_leave`; content access continues unless the tenant configures otherwise. |
| Campus change | Prospective; frozen attributions on closed items are unchanged. |
| Transfer out | Membership terminal state; new Membership in the new tenant (§10.3). |

> **Attribution freeze rule:** Any attribute used for eligibility or reporting on a poll, a period, or a closed record is frozen at the time of the event, not resolved live. This single rule prevents the entire class of "student changed faculty and the historical report changed" defects.

Implementation depth of hierarchy versioning is an architecture-phase decision; the product requirement is the attribution freeze rule and non-destructive rename/merge.

---

## 13. Major User Journeys

Summarised here; each is covered by named stories in §18.

| Journey | Stories |
|---------|---------|
| **Onboarding and identity.** Registration with minimal fields → contact channel verification → roster claim → assurance level assigned → progressive profile as needed. Student changes email, student changes phone, lost credential recovery, privileged MFA recovery, shared-device logout and session review. | CH-AUT-005, CH-AUT-006, CH-AUT-007, CH-AUT-008 |
| **Multiple and changing affiliation.** Student holds memberships in two universities and switches context. Student transfers university. Student becomes alumni. A person is simultaneously a student and a staff Publisher. A University Official leaves employment. A Publisher leaves office early. | CH-MEM-003..006, CH-GOV-004 |
| **Institutional change.** Faculty or programme renamed. Programme merged. Year progression. Repeat year and leave of absence. | CH-ORG-002, CH-ORG-003 |
| **Publishing and correction.** Publication drafted, targeted, published, corrected. Priority Notice issued in error and retracted. Confidential attachment uploaded by mistake and redacted. | CH-PUB-002, CH-PUB-004, CH-PUB-006, CH-CNT-002 |
| **Participation.** Student meets a faculty-gated poll without a verified faculty and completes contextual gating. Poll published to the wrong audience and corrected. Poll voided in an emergency. | CH-PRO-003, CH-POL-007 |
| **Trust incidents.** Guild Admin account compromised. Erroneous XP award reversed. Student requests deletion and has historical Voice contribution. | CH-GOV-005, CH-XP-004, CH-PRV-003 |
| **Commercial lifecycle.** Tenant suspended with active content. University exits CampusHub. | CH-SUB-002, CH-SUB-003 |

---

## 14. Student Information Architecture Principles

> ⚠️ **BLOCKER BEFORE UX DESIGN** — final IA must be validated against reference designs and student research.

The preferred conceptual structure, to be tested not assumed:

| Destination | Purpose |
|-------------|---------|
| **Home** | Personalised campus pulse. What matters on my campus right now. |
| **Discover** | Campus news, events, sports, opportunities. |
| **Participate** | Polls; Student Voice where available. |
| **Play** | Daily Quiz, XP, Level, Streak. |
| **Me** | Profile, verification, saves, follows, settings. |

**Principles:**

- Maximum five primary destinations. Adding a sixth requires removing one.
- Notifications are an icon and a centre, not a primary navigation destination.
- Guild information (office holders, contact, about) lives contextually — under Home or Me — not as a permanent navigation tab.
- Play must not be the first or most prominent tab. If Pilot research shows Play crowding out Discover, Play becomes a card on Home rather than a destination.
- The Home surface uses deterministic, understandable ranking in Pilot. No ML recommendations. A student and an administrator must both be able to predict why an item appears where it does.
- Every list has defined empty, loading, error and offline states.
- Where a student cannot act (poll not eligible, opportunity expired), the interface explains why rather than hiding the item silently.

**Home content candidates**, in a deterministic priority order to be fixed at design time:

1. Active Priority Notice
2. Latest publication
3. Current poll the student is eligible for
4. Upcoming event
5. Sports fixture or result
6. Opportunity deadline approaching
7. Student Voice update if enabled
8. Daily Quiz
9. XP/Level/Streak status

> XP status must sit below campus information, never above it.

---

## 15. Admin Information Architecture Principles

The Guild workspace is grouped around jobs to be done, not around twenty modules. Modules that the tenant has not enabled are not shown at all.

| Group | Contains |
|-------|----------|
| **Overview** | Dashboard: verification funnel, weekly active, recent publications, open polls with turnout, upcoming events and fixtures, alerts |
| **Publish** | Publications, events, opportunities |
| **Engage** | Polls, Student Voice (if enabled), Daily Quiz |
| **Campus** | Sports |
| **Members** | Verification queue, roster imports, member support lookup |
| **Sponsors** | Only if sponsorship is enabled |
| **Analytics** | Defined metrics, exportable report |
| **Governance** | Team and roles, Guild Term, audit log, tenant settings |

**Principles:**

- A Publisher sees only the groups their scopes touch.
- Every destructive or high-impact action requires explicit confirmation naming the consequence and the audience size.
- Every metric shown carries an accessible definition.
- The workspace is desktop-efficient but must remain functional on a tablet or large phone for urgent publishing.

---

## 16. CampusHub Trust Invariants

These are the promises the product makes. They guide architecture and are the mandatory basis for QA's negative test suite. Each must have at least one automated test that fails the build if violated.

| ID | Invariant |
|----|-----------|
| **TI-1** | One university cannot access another university's private data — through any API, export, search index, notification, cache, media URL, background job, analytics store or backup. |
| **TI-2** | Individual poll answers are never exposed through normal product functionality. No role, view, export or support tool can reveal how a named student voted. |
| **TI-3** | Sponsors never receive student personal data. |
| **TI-4** | Sponsors cannot target students by verification assurance level, or by any behavioural signal. |
| **TI-5** | Student Voice submitter identity is protected where the feature promises privacy; access is capability-gated, justified and audited. |
| **TI-6** | Former or revoked privileged users lose server-side authority immediately. |
| **TI-7** | Prohibited advertiser categories — betting, predatory lending and the rest of the platform list — never appear, and no tenant can relax the list. |
| **TI-8** | Bulk exports of member-identifying data are exceptional, approved, limited, watermarked and audited. |
| **TI-9** | XP is explainable to the student and derived from an append-only ledger. |
| **TI-10** | Sensitive Platform access is least-privilege, time-boxed, audited and disclosed. |
| **TI-11** | The audit record of what happened is immutable; the public availability of content is not. |
| **TI-12** | The global User record contains no behavioural data from any tenant. |

---

## 17. Pilot Epic Map

| Code | Epic | Stories |
|------|------|---------|
| CH-TEN | Tenant Foundation & Configuration | 5 |
| CH-AUT | Authentication & Account Security | 8 |
| CH-MEM | Membership & Affiliation Lifecycle | 6 |
| CH-ORG | Organisational Hierarchy | 3 |
| CH-VER | Roster & Verification | 7 |
| CH-PRO | Student Profile & Progressive Profiling | 4 |
| CH-HOM | Campus Home | 3 |
| CH-PUB | Publications | 6 |
| CH-EVT | Events | 4 |
| CH-OPP | Opportunities | 4 |
| CH-SPT | Sports | 5 |
| CH-POL | Polls | 8 |
| CH-VOX | Student Voice (tenant-conditional) | 7 |
| CH-XP | XP & Levels | 5 |
| CH-STK | Streak | 3 |
| CH-QIZ | Daily Campus Quiz | 5 |
| CH-SPN | Sponsorship | 5 |
| CH-NTF | Notifications | 4 |
| CH-ANL | Analytics | 4 |
| CH-GOV | Governance, Roles, Terms & Audit | 6 |
| CH-CNT | Content Integrity & Takedown | 3 |
| CH-PRV | Privacy, Transparency & Data Rights | 5 |
| CH-PLT | Platform Operations & Support Access | 5 |
| CH-SUB | Subscription & Tenant Lifecycle | 3 |
| CH-QUA | Quality: Accessibility, Performance, Resilience | 4 |
| | **Total Pilot stories** | **117** |

---

## 18. Complete Pilot User-Story Backlog

### 18.1 CH-TEN — Tenant Foundation & Configuration

#### CH-TEN-001 — Provision a university tenant

| Field | Value |
|-------|-------|
| Release | Pilot |
| Epic | Tenant Foundation |
| Persona | Platform Operator |
| Priority | Must |

**As a** Platform Operator, **I want** to provision a new university tenant with its identity, campuses and branding, **so that** a university can operate CampusHub as its own isolated environment.

**Why it matters:** Everything else in the product is scoped to a tenant. Provisioning is the root of the isolation model.

**Acceptance criteria:**

- Given I have the `tenant.provision` capability, when I create a tenant, then I supply: university legal name, display name, unique slug, country, timezone, primary contact, and at least one Campus.
- Given a tenant is created, then it starts in the `pilot` subscription state and is not reachable by students until launched (CH-TEN-005).
- Given the slug, then it is immutable once the tenant has launched.
- Given tenant creation, then a tenant-scoped audit log is initialised and the creation event is its first entry.
- Given any tenant, then it has exactly one active Guild Term or is flagged as being in an administrative gap (CH-GOV-002).

**Permissions:** Platform Operator only.
**Dependencies:** None.
**Edge cases:** Duplicate slug rejected; timezone required (no default) because every day-boundary rule depends on it.
**Security/Privacy:** Provisioning captures no student data.
**Audit:** Tenant created, actor, timestamp.

---

#### CH-TEN-002 — Configure campuses

| Field | Value |
|-------|-------|
| Release | Pilot |
| Persona | Platform Operator / Guild Administrator |
| Priority | Must |

**As a** tenant administrator, **I want** to define the campuses of my university, **so that** content, events, fixtures and analytics can be scoped to the campus a student actually attends.

**Why it matters:** The campus dimension threads through targeting, sports, events, notifications and analytics. Retrofitting it is a rewrite (§34).

**Acceptance criteria:**

- Given a tenant, then it has at least one Campus with a name and optional short label.
- Given a Campus, then it can be marked inactive but never deleted once referenced by content or memberships.
- Given a single-campus tenant, then campus selection is hidden from student-facing UI but the dimension still exists in the data model.
- Given a member, then they belong to exactly one campus at a time.
- Given a campus change for a member, then it takes effect prospectively and does not alter frozen attributions (§12.2).

**Permissions:** Platform Operator; Guild Administrator with `tenant.configure`.
**Dependencies:** CH-TEN-001.
**Audit:** Campus created, renamed, deactivated.

---

#### CH-TEN-003 — Configure organisational hierarchy and terminology

| Field | Value |
|-------|-------|
| Release | Pilot |
| Persona | Guild Administrator |
| Priority | Must |

**As a** Guild Administrator, **I want** to configure my university's faculties, programmes, year range, residences and the words we use for them, **so that** CampusHub reflects how our institution actually describes itself.

**Acceptance criteria:**

- Given tenant configuration, then I can define academic divisions (with a tenant-chosen label: Faculty / College / School), programmes under them, the valid academic year range, and optionally residences/halls.
- Given residences are configured, then a "non-resident" cohort exists as a first-class option, not as an absence of data.
- Given terminology, then I can set the tenant labels for at least: academic division, Guild, residence.
- Given hierarchy nodes, then they can be renamed without breaking historical attribution (§12.2).
- Given a hierarchy node referenced by any membership or content, then it cannot be hard-deleted; it can only be deactivated.

**Permissions:** Guild Administrator with `tenant.configure`; Platform Operator.
**Dependencies:** CH-TEN-001.
**Edge cases:** Attempt to reduce the year range below values already in use is rejected with the affected count shown.
**Audit:** Hierarchy node created/renamed/deactivated; terminology changed.

---

#### CH-TEN-004 — Configure academic calendar periods

| Field | Value |
|-------|-------|
| Release | Pilot |
| Persona | Guild Administrator |
| Priority | Should |

**As a** Guild Administrator, **I want** to record term, recess and examination periods, **so that** CampusHub does not punish students for being away during a known university recess and so that engagement figures can be read in context.

**Why it matters:** Without a calendar concept, Streak breaks en masse at recess and analytics become uninterpretable.

**Acceptance criteria:**

- Given tenant configuration, then I can define non-overlapping periods with a type (term, recess, exam) and dates.
- Given a recess period, then Streak does not decrement or reset during it (CH-STK-002).
- Given analytics time series, then period bands are available as context.
- Given no calendar is configured, then Streak behaves as if all days are term days and the tenant sees a configuration prompt.

**Permissions:** Guild Administrator with `tenant.configure`.
**Dependencies:** CH-TEN-001.
**Open decisions:** Whether recess handling is "freeze" (streak paused) or "grace" (missed days ignored). Recommendation: freeze — simpler to explain to a student. Blocker before implementation of CH-STK-002.

---

#### CH-TEN-005 — Feature configuration and launch readiness

| Field | Value |
|-------|-------|
| Release | Pilot |
| Persona | Platform Operator |
| Priority | Must |

**As a** Platform Operator, **I want** a tenant to pass a readiness check before students can access it, **so that** no university launches into an empty, unstaffed or misconfigured environment.

**Why it matters:** The most common cause of a failed pilot is a live app with nothing in it. This is the highest-ROI operational control in the specification.

**Acceptance criteria:**

- Given a tenant, then each optional module (Student Voice, Sponsorship, Daily Quiz, Sports) has an explicit enabled/disabled state, default disabled, and disabled modules are hidden from both student and admin interfaces entirely.
- Given the launch action, then it is blocked unless: at least one Campus exists; hierarchy is configured; at least one Guild Administrator with MFA enrolled exists; an active Guild Term exists; at least three published items of campus content exist; the student transparency page content is complete; and — if Student Voice is enabled — the readiness checks in CH-VOX-001 all pass.
- Given the check fails, then I see exactly which conditions are unmet.
- Given launch, then it is audited and the tenant becomes reachable by students.

**Permissions:** Platform Operator.
**Dependencies:** CH-TEN-001..004, CH-GOV-001, CH-PRV-001.
**Audit:** Launch attempted, conditions unmet, launch completed.

---

### 18.2 CH-AUT — Authentication & Account Security

#### CH-AUT-001 — Register an account

| Field | Value |
|-------|-------|
| Release | Pilot |
| Persona | Student |
| Priority | Must |

**As a** prospective student user, **I want** to create an account with the minimum possible information, **so that** I can get into CampusHub quickly and find out whether it is useful to me.

**Why it matters:** Registration friction is the single largest drop-off point. Every field added must earn its place.

**Preconditions:** The tenant is launched, or the student is registering via a tenant-specific entry point.

**Acceptance criteria:**

- Given registration, then I supply only: name, one contact channel (email or phone), and a password; and I confirm the Terms and Privacy Notice with an unticked checkbox.
- Given registration, then the student transparency page (CH-PRV-001) is reachable before I complete it.
- Given I submit, then my contact channel receives a verification OTP or link, and I reach an L0 — Registered state.
- Given my contact channel is already registered, then I receive a neutral message and an email/SMS to the existing account rather than a disclosure that the account exists.
- Given registration, then no student number, faculty, year, date of birth, or photograph is requested.
- Given password entry, then the password is checked against a breached-password list and a minimum-length rule, with clear inline guidance.

**Permissions:** Public.
**Dependencies:** CH-TEN-005, CH-PRV-001.
**Edge cases:** OTP not received → resend with rate limit and a clear alternative channel path; expired OTP → re-request without re-entering all details.
**Security/Privacy:** Neutral responses prevent account enumeration; consent recorded with version, timestamp and method.
**Audit:** Registration, consent record.

---

#### CH-AUT-002 — Verify a contact channel

| Field | Value |
|-------|-------|
| Release | Pilot |
| Persona | Student |
| Priority | Must |

**As a** user, **I want** to prove I control my email or phone, **so that** CampusHub can reach me reliably and recover my account safely.

**Acceptance criteria:**

- Given an unverified channel, then it can be verified by OTP or signed link, valid for a short defined window, single-use.
- Given verification succeeds, then the channel is marked verified with a timestamp and the provenance of the channel (`self_supplied` or `roster_supplied`) is recorded.
- Given the channel is `self_supplied`, then verification does not increase identity assurance (§11.4) — it only enables communication and recovery.
- Given repeated OTP requests, then rate limits and lockout apply per channel and per IP.

**Security/Privacy:** Channel provenance is a required field on every verified channel; it is the mechanism that keeps the OTP principle enforceable.
**Dependencies:** CH-AUT-001.

---

#### CH-AUT-003 — Log in and log out

| Field | Value |
|-------|-------|
| Release | Pilot |
| Persona | All users |
| Priority | Must |

**Acceptance criteria:**

- Given valid credentials, then I am authenticated and land on my active tenant's Home; where I have multiple memberships, the tenant switcher shows my active context (CH-MEM-003).
- Given failed attempts, then progressive delay and lockout apply, with neutral messaging.
- Given logout, then the session is invalidated server-side, not merely cleared client-side.
- Given a privileged role, then MFA is required at login (CH-AUT-004).

---

#### CH-AUT-004 — MFA for privileged roles

| Field | Value |
|-------|-------|
| Release | Pilot |
| Persona | Guild Administrator, Publisher, Voice Moderator, Custodian, University Official, Platform Operator |
| Priority | Must |

**As a** privileged user, **I want** a second authentication factor to be mandatory, **so that** a phished password cannot be used to broadcast to the whole university or access sensitive data.

**Acceptance criteria:**

- Given a privileged grant is issued, then it does not activate until the grantee enrols a second factor.
- Given a privileged session, then MFA is required at login and re-authentication is required before: role grants, roster import, bulk export request, poll void, Priority Notice publication, Student Voice identity access, sponsor campaign approval.
- Given a student with no privileged grant, then MFA is optional but offered.
- Given a factor is enrolled, then recovery codes are issued once and their generation is audited.

**Dependencies:** CH-GOV-001.
**Audit:** MFA enrolled, reset, re-authentication for sensitive action.

---

#### CH-AUT-005 — Recover a lost credential

| Field | Value |
|-------|-------|
| Release | Pilot |
| Persona | Student |
| Priority | Must |

**As a** student who has lost access to my password, **I want** a safe recovery path, **so that** I can get back into my account without that path becoming a way for someone else to take it over.

**Why it matters:** Account recovery is the most common takeover vector for a verified account, which is more valuable than an unverified one.

**Acceptance criteria:**

- Given a recovery request, then it is initiated against a verified contact channel and returns a neutral response regardless of whether the account exists.
- Given recovery completes, then all existing sessions are invalidated and a security notification is sent to every verified channel on the account.
- Given the account holds a verified Membership at L2 or above, then recovery does not change any verified attribute and does not alter assurance level.
- Given the account holds a privileged grant, then standard recovery is insufficient — CH-AUT-008 applies.
- Given recovery, then it is rate-limited per account and per source.

**Security/Privacy:** Recovery never discloses the tenant(s) a user belongs to.
**Audit:** Recovery initiated, completed, sessions invalidated.

---

#### CH-AUT-006 — Change email or phone safely

| Field | Value |
|-------|-------|
| Release | Pilot |
| Persona | Student |
| Priority | Must |

**As a** student whose number or email has changed, **I want** to update it safely, **so that** I keep access to CampusHub without opening a door for someone else.

**Acceptance criteria:**

- Given a channel change, then I must re-authenticate, verify the new channel, and the old channel is notified of the change with a "this wasn't me" link.
- Given the old channel is unreachable, then the change requires either the second verified channel or a manual review path (CH-VER-006).
- Given a channel was `roster_supplied` and contributed to L3 assurance, then replacing it with a `self_supplied` channel does not remove existing L3 assurance but the new channel is recorded as `self_supplied` and cannot be used to re-establish L3 later.
- Given the change completes, then a cooling-off notice is sent and recovery via the new channel is delayed by a short defined window.

**Edge cases:** Student changes phone while a poll they are eligible for is open — no effect on eligibility.
**Audit:** Channel added, verified, removed; provenance recorded.

---

#### CH-AUT-007 — Review and end sessions (shared-device safety)

| Field | Value |
|-------|-------|
| Release | Pilot |
| Persona | Student |
| Priority | Must |

**As a** student who sometimes uses a friend's phone or a library computer, **I want** to see and end my active sessions, **so that** I am not permanently logged in on a device I do not control.

**Why it matters:** Device sharing is common. A permanently logged-in session on a shared phone exposes the student's Voice submissions, saved items and profile.

**Acceptance criteria:**

- Given my security settings, then I see my active sessions with approximate device, last-active time and location coarseness, and I can end any or all of them.
- Given login on a new device, then I receive a security notification.
- Given the login screen, then a clearly labelled "this is a shared device" option issues a short-lived session that does not persist and requires re-authentication for sensitive actions.
- Given inactivity, then sessions expire after a defined idle window, shorter for privileged roles.

---

#### CH-AUT-008 — Privileged MFA recovery

| Field | Value |
|-------|-------|
| Release | Pilot |
| Persona | Guild Administrator, Custodian, Platform Operator |
| Priority | Must |

**As a** Guild Administrator who has lost my second factor, **I want** a controlled recovery path, **so that** the Guild is not locked out — without that path becoming the weakest link in privileged security.

**Acceptance criteria:**

- Given a privileged user loses their factor, then self-service recovery via a contact channel alone is not permitted.
- Given recovery, then it requires either an unused recovery code plus re-authentication, or approval by the Tenant Custodian, or — where the Custodian is unavailable — a Platform break-glass action with two-person approval (CH-PLT-004).
- Given recovery by Custodian or Platform, then the privileged grants are suspended until a new factor is enrolled, and the tenant audit log records the event prominently.
- Given recovery completes, then all sessions for that user are invalidated and every other privileged user in the tenant is notified.

**Dependencies:** CH-GOV-003, CH-PLT-004.
**Security/Privacy:** This is a deliberate friction point; the specification accepts that a Guild Admin may be locked out for hours rather than accepting a weak reset path.

---

### 18.3 CH-MEM — Membership & Affiliation Lifecycle

#### CH-MEM-001 — Join a university tenant

| Field | Value |
|-------|-------|
| Release | Pilot |
| Persona | Student |
| Priority | Must |

**As a** registered user, **I want** to join my university on CampusHub, **so that** I can see my campus content and participate.

**Acceptance criteria:**

- Given an authenticated user, then I can join a launched tenant via a tenant entry point, a campus invite code, or by selecting the university from a list of launched tenants.
- Given I join, then a Membership is created at L0 (or L1 if joined via a valid invite code) and I select a Campus.
- Given a Membership exists, then all my behaviour within that tenant is recorded against the Membership, never against the global User (§10.1).
- Given I already hold a Membership in this tenant, then joining again is prevented and I am taken to my existing Membership.

**Security/Privacy:** The list of launched tenants is public; the list of my tenants is visible only to me and to support with explicit tenant context.

---

#### CH-MEM-002 — Membership states

| Field | Value |
|-------|-------|
| Release | Pilot |
| Persona | System / Guild Administrator |
| Priority | Must |

**As** the platform, **I need** a clear membership state machine, **so that** access, participation and reporting behave predictably as a student's relationship with the university changes.

**Acceptance criteria:**

- Given Membership, then valid states are: `unverified`, `pending_review`, `verified`, `stale`, `on_leave`, `alumni`, `transferred_out`, `participation_suspended`, `suspended`, `closed`.
- Given `stale` (roster no longer contains the record after a refresh, plus a grace period), then read access continues but participation gates requiring L2+ are not met until re-verification.
- Given `participation_suspended`, then the member reads content but cannot vote, submit Voice, RSVP or earn XP.
- Given `suspended`, then the member cannot access tenant content; the reason is recorded and the member is informed of the category of reason.
- Given any state transition, then it is audited with actor and reason.

**Edge cases:** A member in `stale` who appears in a later roster refresh returns to `verified` at their previous assurance level without re-doing OTP, provided the matched record is the same record.

---

#### CH-MEM-003 — Hold memberships in two universities

| Field | Value |
|-------|-------|
| Release | Pilot |
| Persona | Student |
| Priority | Must |

**As a** student affiliated with two universities, **I want** each to be a separate, clearly labelled context, **so that** my activity at one is never visible to, or mixed with, the other.

**Why it matters:** This is the journey that stress-tests the global User boundary. If it is not designed now, cross-tenant leakage will be discovered in production.

**Acceptance criteria:**

- Given I hold more than one Membership, then the interface displays my active tenant persistently and provides an explicit switcher.
- Given I switch tenant, then the entire application context changes: Home, notifications, profile, XP, Level, Streak, saves and Voice history are all tenant-local.
- Given either tenant's administrators, then they cannot discover that I hold a Membership elsewhere through any view, export, search or support tool.
- Given my notification centre, then notifications are grouped by tenant and never combined into a single undifferentiated list.
- Given a single-membership user, then no switcher is shown and no tenant-selection concept is surfaced.

**Security/Privacy:** TI-1, TI-12. Requires a negative test asserting no API response in tenant A contains any reference to tenant B.

---

#### CH-MEM-004 — Transfer to another university

| Field | Value |
|-------|-------|
| Release | Pilot |
| Persona | Student |
| Priority | Should |

**As a** student who has transferred university, **I want** to join my new university's CampusHub cleanly, **so that** I get the right campus content without dragging my old institution's records with me.

**Acceptance criteria:**

- Given I transfer, then I join the new tenant as a fresh Membership (CH-MEM-001) and verify against the new roster independently.
- Given the new Membership, then XP, Level, Streak, poll participation, Voice history and saves start empty. This is stated to the student plainly at join time.
- Given the old Membership, then the tenant may set it to `transferred_out`; its historical content attribution and audit entries remain within the old tenant.
- Given the student, then they may leave the old Membership themselves, which sets it to `closed` and triggers the deletion behaviour in CH-PRV-003.

---

#### CH-MEM-005 — Become an alumnus

| Field | Value |
|-------|-------|
| Release | Pilot |
| Persona | Student |
| Priority | Should |

**As a** graduating student, **I want** a clear and dignified transition, **so that** I understand what happens to my account when I stop being a student.

**Acceptance criteria:**

- Given a roster refresh marks a record as graduated, or the tenant runs a graduation action, then the Membership becomes `alumni` after a notified grace period.
- Given `alumni`, then read access to public tenant content continues if the tenant permits it; participation gates requiring current enrolment are not met; XP and Level are retained and displayed as historical.
- Given `alumni`, then the member is excluded from "verified current student" audience counts used in analytics and sponsorship.
- Given the transition, then the member is notified in advance and told what changes.

**Open decisions:** Whether alumni retain read access by default. Recommendation: tenant-configurable, default read-only access retained. Can defer.

---

#### CH-MEM-006 — Staff/student dual role

| Field | Value |
|-------|-------|
| Release | Pilot |
| Persona | Postgraduate tutor, staff member studying part-time |
| Priority | Should |

**As** someone who is both a student and a Publisher at the same university, **I want** one account that carries both, **so that** I am not forced to maintain two logins and two identities.

**Acceptance criteria:**

- Given one Membership, then it may simultaneously hold the Student Member role and one or more privileged grants.
- Given a privileged grant is held, then MFA is mandatory for the whole account (CH-AUT-004).
- Given I act as a Publisher, then content is attributed to the office, not to my student identity.
- Given I participate as a student (poll, quiz, Voice), then my privileged role confers no advantage and no visibility of others' individual participation.
- Given the interface, then there is a clear, explicit distinction between "student view" and "workspace", and privileged actions are never available from the student surface.

**Security/Privacy:** A Guild Administrator voting in their own poll is permitted; a Guild Administrator seeing individual answers is not, and is prevented structurally (TI-2).

---

### 18.4 CH-ORG — Organisational Hierarchy

#### CH-ORG-001 — Assign a member to the hierarchy

| Field | Value |
|-------|-------|
| Release | Pilot |
| Persona | Student / System |
| Priority | Must |

**Acceptance criteria:**

- Given a Membership, then it carries: campus (required), academic division, programme, academic year, and optionally residence or non-resident.
- Given a roster match, then these attributes are populated from the roster and flagged `roster_derived`.
- Given no roster data for a field, then it may be `self_declared` and is flagged as such (CH-PRO-002).
- Given an eligibility-sensitive decision (poll audience, targeted publication), then `self_declared` values are used only where the content owner has explicitly permitted low-assurance eligibility (CH-POL-002).

---

#### CH-ORG-002 — Rename or merge hierarchy nodes without corrupting history

| Field | Value |
|-------|-------|
| Release | Pilot |
| Persona | Guild Administrator |
| Priority | Must |

**As a** Guild Administrator whose university has renamed a faculty or merged two programmes, **I want** the change to apply going forward without rewriting the past, **so that** historical polls and reports remain truthful.

**Acceptance criteria:**

- Given a rename, then the node identity is unchanged and both the current and historical labels are retained with effective dates.
- Given a merge, then memberships move to the surviving node from an effective date; both source nodes remain resolvable for historical display; no historical record is re-attributed.
- Given any closed poll, completed report or finalised period, then its frozen attribution values are unchanged by subsequent renames or merges (§12.2 attribution freeze rule).
- Given a rename or merge, then the affected membership count is shown before confirmation, and the action is audited.

**Edge cases:** Merging a node that is referenced by an open poll's audience — blocked until the poll closes, with a clear explanation.

---

#### CH-ORG-003 — Year progression, repeat year and leave of absence

| Field | Value |
|-------|-------|
| Release | Pilot |
| Persona | Guild Administrator |
| Priority | Should |

**Acceptance criteria:**

- Given a year progression action, then I select the memberships in scope, preview the count, and apply an increment with an effective date; the action is reversible within a defined window.
- Given a student who repeats a year, then a roster refresh or a manual correction sets the correct year prospectively; no historical attribution changes.
- Given a leave of absence recorded on the roster or applied manually, then the Membership state becomes `on_leave`; read access continues; participation gates requiring current enrolment are configurable by the tenant, default permitted.
- Given progression, then it never alters XP, Level, Streak or closed-poll attribution.

**Audit:** Progression run, count affected, actor, reversal if any.

---

### 18.5 CH-VER — Roster & Verification

#### CH-VER-001 — Import a student roster from CSV

| Field | Value |
|-------|-------|
| Release | Pilot |
| Persona | Guild Administrator |
| Priority | Must |

**As a** Guild Administrator, **I want** to import the university's student roster from a CSV file, **so that** students can verify themselves without CampusHub needing an integration with the SIS.

**Why it matters:** CSV is the preferred low-integration onboarding mechanism and the practical route to real verification in year one.

**Acceptance criteria:**

- Given an import, then I upload a delimited file and map columns to: student number (required), surname (required), given names, academic division, programme, year, campus, residence, institutional email, institutional phone.
- Given the file, then encoding, delimiter and header variations are handled, and rows are validated for: missing required fields, malformed student numbers against a tenant-configured pattern, duplicate student numbers within the file, and implausible values (year out of configured range, unknown programme).
- Given import, then I must attest that the university has a lawful basis to supply this data; the attestation is recorded with my identity and timestamp.
- Given a file that appears to belong to another institution (student-number pattern mismatch above a threshold, or a domain mismatch in emails), then the import is quarantined with a prominent warning and requires explicit override.
- Given the source file, then it is retained only as long as needed to complete and audit the import, then deleted (§CH-PRV-005).

**Permissions:** Guild Administrator with `roster.import`; re-authentication required.
**Security/Privacy:** CSV content is treated strictly as data — never evaluated as formula, markup or command, on import or on export.
**Audit:** Import initiated, file hash, row counts, attestation, outcome.

---

#### CH-VER-002 — Preview before committing an import

| Field | Value |
|-------|-------|
| Release | Pilot |
| Persona | Guild Administrator |
| Priority | Must |

**As a** Guild Administrator, **I want** to see exactly what an import will do before it does it, **so that** I do not corrupt the roster of 30,000 students with one bad file.

**Acceptance criteria:**

- Given a validated file, then I see a preview: rows to be added, rows to be updated (with fields changing), rows in the current roster absent from the file, rows rejected with reasons, and the count of already-claimed records affected.
- Given an import mode, then I choose `add_and_update` (default) or `full_replace`; `full_replace` requires an additional confirmation naming the number of records that will be marked absent.
- Given claimed records, then an update never silently changes an attribute that contributed to a member's assurance level without flagging it in the preview.
- Given I commit, then an immutable import report is stored and is viewable in import history.
- Given I do not commit within a defined window, then the staged import expires and the file is deleted.

**Dependencies:** CH-VER-001.

---

#### CH-VER-003 — Roster refresh, stale and withdrawn records

| Field | Value |
|-------|-------|
| Release | Pilot |
| Persona | Guild Administrator |
| Priority | Must |

**Acceptance criteria:**

- Given a refresh where a previously present record is absent, then the record is marked `not_in_current_roster` and the linked Membership enters a notified grace period before becoming `stale` (CH-MEM-002).
- Given a record explicitly marked withdrawn or graduated in the file, then the Membership transitions accordingly (`suspended` or `alumni`) after notification.
- Given a record returns in a later refresh, then the Membership returns to `verified` at its prior assurance level.
- Given the grace period length, then it is a tenant setting with a platform-bounded range and a safe default.

**Edge cases:** A partial or truncated file must not mass-mark students absent — this is why `full_replace` requires explicit confirmation with counts (CH-VER-002).

---

#### CH-VER-004 — Claim a roster record (L2)

| Field | Value |
|-------|-------|
| Release | Pilot |
| Persona | Student |
| Priority | Must |

**As a** student, **I want** to prove I am on my university's roster, **so that** I can participate in polls and other verified activity.

**Acceptance criteria:**

- Given verification, then I supply my student number and surname; on an exact match against an unclaimed roster record, the record is claimed and my Membership reaches L2.
- Given a mismatch, then the error message is neutral and does not reveal whether the student number exists.
- Given repeated attempts, then strict rate limiting and lockout apply per account, per student number and per source.
- Given a record is already claimed, then the attempt is refused and raises a claim-dispute signal (CH-VER-006) rather than a plain error.
- Given L2 is reached, then the product states honestly in the UI what L2 means: "We've matched you to the university roster."

**Security/Privacy:** Student numbers are often patterned and semi-public. L2 is deliberately described as a roster match, not as identity proof (§11.2).
**Audit:** Claim attempted, succeeded, failed, rate-limited.

---

#### CH-VER-005 — Reach strong assurance (L3)

| Field | Value |
|-------|-------|
| Release | Pilot |
| Persona | Student |
| Priority | Must |

**As a** student, **I want** to reach the strongest verification my university supports, **so that** I can take part in everything CampusHub offers.

**Acceptance criteria:**

- Given the claimed roster record contains an institution-supplied contact channel, then CampusHub offers OTP to that channel (partially masked, never revealed in full), and success raises assurance to L3.
- Given the roster contains no institutional contact, then L3 is reachable via institutional email verification only where the tenant has attested that the email domain is issued exclusively to current students; otherwise via manual review (CH-VER-006).
- Given a channel the student supplied themselves, then OTP to it never raises assurance (§11.4). The UI does not offer it as a verification route.
- Given the tenant cannot support any L3 route, then the tenant operates at L2 as its participation threshold and this is disclosed in tenant analytics and on the transparency page.

**Dependencies:** CH-VER-004, CH-AUT-002.
**Security/Privacy:** Channel provenance is the load-bearing field; it must be present on every channel.

---

#### CH-VER-006 — Manual review and claim disputes

| Field | Value |
|-------|-------|
| Release | Pilot |
| Persona | Guild Administrator |
| Priority | Must |

**As a** Guild Administrator, **I want** a controlled manual path for students who cannot verify automatically, and a way to resolve two people claiming the same record, **so that** genuine students are not shut out and impostors are not admitted.

**Acceptance criteria:**

- Given a student cannot verify automatically, then they can submit a review request with evidence from a tenant-configured list; the request enters a queue with an SLA target.
- Given a review decision, then the reviewer selects from a fixed checklist of what was verified, records a reason, and their identity is recorded. A decision without a checklist entry is not possible.
- Given approval, then the resulting assurance level reflects the evidence checked, not a default — a reviewer may grant L2 or L3 depending on the checklist, and the UI makes this explicit.
- Given a claim dispute, then both accounts' claims on that record are frozen pending review; neither participates at L2+ while frozen; both parties are notified.
- Given manual review volume, then it is monitored and an alert fires above a configured rate — high manual volume signals a roster problem, not a support problem.
- Given a rejection, then the student may appeal once, reviewed by a different person where staffing allows.

**Permissions:** Guild Administrator with `verification.decide`.
**Audit:** Every review decision with reviewer, checklist, outcome, reason.

---

#### CH-VER-007 — Campus invite codes (L1)

| Field | Value |
|-------|-------|
| Release | Pilot |
| Persona | Guild Administrator |
| Priority | Should |

**As a** Guild Administrator, **I want** to distribute a campus access code at orientation, **so that** students can get useful campus information immediately even before the roster is ready.

**Acceptance criteria:**

- Given a code, then it has an expiry, an optional maximum redemption count, and an optional campus scope.
- Given redemption, then the Membership reaches L1 only; the UI states clearly that further verification is needed for polls and Student Voice.
- Given redemption velocity above a configured threshold, then the code is auto-suspended and the Guild Administrator is alerted — codes leak.
- Given a code, then it can be revoked at any time without affecting memberships already created.
- Given an L1 member, then they may later claim a roster record and move to L2/L3 without creating a second Membership.

**Security/Privacy:** L1 must never satisfy a poll eligibility gate unless the poll owner has explicitly chosen L1 and been warned of the integrity implication.

---

### 18.6 CH-PRO — Student Profile & Progressive Profiling

#### CH-PRO-001 — Progressive profile completion

| Field | Value |
|-------|-------|
| Release | Pilot |
| Persona | Student |
| Priority | Must |

**As a** student, **I want** CampusHub to ask for information only when it actually needs it, **so that** I am not filling in forms before I know whether the app is worth using.

**Acceptance criteria:**

- Given registration, then only the fields in CH-AUT-001 are collected.
- Given my profile, then remaining fields can be completed at any time from Me, or in context when needed (CH-PRO-003).
- Given a profile field, then CampusHub never blocks access to campus information to force completion.
- Given profile completion, then it may award XP once per field at a low value (CH-XP-002) — but the prompt must never be the reason a gate exists.
- Given the profile screen, then each field displays its classification (CH-PRO-002) so the student understands what the university already knows about them.

> **Anti-pattern explicitly prohibited:** Creating a profile gate in order to increase profile-completion metrics.

---

#### CH-PRO-002 — Field classification

| Field | Value |
|-------|-------|
| Release | Pilot |
| Persona | System / Student |
| Priority | Must |

**As** the platform, **I need** every profile field to carry a provenance classification, **so that** eligibility decisions never blindly trust data the student typed in themselves.

**Acceptance criteria:**

- Given any profile field, then it carries exactly one classification: `institution_verified`, `roster_derived`, `self_declared`, or `optional`.
- Given a field, then whether it is collected at all, and whether it is required for any purpose, is tenant-configurable within platform bounds.
- Given a `roster_derived` field, then the student cannot edit it directly; they can raise a correction request (CH-PRO-004).
- Given a `self_declared` field used for eligibility, then the consuming feature must explicitly opt in to accepting self-declared values and must disclose that it has done so.
- Given the student, then they can see each field's classification in plain language ("Your university told us this" / "You told us this").

**Security/Privacy:** Date of birth is not a Pilot field (§18.10, §27.6). No field exists solely to serve advertising.

---

#### CH-PRO-003 — Contextual profile gating with return-to-action

| Field | Value |
|-------|-------|
| Release | Pilot |
| Persona | Student |
| Priority | Must |

**As a** student who has just tapped on a poll for my faculty, **I want** CampusHub to tell me what it needs and why, let me provide it, and then put me back exactly where I was, **so that** the interruption feels helpful rather than obstructive.

**Why it matters:** This pattern is one of the strongest UX ideas in the product. It converts a dead end into a completed action.

**Acceptance criteria:**

- Given I attempt an action requiring information CampusHub does not hold, then the system identifies the specific missing attribute — not a generic "complete your profile".
- Given the prompt, then it explains why the information is needed for this action, in one sentence ("This poll is for Faculty of Science students. We need to confirm your faculty.").
- Given the information is `roster_derived` and available, then it is offered for confirmation rather than entry.
- Given the information is not available, then I either enter it (if the action accepts self-declared values) or I am shown the verification route that would satisfy it.
- Given I complete or verify, then I am returned to the originating action, eligibility is re-evaluated, and if eligible I continue immediately without re-navigating.
- Given I decline, then I return to where I was with a clear explanation of what I cannot do and how to change that later.
- Given I am not eligible even after providing the information, then I am told plainly and the item remains visible as context, not hidden.

**Dependencies:** CH-PRO-002, CH-POL-002, CH-VER-004.
**Edge cases:** The poll closes while the student is completing the gate → clear message, no data loss, no error state.

---

#### CH-PRO-004 — Correct an institution-derived attribute

| Field | Value |
|-------|-------|
| Release | Pilot |
| Persona | Student / Guild Administrator |
| Priority | Should |

**As a** student whose faculty is recorded incorrectly, **I want** a way to get it fixed, **so that** I receive the right content and can participate where I should.

**Acceptance criteria:**

- Given a `roster_derived` field I believe is wrong, then I raise a correction request with a note; I cannot edit it directly.
- Given a request, then it appears in the Members queue for a Guild Administrator with `verification.decide`.
- Given approval, then the corrected value takes effect prospectively; it does not alter frozen attributions on closed polls or completed periods (§12.2).
- Given an open poll where the student is currently eligible, then a correction that would change eligibility does not remove an already-recorded participation.
- Given a change to an eligibility-sensitive attribute, then a cooldown applies before another change to the same field can be requested.

**Security/Privacy:** This is the anti-gaming control for attribute switching. Combined with the attribution freeze rule, it closes the "change faculty to enter a poll" vector.

---

### 18.7 CH-HOM — Campus Home

#### CH-HOM-001 — Deterministic campus Home

| Field | Value |
|-------|-------|
| Release | Pilot |
| Persona | Student |
| Priority | Must |

**As a** student, **I want** to open CampusHub and immediately see what matters on my campus right now, **so that** I do not have to hunt through sections.

**Why it matters:** Home is the product. If it is not excellent, nothing else matters.

**Acceptance criteria:**

- Given I open Home, then content is assembled by a deterministic, documented ranking — no machine learning, no opaque personalisation.
- Given ranking, then it is driven only by: item priority, recency, deadline proximity, my campus, my audience eligibility, and whether I have already acted on the item.
- Given an active Priority Notice targeted at me, then it occupies the top position and is visually distinct.
- Given an item I have already acted on (voted, RSVP'd, dismissed), then it is demoted, not repeated at the top.
- Given the Home surface, then PLAY status (XP/Level/Streak) appears below campus information, never above it, and never as a full-width interruption.
- Given no content in a section, then the section is omitted rather than shown empty.
- Given Home, then it loads within the budgets in CH-QUA-002 on a constrained connection.

**Dependencies:** CH-PUB, CH-EVT, CH-OPP, CH-SPT, CH-POL, CH-QIZ.
**Open decisions:** Exact section ordering and per-section caps. **BLOCKER BEFORE UX DESIGN.**

---

#### CH-HOM-002 — Save and follow

| Field | Value |
|-------|-------|
| Release | Pilot |
| Persona | Student |
| Priority | Should |

**As a** student, **I want** to save an opportunity or follow a team, **so that** I can come back to it and be told when something changes.

**Acceptance criteria:**

- Given any opportunity, event, publication or team, then I can save or follow it with a single action, reflected immediately.
- Given a saved opportunity with a deadline, then I receive a deadline reminder (CH-NTF-002).
- Given a followed team, then I receive fixture and result notifications.
- Given my saves and follows, then they are visible under Me, are tenant-local, and are never shared with sponsors or exposed to other students.
- Given saving or following, then it awards no XP — these are cheap toggles and would be farmed.

---

#### CH-HOM-003 — Public visitor surface

| Field | Value |
|-------|-------|
| Release | Pilot |
| Persona | Prospective student / unauthenticated visitor |
| Priority | Should |

**As** someone who has not yet registered, **I want** to see enough of a university's CampusHub to understand whether it is worth joining, **so that** registration is a decision rather than a leap of faith.

**Acceptance criteria:**

- Given an unauthenticated visitor, then a limited public surface shows: tenant branding, a small number of explicitly public publications, upcoming public events, published fixtures and results, and the student transparency page.
- Given the public surface, then it never shows: polls, Student Voice content, opportunity details marked internal, member counts by cohort, or any personal data.
- Given a publication, then the publisher chooses whether it is public or members-only; default members-only.
- Given search-engine indexing, then it is a tenant setting, default off for Pilot.

**Open decisions:** How much public surface is right, and whether indexing helps acquisition or creates a scraping exposure. **BLOCKER BEFORE UX DESIGN.**

---

### 18.8 CH-PUB — Publications

#### CH-PUB-001 — One publishing system

| Field | Value |
|-------|-------|
| Release | Pilot |
| Persona | Publisher |
| Priority | Must |

**As a** Publisher, **I want** one place to write anything I need to tell students, **so that** I am not choosing between two content systems that do nearly the same thing.

**Why it matters:** Announcements and campus news are the same publishing act with different presentation. Two CMSs is double the build, double the admin surface and double the confusion.

**Acceptance criteria:**

- Given publishing, then there is a single Publication entity with a type (`notice`, `news`) that controls presentation, not a separate module.
- Given a Publication, then it carries: title, body, optional image, optional attachment, type, priority (standard or priority), audience, author office attribution, publish time, and optional expiry.
- Given the admin interface, then both types are created, listed and managed in one place.
- Given the student interface, then the two types may be presented differently (a notice is compact and prominent; news has an image and a longer read) without being separate destinations.

---

#### CH-PUB-002 — Draft, schedule, publish, expire

| Field | Value |
|-------|-------|
| Release | Pilot |
| Persona | Publisher |
| Priority | Must |

**Acceptance criteria:**

- Given a Publication, then its states are `draft` → `scheduled` → `published` → `expired` | `unpublished` → `archived`.
- Given scheduling, then I may set a future publish time in the tenant timezone; the job executes in explicit tenant context.
- Given an expiry, then the item leaves Home and active listings at expiry but remains accessible in the archive unless unpublished.
- Given publication, then the audience size is displayed and confirmed before the item goes live.
- Given a tenant in a subscription state that suspends publishing (§22), then scheduled jobs do not fire and the Publisher is told why.

**Edge cases:** Scheduled item whose audience no longer exists at fire time (faculty merged) → publication is held, not silently broadcast wider, and the Publisher is alerted.

---

#### CH-PUB-003 — Audience targeting

| Field | Value |
|-------|-------|
| Release | Pilot |
| Persona | Publisher |
| Priority | Must |

**Acceptance criteria:**

- Given targeting, then I may target: entire tenant, campus, academic division, programme, academic year, residence/non-resident, or any combination of these.
- Given targeting, then eligibility is evaluated against membership attributes at send/render time, using `roster_derived` or `institution_verified` values where the publisher requires accuracy.
- Given a narrow audience, then the estimated recipient count is shown before publishing; audiences below a small floor trigger a confirmation prompt (a five-person "announcement" is probably a mistake).
- Given a published item, then its audience cannot be broadened after publication; a broader message requires a new publication.
- Given a student not in the audience, then the item does not appear anywhere in their experience.

---

#### CH-PUB-004 — Correct or retract a publication

| Field | Value |
|-------|-------|
| Release | Pilot |
| Persona | Publisher / Guild Administrator |
| Priority | Must |

**As a** Publisher who has published something wrong, **I want** to correct it visibly or take it down, **so that** students are not misled and the record shows what happened.

**Acceptance criteria:**

- Given a published item, then I can issue a correction: the item is updated and carries a visible, dated correction note describing what changed.
- Given a published item, then a Guild Administrator can unpublish it with a mandatory reason category; it disappears from student surfaces.
- Given unpublishing, then the audit record retains what was published, by whom, when, and the reason — the audit is immutable even though the public content is not (TI-11).
- Given students who were notified of the original, then a correction may be re-notified once, explicitly chosen by the Publisher, rate-limited.
- Given an unpublished item, then any notification deep-linking to it resolves to a graceful "no longer available" state, not an error.

**Dependencies:** CH-CNT-001.

---

#### CH-PUB-005 — Publication reach reporting

| Field | Value |
|-------|-------|
| Release | Pilot |
| Persona | Guild Administrator |
| Priority | Should |

**Acceptance criteria:**

- Given a published item, then I see: eligible audience size at publish, distinct members who opened it, and open rate — using the definitions in CH-ANL-001.
- Given reporting, then no individual reader is identified anywhere in the interface or in any export.
- Given a cohort below the suppression floor (CH-ANL-004), then breakdowns are suppressed and only the top-line figure is shown.

---

#### CH-PUB-006 — Priority Notices with abuse controls ⭐

| Field | Value |
|-------|-------|
| Release | Pilot |
| Persona | Guild Administrator |
| Priority | Must |

**As a** Guild Administrator, **I want** a genuinely high-signal channel for urgent campus information, and I want it to be hard to misuse, **so that** students keep trusting it.

**Why it matters:** A Priority Notice cannot be disabled by the student. That is only defensible if it is rare. If Priority Notices become the way a Guild bypasses ordinary communication limits, the channel dies and the product's credibility with it.

**Acceptance criteria:**

- Given Priority Notice publication, then it requires a narrow, separately grantable capability (`publication.priority`) that is not part of the default Publisher bundle.
- Given publication, then it requires re-authentication and an explicit confirmation screen stating the recipient count and the criteria for priority use.
- Given the tenant, then priority criteria are configured at onboarding and displayed on the confirmation screen every time.
- Given rate limiting, then a tenant-level cap applies (default: a small number per rolling 7 days, platform-bounded); exceeding it is blocked, not merely warned.
- Given a Priority Notice, then it generates a distinct audit event and increments a platform-visible counter.
- Given repeated near-limit or over-limit behaviour across periods, then Platform is alerted and may raise it with the tenant — Platform does not silently throttle.
- Given a Priority Notice issued in error, then a retraction can be issued: the notice is unpublished, a correction notice is sent to the same audience once, and the retraction is audited.

**Permissions:** `publication.priority` — grantable only by Guild Administrator, defaults to Guild Administrator only.
**Analytics:** Priority notice count per period; reach; retraction count.
**Open decisions:** The exact numeric cap. Recommendation: 2 per rolling 7 days as the default, tenant-adjustable within a platform maximum. Can defer to before Pilot launch.

---

### 18.9 CH-EVT — Events

#### CH-EVT-001 — Create and publish an event

| Field | Value |
|-------|-------|
| Release | Pilot |
| Persona | Publisher |
| Priority | Must |

**Acceptance criteria:**

- Given an event, then it carries: title, description, optional image, organiser attribution, venue as free text, start date/time, optional end date/time, campus, audience, and whether RSVP is enabled.
- Given venue, then it is text only — no map API, no geolocation, no coordinates in Pilot.
- Given publication, then the event appears on Home and in Discover for its audience until it has passed.
- Given a past event, then it moves to an archive state and is no longer surfaced on Home.

---

#### CH-EVT-002 — Organiser attribution

| Field | Value |
|-------|-------|
| Release | Pilot |
| Persona | Publisher |
| Priority | Should |

**As a** Publisher, **I want** to attribute an event to the club or office running it, **so that** students know who is behind it.

**Acceptance criteria:**

- Given an Organiser, then it is a tenant-scoped label with a name and optional logo, created and maintained by Guild Administrators.
- Given Pilot, then Organisers are attribution only — they are not account-holding entities, have no logins, and cannot publish independently. (Clubs as account-holding entities are Phase 2.)
- Given an event or publication, then it may name one Organiser.

---

#### CH-EVT-003 — RSVP and interest

| Field | Value |
|-------|-------|
| Release | Pilot |
| Persona | Student |
| Priority | Should |

**Acceptance criteria:**

- Given an event with RSVP enabled, then I can mark `going` or `interested`, and change or withdraw it until the event starts.
- Given my RSVP, then the organiser sees aggregate counts only in Pilot — there is no attendee list and no check-in (both Phase 2, and both require consent design).
- Given an RSVP, then it awards XP once per event (CH-XP-002), not per change.
- Given an event I have RSVP'd to, then I receive a reminder, and I am always notified of a change or cancellation.

---

#### CH-EVT-004 — Postpone or cancel an event

| Field | Value |
|-------|-------|
| Release | Pilot |
| Persona | Publisher |
| Priority | Must |

**Acceptance criteria:**

- Given an event, then I can postpone it (new date/time, mandatory reason) or cancel it (mandatory reason).
- Given cancellation, then every student who RSVP'd `going` or `interested` is notified, and this notification cannot be disabled by the student.
- Given a cancelled event, then it remains visible with a clear cancelled treatment until its original date passes.
- Given postponement, then the original date is retained in the record and shown as "postponed from".

---

### 18.10 CH-OPP — Opportunities

#### CH-OPP-001 — Publish an opportunity

| Field | Value |
|-------|-------|
| Release | Pilot |
| Persona | Publisher |
| Priority | Must |

**As an** opportunities officer, **I want** to post internships, scholarships and competitions in a consistent format, **so that** students can find and act on them before the deadline.

**Why it matters:** Opportunities are the single strongest reason a final-year student opens the app. This is an acquisition feature, not a nice-to-have.

**Acceptance criteria:**

- Given an opportunity, then it carries: title, type (`internship`, `scholarship`, `fellowship`, `graduate_role`, `competition`, `hackathon`, `volunteering`, `campus_role`), description, provider/organisation name, eligibility text, deadline (mandatory, must be in the future at publish), application method, external application URL (HTTPS), campus/audience targeting, and optional image.
- Given the deadline passes, then the opportunity moves to an expired state automatically: it is removed from Home and active listings, and displayed with a clear expired treatment if reached directly.
- Given targeting, then the same dimensions as CH-PUB-003 apply.
- Given the external URL, then it opens with a clear indication that the student is leaving CampusHub.

---

#### CH-OPP-002 — Scam and predatory-offer vetting ⭐

| Field | Value |
|-------|-------|
| Release | Pilot |
| Persona | Publisher / Guild Administrator |
| Priority | Must |

**As a** Guild Administrator, **I want** every opportunity to pass a vetting checklist before it is published, **so that** CampusHub never becomes the channel through which a student loses money to a fake internship.

**Why it matters:** A verified, trusted campus channel is exactly what a recruitment scam wants. The reputational and financial harm of one scam reaching 20,000 students is severe and directly attributable to the Guild.

**Acceptance criteria:**

- Given publication of an opportunity, then a vetting checklist must be completed and recorded: provider identity confirmed; no application fee, deposit, training fee or "processing" payment required; destination URL is HTTPS and the domain matches or is plausibly connected to the stated provider; no request for identity documents, bank details or payment before an offer; contact details verifiable.
- Given the offer requires any payment from the student to apply, then publication is **blocked**, not warned.
- Given the URL domain, then it is checked against a platform prohibited/suspicious domain list; a match blocks publication.
- Given an opportunity type of scholarship or fellowship, then the checklist additionally requires confirmation that the awarding body is identifiable.
- Given a published opportunity, then any student can report it (CH-CNT-003), and a report moves it to `under_review` with visibility suspended if the report indicates financial harm.
- Given vetting, then the checklist completion is audited with the completing user's identity.

**Permissions:** Vetting may be completed by a Publisher with `opportunity.publish`; a Guild Administrator can override a block only with a recorded justification, and the override is flagged to Platform.
**Security/Privacy:** Platform prohibited-domain list is maintained by Platform and is not tenant-editable downward.

---

#### CH-OPP-003 — Save an opportunity and get deadline reminders

| Field | Value |
|-------|-------|
| Release | Pilot |
| Persona | Student |
| Priority | Should |

**Acceptance criteria:**

- Given an opportunity, then I can save it; saved items appear under Me.
- Given a saved opportunity, then I receive a reminder ahead of the deadline (defaults: 7 days and 24 hours) unless I have disabled that notification type.
- Given the deadline passes, then the saved item is marked expired rather than disappearing.

---

#### CH-OPP-004 — Opportunity engagement reporting

| Field | Value |
|-------|-------|
| Release | Pilot |
| Persona | Guild Administrator |
| Priority | Should |

**Acceptance criteria:**

- Given an opportunity, then I see: eligible audience, distinct viewers, saves, and outbound clicks.
- Given reporting, then no individual student is identified, and cohort breakdowns respect the suppression floor.
- Given outbound clicks, then repeated clicks by the same member within a session count once for unique metrics.

---

### 18.11 CH-SPT — Sports

#### CH-SPT-001 — Sports structure

| Field | Value |
|-------|-------|
| Release | Pilot |
| Persona | Sports Coordinator |
| Priority | Must |

**As a** Sports Coordinator, **I want** a very simple structure for our campus sport, **so that** I can get fixtures and results in front of students without configuring tournament software.

**Why it matters:** The failure mode here is building ESPN-lite. Campus sports coordinators need a fixture list and results, entered quickly, from a phone if necessary.

**Acceptance criteria:**

- Given the sports module, then the structure is: Sport → Competition → Team → Fixture → Result. Nothing deeper in Pilot.
- Given a Competition, then it has a name, a sport, a season label, a campus scope, and a table mode: `none` or `manual`. There are no automatic standings calculations in Pilot.
- Given a Team, then it has a name, optional crest, and an optional affiliation label (faculty, hall, or free text). No player rosters in Pilot.
- Given entities referenced by fixtures, then they cannot be deleted, only deactivated.

**Deferred explicitly:** Brackets, knockout formats, group stages, automatic standings, tiebreakers, individual athlete records, sports predictor.

---

#### CH-SPT-002 — Fixtures

| Field | Value |
|-------|-------|
| Release | Pilot |
| Persona | Sports Coordinator |
| Priority | Must |

**Acceptance criteria:**

- Given a Fixture, then it carries: competition, home team, away team, date/time, venue as free text, and campus.
- Given fixture states, then they are: `scheduled`, `postponed`, `cancelled`, `completed`, `result_published`, `abandoned`.
- Given a postponement or cancellation, then a reason is recorded and followers of either team are notified.
- Given a fixture list, then students can filter by sport, competition and team, and follow a team (CH-HOM-002).

---

#### CH-SPT-003 — Results and correction history

| Field | Value |
|-------|-------|
| Release | Pilot |
| Persona | Sports Coordinator |
| Priority | Must |

**As a** Sports Coordinator, **I want** to publish a result and be able to correct it transparently, **so that** a data-entry error does not become a public dispute.

**Acceptance criteria:**

- Given a completed fixture, then I enter a result as a draft and publish it explicitly; only published results are visible to students.
- Given a published result, then I can correct it; the correction requires a reason, retains the prior value, and the fixture displays a visible "corrected" indicator with the date.
- Given a correction, then followers of both teams are notified.
- Given repeated corrections on the same fixture, then the Guild Administrator is alerted.
- Given a result, then it awards no XP to anyone and is not connected to any prediction mechanic (predictor is Phase 2).

---

#### CH-SPT-004 — Manual standings table

| Field | Value |
|-------|-------|
| Release | Pilot |
| Persona | Sports Coordinator |
| Priority | Should |

**As a** Sports Coordinator, **I want** to publish a league table that I maintain myself, **so that** students can see standings without CampusHub needing to understand the rules of every sport.

**Acceptance criteria:**

- Given a Competition with table mode `manual`, then I can enter and edit a table with tenant-defined columns (typically played, won, drawn, lost, points, and one optional difference column).
- Given a manual table, then it displays a "last updated" timestamp and the fact that it is maintained by the Guild.
- Given table mode `none`, then no table is shown anywhere.
- Given automatic calculation, then it is not offered in Pilot; it is a Commercial V1 candidate contingent on evidence that sports is a top-three module by usage.

---

#### CH-SPT-005 — Team pages

| Field | Value |
|-------|-------|
| Release | Pilot |
| Persona | Student |
| Priority | Should |

**Acceptance criteria:**

- Given a team, then its page shows: name, crest, affiliation, upcoming fixtures, recent published results, and a follow control.
- Given a team page, then it shows no player names or individual statistics in Pilot.
- Given a followed team, then fixture reminders and result notifications apply per CH-NTF-002.

---

### 18.12 CH-POL — Polls

> ⚠️ **ARCHITECTURE BLOCKER — see §29-A1.** Polls remain in Pilot because they are a core CampusHub differentiator. No poll code may be written until the vote mechanism design in §29-A1 has been produced and reviewed. The stories below define the required product behaviour and the trust invariant; they deliberately do not assert an implementation, and they do not claim technical unlinkability as an achieved property.

---

#### CH-POL-001 — Poll trust goal ⭐

| Field | Value |
|-------|-------|
| Release | Pilot |
| Persona | Student / Guild Administrator |
| Priority | Must |

**As a** student, **I want** to be confident that nobody at my Guild or my university can find out how I voted, **so that** I answer honestly.

**Why it matters:** The entire value of a campus poll rests on honest answers. Honest answers require credible privacy. Credible privacy requires that the answer is "the product cannot do that", not "we choose not to".

**Acceptance criteria (product behaviour, not implementation):**

- Given an eligible member votes, then CampusHub knows that they participated — this is required for one-vote enforcement, turnout and XP.
- Given a vote, then CampusHub must not expose which option that individual selected through any product surface.
- Given any administrator role, including Guild Administrator, Custodian, University Official and Platform Operator, then there is no UI, report, export, search or support tool that reveals an individual's answer.
- Given a sponsor, then they receive no polling information about individuals under any circumstance.
- Given polls, then they are non-binding, are labelled as such in-product, and this permits privacy/fraud trade-offs to be resolved in favour of student trust.
- Given the transparency page (CH-PRV-001), then it describes the poll privacy position in language that matches what the reviewed architecture actually delivers — no stronger.

**Open decisions:** Whether the reviewed design achieves full unlinkability or a weaker pseudonymous model. Whichever it achieves, the product copy must describe it accurately. **BLOCKER BEFORE IMPLEMENTATION.**

---

#### CH-POL-002 — Create a poll with eligibility

| Field | Value |
|-------|-------|
| Release | Pilot |
| Persona | Guild Administrator |
| Priority | Must |

**Acceptance criteria:**

- Given a poll, then it carries: question, 2–6 options, audience (same dimensions as CH-PUB-003), a minimum assurance level for participation, an open time and a close time.
- Given the minimum assurance level, then the default is L2 and the creator is warned explicitly if they select L1 ("Invite-code members can vote. Results will be less reliable.").
- Given the eligible cohort at creation, then its size is displayed; a cohort below a configured floor triggers a warning that results may not be publishable (CH-POL-006).
- Given the poll opens, then eligibility is evaluated against membership attributes at vote time using verified sources per CH-PRO-002.
- Given a poll, then it is labelled in the student interface as a non-binding sentiment poll, never as a vote or election.

---

#### CH-POL-003 — Poll lifecycle

| Field | Value |
|-------|-------|
| Release | Pilot |
| Persona | Guild Administrator |
| Priority | Must |

**Acceptance criteria:**

- Given poll states, then they are `draft` → `scheduled` → `open` → `closed` → `archived`, plus `voided`.
- Given the first participation is recorded, then the question, options, audience and minimum assurance level are locked and cannot be edited.
- Given a poll is open, then the close time may be extended once, with notification to the eligible audience.
- Given close, then it happens automatically at the close time in tenant timezone, and no further participation is accepted.

---

#### CH-POL-004 — Participate in a poll

| Field | Value |
|-------|-------|
| Release | Pilot |
| Persona | Student |
| Priority | Must |

**Acceptance criteria:**

- Given I am eligible and the poll is open, then I select one option and submit; the submission is confirmed unambiguously.
- Given I have already participated, then I cannot participate again — enforced server-side and safe under concurrent requests.
- Given I am ineligible, then the poll is visible with a plain explanation of why I cannot vote, and — where the reason is missing profile information — CH-PRO-003 gating applies.
- Given submission, then the answer cannot be changed after submission. This is deliberate: an answer-change feature requires linking the member to their ballot.
- Given a network failure during submission, then the client retries idempotently and I am never shown an ambiguous outcome.
- Given participation, then XP is awarded once for participating, at a value identical regardless of which option was chosen (CH-XP-002).

**Security/Privacy:** XP award must be triggered by the participation record, never by the ballot, so that the XP ledger cannot be used to infer an answer.

---

#### CH-POL-005 — Results and turnout

| Field | Value |
|-------|-------|
| Release | Pilot |
| Persona | Student / Guild Administrator |
| Priority | Must |

**Acceptance criteria:**

- Given a closed poll, then results show: option counts, option percentages, total participation, eligible cohort size frozen at close, and turnout percentage.
- Given the tenant setting, then results may be visible to students on close (default) or restricted to administrators.
- Given Pilot, then demographic breakdowns are limited to a single dimension at most (e.g., by campus, or by year — never crossed), and only where every reported cohort exceeds the suppression floor.
- Given a cohort below the floor, then the breakdown is suppressed entirely, with complementary suppression so values cannot be derived by subtraction.
- Given results, then no export at any level contains individual-level data.

**Open decisions:** Whether Pilot ships with any demographic breakdown or top-line only. Recommendation: top-line only for the first tenants; enable a single dimension once real cohort sizes are known. Blocker before Pilot launch.

---

#### CH-POL-006 — Suppression floor for poll reporting

| Field | Value |
|-------|-------|
| Release | Pilot |
| Persona | System |
| Priority | Must |

**Acceptance criteria:**

- Given any poll result view or breakdown, then a minimum cohort size policy default applies before figures are shown.
- Given the thresholds, then they are explicitly policy defaults, not mathematical privacy guarantees (§27.4), configurable within platform bounds, and subject to review against real university cohort sizes.
- Given a poll whose entire eligible cohort is below the floor, then results are not published and the creator was warned at creation (CH-POL-002).
- Given repeated queries or arbitrary cross-tabulation, then the product does not offer them — fixed, single-dimension reports are the Pilot defence against differencing.

---

#### CH-POL-007 — Correct a mis-targeted poll and emergency void

| Field | Value |
|-------|-------|
| Release | Pilot |
| Persona | Guild Administrator |
| Priority | Must |

**As a** Guild Administrator who has published a poll to the wrong audience or discovered a serious problem with it, **I want** to void it cleanly and explain why, **so that** the mistake does not become a credibility incident.

**Acceptance criteria:**

- Given a poll has opened but received no participation, then I may close and delete it; the audit records that it existed and was withdrawn.
- Given a poll has received participation, then it cannot be edited (CH-POL-003); the only remedies are early close and void.
- Given void, then it requires re-authentication, a mandatory reason, and confirmation; the poll's results are never published; students who participated are notified that the poll was voided and why.
- Given void, then XP already awarded for participation is retained — the student did nothing wrong.
- Given a voided poll, then it is excluded from all turnout and engagement analytics, and the exclusion is visible in the analytics view as an annotation rather than a silent gap.
- Given the reason for voiding involves suspected fraud, then the product's remedy is poll-level (void and optionally re-run); individual ballots cannot be surgically removed, and this trade-off is documented in the transparency page.

---

#### CH-POL-008 — Poll notifications

| Field | Value |
|-------|-------|
| Release | Pilot |
| Persona | Student |
| Priority | Should |

**Acceptance criteria:**

- Given a poll opens for me, then I receive an in-app notification.
- Given a poll I am eligible for is closing within 24 hours and I have not participated, then I receive one reminder.
- Given I have participated, then I receive no further reminders for that poll.
- Given the reminder, then it never references how anyone voted and never uses pressure language.

---

### 18.13 CH-VOX — Student Voice (tenant-conditional)

> Student Voice does NOT automatically activate for any university. It is a tenant-conditional module, disabled by default, and is enabled only when the readiness conditions in CH-VOX-001 are met and maintained. A tenant with Student Voice disabled is an acceptable, supported, non-degraded product state.

---

#### CH-VOX-001 — Tenant readiness gate for Student Voice ⭐

| Field | Value |
|-------|-------|
| Release | Pilot |
| Persona | Platform Operator / Guild Administrator |
| Priority | Must |

**As a** Platform Operator, **I want** Student Voice to be impossible to enable unless the tenant has genuinely committed to staffing it, **so that** we never operate an unmonitored complaints channel on a university campus.

**Why it matters:** An open, unmoderated issue channel is a legal and safety incident waiting to happen, and it will be attributed to the Guild, the university and CampusHub simultaneously. Moderation tooling cannot compensate for absent staffing.

**Acceptance criteria:**

- Given Student Voice, then it is disabled by default for every new tenant and is entirely hidden from students and admins while disabled.
- Given an activation request, then all of the following must be recorded before enablement:
  - (a) Named party accountable for moderation
  - (b) At least two identified individuals granted Voice Moderator with MFA enrolled
  - (c) The permitted categories configured from the allowed Pilot list (CH-VOX-002)
  - (d) An escalation contact for issues that must leave CampusHub
  - (e) Explicit acknowledgement of the response-time expectations
  - (f) Acceptance of the applicable licence/governance conditions for the module
- Given any condition lapses — for example both moderators' grants expire at Guild Term close — then the module auto-suspends: no new submissions are accepted, existing issues remain visible with their status, and the tenant and Platform are alerted daily.
- Given moderation SLA breach beyond a configured threshold, then Platform is alerted and may suspend the module.
- Given the module is disabled or suspended, then students see a clear signpost to the university's existing channels rather than a broken feature.

**Permissions:** Enablement requires Platform Operator action plus tenant confirmation. A Guild Administrator cannot self-enable.
**Audit:** Activation request, each condition, enablement, suspension, re-enablement.

---

#### CH-VOX-002 — Permitted and prohibited categories

| Field | Value |
|-------|-------|
| Release | Pilot |
| Persona | Guild Administrator |
| Priority | Must |

**Acceptance criteria:**

- Given Pilot, then the permitted category list is limited to low-risk campus service issues: campus facilities, Wi-Fi and connectivity, lighting and safety infrastructure, sanitation, library, transport, academic facilities, and campus services.
- Given Pilot, then the following are prohibited and structurally unavailable: naming or identifying individual people in a public issue; anonymous confession-style posting; criminal accusations; sexual violence reporting; self-harm or crisis reporting; sensitive medical information; and disciplinary complaints requiring a formal procedure.
- Given a student attempts to raise any prohibited matter, then CampusHub does not accept it as a Voice issue and instead signposts the established university channels configured by the tenant, with a plain statement that CampusHub is not an emergency service and not a counselling service.
- Given a tenant, then it may enable fewer categories than the permitted list, never more.
- Given a future formally reviewed workflow for sensitive categories, then it is a Commercial V1 or later item and requires separate legal and welfare review (§31).

**Security/Privacy:** The signposting text must be tenant-configured at activation (CH-VOX-001(d)) and must contain real, current contact routes.

---

#### CH-VOX-003 — Submit an issue

| Field | Value |
|-------|-------|
| Release | Pilot |
| Persona | Student |
| Priority | Must |

**Acceptance criteria:**

- Given Voice is enabled and I hold assurance L2 or above, then I can submit an issue with: category, title, description, campus, optional location text, and optional image.
- Given submission, then I am shown, before I submit, exactly who will be able to see my identity and who will not.
- Given the composer, then it warns explicitly against naming individuals, and a submission that names an individual is rejected at moderation with that reason.
- Given submission limits, then a per-member rate limit applies to prevent flooding.
- Given submission, then it enters `in_moderation` and is not publicly visible until a moderator publishes it.
- Given submission, then it awards XP once, for a member's first ever submission only — never per submission, to avoid incentivising volume over substance.

---

#### CH-VOX-004 — Identity model

| Field | Value |
|-------|-------|
| Release | Pilot |
| Persona | Student |
| Priority | Must |

**As a** student raising an issue about a campus facility, **I want** other students not to see my name, and I want the people who can see it to be few, accountable and audited.

**Acceptance criteria:**

- Given a published issue, then it is pseudonymous to other students — no name, no photograph, no student number, and no combination of displayed attributes that would identify the submitter.
- Given a moderator or handler with the `voice.identity` capability, then they can reveal the submitter's identity only with a recorded reason from a fixed list, and every access generates an audit event.
- Given a University Official, then they never see submitter identity, in any view or export.
- Given the transparency page, then it states precisely who can see identity and under what circumstances (TI-5).
- Given a student, then they can see, in their own record, whether their identity has been accessed and when.

**Open decisions:** Whether faculty is displayed alongside a pseudonymous issue. Recommendation: no in Pilot — in a small faculty it is identifying. Can defer.

---

#### CH-VOX-005 — Moderation and publication

| Field | Value |
|-------|-------|
| Release | Pilot |
| Persona | Voice Moderator |
| Priority | Must |

**Acceptance criteria:**

- Given a submitted issue, then it appears in a queue with age and SLA indicator, sorted by SLA risk.
- Given moderation, then I may publish, reject (with a reason category communicated to the submitter), merge as duplicate into an existing issue, or restrict (visible only to handlers, not published).
- Given rejection, then the submitter is notified with the reason category and may appeal once.
- Given a published issue, then other students can support it once (no XP, rate-limited); there are no comment threads in Pilot.
- Given a moderation decision, then it is audited with the moderator's identity.

---

#### CH-VOX-006 — Issue status lifecycle and public accountability

| Field | Value |
|-------|-------|
| Release | Pilot |
| Persona | Student / Guild Administrator |
| Priority | Must |

**As a** student, **I want** to see what happened to an issue after it was raised, **so that** CampusHub proves the Guild actually does something rather than just collecting complaints.

**Why it matters:** The status history is the credibility engine of the whole module. An issue channel with no visible outcomes is worse than no channel.

**Acceptance criteria:**

- Given a published issue, then its states are: `published` → `acknowledged` → `under_review` → {`action_planned` | `escalated`} → {`resolved` | `closed_no_action`}, with `duplicate_merged` and `withdrawn_by_submitter` available from most states.
- Given any status transition, then it writes an append-only history entry with the date and, for `escalated`, `resolved` and `closed_no_action`, a mandatory public note.
- Given the issue page, then the full status history is publicly visible to students.
- Given `escalated`, then the note states which external channel it was escalated to, without disclosing identities.
- Given an issue with no status change beyond a configured age, then it is flagged in the admin queue and counted in the SLA metric.

---

#### CH-VOX-007 — Voice reporting for the tenant

| Field | Value |
|-------|-------|
| Release | Pilot |
| Persona | Guild Administrator |
| Priority | Should |

**Acceptance criteria:**

- Given the Voice module, then I see: submissions by category, published counts, median time to first acknowledgement, median time to resolution, and open backlog by age.
- Given reporting, then it contains no submitter identities and no free-text content in aggregate views.
- Given a University Official (Commercial V1), then they see category-level counts and resolution times only — never content, never identity.

---

### 18.14 CH-XP — XP & Levels

#### CH-XP-001 — XP ledger ⭐

| Field | Value |
|-------|-------|
| Release | Pilot |
| Persona | System |
| Priority | Must |

**As** the platform, **I need** XP to be derived from an append-only event ledger, **so that** a student's total is always explainable, correctable and auditable.

**Why it matters:** A mutable integer with no history makes every dispute unresolvable and every duplicate award permanent. This is cheap to do right now and expensive to retrofit.

**Acceptance criteria:**

- Given any XP change, then it is recorded as a ledger event with: membership, rule reference, amount, timestamp, an idempotency key, and a type (`award`, `reversal`, `correction`).
- Given a repeated award attempt with the same idempotency key, then no second event is created.
- Given a member's XP total, then it always equals the sum of their ledger events.
- Given a reconciliation job, then it verifies total = sum(ledger) and alerts on drift.
- Given the ledger, then it is append-only; no event is edited or deleted.
- Given Pilot, then this is a straightforward append-only table — not financial-grade infrastructure. The requirement is history and idempotency, not double-entry accounting.

**Security/Privacy:** Ledger events for poll participation reference the participation, never the ballot (CH-POL-004).

---

#### CH-XP-002 — XP rules

| Field | Value |
|-------|-------|
| Release | Pilot |
| Persona | Guild Administrator / System |
| Priority | Must |

**Acceptance criteria:**

- Given the rule catalogue, then XP is awarded only for a defined, closed list of legitimate actions. Pilot list: completing verification; completing a profile field (once per field); participating in a poll (once per poll); RSVP to an event (once per event); playing the Daily Quiz (participation, plus a small accuracy component); a member's first ever Student Voice submission; and Streak milestones.
- Given actions not on the list — saves, follows, supports, opening a publication, reading news — then they award no XP, because they are cheap toggles and would be farmed.
- Given a daily cap, then a global per-member daily XP cap applies, is disclosed to the student, and hitting it never blocks the underlying action.
- Given rule amounts, then they are tenant-adjustable within platform-bounded ranges, and every change is forward-only — historical awards are never recalculated.
- Given XP, then it is: never purchasable; never spendable; never required to access essential campus information; and never decreases except by audited correction or fraud reversal.

---

#### CH-XP-003 — Explain my XP to me

| Field | Value |
|-------|-------|
| Release | Pilot |
| Persona | Student |
| Priority | Must |

**Acceptance criteria:**

- Given my Play screen, then I see my XP total, my Level, and a plain-language list of how XP is earned in this tenant, with the current amounts.
- Given my history, then I see my own recent XP events with the action that caused each one.
- Given the daily cap, then it is stated plainly and I can see when I have reached it.
- Given a Level, then I see what it is called, and the XP needed for the next one.

---

#### CH-XP-004 — Correct or reverse an XP award

| Field | Value |
|-------|-------|
| Release | Pilot |
| Persona | Guild Administrator / Platform Operator |
| Priority | Must |

**Acceptance criteria:**

- Given an erroneous award (duplicate, rule bug, detected farming), then a reversal event is written with a mandatory reason; the original event remains in the ledger.
- Given a reversal, then the member is notified with a plain explanation.
- Given a correction of our error, then it may only increase a member's XP — we do not penalise a student for a platform defect.
- Given manual adjustment by an administrator, then it is capped per action and per period, requires re-authentication, and is audited with actor and reason.
- Given fraud reversal, then it is the only route by which XP decreases as a consequence of member behaviour, and it requires a recorded finding.

---

#### CH-XP-005 — Levels

| Field | Value |
|-------|-------|
| Release | Pilot |
| Persona | Student |
| Priority | Should |

> ⚠️ **UX BLOCKER — see §30-U2.** Level naming and visual treatment must be resolved with student research before design, because the system must feel adult and credible rather than childish.

**Acceptance criteria:**

- Given cumulative XP, then Level is derived from platform-defined thresholds; Level is recognition only.
- Given Level, then it never decreases, and members are grandfathered if thresholds change.
- Given Level, then it may not gate: important information, official announcements, polls the student is otherwise eligible for, opportunities, or safety information. There is no feature in Pilot that Level unlocks.
- Given the visual treatment, then it is restrained: no cartoon celebration, no full-screen interruption, no sound. Every celebratory animation has a static equivalent and honours reduced-motion.
- Given a final-year student, then the naming must not read as juvenile. Level names are a research output, not an internal preference.

---

### 18.15 CH-STK — Streak

> Streak remains in Pilot as a deliberate product decision, against the audit's recommendation, in order to test whether students actually care about the mechanic. It is kept deliberately simple.

---

#### CH-STK-001 — Simple streak

| Field | Value |
|-------|-------|
| Release | Pilot |
| Persona | Student |
| Priority | Should |

**As a** student, **I want** a small acknowledgement that I have been checking CampusHub regularly, **so that** there is a light reason to come back.

**Acceptance criteria:**

- Given a campus day (a calendar day in the tenant timezone), then my streak increments by one if I complete at least one meaningful qualifying activity during it.
- Given qualifying activities, then they are: playing the Daily Quiz, participating in a poll, RSVPing to an event, saving an opportunity, or submitting a Voice issue. Merely opening the app does not qualify.
- Given a qualifying activity, then the streak increments once per day regardless of how many activities I complete.
- Given a missed in-session day, then the streak resets to zero.
- Given a reset, then the messaging is neutral and factual — never guilt-framed, never loss-framed.
- Given streak milestones, then a small XP award may be granted at defined intervals via the ledger.

**Explicitly NOT included in Pilot:** Streak freezes, purchasable restoration, Campus Energy interaction, guilt-heavy reminders, elaborate recovery mechanics, rewards marketplace.

---

#### CH-STK-002 — Academic calendar recognition

| Field | Value |
|-------|-------|
| Release | Pilot |
| Persona | Student |
| Priority | Should |

**Acceptance criteria:**

- Given a tenant-configured recess period (CH-TEN-004), then the streak does not decrement or reset during it — it is paused and resumes at its prior value.
- Given no configured calendar, then all days are treated as in-session and the tenant is prompted to configure one.
- Given the student, then the pause is explained plainly in the interface ("Your streak is paused for the recess").
- Given Pilot, then no further sophistication is built — exam-period rules, per-programme calendars and partial weeks are Commercial V1 candidates only if Pilot data shows a problem.

---

#### CH-STK-003 — Streak reminders are opt-in

| Field | Value |
|-------|-------|
| Release | Pilot |
| Persona | Student |
| Priority | Must |

**Acceptance criteria:**

- Given the streak-at-risk notification, then it is off by default and must be explicitly enabled by the student.
- Given it is enabled, then at most one reminder is sent per day, within quiet-hours rules, using neutral language.
- Given the reminder copy, then it states the fact ("You haven't done anything on CampusHub today") and never uses loss-framing, countdowns, or emotional pressure.

**Rationale:** An opt-in nudge is legitimate; an unsolicited daily "you'll lose your streak" push is the archetypal dark pattern and is prohibited by P6.

---

### 18.16 CH-QIZ — Daily Campus Quiz

#### CH-QIZ-001 — One daily quiz

| Field | Value |
|-------|-------|
| Release | Pilot |
| Persona | Student |
| Priority | Should |

**As a** student, **I want** a quick, fun daily quiz about my university, **so that** I have a light reason to open CampusHub and something that feels like it belongs to my campus.

**Acceptance criteria:**

- Given a campus day, then exactly one quiz instance exists per tenant (optionally per campus), consisting of a small fixed number of questions (default 5).
- Given I play, then my attempt is server-authoritative: questions and correct answers are not determinable from the client before submission, and scoring happens server-side.
- Given I have already attempted today's quiz, then I cannot attempt it again; I can see my result.
- Given completion, then XP is awarded once per attempt via the ledger — a participation component plus a small accuracy component.
- Given the day boundary passes mid-attempt, then the attempt is scored on submission if within a short grace window, otherwise it is abandoned with no XP penalty.
- Given a platform failure or an invalid question, then the attempt is voided, no XP is lost, and a replacement attempt is granted.

**Explicitly not built:** A generic game engine. The quiz is a single game type, implemented directly, with the data model shaped so additional game types can be added later without restructuring (CH-QIZ-005).

---

#### CH-QIZ-002 — Question bank management

| Field | Value |
|-------|-------|
| Release | Pilot |
| Persona | Guild Administrator / Publisher |
| Priority | Should |

**Acceptance criteria:**

- Given the quiz module, then I can create questions with: text, 3–4 options, exactly one correct option, an optional explanation shown after answering, a category, and a state (`draft`, `active`, `retired`).
- Given content categories, then they cover university history, campus culture, sports, student-life knowledge and general campus-relevant trivia.
- Given the bank, then the system warns when active questions fall below a threshold needed to sustain the daily cadence without repetition, with a projected exhaustion date.
- Given a question that has been used, then it is not repeated within a configured window.
- Given a reported or leaked question, then it can be retired immediately and any in-flight instance using it is voided.

---

#### CH-QIZ-003 — Starter content

| Field | Value |
|-------|-------|
| Release | Pilot |
| Persona | Guild Administrator |
| Priority | Must |

**As a** Guild Administrator with no time, **I want** CampusHub to give me a starting question bank and a way to build on it, **so that** I am not required to invent an entire quiz system from zero before launch.

**Why it matters:** Requiring a Guild to write 200 questions before launch is how the quiz never launches.

**Acceptance criteria:**

- Given tenant onboarding, then CampusHub supplies a starter bank of generic and templatable questions sufficient for an initial period, which the tenant reviews and approves before use.
- Given the starter bank, then each question is clearly marked as platform-supplied until the tenant edits it, so tenants can see what is theirs.
- Given the tenant, then a simple bulk-add path exists (form or CSV) so a Guild can add 20 questions in one sitting.
- Given the launch readiness gate (CH-TEN-005), then if the quiz module is enabled, an approved active bank above the minimum threshold is a launch condition.

---

#### CH-QIZ-004 — Quiz integrity

| Field | Value |
|-------|-------|
| Release | Pilot |
| Persona | System |
| Priority | Should |

**Acceptance criteria:**

- Given an attempt, then a minimum plausible completion time applies; suspiciously fast completions are flagged for review, not automatically punished.
- Given detected automation patterns, then the attempts are excluded from XP and flagged; the member is not suspended without human review.
- Given answer sharing between students, then it is accepted as a residual risk — the stakes are deliberately low, there are no prizes, and per-day rotation limits the benefit.
- Given any integrity action, then it is audited and the member is informed.

---

#### CH-QIZ-005 — Extensibility without building it now

| Field | Value |
|-------|-------|
| Release | Pilot |
| Persona | System |
| Priority | Should |

**Acceptance criteria:**

- Given the domain model, then the quiz is modelled as one instance of a Challenge type with a generic attempt lifecycle, so that additional types (predictor, location guess, word game) can be added in Phase 2 without restructuring attempts, XP integration or the Play surface.
- Given Pilot, then no other challenge type is implemented, no type-selection UI exists, and no abstraction is built beyond what the single type requires.

---

### 18.17 CH-SPN — Sponsorship

> Pilot sponsorship demonstrates capability. It is not a miniature advertising platform. No pacing, no conflict engine, no sponsor portal, no payment gates, no behavioural targeting, no assurance-level targeting.

---

#### CH-SPN-001 — Record a sponsor and a placement

| Field | Value |
|-------|-------|
| Release | Pilot |
| Persona | Guild Administrator |
| Priority | Should |

**Acceptance criteria:**

- Given sponsorship is enabled for the tenant, then I can record a Sponsor (name, category, contact, notes) and create a Placement with: title, creative image, call-to-action label, HTTPS destination URL, start date, end date, placement slot, status, and an optional internal commercial note.
- Given the destination URL, then it must be HTTPS and is checked against the platform prohibited-domain list at save time and again at approval.
- Given a Placement, then it starts in draft and does not serve.
- Given placement slots in Pilot, then they are limited to: a card in the Discover surface, and a strip on event, opportunity and team pages. No interstitials, no autoplay video, no takeovers, no sponsored notifications, no placement adjacent to Student Voice content.

---

#### CH-SPN-002 — Prohibited categories and approval ⭐

| Field | Value |
|-------|-------|
| Release | Pilot |
| Persona | Guild Administrator |
| Priority | Must |

**As a** Guild Administrator, **I want** every placement to pass a category check before it serves, **so that** CampusHub never carries advertising that harms students or embarrasses the institution.

**Why it matters commercially:** Betting companies and loan apps have the most money and will approach Guilds first. This control will be commercially unpopular. It must be non-negotiable, and it must be written into the licence agreement, not only into the software.

**Acceptance criteria:**

- Given approval, then it is a separate capability from creation, and the person who created a placement cannot approve it.
- Given the platform prohibited list, then it includes at minimum: gambling and sports betting; alcohol; tobacco and vaping; predatory or unlicensed lending; obvious get-rich-quick schemes; academic-fraud and essay services; adult content; unsafe or unlicensed medical claims; age-inappropriate products; and any recruitment opportunity requiring an application fee.
- Given a tenant, then it may add prohibitions but can never remove a platform prohibition (TI-7).
- Given approval, then the approver affirms the category check explicitly; the affirmation, identity and timestamp are audited.
- Given a live placement later found to breach policy, then any Guild Administrator or Platform Operator can suspend it immediately, and Platform can suspend across tenants.
- Given the rules, then they are kept simple — no nuanced regulatory-category workflow is built unless an actual customer demands it.

---

#### CH-SPN-003 — Broad, safe audiences only

| Field | Value |
|-------|-------|
| Release | Pilot |
| Persona | Guild Administrator |
| Priority | Must |

**Acceptance criteria:**

- Given placement audience, then the only options are: entire university, a specific campus, or all product-defined verified students.
- Given targeting, then it is not possible to target or exclude by verification assurance level (TI-4), poll participation, Student Voice activity, quiz answers, browsing behaviour, saved items, interests, faculty, programme, year, residence, or any other behavioural or demographic signal.
- Given a sponsor, then they are never told and never able to infer how CampusHub internally rates the strength of any student's verification.
- Given any audience, then it must exceed a minimum size floor before a placement may go live.
- Given the transparency page, then it states exactly which audience dimensions sponsors may use.

**Rationale:** Exposing assurance level as a targeting dimension creates a quasi-quality score on students and a privacy signal with no legitimate advertising purpose. It is removed entirely.

---

#### CH-SPN-004 — Serving, labelling and frequency

| Field | Value |
|-------|-------|
| Release | Pilot |
| Persona | Student |
| Priority | Must |

**Acceptance criteria:**

- Given any sponsored placement, then it carries a persistent, clearly legible "Sponsored" label plus the sponsor name; it is visually distinct from editorial content; it meets contrast requirements; it is announced to assistive technology; and it does not rely on colour alone.
- Given sponsored content, then it can never be styled to resemble a Guild announcement, an official notice, or Student Voice content.
- Given a student, then a plain "Why am I seeing this?" explanation is available and states the broad audience basis (e.g., "Shown to all verified students at this campus").
- Given frequency, then a simple per-student daily impression cap applies, and sponsored content never appears in the Priority Notice position or above campus information on Home.
- Given multiple eligible placements, then rotation is simple and deterministic — no pacing algorithm, no even-share delivery engine, no auction.

---

#### CH-SPN-005 — Basic sponsorship metrics and export

| Field | Value |
|-------|-------|
| Release | Pilot |
| Persona | Guild Administrator |
| Priority | Should |

**Acceptance criteria:**

- Given a live placement, then the system records: unique impressions, total impressions, unique clicks, total clicks, and click-through rate — deduplicated per member per day, excluding staff previews and detected automation.
- Given metrics, then they are never reported at individual level and are never joined to poll, Voice, profile or quiz data.
- Given a report, then a Guild Administrator can export a simple document containing placement details, flight dates, and the aggregate figures above, plus a coarse audience description.
- Given the report, then it contains no personal data of any kind (TI-3), and its generation is audited.
- Given Pilot, then sponsors have no login; they receive an exported document.

---

### 18.18 CH-NTF — Notifications

#### CH-NTF-001 — In-app notification centre

| Field | Value |
|-------|-------|
| Release | Pilot |
| Persona | Student |
| Priority | Must |

**Acceptance criteria:**

- Given any notification, then it appears in a centre with an unread state and a deep link to its source that survives an intervening login.
- Given multiple memberships, then notifications are grouped by tenant (CH-MEM-003).
- Given I open a notification, then it is marked read; I can mark all read.
- Given the source item is unpublished or deleted, then the notification resolves to a graceful "no longer available" state, not an error.
- Given notifications, then they are an icon and centre, not a primary navigation destination (§14).

---

#### CH-NTF-002 — Notification types and defaults

| Field | Value |
|-------|-------|
| Release | Pilot |
| Persona | Student |
| Priority | Must |

| Type | Default | Channel | Disableable |
|------|---------|---------|-------------|
| Priority Notice | On | In-app + email | In-app: no. Email: yes |
| Publication targeted to me | On | In-app | Yes |
| Poll opened for me | On | In-app | Yes |
| Poll closing in 24h, not yet participated | On | In-app | Yes |
| Event I RSVP'd — reminder / change | On | In-app | Yes |
| Event I RSVP'd — cancellation | On | In-app + email | No |
| Saved opportunity deadline (7d, 24h) | On | In-app; email at 24h | Yes |
| Result or fixture for a followed team | On | In-app | Yes |
| My Voice issue: status change | On | In-app + email | Yes |
| Daily Quiz available | Off | In-app | Yes |
| Streak at risk | Off | In-app | Yes |
| Verification outcome | On | In-app + email | No |
| Account security event | On | Email | No |
| Sponsored | Never sent | — | — |

**Acceptance criteria:**

- Given the matrix above, then it is the complete Pilot set; no additional categories are added without evidence.
- Given preferences, then I can control each type per channel except the non-disableable set.
- Given Pilot, then web push is not implemented — in-app plus essential email only. Web push is a Commercial V1 / Phase 2 decision based on evidence.

---

#### CH-NTF-003 — Volume and fatigue control

| Field | Value |
|-------|-------|
| Release | Pilot |
| Persona | Student |
| Priority | Must |

**Acceptance criteria:**

- Given non-critical in-app notifications, then no more than a configured number per member per day; excess collapses into a single digest entry.
- Given email, then at most one digest per day plus critical items, each with one-click unsubscribe for non-critical categories.
- Given quiet hours, then no email is sent between configured night-time hours in tenant timezone except critical notices.
- Given a Priority Notice, then it bypasses volume limits — which is precisely why CH-PUB-006 rate-limits its creation.

---

#### CH-NTF-004 — Delivery integrity

| Field | Value |
|-------|-------|
| Release | Pilot |
| Persona | System |
| Priority | Must |

**Acceptance criteria:**

- Given a notification, then it is generated at most once per (membership, source item, event type) — idempotent.
- Given an item is edited, then re-notification is never automatic; the Publisher must choose it explicitly, and it is rate-limited to once per item.
- Given a targeted item, then notification eligibility is evaluated at send time against current membership attributes and the tenant's subscription state.
- Given a suspended tenant, then no notifications are dispatched (§22).
- Given every notification job, then it executes within explicit tenant context (TI-1).

---

### 18.19 CH-ANL — Analytics

> Pilot analytics answer three questions and no more: are students using CampusHub?, is Guild communication working?, is this useful enough to renew? — plus basic sponsorship figures if sponsorship is enabled.

---

#### CH-ANL-001 — Defined metrics

| Field | Value |
|-------|-------|
| Release | Pilot |
| Persona | Guild Administrator |
| Priority | Must |

**As a** Guild Administrator, **I want** every number to have one clear definition, **so that** the figure I show the Dean is the same figure CampusHub uses internally.

**Acceptance criteria:**

- Given any metric shown, then an accessible definition states what counts, what is excluded, the window, and the timezone.
- Given canonical definitions, then:
  - **Registered** = memberships in any state except `closed`
  - **Verified** = memberships at L2 or above in `verified` state
  - **Weekly Active** = distinct memberships with at least one authenticated non-trivial interaction in a rolling 7 tenant-days
  - **Returning** = memberships active in the current week who were also active in the previous week
  - **Reach** = distinct memberships who opened an item
  - **Open rate** = opens ÷ eligible audience at publish
  - **Turnout** = participation records ÷ eligible cohort frozen at close
- Given metrics, then staff previews, automated agents and duplicate events are excluded consistently on every surface.
- Given a definition change, then historical charts are annotated at the change date rather than silently restated.

> **Note:** The "viewport ≥1 second" reach definition from Draft 0.1 is not used in Pilot — it is ad-grade instrumentation that Pilot does not need. Reach is defined as an open.

---

#### CH-ANL-002 — Pilot dashboard

| Field | Value |
|-------|-------|
| Release | Pilot |
| Persona | Guild Administrator |
| Priority | Must |

**Acceptance criteria:**

- Given the Overview, then it shows: registered, verified (with verification funnel by level), weekly active, returning; publications published and their reach; open polls with live turnout; event engagement; opportunity saves and clicks; and — if sponsorship is enabled — sponsored views and clicks.
- Given the dashboard, then it supports a date range and comparison to the previous period. Academic calendar period bands are shown as context if configured.
- Given Pilot, then the following are not built: retention cohort dashboards, arbitrary cross-tabs, streak analytics, leaderboard analytics, sophisticated calendar overlays, ad-grade attribution.
- Given every figure, then a definition is one tap away (CH-ANL-001).

---

#### CH-ANL-003 — Exportable Guild report

| Field | Value |
|-------|-------|
| Release | Pilot |
| Persona | Guild Administrator |
| Priority | Should |

**As a** Guild President, **I want** a one-page report I can take to the Dean, **so that** I can justify what we spent and argue for renewal.

**Acceptance criteria:**

- Given a period, then I can export a report containing aggregate metrics only, with a generation date, a methodology note, and suppression rules applied.
- Given the report, then it contains no personal data, no individual behaviour, and no poll answers.
- Given generation, then it is audited.

---

#### CH-ANL-004 — Privacy suppression floor

| Field | Value |
|-------|-------|
| Release | Pilot |
| Persona | System |
| Priority | Must |

**Acceptance criteria:**

- Given any analytics view, breakdown, export or sponsor report, then a minimum cohort size is applied before figures are displayed.
- Given these thresholds, then they are documented as policy defaults subject to real university cohort sizes, legal/security review and Pilot experience — they are explicitly not presented as mathematically proven privacy guarantees (§27.4).
- Given a cell below the threshold, then it is suppressed, and complementary suppression prevents derivation by subtraction from totals.
- Given Pilot, then the product offers top-line results and fixed reports with at most one breakdown dimension; arbitrary analytics exploration is not built.
- Given the thresholds, then they are reviewed against real tenant cohort sizes before each new tenant launch.

---

### 18.20 CH-GOV — Governance, Roles, Terms & Audit

#### CH-GOV-001 — Grant a role

| Field | Value |
|-------|-------|
| Release | Pilot |
| Persona | Guild Administrator |
| Priority | Must |

**Acceptance criteria:**

- Given `role.grant`, then I invite a person by verified contact channel to a role bundle within the current Guild Term, selecting module scopes for a Publisher.
- Given the invitation, then it expires after a short window, requires the invitee to authenticate and enrol MFA before the grant activates, and is audited.
- Given a grant, then it always carries an expiry no later than the end of the current Guild Term.
- Given I attempt to grant a capability I do not hold, or to grant `role.grant` itself, then it is refused.
- Given `publication.priority` and `voice.identity`, then they are separately grantable and are not part of any default bundle.

---

#### CH-GOV-002 — Guild Term with automatic expiry ⭐

| Field | Value |
|-------|-------|
| Release | Pilot |
| Persona | Guild Administrator / Custodian |
| Priority | Must |

**As a** university, **I want** an outgoing Guild administration's access to end automatically, **so that** continuity does not depend on the outgoing administration choosing to revoke its own access.

**Why it matters:** Relying on an outgoing administration to revoke itself is a governance fantasy. Expiry-by-default is the only safe design, and it must exist from Pilot because retrofitting expiry onto live grants is messy.

**Acceptance criteria:**

- Given a tenant, then it has a sequence of Guild Terms with a label, start date, end date and status (`upcoming`, `active`, `closed`); exactly one may be active.
- Given a term closes, then every role grant bound to it expires automatically. No manual revocation is required in the normal case.
- Given approaching expiry, then the Custodian, current administrators and Platform are notified at defined intervals with the count of grants that will lapse.
- Given a term closes with no grants issued for the incoming term, then the tenant enters an administrative gap: student-facing content continues to serve, publishing is unavailable, scheduled publications do not fire, and the Custodian and Platform are alerted daily.
- Given historical content, then it remains attributed to the term in which it was published.

**Commercial V1 extension:** The fuller handover checklist and continuity pack (§24).

---

#### CH-GOV-003 — Tenant Custodian and emergency revocation

| Field | Value |
|-------|-------|
| Release | Pilot |
| Persona | Tenant Custodian |
| Priority | Must |

**Acceptance criteria:**

- Given a tenant, then it has a Custodian: a durable institutional post-holder who can revoke any tenant role at any time with a mandatory reason, without the cooperation of the person being revoked.
- Given the Custodian, then they cannot publish content, cannot see individual poll answers, and cannot see Voice submitter identity.
- Given the Custodian is unavailable or is themselves the problem, then Platform may act under break-glass (CH-PLT-004) with two-person approval, disclosed to the tenant.
- Given a contested handover, then the product takes no position on legitimacy; it executes the Custodian's or Platform's documented instruction and logs everything. Legitimacy is settled by the licence agreement (GOV-4), not by software.

---

#### CH-GOV-004 — Immediate privileged revocation ⭐

| Field | Value |
|-------|-------|
| Release | Pilot |
| Persona | System |
| Priority | Must |

**As a** university, **I want** a revoked administrator to lose all authority the instant revocation happens, **so that** a compromised or departed official cannot act during a propagation window.

**Why it matters:** A fifteen-minute window is enough to publish a Priority Notice to 30,000 students, approve a betting sponsor, access Voice identities, or grant a new role. This corrects Draft 0.1 explicitly.

**Acceptance criteria:**

- Given revocation or expiry of a privileged grant, then server-side authority is removed immediately — the very next authorised request is refused.
- Given active sessions and tokens held by that user, then they are invalidated or forced to re-authorise immediately.
- Given any permission cache, then it is validated against a revocation epoch or session version so that a stale cache cannot grant authority.
- Given a background job that was queued under the revoked authority, then it re-authorises at execution time and fails closed.
- Given a delay of any duration, then it may apply only to harmless visual or cache propagation of non-sensitive UI — never to authority.
- Given revocation, then the affected user is notified, other privileged users are notified, and the event is prominently recorded in the audit log.

**Dependencies:** Central authorisation decision point (§9.1), session model (§29-A3). This is an architecture requirement, not a product preference.

---

#### CH-GOV-005 — Compromised administrator response

| Field | Value |
|-------|-------|
| Release | Pilot |
| Persona | Guild Administrator / Custodian / Platform Operator |
| Priority | Must |

**Acceptance criteria:**

- Given a suspected compromise, then any Guild Administrator, the Custodian, or Platform can immediately suspend the account's grants (CH-GOV-004 applies).
- Given suspension, then a damage-review view lists everything that account did within a configurable recent window: publications, priority notices, role grants, verification decisions, sponsor approvals, XP adjustments, Voice identity accesses, and exports.
- Given actions taken by the compromised account, then each can be reversed through its normal correction path (unpublish, revoke grant, reverse XP, suspend campaign) — every reversal is audited with a reference to the incident.
- Given the incident, then Platform is notified automatically.

---

#### CH-GOV-006 — Tenant audit log

| Field | Value |
|-------|-------|
| Release | Pilot |
| Persona | Guild Administrator / Custodian |
| Priority | Must |

**Acceptance criteria:**

- Given `audit.view`, then I browse an append-only log filtered by actor, date, entity type and event type, showing actor, timestamp, action, entity and — where applicable — before/after values.
- Given the log, then it captures at minimum: role grants and revocations; publication publish/unpublish/correct; priority notice issue and retraction; poll create/open/close/void; verification decisions and roster imports; membership state changes; XP rule changes and manual adjustments; sponsor approvals and suspensions; Voice identity accesses; moderation decisions; tenant setting changes; exports; and Platform break-glass sessions.
- Given the log, then no role can edit or delete entries, including Platform (TI-11).
- Given audit entries, then they contain the minimum personal data necessary to be meaningful — actor identity and entity reference, not payload content that could re-expose redacted material.
- Given retention, then audit entries are retained for a minimum period defined in §27.7 and flagged for legal confirmation.

---

### 18.21 CH-CNT — Content Integrity & Takedown

#### CH-CNT-001 — Audit is immutable; public content is not ⭐

| Field | Value |
|-------|-------|
| Release | Pilot |
| Persona | Guild Administrator / Platform Operator |
| Priority | Must |

**As a** Guild Administrator who has discovered that a predecessor published someone's personal data, **I want** to remove it from public view while the record of what happened remains, **so that** we can meet a safety or legal obligation without erasing accountability.

**Why it matters:** Draft 0.1 said public content was immutable forever. That is unsafe. It would require CampusHub to keep defamatory material, leaked personal data, or content published by a compromised account publicly visible in order to preserve history. The correct rule separates the two.

**Acceptance criteria:**

- Given any published content, then the following visibility outcomes exist: `published`, `unpublished_with_reason`, `restricted` (visible only to authorised handlers), `redacted` (specific field or attachment removed, item otherwise intact), and `removed` (content withdrawn under a legal or safety basis).
- Given any of these actions, then the audit record permanently retains: what happened, who acted, when, and the broad reason category.
- Given a removed or redacted item, then the harmful content itself is not preserved in publicly reachable form, in caches, in media URLs, or in exports.
- Given a removal on a legal or safety basis, then the fact of removal, its date and its reason category remain visible in the tenant's record — removal is not invisible, but the content does not remain visible merely to preserve history.
- Given content published by a compromised account, then a rollback action unpublishes it in bulk with a single incident reference (CH-GOV-005).
- Given a subsequent Guild administration, then it cannot silently delete a predecessor's content: unpublishing requires a reason and leaves a permanent record.

---

#### CH-CNT-002 — Attachment and media redaction

| Field | Value |
|-------|-------|
| Release | Pilot |
| Persona | Guild Administrator |
| Priority | Must |

**As a** Guild Administrator who has just realised a Publisher attached a confidential document to a public announcement, **I want** it gone from everywhere within seconds, **so that** the exposure stops.

**Acceptance criteria:**

- Given an attachment, then it can be redacted independently of its parent item; the parent remains published with a visible note that an attachment was removed.
- Given redaction, then the file becomes unreachable through its media URL immediately, including any cached or CDN-fronted copy, and any signed URLs are invalidated.
- Given redaction, then the audit records the filename, the actor, the time and the reason — but not the file content.
- Given uploads generally, then: file type is validated by content inspection rather than extension; size limits apply; images are re-encoded and EXIF/GPS metadata stripped; original filenames are discarded and replaced with non-guessable identifiers; files are served from an isolated origin with correct content types and no inline execution; and access to non-public files requires authorisation matching the parent item's audience.

---

#### CH-CNT-003 — Student reporting

| Field | Value |
|-------|-------|
| Release | Pilot |
| Persona | Student |
| Priority | Must |

**Acceptance criteria:**

- Given any student-visible opportunity, sponsored placement, published Voice issue, or publication, then I can report it with a reason and an optional note, and I receive confirmation.
- Given a report indicating financial harm on an opportunity, then the item's visibility is suspended pending review (CH-OPP-002).
- Given a report, then it enters a single moderation queue with age and SLA indicators.
- Given repeated malicious reporting, then rate limits apply.
- Given a decision, then the reporter is notified of the outcome category.

---

### 18.22 CH-PRV — Privacy, Transparency & Data Rights

#### CH-PRV-001 — Student transparency page ⭐

| Field | Value |
|-------|-------|
| Release | Pilot |
| Persona | Student / prospective buyer |
| Priority | Must |

**As a** student, **I want** to see exactly what CampusHub collects, who can see it, and what my Guild and my university can and cannot access, **so that** I can decide whether to trust it enough to participate honestly.

**Why it matters:** This is simultaneously a trust feature and a sales asset. It should be shown in every demo, and it is the artefact that satisfies a university's data-protection contact fastest.

**Acceptance criteria:**

- Given any visitor or student, then a permanently accessible page states in plain language: what data is collected and why; what the Guild can see; what the university can see; what sponsors can see (and that they receive no personal data); how poll privacy works; how Student Voice identity works where the module is enabled; what data rights exist and how to exercise them; and the major retention principles.
- Given the page, then it is reachable before registration completes (CH-AUT-001).
- Given a tenant changes any setting that expands visibility, then the page reflects it within a short defined window and shows the change date.
- Given the page, then it must not promise privacy guarantees that the final architecture cannot enforce. Poll privacy language is written after the §29-A1 design review and matches what was actually built.
- Given the page, then it is written at a reading level suitable for a first-year student, not as a legal notice. The legal notice exists separately.

---

#### CH-PRV-002 — Access my data

| Field | Value |
|-------|-------|
| Release | Pilot |
| Persona | Student |
| Priority | Must |

**Acceptance criteria:**

- Given a request, then I receive a copy of my personal data for the active tenant: profile, membership and verification history, XP ledger, streak, saves, follows, RSVPs, Voice issues I authored, notifications, and login history.
- Given multiple memberships, then each tenant's export is separate and neither reveals the other (TI-12).
- Given the export, then it excludes anything revealing another person's data, and it excludes individual ballots — with an explicit plain-language statement of why.
- Given fulfilment, then it is delivered within a defined SLA via a time-limited authenticated download, and the request and fulfilment are audited.
- Given Pilot, then fulfilment may be operationally assisted rather than fully automated, provided the SLA is met and the process is documented.

---

#### CH-PRV-003 — Correction and deletion

| Field | Value |
|-------|-------|
| Release | Pilot |
| Persona | Student |
| Priority | Must |

**Acceptance criteria:**

- Given self-declared data, then I can correct it directly; for roster-derived data, CH-PRO-004 applies.
- Given a deletion request, then I am told plainly, before confirming, what will be deleted (profile, contact details, XP ledger, saves, follows, RSVPs, notifications, login history), what will be anonymised but retained (published Voice issues and their status history where they form part of a public record of institutional action; aggregate counts; audit entries), and what cannot be deleted (audit entries required for security and accountability).
- Given deletion completes, then the roster record is released for future claiming and I receive confirmation.
- Given a student with a historical Voice contribution, then the issue and its status history remain as an anonymised institutional record unless legal review concludes otherwise — this specific question is flagged for legal review (§31).
- Given deletion, then it applies to the tenant Membership; the global User account is separately closable.

---

#### CH-PRV-004 — Consent and lawful basis records

| Field | Value |
|-------|-------|
| Release | Pilot |
| Persona | System |
| Priority | Must |

**Acceptance criteria:**

- Given registration, then consent to the Privacy Notice and Terms is recorded with version, timestamp and method; pre-ticked boxes are prohibited.
- Given a material change expanding processing, then students are notified and re-consent is obtained before the expanded processing begins.
- Given a roster import, then the tenant's attestation of lawful basis is captured at import time (CH-VER-001). This creates evidence and accountability; it is not a legal conclusion.
- Given documentation, then it distinguishes where CampusHub acts as processor (roster data) and controller (behavioural data) — and this distinction is a legal-review blocker (§31), because it determines who answers a student's deletion request.

---

#### CH-PRV-005 — Restricted bulk export

| Field | Value |
|-------|-------|
| Release | Pilot |
| Persona | Guild Administrator / Custodian |
| Priority | Must |

**Acceptance criteria:**

- Given any export containing member-identifying data, then it requires a stated purpose, Custodian approval, a row limit, watermarking, and an audit entry (TI-8).
- Given the default configuration, then contact details are excluded from all bulk exports; including them requires explicit Platform approval and a recorded basis.
- Given a Guild Administrator, then routine bulk member listing and export is not available by default.
- Given member support, then a single-record lookup (CH-GOV-006 audited) is available showing display name, assurance level, verification history, membership state and XP total — not contact details, poll participation detail, Voice content authored, or quiz answers.

---

### 18.23 CH-PLT — Platform Operations & Support Access

#### CH-PLT-001 — Normal support access

| Field | Value |
|-------|-------|
| Release | Pilot |
| Persona | Platform Operator |
| Priority | Must |

**As a** Platform Operator handling a routine support request, **I want** to work without touching student data, **so that** access to personal information is the exception rather than the default.

**Acceptance criteria:**

- Given normal support, then it grants access to: tenant configuration, tenant lifecycle state, aggregate tenant health metrics, and system diagnostics containing no personal data.
- Given normal support, then it grants no access to member records, Voice content, poll data, or contact details.
- Given diagnostics and logs, then they exclude personal data by design.

---

#### CH-PLT-002 — Elevated support access

| Field | Value |
|-------|-------|
| Release | Pilot |
| Persona | Platform Operator |
| Priority | Must |

**Acceptance criteria:**

- Given a justified support action requiring member data, then I must select an explicit tenant context and record a reason from a fixed list plus a free-text justification.
- Given elevated access, then it is time-limited, read-only by default, and every record viewed is audited.
- Given the tenant, then the access appears in the tenant's own audit log — it is not hidden in a platform-only log.
- Given elevated access, then it never reveals individual poll answers (TI-2) and never reveals Voice submitter identity without the separate `voice.identity` capability and its own audit trail.

---

#### CH-PLT-003 — No silent impersonation

| Field | Value |
|-------|-------|
| Release | Pilot |
| Persona | System |
| Priority | Must |

**Acceptance criteria:**

- Given the platform, then a capability to log in as a student or an administrator without their knowledge is not implemented at all.
- Given a support need to see what a user sees, then the mechanism is a read-only, audited, tenant-visible view — never a session assumed under the user's identity.
- Given any support view of a member's experience, then the member's own security log records that it occurred.

---

#### CH-PLT-004 — Break-glass

| Field | Value |
|-------|-------|
| Release | Pilot |
| Persona | Platform Operator |
| Priority | Must |

**Acceptance criteria:**

- Given a rare security or continuity emergency, then break-glass may be invoked with: a recorded justification, an explicit scope, a hard time limit, two-person approval for any write action, and strong privileged authentication.
- Given a break-glass session, then it is recorded as a first-class object with open/close times and every action taken within it.
- Given the session closes, then it is disclosed to the tenant's Custodian and recorded in the tenant audit log.
- Given break-glass, then it cannot be used to view individual poll answers, because that capability does not exist anywhere in the system (TI-2).
- Given repeated break-glass use against the same tenant, then it is reported internally for review.

---

#### CH-PLT-005 — Platform content policy enforcement

| Field | Value |
|-------|-------|
| Release | Pilot |
| Persona | Platform Operator |
| Priority | Must |

**Acceptance criteria:**

- Given a published platform content policy, then it binds all tenants and covers at minimum: harassment, hate speech, incitement, threats, doxxing, sexual content, content sexualising minors (zero tolerance, immediate escalation and reporting in line with legal obligations), academic-fraud services, and the prohibited advertising categories.
- Given a tenant, then it may be stricter but never more permissive.
- Given a serious violation, then Platform may remove content and suspend accounts across tenants, notifying the tenant.
- Given enforcement action, then it is audited in both the platform and the affected tenant's log.

---

### 18.24 CH-SUB — Subscription & Tenant Lifecycle

#### CH-SUB-001 — Minimal subscription states

| Field | Value |
|-------|-------|
| Release | Pilot |
| Persona | Platform Operator |
| Priority | Must |

**As a** Platform Operator, **I want** the smallest coherent set of lifecycle states, **so that** every state has fully defined behaviour and nothing falls through a gap.

**Acceptance criteria:**

- Given a tenant, then its state is one of: `pilot`, `active`, `grace`, `suspended`, `archived`.
- Given each state, then the behaviour matrix in §22.2 is fully defined and implemented for: student access, admin access, publishing, scheduled jobs, notifications, sponsor serving, export, and reactivation.
- Given a state change, then it is audited and the tenant's Custodian and administrators are notified.
- Given Pilot, then no automated billing, invoicing or payment processing is built.

---

#### CH-SUB-002 — Commercial dispute must not remove essential student information

| Field | Value |
|-------|-------|
| Release | Pilot |
| Persona | Student / Platform Operator |
| Priority | Must |

**As a** student, **I do not want** to lose access to my university's published safety and academic information because my Guild is late paying an invoice.

**Acceptance criteria:**

- Given `grace`, then all student functionality continues unchanged; only administrators see a licence warning.
- Given `suspended`, then already-published content remains readable by students in a read-only mode with a neutral notice; new publishing, polls, Voice submission and notifications stop; scheduled jobs do not fire; sponsored placements stop serving.
- Given `suspended`, then students are never shown commercial dispute details.
- Given reactivation from `suspended`, then full function resumes without data loss; scheduled items whose time has passed are not retroactively fired and are returned to draft with an explanation.
- Given `archived`, then student access ends after a notified period and export is available to the tenant per CH-SUB-003.

**Rationale:** Removing a student's access to published safety information as leverage in a commercial dispute is unacceptable and would be reputationally fatal.

---

#### CH-SUB-003 — Tenant exit and export

| Field | Value |
|-------|-------|
| Release | Pilot |
| Persona | Custodian / Platform Operator |
| Priority | Should |

**Acceptance criteria:**

- Given a tenant exits, then an export is available containing: published content, events, opportunities, fixtures and results, aggregate analytics, aggregate poll results, Voice issues and status histories (anonymised), and the audit log — in open, documented formats.
- Given the export, then it excludes: individual ballots (which do not exist in linkable form), member contact details unless separately approved under CH-PRV-005, and any other tenant's data.
- Given the export, then it requires Custodian approval and is audited.
- Given archival, then tenant data is retained for a defined period and then anonymised or deleted per §27.7.

---

### 18.25 CH-QUA — Quality: Accessibility, Performance, Resilience

#### CH-QUA-001 — Accessibility baseline

| Field | Value |
|-------|-------|
| Release | Pilot |
| Persona | All students |
| Priority | Must |

**Acceptance criteria:**

- Given any screen, then it targets WCAG 2.2 Level AA: text contrast 4.5:1 body and 3:1 for large text and UI components; visible focus indicators; logical focus order; full keyboard operability; correct semantic structure and headings; labelled form fields with associated errors; and status messages announced to assistive technology.
- Given colour, then it is never the sole carrier of meaning — fixture states, sponsored labels, verification states, poll eligibility and correction indicators all carry text or icon.
- Given touch targets, then they are at least 44×44 CSS pixels with adequate spacing.
- Given motion, then reduced-motion preferences are honoured and every celebratory animation has a static equivalent; no information is conveyed by animation alone.
- Given text, then it reflows at 320px width and supports 200% zoom without loss of function.
- Given release, then accessibility is verified by automated checks in the build plus manual screen-reader testing of the core journeys: register, verify, read a publication, vote, RSVP, save an opportunity, play the quiz, and submit a Voice issue where enabled.

---

#### CH-QUA-002 — Performance and data budgets

| Field | Value |
|-------|-------|
| Release | Pilot |
| Persona | Student on a metered connection |
| Priority | Must |

**As a** student paying for data by the megabyte, **I need** CampusHub to be light, **so that** using it does not cost me money I would rather spend elsewhere.

**Acceptance criteria:**

- Given the low-bandwidth philosophy, then it is non-negotiable: minimise page weight, avoid unnecessary client-side complexity, optimise and lazy-load images, paginate every list, and cache the shell for repeat visits.
- Given numerical budgets, then they are recorded as engineering targets to validate during architecture and performance testing, not as scientifically proven thresholds. Initial targets:
  - Home initial transfer ≤300KB compressed excluding images
  - Total initial payload including above-the-fold images ≤600KB
  - Meaningful content visible within ~5s and interactive within ~8s on a 3G-class connection
- Given the build pipeline, then page-weight budgets are enforced automatically once validated, and a regression fails the build.
- Given the targets, then they are reviewed after real-device testing on the target market's common handsets and adjusted with a recorded rationale rather than silently abandoned.

---

#### CH-QUA-003 — Resilience and graceful failure

| Field | Value |
|-------|-------|
| Release | Pilot |
| Persona | Student |
| Priority | Must |

**Acceptance criteria:**

- Given a request failure, then I see a specific, actionable message and a retry — never a raw error and never an indefinite spinner.
- Given a submission that may have partially succeeded (vote, RSVP, quiz answer), then the client retries idempotently and I am never shown an ambiguous outcome.
- Given one module is unavailable, then the rest of the application continues to function and the affected area shows a contained failure state.
- Given every list and detail view, then defined empty, loading, error and offline states exist and are specified in design.
- Given offline, then previously loaded campus content remains readable where the PWA shell permits.

---

#### CH-QUA-004 — Device and browser support

| Field | Value |
|-------|-------|
| Release | Pilot |
| Persona | Student / Guild Administrator |
| Priority | Must |

**Acceptance criteria:**

- Given the student experience, then it supports current and previous two major versions of widely used mobile browsers, with Android as the dominant target.
- Given the admin workspace, then it supports current desktop browsers and remains functional on a tablet or large phone for urgent publishing.
- Given a low-end device with limited memory, then core reading, verification, participation and Voice submission must work; animations and optional enhancements may degrade.
- Given all user-facing strings, then they are externalised for future localisation; Pilot ships in English with tenant-overridable terminology labels (CH-TEN-003).

---

## 19. Pilot Product Metrics

These are product-learning metrics, not guarantees or contractual commitments. Their purpose is to answer whether the Pilot is worth continuing.

### 19.1 Adoption

| Metric | Question it answers |
|--------|---------------------|
| Registered memberships | Did students sign up at all? |
| Verified memberships (L2+) as a share of roster | Is verification working, or is it the drop-off point? |
| Verification funnel by level and by method | Which route works, and where do students give up? |
| Weekly active students | Do they come back within a week? |
| Returning students (active this week and last) | Is there a habit, or only a launch spike? |

### 19.2 Communication

| Metric | Question it answers |
|--------|---------------------|
| Publications published per week | Is the Guild actually supplying content? (The most common failure mode.) |
| Publication reach and open rate | Is Guild communication landing? |
| Priority Notice count and reach | Is the high-trust channel being used, and being used sparingly? |

### 19.3 Participation

| Metric | Question it answers |
|--------|---------------------|
| Poll turnout as a share of eligible cohort | Do students believe participation is worth it? |
| Event RSVP counts and conversion from view | Is the events module doing work? |
| Opportunity saves and outbound clicks | Is the strongest acquisition hook actually being used? |
| Voice submissions and median time to resolution (where enabled) | Is the module credible, and is the tenant staffing it? |

### 19.4 PLAY

| Metric | Question it answers |
|--------|---------------------|
| Daily Quiz participation as a share of weekly active | Does anyone play it? |
| XP-earning members as a share of weekly active | Is the mechanic touched at all? |
| Streak participation and distribution of streak length | Do students actually care about Streak? This is the specific question Streak is in Pilot to answer. |
| Streak abandonment after first reset | Is the mechanic motivating or discouraging? |

### 19.5 Sponsorship (if tested)

Sponsored placement views, clicks, and click-through rate. Nothing further.

### 19.6 Interpretation Rules

- Every metric is read against the academic calendar; a recess trough is not a failure.
- PLAY metrics are read relative to KNOW metrics. If Play participation is high while publication reach is low, the product has become a game with a noticeboard attached, and that is a failure regardless of engagement figures.
- Streak has an explicit kill criterion: if streak participation is negligible or abandonment after first reset is very high, Streak is removed rather than elaborated.

---

## 20. Pilot Non-Functional Requirements

| ID | Requirement |
|----|-------------|
| **NFR-1** | **Tenant isolation.** Every tenant-scoped operation carries and enforces tenant context at the authorisation boundary. Cross-tenant access attempts return not-found and raise a security event. Negative isolation tests are mandatory for every tenant-scoped resource and the build fails without them. No background job, export, search index, notification job, media URL, cache entry or analytics pipeline may operate across tenants. |
| **NFR-2** | **Authentication and session security.** Credentials stored with a current memory-hard hashing standard. MFA mandatory for privileged roles. Session tokens rotated on privilege change. Absolute and idle lifetimes enforced, shorter for privileged roles. All sessions revocable by the user and by administrators. Re-authentication for sensitive actions. Privileged authority revocation is immediate (CH-GOV-004). |
| **NFR-3** | **Authorisation.** A single centralised authorisation decision point covering capability, tenant context, assurance level and resource scope. No feature implements ad-hoc permission logic. Default deny. |
| **NFR-4** | **Privacy by design.** Field-level data minimisation. Suppression floors on all aggregate reporting. Poll answer non-exposure per the reviewed design. No cross-module joining of behavioural data for targeting. No personal data in logs, error reports or analytics events. Tenant-local pseudonymous analytics identifiers only. |
| **NFR-5** | **Auditability.** Append-only, tamper-evident audit log for all privileged actions, retained per §27.7, exportable, never editable by any role including Platform. |
| **NFR-6** | **Performance.** Client budgets per CH-QUA-002. Server-side targets to be validated in architecture: read endpoints and write endpoints must sustain a burst load, because a campus-wide Priority Notice produces a near-simultaneous spike from thousands of students. Capacity planning assumes burst, not average. |
| **NFR-7** | **Availability.** Availability target for student-facing functions during in-session periods, to be set in the architecture phase. Planned maintenance outside campus daytime hours in tenant timezone. Degraded-mode reading of cached content is preferred to hard failure. |
| **NFR-8** | **Backup and recovery.** Automated backups with documented RPO and RTO targets; restore procedure tested with a recorded result before paid launch and periodically thereafter. Backups are subject to the same isolation, retention and redaction rules as live data — including CH-CNT-001 removals. |
| **NFR-9** | **Observability.** Structured logging without personal data; error tracking; uptime and latency monitoring; alerting on isolation-violation events, verification queue growth, moderation SLA breach, XP reconciliation drift, notification volume anomalies, and priority-notice rate approaches. |
| **NFR-10** | **Scalability planning assumptions.** Pilot design point: a small number of tenants; largest tenant in the tens of thousands of members; peak concurrency driven by Priority Notices and results rather than steady traffic. These are planning assumptions to validate, not capacity guarantees. |
| **NFR-11** | **XP integrity.** Ledger-derived balances, idempotent awards, a daily reconciliation job verifying total = sum(ledger), and alerting on drift. |
| **NFR-12** | **File and media handling.** Per CH-CNT-002, plus per-tenant storage quotas, automatic image optimisation, and immediate invalidation on redaction. |
| **NFR-13** | **Time handling.** All timestamps stored in UTC. All user-facing and rule-boundary logic — day boundaries, streaks, publication scheduling, poll open/close, quiz instances — computed in the tenant timezone. Device timezone is never authoritative. |
| **NFR-14** | **Tenant lifecycle correctness.** Every subscription state has fully defined behaviour for students, admins, publishing, jobs, notifications, sponsors and export (§22.2). No state may leave a job running that notifies a suspended tenant's students. |
| **NFR-15** | **Configuration safety.** Every tenant-configurable setting has a safe default, a documented range, an audit record, and — where it affects fairness or privacy — a confirmation showing the projected effect. |
| **NFR-16** | **Security testing.** Dependency scanning in CI. Secrets never in source. An independent penetration test covering tenant isolation, the poll mechanism, authorisation bypass, session revocation and file upload before the first paid launch. A published vulnerability disclosure contact. |
| **NFR-17** | **Accessibility.** Per CH-QUA-001, verified each release. |
| **NFR-18** | **Analytics integrity.** One definition per metric, one computation path, consistent exclusions on every surface, so the number the Guild sees, the number in the export and the number Platform sees are the same number. |

---

## 21. Pilot Domain Model (Conceptual)

### 21.1 Platform Scope (Not Tenant-Scoped)

- User (credentials, verified contact channels with provenance, MFA, recovery state, sessions, consent records)
- Tenant
- Subscription
- PlatformStaff
- PlatformAuditEvent
- ContentPolicy
- ProhibitedDomainList
- LevelDefinition
- XPRuleBounds
- SupportSession

> The User record contains no behavioural data from any tenant (TI-12).

### 21.2 Tenant Scope

Every entity below carries a tenant reference as an invariant, and every relationship crosses only within one tenant.

| Entity | Notes |
|--------|-------|
| Campus | ≥1 per tenant; never deleted once referenced |
| HierarchyNode | Academic division / programme; rename-safe, merge-safe, effective-dated |
| AcademicCalendarPeriod | Non-overlapping, typed |
| GuildTerm | Exactly one active; grants expire with it |
| Membership | One per (User, Tenant); holds assurance level, state, hierarchy attributes |
| RoleGrant | Bound to a GuildTerm; carries capabilities and module scopes |
| RosterRecord | Student number unique within tenant; claimed by at most one Membership |
| RosterImportBatch | Immutable report; attestation recorded |
| StudentProfile | Fields classified by provenance |
| VerificationCase | Manual review; checklist and reviewer recorded |
| Publication | Type notice/news; priority flag; audience; revisions; visibility outcome |
| Organiser | Attribution label only |
| Event / Rsvp | RSVP aggregate-only in Pilot |
| Opportunity / VettingRecord | Deadline mandatory; vetting checklist recorded |
| Sport / Competition / Team / Fixture / Result / ManualStanding | Simple; corrections retain prior values |
| Poll / PollParticipation / Ballot | Mechanism subject to §29-A1. Participation proves a member voted; Ballot holds the answer and only the minimal frozen attributes required for permitted reporting; no member reference on Ballot |
| VoiceIssue / IssueStatusHistory / IssueSupport | Append-only status history; identity access audited |
| XPRule / XPEvent | Append-only ledger with idempotency key |
| StreakState | One increment per tenant-day |
| Challenge / Question / Option / ChallengeAttempt | Quiz as one challenge type |
| Sponsor / Placement / PlacementMetricDaily | Aggregate metrics only |
| Notification | Idempotent per (membership, source, type) |
| SavedItem / Follow | Tenant-local |
| AuditEvent | Append-only, immutable |
| ExportRequest | Purpose, approver, watermark, audit |

### 21.3 Reserved but Not Implemented in Pilot

EnergyBalance, EnergyTransaction, LeaderboardPeriod, LeaderboardEntry, Badge, Reward, RewardClaim, RedemptionCode, Club, SponsorUser, Campaign (richer commercial object), GroupCompetition, Prediction.

These are named here so that Pilot data structures do not preclude them, not so that they are built.

### 21.4 The Three Structural Invariants

1. No entity references another tenant's entity. Only User and platform catalogue entities are global.
2. No product path exists from a Membership to its Ballot — not in data, not in code, not in exports, not in backups. Subject to the §29-A1 review.
3. XP total is always derivable from the append-only ledger.

---

## 22. Pilot State Models

Only states actually required for Pilot are listed.

**Membership:**
`unverified` → `pending_review` → `verified`; `verified` ⇄ `stale`; `verified` → `on_leave` → `verified`; `verified` → `alumni`; `verified` → `transferred_out`; any → `participation_suspended` → restored; any → `suspended` → restored or `closed`.

**Assurance level** (an attribute of Membership, not a state machine):
L0 → L1 → L2 → L3, monotonic in normal operation; may be reduced only by an audited administrative decision with a recorded reason.

**Publication:**
`draft` → `scheduled` → `published` → `expired`; `published` → `unpublished_with_reason`; `published` → `redacted` (attachment/field); `published` → `removed` (legal/safety); `expired` → `archived`.

**Poll:**
`draft` → `scheduled` → `open` → `closed` → `archived`; `open` | `closed` → `voided`. Configuration locks at first participation.

**Fixture:**
`scheduled` ⇄ `postponed`; `scheduled` → `cancelled`; `scheduled` → `completed` → `result_published`; `result_published` → `corrected` (retains prior value); `scheduled` | `completed` → `abandoned`.

**Voice issue:**
`submitted` → `in_moderation` → {`rejected` | `restricted` | `published`}; `published` → `acknowledged` → `under_review` → {`action_planned` | `escalated`} → {`resolved` | `closed_no_action`}; from most states: `duplicate_merged`, `withdrawn_by_submitter`.

**Placement (sponsorship):**
`draft` → `pending_approval` → {`rejected` | `approved`} → `live` → `completed`; `live` → `suspended`; pre-live → `cancelled`.

**Challenge attempt:**
`created` → `in_progress` → `submitted` → `scored`; `in_progress` → `expired` → `scored`; `in_progress` → `abandoned` at day boundary; any → `voided` (platform fault or invalid question) with no XP penalty and a replacement attempt.

**Guild Term:**
`upcoming` → `active` → `closed`. Grants auto-expire at close. No active term = administrative gap.

**Subscription:**
`pilot` → `active` → `grace` → `suspended` → `archived`; reactivation to `active` from `grace` or `suspended`.

### 22.2 Subscription State Behaviour Matrix

| Capability | pilot | active | grace | suspended | archived |
|------------|-------|--------|-------|-----------|----------|
| Student access | Full | Full | Full | Read-only, existing content | Ends after notice period |
| Admin access | Full | Full | Full + licence warning | Read-only + licence notice | Export only |
| Publishing | Yes | Yes | Yes | No | No |
| Scheduled jobs | Run | Run | Run | Do not fire | Do not fire |
| Notifications | Sent | Sent | Sent | Not sent | Not sent |
| Sponsor serving | Per config | Yes | Yes | Stops | Stops |
| Export | Yes | Yes | Yes | Yes (Custodian) | Yes (Custodian) |
| Reactivation | → active | — | → active, full | → active, full, no retro-firing | Platform action + data check |

---

## 23. Pilot Coverage Matrix

| Pilot capability | Stories |
|------------------|---------|
| Tenant provisioning and isolation | CH-TEN-001..005; NFR-1 |
| Campus dimension | CH-TEN-002, CH-ORG-001 |
| Configurable hierarchy and terminology | CH-TEN-003, CH-ORG-001..003 |
| Academic calendar | CH-TEN-004, CH-STK-002 |
| Launch readiness gate | CH-TEN-005 |
| Registration, login, logout | CH-AUT-001, 002, 003 |
| MFA for privileged roles | CH-AUT-004 |
| Account recovery | CH-AUT-005, CH-AUT-008 |
| Safe contact-detail change | CH-AUT-006 |
| Shared-device / session safety | CH-AUT-007 |
| Global User / Membership boundary | CH-MEM-001..003; TI-12 |
| Multiple memberships and active tenant context | CH-MEM-003 |
| Transfer, alumni, dual role | CH-MEM-004, 005, 006 |
| Roster import with safeguards | CH-VER-001, 002, 003 |
| Evidence-based verification | CH-VER-004, 005, 006, 007 |
| Progressive profiling and field classification | CH-PRO-001, 002 |
| Contextual profile gating | CH-PRO-003 |
| Attribute correction and anti-gaming | CH-PRO-004, CH-ORG-002 |
| Campus Home | CH-HOM-001, 002, 003 |
| Publications (merged) | CH-PUB-001..005 |
| Priority Notice abuse control | CH-PUB-006 |
| Events | CH-EVT-001..004 |
| Opportunities and scam vetting | CH-OPP-001..004 |
| Sports (simplified) | CH-SPT-001..005 |
| Polls | CH-POL-001..008 (§29-A1 blocker) |
| Poll trust invariant | CH-POL-001; TI-2 |
| Student Voice (tenant-conditional) | CH-VOX-001..007 |
| Voice readiness gate | CH-VOX-001 |
| XP ledger and rules | CH-XP-001..004 |
| Levels | CH-XP-005 (§30-U2 blocker) |
| Simple Streak | CH-STK-001..003 |
| Daily Campus Quiz | CH-QIZ-001..005 |
| Simple sponsorship | CH-SPN-001..005 |
| Notifications | CH-NTF-001..004 |
| Reduced analytics | CH-ANL-001..004 |
| Roles, terms, immediate revocation, audit | CH-GOV-001..006 |
| Audit immutability vs content takedown | CH-CNT-001, 002 |
| Student reporting | CH-CNT-003 |
| Transparency page | CH-PRV-001 |
| Data rights | CH-PRV-002, 003, 004 |
| Bulk export control | CH-PRV-005 |
| Platform support tiers and break-glass | CH-PLT-001..005 |
| Subscription lifecycle | CH-SUB-001..003 |
| Accessibility, performance, resilience | CH-QUA-001..004 |
| Leaderboards | Not in Pilot — §24 |
| Campus Energy | Not in Pilot — §25 |
| Web push | Not in Pilot — §24 |
| Rewards, badges, sponsored challenges | Not in Pilot — §25 |

---

## 24. Commercial V1 Backlog

Commercial V1 turns the validated Pilot into a repeatable paid annual SaaS product. Items are grouped and sized, not fully specified; each will be expanded into full stories after Pilot evidence is in.

### 24.1 Commercial Operation

| ID | Item | Priority | Notes |
|----|------|----------|-------|
| CV-SUB-001 | Full annual subscription lifecycle: renewal dates, licence records, seat/tenant terms, renewal reminders | Must | Still no payment processing; invoicing remains external |
| CV-SUB-002 | Tenant lifecycle maturity: dormancy, archival policy, reactivation with data integrity checks | Must | |
| CV-SUB-003 | Sponsor obligation handling during suspension | Must | Resolves GOV-8 |
| CV-OPS-001 | Production support runbooks, incident response, escalation paths | Must | |
| CV-OPS-002 | Backup/restore validation with recorded quarterly test results | Must | |
| CV-OPS-003 | Security and penetration-test readiness; remediation cycle | Must | Gate for paid launch |

### 24.2 Governance and Continuity

| ID | Item | Priority | Notes |
|----|------|----------|-------|
| CV-HND-001 | Guild Term handover workflow: checklist, incoming-admin onboarding, historical office-holder archive | Must | Pilot has the term and expiry; V1 adds the workflow |
| CV-HND-002 | Continuity pack: open commitments, live placements, open Voice issues, scheduled content, historical analytics | Should | |
| CV-GOV-001 | Constrained University Official view: counts, trends, Voice category-level statistics, own notice reach — no content, no identity, no individual data | Must | Contingent on GOV-5 being settled in the licence |
| CV-GOV-002 | Fuller audit export with filtering and scheduled delivery | Should | |
| CV-GOV-003 | Formal takedown-request register: requester, basis, decision, outcome, visible in tenant transparency record | Should | Resolves part of GOV-5 |

### 24.3 Trust, Privacy and Safety Maturity

| ID | Item | Priority | Notes |
|----|------|----------|-------|
| CV-PRV-001 | Fuller self-service data-rights tooling: automated access export, deletion workflow with staged confirmation | Must | Pilot may fulfil operationally; V1 automates |
| CV-PRV-002 | Retention automation: scheduled anonymisation/deletion jobs with run logs, per §27.7 once legal review completes | Must | |
| CV-PRV-003 | Consent version management and re-consent flow on material change | Should | |
| CV-TSF-001 | Unified moderation queue across Voice, reported opportunities, reported placements and reported profile media, with SLA breach alerting | Must | |
| CV-TSF-002 | Appeals workflow with second-reviewer routing where staffing allows | Should | |
| CV-VOX-001 | Mature Student Voice for prepared tenants: additional categories only where a formally reviewed workflow and trained handlers exist; escalation runbooks; sensitive-disclosure routing designed with welfare professionals | Should | Requires legal and welfare review (§31). Sensitive categories remain prohibited until that review completes |
| CV-VOX-002 | Voice transparency record: aggregate outcomes published to students | Could | |

### 24.4 Engagement Maturity (Evidence-Gated)

| ID | Item | Priority | Trigger |
|----|------|----------|---------|
| CV-LDR-001 | Weekly campus leaderboard with neighbourhood ranking (percentile bands, not raw ranks), opt-out, suppression below a participant floor, immutable finalised snapshots | Should | Pilot shows meaningful XP participation and no evidence that PLAY is crowding out KNOW |
| CV-LDR-002 | Faculty filter on the leaderboard | Could | Leaderboard adopted |
| CV-STK-001 | Academic-calendar-aware Streak maturity: exam-period rules, per-programme calendars if needed, clearer pause communication | Should | Pilot streak data shows the mechanic is used but the calendar model is too blunt |
| CV-XP-001 | XP rule calibration tooling with projected-effect preview before a change | Should | Tenants request rule changes |
| CV-QIZ-001 | Question bank tooling: bulk import, scheduling, category balance, exhaustion forecasting | Should | Quiz participation sustained |

> Kill criteria apply. If Pilot metrics (§19.4) show negligible Streak or quiz participation, the correct Commercial V1 action is to remove the mechanic, not to mature it.

### 24.5 Sponsorship Maturity

| ID | Item | Priority | Trigger |
|----|------|----------|---------|
| CV-SPN-001 | Campaign lifecycle: multiple placements per campaign, flight scheduling, structured approval workflow | Should | ≥2 concurrent sponsors in ≥2 tenants |
| CV-SPN-002 | Payment recording (manual): amount contracted, amount received, method, reference, internal-only visibility | Should | Guilds ask for it. Still no payment processing |
| CV-SPN-003 | Sponsor-facing report as a polished artefact with methodology statement and suppression applied | Should | First sponsor renewal cycle |
| CV-SPN-004 | Placement inventory management and simple scheduling conflicts (calendar view, not an engine) | Could | Multiple concurrent placements |

**Still excluded at Commercial V1:** Sponsor logins, delivery pacing algorithms, even-share engines, contractual exclusivity enforcement, behavioural targeting, assurance-level targeting, automated billing.

### 24.6 Content and Campus Maturity

| ID | Item | Priority | Trigger |
|----|------|----------|---------|
| CV-SPT-001 | Automatic league standings for simple league formats, with manual override retained | Should | Sports proves a top-three module by usage |
| CV-PUB-001 | Editorial approval workflow (draft → review → publish) | Could | Tenants with more than a handful of publishers |
| CV-ANL-001 | Richer analytics needed for renewal: retention view, module comparison, period-over-period narrative | Should | Renewal conversations show the Pilot set is insufficient |
| CV-NTF-001 | Web push, opt-in, same categories, no native app dependency | Could | Evidence that in-app and email reach is insufficient for urgent notices |

---

## 25. Phase 2 Backlog

Every item carries a trigger. If the trigger has not fired, the item is not built.

| # | Item | Domain | Trigger |
|---|------|--------|---------|
| 1 | Rewards and promotions: XP/Level as eligibility (never currency), single-use codes, merchant validation, stock, fraud controls | REW | Sponsor demand proven and ≥1 merchant partner signed |
| 2 | Sponsored challenges with aggregate reporting and prize fulfilment tracking | SCH | Rewards live and ≥2 repeat sponsors. Gated on the promotional-competition licensing question (§27.9) |
| 3 | Sports predictor: pre-fixture predictions, small XP, no stakes, no money, lockout at kick-off, void on cancellation | QIZ | Sports is a top-three module and quiz completion is healthy |
| 4 | Automated Guild Impact Report with term attribution | IMP | Second renewal cycle; manual export proves insufficient |
| 5 | Manifesto / commitment tracker with tamper-evident status history | IMP | Requested by ≥2 tenants after a full Guild Term |
| 6 | Clubs and societies as account-holding entities: profiles, followers, scoped admins, own events and publications, approval workflow | ORG | The Guild is demonstrably the bottleneck on content supply |
| 7 | Campus Energy as a pacing mechanic | ENR | ≥3 concurrent challenge types AND evidence of over-consumption or content exhaustion. Not before |
| 8 | Faculty and hall competitions with a fairness model (participation rate weighted above normalised median effort; frozen denominators; minimum group size; non-resident cohorts as first-class groups; contribution caps) | GRP | Leaderboard participation is a meaningful share of weekly active users, and real XP distribution data exists to calibrate |
| 9 | Leaderboard seasons and badges | LDR | Weekly leaderboard shows a retention lift |
| 10 | Additional mini-games (campus location guess, word game) | QIZ | Quiz completion sustained and bank exhaustion is a real risk |
| 11 | Sponsor portal: read-only campaign dashboard, no personal data | SPN | ≥5 concurrent sponsors per tenant |
| 12 | Event check-in and consented attendee lists | EVT | Ticketed or capacity-limited events requested, and consent design reviewed |
| 13 | Team rosters, knockout brackets, richer competition formats, individual athletics | SPT | Sports coordinators request it after V1 standings ship |
| 14 | Richer notification channels (SMS for critical notices only, hard budget cap) | NTF | Evidence that in-app and email are insufficient for emergencies, and unit economics support it |
| 15 | Cross-tabulated analytics with reviewed disclosure controls | ANL | Guilds repeatedly hit the single-dimension limit for a legitimate purpose |
| 16 | Future integrations (SSO, SIS roster sync) | INT | A university with the capability and the appetite requires it as a condition of purchase |

> **Note on cross-university features** (inter-university leagues, national challenges): these are commercially attractive and architecturally dangerous, because they break the isolation invariant the whole product rests on. If ever pursued, they must be an explicit federation layer sharing only consented, pseudonymous aggregates — never member records — and must undergo a separate privacy review. They are not in this roadmap.

---

## 26. Explicit Out-of-Scope Register

### 26.1 Permanently Out of Scope — Requires Formal Re-Chartering

- Binding Guild or university elections; any binding vote
- Tuition or fee payment
- Academic results, transcripts or course registration
- LMS functionality
- An unrestricted student public-posting network
- Anonymous confession platform
- General student-to-student private messaging or group chat
- Student marketplace or classifieds
- Gambling, real-money wagering, or any prize draw with paid entry
- Movement of money through the product
- Purchasable XP or any pay-to-win engagement mechanic
- Sale, licensing or transfer of student personal data to any third party

### 26.2 Out of Pilot, Deliberately

Leaderboards of any kind; Campus Energy; Campus Coins or any second currency; badges; rewards and voucher redemption; sponsored challenges; sports predictor; any game beyond the Daily Quiz; faculty and hall competitions; leaderboard seasons; streak freezes and purchasable restoration; manifesto tracker; automated Guild Impact Report; clubs as account-holding entities; sponsor logins; sponsor delivery pacing; sponsor conflict/exclusivity engines; sponsor payment gates; behavioural or assurance-level ad targeting; web push; native applications; maps and geolocation; automatic sports standings; knockout brackets and team rosters; event check-in and attendee lists; multi-step editorial approval; poll answer changing; Voice comment threads; student directory; custom display handles; SMS at scale; SSO and SIS integration; date of birth collection; machine-learning personalisation; retention cohort dashboards; arbitrary analytics cross-tabulation.

### 26.3 Rejected Outright, Not Merely Deferred

| Item | Reason |
|------|--------|
| Poll answer changing | Requires linking a member to their ballot, which destroys the core trust invariant. |
| Voice comment threads | Converts an accountability channel into an unmoderatable argument. |
| Student directory | Creates a harassment and scraping surface with no product benefit. |
| Custom display handles | Enables impersonation of officials and other students. |
| Silent user impersonation for support | No legitimate support need justifies it (CH-PLT-003). |
| Sponsor targeting by verification assurance | Creates a quality score on students with no advertising purpose (TI-4). |

---

## 27. Privacy / Security / Abuse Analysis

Focused on the revised Pilot scope.

### 27.1 Tenant Isolation

**Threat:** A member or administrator of tenant A reaches tenant B's data through a mis-scoped identifier, a shared background job, an export, a search index, a cached media URL, or an analytics query.

**Impact:** Existential — it ends the business.

**Mitigations:** NFR-1 with mandatory negative tests per tenant-scoped resource as a build gate; not-found responses on cross-tenant attempts plus a security event; explicit tenant context on every background job; tenant-local pseudonymous analytics identifiers; no global query over member data anywhere in the product; isolation in penetration-test scope. The highest-risk surface is the multi-membership user (CH-MEM-003), which must have dedicated tests asserting no tenant-A response contains any tenant-B reference.

### 27.2 Verification Bypass and Identity Claiming

**Threats:** Student-number enumeration (numbers are patterned and semi-public); a classmate claiming someone's roster record first; invite-code leakage; social engineering of manual review.

**Mitigations:** Neutral error messages that do not confirm whether a student number exists; strict rate limiting and lockout per account, per student number and per source; claim disputes freeze both accounts pending review (CH-VER-006); invite codes capped at L1 with velocity auto-suspension (CH-VER-007); manual review requires a recorded checklist and reviewer identity; L3 requires a roster-supplied contact channel, which an impostor typically cannot control.

**Residual risk, accepted and documented:** A determined impersonator with a classmate's surname and student number can reach L2 first. Compensating controls: the true owner discovers it on their own verification attempt and triggers a dispute; L2 alone does not satisfy a high-integrity poll gate where the tenant sets L3; and a claimed account carries no material value in Pilot because there are no rewards.

### 27.3 Poll Privacy

**Threats:** Administrator curiosity; political pressure on a Guild officer; inference through very small cohorts; correlation of participation timestamps with ballots; debug identifiers persisted "temporarily"; backup copies retaining linkage.

**Mitigations:** The trust invariant (CH-POL-001, TI-2); no product surface capable of the query; frozen cohort attributes; coarse or unexposed ballot timing; suppression with complementary suppression; single-dimension breakdowns at most; minimum eligible cohort before results publish; XP awarded from the participation record, never the ballot.

The critical control is the §29-A1 design review. The specification deliberately does not claim technical unlinkability as an achieved property. If the reviewed design cannot deliver it, the product must either adopt an honestly described weaker model or not ship polls.

**Accepted trade-off:** Individual fraudulent ballots cannot be surgically removed. The remedy is poll-level (void, annotate, re-run), which is acceptable precisely because polls are non-binding.

### 27.4 Aggregation Thresholds

The k = 10 / 20 / 200 figures from Draft 0.1 are not mathematically proven privacy guarantees and must not be presented as such. They are reframed as policy defaults subject to real university cohort sizes, legal and security review, and Pilot experience (CH-ANL-004). A threshold of 20 is meaningless protection in a programme of 22 students and needlessly destructive in a faculty of 4,000. The Pilot defence is structural rather than numerical: top-line results, fixed reports, at most one breakdown dimension, no arbitrary exploration, and complementary suppression.

### 27.5 Compromised Administrator

**Threat:** A Guild Administrator is phished; the attacker issues a Priority Notice to the whole university, approves a betting sponsor, accesses Voice identities, alters results, or grants themselves persistence.

**Mitigations:** Mandatory MFA (CH-AUT-004); re-authentication for sensitive actions; immediate authority revocation (CH-GOV-004); term-bound auto-expiring grants (CH-GOV-002); Custodian and Platform emergency revocation (CH-GOV-003); no bulk contact export by default (CH-PRV-005); Priority Notice rate limits and separate capability (CH-PUB-006); capped and audited XP adjustment; append-only audit; damage-review and rollback (CH-GOV-005, CH-CNT-001).

### 27.6 Minors and Date of Birth

Some first-year university students are under 18. Draft 0.1 proposed importing date of birth to solve advertising concerns. This specification rejects that.

The Pilot position is universal student-safe advertising restrictions: prohibited categories apply to every student regardless of age; there is no behavioural targeting; there are no rewards, prizes or gambling-adjacent mechanics; and sponsored content is capped and clearly labelled. Under this posture, knowing a student's age changes nothing about what they are shown — so collecting it would be data expansion with no protective benefit.

Date of birth is collected only if an independently justified legal or product requirement emerges and legal review supports it. Minors policy is flagged as a human legal-review item (§31), and the outcome may change this position — but it must be driven by a legal conclusion, not by an advertising convenience.

### 27.7 Data Retention

Draft 0.1's precise retention table is not carried over wholesale. Retention is separated into three categories:

**Product defaults (set now, safe, adjustable):**
- Roster import source files deleted shortly after commit and audit
- Verification evidence documents deleted shortly after decision
- Notifications retained a few months
- Placement impression/click event detail retained short-term then aggregated
- Staged imports expire if uncommitted

**Legal-review requirements (not set here):**
- Audit log retention period
- Voice issue and status-history retention and the lawfulness of retaining anonymised records against a deletion request
- XP ledger retention
- Deactivated-account anonymisation timing
- Tenant data retention after archival
- Backup retention and its interaction with deletion and redaction

**Tenant-configurable within platform bounds:**
- Roster-absence grace period before stale
- Alumni read-access retention

**Governing preferences:** Data minimisation first; anonymisation in preference to indefinite retention; short retention for operational data with no ongoing purpose; longer retention only where justified by audit, security or institutional history. Unresolved periods are listed in §31 and §33.

### 27.8 Student Voice Abuse

**Threats:** Defamation and naming individuals (prevented by category rules and pre-moderation, CH-VOX-002/005); harassment campaigns (pseudonymity to peers, no comment threads, reporting, moderator accountability); support-count brigading (one support per member, no XP, and the UI never promises that a threshold triggers action); duplicate flooding (rate limits and merge); malicious reporting (rate limits); retaliation against an identified submitter (identity access is capability-gated and audited, University Officials never see identity, and the student can see when their identity was accessed).

The largest risk is not abuse but abandonment — an issue channel that collects complaints and produces no visible outcomes destroys trust faster than having no channel. CH-VOX-006's public status history and CH-VOX-001's auto-suspension on lapsed staffing are the controls.

### 27.9 Governance, Political and Regulatory Risk

- **Polls drifting into elections:** Prevented by in-product non-binding labelling, refusal to build secret-ballot election features, and the explicit out-of-scope register.
- **Surveillance pressure:** University Official access is constrained by default, any expansion is audited and disclosed on the transparency page, and the boundary is written into the licence rather than negotiated per deal.
- **Promotional competition licensing:** Pilot has no prizes — quiz XP has no cash or goods value — so the question does not arise. Any Phase 2 sponsored challenge or prize draw may fall within promotional-competition licensing requirements in the operating jurisdiction and requires a written legal opinion before launch. This is a flag, not a legal conclusion.
- **Data protection:** The controller/processor split between CampusHub and each university (roster versus behavioural data), registration obligations for the operating entity, lawful basis for roster supply, hosting location and cross-border transfer safeguards, breach notification obligations, and the minors question are all legal-review blockers (§31). The product requirements above — consent records, transparency page, retention framework, export and deletion paths, suppression floors, disclosure of processing location — are designed to make compliance achievable. They are not a legal opinion.

### 27.10 Sponsorship Integrity

**Threats:** Betting and predatory-lending advertisers (non-removable platform list, TI-7); scam opportunities (CH-OPP-002 vetting with hard blocks, not warnings); native-style advertising mimicking Guild notices (labelling requirements, CH-SPN-004); re-identification through narrow targeting (broad audiences only plus size floors, CH-SPN-003); a sponsor demanding student data (contractually prohibited and structurally impossible); undisclosed paid editorial (all commercial placements must be recorded as placements and labelled — an unlabelled paid announcement is a policy violation and must be an express licence term).

### 27.11 Engagement Fraud

**Threats and mitigations:** Multi-accounting (one roster record claimable by one Membership); scripted quiz completion (server-authoritative attempts, timing floors, flag-for-review rather than auto-punish); answer sharing (accepted residual — stakes are deliberately low and there are no prizes); XP farming via toggles (no XP for saves, follows, supports or reads); profile-field farming (once per field, low value, capped); attribute switching for eligibility (correction requests with cooldowns plus the attribution freeze rule); administrator favouritism via manual XP (capped, re-authenticated, audited).

### 27.12 File and Input Handling

Untrusted CSV content is treated strictly as data and never as formula, markup or command, on import or export. File type validated by content inspection; malware scanning; image re-encoding with EXIF/GPS stripped; original filenames discarded; isolated media origin with correct content types and no inline execution; authorisation on non-public attachments matching the parent item's audience; immediate invalidation on redaction including cached copies (CH-CNT-002); per-tenant storage quotas; upload rate limits.

### 27.13 Operational Security

Least privilege for platform staff; MFA everywhere privileged; no standing production data access; tiered support with elevated access requiring explicit tenant context and justification (CH-PLT-002); break-glass time-boxed, two-person-approved for writes, and tenant-disclosed (CH-PLT-004); no impersonation capability implemented at all (CH-PLT-003); dependency scanning; secrets management; independent penetration test before paid launch; documented incident response including breach notification.

---

## 28. Commercial & Operational Risks

| ID | Risk | Likelihood | Impact | Mitigation |
|----|------|------------|--------|------------|
| R1 | Content supply collapses — the Guild stops publishing and the app goes silent | High | Critical | Launch readiness gate (CH-TEN-005); publishing-cadence metric as a first-class Pilot measure (§19.2); content calendar templates and starter quiz bank (CH-QIZ-003); contractual minimum publishing commitment; evergreen content (fixtures, opportunities) that keeps value flowing without weekly Guild effort |
| R2 | Students treat it as "another university website" and never return | High | Critical | Opportunities and sports as the acquisition hook, not gamification; ruthless page-weight budget; poll turnout as visible proof students are heard; Voice status updates as the credibility engine; measure returning users weekly from day one and be willing to change Home |
| R3 | Guild cannot approve the annual fee | High | High | Low-cost single-semester pilots; build toward the institution-funded path at renewal; the exported report as the renewal artefact; time the sales cycle to the Guild budget calendar |
| R4 | Guild administration changes and the new team disengages | High | High | Term-bound auto-expiring authority (CH-GOV-002); Custodian role; handover workflow in Commercial V1; cultivate a Student Affairs relationship in every tenant from month one |
| R5 | Poor roster quality, or the university will not supply one | High | High | Multiple verification methods with honest assurance levels; validation, preview and quarantine on import; invite-code fallback at L1; manual review with volume alerting; be prepared to operate a tenant at L2 as its participation threshold and label analytics accordingly |
| R6 | Sponsorship demand is weaker than assumed | Medium | High | Do not build the year-one business case on sponsorship; keep it manual and cheap; prove reach with real numbers before selling it |
| R7 | An inappropriate advertiser slips through | Medium | High | Non-removable platform prohibited list; creation/approval separation; Platform cross-tenant suspension; express licence terms; periodic placement review |
| R8 | A moderation failure causes real harm | Medium | Critical | Voice disabled by default; readiness gate with named accountable party (CH-VOX-001); prohibited sensitive categories with signposting; auto-suspension on lapsed staffing; SLA alerting; the honest position that CampusHub is not an emergency service |
| R9 | Tenant data leakage between universities | Low | Existential | NFR-1; negative tests as a build gate; isolation in penetration-test scope; the multi-membership journey as a dedicated test target |
| R10 | Gamification reads as childish and undermines credibility | Medium | Medium | Restrained visual treatment; PLAY below campus information on Home; adult level naming validated by research (§30-U2); measure whether senior cohorts disengage |
| R11 | Streak proves to be a dark pattern or an irritant | Medium | Medium | Reminders off by default; neutral reset language; recess pause; an explicit kill criterion in §19.6 rather than reflexive elaboration |
| R12 | Quiz content goes stale and participation collapses | High | Medium | Starter bank; exhaustion warnings with projected dates; bulk-add path; retirement of leaked questions |
| R13 | Inaccurate sports results cause public disputes | Medium | Medium | Draft-then-publish; mandatory correction reasons; visible correction history; notification on correction; alerting on repeat corrections |
| R14 | University procurement delays push a deal past a semester | High | Medium | Pilot pricing below procurement thresholds; a prepared documentation pack (isolation, privacy, retention, export, security); the transparency page as a procurement asset |
| R15 | Priority Notices are abused and the trust channel dies | Medium | High | Separate capability; confirmation with recipient count; hard rate limit; audit and Platform visibility; retraction path (CH-PUB-006) |
| R16 | Scope sprawl — the roadmap grows and nothing is excellent | High | High | Three-stage release strategy; every Phase 2 item carries a trigger; the out-of-scope register is a standing refusal, not a wish list |
| R17 | University pressures the Guild for surveillance access | Medium | High | Constrained official view by default; expansions audited and disclosed to students; the boundary written into the licence so it is not renegotiable per deal (GOV-5) |
| R18 | Data protection non-compliance | Medium | High | §31 legal review completed before paid launch; controller/processor position documented; hosting and transfer position disclosed |
| R19 | Operating cost exceeds licence revenue | Medium | Medium | No SMS at scale; in-app first; no web push in Pilot; image optimisation and storage quotas; self-service admin; support burden reduced by the readiness gate and clear error states |
| R20 | Poll privacy design proves unachievable within budget | Medium | High | §29-A1 is a hard blocker with a defined decision point: deliver unlinkability, adopt an honestly described weaker model, or do not ship polls. The transparency page copy is written after that decision, never before |

---

## 29. Architecture Blockers

These must be resolved and reviewed before the relevant code is written.

| ID | Blocker | Details |
|----|---------|---------|
| **A1** | Poll vote mechanism | **BLOCKER BEFORE POLL IMPLEMENTATION.** Produce and review a design covering: eligibility verification at vote time; one-vote enforcement under concurrency; ballot submission and storage; what identifiers exist anywhere in the request path, application logs, infrastructure logs and error reports; timestamp granularity and ballot ordering; backup and restore implications; demographic snapshot minimisation; poll voiding and re-run; deletion-request interaction; and the accepted fraud-handling posture. The review must conclude explicitly whether the design achieves unlinkability or a weaker pseudonymous model, and the transparency page copy (CH-PRV-001) must be written to match. No poll code before this review. |
| **A2** | Tenant isolation enforcement | How isolation is enforced across the database, the API authorisation boundary, background jobs, scheduled tasks, exports, search, caching, media URLs, notifications, analytics and backups. Must include the mandatory negative-test approach and how it fails the build. |
| **A3** | Session, authorisation and immediate revocation | The central authorisation decision point; session and token model; how privileged revocation removes authority immediately including any permission cache (revocation epoch or equivalent); re-authorisation of queued background jobs at execution time. |
| **A4** | Global User boundary enforcement | How the schema and the code prevent behavioural data from reaching the global User, how active tenant context is carried on every request, and how the multi-membership case is tested for leakage. |
| **A5** | Verification evidence model | How channel provenance is stored and enforced so that a self-supplied channel can never produce an assurance uplift; how roster claims, disputes and freezes are handled transactionally. |
| **A6** | Audit log design | Append-only storage, tamper-evidence, what personal data an entry may contain, and how audit survives content redaction without re-exposing redacted material. |
| **A7** | Data lifecycle, redaction and backups | How deletion, anonymisation and CH-CNT-001 redaction propagate to caches, media storage, search indexes, exports and backups — and what the honest limits are. |
| **A8** | Media pipeline | Upload validation by content inspection, scanning, re-encoding and EXIF stripping, isolated origin, authorisation on non-public files, and immediate invalidation on redaction. |
| **A9** | Background job tenant context | How every job, scheduled task and notification dispatch carries explicit tenant context and fails closed without it. |
| **A10** | XP ledger and idempotency | Idempotency key design, reconciliation job, and how poll-participation awards are structurally prevented from referencing ballots. |
| **A11** | Analytics event schema | Tenant-local pseudonymous identifiers, exclusion rules for staff/preview/automation, and how suppression is applied consistently at query time. |

**Technical direction already selected:**

- **Frontend:** Next.js with the App Router, TypeScript, mobile-first responsive student experience, PWA-oriented web delivery.
- **Backend:** Django, Django REST Framework, PostgreSQL.
- **Architectural principle:** Django/DRF is authoritative for tenant isolation, permissions, membership, verification, poll eligibility, voting integrity, XP awards, privileged authority and all persistent domain rules. Sensitive rules are never implemented solely in the browser. The client may improve the experience; it may never be the enforcement point.

**Deliberately not decided yet (architecture phase):** Hosting and cloud provider; monorepo versus separate repositories; the authentication package; whether Redis is used; whether Celery or another task runner is used; any websocket solution; object-storage provider; deployment platform.

---

## 30. UX Design Blockers

| ID | Blocker | Details |
|----|---------|---------|
| **U1** | Student information architecture | The five-destination structure in §14 is a proposal. It must be validated against reference designs and student research before detailed design, with specific attention to whether Play deserves a primary destination or belongs as a Home card. |
| **U2** | Level naming and visual treatment | Determines whether the engagement layer reads as credible or juvenile to a final-year student. This is a research output, not an internal preference. Blocks CH-XP-005. |
| **U3** | Home composition and section caps | The deterministic ranking order, per-section item caps, and how a busy day is prevented from becoming a wall of cards on a small screen. Blocks CH-HOM-001. |
| **U4** | Public visitor surface and indexing | How much is visible without an account, and whether it is indexable. Both an acquisition lever and a scraping exposure. Blocks CH-HOM-003. |
| **U5** | Verification flow | The single largest drop-off risk in the product. The L0 → L2 → L3 journey, its error states, and how honestly-labelled partial assurance is communicated without discouraging students. |
| **U6** | Contextual gating interaction | The interruption-and-return pattern (CH-PRO-003) must feel helpful rather than obstructive. Needs prototyping and testing. |
| **U7** | Sponsored content treatment | Labelling that is unmistakable, accessible, and does not degrade the reading experience — while remaining acceptable to sponsors. |
| **U8** | Admin workspace density | Whether the eight-group structure in §15 is navigable by a student officer with no training. |

---

## 31. Human Review Required

### Legal

- Controller/processor determination for roster versus behavioural data
- Data-protection registration obligations for the operating entity
- Lawful basis for roster supply and processing
- Hosting region and cross-border transfer safeguards
- Minors policy and whether any DOB collection is required (§27.6)
- Retention periods left open in §27.7
- The lawfulness of retaining anonymised Voice records against a deletion request
- Defamation, copyright and takedown process
- Student Voice prohibited categories and the signposting obligations
- Promotional-competition licensing exposure for any Phase 2 prize mechanic
- Sponsor prohibited-category terms as express licence conditions
- Breach notification obligations and timelines

### Security

- Poll mechanism design review (§29-A1) — the single highest-priority security review in this document
- Tenant isolation architecture
- Session and immediate-revocation model
- File upload pipeline
- Audit tamper-evidence
- Break-glass controls
- Independent penetration test before paid launch
- Backup/restore and its interaction with deletion and redaction

### Student Research

- Why students would return, in their own words
- Home composition on a real device
- Verification friction and where students abandon
- Whether final-year students find PLAY credible or childish
- Level naming
- Trust in poll privacy and whether the transparency page actually reassures
- Notification tolerance
- Whether Streak is motivating or irritating

### University Stakeholder

- Who holds the Tenant Custodian role and who appoints them
- The exact boundaries of the University Official view
- Whether Student Voice can be staffed and by whom
- Takedown authority and its limits
- Roster availability, fields and refresh cadence
- Who supplies content and at what cadence
- Procurement and security requirements
- Hosting location expectations

### Commercial

- Pilot and annual pricing
- Who pays versus who champions
- Sponsorship demand validation with real local sponsors
- Operational support cost per tenant
- Whether to offer a content-seeding service to satisfy the launch gate
- Renewal artefact expectations
- Contract templates encoding the governance matrix (§8.5)

---

## 32. Assumptions

Each of these is an assumption, not a fact. Several would change the design if false.

1. Target universities can produce a student roster in some delimited format, even if messy. If false, verification degrades to invite codes and manual review, and the value proposition weakens materially.
2. Most target students have a smartphone with intermittent, metered data; data cost is a real constraint on usage.
3. Institutional student email exists at some but not all target universities and is unreliable at several.
4. English is sufficient for Pilot, with tenant-overridable terminology labels.
5. Each tenant operates in a single timezone.
6. A Guild has at least one person able to publish content several times a week during term. This is the assumption most likely to fail and most damaging if it does (R1).
7. A Guild that enables Student Voice can staff moderation to the committed SLA during term. If false, the module stays disabled — this is a hard product requirement, not a preference.
8. Guild terms are approximately annual on a predictable cycle.
9. Local sponsors exist and will pay modest amounts for verified campus reach.
10. Payments are made offline and reconciled manually; CampusHub records but never processes them.
11. PWA-style web delivery is acceptable; a native app is not a precondition for adoption.
12. Universities will accept cloud hosting subject to disclosure and contractual safeguards. If in-country hosting is demanded, it becomes an architecture item.
13. A small number of students are minors; the product's universal student-safe posture protects them without identifying them (§27.6).
14. Peak concurrency is driven by Priority Notices and results, not by steady traffic.
15. CampusHub is controller for behavioural data and processor for roster data. Pending legal confirmation (§31).

---

## 33. Open Decisions

### Blocker Before UX Design

| ID | Decision | Note |
|----|----------|------|
| D1 | Student information architecture and whether Play is a primary destination | §30-U1 |
| D2 | Level naming and visual treatment | §30-U2 |
| D3 | Home composition, ordering and section caps | §30-U3 |
| D4 | Public visitor surface and search indexing | §30-U4 |
| D5 | OTP channel strategy and cost ceiling — email-first, SMS fallback, or tenant-configurable | Recommendation: email preferred in the UI, SMS permitted with a per-tenant budget cap and graceful degradation to manual review |
| D6 | Admin workspace grouping validation | §30-U8 |

### Blocker Before Architecture

| ID | Decision | Note |
|----|----------|------|
| D7 | Tenant isolation enforcement strategy | §29-A2 |
| D8 | Global User boundary enforcement | §29-A4 |
| D9 | Session model and immediate privileged revocation | §29-A3 |
| D10 | Central authorisation decision point design | §29-A3 |
| D11 | Verification evidence and channel-provenance model | §29-A5 |
| D12 | Audit log design and tamper-evidence | §29-A6 |
| D13 | Data lifecycle, redaction and backup propagation | §29-A7 |
| D14 | Media pipeline | §29-A8 |

### Blocker Before Implementation

| ID | Decision | Note |
|----|----------|------|
| D15 | Poll vote mechanism design review | §29-A1. No poll code before this |
| D16 | Whether Pilot polls publish any demographic breakdown or top-line only | Recommendation: top-line only for the first tenants |
| D17 | Roster matching rules and the exact required field set | Affects CH-VER-001 |
| D18 | Whether L2 or L3 is the default poll participation threshold per tenant | Recommendation: L2 default, L3 available; warn explicitly on L1 |
| D19 | Streak recess handling — pause versus grace | Recommendation: pause; simpler to explain |
| D20 | Priority Notice numeric rate limit | Recommendation: 2 per rolling 7 days, tenant-adjustable within a platform maximum |
| D21 | Suppression floor values against real cohort sizes | §27.4 |
| D22 | Role bundle composition and who holds Custodian per tenant | GOV-2 |

### Blocker Before Pilot Launch

| ID | Decision |
|----|----------|
| D23 | Student Voice readiness criteria signed off with the first tenant, or the module stays disabled |
| D24 | Governance matrix items GOV-1, GOV-2, GOV-3, GOV-4, GOV-6, GOV-7, GOV-10 settled in the pilot agreement |
| D25 | Minors policy legal position (§27.6) |
| D26 | Transparency page copy written to match the reviewed poll design |
| D27 | Retention product defaults confirmed and legal-review items scheduled |
| D28 | Starter quiz bank produced, if the quiz module is enabled |

### Blocker Before Paid Launch

| ID | Decision |
|----|----------|
| D29 | Penetration test completed and findings remediated |
| D30 | Backup and restore validated with a recorded result |
| D31 | Data-protection registration and controller/processor position settled |
| D32 | Licence templates encode the full governance matrix, including sponsor prohibited categories and the University Official boundary |
| D33 | Incident response and moderation runbooks agreed and staffed |
| D34 | Pricing validated against measured operational cost per tenant |

### Can Defer

XP amounts and level thresholds (forward-only changes make later calibration safe); the exact daily XP cap; whether the quiz is tenant-wide or campus-scoped; whether news categories are platform-supplied or tenant-defined; whether faculty is displayed on pseudonymous Voice issues (recommendation: no); whether alumni retain read access by default; notification digest timing; web push inclusion in Commercial V1; whether Platform sells a content-seeding service; automatic sports standings formats.

---

## 34. Pre-Implementation Readiness Assessment

### 34.1 Ready

Sufficiently defined to begin design and engineering once the blockers above are cleared.

- The tenant model with campus dimension, configurable hierarchy and academic calendar
- The tenant lifecycle with a fully defined five-state behaviour matrix
- The capability-based permission model with an explicit role table
- Registration, login, contact-channel verification with provenance, session and shared-device safety, and the privileged MFA recovery path
- Roster import with validation, preview, quarantine, modes, history and refresh semantics
- The evidence-based assurance model L0–L3 with a separate privileged identity track
- The membership state machine including transfer, alumni and dual role
- Progressive profiling with field classification and the contextual gating flow with return-to-action
- Deterministic Home ranking
- Publications as a single merged system with targeting, correction and Priority Notice abuse controls
- Events with RSVP and cancellation
- Opportunities with hard-blocking scam vetting
- Simplified sports with fixtures, results, correction history and manual tables
- Poll product behaviour and the trust invariant (implementation gated on A1)
- Tenant-conditional Student Voice with the readiness gate, restricted categories, identity model and public status history
- The XP ledger with idempotency, the closed rule list and correction semantics
- Levels as recognition only
- Simple Streak with recess pause and opt-in reminders
- The Daily Quiz with server-authoritative attempts and starter content
- Simple labelled sponsorship with broad-audience-only targeting
- Notifications with a complete category matrix and fatigue control
- Reduced analytics with published definitions and suppression
- Guild Terms with automatic expiry, immediate privileged revocation, compromised-admin response and the audit log
- Audit immutability separated from content takedown, with redaction
- The transparency page and data rights
- Platform support tiers with no impersonation and time-boxed break-glass
- Accessibility, performance philosophy and resilience requirements

### 34.2 Needs Decision

Everything in §33 under the four blocker categories. In particular: the poll mechanism (D15) gates an entire epic; the student IA and level treatment (D1, D2) gate design; the governance items (D24) gate the pilot agreement; and the minors legal position (D25) must be resolved even though the current answer is "collect nothing."

### 34.3 Missing

Requirements this document has introduced that had no equivalent in Draft 0.1, and which reviewers should verify are adequate:

- The three-stage release strategy replacing a single oversized MVP
- The explicit governance authority matrix with contractual questions listed rather than falsely resolved (§8)
- Channel provenance as a stored, enforced field — the mechanism that makes the OTP principle real
- Student Voice as a tenant-conditional module with an auto-suspending readiness gate
- Immediate privileged revocation replacing a fifteen-minute window
- The separation of audit immutability from public content availability, with redaction, restriction and removal outcomes
- The attribution freeze rule for hierarchy change
- Priority Notice abuse controls including a separate capability, hard rate limit and retraction
- Removal of assurance-level and all behavioural sponsor targeting
- Reframing of aggregation thresholds as policy defaults rather than guarantees
- The subscription state behaviour matrix protecting students during a commercial dispute
- Platform support tiering with an explicit prohibition on impersonation
- The rejection of DOB collection as an advertising solution
- Explicit kill criteria for Streak

### 34.4 Dangerous Assumptions

Things that will cause expensive redesign if implementation starts without resolving them:

1. **That tenancy can be enforced by developer discipline.** If tenant scoping is applied per-query by convention, a leak is a matter of time and the remedy is a rewrite.
2. **That vote privacy is a UI promise.** If a member identifier is stored alongside a ballot "just for now," the invariant is gone — including in logs and backups — and no later refactor restores it.
3. **That the campus dimension can be added later.** It threads through targeting, fixtures, events, notifications and analytics.
4. **That a global user identity can be retrofitted.** Building User as tenant-scoped is simpler on day one and catastrophic at the first transfer or dual affiliation.
5. **That behavioural data can be moved off the global User later.** Once a global identifier appears in an analytics store or an export, cross-tenant linkage exists historically and cannot be unwound.
6. **That XP can be a mutable integer.** Without an append-only ledger with idempotency keys, duplicate awards and drift are permanent and disputes are unresolvable.
7. **That verification is a boolean.** Features gated on `is_verified` will have to be re-gated on assurance, and invite-code members will have silently contaminated poll results in the meantime.
8. **That roles need not expire.** Without term binding from the start, every tenant accumulates former officials with live access.
9. **That a fifteen-minute revocation window is acceptable.** It is enough time to broadcast to the entire university.
10. **That gamification drives adoption.** If the engagement layer is built before the content layer, the product launches into empty tenants with a quiz.
11. **That Student Voice can launch without staffed moderation.** An unmoderated complaints channel on a university campus is a safety and legal incident waiting to happen, attributed simultaneously to the Guild, the university and CampusHub.
12. **That the university's oversight scope can be negotiated per deal.** One contract promising expanded access kills the constrained-by-default model across the whole product.

---

## 35. Draft 0.1 → v1.0 Cross-Reference Appendix

> For historical traceability only. This appendix has no bearing on the v1.0 backlog and must not be used as a source of requirements.

### 35.1 Retained Substantially Intact

| Draft 0.1 | v1.0 | Note |
|------------|------|------|
| CH-PLAT-001/002/003 tenancy and isolation | CH-TEN-001/002, NFR-1, TI-1 | Strengthened with explicit surfaces (jobs, exports, cache, media, backups) |
| CH-PLAT-004 launch readiness gate | CH-TEN-005 | Retained; identified as the highest-ROI operational control |
| CH-PLAT-008 academic calendar | CH-TEN-004 | Retained, scope reduced to recess pause |
| CH-AUTH-001..007 | CH-AUT-001..007 | Renumbered; recovery and channel-change hardened |
| CH-VER-001/002/003 roster import safeguards | CH-VER-001/002/003 | Retained in full — validation, preview, duplicates, history, quarantine, refresh |
| CH-VER-006 claim disputes | CH-VER-006 | Retained with both-account freeze |
| CH-PROF-001..004 progressive profiling and gating | CH-PRO-001..003 | Retained; classification made mandatory |
| CH-OPP-002 scam vetting | CH-OPP-002 | Retained and hardened — payment-required now blocks rather than warns |
| CH-TSF-005 upload safety | CH-CNT-002 | Retained in full, plus redaction |
| CH-PRV-001 transparency page | CH-PRV-001 | Retained; must now match the reviewed poll design |
| CH-SPN-003 prohibited categories | CH-SPN-002 | Retained; non-removability reinforced as TI-7 |
| CH-HND-002 term-bound auto-expiring grants | CH-GOV-002 | Retained; rationale preserved |
| CH-UXQ-001..004 accessibility and resilience | CH-QUA-001..004 | Retained; numeric budgets reclassified as targets to validate |
| §12.2 Campus Energy deferral | §25 item 7 | Retained and reinforced with a trigger |

### 35.2 Merged

| Draft 0.1 | Merged into |
|------------|-------------|
| Announcements module + News module | CH-PUB-001 — a single Publication entity with a type |
| CH-FEED-001..008 | CH-HOM-001..003 — one deterministic Home, zone model simplified |
| CH-ADM-001..005 + CH-HND-001..006 + audit | CH-GOV-001..006 — governance grouped by job |
| CH-ANL-001..007 | CH-ANL-001..004 — definitions, dashboard, export, suppression |
| CH-SPN-001..010 | CH-SPN-001..005 — sponsor, approval, audience, serving, metrics |
| CH-VOX (11 stories) + CH-TSF-001/007 | CH-VOX-001..007 — readiness gate absorbed the safety tooling |
| CH-XP-001..010 + CH-STK-001..006 | CH-XP-001..005 + CH-STK-001..003 |
| CH-PRV-002..007 | CH-PRV-002..005 |
| CH-SUB-001..007 | CH-SUB-001..003 with a state behaviour matrix |

### 35.3 Modified Materially

| Draft 0.1 | Change |
|------------|--------|
| Four-level verification with L4 as "highest student tier" | Rebuilt as evidence-based L0–L3 with privileged identity as a separate track; OTP principle added (§11.4) |
| "Revocation takes effect within 15 minutes" | Corrected to immediate (CH-GOV-004); 15 minutes may apply only to cosmetic cache propagation |
| CH-HND-006 closed-term content immutable | Replaced by CH-CNT-001 — audit is immutable, public availability is not |
| CH-SPN-006 targeting including assurance level | Assurance-level and all behavioural targeting removed (CH-SPN-003, TI-4) |
| CH-ANL-006 k=10/20/200 as guarantees | Reframed as policy defaults subject to review (§27.4) |
| CH-POLL-005 asserting unlinkability as an acceptance criterion | Reframed as a trust invariant plus a mandatory architecture review (CH-POL-001, §29-A1) |
| Global User + Membership boundary | Hardened into a hard invariant with explicit prohibitions (§10, TI-12) |
| §20.10 minors — collect DOB from roster | Rejected; universal student-safe restrictions instead (§27.6) |
| CH-PRV-005 precise retention table | Split into product defaults, legal-review items and tenant-configurable (§27.7) |
| CH-SPT sports with formats, walkovers, automatic standings | Simplified to sport/competition/team/fixture/result plus manual tables |
| CH-NTF-002 large category matrix with web push | Reduced; web push removed from Pilot |
| CH-ADM-005 member lookup | Retained but tightened into CH-PRV-005 with contact details excluded |
| CH-EVT organiser | Explicitly attribution-only; clubs deferred with a trigger |

### 35.4 Deferred

| Draft 0.1 | New home |
|------------|----------|
| CH-LDR-001..009 leaderboards | Commercial V1 (CV-LDR-001/002), evidence-gated |
| Web push (CH-NTF-005) | Commercial V1 (CV-NTF-001) |
| University Official expanded view (CH-ANL-005) | Commercial V1 (CV-GOV-001), contingent on GOV-5 |
| Handover checklist and continuity pack (CH-HND-003) | Commercial V1 (CV-HND-001/002) |
| Sponsor payment recording (CH-SPN-005) | Commercial V1 (CV-SPN-002) |
| Sponsor conflict guard (CH-SPN-010) | Dropped as an engine; a calendar view is CV-SPN-004 |
| Editorial approval workflow (CH-ADM-004) | Commercial V1 (CV-PUB-001) |
| Automatic sports standings | Commercial V1 (CV-SPT-001) |
| Campus Energy | Phase 2, trigger-gated |
| Rewards, sponsored challenges, sports predictor, additional games, badges, seasons, group competitions, clubs, sponsor portal, event check-in, brackets and rosters, SMS | Phase 2, each with a trigger |

### 35.5 Removed

| Draft 0.1 | Reason |
|------------|--------|
| Sponsor targeting by assurance level | Creates a quality score on students with no advertising purpose (TI-4) |
| Delivery pacing / even-share rotation (CH-SPN-006) | Ad-tech complexity before demand exists |
| Payment-before-serving gate | Implies financial intermediation; contract handles it |
| DOB collection for minor protection | Data expansion with no protective benefit under a universal-restriction posture |
| "Viewport ≥1s" reach definition | Ad-grade instrumentation Pilot does not need |
| Retention cohort dashboards, module performance dashboards, cross-tabs | Analytics product before metric use is known |
| Streak freeze tokens, purchasable restoration | Dark-pattern adjacent; not needed to test the mechanic |
| Poll answer changing | Requires member-to-ballot linkage |
| Voice comment threads, student directory, custom display handles | Rejected outright (§26.3) |
| Silent impersonation for support | No legitimate need (CH-PLT-003) |
| Phase 3 cross-university features | Breaks the isolation invariant; removed from the roadmap pending a separate charter |

---

## 36. Consistency Statement

A full consistency pass was performed against §61 of the product brief. Confirmed:

- No Pilot story depends on a Commercial V1 or Phase 2 feature
- No assurance-level or behavioural sponsor targeting remains anywhere (CH-SPN-003, TI-4)
- The fifteen-minute privileged-authority window is gone and replaced by immediate revocation (CH-GOV-004, §35.3)
- Student Voice is disabled by default and tenant-conditional with an auto-suspending readiness gate (CH-VOX-001)
- Sensitive Voice categories are prohibited platform-wide in Pilot, not merely optional (CH-VOX-002)
- Campus Energy appears only in Phase 2 with a trigger
- Leaderboards appear only in Commercial V1
- Streak is in Pilot and deliberately minimal with an explicit kill criterion (CH-STK-001..003, §19.6)
- Polls are in Pilot but marked architecture-blocked until the privacy mechanism review (CH-POL-001, §29-A1) and no claim of achieved unlinkability is made in student-facing copy
- Sponsorship, sports and analytics are all reduced (CH-SPN, CH-SPT, CH-ANL)
- The global User carries authentication and security state only, with all behavioural data tenant-local (§10, TI-12)
- Audit immutability is separated from public content availability (CH-CNT-001, TI-11)
- DOB is not introduced for advertising (§27.6)
- Priority Notices carry a separate capability, hard rate limit, audit and retraction (CH-PUB-006)
- Active tenant context is explicit for multi-membership users (CH-MEM-003)
- University/Guild authority questions are listed for the licence agreement rather than falsely resolved by software roles (§8.5)

---

*End of CampusHub Product Specification v1.0.*