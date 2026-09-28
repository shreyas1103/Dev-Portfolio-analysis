# PROJECT_PROGRESS.md

*Living document — updated at the end of every session. Represents the current, real state of the project. Do not recreate from scratch; append/update.*
**Phase 0 — Project Setup** completed

## Current Phase

**Phase 1 — Project Setup** (M1.1 completed)

## Completed Milestones

_None yet — this documentation set (`/docs`) is the project's starting point._

## In Progress

_Nothing in progress yet._

## Summary of Latest Session

**Date:** Initial documentation generation
**What we built:** The complete planning documentation set (21 planning files + `AI_MENTOR_INSTRUCTIONS.md` + living docs) for Dev Portfolio Analytics, based on the developer's problem statement.
**What was learned:** N/A — no implementation session has occurred yet.
**What should be revised:** N/A.
**What comes next:** Begin Phase 0 (`M0.1 — Repository & Tooling Bootstrap`) per `DEVELOPMENT_ROADMAP.md`.

## Known Open Decisions

- Whether to interleave `M3.3` (Weak-Area Detection logic) with seeded/mock data before Phase 4 (LeetCode adapter) is complete — noted as a reasonable option in `DEVELOPMENT_ROADMAP.md`.
- Email delivery for password reset is not configured in MVP (dev-mode logs the reset link) — revisit before any real production use with real users.

## Related Documents

- `TODO.md` — immediate next actions
- `ARCHITECTURE.md` — structural decisions made so far
- `DEVELOPMENT_ROADMAP.md` — full milestone plan this progress log tracks against




## Current Phase

**Phase 1 — Authentication** (M1.1 complete, M1.2 next)

## Completed Milestones

- **M0.1** — Repository & Tooling Bootstrap
- **M0.2** — MongoDB Atlas & Environment Config
- **M1.1** — User Model & Registration

## Summary of Latest Session

**Date:** 2026-07-08
**What we built:** Full registration flow, end-to-end, following the documented
request lifecycle (Route → Middleware → Controller → Service → Repository →
Model): `User` Mongoose model, a Zod `registerSchema` with email normalization,
a reusable `validate.middleware.js` factory, a custom `AppError` class hierarchy
(ValidationError/AuthError/ForbiddenError/NotFoundError/ConflictError/UpstreamError),
`user.repository.js`, `auth.service.js` (bcrypt hashing + duplicate-email check),
`auth.controller.js`, `auth.routes.js`, and `errorHandler.middleware.js` mounted
last in `app.js`.

**What was learned:** bcrypt password hashing and why it's deliberately slow;
the repository/service architectural boundary and its testability payoff;
fail-fast config validation (carried over from M0.2, reinforced here); Express's
error-middleware arity mechanism.

**What should be revised:** The repository/service testability argument needs to
be internalized more deeply — flagged in `INTERVIEW_NOTES.md` to revisit once
real unit tests are written (M6.2).

**What comes next:** M1.2 — Login, JWT Issuance, Refresh Flow.





# PROJECT_PROGRESS.md

*Living document — updated at the end of every session. Represents the current, real state of the project. Do not recreate from scratch; append/update.*

## Current Phase

**Phase 1 — Authentication** (M1.1 and M1.2 complete, M1.3 next)

## Completed Milestones

- **M0.1** — Repository & Tooling Bootstrap
- **M0.2** — MongoDB Atlas & Environment Config
- **M1.1** — User Model & Registration
- **M1.2** — Login, JWT Issuance, Refresh Flow

## In Progress

_Nothing in progress — M1.3 (Frontend Auth Flow) is next up, not yet started._

## Summary of Latest Session

**Date:** 2026-07-10
**What we built:** The complete JWT-based authentication backend, fully verified
end-to-end. This included extending `config/env.js` with JWT secrets and
`NODE_ENV`, a token-generation utility (`token.util.js`) with shared expiry
constants, a `loginSchema` Zod validator, `authService.login/refresh/getCurrentUser`,
`authController.login/refresh/logout/getMe` (with a shared `setRefreshTokenCookie`
helper), `requireAuth` middleware for JWT verification, and a new
`userRepository.findById` method. A temporary `GET /api/auth/me` endpoint was
added specifically to verify the auth middleware end-to-end.

The full documented completion criterion for M1.2 — register → login →
authenticated request → refresh → logout — was tested and verified in Postman
in one continuous sequence, including inspecting the httpOnly refresh cookie
directly and confirming it's cleared on logout.

**What was learned:** JWT