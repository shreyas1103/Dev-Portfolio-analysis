# TECH_STACK.md

Every technology below is explained, not just listed: why we chose it, alternatives considered, pros, cons, and why it fits *this specific project*.

---

## Frontend

### React (with Vite)
- **Why chosen:** You already know React; the goal is depth (architecture, state, routing) not a new framework. Vite gives fast dev server/HMR without the complexity of a custom Webpack config.
- **Alternatives:** Next.js (adds SSR/routing conventions you don't need yet and would obscure the *manual* routing/architecture learning this project wants); Create React App (deprecated, slower).
- **Pros:** Fast iteration, huge ecosystem, matches your existing skill.
- **Cons:** No built-in SSR/SEO — irrelevant here since this is an authenticated dashboard app, not a content site.
- **Fit:** Learning goal is frontend *architecture*, not a meta-framework; Vite+React keeps that goal unobstructed.

### React Router
- **Why:** Standard client-side routing solution for React SPAs; you'll design protected routes yourself (learning value) rather than relying on framework file-based routing.
- **Alternatives:** TanStack Router (newer, more powerful, but adds a learning curve not central to this project's goals).
- **Pros:** Mature, well-documented, direct control over route guards.
- **Cons:** More manual wiring than file-based routers — this is a pro for learning, a con for speed.

### State Management: React Context + `useReducer` (MVP), optionally Zustand later
- **Why:** For MVP scope (auth state, dashboard data), Context/useReducer is sufficient and teaches you the underlying patterns state libraries abstract away.
- **Alternatives:** Redux Toolkit (too heavy for this app's actual state complexity); Zustand (lighter, good V2 upgrade once you understand *why* you'd want it).
- **Pros:** Zero dependencies, forces you to understand state flow.
- **Cons:** Can get verbose if state complexity grows — flagged as a deliberate future revisit point, not premature-optimized away.
- **Postponable:** Introducing Zustand/Redux is explicitly postponable until Context becomes genuinely painful — this is a "why we need it now" test case for the whole project's philosophy.

### Data Fetching: TanStack Query (React Query)
- **Why:** This app is fundamentally about displaying server-derived, periodically-refreshed data (sync status, scores) — React Query's caching, background refetch, and stale-data handling map directly onto the "cache-first, graceful degradation" product requirement.
- **Alternatives:** Plain `fetch` + `useEffect` (viable but you'd hand-roll caching/retry logic that React Query already solves well and that isn't the core learning objective here).
- **Pros:** Built-in caching, retry, stale-while-revalidate — directly useful for the sync-status UI.
- **Cons:** Another concept to learn; justified because it directly serves a named product requirement (graceful degradation).

### UI Component Library: shadcn/ui (Radix + Tailwind)
- **Why:** You explicitly do not want to spend time on visual design decisions. shadcn/ui gives accessible, unstyled-but-pre-composed components you own the code for (copied into your repo, not an opaque dependency) — letting you focus on architecture while still producing a polished, modern SaaS look.
- **Alternatives:** Chakra UI (good, but more "batteries-included" styling abstraction, less transferable to plain CSS/Tailwind understanding); Material UI (strong but has a distinct "Google Material" visual identity that doesn't match modern SaaS/FinTech aesthetics you're targeting); Mantine (solid alternative, slightly less dominant in current SaaS design patterns).
- **Pros:** Full control over component code, Tailwind-based (transferable skill), matches modern SaaS visual language out of the box.
- **Cons:** Requires Tailwind familiarity; components are copied in, so updates are manual (acceptable trade-off for full ownership).
- **Full justification and wireframes:** see `FRONTEND_DESIGN_SYSTEM.md`.

### Charting: Recharts
- **Why:** Needed for the heatmap, trend lines, and language/skill breakdown charts; Recharts is React-idiomatic and well-documented.
- **Alternatives:** Chart.js (canvas-based, less React-idiomatic), D3 directly (far more power, far more complexity — not needed for this app's chart types).
- **Pros:** Declarative, composable, good enough for all planned visualizations.
- **Cons:** Less flexible than raw D3 for highly custom visuals — acceptable, since the heatmap can be built as a custom SVG/CSS grid component instead of forcing it through a charting library.

---

## Backend

### Node.js + Express.js
- **Why:** You already know these; the learning target is *architecture* (layered backend, middleware, services) rather than a new runtime/framework.
- **Alternatives:** NestJS (excellent architecture guardrails, but imposes its own opinionated structure — valuable later, but this project wants you to *design* the architecture yourself first, which is more educational).
- **Pros:** Minimal, flexible, huge ecosystem, matches existing skill.
- **Cons:** No built-in structure — meaning bad architecture is possible; this project's `BACKEND_ARCHITECTURE.md` exists specifically to supply that structure deliberately.

### Job Scheduling: `node-cron` (MVP) + BullMQ (once Redis is introduced, V2/Advanced)
- **Why:** Background sync jobs are core to the product (#10 in FEATURES.md). `node-cron` is enough for MVP's polling-based sync; BullMQ (Redis-backed queue) is the correct upgrade once real job retry/backoff/concurrency control is needed.
- **Alternatives:** Agenda (MongoDB-backed queue) — reasonable alternative that avoids introducing Redis early; worth considering if you want to delay Redis specifically.
- **Pros of node-cron first:** Zero new infrastructure for MVP.
- **Cons:** No retry/backoff/persistence — acceptable for MVP, explicitly revisited in `SCALABILITY.md`.
- **Why we need it now:** the "graceful degradation" success criterion requires periodic background sync, not per-request live calls to GitHub/LeetCode.
- **Could be postponed:** BullMQ/Redis specifically — yes, until node-cron's limitations are actually felt.

### Authentication: JWT (access + refresh tokens), bcrypt for password hashing
- **Why:** Industry-standard stateless auth pattern; teaches token lifecycle management explicitly (see `SECURITY.md`).
- **Alternatives:** Session-based auth with server-side store (simpler mental model, but doesn't teach the JWT patterns most Node.js job postings assume knowledge of).
- **Pros:** Stateless, scalable, widely expected knowledge in interviews.
- **Cons:** Requires careful handling (secure storage, refresh rotation, revocation strategy) — this complexity is the point, not a flaw.

---

## Database

### MongoDB (with Mongoose ODM)
- **Why:** You already know MongoDB; this project's data (heterogeneous per-platform activity, flexible per-repo metadata) fits a document model naturally better than rigid relational tables, especially since the shape of "activity" differs meaningfully per source.
- **Alternatives:** PostgreSQL (would work, and is arguably *better* for the "relationships between users/platforms/scores" part of this data — noted honestly in `DATABASE_DESIGN.md`'s normalization discussion) — not chosen because deepening MongoDB is this project's explicit backend learning goal, not switching stacks.
- **Pros:** Schema flexibility for heterogeneous per-platform payloads, matches your existing skill, easy to model activity documents.
- **Cons:** Weaker for highly relational queries (acceptable — this app's core relations are simple: user → connected accounts → activity/scores).
- **Fit:** Directly matches the "MERN" stack goal and the project's actual data shape.

---

## Storage

### None required for MVP (no user-uploaded files)
- **Why:** All data is ingested from external APIs; there's no file upload feature in MVP.
- **V2 consideration:** If a public profile page (feature #15) later supports custom avatars/branding, introduce Cloudinary or AWS S3 at that point — explicitly postponed since there's no current need.

---

## Validation

### Zod (backend) + React Hook Form + Zod (frontend)
- **Why:** Shared schema validation logic between client and server reduces duplication and teaches you a pattern (schema-first validation) used heavily in production Node.js apps.
- **Alternatives:** Joi (mature, backend-only, no first-class TypeScript/shared-schema story); express-validator (fine, but less reusable across frontend/backend).
- **Pros:** Type inference, shared schemas, clear error messages.
- **Cons:** One more library to learn — justified by directly supporting the security requirement of strict input validation (`SECURITY.md`).

---

## Logging

### Winston (backend)
- **Why:** Structured, leveled logging is a core production practice; this project explicitly wants you to build production habits, not `console.log` debugging.
- **Alternatives:** Pino (faster, more modern, JSON-first) — a very reasonable alternative; Winston chosen here for its more beginner-friendly configuration and transport model while still being a real production tool.
- **Pros:** Log levels, transports (console + file), structured JSON output ready for future log aggregation.
- **Cons:** Slightly slower than Pino at extreme scale — irrelevant at this project's scale.

---

## Environment Variables

### `dotenv` + `.env` files, validated at startup (with Zod)
- **Why:** Standard Node.js pattern; validating env vars at startup (rather than discovering a missing var at runtime, mid-request) is a production habit worth building early.
- **Pros:** Fails fast with a clear error instead of silent `undefined` bugs.
- **Cons:** None significant.

---

## Version Control

### Git + GitHub, trunk-based with short-lived feature branches
- **Why:** Standard practice; also literally the platform this product itself ingests data from, giving you a meta-relevant reason to keep a clean, well-organized commit history and repo structure (your GitHub *is* part of your resume story here).
- **Pros:** Universal, well-understood, directly reinforces the project's own thesis.

---

## API Testing

### Postman (manual, exploratory) + Jest + Supertest (automated, MVP-optional but recommended by V2)
- **Why:** Postman for fast manual iteration while designing endpoints; Supertest for automated integration tests once endpoints stabilize (see `TESTING.md`).
- **Alternatives:** Insomnia (comparable to Postman, either is fine); Thunder Client (VS Code-native, lightweight alternative).
- **Pros:** Postman collections double as living API documentation during development.

---

## Optional Production Tools (V2/Advanced, explicitly postponable)

| Tool | Purpose | Why postponable |
|---|---|---|
| Redis | Caching layer, BullMQ queue backend | Not needed until node-cron's limitations are felt or read-heavy caching becomes necessary (see `SCALABILITY.md`) |
| Docker | Containerized deployment | Valuable, but adds infra complexity before core product logic exists — introduce at `DEPLOYMENT.md` stage |
| GitHub Actions (CI/CD) | Automated testing/deploy | Introduce once you have a test suite worth running automatically |
| Sentry | Error monitoring in production | Introduce at deployment stage, not during local development |
| Nginx / reverse proxy | Production request routing | Only relevant once you're deploying to a VM rather than a managed platform |

## Deployment (overview; full detail in `DEPLOYMENT.md`)

- **Frontend:** Vercel or Netlify (static hosting, generous free tier, trivial CI from Git).
- **Backend:** Render or Railway (managed Node.js hosting, free/cheap tier, simple env var management) — chosen over raw VPS/EC2 to keep MVP deployment friction low; VPS deployment is a reasonable *learning* exercise for later, not an MVP requirement.
- **Database:** MongoDB Atlas (managed, free tier sufficient for MVP).

## Related Documents

- `SYSTEM_ARCHITECTURE.md` — how these pieces connect
- `SECURITY.md` — auth/validation details
- `SCALABILITY.md` — when Redis/queues/caching actually become necessary
- `DEPLOYMENT.md` — full deployment strategy
