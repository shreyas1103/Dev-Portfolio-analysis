# FOLDER_STRUCTURE.md

This is the MVP folder structure. It's designed to scale into V2 (Codeforces/CodeChef adapters, public profiles) without restructuring — new adapters and features slot into existing folders.

```
dev-portfolio-analytics/
├── client/                          # React frontend (Vite)
│   ├── public/
│   ├── src/
│   │   ├── api/                     # Thin wrappers around fetch/axios calls to backend
│   │   ├── assets/                  # Static images, icons
│   │   ├── components/              # Reusable, presentation-only components
│   │   │   ├── ui/                  # shadcn/ui primitives (button, card, dialog, etc.)
│   │   │   ├── charts/              # Heatmap, trend line, skill breakdown chart wrappers
│   │   │   └── layout/              # Navbar, Sidebar, PageLayout
│   │   ├── features/                # Feature-scoped modules (see below)
│   │   │   ├── auth/
│   │   │   ├── dashboard/
│   │   │   ├── github/
│   │   │   ├── leetcode/
│   │   │   ├── resume/
│   │   │   └── settings/
│   │   ├── context/                 # AuthContext, etc.
│   │   ├── hooks/                   # Reusable hooks (useAuth, useSyncStatus)
│   │   ├── lib/                     # Query client setup, utils, constants
│   │   ├── pages/                   # Route-level components composing features
│   │   ├── routes/                  # Route definitions, ProtectedRoute wrapper
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   └── package.json
│
├── server/                          # Express backend
│   ├── src/
│   │   ├── adapters/                # One folder per external platform
│   │   │   ├── github/
│   │   │   │   ├── github.client.js       # Raw API calls
│   │   │   │   ├── github.normalizer.js   # Raw → unified ActivityEvent shape
│   │   │   │   └── github.adapter.js      # Implements shared adapter interface
│   │   │   ├── leetcode/
│   │   │   │   ├── leetcode.client.js
│   │   │   │   ├── leetcode.normalizer.js
│   │   │   │   └── leetcode.adapter.js
│   │   │   └── adapter.interface.js       # Shared contract all adapters implement
│   │   ├── config/                  # env validation, db connection, constants
│   │   ├── controllers/             # Thin: parse req, call service, shape res
│   │   ├── services/                # Business logic (scoring, sync orchestration, resume gen)
│   │   │   ├── consistencyScore.service.js
│   │   │   ├── qualityScore.service.js
│   │   │   ├── weakArea.service.js
│   │   │   ├── resumeGenerator.service.js
│   │   │   └── sync.service.js
│   │   ├── repositories/            # DB access layer (Mongoose queries live here only)
│   │   ├── models/                  # Mongoose schemas
│   │   ├── middleware/              # auth, errorHandler, rateLimiter, validate
│   │   ├── routes/                  # Express routers, one per resource
│   │   ├── jobs/                    # node-cron job definitions, job runner
│   │   ├── utils/                   # Pure helper functions (date math, formatting)
│   │   ├── validators/              # Zod schemas per resource
│   │   ├── errors/                  # AppError and subclasses
│   │   ├── app.js                   # Express app assembly (middleware, routes)
│   │   └── server.js                # Entry point (starts HTTP server + job scheduler)
│   ├── tests/
│   │   ├── unit/
│   │   └── integration/
│   └── package.json
│
├── docs/                            # All markdown documentation (this file's home)
├── .env.example
├── .gitignore
└── README.md
```

## Why This Structure

### `client/src/features/`
Feature-based organization (not just `pages/` + `components/`) groups everything related to one concern (e.g., `github/`) together: its API calls, its components, its hooks. This scales far better than a flat `components/` folder once the app has 5+ distinct feature areas — you won't hunt across three folders to change one feature.

### `client/src/components/ui/`
Kept separate from `features/` because these are **pure, feature-agnostic** presentational components (shadcn/ui primitives). Nothing in `ui/` should ever import from `features/`.

### `server/src/adapters/`
This is the most important folder in the whole project, architecturally. Each external platform gets an isolated adapter with three responsibilities split into three files: raw client calls, normalization, and the adapter interface implementation. This isolation is *exactly* why adding Codeforces in V2 should require **zero changes** to services, controllers, or the scoring engine — only a new `adapters/codeforces/` folder plus one line registering it in the adapter factory.

### `server/src/services/` vs `server/src/repositories/`
Services contain business logic and orchestration (e.g., "recompute this user's consistency score"). Repositories contain *only* database queries. This separation means: (1) services are unit-testable without a real database (mock the repository), and (2) if MongoDB were ever swapped for PostgreSQL, only the repository layer would need to change.

### `server/src/jobs/`
Isolated from `services/` because jobs are about *scheduling and orchestration* (when/how often to run), while services contain the *logic* being scheduled. A job file typically just calls `syncService.syncUser(userId)` on a cron schedule.

### `tests/unit/` vs `tests/integration/`
Unit tests target services/utils in isolation (mocked dependencies); integration tests hit real routes with Supertest against a test database. Kept separate so you can run the fast unit suite constantly and the slower integration suite less frequently.

## Future Scalability Considerations

- **Adding Codeforces/CodeChef (V2):** new folder under `adapters/`, new entry in the adapter factory/registry — no existing code touched.
- **Introducing Redis/BullMQ (Advanced):** `jobs/` folder gains a `queues/` subfolder; `sync.service.js` logic is largely unchanged, only *how* jobs are dispatched changes.
- **Splitting into microservices (far future, not currently justified):** the adapters + services separation means the "sync engine" could theoretically be extracted into its own service later without a full rewrite — but this is explicitly not a current need (see `SCALABILITY.md`).
- **Monorepo tooling:** if `client/` and `server/` grow shared types (e.g., shared Zod schemas), consider a `shared/` package — postponed until duplication actually becomes painful.

## Related Documents

- `BACKEND_ARCHITECTURE.md` — what happens inside `services/`, `controllers/`, `middleware/`
- `FRONTEND_ARCHITECTURE.md` — what happens inside `features/`, `pages/`, `routes/`
