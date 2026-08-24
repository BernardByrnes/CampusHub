Below is the complete frozen document with only the three surgical corrections applied in place. Everything accepted through v1.2 is preserved exactly; the changelog and self-review are updated; A1 remains the sole explicit blocker, scoped to the production poll storage/linkability architecture.

---

````markdown
# CampusHub — Canonical Prototype Blueprint

**File:** `CampusHub_Canonical_Prototype_Blueprint_v1.2_FROZEN.md`
**Version:** 1.2-FROZEN (final freeze patch applied in place to v1.2; see §31 Changelog)
**Status:** **Frozen for static-prototype implementation.** A1 remains an explicit blocker **only** for the unresolved production poll storage/linkability architecture described in §9.1 and §30.
**Positioning:** _CampusHub — The digital home of student life._

This is the single canonical design + interaction + static-prototype + production-translation blueprint for the CampusHub student experience. A coding agent receiving only this document must be able to build the product without consulting any other source except the frozen product specification named below.

---

## 1. Authority Hierarchy (v1.1)

When any two sources disagree, resolve in this order:

| Rank | Document                                                                 | Authority over                                                                                                                                           |
| ---- | ------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1    | `CampusHub_Product_Specification_v1.2_FROZEN.md`                         | Product scope, release scope, trust invariants, policy, privacy, governance, state requirements, blockers, and product behaviour. **Highest authority.** |
| 2    | `CampusHub_Canonical_Prototype_Blueprint_v1.2_FROZEN.md` (this document) | Visual design, screen composition, interaction patterns, and prototype→frontend translation — **only where it does not conflict with rank 1.**           |
| 3    | `CH-Grok.md`, `CH-kimi.md`, `CH-Qwen.md`, `CH-Opus.md`                   | **Historical inputs only.** Used solely to inform this synthesis; they carry no standing of their own.                                                   |

Rules:

- This blueprint **supersedes all four candidate documents** in their entirety.
- This blueprint **MUST NOT supersede the frozen product specification.** If a future edit to this document conflicts with the frozen specification, the frozen specification wins and this document is defective.
- Where this document states a product rule (poll language, assurance model, Voice identity, XP policy, sponsorship limits), it is restating frozen behaviour, not inventing it.

---

## 2. Product Identity & Scope

Hierarchy, in priority order:

```text
KNOW
↓
PARTICIPATE
↓
PLAY
```
````

> **KNOW is the product. PARTICIPATE creates value. PLAY amplifies engagement.**
> PLAY must never visually or behaviourally dominate KNOW.

CampusHub is **not**: an LMS, SIS, payment platform, election platform, social network, chat app, confession app, marketplace, or club-management product. Do not add features because they would make a university app feel more complete.

Student product character: mobile-first, premium, warm, editorial, trustworthy, restrained, modern, content-led. The real product is responsive web/PWA — never fake native chrome, never a permanent iPhone frame, no Dynamic Island, no status-bar replicas.

---

## 3. Canonical Visual System

Visual ambition:

> **African university editorial energy + premium consumer mobile app + subtle habit psychology + serious sports UI + restrained SaaS discipline.**

Avoid: generic purple SaaS, giant gradients, glassmorphism, decorative blobs, oversized pills everywhere, card soup, dashboard aesthetics, enterprise admin density on student screens.

Replicate reference-screenshot **appearance** (geometry, spacing, density, typography, hierarchy, icon/media proportions, card anatomy, nav and search treatment) but never resurrect **obsolete product mistakes** (old copy, old dates, wrong poll/voice/assurance behaviour). Current CampusHub rules are authoritative for wording, dates, privacy, assurance, poll behaviour, Voice behaviour, sports state, navigation semantics, gamification, and scope.

### 3.1 Resolved colour tokens

| Token                                | Value                             | Use                               |
| ------------------------------------ | --------------------------------- | --------------------------------- |
| `tenant`                             | `#146B3A`                         | Primary action, active nav, links |
| `tenant-strong`                      | `#0E5A2F`                         | Hover/pressed primary             |
| `tenant-soft`                        | `#EAF3ED`                         | Icon tiles, soft buttons, chips   |
| `tenant-softer`                      | `#F3F8F4`                         | Notice/poll wash surfaces         |
| `tenant-border`                      | `#CFE3D6`                         | Tinted-surface borders            |
| `ink`                                | `#101828`                         | Headings                          |
| `body`                               | `#475467`                         | Body text                         |
| `muted`                              | `#667085`                         | Metadata                          |
| `faint`                              | `#98A2B3`                         | Placeholders, passive icons       |
| `page`                               | `#F6F6F4`                         | Warm-white app background         |
| `surface`                            | `#FFFFFF`                         | Cards                             |
| `surface-muted`                      | `#F9FAFB`                         | Soft panels                       |
| `surface-sunken`                     | `#F2F4F7`                         | Segmented track, bars             |
| `border`                             | `#EAECF0`                         | Card borders                      |
| `border-strong`                      | `#D0D5DD`                         | Field borders, outline buttons    |
| `info` / `info-soft` / `info-border` | `#175CD3` / `#EFF4FE` / `#D5E2FA` | Events, Acknowledged              |
| `play` / `play-soft` / `play-border` | `#B54708` / `#FDF1E2` / `#F3D8B4` | Play identity                     |
| `danger` / `danger-soft`             | `#D92D20` / `#FEF3F2`             | Unread badge, destructive         |
| `success` / `success-soft`           | `#067647` / `#ECFDF3`             | Resolved                          |

The tenant colour is **semantic and tenant-swappable**. Components must never hard-code Makerere values; a different university swaps only the `tenant*` family.

### 3.2 Resolved geometry

| Token                                 | Value                                    |
| ------------------------------------- | ---------------------------------------- |
| Student shell max width               | **430px**                                |
| Mobile page gutter                    | **16px** (14px ≤ 359px)                  |
| Content stack gap                     | **12px**                                 |
| Section gap                           | **20px**                                 |
| Card padding                          | **16px**                                 |
| Card radius                           | **16px**                                 |
| Inner radius (thumbs, options, tiles) | **12px**                                 |
| Field radius                          | **12px**                                 |
| Chips / status chips                  | pill (`999px`)                           |
| Search height                         | **48px**                                 |
| Bottom-nav height                     | **64px** + `env(safe-area-inset-bottom)` |
| Icon tile                             | **40px** (radius 12px, 20px icon)        |
| Poll / quiz option height             | **52px** minimum                         |
| Default button height                 | **44px** minimum (small: 36px)           |
| Filter chip height                    | **38px**                                 |
| Touch target minimum                  | **44px** practical hit area              |

Elevation: borders do the work. Card shadow `0 1px 2px rgba(16,24,40,.04)`; dialog/sheet shadow `0 12px 32px rgba(16,24,40,.16)`. No heavier shadows.

### 3.3 Typography

Inter/system-sans for the prototype; production should self-host font assets. Premium and compact — weight hierarchy over size variation.

| Role                   | Spec                                           |
| ---------------------- | ---------------------------------------------- |
| Screen title           | 20px / 700 / −0.02em                           |
| Hero headline          | 21px / 700 / −0.015em                          |
| Featured poll question | 19px / 650 / −0.012em                          |
| Card title             | 16px / 650 / −0.008em                          |
| Small card title       | 15px / 600                                     |
| Body                   | 13.5px / 1.5                                   |
| Metadata               | 12.5px / muted                                 |
| Kicker                 | 11px / 700 / uppercase / 0.07em tracking       |
| Labels (fields, rows)  | 14px / 600                                     |
| Nav labels             | 10.5px / 600                                   |
| Chips / status labels  | 11.5–12px / 600                                |
| Level number (Play)    | 26px / 800 — visually dominant over level name |

### 3.4 Photography

> **Photography where campus identity/content benefits; clean UI where trust/forms/settings/privacy/participation need clarity.**
> **One important image is better than five decorative images.**

Photography is appropriate on: Home editorial hero, Discover event/story cards, event detail, selected campus news, selected sports editorial. Usually **no** photography on: Polls, Student Voice, Voice composer, Voice detail, Verification, Me, Privacy, Notifications, Settings, gates, Daily Quiz / most Play UI.

Assets are local; prefer WebP in production; honest alt text; never caption generic imagery as a named Makerere location; graceful fallback surface (tinted panel) when an image is missing — never a broken-image icon.

---

## 4. Information Architecture & Routing

Exactly five primary student destinations:

```text
Home · Discover · Participate · Play · Me
```

Notifications are reached only via the header bell. No additional primary tabs. Secondary screens inherit their parent's active nav state:

| Screen                              | Active tab  |
| ----------------------------------- | ----------- |
| Event / Opportunity / Sports detail | Discover    |
| Voice detail / Voice composer       | Participate |
| Verification / Privacy              | Me          |
| Notifications                       | Home        |

Every real entity routes by **entity ID**:

```text
/                          Home
/discover                  Discover
/participate?tab=polls     Polls (default)
/participate?tab=voice     Student Voice
/participate/voice/new     Voice composer
/participate/voice/[id]    Voice detail
/play                      Play
/me                        Me
/notifications             Notifications
/me/verification           Verification & Membership
/me/privacy                Privacy & Transparency
/events/[id]               Event detail
/opportunities/[id]        Opportunity detail
/sports/[id]               Sports detail
/news/[id]                 Publication/story detail
/gate?reason=…&returnTo=…  Contextual gate (modal or route)
```

The static prototype may use hash routing but must preserve IDs (`#voice-detail?id=voice-water` or `#voice-detail/voice-water`). A route that resolves every Voice card to the same issue is a defect.

---

## 5. Header / Tenant Context

Canonical single-membership header:

```text
[crest]  Makerere University Guild ✓
         Main Campus · Academic Year 2026/2027        [bell]
```

- Tenant name 16px/700 with a tenant-green verified badge (accessible name "Verified tenant").
- The campus + academic-year line is **informational metadata**. A single membership needs **no tenant switcher**; the academic year is **not a switcher**; there is **no chevron** on the year. An affordance must represent a real action.
- Bell is a real link to Notifications with an unread badge; accessible label includes the unread count.
- Multiple memberships may later justify a real tenant-switch affordance; nothing in the prototype pre-empts it.
- Detail screens use a SubHeader: back control (44px) + title; focus moves to the title on entry.

---

## 6. Content Visibility & Audience (v1.1, corrected v1.2)

Two **separate axes** govern every resource. They are evaluated independently and each governs its own concern: **visibility governs exposure; audience governs actionability.**

### 6.1 Visibility (who may see the resource)

```ts
type ContentVisibility =
  | "PUBLIC"
  | "MEMBERS"
  | "VERIFIED_MEMBERS";
```

| Value              | Meaning                                                                                            |
| ------------------ | -------------------------------------------------------------------------------------------------- |
| `PUBLIC`           | Visible without membership (e.g., public campus news where the tenant allows).                     |
| `MEMBERS`          | Visible to students with an active membership at any assurance level.                              |
| `VERIFIED_MEMBERS` | Visible only to students whose assurance satisfies the tenant's verification bar (typically ≥ L2). |

Visibility determines whether a resource may be **exposed, rendered, returned in search, delivered as a notification, or have its media served**.

### 6.2 Audience (who may act on / is targeted by the resource)

Audience is an independent restriction — e.g., a poll visible to all members but actionable only by a specific faculty cohort, or an opportunity open only to Year 2+ Geography students. Audience restriction limits **actionability and targeting**; it does **not** by itself hide a resource that is intentionally visible to a broader group.

### 6.3 Evaluation rule (v1.2)

```text
visible    = visibility axis passes for this student
actionable = audience axis passes for this student

render / search / notify / media-serve  ⇒  requires `visible`
participation action                    ⇒  requires `visible` AND `actionable`
                                           AND the §7 evaluator passes
```

Rules:

- A resource failing **visibility** is excluded from Home, Discover, search results, notifications, and direct media URLs — not merely hidden with CSS. The student client never receives `visibility` values it cannot satisfy.
- A resource may be **intentionally visible to a broader group than the cohort allowed to act** (e.g., a faculty poll visible campus-wide). In that case it renders normally for everyone who passes visibility; students outside the audience see it but cannot act on it, and the §7 evaluator returns the single `audience-ineligible` reason if they attempt the action.
- Audience restriction must never be used to hide content that visibility permits, and visibility must never be used to imply actionability.

---

## 7. GSC-14 Participation Gate Evaluator (v1.1)

All participation actions — **Poll response, Voice submission, Voice support, RSVP, Daily Quiz** — evaluate through **one shared evaluator**, in this exact order:

```text
1. Tenant lifecycle            tenant active?
2. Module enabled              module on for this tenant?
3. Resource exists/actionable  resource live and within its action window?
4. Membership state            enrolment Current and membership fresh?
5. Assurance                   student assurance ≥ required level?
6. Audience / frozen cohort    student inside resource audience?
7. Verified attributes         required verified attributes present?
8. Story-specific prerequisites any remaining product prerequisites met?
```

Rules:

- **First failing step wins.** The evaluator returns **exactly one actionable primary denial reason** — never a stack of errors, never combined reasons.
- On success the action proceeds; the evaluator's decision is revalidated server-side in production for every gated mutation.
- Poll, Voice, RSVP and Daily Quiz must **share this evaluator**; no module may implement a competing gate order.
- Denial reasons map to the contextual gate variants in §8. The gate UI is presentational; authorization lives server-side.

| Evaluator step             | Gate variant                                  | Resolvable in-flow?      |
| -------------------------- | --------------------------------------------- | ------------------------ |
| 1 Tenant lifecycle         | `tenant-inactive`                             | No                       |
| 2 Module enabled           | `module-unavailable` (e.g., `voice-disabled`) | No                       |
| 3 Resource actionable      | `poll-closed` / `resource-unavailable`        | No                       |
| 4 Membership state         | `membership-refresh`                          | Yes                      |
| 5 Assurance                | `assurance-required`                          | Yes                      |
| 6 Audience / frozen cohort | `audience-ineligible`                         | No                       |
| 7 Verified attributes      | `attributes-required`                         | Yes (when a flow exists) |
| 8 Story prerequisites      | `prerequisites-unmet`                         | Varies                   |

The five canonical demo scenarios are `assurance-required`, `membership-refresh`, `poll-closed`, `audience-ineligible`, and `voice-disabled`. Steps 1, 7, 8 are implemented in the evaluator but are rarely surfaced in the demo. Each failing step maps to exactly one variant; one variant must never represent two different causes. When step 5 fails, the caller also passes the attempted resource context so the gate can present resource-appropriate copy (§8) — the cause remains `assurance-required`.

---

## 8. Contextual Gates

The gate communicates **ONE actionable reason, calmly**. Never: `403`, `ACCESS DENIED`, `Unauthorised`, `Forbidden`.

Anatomy: shield icon tile (48px) → kicker → title → one-sentence body → (optional) Current/Required assurance comparison → primary action (if resolvable) → "Not now". Gate appears as a bottom sheet/dialog: `role="dialog"`, `aria-modal="true"`, focus moved to the title, focus trap, Escape closes, focus restored to the trigger on dismissal.

**Cause separation (v1.2).** Every failed GSC-14 step maps to **one unambiguous variant**, and a variant must never stand for two different causes:

- A **Voice submission blocked at step 5 (assurance)** uses the standard **`assurance-required`** variant — never a Voice-specific variant. Its return-to-action is the Voice composer entry point.
- **`voice-disabled`** is used **only for step 2 (module/intake configuration)** — the Voice module or intake itself is unavailable. It must not be used to represent an assurance failure.
- Resource-contextual assurance copy (below) is **presentation only**; it does not create a new cause, variant, or gate order.

**Return-to-action (canonical L1 → L2 flow):**

```text
student attempts poll → gate explains L2 requirement → student completes
simulated roster match → return to the SAME poll, focus on its first option
```

Never dump the student on Home after verification. In production the continuation must be a **signed/validated continuation token** — never an open redirect; never trust `returnTo` from the client for authorization.

Exact copy per variant (the `assurance-required` body shown is the poll context; contextual variants follow the table):

| Field                 | `assurance-required`                                                                                           | `membership-refresh`                                                       | `poll-closed`                                                                    | `audience-ineligible`                                                                               | `voice-disabled`                                                                                 |
| --------------------- | -------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- | -------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Kicker                | Verify your student status                                                                                     | Membership needs refreshing                                                | Poll has closed                                                                  | Different student group                                                                             | Student Voice unavailable                                                                        |
| Body                  | This poll is available to students whose university membership has been matched to the current student roster. | Your roster match is from a previous term. Refresh it to keep taking part. | This poll closed on 25 May 2026. Results appear once privacy thresholds are met. | This poll is open to a specific student group. Your current membership does not include that group. | New issues are paused while published issues are reviewed. You can still follow existing issues. |
| Show Current/Required | Yes (Current: L1 — Weak Affiliation / Required: L2 — Roster Match)                                             | Yes                                                                        | No                                                                               | No                                                                                                  | No                                                                                               |
| Primary action        | Verify student status                                                                                          | Refresh membership                                                         | See other polls                                                                  | See open polls                                                                                      | View issues                                                                                      |
| Post-action           | Return to same poll/action                                                                                     | Return to same action                                                      | Navigate to Polls                                                                | Navigate to Polls                                                                                   | Navigate to Voice list                                                                           |

**Resource-contextual assurance copy (v1.2-FROZEN).** There is exactly **one** `assurance-required` cause and variant. The gate receives the attempted resource context from the evaluator's caller and templates **only the presentation body** (and, where needed, a context-appropriate continuation label). The kicker (`Verify your student status`), the CTA (`Verify student status`), the Current/Required comparison, and the return-to-action behaviour are unchanged across all contexts.

| Attempted action     | Body copy                                                                                                                |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Poll response        | This poll is available to students whose university membership has been matched to the current student roster.           |
| Voice submission     | Raising an issue is available to students whose university membership has been matched to the current student roster.    |
| Voice support        | Supporting an issue is available to students whose university membership has been matched to the current student roster. |
| RSVP                 | This RSVP is available to students whose university membership has been matched to the current student roster.           |
| Daily Quiz           | The Daily Quiz is available to students whose university membership has been matched to the current student roster.      |
| No context available | This action is available to students whose university membership has been matched to the current student roster.         |

Rules:

- Never show poll-specific copy during a Voice assurance failure, Voice copy during a poll failure, or any cross-resource mismatch.
- Return-to-action always returns to the **attempted** resource: the same poll, the Voice composer entry point, the same event RSVP, or the quiz.
- The contextual body is selected by the attempted resource type; no other gate field varies.

Assurance terminology inside gates is exact: `L0 — Registered`, `L1 — Weak Affiliation`, `L2 — Roster Match`, `L3 — Strong Institutional Proof`. Never generic "Verified".

---

## 9. Polls

Student-facing polls are **non-binding student sentiment polls**.

**Language — non-negotiable.** Never: Vote, Voting, Ballot, Election, Submit Vote. Use: `Respond`, `Submit response`, `Response recorded.`, `Your individual response is private.`

**Deeper privacy wording (verbatim):**

> **CampusHub does not provide Guild or university users with a way to see how a named student responded to a poll. Results are shown only when privacy thresholds are met.**

Never claim: fully anonymous, cryptographically anonymous, untraceable, technically unlinkable. Exact unlinkability is architecture-sensitive and not asserted.

**Results.** No live/pre-close tallies. No percentage bars after one response. Results are displayed **only** when the poll lifecycle permits **and** privacy thresholds are satisfied; the results API enforces this server-side.

**Eligibility.** Poll response runs through the §7 evaluator. The demo roster-matched poll requires `L2`; an L2 student proceeds without interruption.

**Poll XP.** See §11.3 — participation awards XP once via the participation record; the blueprint does not fix a universal amount.

### 9.1 A1 — unresolved architecture blocker (v1.2)

The **production storage and linkability architecture for poll responses remains unresolved under A1**. Until A1 is resolved:

- This blueprint **freezes** the student-facing privacy wording above, the poll lifecycle and privacy-threshold behaviour, and the requirement that **participation/XP accounting is separated from the response selection** (XP is triggered from the participation record, never the ballot).
- This blueprint **MUST NOT freeze a concrete identity↔selected-option storage model**, and **MUST NOT claim technical unlinkability** (or linkability) of responses to students. The contracts in §19 are deliberately neutral on how, or whether, selections are stored beside identity.
- Any production design that stores a student's selected option beside their identity must come out of the A1 decision, not out of this blueprint or the prototype.

---

## 10. Student Voice

Student Voice is **structured campus issue reporting + public status accountability**. It is not a confession board, forum, social feed, comments system, anonymous chat, or popularity contest.

Canonical intro:

> **Raise campus issues and follow what happens next.**

Moderation line:

> **Student Voice submissions are reviewed before publication and must stay within the permitted campus issue categories.**

Exactly eight categories, no `Other`:

```text
Wi-Fi · Water & Sanitation · Facilities · Lighting
Library · Transport · Academic Facilities · Campus Services
```

### 10.1 Identity

Student Voice is **pseudonymous-to-peers**, not fully anonymous.

- Short student-facing line: > **Your identity is not shown publicly.**
- Long disclosure (shown on the Review step before final submission): other students cannot see the submitter; ordinary public issue views do not reveal submitter identity; only authorised identity handlers may access identity where required for moderation, safety or accountability; such access is recorded/auditable.
- Never use "anonymous" as a blanket promise. Never show submitter avatar/name or supporter avatars/identities.

### 10.2 Moderation lifecycle vs public status (v1.1)

These are **two separate models** and must not be conflated in data, UI, or copy.

**Internal moderation lifecycle (governance surface, never shown to students):**

```text
submitted → in_moderation → { rejected | restricted | published }
```

**Public operational progression (published issues only):**

```text
Submitted → Acknowledged → Under Review → Action Planned → Resolved
```

Rules:

- A newly submitted issue is **not public**. It does not enter the public list, has no public route, and is not linked from the confirmation screen. `Submission does not mean publication.`
- Only issues whose moderation state is `published` appear in Student Voice lists, search, notifications, or detail routes.
- Public UI shows **only approved student-facing states** and, within the status history, **only stages that have actually occurred** — no future nodes, no parcel-tracking look.
- `VoiceModerationState` and `VoicePublicStatus` are distinct types (§19). The moderation state is never serialized to the student client.

### 10.3 Support

```text
Support this issue  →  Supported ✓        Toast: Support recorded.
```

Support is idempotent (one student, one support), count-only, zero XP, no supporter identities.

### 10.4 Composer inputs — frozen scope vs prototype scope (v1.1)

The frozen product permits **optional location text** and an **optional image** on Voice submissions. The current static prototype **deliberately omits** both inputs to stay light. This omission is **prototype debt** (Appendix C), not a removal of the production requirement. Production composer must support: Category → Title → Description → optional location text → optional image → Review (with identity disclosure) → Submit.

---

## 11. Play & XP Policy

PLAY feels adult and restrained: Daily Quiz, XP, current Level, progress to next level, Streak, restrained weekly summary. **No** leaderboards, Energy, badges, prizes, rewards, loot-box mechanics, multiple games, sponsored challenges, sports predictor, or betting.

### 11.1 Daily Quiz (canonical)

```text
+5 XP for taking part
+5 XP accuracy bonus if correct
Maximum +10 XP
One attempt per Tenant day
```

- Never communicate `Correct answer = +10 XP` as the only rule; the two parts are always stated separately.
- **Tenant day** (tenant timezone), not arbitrary device midnight, is production authority.
- After completion: `Today's quiz is complete. A new quiz will be available tomorrow.`
- Production never sends the correct answer to the client before submission.

### 11.2 Streak & Level

> **Your streak pauses automatically during university recess.**

The level **number** has more visual weight than the level nickname; nicknames (e.g., "Campus Regular") are demo/research placeholders. XP shapes level only; it never affects assurance, membership, or access.

### 11.3 XP award table (v1.1)

| Action                               | XP rule                                                                                                                                                                                     | Notes                                                                                                                                                                                                                                                         |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Daily Quiz participation             | +5 XP                                                                                                                                                                                       | Canonical                                                                                                                                                                                                                                                     |
| Daily Quiz accuracy bonus            | +5 XP                                                                                                                                                                                       | Canonical; server-graded                                                                                                                                                                                                                                      |
| **Poll participation**               | **Awarded once per poll; identical regardless of selected option; triggered from the participation record, never the ballot; amount is tenant-configurable within platform-bounded ranges** | **The blueprint does not define a universal numeric amount.** The prototype's demo config may carry a placeholder value for ledger arithmetic, but no student-facing copy may assert a universal poll-XP number. Confirmation copy stays `Response recorded.` |
| Voice support / Save / RSVP / Follow | **0 XP**                                                                                                                                                                                    | No visible gamification pressure on these actions                                                                                                                                                                                                             |

The Play screen's "How XP works" copy for polls is therefore: `Respond to a poll — XP is awarded once per poll. Amounts are set for your campus.` (no number).

---

## 12. Sports

### 12.1 Canonical demo record (unchanged)

```text
MUBS 1 — 2 Makerere University
Football (Men) · University League · 17 May 2026 · Final · MUBS Arena
```

One canonical source supplies this string to Home, Discover, Sports detail, and Notifications. In the demo, fixture state is `completed` with stage label `Final`.

### 12.2 Production contract (v1.1)

"Final" is a demo stage label, **not** the production state model. Production contracts must support:

```ts
type SportsFixtureState =
  | "scheduled"
  | "postponed"
  | "cancelled"
  | "completed"
  | "abandoned";
```

and a Result that is separate from the fixture, with publication control:

```text
Result: draft → published → (correction history[])
```

Only `published` results render to students; corrections append to an auditable history rather than silently rewriting the score. The pilot remains simple: no players, player statistics, advanced analytics, lineups, fantasy, betting, or predictor. Team-follow may appear where it belongs in scope.

---

## 13. Sponsorship Pilot (v1.1)

Detailed **visual design is deferred to the upcoming sponsorship design pass**. This section preserves the frozen rules now; the prototype renders **no sponsored placements by default** and reserves a `SponsoredSlot` component that stays empty until that pass is approved (see §16.23).

Frozen rules:

1. **Pilot placement slots only:** one Discover card slot; a strip on event detail, opportunity detail, and team pages. Nowhere else.
2. **Never:** interstitials, autoplay, takeovers, or sponsored notifications.
3. **Never adjacent to Student Voice** — no placement in the Participate/Voice list, Voice detail, or Voice composer.
4. **Persistent label:** `Sponsored` + sponsor name, always visible with the placement.
5. **`Why am I seeing this?`** link on every placement, opening a plain-language explanation.
6. **Broad audiences only.** No behavioural, demographic, assurance-level, poll-response, Voice, quiz, or browsing-based targeting.
7. Sponsors receive **no named individual student information** through CampusHub (consistent with §15.3 Privacy).

---

## 14. Assurance, Verification & Membership

Exact levels (never paraphrased as generic "Verified"):

```text
L0 — Registered
L1 — Weak Affiliation
L2 — Roster Match
L3 — Strong Institutional Proof
```

- **Normal demo default: `L2 — Roster Match`.** L1 exists only as a debug/demo scenario to exercise the gate flow.
- **Enrolment and assurance are separate concepts.** Render separately, e.g. `Enrolment status: Current` and `Assurance: L2 — Roster Match`. Never `Verified • Current`.
- An institutional email alone does **not** confer L3; L3 requires sufficiently strong institutional proof under the tenant configuration.
- Natural copy: > **CampusHub verifies your membership using university-provided student records and approved institutional contact methods.**
- Do not surface unavailable architecture terminology (`SSO unavailable`, `Student Portal not available`) on student screens.
- Assurance is **server-authoritative** in production; gates are revalidated on every gated render; client state never grants access.

---

## 15. Me, Notifications, Privacy

### 15.1 Me

Intro: > **Manage your account, membership and preferences.**

Clear split between **Provided by your university** (student number, faculty/college, enrolment status — non-editable) and **Provided by you** (display name, personal email, phone, notification preferences). Plus activity/account rows: Saves, RSVPs, Play, Privacy, Verification & Membership. Me is not a social profile: no followers, following, social bio metrics, or feed.

### 15.2 Notifications

Calm operational grouping: `Today / Yesterday / This Week / Earlier`. Quiet, useful rows (icon tile, title, body, time, unread dot). Mark-all-read. Notifications filtered by §6 visibility before delivery. Never an engagement-feed product.

### 15.3 Privacy & Transparency — canonical distinctions

- **Poll privacy:** > CampusHub does not provide Guild or university users with a way to see how a named student responded to a poll. Results are shown only when privacy thresholds are met. (No unlinkability overclaim; storage architecture is A1-dependent per §9.1.)
- **Student Voice:** > Your identity is not shown publicly. (Not fully anonymous; authorised-handler disclosure as in §10.1.)
- **Sponsors:** Sponsors do not receive named individual student information through CampusHub.
- **Honest limit:** Do not promise remote deletion of files already downloaded to unmanaged devices.

---

## 16. Screen-by-Screen Specification

Every screen below states: **Purpose, Hierarchy, Content, Visual composition, Interactions, States, Accessibility, Responsive, Data dependencies, Prohibited additions.** Shared shell facts (16px gutters, 12px stack gap, 16px card radius/padding, 44px targets, focus-visible rings, `prefers-reduced-motion`) apply everywhere and are not repeated per screen.

### 16.1 Home (order corrected v1.2)

- **Purpose.** The KNOW-first landing surface: what matters on campus right now.
- **Hierarchy.** The frozen mechanical order, rendered top to bottom exactly as numbered: 1 Priority Notice → 2 latest major publication/story (single editorial hero) → 3 eligible current poll → 4 upcoming event (where relevant) → 5 sports fixture/result → 6 opportunity deadline → 7 Student Voice update → 8 Daily Quiz → 9 compact XP/Level/Streak strip (where appropriate). KNOW dominates; the prototype may omit lower items if hierarchy suffers, but never reorder, and never place PLAY above KNOW. Content, composition, and data dependencies below all follow this single order.
- **Content.** Search entry (`Search news, events, opportunities...` — routes to Discover); then in order: notice _Wednesday classes rescheduled — Due to the Guild General Assembly, all teaching on Wednesday, 20 May 2026 will start at 2:00 PM. 19 May 2026 · Office of the Academic Registrar_; hero _INNOVATION WEEK — Makerere Innovation Week opens Monday — 32 student teams will showcase projects across Main Campus._; eligible poll card (Quick Poll: _What should be improved most around Main Campus?_, closes 25 May 2026); upcoming event card (_Guild Public Debate: The Future of AI in Africa — Fri, 22 May 2026, 2:00 PM — 4:30 PM, Senate Building Auditorium_); sports result card (_MUBS 1 — 2 Makerere University_); opportunity card (_Research Assistant — Climate Resilience_, apply by 30 May 2026); Student Voice update card (the configured `featuredVoiceUpdate`, canonical demo: _Irregular water supply in Halls_); Daily Quiz teaser; compact XP/Level/Streak strip linking to Play.
- **Visual composition.** Flat single column of cards in the same numbered order. One 16:10 editorial hero with bottom gradient, tenant pill, white type. Notice = tenant-softer surface + 3px tenant left bar. Poll/event/sports/opportunity/Voice/quiz items use 40px icon tiles and the standard card anatomy; the Play strip is a single compact row (level number, XP, streak) — not a full Play summary.
- **Interactions.** Search routes to Discover (single search surface). Teaser CTAs route to their module — `Respond` goes to Participate where the §7 evaluator runs. Hero links to story detail. No carousels, no dots.
- **States.** Default (L2, no responses); poll responded (teaser shows `Responded` chip); quiz complete (teaser says `Review`); notice absent → section omitted silently; images missing → fallback panels.
- **Accessibility.** One logical `h1` ("Home", may be visually hidden with focus); card titles are `h2`; hero is a single labelled link; bell announces unread count.
- **Responsive.** Primary 390×844; at 320px titles step down and thumbs shrink; no layout change.
- **Data dependencies.** In the same order: `notice`, `featuredPublication`, `eligiblePolls[0]`, `events[nextUpcoming]`, `sports[latestPublishedResult]`, `opportunities[nearestDeadline]`, `featuredVoiceUpdate`, `quiz`, `play` (compact strip), notification unread count — all from the single canonical dataset, filtered by §6 visibility. `featuredVoiceUpdate` is an **editorially configured** issue (`featured: true`) or, absent configuration, the **latest operational update by recency** (`latestOperationalUpdate`) — never a supporter-count selector.
- **Prohibited.** Marketing carousel; multiple heroes; hybrid poll/Voice card (`Take Poll` on a Voice issue); social metrics; sponsored placements (Home is not a pilot slot); admin density; supporter-count-driven selection or ranking of the Voice update.

### 16.2 Discover

- **Purpose.** Bounded campus discovery: news, events, opportunities, sports.
- **Hierarchy.** Search → intro line → filter chips → result list.
- **Content.** Intro: `News, events, opportunities and sports from across your campus.` Filters: `All / Events / Opportunities / Sports / News`. Items: event card, campus story card, opportunity card, sports result card.
- **Visual composition.** Live 48px search with filter icon button; horizontally scrolling chips (active = tenant fill); editorial **split row-cards** — content left, right-hand thumbnail (112–128px, 104px ≤ 359px) for Event and News where imagery helps. Opportunity and ordinary Sports cards carry no forced imagery (icon tile + crest pair instead).
- **Interactions.** Live client-side filtering over canonical fields; chips are toggle buttons (`aria-pressed`) or tabs with arrow-key support; empty query shows all; card taps route by entity ID.
- **States.** Default; filtered; empty: `No campus information matches that search.` + `Clear search`; offline/module-unavailable use §17 patterns.
- **Accessibility.** Search has a real label; filter group labelled; result list is an `aria-live="polite"` region so filtering is announced; chips keyboard-operable.
- **Responsive.** Chips scroll without visible scrollbar; thumbnails shrink at 320px.
- **Data dependencies.** `events[]`, `publications[discoverable]`, `opportunities[]`, `sports[publishedResults]` — visibility-filtered; search indexes title/summary/provider/venue/sport only.
- **Prohibited.** People/member/club search; behavioural or AI ranking; imagery on every card; Sponsored slot rendered before the design pass (slot reserved, empty).

### 16.3 Participate — Polls

- **Purpose.** Respond to eligible non-binding sentiment polls.
- **Hierarchy.** Segmented control (`Polls / Student Voice`) → featured poll card → additional poll cards → trust note.
- **Content.** Featured poll: _Non-binding student sentiment poll — How would you rate the cleanliness of public restrooms on campus? — Your feedback helps the Guild advocate for improvements._ Options: Very good / Good / Average / Poor / Very poor. Second poll: _What should be improved most around Main Campus?_ (closes 25 May 2026, L2). Footer: lock icon + `Your individual response is private.` + `Submit response`. Trust note: the §9 verbatim paragraph.
- **Visual composition.** Segmented control is product furniture, not a wizard: surface-sunken track, white active segment, tenant underline. Featured poll card: tenant-softer wash + 3px tenant left rule, 19px question. Options: 52px rows, real radios, checked state = tenant border + wash.
- **Interactions.** Select → `Submit response` → evaluator (§7) → success: `Response recorded.` (toast + inline state), options disable, no results. If gated: single-reason gate; after verification return to this exact poll and focus first option.
- **States.** Unanswered; selected (submit enabled); submitted (`Response recorded.` chip, privacy line retained); gated (each §8 variant); poll closed; results suppressed (default).
- **Accessibility.** `<fieldset>/<legend>` + real `type="radio"`; never div-radios; privacy line adjacent to submit; results region (when ever permitted) `aria-live="polite"`.
- **Responsive.** Options full-width at all sizes; footer wraps under 340px.
- **Data dependencies.** `polls[]` (open + visibility + audience), participation receipt (§19), evaluator decision; XP ledger updated from participation record only (§11.3).
- **Prohibited.** Vote/ballot/election language; live or immediate percentages; anonymity or unlinkability overclaims; results tied to submitting; poll XP copy with a universal number; any UI implying a frozen identity↔option storage model.

### 16.4 Participate — Student Voice (dataset corrected v1.2)

- **Purpose.** Raise campus issues and follow public accountability.
- **Hierarchy.** Segmented control → intro card (+ `Raise issue` action) → published issue list → identity note.
- **Content.** Intro lines per §10. **Normal demo list: exactly three published issues** — `Water & Sanitation — Irregular water supply in Halls — 124 supporters — Acknowledged`; `Transport — Need for more buses during evenings — 87 supporters — Under Review`; `Wi-Fi — Slow Wi-Fi at Main Library upper floor — 63 supporters — Submitted`. Issue cards: category kicker + icon tile, title, description, `N supporters`, StatusChip. Identity note: `Your identity is not shown publicly.`
- **Visual composition.** Same card system; category → icon/tone map lives in one shared module; supporters line 12.5px muted; status chip right.
- **Interactions.** `Raise issue` → composer (§7 evaluator at entry: module, membership, assurance). Card tap → `/participate/voice/[id]`.
- **States.** Default (three published demo issues); module/intake unavailable → **`voice-disabled`** gate (step 2 only); assurance failure at entry → **`assurance-required`** gate (Voice-contextual body, §8) returning to the composer entry; empty published list (calm empty state).
- **Accessibility.** List items are single labelled links; status conveyed by text, not colour alone.
- **Responsive.** Unchanged across widths.
- **Data dependencies.** `voiceIssues[]` where moderation state = `published` (three canonical issues); supporter counts (server-derived); `supportedByMe`.
- **Prohibited.** Unpublished/submitted issues in the list; comments/threads/reactions; avatars; XP; sponsored placements; an "Other" category; popularity/supporter-count ranking or sorting; using one gate variant for both assurance failure and module configuration.

### 16.5 Play

- **Purpose.** Restrained habit layer: quiz, XP, level, streak.
- **Hierarchy.** Screen title + intro (`Your Daily Quiz, XP, level and streak.`) → Level card → Streak card → Daily Quiz card → How XP works.
- **Content.** Level 4, 26px number dominant, placeholder name subordinate, XP progress bar (`340 XP · 160 XP to Level 5`); streak `3 days` + 7-day row + recess line; quiz question _Which lake is the largest in East Africa?_ with the §11.1 rule line; XP rules list including the tenant-configured poll line (§11.3) and `XP contributes to your level only.`
- **Visual composition.** Play uses amber `play` accents on tiles/kickers only; numbers big, chrome quiet. Progress bar 8px, `play-accent` fill.
- **Interactions.** Quiz select → `Submit answer` → evaluator (§7: module, membership, tenant-day attempt) → server-graded result; done state shows correct answer + earned XP + `Today's quiz is complete. A new quiz will be available tomorrow.`
- **States.** Not attempted; answered correct (+10 XP); answered incorrect (+5 XP, correct answer revealed post-attempt); attempted-today (form replaced by summary); recess (streak paused note).
- **Accessibility.** Radios in fieldset; result announced via `role="status"`; progressbar has `aria-valuenow`.
- **Responsive.** Level/streak may sit in a 2-col stat grid ≥ 360px, stacked otherwise; never a dashboard.
- **Data dependencies.** `play`, `quiz` (no correct answer pre-submission in production), `QuizParticipation`, tenant-day.
- **Prohibited.** Leaderboards, badges, Energy, prizes, multiple games, predictor/betting, attendance-gating, `+10 XP` as the only stated rule.

### 16.6 Me

- **Purpose.** Account, membership, preferences.
- **Hierarchy.** Intro → identity card (initials avatar, name, programme/year, campus/hall, assurance chip + level chip) → Provided by your university → Provided by you → Activity & account → (prototype-only debug access is **not** a visible block; §27).
- **Content.** Per §15.1; assurance rendered exactly (`L2 — Roster Match`), enrolment rendered separately (`Current`).
- **Visual composition.** Rows inside flat cards with hairline separators; section labels uppercase 12px muted; chips quiet.
- **Interactions.** Rows navigate (Saves, RSVPs, Play, Privacy, Verification); preference rows toast in prototype.
- **States.** Default; zero-saves/zero-RSVP empty lines (`Nothing saved yet.` / `No RSVPs yet.`).
- **Accessibility.** Row groups are labelled lists/nav; counts are text.
- **Responsive.** Rows truncate with ellipsis at 320px.
- **Data dependencies.** `student`, `membership`, `assurance`, `play`, `saves`, `rsvps`.
- **Prohibited.** Social profile mechanics; follower counts; visible "Prototype controls"/"Reset demo" blocks (debug is an API, §27); generic "Verified".

### 16.7 Notifications

- **Purpose.** Quiet operational feed.
- **Hierarchy.** SubHeader (back + `Notifications` + `Mark all read`) → grouped lists.
- **Content.** Groups Today / Yesterday / This Week / Earlier; canonical items: poll closing soon, Voice acknowledged, event reminder, opportunity deadline, sports result `Final: MUBS 1 — 2 Makerere University`, verification updated to L2.
- **Visual composition.** Icon tile + title/body + time; unread = tenant dot + stronger title weight; read rows calm.
- **Interactions.** Tap marks read and routes by entity; `Mark all read`.
- **States.** Unread badge syncs with header bell; all-read state; empty (`You're all caught up.`).
- **Accessibility.** Groups labelled; unread state not colour-only (dot + weight + text).
- **Responsive.** Single column always.
- **Data dependencies.** `notifications[]` visibility-filtered; read receipts.
- **Prohibited.** Engagement-feed mechanics; sponsored notifications; gamified streaks-of-notifications.

### 16.8 Verification & Membership (L3 action corrected v1.2-FROZEN)

- **Purpose.** Explain assurance honestly.
- **Hierarchy.** SubHeader → current assurance card → how verification works → full L0–L3 ladder → possible next (L3) card.
- **Content.** Current: `L2 — Roster Match` + description (`Your membership is matched to the current student roster provided by your university.`) + `Assurance is separate from enrolment. Your enrolment status is Current.` Copy per §14; L3 note: email alone does not confer L3.
- **Visual composition.** Shield tile, kicker `Current assurance`; ladder as definition rows with a current-marker dot.
- **Interactions.** **L3 action is tenant-configured.** If the tenant exposes an approved stronger-verification method for the current student, render **that method's configured CTA** exactly as configured. Otherwise the L3 card is **informational only, with no action control**. Do not invent a prototype toast or a production workflow merely because L3 exists. No fake architecture errors.
- **States.** L0/L1/L2/L3 variants (current marker moves); stale-membership banner when `membership-refresh` applies; L3 card with CTA (method configured) or without (no method configured).
- **Accessibility.** Ladder is an `<ol>`; current item announced; when no action exists, the L3 card exposes no dead or disabled button.
- **Responsive.** Unchanged.
- **Data dependencies.** `assurance`, `enrolmentStatus`, tenant verification methods (tenant config determines whether an L3 CTA exists).
- **Prohibited.** Generic "Verified" labels; SSO/portal jargon; implying email ⇒ L3; an unconditional self-service "Request stronger verification" action; placeholder toasts standing in for nonexistent flows.

### 16.9 Contextual Gate (all states)

- **Purpose.** One calm, actionable denial per §7/§8.
- **Hierarchy.** Icon tile → kicker → title → body → (Current/Required) → primary action → `Not now`.
- **Content.** Exactly the §8 variant table; the `assurance-required` body is templated from the attempted resource (§8, resource-contextual assurance copy).
- **Visual composition.** Centered card (max-width 340px) or bottom sheet on mobile; no red alarms, no lockout iconography beyond the shield/info tile.
- **Interactions.** Resolvable variants run the simulated flow (e.g., roster match) then **return to the originating action**; non-resolvable variants navigate to the nearest sensible list. Escape/backdrop dismiss restores focus to trigger.
- **States.** `assurance-required`, `membership-refresh`, `poll-closed`, `audience-ineligible`, `voice-disabled` (+ evaluator steps 1/7/8 wired, rarely demoed). Voice assurance failures reuse `assurance-required` with Voice-contextual body; `voice-disabled` is module/intake configuration only.
- **Accessibility.** `role="dialog"`, `aria-modal="true"`, labelled title, focus trap, Escape, focus restore; after verification, focus returns to the resumed action (poll first option).
- **Responsive.** Full-width sheet ≤ 430px; centred card ≥ 640px.
- **Data dependencies.** Evaluator output (`GateReason`), attempted resource context, `returnTo` continuation (signed in production).
- **Prohibited.** 403/ACCESS DENIED language; multiple simultaneous reasons; dumping the student on Home after verification; open-redirect continuation; one variant representing two different causes; poll copy shown during a Voice assurance failure (or any cross-resource copy mismatch).

### 16.10 Voice Composer — Category (draft semantics corrected v1.2-FROZEN)

- **Purpose.** Choose one of the eight permitted categories.
- **Hierarchy.** SubHeader (`Raise an issue`) → step indicator (`Step 1 of 3` + `Category`; confirmation is stage 4 of the flow) → category options → Continue.
- **Content.** The eight categories exactly, each with its icon/tile; helper: `Choose the campus issue category that fits best.`
- **Visual composition.** Lightweight 52px radio rows (2-col tile grid acceptable if it stays calm); step dots quiet.
- **Interactions.** Real radio group; Continue disabled until selection. This is the **first composer step — there is no previous step and therefore no Back control**; the only exit is **`Cancel`, which clears any draft and returns to Student Voice**.
- **States.** Unselected; selected; returning from Details restores the previously selected category (draft preserved).
- **Accessibility.** `fieldset/legend` ("Category"); focus moves to step heading on entry; error via polite live region (`Choose a category.`).
- **Responsive.** Grid collapses to one column ≤ 340px.
- **Data dependencies.** `voiceCategories` (fixed eight); composer draft state; evaluator pre-check at composer entry.
- **Prohibited.** `Other`; attachments here; enterprise-wizard styling; XP; a Back control on the first step; Cancel preserving the draft.

### 16.11 Voice Composer — Details (draft semantics corrected v1.2-FROZEN)

- **Purpose.** Title + description.
- **Hierarchy.** Step indicator (`Step 2 of 3 — Issue details`) → Title field (80 chars, counter) → Description field (500 chars, counter) → Back / Review.
- **Content.** Placeholders: `e.g. Irregular water supply in Halls` / `What is happening, and how does it affect students?` Note: `Do not include other people's names or personal details.`
- **Visual composition.** Standard fields (44px+, 12px radius, tenant focus ring); counters 11.5px muted right-aligned.
- **Interactions.** **Back returns to Category and preserves the draft** — category, title, and description persist (session-scoped in prototype). **`Cancel` clears the draft and returns to Student Voice.** Validation requires non-empty title + description.
- **States.** Empty; partially filled; invalid (`Add a title and a description.`); restored after Back navigation.
- **Accessibility.** Labels bound to inputs; counters via `aria-describedby`; focus to heading on entry.
- **Responsive.** Full-width fields.
- **Data dependencies.** Composer draft state only. _(Production adds optional location text + optional image here — prototype debt, §10.4.)_
- **Prohibited.** Photo/location capture in this prototype; geo tracking; multi-page wizard feel; Back clearing the draft; Cancel preserving it.

### 16.12 Voice Composer — Review (draft semantics corrected v1.2-FROZEN)

- **Purpose.** Confirm content + identity disclosure, then submit.
- **Hierarchy.** Step indicator (`Step 3 of 3 — Review & submit`) → summary box (category / title / description) → identity disclosure box → Back / `Submit issue`.
- **Content.** Disclosure verbatim: `Other students will not see who submitted this issue. Your identity may be accessed only by authorised identity handlers when required for moderation, safety or accountability, and that access is recorded.` + `Submission is not publication.`
- **Visual composition.** Summary in a muted panel; disclosure in a note box with lock icon.
- **Interactions.** **Back returns to Details and preserves the draft** (category, title, description). **`Cancel` clears the draft and returns to Student Voice.** `Submit issue` (exact label) runs the §7 evaluator once more (assurance failure → `assurance-required` gate with Voice-contextual body, returning here), then creates an internal submission (moderation state `submitted`); no public write.
- **States.** Review; submitting (button disabled + `Submitting…`); failed (calm inline retry).
- **Accessibility.** Disclosure is plain text (never hidden behind a collapsed control at submit time); focus to heading.
- **Responsive.** Unchanged.
- **Data dependencies.** Composer draft; evaluator.
- **Prohibited.** `Post publicly`, `Submit anonymously`, or any anonymity promise; publishing the issue; Back clearing the draft.

### 16.13 Voice Composer — Submitted

- **Purpose.** Honest confirmation; set expectations.
- **Hierarchy.** Check tile → `Issue submitted` → `Your issue has been submitted for review.` → `Submitted` chip → expectation line → `Back to Student Voice`.
- **Content.** > **Submission does not mean publication.** `You'll be notified when the status changes.` Optional reference code.
- **Visual composition.** Centered, calm, single card; no confetti, no illustration.
- **Interactions.** Only exit is `Back to Student Voice` (returns to Participate/Voice). **No link to a public issue page** — the issue is not published. Focus moves to the confirmation heading.
- **States.** Single state.
- **Accessibility.** Confirmation heading receives focus; announced politely.
- **Responsive.** Unchanged.
- **Data dependencies.** Submission receipt (internal moderation state only).
- **Prohibited.** Inserting the issue into the public list; routing to `/voice/[id]`; XP; success theatre.

### 16.14 Voice Detail — base anatomy (applies to 16.15–16.18)

- **Purpose.** Public accountability for one published issue.
- **Hierarchy.** Category kicker + tile → title → supporters + StatusChip → description → Support button → Status history card (only occurred stages) → Official updates card(s) (only updates at or below current status) → identity note.
- **Content.** Canonical example: `Water & Sanitation / Irregular water supply in Halls / Frequent disruptions are affecting daily routines and hygiene. / 124 supporters / Acknowledged`. History notes are short institutional sentences. Official updates show office name + date + quoted body; one-way, no replies.
- **Visual composition.** Timeline = restrained `<ol>` with left rail and small dots; latest node emphasized; no parcel-tracking stepper. Updates in a muted panel with info kicker.
- **Interactions.** `Support this issue` → `Supported ✓` + toast `Support recorded.` (idempotent, disabled after). Back returns to Voice list.
- **Accessibility.** History is a labelled `<ol>`; latest entry `aria-current="step"`; support state change announced; no supporter identities anywhere.
- **Responsive.** Timeline unchanged at all widths.
- **Data dependencies.** `voiceIssues[id]` where moderation = published; `supportedByMe`; server-derived supporter count.
- **Prohibited.** Comments/replies/reactions; staff avatars; future status nodes; submitter identity; moderation-state leakage.

Note: in the normal demo, detail routes resolve the three canonical published issues. **Action Planned** and **Resolved** detail states (§16.18–16.19) are reachable as **CampusHubDebug scenario variants / dedicated validation fixtures** (§27), not as entries in the normal Voice list.

### 16.15 Voice Detail — Submitted (published)

- **Purpose/Hierarchy/Composition/A11y/Responsive/Prohibited.** As base (16.14).
- **Content.** History contains **Submitted only** (e.g., `18 May 2026 — Issue submitted for review.`). No official updates. Canonical issue: `Slow Wi-Fi at Main Library upper floor`, 63 supporters.
- **Interactions.** Support enabled.
- **States.** Supportable; not-yet-acknowledged framing is calm (`You'll see updates as the issue progresses.` optional).
- **Data dependencies.** Published issue with single-entry history.

### 16.16 Voice Detail — Acknowledged

- **As base.** History: Submitted → Acknowledged (e.g., 14 May / 15 May, `Guild welfare office acknowledged the issue.`). Canonical issue: `Irregular water supply in Halls`, 124 supporters.
- **Interactions.** Support enabled. **States.** Acknowledged chip (info tone). No official updates yet.
- **Data dependencies.** Two-entry history; no updates array entries at this stage.

### 16.17 Voice Detail — Under Review

- **As base.** History adds Under Review (e.g., `16 May 2026 — Under review with the transport office.`). Canonical issue: `Need for more buses during evenings`, 87 supporters, Transport.
- **Interactions.** Support enabled. **States.** Review chip (tenant tone).
- **Data dependencies.** Three-entry history.

### 16.18 Voice Detail — Action Planned (validation state, v1.2)

- **As base.** History adds Action Planned (e.g., `21 May 2026 — Repair window scheduled.`). Canonical validation issue: `Dark stretch between Mary Stuart and the Main Library`, 41 supporters, Lighting. Reached via `CampusHubDebug.setScenario('voice-action-planned')` / dedicated validation fixture.
- **Content.** First official update appears: Facilities Directorate, 21 May 2026 — `A lighting survey of the Mary Stuart–Library path is complete. Replacement fittings are scheduled this week.`
- **Interactions.** Support enabled. **States.** Planned chip (play tone).
- **Data dependencies.** Four-entry history + one update filtered to current status.

### 16.19 Voice Detail — Resolved (validation state, v1.2)

- **As base.** Full five-stage history (e.g., library Sunday hours: 2 May → 28 May). Canonical validation issue: 156 supporters, Library. Reached via `CampusHubDebug.setScenario('voice-resolved')` / dedicated validation fixture.
- **Content.** Final official update: University Library, 28 May 2026 — `Sunday opening hours have been extended through the assessment period. Students who still cannot access a space can raise a new issue.`
- **Interactions.** Support remains visible and idempotent (resolved issues may still gather support in the pilot). **States.** Resolved chip (success tone); timeline complete.
- **Data dependencies.** Five-entry history + updates through Resolved.

### 16.20 Event Detail

- **Purpose.** Decide whether to attend; RSVP.
- **Hierarchy.** Optional hero photo (16:10) → title + kicker → date/time/venue/organiser metalist → description → RSVP actions → privacy note.
- **Content.** Canonical: _Guild Public Debate: The Future of AI in Africa — Fri, 22 May 2026 · 2:00 PM — 4:30 PM · Senate Building Auditorium · Makerere University Guild._ Note: `RSVPs help the Guild plan. They are never shown as a public attendee list.`
- **Visual composition.** Hero with floating back control; meta rows with 14px icons; action bar: `Going` / `Interested` / bookmark.
- **Interactions.** RSVP toggles are mutually exclusive pressable buttons (`aria-pressed`), idempotent, toasts (`You're on the list.` / `Marked as interested.`); Save toggles (`Saved.`); gated via §7 when the event has an audience or required assurance (assurance failure → `assurance-required` gate with RSVP-contextual body, returning to this event).
- **States.** None/Going/Interested selected; saved; event past (RSVP hidden).
- **Accessibility.** Buttons announce pressed state; hero alt honest.
- **Responsive.** Hero full-bleed within shell.
- **Data dependencies.** `events[id]`, `rsvps`, `saves`, visibility/audience.
- **Prohibited.** Attendee directory, check-in, ticketing, map integration.

### 16.21 Opportunity Detail (HTTPS enforced v1.2)

- **Purpose.** Evaluate and apply externally, safely.
- **Hierarchy.** Verified opportunity kicker → title → provider → deadline/location/eligibility rows → requirements list → description → Apply / Save / Report.
- **Content.** Canonical: _Research Assistant — Climate Resilience — Makerere University — Department of Geography — Apply by 30 May 2026 — Main Campus · Part-time — Year 2+ Geography, Environmental Science and related programmes. L2 required._ Requirements: CV / Brief motivation / Academic transcript.
- **Visual composition.** Briefcase tile, rows in flat card, check-bulleted requirements; primary `Apply on provider site` with external icon.
- **Interactions.** Apply opens the **LeaveCampusHubDialog**: > **You're leaving CampusHub.** `The provider's own application rules apply. CampusHub never asks for payments or deposits.` — `Continue` / `Stay here` (dialog semantics, focus trap, focus restore). `Report suspicious opportunity` → `Report received. The Guild office reviews every report.` Save toggles.
- **States.** Unsaved/saved; report sent; dialog open/closed; assurance-gated where `requires: L2`.
- **Accessibility.** Dialog labelled; warning copy is text, not colour.
- **Responsive.** Action stack full-width.
- **Data dependencies.** `opportunities[id]`, evaluator, `saves`.
- **External URL requirement (firm).** Production `externalUrl` **must be HTTPS**. URLs are validated server-side against the `https:` scheme (and tenant allow-listing where configured); a non-HTTPS target is a data defect — the Apply action is not rendered for it. There is no "eventually HTTPS" state.
- **Prohibited.** Deposits/fees requests; in-app application; silent external navigation; plain-HTTP or scheme-unvalidated external targets.

### 16.22 Sports Detail

- **Purpose.** Read a confirmed result.
- **Hierarchy.** Kicker `Sports result` → score block (crest / score / crest) → `Final` chip → fixture facts (sport, competition, date, venue) → source note.
- **Content.** Canonical demo per §12.1; note: `Match reports are published by the Guild sports office.`
- **Visual composition.** Centred score block, 30px score, 44px crests, hairline divider; facts as meta rows.
- **Interactions.** Back only (team-follow where in scope). No tabs, no stats.
- **States.** Demo shows `completed/Final`; production handles `scheduled | postponed | cancelled | completed | abandoned` (§12.2) with calm state lines (e.g., `Postponed — new date to be announced.`) and draft/correction-aware rendering (published results only; corrections appended in production UI when approved).
- **Accessibility.** Score readable as text (`MUBS 1 — 2 Makerere University`); crests decorative `alt=""` unless labelled.
- **Responsive.** Score block centred at all widths.
- **Data dependencies.** `sports[id]` fixture + published result.
- **Prohibited.** Players, statistics, lineups, betting, predictor, fantasy.

### 16.23 Sponsored Placement (visual pass deferred)

- **Purpose.** Reserve frozen sponsorship behaviour without designing visuals yet.
- **Hierarchy/Content/Visual composition.** **Deferred to the upcoming sponsorship design pass.** Until then: `SponsoredSlot` renders nothing. When designed, placements may occupy only: one Discover card slot; strips on event, opportunity, and team pages — each with persistent `Sponsored` label + sponsor name and a `Why am I seeing this?` control.
- **Interactions.** Placement tap → sponsor destination via the leave-CampusHub dialog pattern; `Why am I seeing this?` opens a plain-language explanation (broad audience, no behavioural targeting).
- **States.** Empty (now); single placement; no-fill (slot collapses silently).
- **Accessibility.** Label is real text; explanation reachable by keyboard; dialog rules apply.
- **Responsive.** Conforms to host card/strip geometry of the containing screen.
- **Data dependencies.** `SponsoredPlacement` (broad-audience only), §6 visibility.
- **Prohibited.** Everything in §13: interstitials, autoplay, takeovers, sponsored notifications, placement adjacent to Student Voice, any behavioural/demographic/assurance/poll/Voice/quiz/browsing targeting.

### 16.24 Privacy & Transparency

- **Purpose.** Honest, calm transparency.
- **Hierarchy.** SubHeader → stacked prose cards: What we collect / Who can see what / Poll privacy / Student Voice identity / University official access / Sponsors / Your rights / Limits we are honest about.
- **Content.** Exact lines per §15.3; includes `We cannot remotely delete files already downloaded to unmanaged devices.`
- **Visual composition.** One prose card or stacked quiet cards; 15px section headings; 13.5px body. No icon soup.
- **Interactions.** None (static).
- **States.** Single state.
- **Accessibility.** Real heading order (`h1` screen title, `h2` sections).
- **Responsive.** Reading column unchanged.
- **Data dependencies.** Static canonical copy.
- **Prohibited.** Anonymity overclaims; unlinkability claims before A1 is resolved; impossible deletion guarantees; architecture jargon.

---

## 17. System States

All states keep the calm premium language — no giant illustration cards for ordinary failures.

| State                            | Pattern                                                                                                          |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Loading                          | Skeleton lines in card shapes; no spinners on content cards unless needed                                        |
| Empty                            | One quiet card: message + optional single action (`No campus information matches that search.` + `Clear search`) |
| Error                            | Inline note + `Try again`; never `ACCESS DENIED` styling                                                         |
| Offline                          | Banner line + cached content where available                                                                     |
| Module unavailable               | Gate variant `module-unavailable` (`voice-disabled` for Voice intake); explanatory body only                     |
| Content removed                  | `This content is no longer available.` + back action                                                             |
| Poll closed                      | Gate variant `poll-closed`                                                                                       |
| Results suppressed/unpublishable | Nothing shown; privacy line only (`Results are shown only when privacy thresholds are met.`)                     |
| Search empty                     | As Empty                                                                                                         |
| Stale membership                 | `membership-refresh` gate                                                                                        |
| Assurance required               | `assurance-required` gate (body contextual to the attempted resource, §8)                                        |
| Ineligible audience              | `audience-ineligible` gate                                                                                       |

---

## 18. Canonical Data Organisation

One single-source-of-truth dataset feeds every screen; no entity is retyped per screen. `MUBS 1 — 2 Makerere University` exists once and is read by Home, Discover, Sports detail, and Notifications.

```text
tenant · student · membership/assurance
notices · publications · events · opportunities · sports (fixture + result)
polls · voiceCategories · voiceIssues (published only) · quiz · play
notifications · gateScenarios · sponsoredPlacements (empty in prototype)
```

Canonical demo facts: Academic Year **2026/2027**; demo student **Nakato Grace** (BSc Computer Science, Year 3, Main Campus, Mary Stuart Hall) at **L2 — Roster Match**, enrolment **Current**; notice teaching resumes 2:00 PM **Wednesday, 20 May 2026**; debate **Fri, 22 May 2026**; opportunity deadline **30 May 2026**; polls close **25 May 2026**; sports result **17 May 2026**.

The normal Student Voice list contains exactly the three canonical published issues (§16.4); Action Planned and Resolved exist as dedicated validation fixtures (§27). Home's Student Voice slot is filled by **`featuredVoiceUpdate`** — an editorially configured issue or, absent configuration, the latest operational update by recency — **never** a supporter-count selector.

Tenant configuration also determines whether an approved stronger-verification (L3) method is exposed for the current student (§16.8); the demo tenant exposes none, so the prototype's Verification screen shows L3 informationally with no action.

---

## 19. TypeScript Contracts (v1.1 privacy boundaries; A1-neutral v1.2)

Shared entities never carry private per-student answers or moderation internals. `PollParticipationReceipt` and `VoiceModerationRecord` are private/governance types and must never be serialized into admin-shared or public surfaces.

```ts
// ── Identity & membership ──────────────────────────────
type AssuranceLevel = "L0" | "L1" | "L2" | "L3";
interface AssuranceState {
  level: AssuranceLevel;
  label: string; // exact "L2 — Roster Match"
  achievedAt: string;
  staleAt?: string;
  method:
    | "roster"
    | "institutional-contact"
    | "manual-review";
}
type EnrolmentStatus =
  | "Current"
  | "Suspended"
  | "Completed";
interface StudentMembership {
  displayName: string;
  programme: string;
  yearOfStudy: number;
  campus: string;
  hall?: string;
  studentNumber: string;
  college: string;
  enrolmentStatus: EnrolmentStatus; /* rendered separately from assurance */
}
interface Tenant {
  id: string;
  name: string;
  campus: string;
  academicYear: string; // "2026/2027"
  verified: boolean;
  crestUrl: string;
  theme: { tenant: string };
  strongerVerificationMethods: StrongerVerificationMethod[];
} // empty ⇒ L3 informational only (§16.8)
interface StrongerVerificationMethod {
  id: string;
  label: string; // tenant-configured CTA copy
  availableTo: (student: StudentMembership) => boolean;
} // server-evaluated eligibility

// ── Visibility & audience (§6) ─────────────────────────
type ContentVisibility =
  | "PUBLIC"
  | "MEMBERS"
  | "VERIFIED_MEMBERS";
interface AudienceRef {
  kind:
    | "all"
    | "faculty"
    | "programme"
    | "campus"
    | "frozen-cohort";
  ids?: string[];
}

// ── Content ────────────────────────────────────────────
interface PriorityNotice {
  id: string;
  title: string;
  body: string;
  date: string;
  source: string;
  visibility: ContentVisibility;
  audience?: AudienceRef;
}
interface Publication {
  id: string;
  kicker: string;
  title: string;
  excerpt: string;
  body?: string;
  date: string;
  source: string;
  image?: CampusImage;
  visibility: ContentVisibility;
  audience?: AudienceRef;
}
interface CampusEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  venue: string;
  organiser: string;
  description: string;
  image?: CampusImage;
  visibility: ContentVisibility;
  audience?: AudienceRef;
  requiredAssurance?: AssuranceLevel;
}
interface Opportunity {
  id: string;
  title: string;
  provider: string;
  summary: string;
  deadline: string;
  location: string;
  eligibility: string;
  requirements: string[];
  externalUrl: string; // MUST be https: — validated server-side (v1.2); non-HTTPS is a data defect
  verified: true;
  requiredAssurance: AssuranceLevel;
  visibility: ContentVisibility;
  audience?: AudienceRef;
}
interface CampusImage {
  url: string;
  width: number;
  height: number;
  alt: string;
}

// ── Sports (§12.2) ─────────────────────────────────────
type SportsFixtureState =
  | "scheduled"
  | "postponed"
  | "cancelled"
  | "completed"
  | "abandoned";
interface SportsTeam {
  name: string;
  crestUrl: string;
}
interface SportsFixture {
  id: string;
  state: SportsFixtureState;
  stageLabel?: string; // demo: "Final"
  home: SportsTeam;
  away: SportsTeam;
  sport: string;
  competition: string;
  kickoff: string;
  venue: string;
  visibility: ContentVisibility;
}
interface ResultCorrection {
  correctedAt: string;
  note: string;
  superseded: { home: number; away: number };
}
interface SportsResult {
  fixtureId: string;
  homeScore: number;
  awayScore: number;
  publication: "draft" | "published";
  corrections: ResultCorrection[];
} // draft never rendered to students

// ── Polls (split for privacy; A1-neutral — v1.2) ───────
interface PollOption {
  id: string;
  label: string;
}
interface Poll {
  id: string;
  label: "Non-binding student sentiment poll";
  question: string;
  description: string;
  options: PollOption[];
  opensAt: string;
  closesAt: string;
  requiredAssurance: AssuranceLevel;
  audience?: AudienceRef;
  visibility: ContentVisibility;
}
// NOTE: Poll deliberately carries NO selected option and NO tallies.

interface PollParticipationReceipt {
  pollId: string;
  respondedAt: string;
  xpAward: { granted: boolean; idempotencyKey: string }; // XP triggered from this record, never the ballot
  // NOTE (v1.2): deliberately contains NO selected option.
}

// A1-DEPENDENT / INTENTIONALLY UNSPECIFIED (v1.2):
// The production storage model for the actual response selection — including whether
// and how any selection is stored beside student identity — is NOT defined in this
// blueprint. It remains unresolved under architecture blocker A1 (§9.1) and must not
// be inferred from the prototype.
//
// PROTOTYPE DEBT: the static prototype MAY locally store a selected option
// (e.g., { pollId: optionIndex } in localStorage) purely for demonstration.
// This is prototype debt and MUST NOT be treated as, or evolved into, the
// production architecture.

interface PollResultSummary {
  pollId: string;
  totals: number[];
  thresholdMet: true;
  publishedAt: string;
}
// Aggregate only. Returned ONLY when lifecycle + privacy thresholds permit; enforced server-side.
// Never per-student, never includes any linkage to individual selections.

// ── Student Voice (§10.2 split) ────────────────────────
type VoiceCategory =
  | "Wi-Fi"
  | "Water & Sanitation"
  | "Facilities"
  | "Lighting"
  | "Library"
  | "Transport"
  | "Academic Facilities"
  | "Campus Services";
type VoicePublicStatus =
  | "Submitted"
  | "Acknowledged"
  | "Under Review"
  | "Action Planned"
  | "Resolved";
type VoiceModerationState =
  | "submitted"
  | "in_moderation"
  | "rejected"
  | "restricted"
  | "published";
interface VoiceIssue {
  // public contract — published issues only
  id: string;
  category: VoiceCategory;
  title: string;
  description: string;
  locationText?: string;
  image?: CampusImage; // frozen-product optionals; omitted in prototype (debt)
  supporterCount: number;
  supportedByMe?: boolean;
  status: VoicePublicStatus;
  submittedAt: string;
  publishedAt: string;
  featured?: boolean; // editorial flag for featuredVoiceUpdate; never derived from supporterCount
  history: VoiceHistoryEntry[];
  updates: VoiceOfficialUpdate[];
  /* NO submitter identity. NO moderation state. */
}
interface VoiceHistoryEntry {
  status: VoicePublicStatus;
  at: string;
  note?: string;
}
interface VoiceOfficialUpdate {
  atStatus: VoicePublicStatus;
  author: string;
  publishedAt: string;
  body: string;
}
interface VoiceModerationRecord {
  issueId: string;
  state: VoiceModerationState;
  reviewedBy?: string;
  reviewedAt?: string;
  reason?: string;
} // governance surface only; never to student client

// ── Play ───────────────────────────────────────────────
interface DailyQuiz {
  id: string;
  tenantDay: string;
  question: string;
  options: string[];
  xpParticipation: 5;
  xpCorrectBonus: 5;
} // correct answer NEVER in this client-facing type
interface QuizParticipation {
  quizId: string;
  tenantDay: string;
  optionIndex: number;
  correct?: boolean;
  xpAwarded?: 5 | 10;
} // grading fields server-filled only
interface PlayProfile {
  level: number;
  levelName?: string; // placeholder
  xp: number;
  xpToNext: number;
  streakDays: number;
  week: { label: string; active: boolean }[];
  recessPaused: boolean;
}

// ── Notifications & gates ──────────────────────────────
interface AppNotification {
  id: string;
  group: "Today" | "Yesterday" | "This Week" | "Earlier";
  kind:
    | "poll"
    | "event"
    | "opportunity"
    | "sports"
    | "verification"
    | "voice";
  title: string;
  meta: string;
  href: string;
  read: boolean;
  createdAt: string;
}
type GateStep =
  | "tenant-lifecycle"
  | "module-enabled"
  | "resource-actionable"
  | "membership-state"
  | "assurance"
  | "audience"
  | "verified-attributes"
  | "story-prerequisites";
type GateVariant =
  | "tenant-inactive"
  | "module-unavailable"
  | "poll-closed"
  | "membership-refresh"
  | "assurance-required"
  | "audience-ineligible"
  | "attributes-required"
  | "prerequisites-unmet";
// Note: 'voice-disabled' is expressed as variant 'module-unavailable' scoped to the Voice module.
// 'assurance-required' carries the attempted resource context for presentation copy only (§8).
interface GateDecision {
  allowed: boolean;
  reason?: {
    step: GateStep;
    variant: GateVariant;
    resourceContext?:
      | "poll"
      | "voice-submission"
      | "voice-support"
      | "rsvp"
      | "daily-quiz";
  };
} // one reason; context never changes the cause

// ── Sponsorship (§13) ──────────────────────────────────
interface SponsoredPlacement {
  id: string;
  slot:
    | "discover-card"
    | "event-strip"
    | "opportunity-strip"
    | "team-strip";
  sponsorName: string;
  label: "Sponsored";
  creative: CampusImage;
  whyUrl: string;
  audience: "broad-campus-wide"; /* no behavioural/demographic/assurance/poll/voice/quiz/browsing targeting */
}
```

---

## 20. Component Architecture

One component per responsibility; no trivial abstractions.

```text
CampusShell · CampusHeader · BottomNav · SubHeader
SearchBar · FilterChips · SegmentedControl
PriorityNotice · EditorialHero · Card · IconTile · StatusChip · Kicker · MetaRow · NoteBox
SportsResultCard · OpportunityCard
PollCard · PollForm                     (PollForm client)
VoiceIssueCard · VoiceComposer · SupportButton · StatusTimeline · OfficialUpdate
QuizCard · LevelCard · StreakCard
ContextualGate · Dialog · LeaveCampusHubDialog
RsvpActions · SaveButton · NotificationList
ToastViewport (single role="status" live region)
SponsoredSlot                           (reserved; renders nothing until design pass)
```

Mapping rule: each prototype render-function/card template becomes exactly one component; the canonical dataset becomes typed fixtures, later API responses.

---

## 21. Prototype State vs Production State

Prototype local/session state is demonstration-only. Production authority moves server-side. `localStorage` never grants authorization.

| Concern              | Prototype                                                                             | Production authority                                                                                                                                                                                                                  |
| -------------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Assurance            | localStorage demo value (default L2)                                                  | Server-computed `AssuranceState`; gates revalidated every render                                                                                                                                                                      |
| Poll participation   | localStorage `{pollId: optionIndex}` map (option stored locally — **prototype debt**) | `PollParticipationReceipt` server-authoritative (participation + XP idempotency, **no selected option**); **response-selection storage is A1-dependent and intentionally unspecified** (§9.1); results API enforces lifecycle/privacy |
| Poll results         | Never rendered                                                                        | `PollResultSummary` only when permitted                                                                                                                                                                                               |
| Voice support        | localStorage ids + derived count                                                      | Idempotent support relation; server returns count                                                                                                                                                                                     |
| Voice submission     | Draft + confirmation only                                                             | Moderation pipeline (§10.2); publication controlled server-side                                                                                                                                                                       |
| Voice composer draft | Session-scoped draft; Back preserves, Cancel clears (§16.10–16.12)                    | Client/draft state only; never a source of truth                                                                                                                                                                                      |
| Quiz participation   | localStorage `{day, choice, gain}`                                                    | Daily record keyed by tenant day; one attempt enforced server-side                                                                                                                                                                    |
| Quiz correctness     | Answer present in demo data (flagged)                                                 | Correct answer never shipped to client pre-submission                                                                                                                                                                                 |
| XP                   | localStorage ledger                                                                   | Server-derived from participation events; poll amount tenant-configured                                                                                                                                                               |
| Saves / RSVP         | localStorage                                                                          | Relation tables                                                                                                                                                                                                                       |
| Notification reads   | localStorage                                                                          | Read receipts                                                                                                                                                                                                                         |
| Return-to-action     | Session `returnTo`                                                                    | Signed/validated continuation token; no open redirect                                                                                                                                                                                 |
| Voice status         | Canonical per-issue data + validation fixtures                                        | Server issue status; moderation state internal                                                                                                                                                                                        |
| Scenario overrides   | `CampusHubDebug` API                                                                  | Removed entirely                                                                                                                                                                                                                      |

---

## 22. Next.js Translation

Target: **Next.js App Router + TypeScript + Tailwind CSS. Server Components by default.** Do not put `"use client"` on the whole app or on `app/layout.tsx`.

**Server Components:** page data; CampusHeader (unread count server-derived); notice/story/event/opportunity/sports display; Privacy; Me display; Verification display (including tenant-configured L3 method resolution, §16.8); Voice timeline & official updates; all static cards.

**Client islands (only these, only for the stated reason):** live Discover search/filtering; PollForm; QuizCard; SupportButton; RsvpActions; SaveButton; VoiceComposer; ContextualGate; ToastViewport; LeaveCampusHubDialog; SegmentedControl (unless implemented as query-param links); BottomNav active indicator (only if pathname logic requires it).

**Mutations** via Server Actions or equivalent secure server paths: `submitPollResponse`, `supportVoiceIssue`, `submitVoiceIssue`, `submitQuizAnswer`, `rsvp`, `save`. Every gated action re-runs the §7 evaluator server-side. `submitPollResponse` always records the participation receipt; persistence of the selection itself is A1-dependent and not specified here (§9.1).

---

## 23. Accessibility (mandatory)

- **Landmarks:** semantic `header`, `main`, `nav`; exactly one logical page heading per screen.
- **Primary nav:** `<nav aria-label="Primary">` with `aria-current="page"`.
- **Segmented control:** `role="tablist"` / `role="tab"` / `aria-selected` / `aria-controls` / `role="tabpanel"` with arrow-key support — or native navigation links where semantically better.
- **Poll/quiz/category controls:** real form controls — `<fieldset>` + `<legend>` + `<input type="radio">`. Never clickable-div radios.
- **Dialogs (gates, leave-CampusHub):** `role="dialog"`, `aria-modal="true"`, focus in, focus trap, Escape closes where appropriate, focus restored to trigger; after successful verification focus returns to the resumed action.
- **Composer:** focus moves to the new step heading/legend on every step change; confirmation focuses the confirmation heading.
- **Toast:** one polite live region — `role="status"`, `aria-live="polite"`.
- **Targets:** ≥44px practical hit area. **Contrast:** WCAG AA for text and controls. **Motion:** respect `prefers-reduced-motion`; consider `prefers-contrast: more`. Never remove visible focus rings for screenshot fidelity.

---

## 24. Responsive Behaviour

Primary target **390 × 844**; validate **320 × 844**, **412 × 915**, **430 × 932**. Student shell **max-width 430px**. At larger viewports: centre the student workspace on a restrained neutral/stone outer page, optional subtle border/shadow. Do **not** convert to a desktop dashboard; no sidebar. Admin is a separate desktop-first surface. At ≤359px: gutters 14px, hero title 19px, Discover thumbs 104px (92px floor).

---

## 25. Asset Strategy

Prototype: local assets; honest SVG/placeholder fallbacks; never fake official crests; never present generic imagery as authentic Makerere photography. Production: licensed/authentic local imagery; `next/image` with explicit dimensions and responsive `sizes`; Home hero eager/priority; below-fold lazy; fallback surface prevents broken-image ugliness. Alt text describes what is actually shown.

---

## 26. Performance Budget (v1.1 — exact targets)

| Metric                                               | Target                            |
| ---------------------------------------------------- | --------------------------------- |
| Home initial transfer (compressed, excluding images) | **≤ 300 KB**                      |
| Total initial payload including above-fold images    | **≤ 600 KB**                      |
| Meaningful content visible                           | **~5 s on a 3G-class connection** |
| Interactive                                          | **~8 s on a 3G-class connection** |

These are **engineering targets**: validated by real-device testing now, and enforced in CI once validated. Supporting discipline: no huge JS dependencies, no decorative image overload, no client-rendering the entire application, no heavy icon libraries in the static prototype, no oversized initial photography — the student experience must stay practical on lower-bandwidth mobile connections.

---

## 27. Debug / Prototype Controls

No visible debug blocks in the student UI (no "Prototype controls", "Reset assurance to L1", "Preview all gate states"). Debugging happens through a developer API:

```js
CampusHubDebug.setScenario("assurance-required"); // demo resourceContext defaults to 'poll'; can be set per attempt
CampusHubDebug.setScenario("membership-refresh");
CampusHubDebug.setScenario("poll-closed");
CampusHubDebug.setScenario("audience-ineligible");
CampusHubDebug.setScenario("voice-disabled"); // Voice module/intake OFF (GSC-14 step 2) — never an assurance failure
CampusHubDebug.setScenario("voice-under-review");
CampusHubDebug.setScenario("voice-action-planned"); // selects the Action Planned validation fixture (not in normal list)
CampusHubDebug.setScenario("voice-resolved"); // selects the Resolved validation fixture (not in normal list)
CampusHubDebug.resetDemo(); // restores canonical normal state: L2 — Roster Match
```

Normal default is always `L2 — Roster Match`; L1 is reachable only via scenario. Voice assurance failure is exercised through `assurance-required` with a return-to-action to the Voice composer. The `voice-action-planned` / `voice-resolved` scenarios route to dedicated validation issues (§16.18–16.19) that do not appear in the normal three-issue Voice list. Prototype-only debug state is explicitly documented for removal from production (Appendix C).

---

## 28. Validation (mandatory browser pass)

Do not claim pixel fidelity without rendering. Validate at **390×844, 320×844, 412×915, 430×932** and capture screenshots for: Home; Discover; Participate/Polls; Participate/Voice; Play; Me; Gate; Composer Category/Details/Review/Submitted; Voice Detail Acknowledged/Action Planned/Resolved; Event; Opportunity; Sports; Verification; Privacy; Notifications.

Check: horizontal overflow; clipped text; card density; hierarchy; image crop; bottom-nav clearance; sticky header behaviour; focus behaviour; console errors; route correctness; state persistence (composer draft preserved across Back, cleared by Cancel); responsive consistency.

Playwright example (overflow + screenshots):

```js
const { chromium } = require("playwright");
const shots = [
  "home",
  "discover",
  "participate?tab=polls",
  "participate?tab=voice",
  "play",
  "me",
  "notifications",
  "me/verification",
  "me/privacy",
  "events/guild-debate",
  "opportunities/ra-climate",
  "sports/mubs-mak",
  "participate/voice/voice-water",
];
(async () => {
  const browser = await chromium.launch();
  for (const vp of [
    { width: 390, height: 844 },
    { width: 320, height: 844 },
    { width: 412, height: 915 },
    { width: 430, height: 932 },
  ]) {
    for (const route of shots) {
      const page = await browser.newPage({
        viewport: vp,
        deviceScaleFactor: 2,
      });
      page.on(
        "console",
        (m) =>
          m.type() === "error" &&
          console.log("ERR", route, m.text()),
      );
      page.on("pageerror", (e) =>
        console.log("PAGEERROR", route, e.message),
      );
      await page.goto(`http://localhost:8000/#${route}`, {
        waitUntil: "networkidle",
      });
      await page.screenshot({
        path: `shots/${vp.width}x${vp.height}/${route.replaceAll("/", "_")}.png`,
        fullPage: true,
      });
      if (
        await page.evaluate(
          () =>
            document.documentElement.scrollWidth >
            window.innerWidth,
        )
      )
        console.log("OVERFLOW", vp.width, route);
      await page.close();
    }
  }
  await browser.close();
})();
```

Gates and later composer steps require interaction first (invoke `CampusHubDebug.setScenario(...)` or step the composer) before capture.

---

## 29. Copy & Product Rules That Must Never Regress

**Never ship:**

```text
Submit Vote · Your individual vote is private · Vote/Ballot/Election language
Take Poll on a Student Voice card · poll/Voice hybrid cards
Voice discussions/comments/threads/reactions
Anonymous / fully anonymous / untraceable (as blanket promises)
Poll unlinkability/non-linkability claims, or a frozen identity↔option storage model, before A1 is resolved
Immediate/live poll percentages after responding
ACCESS DENIED / 403 / Unauthorised / Forbidden
Generic "Verified" assurance · "Verified • Current"
Home marketing carousel · Sports predictor · Betting · Player statistics
Attendance-gated quiz · "+10 XP" as the only quiz earning rule
A universal hard-coded Poll XP number in student-facing copy
Fake iPhone chrome / Dynamic Island / status-bar replicas
Student social follower metrics · meaningless academic-year chevron
Visible prototype controls in the student UI
Future Voice timeline nodes · unpublished issues in public lists
Supporter-count ranking/sorting or supporter-driven featured Voice selection
One gate variant covering two different causes (e.g., assurance failure and module-off both as "voice unavailable")
Resource-mismatched gate copy (poll wording on a Voice assurance failure, or vice versa)
Composer Back clearing the draft · Cancel preserving it · a Back control on the first composer step
An unconditional self-service L3 request action or a placeholder L3 workflow
Non-HTTPS opportunity external URLs (or unvalidated scheme)
Sponsorship interstitials/autoplay/takeovers/sponsored notifications
Sponsorship adjacent to Student Voice · behavioural sponsorship targeting
"Final" modelled as the only production sports state
```

**Preserve:**

```text
Submit response · Response recorded. · Your individual response is private.
CampusHub does not provide Guild or university users with a way to see how a
named student responded to a poll. Results are shown only when privacy
thresholds are met.
Raise campus issues and follow what happens next.
Your identity is not shown publicly.
Submission does not mean publication. · Support recorded. · Saved.
L0 — Registered · L1 — Weak Affiliation · L2 — Roster Match · L3 — Strong Institutional Proof
Enrolment status: Current
+5 XP for taking part · +5 XP accuracy bonus · One attempt per day
Your Daily Quiz, XP, level and streak.
Your streak pauses automatically during university recess.
You're leaving CampusHub.
MUBS 1 — 2 Makerere University · Final · 17 May 2026 · Academic Year 2026/2027
```

---

## 30. Open Items

- **A1 — Poll response storage/linkability architecture: UNRESOLVED BLOCKER.** The production storage model for poll response selections (and any relationship to student identity) must be decided under A1 before production poll implementation. Until then this blueprint freezes only the student-facing wording, lifecycle/threshold behaviour, and the participation/XP ↔ selection separation (§9.1). No unlinkability claim and no concrete storage model may be shipped on this blueprint's authority. A1 is the **only** blocker recorded against this document, and it applies only to that poll storage/linkability architecture.
- **Sponsorship visual design** — deferred to the scheduled sponsorship design pass; frozen rules (§13) apply meanwhile.
- **Voice composer optional inputs** (location text, image) — production requirement preserved; prototype omission tracked as debt (Appendix C).
- There are **no** open product confirmations for Poll XP: the frozen rule (§11.3) is complete — amount is tenant-configurable within platform-bounded ranges and the blueprint intentionally carries no number.

---

## 31. Changelog

### v1.2-FROZEN (final freeze patch)

1. **Assurance-required copy made resource-contextual (§7, §8, §16.9, §17, §19, §27).** One `assurance-required` cause/variant; the gate receives the attempted resource context and templates only the presentation body (poll / voice-submission / voice-support / RSVP / daily-quiz, with a neutral fallback). Kicker, CTA, level comparison and return-to-action unchanged. No new gate causes; poll copy never shown during a Voice assurance failure.
2. **Voice Composer draft semantics fixed (§16.10–16.12, §21, §28, §29).** Back between steps preserves the draft (category/title/description persist); Cancel clears the draft and returns to Student Voice; the Category step has no previous step, so it exposes Cancel, not Back.
3. **Universal L3 self-service removed (§16.8, §18, §19, §22, §29).** No unconditional "Request stronger verification" action and no invented toast/workflow. If the tenant exposes an approved stronger-verification method for the current student, render its configured CTA; otherwise L3 is informational only with no action.

### v1.2 (pre-freeze correction pass)

1. **A1 blocker restored** (§9.1, §30): production poll-response storage/linkability architecture is unresolved under A1. The blueprint freezes wording, lifecycle/threshold behaviour, and participation↔selection separation only; it freezes no identity↔option storage model and claims no technical unlinkability.
2. **§19 contracts revised (v1.2):** `MyPollParticipation` removed. Added `PollParticipationReceipt` (identity-linked: `pollId`, `respondedAt`, XP-award/idempotency — **no selected option**). Response-selection storage marked **A1-dependent / intentionally unspecified**, with an explicit comment that the prototype may locally store a selected option for demonstration but this is **prototype debt**, not production architecture. `PollResultSummary` remains aggregate, lifecycle/threshold-gated.
3. **§6 Visibility/Audience contradiction fixed:** visibility alone gates render/search/notify/media; audience is a separate actionability/targeting axis; participation requires visibility AND audience/actionability AND the GSC-14 evaluator; a resource may be intentionally visible beyond the acting cohort.
4. **Voice default dataset restored** (§16.4, §18): three canonical published issues (water/Acknowledged/124, buses/Under Review/87, Wi-Fi/Submitted/63). Action Planned and Resolved remain as full screen specifications (§16.18–16.19) reachable via CampusHubDebug scenario variants / dedicated validation fixtures, not as entries in the normal list.
5. **Home §16.1 order fixed:** Purpose, Hierarchy, Content/Composition, and Data dependencies all agree mechanically on the single frozen order: Priority Notice → major publication/story → eligible poll → upcoming event → sports → opportunity → Voice update → Daily Quiz → compact XP/Level/Streak. Event card added; no contradictory ordering remains.
6. **Voice gate causes separated** (§7, §8, §16.4, §16.9): Voice assurance failure uses `assurance-required` (GSC-14 step 5); `voice-disabled` (`module-unavailable` scoped to Voice) applies only to module/intake configuration (step 2). One variant never represents two causes.
7. **Opportunity HTTPS enforced** (§16.21, §19): production `externalUrl` must be HTTPS, validated server-side; soft "eventually HTTPS" wording removed; non-HTTPS targets are data defects.
8. **Voice popularity drift removed** (§16.1, §16.4, §18, §19): Home Voice slot uses `featuredVoiceUpdate` — editorial flag or recency-based `latestOperationalUpdate` — never supporter-count selection; popularity ranking prohibited.

### v1.1 (retained)

1. **§1 Authority hierarchy** added (frozen spec > blueprint > candidates).
2. **Poll XP** corrected (§11.3): awarded once per participation, option-independent, triggered from the participation record, tenant-configurable within platform bounds; `Open Product Confirmation` removed; no universal number anywhere.
3. **§6 Content visibility** added: `PUBLIC / MEMBERS / VERIFIED_MEMBERS`, separate from audience.
4. **§7 GSC-14** added verbatim in meaning: 8-step order, exactly one actionable denial reason, shared evaluator for Poll/Voice/RSVP/Quiz.
5. **§10.2 Voice** moderation lifecycle (`submitted → in_moderation → rejected/restricted/published`) separated from public status progression; new submissions remain non-public; optional Voice location text + image preserved as production requirement and labelled prototype debt (§10.4).
6. **§12 Sports**: canonical demo record kept; production contracts now support 5 fixture states and draft/published/correction result handling.
7. **§13 Sponsorship pilot** restored with all frozen rules; visual design explicitly deferred.
8. **§26 Performance** targets set exactly (≤300KB / ≤600KB / ~5s / ~8s), as engineering targets validated on real devices and later CI-enforced.
9. **§16 Screen-by-screen specification** completed for every canonical screen, including all gate states, all composer steps, all five Voice Detail statuses, and the reserved Sponsored Placement screen.
10. **§19 Contracts** tightened: Poll participation separated from the shared poll entity; `VoiceModerationState` split from `VoicePublicStatus`; no private or moderation data on shared entities.

**Preserved unchanged through v1.2-FROZEN:** 430px shell; token system; typography; screen compositions (including Home's mechanical order); XP policy; Voice moderation split; GSC-14 order and cause set; sponsorship rules; sports contracts; accessibility rules; performance targets; Next.js Server-Components-first strategy; all §29 non-regression copy.

---

## 32. Self-Review Confirmation (v1.2-FROZEN)

**Focused v1.2-FROZEN checks:**

- **Assurance contextual copy:** one cause (`assurance-required`) across Poll, Voice submission, Voice support, RSVP, Daily Quiz ✔; per-resource body table in §8 ✔; kicker/CTA/level comparison unchanged ✔; explicit rule against cross-resource copy mismatch ✔; §16.9, §17, §19 `GateDecision.resourceContext`, §27 all consistent ✔; no new variants added to §7 table ✔.
- **Composer draft semantics:** §16.10 uses Cancel (no Back on first step); §16.11 and §16.12 Back preserves category/title/description; Cancel clears draft and returns to Student Voice everywhere ✔; §21 state row and §28 validation checklist updated ✔; §29 regression list guards all three failure modes ✔.
- **L3 self-service removed:** §16.8 renders tenant-configured CTA only when an approved method exists for the current student; otherwise informational only ✔; no prototype toast, no invented production workflow ✔; §18/§19 carry the tenant-config hook (`strongerVerificationMethods`) ✔; §22 notes server resolution; §29 prohibits the unconditional action ✔.

**Focused v1.2 checks (re-verified):**

- **A1 restored:** §9.1 names the blocker explicitly; §30 lists it first and confirms it is the only blocker, scoped to poll storage/linkability ✔.
- **Poll-linkability neutrality:** §19 has `PollParticipationReceipt` without a selected option; selection storage marked A1-dependent; explicit prototype-debt comment on local option storage; §21, §22, §29 all consistent; no unlinkability claims (§9, §15.3, §16.24) ✔.
- **Visibility/Audience consistency:** §6.3 gates render/search/notify/media on visibility alone; audience governs actionability; participation requires both plus GSC-14; broader-than-cohort visibility explicitly permitted ✔.
- **Voice default dataset:** §16.4 lists exactly three published issues with the canonical titles/counts/statuses; §16.18–16.19 retained as debug/validation states; §18 and §27 align ✔.
- **Home ordering:** §16.1 Purpose/Hierarchy/Content/Composition/Data dependencies all enumerate the identical frozen order; event card present at position 4; no second ordering remains ✔.
- **Gate-cause separation:** `assurance-required` for Voice assurance failure; `voice-disabled` only for module/intake; §7 table, §16.4, §16.9, §27 consistent; exactly one variant per failing step ✔.
- **HTTPS enforcement:** §16.21 firm validated-HTTPS requirement; §19 `externalUrl` annotated; "eventually HTTPS" wording gone ✔.
- **Voice popularity drift:** `featuredVoiceUpdate`/`latestOperationalUpdate` selector; `featured` editorial flag; supporter-count ranking/selection prohibited ✔.

**Carried-forward v1.1 checks (re-verified):** KNOW > PARTICIPATE > PLAY ✔; poll/Voice separate ✔; no election terminology ✔; response wording verbatim ✔; no live tallies ✔; poll XP rule without a universal number ✔; pseudonymous-to-peers Voice ✔; eight categories, no Other ✔; unpublished stays unpublished ✔; occurred-only timelines ✔; idempotent support ✔; exact L0–L3, L2 default, enrolment separate ✔; quiz +5/+5, tenant day ✔; no badges/leaderboards/Energy ✔; sponsorship frozen rules with deferred visual pass ✔; sports fixture states + result publication ✔; exact performance targets ✔; canonical dataset + entity-aware routes ✔; server authority + Server Components default + minimal islands ✔; full accessibility set (semantics, focus, dialogs, 44px, AA, reduced motion) ✔; 390 primary / 320 minimum / 412–430 validation; centred desktop workspace, no dashboard ✔.

_End of CampusHub_Canonical_Prototype_Blueprint_v1.2_FROZEN.md — frozen for static-prototype implementation. A1 remains the sole explicit blocker, limited to the unresolved production poll storage/linkability architecture._

```

---

The freeze is complete: three corrections applied in place, everything else untouched, changelog and self-review updated. The only open dependency remaining is the external A1 decision on poll response storage/linkability — and per the document's own scoping, that blocks production poll storage design only, not the static prototype build from this blueprint.
```
