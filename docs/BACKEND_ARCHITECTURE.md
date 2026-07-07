# BACKEND_ARCHITECTURE.md

## Layered Architecture (MVC+, extended)

```
Route → Middleware → Controller → Service → Repository → Model (Mongoose)
                                       │
                                       └──> Adapter (for external API calls)
```

## Routes

Thin Express routers, one file per resource (`auth.routes.js`, `dashboard.routes.js`, etc.), mounted in `app.js`. A route file's only job is: define the HTTP method + path, attach middleware (auth, validation), and point to a controller function. No logic here.

```js
router.get('/dashboard', requireAuth, dashboardController.getDashboard);
```

## Controllers

Parse the request (already validated by middleware), call exactly one service method, shape the response envelope, and call `next(err)` on failure. Controllers never contain business logic and never talk to Mongoose models directly — this boundary is what keeps controllers trivially easy to read and services independently testable.

```js
async function getDashboard(req, res, next) {
  try {
    const data = await dashboardService.build(req.user.id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}
```

## Services

Where business logic lives: scoring algorithms, sync orchestration, resume bullet generation. Services depend on repositories (never on Mongoose models directly) and on adapters (for anything touching an external API). This indirection is what makes services unit-testable with mocked repositories/adapters, and what would let you swap MongoDB for another database by only rewriting the repository layer.

Key services:
- `sync.service.js` — orchestrates the per-user, per-source sync flow described in `SYSTEM_ARCHITECTURE.md`.
- `consistencyScore.service.js` — computes coefficient-of-variation-based score over the 90-day rolling window, streaks, and trend.
- `qualityScore.service.js` — computes per-repo scores and the top-5 aggregate.
- `weakArea.service.js` — computes difficulty-weighted success rate, recency decay, and confidence, and generates the human-readable `reason` string.
- `resumeGenerator.service.js` — maps computed scores to bullet templates.

## Repositories

The *only* place Mongoose queries are written. Each repository exposes intention-revealing methods (`findActivityEventsForUser(userId, sinceDate)`, `upsertScore(userId, scoreDoc)`) rather than leaking query-building details to callers.

```js
// activityEvent.repository.js
async function findRecentForUser(userId, days) {
  const since = subDays(new Date(), days);
  return ActivityEvent.find({ userId, date: { $gte: since } }).lean();
}
```

## Adapters

Each external platform (GitHub, LeetCode, later Codeforces/CodeChef) implements a shared interface:

```js
// adapter.interface.js (contract, not enforced by TS here, but documented and tested)
class SourceAdapter {
  async fetchProfile(credentials) {}
  async fetchActivity(credentials, sinceDate) {}
  async fetchRepos(credentials) {}   // GitHub-only; others return []
}
```

`sync.service.js` never imports `github.client.js` directly — it goes through an `AdapterFactory.get(source)` so adding Codeforces later means writing `adapters/codeforces/` and registering it, with zero changes to `sync.service.js`. This is the concrete implementation of the adapter-layer principle from `SYSTEM_ARCHITECTURE.md` and `FOLDER_STRUCTURE.md`.

Each adapter internally splits into:
- `*.client.js` — raw HTTP calls to the provider, including that provider's specific auth headers and rate-limit handling (e.g., reading GitHub's `X-RateLimit-Remaining` response header and backing off).
- `*.normalizer.js` — transforms the provider's raw response shape into the unified `ActivityEvent`/`Repo` shape used everywhere else in the system.
- `*.adapter.js` — implements the shared interface, composing client + normalizer.

## Middleware

- `auth.middleware.js` (`requireAuth`) — verifies JWT, attaches `req.user`.
- `validate.middleware.js` — takes a Zod schema, validates `req.body`/`req.query`, returns `400` on failure before the controller ever runs.
- `errorHandler.middleware.js` — centralized, last in the middleware chain; maps `AppError` subclasses to status codes, logs unexpected errors via Winston, never leaks stack traces to the client.
- `rateLimiter.middleware.js` — protects sensitive/expensive routes (`/api/sync/trigger`, auth routes) from abuse, separate from the *external* rate-limit handling done inside adapters.

## Utilities

Pure functions with no side effects: date math (rolling window calculation), statistics helpers (coefficient of variation), string formatting for the resume templates. Kept in `utils/` specifically because they're the easiest layer to unit test exhaustively (no mocking needed) — a good place to build the habit of high test coverage.

## Configuration

`config/env.js` validates all required environment variables at startup using Zod, and the app refuses to boot if any are missing/malformed — surfacing configuration errors immediately rather than as a confusing runtime failure three requests later.

## Error Handling

Custom `AppError` base class with subclasses: `ValidationError` (400), `AuthError` (401), `ForbiddenError` (403), `NotFoundError` (404), `ConflictError` (409), `UpstreamError` (502, for external API failures). Services throw these directly; the error middleware maps class → status code + safe message. This is what lets `UpstreamError` (e.g., GitHub is down) be handled distinctly from a genuine internal bug, both in logging severity and in how gracefully the dashboard degrades.

## Validation

Zod schemas per resource in `validators/`, applied via the `validate` middleware before controllers run. Mongoose schema validation acts as a defense-in-depth backstop (see `DATABASE_DESIGN.md`).

## Authentication & Authorization

- **Authentication** (who are you): JWT verification in `auth.middleware.js`.
- **Authorization** (are you allowed to do this): resource-ownership checks inside services/repositories (e.g., `findRepoById(id)` always scopes the query by `userId` — never trust that an ID in the URL belongs to the requester without checking).

## Execution Flow — Request Lifecycle Example (`GET /api/repos/:id`)

```
1. Express router matches GET /api/repos/:id
2. requireAuth middleware verifies JWT → req.user set
3. reposController.getById(req, res, next)
4. reposService.getRepoForUser(req.user.id, req.params.id)
5. reposRepository.findByIdAndUser(id, userId)
   → Mongoose query, scoped by both fields (authorization enforced here)
6. If not found → throws NotFoundError
7. Controller catches nothing itself; NotFoundError propagates to errorHandler
   → errorHandler maps to 404 JSON response
8. If found → controller sends { success: true, data: repo }
```

## Execution Flow — Background Sync Job

```
1. node-cron trigger (scheduled interval)
2. syncJob.run() → syncService.syncDueUsers()
3. For each due user × each active connectedAccount:
     a. AdapterFactory.get(source).fetchActivity(credentials)
     b. normalizer transforms raw → ActivityEvent[]
     c. activityEventRepository.bulkUpsert(events)
     d. scoringOrchestrator.recompute(userId)  // calls the 3 scoring services
     e. syncStatusRepository.markSuccess(userId, source)
   catch per-source (isolated):
     syncStatusRepository.markFailed(userId, source, err.message)
     (loop continues to next source/user — one failure never halts the batch)
```

## Related Documents

- `SYSTEM_ARCHITECTURE.md` — the broader system this layering sits inside
- `FOLDER_STRUCTURE.md` — where each layer physically lives
- `SECURITY.md` — auth/validation details expanded
- `API_DESIGN.md` — the contract controllers expose
