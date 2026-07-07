# DEVELOPMENT_ROADMAP.md

This roadmap is planning only — no implementation. Milestones are sized ~half a day to a full day of focused work (the AI mentor will further subdivide each into 30–90 minute sessions per `AI_MENTOR_INSTRUCTIONS.md`). Complete milestones in order; each assumes the previous ones are done.

---

### Phase 0 — Project Setup

**M0.1 — Repository & Tooling Bootstrap**
- **Goal:** Initialize monorepo structure (`client/`, `server/`, `docs/`), configure ESLint/Prettier, set up `.env.example`, initialize Git.
- **Concepts learned:** Project scaffolding conventions, monorepo layout without tooling like Turborepo/Nx (kept simple deliberately).
- **Files involved:** Root config files, `package.json` in both `client/` and `server/`.
- **Expected output:** Two runnable-but-empty apps (`npm run dev` in each starts without error).
- **Common mistakes:** Committing `node_modules` or `.env`; inconsistent Node versions between client/server.
- **Prerequisites:** Node.js and npm installed.
- **Completion criteria:** Both apps boot; lint passes on an empty codebase; first commit pushed.

**M0.2 — MongoDB Atlas & Environment Config**
- **Goal:** Provision a free-tier MongoDB Atlas cluster; implement `config/env.js` with Zod validation.
- **Concepts learned:** Managed database provisioning, fail-fast configuration validation.
- **Files involved:** `server/src/config/env.js`, `.env`.
- **Expected output:** Server logs a successful DB connection on boot; boots fail loudly if an env var is missing.
- **Common mistakes:** Committing the Atlas connection string; not IP-allow-listing correctly for local dev.
- **Prerequisites:** M0.1.
- **Completion criteria:** `server.js` connects to Atlas and logs confirmation.

---

### Phase 1 — Authentication

**M1.1 — User Model & Registration**
- **Goal:** Implement `User` Mongoose model, `POST /api/auth/register` with bcrypt hashing and Zod validation.
- **Concepts learned:** Password hashing, schema validation, error handling basics.
- **Files involved:** `models/User.js`, `services/auth.service.js`, `controllers/auth.controller.js`, `validators/auth.validator.js`.
- **Expected output:** Can register a user via Postman; password stored hashed, never plaintext.
- **Common mistakes:** Forgetting `unique` index on email; storing plaintext passwords during early testing and forgetting to remove it.
- **Prerequisites:** Phase 0.
- **Completion criteria:** Duplicate email returns 409; valid registration returns 201 with a user object (no password field).

**M1.2 — Login, JWT Issuance, Refresh Flow**
- **Goal:** Implement login, access/refresh token issuance, refresh endpoint, logout.
- **Concepts learned:** JWT structure and verification, httpOnly cookies, token rotation.
- **Files involved:** `auth.service.js`, `auth.middleware.js`, `auth.routes.js`.
- **Expected output:** Login returns access token + sets refresh cookie; `/api/auth/refresh` issues a new access token from the cookie.
- **Common mistakes:** Setting the refresh cookie without `httpOnly`/`secure`/`sameSite`; not rotating refresh tokens.
- **Prerequisites:** M1.1.
- **Completion criteria:** Full auth cycle testable end-to-end via Postman: register → login → authenticated request → refresh → logout.

**M1.3 — Frontend Auth Flow**
- **Goal:** Build Login/Register pages, `AuthContext`, `ProtectedRoute`, API client with interceptor for token attach + silent refresh on 401.
- **Concepts learned:** React Context + `useReducer` for global state, route guarding, axios/fetch interceptor patterns.
- **Files involved:** `client/src/context/AuthContext.jsx`, `client/src/routes/ProtectedRoute.jsx`, `client/src/api/client.js`.
- **Expected output:** Can register/login through the UI and reach a protected (empty) dashboard page; refreshing the browser doesn't force re-login.
- **Common mistakes:** Storing the access token in localStorage instead of memory; not handling the "checking auth" loading state (causing a login-page flash on refresh).
- **Prerequisites:** M1.2.
- **Completion criteria:** Full auth UX works without page-reload logout.

---

### Phase 2 — GitHub Adapter & Sync Foundation

**M2.1 — Adapter Interface & GitHub OAuth**
- **Goal:** Define `adapter.interface.js`; implement GitHub OAuth connect/callback; store encrypted tokens.
- **Concepts learned:** OAuth 2.0 flow, adapter pattern, encryption at rest.
- **Files involved:** `adapters/adapter.interface.js`, `adapters/github/*`, `accounts.routes.js`.
- **Expected output:** User can click "Connect GitHub," authorize, and see a `connectedAccounts` document created with an encrypted token.
- **Common mistakes:** Storing the OAuth `state` param insecurely (CSRF risk in the OAuth flow itself); forgetting to encrypt the token before storing.
- **Prerequisites:** Phase 1.
- **Completion criteria:** `connectedAccounts` collection has a real row after a manual OAuth test.

**M2.2 — GitHub Data Fetch & Normalization**
- **Goal:** Implement `github.client.js` (repos + commits fetch, rate-limit-aware) and `github.normalizer.js` (raw → `ActivityEvent`/`Repo`).
- **Concepts learned:** REST API pagination, rate-limit header handling, data normalization design.
- **Files involved:** `adapters/github/github.client.js`, `github.normalizer.js`.
- **Expected output:** Given a token, can fetch and normalize a real GitHub account's repos/commits into the unified shape (tested via a script, not yet wired to a job).
- **Common mistakes:** Not handling pagination (silently missing repos beyond page 1); not respecting `X-RateLimit-Remaining`.
- **Prerequisites:** M2.1.
- **Completion criteria:** Normalized output matches the `ActivityEvent`/`Repo` schemas in `DATABASE_DESIGN.md`.

**M2.3 — Background Job Scheduler & Sync Orchestration**
- **Goal:** Implement `node-cron` scheduler, `sync.service.js` orchestrating fetch → normalize → upsert → mark status, with per-source failure isolation.
- **Concepts learned:** Job scheduling, idempotent upserts, fault isolation.
- **Files involved:** `jobs/syncJob.js`, `services/sync.service.js`, `repositories/*`.
- **Expected output:** A scheduled job successfully syncs a connected GitHub account end-to-end into MongoDB.
- **Common mistakes:** Non-idempotent writes (duplicate events on repeated syncs — must upsert on a natural key, not insert blindly); one failing user/source crashing the whole batch job.
- **Prerequisites:** M2.2.
- **Completion criteria:** Running the job twice in a row does not duplicate data; killing one adapter mid-batch (simulate an error) doesn't stop other users/sources from syncing.

---

### Phase 3 — Scoring Engine

**M3.1 — Consistency Score**
- **Goal:** Implement the 90-day rolling-window coefficient-of-variation score, streaks, and trend.
- **Concepts learned:** Basic statistics (mean, standard deviation, coefficient of variation) applied to a real product problem.
- **Files involved:** `services/consistencyScore.service.js`, `utils/stats.js`.
- **Expected output:** Given known synthetic activity data (a "burst" pattern vs. a "steady" pattern with equal totals), the score correctly differentiates them — this is the project's own stated success criterion.
- **Common mistakes:** Off-by-one errors in the rolling window; not handling days with zero activity correctly in the CoV calculation.
- **Prerequisites:** Phase 2 (needs real activity data, or seeded test data).
- **Completion criteria:** Unit tests pass against hand-constructed "burst" and "steady" fixtures with clearly different expected scores.

**M3.2 — Project Quality Score**
- **Goal:** Implement per-repo scoring (README, CI, tests, recency, contributors) and top-5 aggregate.
- **Concepts learned:** Weighted scoring design, GitHub API calls for supplementary repo signals (checking for `.github/workflows`, a test directory).
- **Files involved:** `services/qualityScore.service.js`.
- **Expected output:** A well-maintained repo scores visibly higher than an empty/abandoned one (stated success criterion).
- **Common mistakes:** Averaging across *all* repos instead of top 5 (unfairly penalizing old practice repos, explicitly called out in the problem statement).
- **Prerequisites:** M2.2.
- **Completion criteria:** Manual test against two real repos (one well-maintained, one abandoned) produces clearly differentiated scores with a visible breakdown.

**M3.3 — Weak-Area Detection**
- **Goal:** Implement difficulty-weighted success rate, recency decay, confidence thresholds, and the reasoning-string generator, for LeetCode data.
- **Concepts learned:** Combining multiple signals into one ranked, explainable output — a genuinely hard scoring-design problem.
- **Files involved:** `services/weakArea.service.js`.
- **Expected output:** Given seeded LeetCode-shaped data, produces a ranked topic list matching the example in `PROJECT_OVERVIEW.md`/`DATABASE_DESIGN.md`.
- **Common mistakes:** Treating a topic with 3 attempts the same as one with 50 (confidence-weighting is the whole point); recency decay too aggressive or not aggressive enough (worth tuning deliberately, not guessing once and moving on).
- **Prerequisites:** LeetCode adapter (Phase 4, can be interleaved — see note below).
- **Completion criteria:** Reasoning strings read naturally and match the transparency bar set in the problem statement.

> Note: M3.3 technically depends on LeetCode data existing (Phase 4). You can build M3.3's logic against seeded/mock data first, then wire it to real LeetCode data once Phase 4 is done — this is a deliberate, reasonable reordering to discuss with your mentor if you reach this point.

---

### Phase 4 — LeetCode Adapter

**M4.1 — LeetCode Client & Normalizer**
- **Goal:** Implement `leetcode.client.js` against the unofficial GraphQL endpoint, with defensive parsing.
- **Concepts learned:** Working with undocumented/unofficial APIs, defensive coding against schema drift.
- **Files involved:** `adapters/leetcode/*`.
- **Expected output:** Given a username, fetch and normalize submission history into `ActivityEvent` shape.
- **Common mistakes:** Assuming the response shape is stable; not handling a completely-changed schema gracefully (should mark sync `failed` with a clear message, never crash the job).
- **Prerequisites:** Phase 2 patterns (reuse the adapter interface).
- **Completion criteria:** Real LeetCode username produces normalized data matching the `ActivityEvent` schema.

**M4.2 — Wire LeetCode into Sync Job & Weak-Area Detection**
- **Goal:** Register the LeetCode adapter in the factory; connect M3.3's logic to real data.
- **Concepts learned:** Validating the adapter-pattern payoff (adding a second source with minimal changes elsewhere).
- **Prerequisites:** M4.1, M3.3.
- **Completion criteria:** End-to-end: connect LeetCode username → sync runs → weak areas populate on the dashboard with real reasoning strings.

---

### Phase 5 — Dashboard Frontend

**M5.1 — Dashboard Layout & Sync Status**
- **Goal:** Build `PageLayout`, `Sidebar`, `Navbar`, `SyncStatusBanner`, wire `GET /api/dashboard`.
- **Concepts learned:** React Query setup, layout composition, empty/loading states.
- **Files involved:** `features/dashboard/*`, `components/layout/*`.
- **Expected output:** Authenticated user sees a real dashboard shell with live sync status.
- **Common mistakes:** Fetching in `useEffect`+`useState` instead of React Query (breaks the architecture's intended caching model).
- **Prerequisites:** Phase 1 frontend, Phase 2/3 backend data available.
- **Completion criteria:** Dashboard loads real consistency score/streak from the API.

**M5.2 — Activity Heatmap Component**
- **Goal:** Build the reusable `ActivityHeatmap` component consuming `GET /api/dashboard/heatmap`.
- **Concepts learned:** Data-driven presentational component design, date-grid rendering.
- **Expected output:** Visual heatmap matching real synced activity.
- **Common mistakes:** Timezone bugs in date bucketing (a very common real-world date-handling mistake, worth hitting and fixing here).
- **Prerequisites:** M5.1.
- **Completion criteria:** Heatmap visually differentiates active/inactive days correctly across a timezone boundary test case.

**M5.3 — Repos, Weak Areas, Resume Suggestions Pages**
- **Goal:** Build the remaining three feature pages following the same container/presentational pattern.
- **Concepts learned:** Repeating an established architectural pattern across features (reinforcement, not new concepts) — a deliberately "easier" milestone by design, to consolidate learning.
- **Prerequisites:** M5.1, Phase 3 (backend scores), Phase 4.
- **Completion criteria:** All four core dashboard views are functional end-to-end.

---

### Phase 6 — Polish, Hardening, Deployment

**M6.1 — Design System Pass**
- **Goal:** Apply `FRONTEND_DESIGN_SYSTEM.md` consistently (shadcn/ui installation, color/spacing audit, empty/loading states everywhere).
- **Prerequisites:** Phase 5.
- **Completion criteria:** App visually matches the design system document across all pages.

**M6.2 — Testing Pass**
- **Goal:** Unit tests for scoring services, integration tests for core routes (see `TESTING.md`).
- **Prerequisites:** All prior phases.
- **Completion criteria:** Test suite green; scoring edge cases (burst vs. steady, insufficient data) covered.

**M6.3 — Deployment**
- **Goal:** Deploy per `DEPLOYMENT.md` (frontend → Vercel, backend → Render, DB → Atlas), verify the full production flow.
- **Prerequisites:** M6.2.
- **Completion criteria:** A real GitHub account can be connected and produce a working dashboard on the production URL.

---

## Related Documents

- `LEARNING_MAP.md` — every concept introduced across these milestones
- `TESTING.md` — detail behind M6.2
- `DEPLOYMENT.md` — detail behind M6.3
