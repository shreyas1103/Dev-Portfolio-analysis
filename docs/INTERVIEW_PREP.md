# INTERVIEW_PREP.md

Interview-style treatment of the project's major concepts. Use this once you've actually implemented the corresponding milestone — reading answers before building them defeats the learning purpose (see `AI_MENTOR_INSTRUCTIONS.md`).

---

## 1. Authentication (JWT + Refresh Tokens)

**Interview Questions:**
- Why use JWTs instead of server-side sessions?
- Why have both an access token and a refresh token instead of one long-lived token?
- Where should each token be stored on the client, and why?

**Follow-up Questions:**
- What happens if a refresh token is stolen? How does rotation limit the damage?
- How would you implement token revocation (e.g., "log out all devices") in a stateless JWT system?

**Expected Answers (in your own words once you've built it):** Stateless JWTs avoid a session store, aiding horizontal scaling; short-lived access tokens limit the exposure window if leaked; refresh tokens, kept in httpOnly cookies, allow re-issuing access tokens without re-entering credentials while remaining inaccessible to XSS. Revocation requires either a token blocklist (reintroducing some state) or short access-token lifetimes plus refresh-token rotation with server-side tracking of the latest valid refresh token per session.

**Common Mistakes:** Storing tokens in localStorage; using one long-lived token for everything; not rotating refresh tokens.

**Senior-Level Discussion Points:** The stateless/stateful trade-off is not free — full statelessness sacrifices easy revocation. Discuss when you'd introduce a token blocklist (Redis-backed) versus accepting the revocation latency of short-lived access tokens.

---

## 2. Adapter Pattern for External Integrations

**Interview Questions:**
- How would you design an integration layer for 4 different external APIs with different auth models and data shapes?
- Why not just call each API directly from wherever the data is needed?

**Follow-up Questions:**
- How does this pattern change your testing strategy?
- What happens when a 5th platform needs to be added?

**Expected Answers:** A shared adapter interface (e.g., `fetchActivity`, `fetchRepos`) decouples business logic (scoring, sync orchestration) from provider-specific details. This lets you swap, mock, or add providers without touching consumers of the adapter — directly testable by mocking the interface rather than hitting real APIs in tests.

**Common Mistakes:** Leaking provider-specific shapes into business logic; not having a normalization step, so scoring logic ends up littered with `if (source === 'github')` branches.

**Senior-Level Discussion Points:** Discuss the cost of the abstraction — an adapter layer adds indirection that isn't "free"; justify it here specifically because there are genuinely 4+ heterogeneous providers, not because "abstraction is always good."

---

## 3. Background Jobs & Fault Isolation

**Interview Questions:**
- Why not fetch GitHub/LeetCode data live on every dashboard request?
- How do you make sure one failing sync doesn't break syncing for other users?

**Follow-up Questions:**
- How would this evolve if you had 100,000 users and node-cron polling every user every 6 hours became infeasible?
- What's the difference between at-least-once and exactly-once processing, and which does this system need?

**Expected Answers:** Live external calls on the request path make dashboard latency and uptime dependent on 4 external services you don't control — unacceptable for a read-heavy product. Background jobs decouple ingestion from reads; per-source try/catch with independent status tracking ensures isolated failure. At scale, node-cron's single-process polling model needs to become a distributed queue (BullMQ/Redis) with worker processes and backoff/retry — discussed in `SCALABILITY.md`. This system needs at-least-once processing with idempotent upserts (natural-key based), since exactly-once delivery is essentially unachievable with external HTTP APIs.

**Common Mistakes:** Conflating "async" with "fault isolated" — a background job can still take down the whole batch on one bad iteration without explicit per-item try/catch.

**Senior-Level Discussion Points:** Trade-offs between polling and webhook/event-driven sync (GitHub supports webhooks; LeetCode does not) — discuss why the system can't be uniformly event-driven given real provider constraints.

---

## 4. Scoring Design (Consistency Score, Weak-Area Detection)

**Interview Questions:**
- How do you design a metric that must be both statistically meaningful and explainable to a non-technical end user?
- Why coefficient of variation instead of just a raw activity count or standard deviation alone?

**Follow-up Questions:**
- How would you validate that your scoring formula actually reflects "good" behavior, absent ground truth labels?
- How do you avoid a topic with 2 data points being confidently labeled "weak"?

**Expected Answers:** CoV normalizes variability by the mean, so it's comparable across users with different total activity levels — a raw standard deviation would unfairly penalize high-activity users for having any variance at all. Validation without ground truth relies on constructing known synthetic cases (a "burst" pattern vs. a "steady" pattern with equal totals) and checking the metric differentiates them as expected — exactly the M3.1 completion criterion. Confidence thresholds (minimum attempt counts) prevent overconfident labeling from sparse data.

**Common Mistakes:** Building a black-box score with no visible breakdown (this project's explicit anti-pattern); ignoring sample size when computing "success rate" per topic.

**Senior-Level Discussion Points:** Discuss the ethical/product responsibility of scoring humans on subjective-feeling metrics — why the product explicitly states "not a measurement of skill" and always shows the reasoning behind a number.

---

## 5. Data Modeling: Unified Cross-Platform Events

**Interview Questions:**
- How do you model fundamentally different event types (a Git commit vs. a solved problem) in one collection?
- When do you denormalize vs. normalize in a document database?

**Follow-up Questions:**
- What indexes would you add as this collection grows to hundreds of millions of documents?
- How would you archive old data without breaking the 90-day rolling-window queries?

**Expected Answers:** A shared envelope (`userId`, `source`, `type`, `date`) with a flexible `metadata` field lets one collection serve queries that need to treat events comparably (the heatmap) while preserving fields needed for source-specific logic (weak-area detection filtering on `topic`/`difficulty`). Denormalize (precompute) frequently-read, expensive-to-compute data (scores); normalize (separate collections) high-volume raw data that would bloat a parent document. At scale, a compound index on `{userId, date}` is essential; older-than-N-days data can be moved to a cold `activityEventsArchive` collection or a time-series-optimized store, as long as the rolling-window queries only ever need recent data (true here, since the score only looks at 90 days).

**Common Mistakes:** Embedding unbounded arrays of events directly in the `users` document (hits MongoDB document size practicality issues); over-normalizing to the point where the heatmap query requires 4 separate collection queries merged in application code.

**Senior-Level Discussion Points:** When would you actually reach for PostgreSQL/a relational model instead, given this data has fairly simple relationships? Be honest that MongoDB was chosen partly for the project's stated learning goals, not because it's objectively superior here — a mature answer acknowledges the trade-off rather than overselling the choice.

---

## 6. Security Design (Cookies, CORS, Rate Limiting)

**Interview Questions:**
- Why store the refresh token in an httpOnly cookie instead of localStorage?
- Walk through how CSRF is mitigated in this system given a cookie-based refresh token exists.

**Follow-up Questions:**
- What's the difference between authentication and authorization, and give an example from this project where a bug could conflate them?
- How do you prevent NoSQL injection given MongoDB's flexible query operators?

**Expected Answers:** httpOnly cookies are inaccessible to JavaScript, directly closing the XSS-token-theft vector that localStorage leaves open. CSRF is mitigated primarily via `sameSite` cookie attributes, which prevent the cookie from being attached to cross-origin requests. Authentication confirms identity (`requireAuth` verifying a JWT); authorization confirms permission over a specific resource — a bug here would be fetching `GET /api/repos/:id` without checking the repo's `userId` matches the requester, allowing any authenticated user to read any other user's repo by guessing IDs. NoSQL injection is prevented by validating input types with Zod before it ever reaches a Mongoose query, so operator-injection payloads (`{ "$ne": null }`) can't pass as a validated string.

**Common Mistakes:** Assuming authentication alone is sufficient (forgetting per-resource authorization checks); treating client-side validation as a security control.

**Senior-Level Discussion Points:** Discuss defense-in-depth — no single control here is sufficient alone; the security posture comes from several independent layers (validation, encryption, cookie attributes, rate limiting) each closing a different specific gap.

---

## Related Documents

- `LEARNING_MAP.md` — concept list this document expands on
- `SECURITY.md`, `BACKEND_ARCHITECTURE.md`, `DATABASE_DESIGN.md` — implementation detail behind these answers
