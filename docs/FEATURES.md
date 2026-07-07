# FEATURES.md

Every feature below states why it exists, the user benefit, technical complexity, dependencies, and backend/frontend requirements. Version tag shown as **[MVP]**, **[V2]**, **[Advanced]**, or **[Stretch]**.

---

## Core Features (MVP)

### 1. Authentication & Account Management [MVP]
- **Why it exists:** Every other feature is per-user; nothing works without accounts.
- **User benefit:** Secure, persistent access to their own dashboard.
- **Technical complexity:** Low–Medium (JWT + refresh tokens, password hashing).
- **Dependencies:** None (foundational).
- **Backend:** User model, bcrypt hashing, JWT access/refresh tokens, auth middleware.
- **Frontend:** Login/Register pages, protected route wrapper, auth context.

### 2. GitHub Integration (Connect + Ingest) [MVP]
- **Why it exists:** GitHub is the primary source of project-quality and language-breakdown data, and has the most reliable official API of the four platforms.
- **User benefit:** Automatic import of repo and commit data without manual entry.
- **Technical complexity:** Medium-High (OAuth flow, GitHub REST/GraphQL API, rate-limit management).
- **Dependencies:** Auth system.
- **Backend:** GitHub adapter module, OAuth callback route, encrypted token storage, background sync job.
- **Frontend:** "Connect GitHub" flow, sync status indicator.

### 3. LeetCode Integration (Ingest via unofficial API) [MVP]
- **Why it exists:** LeetCode is the dominant DSA practice platform for this audience; without it, the "weak area" story is incomplete.
- **User benefit:** Automatic import of submissions, topic tags, and difficulty stats.
- **Technical complexity:** High (no official API, unofficial GraphQL endpoint can change without notice).
- **Dependencies:** Auth system; username-based (no OAuth available).
- **Backend:** LeetCode adapter with defensive parsing and fallback/error handling, background sync job.
- **Frontend:** "Add LeetCode username" form, sync status/error state.

### 4. Unified Activity Heatmap [MVP]
- **Why it exists:** This is the platform's core differentiator — one calendar, all platforms, one true picture of consistency.
- **User benefit:** Immediate visual answer to "am I actually consistent?"
- **Technical complexity:** Medium (data normalization across event types into a single daily-activity model).
- **Dependencies:** GitHub + LeetCode ingestion.
- **Backend:** Unified `ActivityEvent` collection/aggregation pipeline producing per-day counts.
- **Frontend:** Calendar heatmap component (reusable, data-driven).

### 5. Consistency Score [MVP]
- **Why it exists:** Raw activity counts don't distinguish disciplined daily practice from last-minute bursts — this is the specific insight recruiters and students both actually want.
- **User benefit:** A single, explainable number (plus streaks) showing practice regularity.
- **Technical complexity:** Medium (statistics: coefficient of variation over rolling window, streak calculation).
- **Dependencies:** Unified activity model (#4).
- **Backend:** Scoring service computing CoV over 90-day rolling window, streak logic, recency-weighted trend.
- **Frontend:** Score display component with a plain-language "why this number" explanation panel.

### 6. Project Quality Score [MVP]
- **Why it exists:** Star count is popularity-biased and gameable; recruiters actually care about README quality, tests, CI, and maintenance — this feature measures those signals directly.
- **User benefit:** Concrete, specific, actionable feedback per repo instead of a vanity metric.
- **Technical complexity:** Medium-High (multiple GitHub API calls per repo, rate-limit-aware batching, weighted scoring formula).
- **Dependencies:** GitHub ingestion (#2).
- **Backend:** Per-repo scoring service (README check, `.github/workflows` check, test-dir heuristic, commit recency, contributor count), top-5-repo aggregate (not full average).
- **Frontend:** Per-repo score cards with breakdown, sortable repo list.

### 7. Weak-Area Detection [MVP]
- **Why it exists:** This is the "actionable insight" the whole product promises — not "you're weak in Graphs" but a transparent, reasoned explanation.
- **User benefit:** Directs limited study time to the areas that actually need it, with confidence levels so students aren't misled by sparse data.
- **Technical complexity:** High (combines difficulty-weighted success rate, recency decay, and attempt-confidence into one ranked, explainable output).
- **Dependencies:** LeetCode ingestion (#3); Codeforces/CodeChef extend this in V2.
- **Backend:** Per-topic aggregation, weighted scoring formula, "insufficient data" threshold logic, natural-language reasoning string generator.
- **Frontend:** Ranked topic list with expandable reasoning per topic.

### 8. Language & Skill Breakdown [MVP]
- **Why it exists:** Recruiters and students both want an honest "what do you actually work in" view, not a self-reported skills list.
- **User benefit:** Objective skill profile combining GitHub language bytes and competitive-programming topic tags.
- **Technical complexity:** Low-Medium (aggregation and normalization, mostly derived from data already ingested).
- **Dependencies:** GitHub + LeetCode ingestion.
- **Backend:** Aggregation service normalizing byte-counts to percentages, merging with topic-tag frequency.
- **Frontend:** Bar/donut chart component (reusable chart wrapper).

### 9. Resume Suggestion Generator (basic) [MVP]
- **Why it exists:** This is the feature that turns analysis into a tangible, usable output the student walks away with.
- **User benefit:** Specific, data-backed resume bullets instead of vague self-written claims.
- **Technical complexity:** Medium (template-based NLG — not a full LLM integration for MVP, to keep scope realistic).
- **Dependencies:** Consistency score, project quality score, language breakdown (#5, #6, #8).
- **Backend:** Template engine mapping computed metrics to bullet templates, threshold logic (e.g., minimum 30 days of activity before bullets are generated, per the success criteria).
- **Frontend:** Bullet list with copy-to-clipboard, category grouping (CP / projects / activity).

### 10. Background Sync Jobs & Graceful Degradation [MVP]
- **Why it exists:** External APIs are unreliable and rate-limited; the product must never show an error page when GitHub or LeetCode misbehaves.
- **User benefit:** A dashboard that always shows *something* — cached data with a clear "last synced" timestamp — instead of breaking.
- **Technical complexity:** High (job scheduling, retry/backoff, partial-failure handling, cache-first read model).
- **Dependencies:** All adapters (#2, #3).
- **Backend:** Job queue/scheduler, per-source sync status tracking, cache-first API responses.
- **Frontend:** "Last synced X minutes ago" indicators, per-source error banners that don't block the rest of the UI.

---

## Nice-to-Have Features

### 11. Codeforces Integration [V2]
- **Why:** Extends weak-area detection and heatmap coverage to a second major CP platform.
- **Complexity:** Medium (Codeforces has a clean official API — easier than LeetCode).
- **Backend:** New adapter following the same interface contract as GitHub/LeetCode adapters.
- **Frontend:** Extend existing components (heatmap, weak-area list) — should require no structural UI change if the adapter contract was designed well in MVP. This is a deliberate test of MVP architecture quality.

### 12. CodeChef Integration [V2]
- Same rationale and shape as #11; CodeChef's API is less consistent, so this is scheduled after Codeforces to build adapter-hardening experience first.

### 13. Recency-Weighted Trend Visualizations [V2]
- **Why:** The consistency score's "trend" component deserves its own visual (e.g., 90-day rolling line chart), not just a number.
- **Complexity:** Low-Medium — mostly a frontend charting task on data already computed in MVP.

### 14. Richer Resume Templates / Tone Variants [V2]
- **Why:** Different bullet phrasing for different resume styles (concise vs. detailed).
- **Complexity:** Low — extends the existing template engine.

### 15. Public Shareable Profile (opt-in) [V2]
- **Why:** Some students want a link to send recruiters directly.
- **Complexity:** Medium (new public, unauthenticated route; must respect the "not a leaderboard" principle — no comparison features on this page).
- **Backend:** Public read-only endpoint, privacy toggle on user settings.
- **Frontend:** New public profile page (reuses dashboard components in read-only mode).

---

## Advanced Features

### 16. Notification/Reminder System [Advanced]
- **Why:** Nudges users when a previously strong topic is decaying ("your Graphs score hasn't been touched in 20 days").
- **Complexity:** Medium-High (requires a notification delivery mechanism — email or in-app — and scheduled evaluation jobs).
- **Postponable:** Yes — pure retention feature, not core to the analytics value proposition.

### 17. ML-Calibrated Difficulty Weighting [Advanced]
- **Why:** Replaces static difficulty weights with data-driven calibration (e.g., weighting a topic's difficulty by aggregate community success rate rather than the platform's own difficulty label).
- **Complexity:** High — real modeling work, meaningfully postponable.
- **Postponable:** Yes, strongly recommended to postpone — this is a "V3+ if the project is still alive" feature, not something to chase early for its own sake.

### 18. Webhook-Based Near-Real-Time GitHub Sync [Advanced]
- **Why:** Replaces polling with GitHub webhooks for push events, reducing sync latency.
- **Complexity:** High (webhook endpoint security, signature verification, event-driven job triggering).
- **Postponable:** Yes — polling is sufficient for the stated "not real-time" product promise.

---

## Stretch Goals

### 19. Team/Cohort View for Bootcamps or Placement Cells [Stretch]
- Aggregate, anonymized insights for a group. Requires careful design to avoid becoming a de facto leaderboard — likely out of scope permanently unless the product's core principles are revisited.

### 20. Browser Extension for Quick Stats [Stretch]
- A lightweight extension showing the consistency score/streak without opening the full dashboard. Pure convenience, no new backend logic.

### 21. Mobile App [Stretch]
- Full native or React Native client. Meaningful scope jump; only worth considering after the web platform's core scoring and adapter architecture is stable and validated.

---

## MVP Feature Summary (at a glance)

| # | Feature | Version |
|---|---------|---------|
| 1 | Authentication | MVP |
| 2 | GitHub Integration | MVP |
| 3 | LeetCode Integration | MVP |
| 4 | Unified Activity Heatmap | MVP |
| 5 | Consistency Score | MVP |
| 6 | Project Quality Score | MVP |
| 7 | Weak-Area Detection | MVP |
| 8 | Language & Skill Breakdown | MVP |
| 9 | Resume Suggestion Generator (basic) | MVP |
| 10 | Background Sync & Graceful Degradation | MVP |
| 11 | Codeforces Integration | V2 |
| 12 | CodeChef Integration | V2 |
| 13 | Trend Visualizations | V2 |
| 14 | Richer Resume Templates | V2 |
| 15 | Public Shareable Profile | V2 |
| 16 | Notification/Reminder System | Advanced |
| 17 | ML-Calibrated Difficulty Weighting | Advanced |
| 18 | Webhook-Based Sync | Advanced |
| 19 | Team/Cohort View | Stretch |
| 20 | Browser Extension | Stretch |
| 21 | Mobile App | Stretch |

## Related Documents

- Architecture supporting these features: `SYSTEM_ARCHITECTURE.md`, `BACKEND_ARCHITECTURE.md`
- Data model: `DATABASE_DESIGN.md`
- Endpoint contracts: `API_DESIGN.md`
- Build order: `DEVELOPMENT_ROADMAP.md`
