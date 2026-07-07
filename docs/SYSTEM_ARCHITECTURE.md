# SYSTEM_ARCHITECTURE.md

## High-Level Architecture

```
                        ┌─────────────────────────────┐
                        │        Client (React)        │
                        │  Dashboard / Auth / Charts    │
                        └───────────────┬──────────────┘
                                        │ HTTPS (REST, JWT)
                                        ▼
                        ┌─────────────────────────────┐
                        │     Server (Node/Express)    │
                        │  Routes → Controllers →      │
                        │  Services → Repositories     │
                        └───┬───────────────────────┬──┘
                            │                       │
                  ┌─────────▼────────┐    ┌─────────▼─────────┐
                  │     MongoDB       │    │   Background Jobs  │
                  │  (Users, Repos,   │    │  (node-cron)        │
                  │  Activity, Scores)│    │  Sync scheduler     │
                  └───────────────────┘    └─────────┬──────────┘
                                                      │
                                     ┌────────────────┼────────────────┐
                                     ▼                ▼                ▼
                              ┌────────────┐   ┌────────────┐   ┌────────────┐
                              │ GitHub API │   │ LeetCode   │   │ Codeforces │
                              │ (official) │   │ (unofficial│   │ (official, │
                              │            │   │ GraphQL)   │   │ V2)        │
                              └────────────┘   └────────────┘   └────────────┘
```

## Components

### Client
React SPA responsible for: authentication UI, dashboard rendering, chart/heatmap display, triggering manual "connect account" flows. It never talks to external platform APIs (GitHub/LeetCode) directly — everything is mediated by the server, which owns tokens, rate-limit budgets, and caching. This keeps API secrets off the client and keeps the adapter logic centralized and testable.

### Server
Express app organized as Routes → Controllers → Services → Repositories (full detail in `BACKEND_ARCHITECTURE.md`). Responsibilities:
- Auth (issue/verify JWTs)
- Expose REST endpoints for dashboard data (always reading from MongoDB, never live-calling external APIs on the request path)
- Own the background job scheduler that performs external syncs
- Own all scoring/analysis logic (consistency score, quality score, weak-area detection, resume generation)

### Database (MongoDB)
Stores: users, connected-account credentials/tokens (encrypted), raw normalized activity events, per-repo metadata, computed scores, and sync-status metadata. See `DATABASE_DESIGN.md` for full schema.

### External Services
GitHub REST/GraphQL API, LeetCode's unofficial GraphQL endpoint, and (V2) Codeforces/CodeChef official APIs. Each is wrapped in its own **adapter** module implementing a shared interface (`fetchProfile()`, `fetchActivity()`, `fetchRepos()` etc.) so the rest of the system never depends on a specific provider's data shape — only on the normalized internal model.

## Request Flow (typical dashboard read)

```
Client GET /api/dashboard
   → Auth middleware verifies JWT
   → DashboardController.getDashboard()
   → DashboardService.build(userId)
        → reads cached scores/activity from MongoDB (never calls GitHub/LeetCode live)
        → attaches lastSyncedAt per source
   → Response sent to client
```

This is deliberate: dashboard reads must be fast and must never fail because an external API is slow or down. All external calls happen out-of-band in background jobs.

## Response Flow

```
Service returns a plain JS object
   → Controller wraps it in a consistent envelope: { success, data, meta }
   → Express sends JSON with correct status code
   → Client's React Query cache stores it, renders components
```

## Authentication Flow

```
POST /api/auth/register or /login
   → Controller validates input (Zod)
   → Service checks/creates user, hashes/compares password (bcrypt)
   → Server issues access token (short-lived, ~15 min) + refresh token (long-lived, ~7 days, httpOnly cookie)
   → Client stores access token in memory (not localStorage — see SECURITY.md)
   → Subsequent requests: Authorization: Bearer <accessToken>
   → On 401, client calls /api/auth/refresh using the httpOnly cookie to get a new access token
```

## Error Flow

```
Any layer throws (or calls next(err))
   → Centralized errorHandler middleware catches it
   → Known errors (AppError subclasses: ValidationError, NotFoundError, AuthError) map to correct status codes + safe messages
   → Unknown errors → logged via Winston with full stack trace, client receives generic 500 message (never a raw stack trace)
```

## Data Flow (external sync — the core architectural pattern of this project)

```
node-cron scheduler (e.g., every 6 hours per user, staggered)
   → SyncJob picks users due for sync
   → For each connected source:
        AdapterFactory.get(source).fetchActivity(credentials)
           → handles that provider's auth model + rate limits
           → returns raw provider-shaped data
        → Normalizer transforms raw data into unified ActivityEvent documents
        → Repository upserts events into MongoDB
        → ScoringService recomputes affected scores (consistency, quality, weak-area)
        → SyncStatus updated: { source, status: 'success'|'partial'|'failed', lastSyncedAt, error? }
   → If a source fails (rate limit, API down, schema change):
        → job logs the failure, marks that source's SyncStatus as 'failed' with a reason
        → other sources continue independently (failure isolation — one bad adapter never blocks others)
        → dashboard reads continue serving last-known-good cached data for that source
```

This flow is the single most important architectural idea in the project: **reads are always cheap and cached; writes/syncs are always background, isolated per source, and fault-tolerant.**

## Related Documents

- `BACKEND_ARCHITECTURE.md` — internal server layering in detail
- `DATABASE_DESIGN.md` — schema backing this flow
- `SECURITY.md` — token handling detail
- `SCALABILITY.md` — how this architecture evolves under load
