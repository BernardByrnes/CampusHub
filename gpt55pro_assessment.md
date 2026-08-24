# CampusHub Product Specification v1.0 — Audit Report

| Field | Value |
|-------|-------|
| **Document type** | Independent audit of CampusHub Product Specification v1.0 |
| **Audience** | Principal Product Manager, engineering lead, architecture team |
| **Purpose** | Gate decision, backlog normalisation guidance, revision scope |
| **Supersedes** | All prior audit passes |

---

## Table of Contents

1. [Final Executive Verdict](#1-final-executive-verdict)
2. [Top 10 Remaining Findings](#2-top-10-remaining-findings)
3. [Earlier Audit Resolution Check](#3-earlier-audit-resolution-check)
4. [Pilot Scope Verdict](#4-pilot-scope-verdict)
5. [House Standard Compliance Score](#5-house-standard-compliance-score)
6. [Story-Quality Findings](#6-story-quality-findings)
7. [Concurrency & Idempotency Audit](#7-concurrency--idempotency-audit)
8. [State-Machine Consistency](#8-state-machine-consistency)
9. [Permission & Tenancy Audit](#9-permission--tenancy-audit)
10. [Global Story Contract Recommendation](#10-global-story-contract-recommendation)
11. [Canonical Vocabulary / ID / Dependency Audit](#11-canonical-vocabulary--id--dependency-audit)
12. [Open Decision Integrity](#12-open-decision-integrity)
13. [AI Coding-Agent Safety Assessment](#13-ai-coding-agent-safety-assessment)
14. [Minimum Required Revision](#14-minimum-required-revision)
15. [What Must Not Be Changed](#15-what-must-not-be-changed)
16. [Final Gate Decision](#16-final-gate-decision)

---

## 1. Final Executive Verdict

### 1.1 Product Specification Verdict

> **READY AFTER MINOR REVISION**

CampusHub is now a coherent product. The concept, release strategy, trust model, Pilot / Commercial V1 / Phase 2 separation, governance posture, verification model, Student Voice constraints, sponsorship restraint, analytics restraint and gamification scope are substantially settled.

The remaining product-level defects are small but should be corrected before declaring the document frozen:

- Open-decision contradictions
- Poll-privacy wording that slightly overpromises before the architecture review
- State/vocabulary inconsistencies that could become product ambiguity

### 1.2 Canonical Engineering Backlog Verdict

> **READY AFTER BACKLOG NORMALISATION**

The Pilot backlog is strong as a product backlog, but not yet fully canonical under the House Standard. Engineers could understand the intended product, but AI coding agents would still be forced to invent material details around concurrency, idempotency, named errors, exact permissions, state transitions, and cross-cutting tenant/default behaviour.

**The correct next step is not another redesign. It is a bounded normalisation pass.**

---

## 2. Top 10 Remaining Findings

| Rank | Severity | Classification | Finding | Affected Stories/Sections | Smallest Safe Fix |
|------|----------|----------------|---------|---------------------------|-------------------|
| 1 | **HIGH** | Backlog defect | Pilot story inventory is internally inconsistent: §17 says 117 stories, but the story headings sum to 122. There is also a dangling reference to CH-PLT-006 / "§47 model". | §17, §8.4, §18 | Recount Pilot stories, update totals, correct CH-PLT-006 to the real break-glass story CH-PLT-004, remove/replace "§47 model". |
| 2 | **HIGH** | Backlog defect | No Global Story Contract exists, despite many recurring requirements: tenant context, fail-closed access, audit defaults, idempotency, concurrency, logging/privacy, UI states and standard tests. | Whole §18; §16; §20; §29 | Add a concise Global Story Contract and make it part of every Pilot story's AC by default. |
| 3 | **HIGH** | Backlog defect | Concurrency and idempotency outcomes are under-specified for several high-risk workflows. | CH-VER-004/006, CH-POL-003/004/007, CH-PUB-002/004/006, CH-SPT-003, CH-XP-001/004, CH-QIZ-001, CH-SPN-002, CH-GOV-002/004 | Add exact "one wins / loser receives X / no partial write" outcomes to the relevant stories, with global defaults where possible. |
| 4 | **HIGH** | Backlog defect | State models and stories are not fully aligned. Several stateful domains are missing from §22 or use inconsistent state names. | §22; CH-PUB-002/004; CH-CNT-001; CH-VOX-003/005/006; CH-SPT-002/003; CH-QIZ-001; CH-SPN-001/002; CH-VER-001/002/003 | Align §22 with story text. Add lightweight state models for missing stateful records such as Event, Opportunity, RosterImportBatch and VerificationCase. |
| 5 | **HIGH** | Backlog defect | Permission model is conceptually strong but not yet implementation-canonical. Stories mix prose permissions, roles and partial capability names. | §9; CH-GOV-001; CH-PUB-006; CH-SPN-001/002; CH-VOX-004; CH-PRV-005; CH-PLT-002 | Compile a Role × Capability Matrix and normalise story Perm fields to named capabilities. |
| 6 | **HIGH** | Backlog defect | Poll privacy is correctly architecture-blocked, but a few sections accidentally assert stronger unlinkability before §29-A1 is resolved. | CH-POL-001; CH-SUB-003; §21.2; §21.4; §27.3; §29-A1 | Change overstrong wording to "subject to the reviewed poll design"; preserve the product invariant that no product surface exposes individual answers. |
| 7 | **MEDIUM** | Product defect | Some open decisions are already assumed by stories. Most notable: Streak recess handling is marked open but CH-STK-002 implements pause; CH-STK-001 says "Streak freezes" are not in Pilot; CH-POL-002 assumes L2 default while D18 says L2/L3 default is open. | CH-TEN-004; CH-STK-001/002; CH-POL-002; §33 D18/D19 | Either close the decision explicitly or label the story behaviour as the safe temporary assumption. Adjust CH-STK-001 OOS to "no freezes beyond academic-calendar pause". |
| 8 | **MEDIUM** | Backlog defect | Important failure behaviour lacks named product error codes. Many criteria say "rejected", "blocked", "rate-limited" or "refused" without defining response/state/user next step. | CH-AUT, CH-VER, CH-POL, CH-PUB, CH-SPN, CH-GOV, CH-PRV, CH-PLT | Define error-code families globally and add named codes to high-risk stories only. |
| 9 | **MEDIUM** | Backlog defect | External side effects are directionally specified but not consistently clear on failure, retry, duplicate prevention and whether failure blocks the main action. | CH-AUT-001/002; CH-NTF-004; CH-PUB-004/006; CH-EVT-004; CH-PRV-002/005; CH-ANL-003; CH-CNT-002 | Add global outbox/side-effect rules plus story-specific exceptions for OTP, exports and redaction. |
| 10 | **MEDIUM** | Backlog defect | Mandatory regression tests are implied by trust invariants but not compiled into a release regression suite. | §16; §20; CH-MEM-003; CH-VER-004/006; CH-GOV-004; CH-POL; CH-VOX-004; CH-XP-001; CH-CNT-001/002 | Add a short mandatory regression catalogue covering tenant leakage, revocation, poll privacy, double vote, roster double claim, XP duplicate, Voice identity access, redaction and Guild Term expiry. |

---

## 3. Earlier Audit Resolution Check

| Earlier Finding | Resolved? | Evidence / Remaining Problem |
|-----------------|-----------|------------------------------|
| Scope split between Pilot, Commercial V1 and Phase 2 | Mostly resolved | §6, §24, §25 and §26 clearly separate stages. Remaining issue is backlog-count inconsistency and CH-QIZ-005's "Challenge" abstraction wording, which should be tightened to avoid speculative Phase 2 architecture. |
| Global User boundary | Resolved, with backlog-normalisation caveat | §10, TI-12, §21.1 and NFR-4 correctly keep behaviour tenant-local. Need Global Story Contract to enforce no global IDs in analytics/logs/audit payloads. |
| Governance authority | Resolved | §8 separates product-enforced boundaries from licence-agreement questions. Guild Term, Custodian, immediate revocation and Platform break-glass are present. Dangling CH-PLT-006 reference must be corrected. |
| Poll privacy | Mostly resolved | CH-POL-001 and §29-A1 correctly block implementation pending architecture review. Remaining issue: §21.2/§21.4/CH-SUB-003 overstate unlinkability before A1 is resolved. |
| Student Voice | Resolved | CH-VOX-001 disables by default, readiness-gates activation, requires staffing, auto-suspends, and CH-VOX-002 limits Pilot categories to low-risk issues. |
| Verification | Resolved | §11 defines evidence-based L0–L3, OTP provenance, and a separate privileged identity track. CH-VER-004/005/006 support roster claim, L3 and manual review. D17 roster matching remains a legitimate implementation blocker. |
| Immediate privileged revocation | Resolved | CH-GOV-004 explicitly removes the old 15-minute authority window and requires server-side revocation on the next authorised request. In-flight action race should still be specified. |
| Historical content takedown | Resolved | P9, TI-11, CH-CNT-001 and CH-CNT-002 correctly separate immutable audit from public availability/redaction. |
| Sponsorship simplification | Resolved | CH-SPN is simple: no sponsor portal, no behavioural targeting, no assurance targeting, no ad engine, no rewards/prizes, no payment processing. |
| Analytics simplification | Resolved | CH-ANL limits Pilot analytics to defined metrics, dashboard, one-page export and suppression. No BI platform, arbitrary cross-tabs or retention cohort dashboards in Pilot. |
| Gamification scope | Resolved | XP, Levels, simple Streak and one Daily Quiz are in Pilot. Leaderboards are Commercial V1; Campus Energy, rewards and multiple games are Phase 2. |
| Sports simplification | Resolved | CH-SPT is fixture/result/team/manual-table only. No brackets, rosters, automatic standings or predictor in Pilot. |
| DOB/minors | Resolved | §27.6 rejects DOB collection for advertising and relies on universal student-safe sponsorship unless legal review changes the position. |

---

## 4. Pilot Scope Verdict

### 4.1 Is 117 stories evidence of over-scope?

**No — but the document does not actually contain 117 Pilot stories.** By heading count, it contains 122.

That is a backlog-inventory defect, not evidence of hidden product sprawl. The high story count mostly reflects decomposition of foundational capability: tenant isolation, verification, governance, privacy, support access, audit and data rights.

### 4.2 How many actual capability groups exist?

Roughly **15 real capability groups**, despite 25 epics:

1. Tenant/configuration/lifecycle
2. Authentication/session/security
3. Membership/affiliation
4. Organisational hierarchy
5. Verification/profile/progressive gating
6. Home/discovery
7. Publications/priority notices/content correction
8. Events/opportunities/sports
9. Polls
10. Student Voice
11. XP/Levels/Streak/Quiz
12. Sponsorship
13. Notifications
14. Analytics/reporting
15. Governance/audit/privacy/platform support/quality

**This is a large but coherent Pilot, not a randomly inflated one.**

### 4.3 What, if anything, should leave Pilot?

No major capability needs to leave Pilot for product reasons.

However:

- Student Voice should remain tenant-conditional and may launch disabled.
- Sponsorship should remain optional and simple.
- Daily Quiz should remain one direct game, not a generic challenge platform.
- Manual standings and similar "Should" items can be deferred by tenant if operational capacity is tight.

### 4.4 What must NOT be cut because it is foundational?

Do **not** cut:

- Tenant isolation
- Campus dimension
- Global User / tenant Membership separation
- Active tenant context
- Roster import preview and claim-dispute handling
- Channel provenance
- L0–L3 assurance
- Immediate privileged revocation
- Guild Term expiry
- Tenant Custodian
- Audit log
- Transparency page
- Content redaction/takedown
- Media pipeline safety
- XP ledger (if XP ships)
- Notification idempotency
- Data-rights/export controls
- Platform support access model

> Those are not "scope"; they are structural controls.

---

## 5. House Standard Compliance Score

| Category | Score |
|----------|-------|
| Story identification & stability | 3.5 / 5 |
| Actor clarity | 3.5 / 5 |
| Acceptance-criteria quality | 3.5 / 5 |
| Canonical vocabulary | 3.5 / 5 |
| Permission clarity | 3.5 / 5 |
| Tenant/scope clarity | 4.5 / 5 |
| State-machine discipline | 3.0 / 5 |
| Failure/error specification | 2.5 / 5 |
| Concurrency coverage | 2.5 / 5 |
| Idempotency coverage | 3.0 / 5 |
| Audit/history | 4.5 / 5 |
| Finalisation/correction | 4.0 / 5 |
| External side effects | 3.0 / 5 |
| Explicit non-goals | 4.5 / 5 |
| Dependency integrity | 3.0 / 5 |
| Testability | 3.5 / 5 |
| Open-decision discipline | 3.5 / 5 |
| AI-agent implementation safety | 3.0 / 5 |

> **Overall House Standard Readiness: 62 / 90**

This score should not be read mechanically. The product is much stronger than the score suggests; the lost points are concentrated in backlog-canonical machinery: Global Story Contract, state alignment, named errors, concurrency, capability matrix and dependency hygiene.

---

## 6. Story-Quality Findings

### 6.1 Missing behaviour

- Exact wrong-tenant response is globally stated in NFR-1 but not consistently attached to stories.
- Roster import overlap and stale staged-import commit behaviour are missing.
- Manual verification double-decision behaviour is missing.
- Sponsorship placement lifecycle is not fully story-supported despite §22 defining states.
- Event and Opportunity state machines are implicit but not authoritative.
- Poll close/void/vote race outcomes are incomplete.
- Role revocation during an in-flight privileged action is not fully specified.
- Export generation failure and duplicate export request behaviour are incomplete.

### 6.2 Vague acceptance criteria

Examples needing bounded values or named policies before implementation:

- "short defined window"
- "small floor"
- "strict rate limiting"
- "configured number"
- "short grace window"
- "minimum plausible completion time"
- "suspiciously fast"
- "defined SLA"
- "safe default"
- "platform-bounded range"

> These are acceptable as product placeholders, but not as coding-agent inputs.

### 6.3 Missing errors

High-value missing or undernamed error cases include:

- Duplicate registration / duplicate membership create
- Wrong tenant / hidden existence
- Stale edit
- Already-finalised record
- Already-voted / already-attempted / already-supported
- Poll closed during submit
- Role expired or revoked
- Tenant suspended
- Import already in progress
- Verification claim frozen
- OTP rate-limited
- Export awaiting approval
- Media redaction failure

**Candidate global error families:**

| Family | Purpose |
|--------|---------|
| `NOT_FOUND` | Resource does not exist |
| `PERMISSION_DENIED` | Capability or role missing |
| `TENANT_SCOPE_NOT_FOUND` | Wrong tenant — returns as not-found |
| `VERSION_CONFLICT` | Stale write attempt |
| `INVALID_STATE` | Transition not permitted in current state |
| `ALREADY_EXISTS` | Duplicate creation attempt |
| `ALREADY_COMPLETED` | Duplicate finalisation/participation attempt |
| `RATE_LIMITED` | Velocity cap exceeded |
| `ASSURANCE_REQUIRED` | Assurance level below gate threshold |
| `TENANT_SUSPENDED` | Tenant subscription state blocks action |
| `PREREQUISITE_MISSING` | Dependent condition not met |
| `IDEMPOTENCY_CONFLICT` | Idempotency key mismatch |

### 6.4 Permission ambiguity

- Story actors sometimes use "Student", "System / Student", "All users", "tenant administrator" or persona names instead of canonical roles.
- §9.3 refers to "Campaign creation/approval", while Pilot sponsorship uses Sponsor Placement, not Campaign.
- Sponsor create vs approve, Priority Notice, Voice identity, audit view, bulk export and Platform break-glass need exact capability names.
- University Official official-notice publishing is described conceptually but not fully capability-mapped.

### 6.5 Dependency problems

- §8.4 references CH-PLT-006, which does not exist.
- §8.4 references "§47 model", which does not exist.
- CH-HOM-001 depends on epic names (CH-PUB, CH-EVT, etc.) rather than concrete story IDs.
- §17 total story count is wrong.
- Some ranges such as CH-TEN-001..004 are understandable but should be normalised if the backlog is being made canonical.

### 6.6 Scope/OOS gaps

Product-level OOS is strong. Story-level OOS is still needed or referenced explicitly where AI agents may overbuild:

| Epic | Explicit OOS needed |
|------|---------------------|
| CH-PUB | No editorial approval workflow in Pilot |
| CH-EVT | No ticketing, check-in or attendee lists |
| CH-QIZ | No generic game engine |
| CH-SPN | No ad-tech, no pacing, no sponsor portal |
| CH-POL | No elections or answer changing |
| CH-VOX | No comments, confessions or sensitive grievance workflow |
| CH-SPT | No brackets, stats, rosters or automatic standings |

---

## 7. Concurrency & Idempotency Audit

| Scenario | Covered? | Story | Missing Outcome |
|----------|----------|-------|-----------------|
| Duplicate registration / same contact submitted twice | Partial | CH-AUT-001 | Exact idempotent result and duplicate-send behaviour for OTP/link. |
| OTP resend / verify simultaneously | Partial | CH-AUT-002 | Single-use token race: which verify succeeds, what replay receives. |
| Same user joins same tenant twice concurrently | Partial | CH-MEM-001 | "Exactly one Membership exists; replay returns existing Membership." |
| Two students claim same roster record simultaneously | Partial | CH-VER-004/006 | Exactly one claim commits or both enter dispute; loser response/state not defined. |
| Two roster imports or full-replace refreshes overlap | No | CH-VER-001/002/003 | Import lock/queue/cancel rule; stale staged import commit rule. |
| Two reviewers decide same verification case | No | CH-VER-006 | First decision wins; second receives invalid-state/current-decision result. |
| Same student votes from two devices | Partial | CH-POL-004 | Says safe under concurrent requests but not exact loser response/result. |
| Poll closes while vote is submitted | Partial | CH-POL-003/004 | Commit ordering: accepted if before close transaction, otherwise POLL_CLOSED; no ambiguity. |
| Poll void/early close while vote is submitted | No | CH-POL-007 | Whether vote can commit; XP/notification consequences. |
| Two Publishers edit/publish same Publication | No | CH-PUB-002/004 | Version conflict / no silent overwrite. |
| Scheduled publication fires while Publisher edits/holds it | Partial | CH-PUB-002 | Job re-authorisation and stale schedule handling. |
| Priority Notice cap race | Partial | CH-PUB-006 | Two admins publish near cap simultaneously; exactly one may consume final slot. |
| Priority Notice retraction/publish race | No | CH-PUB-006 | Which state wins; notification consequences. |
| RSVP double-submit or change while event starts/cancels | Partial | CH-EVT-003/004 | Idempotent RSVP and event-state conflict result. |
| Sports result published/corrected by two coordinators | No | CH-SPT-003 | Version conflict and correction-history ordering. |
| XP award event delivered twice | Yes/Partial | CH-XP-001 | Same idempotency key covered; different keys for same source action need uniqueness rule. |
| XP reversal races with automatic award | No | CH-XP-004 | Ordering and total calculation rule. |
| Quiz attempt submitted from two devices | Partial | CH-QIZ-001 | Exactly one finalisation; replay/current-result behaviour. |
| Day boundary during quiz attempt | Partial | CH-QIZ-001 | Boundary and grace-window exactness need values. |
| Sponsor placement approved and suspended simultaneously | No | CH-SPN-002/004 | State-transition winner and live-serving consequence. |
| Voice issue supported twice / from two devices | No | CH-VOX-005 | One support per member; duplicate response. |
| Voice moderation decisions by two moderators | No | CH-VOX-005/006 | First decision wins; second receives current state. |
| Role revoked while privileged action is in flight | Partial | CH-GOV-004 | Queued jobs covered; in-flight commit rule missing. |
| Guild Term closes while scheduled job/action is queued | Partial | CH-GOV-002; CH-PUB-002 | Some cases covered; global job re-authorisation rule needed. |
| Notification generation retry | Yes | CH-NTF-004 | Idempotent per membership/source/type is good. |
| Bulk export requested twice | Partial | CH-PRV-005; CH-SUB-003 | Duplicate request/replay/approval race not defined. |

---

## 8. State-Machine Consistency

| Domain | Stories Match Appendix? | Contradictions / Missing Transitions |
|--------|------------------------|--------------------------------------|
| Membership | Partial | Story uses L0/Registered language alongside Membership state `unverified`; closure/deletion and restoration paths need clearer mapping. |
| Assurance level | Mostly | L0–L3 model is strong. Administrative reduction is allowed in §22 but not supported by a clear story. |
| RosterImportBatch | No authoritative machine | Stories imply `staged`, `validated`, `quarantined`, `committed`, `expired`. §22 lacks this machine. |
| VerificationCase / claim dispute | No authoritative machine | `pending_review`, frozen claims, appeal, approved/rejected need explicit lifecycle. |
| Publication | Partial | CH-PUB-002 uses `unpublished`; §22 uses `unpublished_with_reason`, `redacted`, `removed`. Correction is a version/history event but not modelled cleanly. |
| Content visibility / takedown | Mostly | CH-CNT-001 is strong, but should align exactly with Publication state names. |
| Event | No authoritative machine | Stories imply `published`, `passed`/`archive`, `postponed`, `cancelled`. §22 lacks Event state model. |
| RSVP | No authoritative machine | Simple enum likely enough, but `going`/`interested`/`withdrawn` and event-start terminal behaviour should be explicit. |
| Opportunity | Partial/No | Stories imply `active`, `expired`, `under_review`, `suspended`. §22 lacks Opportunity state model. |
| Fixture / Result | Partial | Fixture states exist, but result draft/publish/correction history are not fully represented. `corrected` should probably be a history marker, not a terminal fixture state. |
| Poll | Mostly | Main lifecycle good. Missing explicit state for opened-with-no-participation withdrawal/delete. A1 still blocks storage/privacy implementation. |
| Voice Issue | Partial | CH-VOX-003 says submission enters `in_moderation`; §22 includes `submitted` → `in_moderation`. Appeal and terminal behaviour need clearer treatment. |
| XPEvent | Yes | Append-only ledger model is consistent. Need source uniqueness beyond idempotency key. |
| StreakState | Partial | Behaviour is simple, but recess pause contradicts D19/CH-STK-001 wording. |
| ChallengeAttempt | Partial | CH-QIZ-001 and §22 differ around expired/abandoned/scored behaviour at day boundary. |
| Question | Partial | Question states exist in CH-QIZ-002 but are absent from §22. Could stay story-local if kept simple. |
| Sponsor Placement | Partial | §22 has a good machine; stories do not fully define submission to approval, live activation, completion or cancellation. |
| Guild Term | Yes | `upcoming` → `active` → `closed` and administrative gap are coherent. |
| Subscription | Yes | §22.2 matrix is strong and implementation-useful. |

---

## 9. Permission & Tenancy Audit

### 9.1 Central capability model

Strong at product level. §9 correctly requires:

- Central authorisation
- Default deny
- Identity + active tenant + capability + resource scope
- Immediate effect of privilege changes

However, the backlog still needs a formal **Role × Capability Matrix** before implementation.

### 9.2 Role naming

Canonical roles exist, but stories do not consistently use them. Normalise:

| Current usage | Canonical role |
|---------------|----------------|
| Student | Student Member |
| tenant administrator | Guild Administrator or Tenant Custodian (depending on authority) |
| System | SYSTEM |
| Custodian | Tenant Custodian |
| University Official | University Official (only where that exact role is intended) |
| Platform Operator | Platform Operator (consistently) |

### 9.3 Resource scope

The active tenant model is strong. §10.4, TI-1, TI-12 and NFR-1 establish the right invariant.

Story-level tenant/scope failures should be handled by the **Global Story Contract** rather than repeated 122 times.

### 9.4 Cross-tenant not-found behaviour

Product-level rule is correct:

> Unauthorised cross-tenant access fails closed as not-found and raises a security event.

But many stories omit it. **Hoist it globally.**

### 9.5 Sensitive reads

Good coverage exists for:

- Voice identity access
- Elevated Platform support
- Audit log viewing
- Bulk exports
- Break-glass

Add a **sensitive-read catalogue** in the Global Story Contract or audit catalogue so coding agents know which reads are audited and which ordinary student reads are not.

### 9.6 Privilege expiry

Strong. Guild Term expiry and immediate revocation are product-ready. Only remaining gap: define the exact outcome for privileged actions already in flight at the instant revocation/expiry commits.

---

## 10. Global Story Contract Recommendation

> **YES — CampusHub should add a Global Story Contract before engineering begins.**

### 10.1 Smallest useful set of global rules

| # | Rule | Description |
|---|------|-------------|
| 1 | **Tenant context** | Every tenant-scoped request, job, export, media URL, notification and analytics query carries explicit tenant context. |
| 2 | **Cross-tenant failure** | Wrong-tenant access returns not-found-equivalent, leaks no existence/data, and raises a security event. |
| 3 | **Server authority** | UI hiding is never authorisation. Server-side capability, assurance and resource-scope checks are authoritative. |
| 4 | **Default-deny permissions** | No capability means no action. Privileged role changes take effect immediately. |
| 5 | **Optimistic concurrency default** | Mutable stateful records carry a version. Stale writes fail with `VERSION_CONFLICT`; newer state is preserved. |
| 6 | **Single-winner transitions** | Publish, approve, close, void, revoke, submit, score and finalise transitions commit once. Losers receive current state. |
| 7 | **Idempotency default** | Creation/finalisation/participation/notification/XP/export actions use idempotency keys or source uniqueness. Replays return original result. |
| 8 | **Audit default** | All mutations, privileged actions and defined sensitive reads write append-only audit events. |
| 9 | **No sensitive payload leakage** | Audit/log/error/analytics payloads contain references, field names, hashes and categories — not raw sensitive content. |
| 10 | **External side effects** | Notifications/emails/exports are triggered after durable commit through an idempotent outbox unless a story explicitly says the side effect blocks the action. |
| 11 | **Tenant timezone** | Tenant timezone controls day boundaries, scheduled jobs, poll close/open, streaks and quiz instances. |
| 12 | **UI baseline** | Loading, empty, error and offline states exist for every screen; accessibility baseline applies to all stories. |
| 13 | **Standard test obligation** | Every story gets service/API, permission, tenant-isolation, state-legality and audit tests as applicable. |

### 10.2 Rules that must remain story-specific

- Poll vote-storage/privacy mechanism
- Voice identity access reasons and disclosure
- Sponsor prohibited categories
- XP rule list and amounts
- Poll assurance threshold and result visibility
- Priority Notice cap
- Suppression floor values
- Roster matching rules
- Verification checklist content
- Student Voice readiness conditions
- Finalisation/correction path for each domain

---

## 11. Canonical Vocabulary / ID / Dependency Audit

### 11.1 Duplicate IDs

**None found.**

### 11.2 Missing / dangling IDs

| Issue | Location | Fix |
|-------|----------|-----|
| CH-PLT-006 is referenced but no such story exists | §8.4 | Correct to CH-PLT-004 |
| "§47 model" is referenced but there is no §47 | §8.4 | Remove or replace with correct reference |
| Pilot total says 117 but actual story headings sum to 122 | §17 | Recount and update |

### 11.3 Ambiguous / non-canonical dependencies

- CH-HOM-001 depends on epic names (CH-PUB, CH-EVT, etc.) rather than story IDs.
- Some range references are understandable but should be normalised for canonical backlog use.

### 11.4 Terminology conflicts

| Conflict | Resolution |
|----------|------------|
| "Student", "Student Member", "prospective student user" are mixed | Normalise to canonical role names |
| "Custodian" and "Tenant Custodian" | Use "Tenant Custodian" consistently |
| "tenant administrator" | Replace with Guild Administrator, Tenant Custodian or Platform Operator |
| "Campaign" appears in §9.3 | Pilot sponsorship uses Sponsor Placement, not Campaign |
| Membership state `verified` and assurance level L2/L3 both use "verified" language | Keep the distinction explicit |
| Publication states: `unpublished`, `unpublished_with_reason`, `redacted`, `removed` | Align to §22 names |
| Voice states: `submitted` vs `in_moderation` | Align to §22 |
| Fixture/result states: `completed`, `result_published`, `corrected`, result draft | Align to §22 |
| Quiz attempt states: `expired`, `abandoned`, `scored` | Align to §22 |

### 11.5 Commercial V1 / Phase 2 ID confusion

Commercial V1 uses `CV-*` IDs and Phase 2 uses roadmap numbering/domain labels. They are distinguishable from Pilot `CH-*` story IDs.

---

## 12. Open Decision Integrity

Stories that prematurely assume, or partially assume, open decisions:

| Open Decision | Affected Story/Section | Integrity Finding |
|---------------|------------------------|-------------------|
| D15 poll mechanism | §21.2, §21.4, CH-SUB-003 | Some wording assumes non-linkable ballots before A1 review. Soften. |
| D18 L2 vs L3 default poll threshold | CH-POL-002 | Story sets default L2 while D18 says the default is open. Resolve or mark L2 as safe temporary assumption. |
| D19 Streak pause vs grace | CH-TEN-004, CH-STK-001/002 | Story implements pause; open decision still says unresolved; CH-STK-001 OOS says no Streak freezes. Align. |
| D17 roster matching rules | CH-VER-001/004 | Stories assume student number + surname exact match. Fine as temporary assumption, but should be labelled until D17 closes. |
| D20 Priority Notice cap | CH-PUB-006 | Story gives recommendation but no final number. Do not let coding agent choose. |
| D21 suppression floors | CH-POL-006, CH-ANL-004 | Correctly open, but implementation must not invent thresholds. |
| D22 Custodian holder | CH-GOV-003 | Product supports role; pilot agreement must name who holds it. |
| D25 minors | §27.6, CH-SPN | Current no-DOB position is coherent; legal review may override. |
| D27 retention | CH-PRV-003/005; CH-SUB-003; CH-GOV-006 | Legal-review periods must not be guessed by implementers. |
| U1/U3 Home IA | CH-HOM-001 | Correctly UX-blocked; story does not over-fix exact caps. |
| U2 Level naming | CH-XP-005 | Correctly UX-blocked. |
| U4 public visitor surface | CH-HOM-003 | Correctly UX-blocked. |

---

## 13. AI Coding-Agent Safety Assessment

> If handed to a capable coding agent today, the agent would still be forced to invent material behaviour in the areas listed below.

### 13.1 Agent would invent behaviour here

- **Concurrency and idempotency outcomes** — especially roster claims, poll votes, quiz attempts, role revocation, publication edits, sponsor approval and XP corrections.
- **Named errors and API-visible failure behaviour** — many stories say "blocked" or "rejected" without defining product error codes and state result.
- **Exact role/capability mapping** — the product model is clear, but the implementation matrix is missing.
- **State-machine gaps** — Event, Opportunity, RosterImportBatch, VerificationCase, Sponsor Placement transitions and several correction paths.
- **Poll mechanism** — correctly blocked by architecture. No coding agent should implement it yet.
- **External side-effect behaviour** — OTP, email, notification outbox, export generation and media invalidation need retry/blocking semantics.
- **Suppression, retention and legal defaults** — some values are intentionally unresolved and must not be guessed.
- **Quiz/challenge abstraction boundary** — CH-QIZ-005 could cause overengineering unless tightened.

### 13.2 Can be solved with a Global Story Contract

- Tenant context
- Cross-tenant not-found
- Default-deny authorisation
- Standard concurrency
- Idempotency defaults
- Audit defaults
- Error-code families
- No sensitive logs/audit
- External side-effect outbox
- UI/loading/error/accessibility baseline
- Standard testing obligations

### 13.3 Requires story edits

| Stories | Issue |
|---------|-------|
| CH-VER-004/006 | Roster claim/dispute races |
| CH-POL-003/004/007 | Vote/close/void races |
| CH-PUB-002/004/006 | Publication and Priority Notice races |
| CH-SPT-003 | Result correction |
| CH-QIZ-001 | Attempt finalisation |
| CH-SPN-001/002/004 | Placement lifecycle |
| CH-GOV-004 | In-flight revocation |
| CH-STK-001/002 | Recess wording |
| CH-SUB-003 | Poll-export wording |

### 13.4 Requires architecture first

- Poll mechanism
- Tenant isolation implementation
- Global User boundary enforcement
- Session/revocation model
- Audit tamper-evidence
- Data lifecycle/redaction/backups
- Media pipeline
- XP ledger/idempotency design
- Analytics event schema

### 13.5 Requires human decision

- Governance agreement and Custodian appointment
- Controller/processor position
- Minors/DOB legal position
- Retention periods
- Suppression floors
- Priority notice cap
- Roster field/matching requirements
- Student Voice staffing/readiness
- Pricing/commercial terms

---

## 14. Minimum Required Revision

> **Smallest safe revision package:**

### 14.1 Correct story inventory and references

Recount Pilot stories, update §17 total, fix CH-PLT-006 / "§47 model", normalise dependency references.

### 14.2 Add a concise Global Story Contract

Cover tenancy, authorisation, concurrency, idempotency, audit, errors, external effects, privacy/logging, UI states and standard tests.

### 14.3 Compile a Role × Capability Matrix

Do not redesign roles; map existing roles to named capabilities.

### 14.4 Normalise story actors and capability names

Replace vague actors and prose permissions in high-risk stories.

### 14.5 Align §22 state machines with stories

Add missing lightweight machines for Event, Opportunity, RosterImportBatch and VerificationCase; align Publication, Voice, Fixture/Result, Placement and ChallengeAttempt names.

### 14.6 Add concurrency/idempotency outcomes to high-risk stories

Target roughly 15–20 stories, not all 122.

### 14.7 Add named error-code families

Use global defaults; add story-specific codes only where product behaviour differs.

### 14.8 Soften poll unlinkability claims pending A1

Keep the trust invariant, but do not assert architecture outcomes before review.

### 14.9 Close or mark safe assumptions for D18 and D19

Poll threshold default and Streak recess behaviour must not remain contradictory.

### 14.10 Add mandatory release regression suite

Tie it to Trust Invariants and high-risk workflows.

> **Leave product scope unchanged.**

---

## 15. What Must Not Be Changed

> Do **not** casually reopen these decisions:

- KNOW / PARTICIPATE / PLAY hierarchy
- Pilot / Commercial V1 / Phase 2 split
- Global User contains only identity/security data
- Tenant Membership owns all university-specific behaviour
- L0–L3 evidence-based assurance
- OTP to self-supplied contact does not increase assurance
- Privileged identity is a separate track
- Immediate privileged revocation
- Guild Term auto-expiry
- Tenant Custodian emergency authority
- Polls are non-binding and privacy-protected
- Poll implementation remains blocked by A1
- Student Voice is disabled by default, readiness-gated and low-risk only
- No crisis, counselling, criminal allegation or confession workflow in Pilot
- Sponsorship is simple, labelled and non-targeted beyond broad safe audiences
- No assurance-level or behavioural sponsor targeting
- Sports remains fixtures/results/manual tables only
- Analytics remains renewal/value evidence, not BI
- XP is ledger-derived
- Levels are recognition only
- Streak remains in Pilot but simple, neutral and kill-criterioned
- One Daily Campus Quiz only
- Leaderboards stay Commercial V1
- Campus Energy, rewards, multiple games and sponsored challenges stay Phase 2
- Audit is immutable; public availability of harmful content is not
- No DOB collection merely for advertising
- No support impersonation
- No payments through CampusHub
- No student directory, chat, marketplace, election platform or unrestricted social feed

---

## 16. Final Gate Decision

> ### GATE 3 — LIMITED PRODUCT REVISION
>
> A small bounded revision is required before formal freeze.

This is **not** a redesign and **not** a scope cut. The product is substantially ready. The revision should correct:

1. Story count/reference defects
2. Open-decision contradictions
3. Poll-privacy overclaim wording
4. State/vocabulary mismatches that affect product truth

After that, CampusHub should move immediately into:

- **UX design**
- **Architecture** for the listed blockers
- **Backlog normalisation** via Global Story Contract, Role × Capability Matrix, state alignment, concurrency/idempotency pass and mandatory regression suite

> **The product should not enter another broad review loop.**

---

*End of Audit Report.*