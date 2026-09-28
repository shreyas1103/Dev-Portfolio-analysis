# LEARNING_NOTES.md

*Living document — append a new dated entry at the end of every session, capturing what was actually learned (in your own words), not just what was built. Cross-reference `LEARNING_MAP.md` for the full concept list this should eventually cover.*

## How to Use This File

After each session, add an entry:

```md
### [YYYY-MM-DD] — [Concept(s) covered]

**In my own words, this concept is:**

**Why it matters in this project specifically:**

**What confused me initially:**

**What finally made it click:**
```

# Learning Notes

## 2026-07-07

Today I learned why Express projects are often split into app.js and server.js.

The app.js file contains the application setup such as middleware, routes, and configuration. The server.js file is responsible for starting the server and listening on a port.

Keeping them separate makes the code easier to maintain, test, and scale because the application logic and server startup logic are not mixed together.


M0.2 completed
 
### [2026-07-07] — Fail-fast config validation & single-responsibility error handling

**In my own words, this concept is:**
Fail-fast means catching a problem at the earliest possible point (app startup) instead of
letting it surface later, in a confusing, disconnected place. It doesn't stop the error from
existing — it moves *where* the error is caught, to somewhere it's cheap and obvious to diagnose.

**Why it matters in this project specifically:**
Without validation, a missing MONGODB_URI wouldn't fail until something actually tried to use
the database — deep inside a route handler, far from the real cause. With Zod validation at
boot, the app refuses to start and says exactly which variable is wrong.

**What confused me initially:**
I originally had db.js call process.exit(1) itself on a failed connection. That meant the
try/catch in server.js could never actually catch anything — the process was already dead
before control returned. It looked like error handling, but it was dead code.

**What finally made it click:**
Separating "who detects the error" from "who decides what to do about it." db.js's only job
is connecting to MongoDB and reporting success/failure (by throwing). server.js is the one
and only place that decides a failure means process.exit(1). If I ever want retry-with-backoff
instead of an immediate exit, I only need to change server.js — db.js doesn't need to know
that decision changed at all.

M 1.1 
### [2026-07-08] — bcrypt password hashing & Repository/Service boundary

**In my own words, this concept is:**

**bcrypt:** A password hashing algorithm designed specifically for securely storing
passwords. Instead of saving the user's actual password in the database, we store a
hashed version of it, generated via a unique salt per user so identical passwords
still produce different hashes.

**Repository/Service boundary:** The repository is responsible only for database
access — it contains Mongoose queries and knows how to read/write data from MongoDB
(e.g. `findByEmail(email)`, `create(userData)`). The service contains business logic —
it decides *what should happen* in the application (check if email exists, hash
password, throw ConflictError, create user) and uses the repository to access data,
never touching Mongoose directly.

**Why it matters in this project specifically:**

If the database is ever leaked, attackers cannot immediately see users' real
passwords — they'd get bcrypt hashes instead, which are computationally expensive
to reverse. During registration, the flow is:

The plaintext password is never stored anywhere.

For the repository/service split: without a repository layer, database queries
would get scattered across multiple services, making the code harder to maintain
and change. Centralizing them in one place means a future database swap (Mongo →
Postgres, say) would only touch the repository layer. The bigger, more immediate
benefit is testing — services can be unit-tested by mocking the repository, instead
of requiring a real database connection for every test.

**What confused me initially:**

Why check for a duplicate email *before* hashing the password, instead of just
doing things in whatever order felt natural. It wasn't obvious this was a
deliberate performance decision, not just a stylistic one.

**What finally made it click:**

bcrypt is intentionally slow — that's the whole point, it's what makes brute-force
attacks expensive. Because it's deliberately slow, wasting a bcrypt.hash() call on
a registration that's about to be rejected (duplicate email) has a real, non-trivial
cost, unlike skipping a normally-fast operation. So the order (check first, hash
second) isn't arbitrary — it's a direct consequence of understanding *why* bcrypt
is slow in the first place.
## Entries

_No sessions completed yet. First entry will follow Phase 0 / Phase 1 work (see `DEVELOPMENT_ROADMAP.md`)._

## Related Documents

- `LEARNING_MAP.md` — full concept inventory
- `INTERVIEW_NOTES.md` — where mastered concepts should be revisited in interview-question form
- `PROJECT_JOURNAL_TEMPLATE.md` — templates for the "Lessons Learned" style entries


### [2026-07-10] — JWT Authentication (Access/Refresh Tokens, Rotation, Logout)

## Why JWT?

JWT (JSON Web Token) allows the server to identify a user without storing session
data in memory. After login, the server issues a signed token containing a small
payload:

```json
{ "userId": "..." }
```

The server later verifies the token's signature to confirm it was issued by us
and has not been tampered with.

---

## Access Token vs Refresh Token

### Access Token
- Used for authenticated API requests, sent as `Authorization: Bearer <accessToken>`.
- Short lifetime (15 minutes).
- Verified using `JWT_ACCESS_SECRET`.
- Contains only the minimum identity information required (`userId`).

### Refresh Token
- Used only to obtain a new access token.
- Stored in an httpOnly cookie, sent automatically by the browser.
- Longer lifetime (7 days).
- Verified using `JWT_REFRESH_SECRET`.
- Never used directly for normal API requests.

---

## Why Use Two Tokens?

If an access token is stolen, the attacker only has access until it expires
(15 min). The refresh token stays protected in an httpOnly cookie and is used
to obtain new access tokens without forcing repeated logins. This balances
security (short exposure window on the token sent every request) against user
experience (staying logged in for days).

---

## JWT Verification

Access tokens are verified in `requireAuth` middleware:
1. Read `Authorization` header.
2. Extract `Bearer` token.
3. Verify using `JWT_ACCESS_SECRET`.
4. Attach `req.user = { id: userId }`.
5. Continue request.

Refresh tokens are verified separately, inside `authService.refresh()`, using
`JWT_REFRESH_SECRET` — a different secret, so a leaked access-token secret can
never be used to forge refresh tokens, and vice versa.

---

## Why requireAuth Does Not Query the Database

`requireAuth` runs on *every* authenticated request. A database lookup every
time would add unnecessary overhead for a check that most routes don't need.
Instead it just attaches `req.user = { id: decoded.userId }`, and routes/services
fetch full user data only when they actually need it.

`GET /api/auth/me` is the deliberate exception: since its entire purpose is
"return this user's information," a DB lookup there is justified — the cost
matches the actual need, unlike in the general-purpose middleware.

---

## Refresh Token Rotation

Current flow:
1. Refresh token arrives via cookie.
2. Verify it against `JWT_REFRESH_SECRET`.
3. Confirm the user still exists in the DB (protects against a deleted account
   still holding a cryptographically valid, unexpired refresh token).
4. Generate a new access token AND a new refresh token.
5. Overwrite the cookie with the new refresh token.

---

## Option A vs Option B (Rotation Strategy)

### Option A — Full rotation with server-side invalidation
Store the currently valid refresh token (or its hash) on the `User` document.
On refresh, compare the incoming token against the stored one before issuing
new tokens.
- **Benefit:** old/stolen refresh tokens become invalid the moment the
  legitimate user refreshes again.
- **Drawback:** requires a schema change not currently in `DATABASE_DESIGN.md`,
  and real additional state management.

### Option B — Current implementation (chosen for M1.2)
No server-side tracking of refresh tokens at all — each refresh just verifies
signature + expiry + user existence, then issues a fresh pair.
- **Benefit:** simpler, no schema change, matches current documented architecture.
- **Drawback:** a stolen refresh token remains valid until its natural 7-day
  expiry, even after the legitimate user rotates theirs.

**Why Option B for now:** implementing Option A would mean silently building a
persistence/security design that isn't documented anywhere in `DATABASE_DESIGN.md`
or `SECURITY.md`'s current scope — a bigger architectural change than this
milestone calls for. Option B completes the documented auth flow correctly;
Option A is a legitimate future upgrade if this project's threat model changes.

---

## Logout Limitation

Because Option B was deliberately chosen, logout can only clear the refresh
cookie client-side — it cannot cryptographically revoke the token, since the
server never stored it to compare against. This is a known, accepted trade-off,
not an oversight: `logout` in this system means "this browser/device can no
longer refresh," not "this token is now provably invalid everywhere." True
revocation would require Option A.



### [2026-07-11] — React Context + useReducer (AuthContext)

**In my own words, this concept is:**

Context is React's built-in way to make a value available to any component in
a subtree without manually passing it through props at every level ("prop
drilling"). useReducer manages state via a single dispatched action flowing
through one pure reducer function, rather than scattering many separate
useState calls for pieces of state that change together.

**Why it matters in this project specifically:**

Auth state (`user`, `accessToken`, `status`) is needed by completely unrelated
parts of the app — the Navbar, ProtectedRoute, the API client — that have no
parent/child relationship to the login form where the state originates.
Context solves the access problem; useReducer centralizes the specific,
well-defined transitions (login succeeds, silent refresh restores a session,
logout) into one place instead of many scattered setState calls.

**What confused me initially:**

Whether to expose `dispatch` directly to consuming components, or hide it
behind named functions like `login()`/`logout()`.

**What finally made it click:**

This is the same layering principle from the backend, just on the frontend:
controllers don't know how Mongoose works (services hide that); components
shouldn't know action-type strings or reducer internals (AuthContext hides
that behind `login()`/`logout()`). Exposing raw `dispatch` would mean every
component that wants to log a user in needs to know the exact payload shape
and action-type string — the same kind of leaky abstraction the
repository/service boundary was designed to prevent on the backend.

**Design decisions made and why:**
- `status` has three values (`loading` / `authenticated` / `unauthenticated`),
  not just a boolean — because "checking if a session exists" (page just
  loaded, silent refresh in flight) is a genuinely different state from
  "definitely logged out," and conflating them causes a bad UX (forced
  re-login on every page refresh, per FRONTEND_ARCHITECTURE.md).
- `AUTH_RESTORED` and `LOGIN_SUCCESS` are separate action types even though
  they currently produce identical state, because reducers should model
  *what happened*, not just the resulting object — keeping them distinct
  costs nothing now and avoids having to split them apart later if their
  behavior ever needs to diverge.
- `login`/`logout` are exposed as async functions that will internally call
  the API and dispatch on success/failure — components never see `dispatch`
  or action-type strings directly.
- The actual API-calling logic inside `login()`/`logout()`/the silent-refresh
  `useEffect` is deliberately left as TODOs this session, since the API client
  (with its token-attach + refresh interceptor) doesn't exist yet — writing a
  temporary bare `fetch()` now would be throwaway code, and the project's own
  philosophy favors small, complete, non-throwaway pieces of work.



  ### [2026-07-11] — ProtectedRoute, CORS, and the Logout/requireAuth Reversal

## Protected Routes / Route Guards

A `ProtectedRoute` is a layout route that checks auth state before deciding
whether to render its children (via React Router's `<Outlet />`) or redirect
elsewhere. The entire logic hinges on a three-way branch over `status`:
loading        -> render a loading state
authenticated  -> render <Outlet /> (let the matched child route through)
unauthenticated -> <Navigate to="/login" replace />

This three-way branch is *why* `status` needed three values back in Session 1,
not just a boolean. Without the `"loading"` state, a genuinely logged-in user
who refreshes the page would get bounced to `/login` during the brief window
before the silent-refresh `useEffect` resolves — the exact "flash redirect"
bug `FRONTEND_ARCHITECTURE.md` warned about.

`replace` on `<Navigate>` matters because auth redirects are guard redirects,
not normal navigation — without it, hitting the browser's back button after
being redirected would push the user right back into the protected route,
which would immediately redirect them again.

## CORS (real-world gotcha, not just theory)

Everything up through M1.2 was tested via Postman, which doesn't enforce
browser-style CORS. The moment the actual browser frontend (`localhost:5173`)
called the backend (`localhost:5000`) — different ports, different origins —
the register request failed with a CORS error, even though the exact same
request worked fine in Postman the whole time. This was a real gap: CORS
middleware had never been configured on the backend because nothing had ever
needed it to be, until a real cross-origin client showed up. Fixed by
installing and wiring `cors` in `app.js` with an explicit origin allow-list
and `credentials: true` (required for the httpOnly refresh cookie to be sent
cross-origin, per SECURITY.md).

**Lesson:** integration testing via Postman/API tools can hide real
browser-specific behavior (CORS, cookie handling) that only surfaces once a
real browser client is involved. "Works in Postman" isn't the same guarantee
as "works in the app."

## Logout / requireAuth Collision (a real bug, found via testing)

`auth.controller.js`'s `logout()` clears the local access token *before*
calling the backend logout endpoint. Combined with `/auth/logout` being
excluded from the interceptor's refresh-and-retry logic (deliberately, since
refreshing a session just to destroy it makes no sense), this meant the
logout request went out with no valid Authorization header. Since `/logout`
still required `requireAuth` at the time, the request was rejected with 401
*before the controller ever ran* — so the refresh-token cookie was never
actually cleared server-side, even though the user appeared logged out
locally.

This exposed a genuine conflict between two previously-reasonable decisions:
"logout should require auth, for API consistency" vs. "logout must always be
reachable, since its entire job is letting a user leave." The second one
wins here specifically because `/logout`'s controller doesn't use `req.user`
for anything — unlike `/me`, which genuinely needs to know who the user is,
logout has no legitimate reason to depend on token validity. `requireAuth`
was removed from the `/logout` route as a result (see ARCHITECTURE.md D-002).

**Key takeaway:** a design decision that was correct in isolation (require
auth on account actions) can still be wrong once it interacts with other,
separately-reasonable decisions (clear state before the API call resolves).
Real end-to-end testing is what surfaces these collisions — reasoning through
each piece individually isn't always enough.

## The Reactive Redirect (seeing the architecture actually work)

Clicking "Logout" doesn't call `navigate("/login")` anywhere. Instead:
`logout()` dispatches `LOGOUT` → Context state changes → `ProtectedRoute`
re-renders because it reads that state → it now evaluates to `"unauthenticated"`
→ it renders `<Navigate to="/login" replace />`. The redirect is an emergent
consequence of state changing and every consumer reacting to it, not an
imperative instruction anywhere. This is the actual payoff of building
Context + useReducer properly back in Session 1 — visible, working reactivity
end-to-end, not just a concept on paper.


### [2026-07-12] — OAuth 2.0 (Authorization Code Flow) & the Adapter Interface

## Why OAuth Exists

Before OAuth, the only way to let a third-party app act on a user's behalf on
another service was for the user to hand over their actual password to that
app — giving it unlimited, hard-to-revoke power over the account. OAuth
solves this by letting a user grant a scoped, revocable permission instead
of sharing a credential.

## The Three Parties

- **Resource Owner** — the user (owns the GitHub data).
- **Client** — this app (Dev Portfolio Analytics), requesting access.
- **Authorization Server / Resource Server** — GitHub, which issues tokens
  and also hosts the data being accessed (GitHub plays both roles here).

## Authorization Code Flow, Step by Step

1. App redirects the browser to GitHub's authorization URL with `client_id`,
   requested `scope`, `redirect_uri`, and a `state` value (see below).
2. User logs into GitHub (if needed) and sees a consent screen — authorize
   or deny.
3. If authorized, GitHub redirects back to the app's `redirect_uri` with a
   short-lived, single-use authorization **code**.
4. The **server** (not the browser) exchanges that code for an access token
   via a direct server-to-server request to GitHub, including `client_id`
   AND `client_secret` — proving the request genuinely comes from this app,
   not just anyone who intercepted the code.
5. GitHub returns an access token; the server stores it encrypted and can
   now call GitHub's API on the user's behalf, scoped to what was authorized.

**Key distinction from normal login:** after a normal login, the server
holds a password hash and issues its own JWTs. After OAuth, the server holds
a token *issued by GitHub*, representing delegated, scoped permission — not
the user's actual GitHub credentials at all.

## What the `state` Parameter Actually Protects Against

This one took extra thought to get precise. It is NOT the same shape as the
CSRF I already knew from SECURITY.md (a form/cookie-based attack). Instead:

**Without `state`:** an attacker starts their own OAuth flow using their own
GitHub account, gets a valid authorization code, and tricks a logged-in
victim into visiting the callback URL with the *attacker's* code attached.
If the callback doesn't verify anything beyond "is this code valid," the
server will happily link the attacker's GitHub account to the victim's app
session — an account-linking attack, not a request-forgery attack in the
usual sense.

**How `state` fixes it:** before redirecting to GitHub, the server generates
a random value tied to the current user's session and includes it as
`state`. GitHub echoes it back unchanged on the redirect. The callback's
first job is verifying the returned `state` matches what was generated for
*this specific user's* session — proving the whole round-trip was genuinely
initiated by this server for this user, not hijacked mid-flight.

**Precise summary:** `state` protects against an attacker linking their own
external account to a victim's session — not against a malicious form
submission.

## The Adapter Interface (adapter.interface.js)

A shared base class (`SourceAdapter`) defines `fetchProfile`, `fetchActivity`,
and `fetchRepos` as the contract every platform adapter must implement —
even for platforms where a method doesn't conceptually apply (e.g., LeetCode
has no repos, so `fetchRepos` just returns `[]`).

**Why every adapter implements all three methods, even meaningless ones:**
so `sync.service.js` can call any adapter identically through
`AdapterFactory.get(source)`, without platform-specific conditionals. If
adapters had inconsistent method sets, the service would need
`if (source === 'github') { ... }` branches everywhere, defeating the whole
point of the pattern — the service would become platform-aware again.

**Why credentials are passed IN rather than looked up by the adapter itself:**
fetching stored, encrypted credentials from the database is a
repository/service concern, not an adapter concern. An adapter's only job is
translating a platform-specific API into the app's common shape. Coupling it
to persistence would violate single-responsibility and make it much harder
to test in isolation (every test would need real DB access).

**Why base-class methods `throw` instead of having empty bodies:** this is
the same fail-fast principle from `config/env.js`, relocated to a new
context. An empty method body would silently return `undefined` if a future
adapter (e.g., Codeforces in V2) forgot to override a required method —
producing a confusing bug far from its real cause. Throwing immediately,
with a message naming exactly which method is missing, converts a silent
runtime bug into an obvious, traceable one at the exact point of the mistake.


### [2026-07-16] — GitHub OAuth: Deferred vs. Immediate Config, and Least-Privilege Scoping

## Why GITHUB_REDIRECT_URI Couldn't Be Deferred (Unlike VITE_API_BASE_URL)

Back in M1.3, hardcoding the frontend's API base URL was a deliberate,
correct choice to defer — that value was purely internal wiring between my
own frontend and backend, with zero external consequence either way.

GITHUB_REDIRECT_URI is different, even though it looks like the same kind of
"just a URL" decision on the surface. This value must *exactly* match a URL
already registered with a third party (GitHub's OAuth App settings) — and
that registered value genuinely differs between local dev and production.
Hardcoding it would mean remembering to change this one line at deploy time,
which is exactly the kind of "confusing runtime failure three requests
later" bug config/env.js's fail-fast validation exists to prevent. So this
went into config/env.js immediately, not deferred — the difference is
whether an external system depends on the exact value, not just whether the
value differs across environments.

## Scope Decision: read:user, Not repo

GitHub's OAuth scopes are specific, named strings, not a generic
"read-only" toggle. `public_repo` grants public-repo access; the broader
`repo` scope is required for private repos too.

I chose `read:user` only (no repo scope yet) based on rereading
PROJECT_OVERVIEW.md and FEATURES.md: this product is explicitly about a
*public-facing* developer footprint — recruiters verifying real, visible
work — not private/proprietary code analysis. Requesting the broad `repo`
scope would grant more access than the stated product goals actually need.
If a specific endpoint in M2.2 turns out to require `public_repo` for
fetching public repo data via the authenticated API, that scope gets added
then, when the actual need is confirmed — not preemptively now.

This mirrors a pattern I keep hitting in this project: don't build for a
requirement you don't have yet, whether that's a Redis cache, an env var,
or in this case, an OAuth permission scope. Requesting the minimum
necessary access isn't just cleaner — it's a real, verifiable security
property (verified concretely against GitHub's actual consent screen,
which showed only "Personal user data — Profile information (read-only)"
being requested, confirming the scope was interpreted correctly).

## OAuth state cookie vs. refresh-token cookie — same shape, different lifetime

Both use httpOnly + sameSite=lax cookies, following the same pattern
established in M1.2. But the OAuth state cookie only needs to survive a few
minutes (the redirect-out-and-back round trip to GitHub), so its maxAge is
10 minutes — dramatically shorter than the refresh token's 7 days. Same
security shape, deliberately different lifetime based on what each value
actually needs to survive.


### [2026-07-18] — OAuth 2.0, the State-Token CSRF Redesign, and Encryption at Rest (M2.1)

## OAuth 2.0 — The Three-Party Model

Unlike normal login (server holds a password hash, issues its own JWTs),
OAuth lets the app hold a *delegated, scoped* credential issued by a third
party (GitHub), without ever seeing the user's actual GitHub password.

Three roles: **Resource Owner** (the user), **Client** (this app), and
**Authorization/Resource Server** (GitHub, playing both roles here).

Flow: redirect to GitHub's authorize URL (client_id, scope, redirect_uri,
state) → user consents → GitHub redirects back with a short-lived `code` →
server exchanges `code` + `client_id` + `client_secret` for an access token,
server-to-server, so the secret never touches the browser.

## The state Parameter — What It Actually Protects (and a Real Redesign)

I initially designed `state` as a random value stored in an httpOnly cookie,
compared against the callback's returned value — reasonable-sounding, but
it had a real gap: it only proves the callback belongs to *some* previously
initiated flow, not *which user* initiated it. The callback route can't use
`requireAuth` (GitHub's redirect carries no Authorization header), so
identity has to come from somewhere else.

**The gap, concretely:** if `state` alone doesn't carry identity, an
attacker could start their own OAuth flow, get a validly-signed `state` and
a real `code` for their own account, then trick a victim into visiting the
callback URL with the attacker's own values. Walking through it carefully,
though, this specific attack doesn't actually harm the victim — the
attacker just ends up linking their own GitHub account to their own
`connectedAccounts` record via a roundabout path. There's no privilege
escalation. But the deeper problem remained: a plain random `state` gives
the callback no way to know *whose* user record to attach a connection to
at all.

**The fix:** make `state` a short-lived, signed JWT containing `{ userId }`,
signed with a dedicated `OAUTH_STATE_SECRET` (separate from
JWT_ACCESS_SECRET — different trust domain, same reasoning as why access
and refresh tokens use separate secrets). The callback verifies the
signature (proving it was genuinely issued by this server, unmodified) and
extracts `userId` directly from the payload — no cookie needed at all,
since the signed value is self-contained and self-verifying. This is
simpler AND more correct than the original cookie-based design: signed data
is verifiable without needing a stored copy to compare against.

**Key lesson:** a design can look reasonable at first (cookie + random
state, matching what SECURITY.md describes for other flows) and still have
a real gap that only surfaces when you trace through "what does the
callback actually know, and where does it get identity from" carefully.

## Encryption at Rest

Passwords are hashed (one-way, never recoverable) because the app only
ever needs to *verify* them. GitHub tokens need the opposite property:
confidentiality while remaining recoverable, since the app must use the
real token later to call GitHub's API. That's what encryption solves,
where hashing can't.

AES-256-GCM: a symmetric algorithm (same key encrypts and decrypts) with
built-in tamper detection via an authentication tag. Every encryption uses
a fresh random IV (16 bytes) — reusing an IV can leak information and
weaken the guarantees GCM provides. Since MongoDB stores this as one string
field, IV + ciphertext + authTag are hex-encoded and joined with `:` into
one string, then split back apart at decryption time.

The encryption key itself is a 32-byte value, hex-encoded (64 hex
characters) for storage in `.env`, validated in config/env.js with a
`.regex(/^[0-9a-fA-F]{64}$/)` check — stricter than a plain `.min(1)` or
even `.length(64)`, since it also verifies the string is genuinely valid
hex, not just the right character count (which would otherwise pass and
then crash later at `Buffer.from(..., "hex")`).

**Key security property:** the encryption key lives only in an env var,
never in the database — a DB leak alone yields unreadable ciphertext; only
a leak of the DB *and* the server's environment together would compromise
real tokens. This is a real, known limitation of application-level
encryption (a fully compromised running server, not just its database,
could still decrypt everything) — worth stating honestly rather than
treating this as unbreakable.

## Adapter Client Functions in Practice

`github.client.js` now has two real methods (`exchangeCodeForToken`,
`fetchUserProfile`), both making raw HTTP calls to GitHub with
GitHub-specific quirks handled explicitly: requiring an `Accept:
application/json` header for the token endpoint (which otherwise returns
URL-encoded text by default), and checking for `data.error` in a `200 OK`
response body (since `fetch` only rejects on genuine network failures, not
on an API-level error described inside a successful HTTP response).


### [2026-07-19] — Pagination, Rate Limits, and Cross-Source Data Normalization (M2.2)

## Pagination — Link Header vs. "Fetch Until Empty"

GitHub paginates repos/commits. Two ways to detect the last page: parse the
`Link` response header (explicit `rel="next"`), or keep requesting `page+1`
until an empty array comes back. The Link-header approach is more robust:
"fetch until empty" always wastes exactly one extra request past the real
last page (e.g., a user with exactly 200 repos and per_page=100 would fetch
page 1, page 2, then a wasted page 3 request just to discover it's empty).
Following the API's own explicit pagination signal avoids this and doesn't
rely on an indirect stopping condition.

**Why "silently missing data beyond page 1" is worse than an obvious bug:**
if pagination isn't handled, the app doesn't error — it just returns
correct-looking, incomplete data. A user with 150 repos would see analytics
based on only the first page, with no signal anything was wrong. This is a
genuinely more dangerous failure mode than a crash, because nobody notices.

## Rate-Limit Awareness (Deliberately Scoped)

GitHub allows 5,000 requests/hour per token and returns `X-RateLimit-Remaining`
on every response. For M2.2, the scope was reading and logging this header —
not active throttling/backoff, which the roadmap correctly defers to when
background sync at real scale actually needs it (SCALABILITY.md's
"don't build for the problem you don't have yet" principle, applied again).

Doing the actual math made the stakes concrete: fetching full repo-quality
data (README/CI/tests/contributors/languages) for 50 repos costs roughly
201 API calls in a single sync — well within budget for one user, but a
real, compounding cost across many users syncing on a schedule. This
reinforced why awareness now (not full throttling yet) is the right,
proportionate scope — the visibility exists to notice the problem building,
even though the fix is deliberately deferred.

## UTC Date Truncation — Not Just a Style Choice

ActivityEvent.date is truncated to day-level precision because the heatmap
and consistency score only care whether activity happened on a given day,
not the exact time. Truncation must use UTC specifically, not server-local
time — the risk isn't about which timezone is "more correct" for the user,
it's that without one universally agreed reference point, the *same commit*
could get bucketed into different calendar days depending on incidental
infrastructure details (which server/region handled the request, DST
transitions, etc.) — a correctness bug that has nothing to do with the
user's actual activity.

## explicit null vs. omission

Fields that don't apply to a given source (topic/difficulty for GitHub
commits) are explicitly set to null, not omitted — this keeps every
ActivityEvent document shape-consistent regardless of source, and lets
queries reliably filter on `topic: null` without needing `$exists` checks.
Explicit null communicates "intentionally unavailable"; omission would be
ambiguous with "accidentally missing."

## A Real Scope-Creep Catch: M2.2 vs. M3.2

DATABASE_DESIGN.md's Repo schema lists fields like hasReadme/hasCI/hasTests/
contributorCount/language_bytes — but DEVELOPMENT_ROADMAP.md places the API
calls that gather these specifically in M3.2 (Project Quality Score), not
M2.2. Cross-referencing both docs before writing normalizeRepo() caught
this: M2.2's normalizer should only produce the minimal shape available
from the basic repo-list endpoint (externalRepoId, name, lastCommitAt),
leaving the quality-scoring fields to Mongoose schema-level defaults for
now, populated later when M3.2 actually builds the supplementary fetch
calls. This kept the normalizer's responsibility narrow and matched to
what M2.2 genuinely owns, avoiding both wasted API calls now and premature
implementation of a later milestone's work.

**Design principle reinforced:** when a schema documents fields that don't
all seem to belong to the current milestone, check the roadmap before
assuming the schema's full shape needs to be built immediately — the
schema describes the eventual complete shape, not necessarily what any one
milestone is responsible for populating.

## pushed_at vs. updated_at (GitHub-specific, worth remembering)

lastCommitAt should map to GitHub's pushed_at, not updated_at — pushed_at
tracks actual code pushes specifically, while updated_at is broader and
includes non-code changes (description edits, settings, etc.) that would
make "last commit" data misleading if updated_at were used instead.

### [2026-07-20] — Idempotent Writes & Fault Isolation (M2.3 Session 1)

## Idempotency, Precisely

An idempotent operation produces the same end result no matter how many
times it's applied. REST's PUT is the classic idempotent verb; POST/insert
is not — calling insertMany() with the same 395 commits twice produces 790
documents, not 395. This isn't just "duplicate data is untidy" — it
directly corrupts the consistency score, which would then represent how
many times the sync job happened to run rather than the user's actual
GitHub activity.

The fix is `upsert`: update-if-exists, insert-if-not, keyed by a field that
uniquely identifies "this same logical record." For GitHub commits, that's
`{userId, metadata.sha}` — SHA alone isn't enough, since two different
users could theoretically have access to the same commit (shared/forked
repo history); combining with userId scopes the identity correctly to
"this commit, as it relates to this user's activity record."

## $set vs. Full Replacement on the Update Path

Chose `$set` over a full replacement document for bulkWrite's update
operations. Both behave identically *today*, since every field is fully
recomputed from GitHub data on every sync — but $set only touches the
fields being written, while a full replacement would silently wipe any
schema field added later that the normalizer doesn't yet populate. This
wasn't fixing a current bug — it was avoiding a future one, the same
"safer to evolve" reasoning applied to a decision with no visible
difference right now.

## A Real MongoDB Gotcha: Unique Indexes and Missing Fields

Almost made the {userId, "metadata.sha"} index unique, since SHA really is
unique for commits. But ActivityEvent is a shared collection — LeetCode
submissions, contest events, etc. have no metadata.sha at all. MongoDB's
unique indexes treat missing/null indexed values as equal to each other by
default, meaning a unique constraint here would make the *second* non-GitHub
event (any event with no sha field) collide against the *first*, even
though they're completely unrelated. The index stays non-unique;
uniqueness is enforced at the application layer instead, via the upsert
filter itself. Same identifying key, different layer of enforcement,
because the shared collection's real-world data shape doesn't match what a
DB-level unique constraint assumes.

## bulkWrite([]) — Checking a Claim Instead of Assuming It

Assumed bulkWrite([]) throws (guard clause needed) without actually
verifying. Searched it: this WAS true in older Mongoose (a 2020 GitHub
issue confirms it), but was explicitly fixed as an "enhancement" — current
versions return a graceful default result instead. The guard clause is
still correct to keep regardless: it costs nothing, makes "zero new
commits this sync" an explicit, self-documenting normal case rather than
relying on knowing the exact behavior of whichever Mongoose version happens
to be installed, and protects against a library upgrade changing this
behavior again in either direction.

**Lesson:** "I reasoned my way to X" and "X is actually true of my specific
dependency version" are different claims. The first is good design
thinking; only the second is verified fact. Worth checking when it's cheap
to check, especially for library-specific edge-case behavior that's easy
to assume rather than confirm.

## Fault Isolation, Precisely

Formal term for "one failing user/source shouldn't crash the batch": fault
isolation (GLOSSARY.md: "designing a system so that one component's
failure doesn't cascade into unrelated components' failures"). The
mechanism is simple — wrap each independent unit of work in its own
try/catch — but the *granularity* matters: isolation needs to happen per
user AND per source, not just per user, since a user's GitHub failing
shouldn't block their own LeetCode sync either. Not yet implemented (that's
sync.service.js, Session 2) — but the design principle and its correct
granularity are settled before writing the orchestration loop.

### [2026-07-25] — Scheduling, Two-Level Fault Isolation, and Atomic Increments (M2.3 Session 3)

## consecutiveFailures — Why Store It Even Without Using It Yet

A simple status: "failed" can't distinguish a one-off transient failure
(GitHub had a blip) from a persistent one (revoked token, 15 failures in a
row). consecutiveFailures provides that historical context now, even
before any differentiated behavior (pausing sync, notifying the user,
backoff) is built on top of it. Unlike the M3.2 quality-field situation,
storing this counter costs nothing today — there's no API call or real
resource tied to adding the field, so building it ahead of the behavior
that will use it is reasonable, not premature.

## $inc and the Lost-Update Problem

Traced through why a manual read-modify-write ("read current value, add 1,
write back") is unsafe under concurrency: if two failures happen close
together, both processes can read the same stale value (e.g., 3), both
compute 4, and both write 4 — one failure silently disappears from the
count. MongoDB's $inc avoids this because the increment happens as a
single atomic operation inside the database itself, with no separate
read-then-write round-trip for the application to coordinate. Two
concurrent $inc calls against the same document correctly produce 4 then
5, not 4 then 4. This is a general concurrency pattern, not MongoDB-
specific — the same lost-update risk exists anywhere concurrent processes
read-then-write shared state, and "push the mutation into the datastore as
one atomic instruction" is the standard fix.

## Fault Isolation Is a Hierarchy, Not a Single Boundary

Realized fault isolation needs to exist at multiple nested levels, each
containing failures so they can't cascade to the next level up:
- Per-source (inside syncUser): one failing GitHub sync shouldn't stop
  that same user's LeetCode sync.
- Per-user (inside syncDueUsers): one user's entire sync throwing
  unexpectedly (e.g., a DB error before the per-source loop even starts)
  shouldn't stop the rest of the batch.

This is the same principle applied recursively wherever independent units
of work exist — not a single try/catch "at the top," but nested boundaries
matching the actual structure of what's independent from what.

## Idempotency Makes "Eventually Consistent" an Acceptable Trade-off

If a sync fails partway through (repos upserted, activity events not yet
fetched), the database is left in a partial state — but this is safe
specifically because every write is an idempotent upsert. The next sync
attempt naturally completes whatever was interrupted, without duplicating
or corrupting anything. This is why the sync flow doesn't need a database
transaction wrapping the whole operation: transactions are for atomic
all-or-nothing correctness, but wrapping one around calls to an external,
unreliable API (GitHub) would be a bad design (transactions should be
short-lived, not span slow/unreliable I/O). Idempotency is what earns the
ability to skip that transaction — the system is eventually consistent by
design, not by accident.

## Scheduler vs. Service — Job Owns "When," Service Owns "What" and "Who"

jobs/syncJob.js should be as thin as possible — just a cron registration
calling one service function. Deciding *which* users are due for sync
(business logic: staleness, retry policy, prioritization) belongs in
syncService.syncDueUsers(), not the job file. This mirrors the same
separation used everywhere else in the project (route/controller/service,
adapter/normalizer/client) — the job is scheduling infrastructure, the
service is the actual behavior being scheduled.

For M2.3 specifically, chose the simplest possible "due" definition —
sync every user with at least one active connected account, every run —
deliberately deferring smarter staleness/backoff logic. This is safe
specifically *because* of idempotency: resyncing an unchanged account
wastes some work but causes no harm, so a naive first implementation is a
legitimate starting point, not a shortcut with hidden risk.

## startSyncJob() Belongs in server.js, Not app.js

Directly connects back to the app.js/server.js split from M0.1: app.js
must remain side-effect-free and importable (so tests, or Supertest, can
require() the Express app without accidentally starting a cron scheduler).
server.js is the true runtime entry point — DB connection, HTTP listener,
and background jobs all start from there. The exact same reasoning that
motivated the original file split months ago directly explains where a
new piece of infrastructure (the scheduler) needs to live now.

## Verified End-to-End (Real Data, Not Just a Test Script)

- 18 repos, 979 activity events created via the actual scheduled job
  (not the manual test script from M2.2) — first real proof the whole
  pipeline works under real scheduling, not just direct invocation.
- Re-running the job a second time held both counts steady — idempotency
  confirmed under real repeated execution.
- Deliberately corrupting a stored access token produced a genuine
  decrypt() failure, correctly caught by syncUserSource's try/catch,
  correctly recorded via markFailed (status: "failed",
  consecutiveFailures: 1, lastAttemptAt updated while lastSyncedAt
  correctly stayed at the previous success) — and the job did not crash.
  This is fault isolation proven against a real, not simulated, failure.

  ### [2026-07-27] — Coefficient of Variation & the Consistency Score (M3.1)

## Why a Simple Average Isn't Enough

Two users with identical totals (30 commits over 90 days) can have wildly
different practice patterns — one steady, one crammed into a two-week
burst. A plain average can't distinguish them because it discards all
information about *distribution* over time, only total volume. This
directly matters to the product's stated purpose (FEATURES.md): recruiters
and students both need to know about *pattern*, not just *quantity*.

## Coefficient of Variation, Verified by Hand

CoV = stdDev / mean — a normalized measure of relative variability,
comparable across users regardless of total activity level. Worked a real
example by hand (steady: commits every 3rd day vs. burst: all activity on
one day, both totaling 3 events over 9 days) and confirmed CoV correctly
separated them (steady ≈1.41 vs burst ≈2.83) — this hand-verification
became the de facto test fixture before any code existed.

## Population vs. Sample Variance — the Actual Deciding Factor

Chose population variance (divide by n) over sample variance (n-1,
Bessel's correction) because the 90-day window IS the complete thing being
measured, not a sample used to infer some larger unknown population. The
deciding question isn't "which formula do I usually use" — it's "am I
estimating something beyond what I've directly observed, or measuring the
complete, defined thing itself." No inference happening here, so no
correction needed.

## Zero-Activity Days Must Be Included as Zeros, Not Excluded

Worked through the actual failure mode of excluding inactive days: a user
active on only 10 of 90 days, if those 80 zero-days are dropped from the
calculation, would show CoV = 0 — "perfectly consistent" — which is
exactly backwards. Zero-activity days aren't missing data; they're
meaningful observations (the user chose not to contribute), and dropping
them erases the exact signal the metric exists to capture.

## mean([]) — When to Fail Loudly vs. Handle Gracefully

Initially reasoned "the array should always have 90 elements by
construction, so no guard needed" — then reconsidered against a principle
already established elsewhere in this project (adapter.interface.js's
base-class throw, AdapterFactory's unregistered-source error): an
unexpected empty array here would signal an internal bug, not a valid
runtime state, and should fail loudly (throw) rather than silently produce
NaN that could propagate invisibly into a stored score. "No special
handling needed" and "no need to detect a bug" are different claims —
conflated them briefly, caught it on reflection.

## CoV → Score: No Provably Correct Formula, Only a Defensible Starting Point

Needed a bounded (0-100), monotonic mapping from unbounded CoV to a
user-facing score. Landed on Score = 100 × e^(-CoV/k), with k as an
explicit, named, tunable constant — not because this is mathematically
"the" answer (there isn't one; no ground-truth labels exist for
"correct" consistency), but because the shape is right and the constant
can be validated empirically. Built 4 synthetic scenarios spanning very
steady to severely bursty, checked the resulting scores landed in
intuitively appropriate bands (FRONTEND_DESIGN_SYSTEM.md's emerald/amber/
rose), and only then accepted k=1.5 as a reasonable starting calibration —
explicitly not a proven constant.

**Caught a real mistake in this process:** initially conflated two
different versions of the formula (plain e^(-CoV) vs. the k-adjusted
version) in the same explanation and gave inconsistent numbers for the
same scenario. Redid the arithmetic cleanly, one formula at a time, and
verified independently rather than trusting the first answer given. Worth
remembering: catching an inconsistency in someone else's (or an AI's)
explanation is exactly the kind of scrutiny worth applying to code review
too, not just casual conversation.

## Streaks and Trend — Product Logic, Not Statistics

calculateCurrentStreak/calculateLongestStreak/calculateTrend live in
consistencyScore.service.js, not stats.js — the same repository/service-
style boundary applied to a new pair of files: stats.js holds pure,
general-purpose math (mean, stdDev, CoV); the service holds this
product's specific interpretation of that math (what counts as a
"streak," what threshold makes a trend "improving"). Trend specifically
needed an edge case for oldAverage === 0 (division by zero) — resolved by
classifying "no prior activity, some recent activity" as "improving"
directly, and "no activity in either half" as "stable" (not
"improving" — zero to zero isn't a real change).

## Real Data Found a Genuine Edge Case Synthetic Tests Didn't Cover

Running computeConsistencyScore against my own real GitHub data (synced
in M2.2/M2.3) produced CoV ≈ 9.43 — far outside anything the hand-built
synthetic examples covered. Initially worried this was a bug. Actually
verified it by directly counting active days in the real 90-day window:
exactly 1 active day, 1 commit total. A CoV that extreme is the correct,
expected output for genuinely near-total sparsity — the formula handled
an extreme real input correctly without crashing or producing NaN, even
though no synthetic test had exercised anything nearly that sparse. This
is exactly why testing against real, messy data matters even after
careful synthetic validation — real inputs can land in corners of the
input space you didn't think to construct by hand.

### [2026-08-01] — Weighted Scoring Design & Debugging a Missing Wire-Up (M3.2)

## Why Different Signals Get Different Weights (and Different Shapes)

Not all five quality signals (README, CI, tests, recency, contributors)
are equally strong indicators of "is this a well-maintained project" —
CI/tests reflect genuine engineering practice, while contributor count is
a much weaker, more project-type-dependent signal. This justified giving
contributors the smallest weight (15 of 100) per DATABASE_DESIGN.md.

More importantly, different signals needed genuinely different *scoring
function shapes*, not just different weights:
- README: tiered (length matters, but not linearly — readmeLength exists
  in the schema specifically because presence alone isn't the full story)
- CI/Tests: binary (presence/absence, no partial credit — these are
  genuinely yes/no facts)
- Recency: smooth exponential decay (staleness is continuous, not a
  cliff — the same shape used for the CoV-to-score mapping in M3.1,
  recognized as an emerging project convention: "the underlying
  phenomenon changes gradually, so the scoring should too")
- Contributors: a small step function, not a smooth curve or binary —
  because "more contributors" isn't proportionally better past a point,
  but crossing from "solo" to "some collaboration" is a real, meaningful
  transition worth rewarding modestly

The lesson: match the function's *shape* to the actual nature of what's
being measured, rather than defaulting to one pattern everywhere just for
consistency's sake.

## The "No Black Box Numbers" Guarantee, Enforced Structurally

qualityScore is computed by summing scoreBreakdown's own values, not by a
separate formula — this isn't just tidy, it structurally guarantees the
displayed total can never drift from its displayed components. Same
principle for calculateTopFiveAggregate returning repoCountUsed alongside
the average score: a user with only 2 repos shouldn't have their "top 5
average" presented identically to someone with 20+ repos to choose from.
Transparency isn't just a nice-to-have here — DATABASE_DESIGN.md states it
as an explicit product requirement, and both of these design choices make
it true by construction, not by convention.

## Client vs. Adapter vs. Service — A Boundary Violation Caught Mid-Build

Initially had github.adapter.js's fetchRepos call calculateRepoQualityScore
directly, making the adapter's output already "fully scored." This looked
convenient but was a real architecture violation: it put app-specific
scoring weights/formulas inside a file whose entire purpose (per
BACKEND_ARCHITECTURE.md) is being a thin, swappable GitHub-to-common-shape
translator — the same layer FEATURES.md says should need zero changes when
Codeforces/CodeChef get added. Corrected boundary: the adapter fetches raw
*signals* (facts: hasReadme, hasCI, etc.) — still legitimately GitHub-
specific work — but sync.service.js is what calls the scoring service to
turn signals into points. A hypothetical Codeforces adapter would never
need to know about README/CI weights at all.

## Rate Limit vs. Concurrency — Different Problems, Different Tools

Promise.all() for independent per-repo checks (README, CI, contributors)
reduces wall-clock time but does NOT reduce total API call count — those
are two separate concepts (rate limit = total volume over a time window;
concurrency = how many requests are in flight simultaneously). By
contrast, checkHasTests's sequential-with-early-exit loop over candidate
test paths (test/, tests/, __tests__/, spec/) genuinely does reduce call
count, since finding a match on the first path means the remaining three
never need to be checked at all. Chose concurrent-within-a-repo,
sequential-across-repos as the balance — real performance gain without
unbounded simultaneous connections to GitHub.

## Debugging a Real "Design Was Right, Implementation Wasn't Finished" Bug

After building the corrected client/adapter/service boundary, real-data
verification showed qualityScore/hasReadme/etc. all still null/false, and
lastSyncedAt frozen at an old timestamp even after a fresh sync run.
Traced it methodically rather than guessing:
1. Ruled out Compass caching (re-queried, value genuinely unchanged).
2. Checked normalizeRepo's actual return shape — confirmed it never
   included lastSyncedAt, explaining why that field specifically never
   updated (schema default only fires on document creation, and $set
   never touched a field that was never in the update object).
3. Checked whether quality fields were *also* stale — they were, which
   ruled out "one missing field" and pointed at a bigger gap.
4. Read github.adapter.js's actual fetchRepos function line by line and
   found it: fetchRepoQualitySignals had been correctly *written* as its
   own function, but fetchRepos itself was never updated to actually
   *call* it. Similarly, sync.service.js's syncUserSource still just
   upserted the adapter's raw output with no call to
   calculateRepoQualityScore at all.

**Root cause type:** not a design flaw — every architectural decision
made along the way (the boundary correction, the merge-then-upsert flow)
was correct. The bug was a dropped implementation step: a function
written in isolation but never actually wired into its caller. This is a
distinct, common category of bug from "wrong logic" — worth watching for
specifically after any multi-step design discussion, by re-reading the
actual saved files rather than trusting that a discussed plan was fully
typed out.

## Real Data Validated the Fix, Not Just "No Errors Thrown"

After the fix, manually recomputed qualityScore by hand for two real repos
using the actual scoring functions and confirmed the stored values matched
(35 for a repo with a strong README + 30 contributors but no CI/tests;
~14-15 for one with a thin README + 2 contributors). "The code runs
without crashing" and "the code produces mathematically correct output"
are different claims — verified the second one explicitly, the same
discipline used for the CoV formula validation in M3.1.

### [2026-08-03] — Weak-Area Detection: Confidence Gates, Priority Multipliers, and Formula Validation (M3.3)

## Three Independent Dimensions, Not One Blended Score

The core insight of this milestone: "is this user weak here," "can I trust
that conclusion," and "how urgently should I recommend it" are three
genuinely separate questions, each needing its own mechanism:
- **Performance** (successRate vs. platformAvgSuccessRate) → determines
  whether a weakness exists at all.
- **Confidence** (attemptCount, tiered thresholds) → a GATE, not a blended
  numeric factor. DATABASE_DESIGN.md storing confidence as a categorical
  enum ('insufficient_data'/'low'/'medium'/'high'), not a number, was the
  actual clue that pointed toward this design.
- **Recency** → a MULTIPLIER on priority, never a creator of weakness on
  its own. This was proven concretely, not just argued: a topic with a
  perfect success rate but stale practice produces priority = weakness(0)
  × urgency(anything) = 0, so it can never surface, no matter how long
  neglected. An additive version (weakness + urgency) would have
  incorrectly flagged this exact case.

## Confidence Tiers — Widening Boundaries, Not Equal Buckets

<10 attempts: insufficient_data (fixed by TESTING.md's own spec).
10-24: low, 25-49: medium, 50+: high — deliberately widening ranges,
not equal-sized buckets, because statistical confidence grows quickly at
first and levels off (diminishing returns) — the same underlying
intuition as the CoV/recency decay curves elsewhere in this project,
applied to discrete tier boundaries instead of a continuous formula.

## Recency Decay, Inverted — Same Shape, Opposite Role

M3.1 and M3.2 both used e^(-x/k) so a SCORE decreases as time increases
(consistency score, repo freshness). M3.3 needed the opposite direction —
priority should INCREASE as a topic goes unpracticed longer. Rather than
inventing a new formula, used the complement: 1 - e^(-x/k). Same
mathematical shape, but recognizing it needed inverting for an opposite
role (not "how fresh" but "how neglected") was the actual insight — three
milestones now reuse the same exponential pattern for three different
purposes (bounded score, additive component, multiplicative modifier),
which is a good example of a mathematical tool being genuinely reusable
across different architectural roles, not just copy-pasted.

## Multiplicative vs. Additive Priority — Proven With a Concrete Counterexample

Tested the choice with an edge case before committing to it: a topic with
100% success rate, unpracticed for a year.
- Multiplicative: weakness(0) × urgency(~1) = 0 → correctly never flagged.
- Additive: weakness(0) + urgency(~1) = 1 → would incorrectly flag a
  topic the user is already excellent at, purely because of staleness.
This is now empirically confirmed too, not just argued: the verification
script's "Arrays" case (90% success, stale) was correctly excluded from
the final output, and "Dynamic Programming" (weak, but practiced
yesterday) still appeared but with priority ~0.008 vs. "Graphs" (equally
weak, stale) at priority ~0.605 — nearly two orders of magnitude apart for
identical stats differing only in recency, exactly the intended behavior.

## Absolute vs. Relative Weakness Threshold — A Real, Worked Comparison

Chose successRate < platformAvg - 0.10 (absolute percentage-point gap)
over a relative/multiplicative gap (successRate < platformAvg × 0.9),
after actually working through both formulas across the difficulty
spectrum (platform averages from 20% to 95%) rather than picking one on
instinct. Concluded the relative version becomes overly sensitive on
naturally hard topics (where even average performance is already low),
making the absolute gap the safer starting heuristic — but explicitly
labeled 0.10 as a tunable product decision, not a mathematically derived
constant, consistent with every other calibrated constant in this project
(CoV steepness, recency decay rate, quality score weights).

## Boundary Condition Verified, Not Assumed

isWeakTopic uses strict < (not <=), meaning a topic exactly 10 points
below the platform average does NOT qualify as weak. Verified this
concretely with a "Trees" test case sitting exactly at the boundary
(50% vs 60% average) — confirmed excluded, proving the boundary behaves
as designed rather than assuming it from reading the code.

## Separation of Per-Item Analysis from Collection-Level Operations

analyzeTopic() analyzes ONE topic and returns a full result (or an
insufficient-data placeholder) — it has no opinion on whether that topic
belongs in a final ranked list. Filtering (by weakness gate) and sorting
(by priority) both operate on the whole collection of analyzed topics, so
they belong in the orchestrating function (detectWeakAreas), not inside
analyzeTopic itself. Same single-responsibility principle applied to a
new context: collection-level concerns (filter/sort/take-top-N) are a
different responsibility from per-item concerns, mirroring the same
distinction from M3.2's top-5 repo aggregate.

## Full Synthetic Verification, Predicted Before Running

Built 5 test cases deliberately covering every boundary designed this
session (clear weakness, insufficient data, strong-but-stale, exact
threshold boundary, weak-but-fresh) and predicted the expected outcome for
each BEFORE running the script — all 5 predictions matched the actual
output exactly. This is the same discipline used for the M3.1 CoV
hand-calculation and the M3.2 quality-score spot-check: don't just trust
that code runs without errors — verify its output against independently
reasoned expectations.


### [2026-08-05] — GraphQL, Unofficial APIs, and the Adapter Pattern's Payoff (M4.1)

## Defensive Parsing for Unofficial APIs — A Recurring Pattern, Now Named

GraphQL APIs (and GitHub's OAuth token endpoint before it) can return
200 OK with an error described inside the JSON body — HTTP status alone
is not proof of a usable response. Applied the same defensive check
(verify result.data and its expected nested fields exist before trusting
the shape) across all three LeetCode client functions. This is the same
lesson recurring in a third context — "HTTP success and payload
correctness are separate claims" is now a properly internalized,
transferable principle, not a one-off fix.

## Verifying Assumptions Against Real Network Traffic, Not Just Community Docs

Community-sourced GraphQL query shapes got the overall structure right,
but one detail — whether LeetCode's timestamp field was Unix seconds or
milliseconds, and whether it arrived as a number or string — was verified
directly by inspecting real network traffic rather than trusting
secondhand documentation. This is a meaningfully higher standard than
"someone on GitHub said so," and it's the correct standard specifically
because this is an unofficial, undocumented API where secondhand sources
could themselves be stale or wrong.

## A New Category of Data: Global/Shared, Not User-Scoped

Every collection built before this project (User, ConnectedAccount, Repo,
ActivityEvent, Score, SyncStatus) is scoped to a single user via userId.
LeetCodeProblem is the first genuinely global collection — problem
difficulty/tags are the same fact regardless of which user is asking, so
caching them once and sharing across all users is both correct and
efficient. Placed the cache-check logic in the adapter (application
orchestration), not the client (raw HTTP), following the same boundary
established for GitHub — and deliberately did NOT build TTL/refresh logic
yet, since problem metadata essentially never changes; cachedAt is stored
as honest, cheap metadata for a future refresh policy without building
that policy prematurely.

## Client Functions Take Primitives, Not "credentials" — A Boundary Worth Defending

Caught (after being pushed to actually defend it, not just accept a
suggested fix) that fetchProfile initially took a whole credentials
object while every other leetcode.client.js function took a raw string
(titleSlug, username). The client layer shouldn't know about "credentials"
as a concept at all — that's an adapter/interface-level abstraction. Fixed
so all three client functions take exactly the raw value they need;
credentials.username extraction happens in the adapter, keeping the
client's signature vocabulary consistent and its coupling minimal.

## Reinterpreting an Interface Parameter for a Fundamentally Different Provider

The SourceAdapter interface's fetchActivity(credentials, sinceDate) was
designed with GitHub's server-side `since` filtering in mind. LeetCode's
endpoint has no equivalent — it returns a capped window of recent
submissions with no way to page further back or filter server-side.
Rather than treating sinceDate as meaningless for this adapter, reused it
as a CLIENT-SIDE filter after fetching, preserving its actual purpose
(avoid reprocessing already-synced submissions) even though the mechanism
had to change completely. This is a good example of preserving an
interface's INTENT across genuinely different implementations, rather
than requiring identical mechanics from every adapter.

## Concurrency Posture Should Match Actual Risk, Not Just Copy the Last Decision

Used Promise.all for GitHub's quality-signal checks (documented rate
limit, known budget) but chose sequential requests for LeetCode's
problem-metadata lookups, specifically because LeetCode's rate limit is
completely undocumented. Same underlying question (concurrent vs.
sequential) answered differently in two adapters because the actual risk
differs — deliberately more conservative where the unknown is bigger,
rather than mechanically applying the same pattern everywhere. Also
correctly noted that the metadata cache further reduces this risk over
time, as most problems become cached after a project's early syncs.

## The Real, Honest Limitation: Recent-Window Data, Not Complete History

recentSubmissionList returns only a capped window of a user's most recent
submissions, not their complete history. This means M3.3's topic success
rates are computed from "recently observed" data, not lifetime
performance — a genuine constraint of building against this specific
unofficial endpoint, not a bug. Notably, M3.3's confidence gate (built
weeks earlier, before this limitation was even known) already provides
real protection against this exact problem: a topic with too few observed
attempts — whether because the user genuinely hasn't practiced it, or
because it simply fell outside the available recent window — correctly
gets excluded rather than driving a false claim. A good example of how a
well-reasoned design principle (don't claim confidence you don't have)
can generalize to protect against a problem discovered much later.

## Bugs Caught This Session (Categorized)

- Two recurring import-path mistakes (wrong file name, default vs. named
  export) — both mistakes made once before earlier in the project,
  confirming these specific error categories need active vigilance, not
  just one-time fixes.
- A route-mounting collision: a new leetcode.routes.js would have doubled
  the URL prefix if mounted at the same base path as accounts.routes.js.
  Resolved by recognizing GitHub and LeetCode are both "connected
  accounts" under one resource group, not two separate ones — an API
  design/architecture question, not just an import fix.
- Missing normalizer import in the adapter — same "function written, never
  wired to its caller" category of bug from M3.2's quality-score
  debugging session, confirming this is a real, recurring risk after any
  multi-step design discussion, worth explicitly checking for every time.


  ### [2026-09-05] — A Real Silent Data-Loss Bug: Generalizing an Upsert Key Across Sources

## The Bug, Precisely

`bulkUpsert`'s idempotency filter (`{userId, "metadata.sha"}`) was correctly designed for
GitHub back in M2.3, including a deliberate, correct decision to keep the backing index
non-unique specifically because other sources might lack a `sha` field. That non-uniqueness
protected the DATABASE from throwing an error — but did nothing to protect the DATA itself.
Every LeetCode event's `metadata.sha` was `undefined`, so every one of a user's distinct
LeetCode submissions matched the exact same upsert filter and silently overwrote each other,
collapsing potentially dozens of real events into one.

**The precise lesson:** "the database won't error" and "the data will be correct" are
different guarantees. A non-unique index correctly avoids a crash, but doesn't prevent
silent, logically-wrong collisions if the filter itself isn't actually discriminating between
genuinely distinct records for a given data shape.

## Why This Wasn't Caught Earlier

The bug was invisible in isolation — GitHub's SHA-based filter worked perfectly for GitHub,
and the LeetCode adapter's code (client, normalizer, adapter orchestration) all worked
correctly on their own terms. The gap only existed at the SEAM between the normalizer's output
shape and the repository's assumption about that shape — and that seam was never actually
exercised until real data flowed through the full pipeline end-to-end. This is a strong,
concrete argument for why "does the code run without errors" is never sufficient validation —
this bug produced zero errors, zero exceptions, a clean "Sync completed successfully" log, and
looked entirely fine until the actual document count was checked against expectation.

## The Fix: Push the Responsibility to Where the Knowledge Actually Lives

The repository shouldn't need to know what makes an event unique for any given source — only
the normalizer that built that event actually knows. Introducing a generic `externalId` field,
populated by every normalizer according to its own source's natural unique identifier (SHA for
commits, a composite key for submissions), moves the "what makes this unique" decision to the
layer that has the actual domain knowledge to answer it correctly, while keeping the repository
completely source-agnostic. This is the same underlying principle as the SourceAdapter
interface itself — a shared contract, with each implementation responsible for fulfilling it
correctly for its own domain.

## Migration Discipline

Rather than just fixing the code going forward, ran a one-time backfill script to correct the
979 already-existing GitHub documents (which had no `externalId` yet) and manually cleared the
single corrupted LeetCode document, letting the next real sync recreate it correctly. Considered
and rejected trying to "repair" the single merged LeetCode record — deleting and letting
idempotent sync logic recreate it from scratch was simpler and provably correct, versus trying
to reverse-engineer which of several possible real submissions the corrupted document actually
represented.

### [2026-09-06] — Wiring M3.3 to Real Data: A Correct Cold-Start Result (M4.2)

## Averaging Per-User Rates, Not Pooling Raw Counts

External research surfaced a real statistical issue in the original
platformAvgSuccessRate design: pooling all users' raw accepted/total
counts together would let one heavy user (900 attempts) dominate a
benchmark meant to represent "a typical peer." Fixed by computing each
contributing user's personal topic success rate first, then averaging
those per-user rates — so a 900-attempt user counts as one data point,
same as a 50-attempt user. Evaluated this critically rather than adopting
it wholesale: confirmed it actually answered the open architectural
question, and explicitly separated two independent decisions that could
easily get tangled — "pooled vs. per-user average" is a statistical/
meaning decision; "live vs. precomputed" is an architecture/performance
decision. Settled each on its own terms: per-user averaging for
correctness now, live aggregation for M4.2 with a documented future
optimization (a precomputed PlatformTopicStats cache) once real usage
demonstrates the need.

## A Second Reliability Gate, Same Principle Applied Twice

M3.3 already gated on personal attemptCount (<10 = insufficient_data).
M4.2 adds a second, independent gate: contributingUsers < 5 means the
platform benchmark itself isn't trustworthy, regardless of how solid the
user's own personal stats are. Argued explicitly for excluding the topic
entirely rather than falling back to an arbitrary default (e.g., assume
50%) — a fabricated baseline would introduce an unsupported assumption
that could mislabel a user's actual performance, directly violating the
"don't claim confidence you don't have" principle already established for
personal data. Same honesty standard, now applied at the peer-comparison
layer too.

## N+1 Queries — Caught Before Shipping, Not After

The first working draft of getWeakAreasForUser called
getPlatformTopicBenchmark(topic) once per distinct topic in a loop — for
a user with 15 topics, 15 separate aggregation queries plus 1 for their
own stats. Recognized this as the same category of inefficiency that
motivated bulkUpsert back in M2.3 (don't ask the database the same kind
of question item-by-item when it can answer for a whole batch at once).
Redesigned getPlatformTopicBenchmarks to accept an array of topics and
return all benchmarks in one aggregation ($match with $in, grouping by
topic as one of the two group-by stages), reducing N+1 queries to exactly
2 regardless of how many topics a user has practiced.

## Verifying "Correct" and "Currently Useful" Are Different Claims

Predicted the real-data test result BEFORE running it, based on genuine
understanding of the system's actual state: with only one real user in
the database, MIN_CONTRIBUTING_USERS (5) can never be satisfied for any
topic, so every topic should be excluded regardless of actual performance.
The prediction was exactly right: "Found 0 weak areas." This result is
CORRECT, not a bug — the reliability gate is working exactly as designed,
refusing to fabricate a peer comparison it can't actually support.

**The distinct, important lesson:** code can be fully correct and still
produce a currently-unhelpful result because of a real, structural
cold-start dependency (a relative/comparative metric needs enough peers
to compare against). This is worth being able to articulate clearly to
avoid two failure modes: (1) mistaking a correct empty result for a bug
and "fixing" it by weakening the reliability gate, which would reintroduce
exactly the dishonesty the gate was built to prevent, or (2) assuming
"the code runs and returns something" is sufficient proof of correctness,
when a specific, predicted empirical outcome is a much stronger form of
verification.

## Another Instance of the "Discussed But Never Wired In" Bug Category

getWeakAreasForUser was fully designed, reasoned through, and written in
conversation — but never actually saved into weakArea.service.js or added
to its module.exports, exactly the same bug category as M3.2's missing
quality-score wire-up. This is now the third time this specific failure
mode has appeared across the project. The concrete, generalizable lesson:
after any multi-turn design discussion that produces a function meant to
be added to an existing file, explicitly re-read that file's actual
current contents and exports before assuming the design was fully
implemented — a function existing correctly in conversation is not the
same claim as a function existing in the saved file.

### [2026-09-08] — React Query Fundamentals & Nested Layout Routes (M5.1)

## Why Server State Needs Its Own Tool, Not useState

Worked through three concrete failure modes of a naive useEffect+useState
approach to fetching dashboard data: (1) multiple components independently
fetching the same data end up with separate, potentially inconsistent
copies rather than one shared source of truth; (2) after a background
sync completes, there's no mechanism for already-rendered components to
know the database changed, without hand-building polling/refetch logic
into every component that needs it; (3) loading/error state management
gets reimplemented nearly identically across every data-fetching
component. React Query's queryKey-based shared cache solves (1) and (3)
structurally, and refetchInterval solves (2) directly.

**The core mental model:** Context manages client/auth state ("who is
logged in, what auth action happened"); React Query manages server state
("what does the backend currently say"). These are genuinely different
categories — auth state is owned by the frontend's own session lifecycle,
server state is owned by the backend and can change independently of any
rendered component.

## refetchInterval as a Function, Not Just a Number

The product requirement (poll every 30s while sync is pending, otherwise
refetch-on-focus only) can't be expressed with a fixed refetchInterval
value — it genuinely requires the interval itself to be computed FROM the
current query data (checking syncStatus inside the callback). Recognizing
that a configuration option can itself be a function of the data it's
configuring was the key insight, not just knowing the option exists.

## Verifying Against the Actual Installed Version, Not Assumed API Shape

Before writing refetchInterval's callback, installed the real package,
checked the actual resolved version (v5.102.8) in package.json rather
than assuming, and confirmed the v5-specific single-argument `query`
object shape (as opposed to v4's separate `(data, query)` arguments) —
a real breaking change between major versions. This is the same
discipline applied to LeetCode's GraphQL shape earlier in the project:
verify against the real, current source (official versioned docs here,
since TanStack Query is well-documented, unlike LeetCode's unofficial
endpoint) rather than trusting a possibly-stale mental model or an
AI-generated sketch without confirming it matches the actual dependency.

## Nested Layout Routes: Composing Two Independent `<Outlet />` Layers

ProtectedRoute (auth gate) and PageLayout (visual structure: Navbar +
Sidebar) can nest as two separate layout routes, each rendering its own
<Outlet /> without either needing to know about the other's existence:
ProtectedRoute checks auth and renders <Outlet /> only if authenticated;
that Outlet renders PageLayout, which renders its OWN <Outlet /> for
whichever specific page matched. This means DashboardPage, ReposPage, etc.
can be pure, minimal content components — no repeated layout boilerplate,
no manual <PageLayout> wrapping in every page, and adding a new page only
requires one new <Route> line inside the shared layout.

## Navbar vs. Sidebar — Splitting Responsibility by What Data Each Needs

Initially considered duplicating nav links in both Navbar and Sidebar.
Settled on Navbar owning only identity/actions (user name, logout — using
useAuth(), zero dashboard data dependency) while Sidebar owns all page
navigation (using NavLink for active-route styling, matching
FRONTEND_DESIGN_SYSTEM.md's own wireframe, which already showed this
exact split). The deciding question was "what data does each component
actually need," not just "where does it look good" — Navbar needs only
auth context, Sidebar needs zero data at all (pure static links).

## Verified in the Real Browser, Not Just Reviewed as Code

Confirmed the full stack — QueryClientProvider wrapping, nested
ProtectedRoute/PageLayout routes, Navbar reading real auth state, Sidebar
rendering — actually renders correctly together in the browser, and that
logout's reactive redirect (built back in M1.3) still works correctly
through the new nested-layout structure without any special handling
needed. Confirms the M1.3 Context architecture and this session's new
routing structure compose cleanly.



### [2026-09-08/09] — Dashboard Wiring: A Missing Backend Endpoint, Discovered Through Honest Frontend Testing (M5.1)

## The Backend/Frontend Split Made a Real Gap Invisible Until Tested

Built the entire frontend consumption side (useDashboard hook, React Query
setup, SyncStatusBanner, ConsistencyScoreCard) against GET /api/dashboard
as if it already existed, because it was documented in API_DESIGN.md and
SYSTEM_ARCHITECTURE.md from the very start of the project. It didn't
exist — dashboard.controller.js and dashboard.routes.js had never
actually been built, despite Phases 2-4 building every other piece the
dashboard needed to display. This wasn't wasted frontend work (every
component was correctly designed and ready), but it's a genuine gap that
only surfaced by explicitly checking the actual controllers/ and routes/
folders, not by assuming a documented endpoint must already exist because
so much of the underlying data pipeline was already built.

**Generalized lesson:** a well-documented API contract describes intent,
not implementation status. Never assume an endpoint exists just because
its shape is specified in API_DESIGN.md — check the actual routes/
directory, the same way you'd check a normalizer's actual saved file
rather than trust that a discussed design was written down.

## Dashboard Assembly: Where Should Cross-Repository Composition Live?

GET /api/dashboard needs data from BOTH Score and SyncStatus — two
separate collections that have no natural relationship to each other
beyond both being scoped to the same user. This composition work
(fetching from two repositories and shaping one combined response)
correctly lives in a new dashboard.service.js, matching
SYSTEM_ARCHITECTURE.md's own documented DashboardController →
DashboardService.build(userId) diagram — the controller stays thin,
calling exactly one service method, same pattern as every other
controller in this project.

## Defensive Fallbacks vs. Eager Document Creation — A Real Tradeoff

For a brand-new user with no Score document yet (never synced),
considered two designs: (a) create a default Score document at
registration time, or (b) let dashboard.service.js gracefully default
every field with `??` fallbacks when the document doesn't exist yet.
Chose (b) specifically because (a) would couple authService.register()
to scoreRepository — two completely unrelated concerns (creating an
identity vs. tracking analytics) that have no reason to know about each
other. The "no accounts connected yet" empty state API_DESIGN.md already
documents as legitimate, non-error behavior is exactly the same shape of
problem as "no Score document yet" — both are honest, expected states of
a new user, handled gracefully at the READ boundary rather than forced
into existence at write time.

## A Prop-Mismatch Bug, Diagnosed Through Actual DevTools Behavior

ScoreExplanation was correctly defined, but called with the wrong prop
names (`score`/`trend` instead of `explanation`) — a smaller, more
localized version of the "discussed but never wired in correctly"
pattern that's recurred several times this project (M3.2, M4.1, M4.2),
this time as a mismatch rather than a total omission. Worth noting: a
prop being silently undefined in React doesn't necessarily crash the
whole tree by itself (React renders undefined as nothing) — the actual
blank-page cause may have been the missing backend endpoint itself
(useDashboard stuck failing/loading), resolved independently once the
route was added. Correctly treated a hacky inline workaround as
provisional, not "done," and flagged it explicitly rather than leaving it
silently in place — good instinct even under time pressure to just make
something render.

## Domain Logic Belongs Where the Domain Facts Live, Not Wherever It's Displayed

Initially considered writing "why is this score good/bad" interpretation
logic directly inside a frontend component. Recognized this as the same
shape of decision already made correctly for weak-area reasoning strings
(buildReasonString lives in weakArea.service.js, not the frontend) — if
two independent places (backend scoring logic, frontend display logic)
both decide what a number "means," they can silently drift out of sync
over time. Extended consistencyScore.service.js with
buildScoreExplanation, generating the interpretation once, backend-side,
alongside the score itself — the frontend component became purely
presentational, just displaying whatever string the backend already
computed. A reusable principle: if a UI component's logic would need to
duplicate thresholds or interpretation the backend already owns, that
logic belongs in the backend, not the component.

## React Query in Practice, Not Just in Theory

SyncStatusBanner and ConsistencyScoreCard both independently call
useDashboard() with the same queryKey, and both correctly render from one
shared cache entry with no duplicate network requests — confirmed this
empirically via the Network tab, not just trusted the theory from
earlier this session. Real, working proof of the exact caching guarantee
that motivated choosing React Query over local useState in the first
place.


### [2026-09-1x] — Timezone-Safe Bucketing & a Permanent Data Limitation (M5.2)

## UTC Storage vs. Local Display Are Different Problems, Solved at Different Layers

Back in M2.2, ActivityEvent.date was truncated to UTC midnight specifically
to give every server a single, consistent reference point regardless of
deployment location. That decision was correct for STORAGE consistency —
but it doesn't automatically make the DISPLAYED heatmap correct for a
user in a non-UTC timezone. Worked through concrete cases (a commit at
1:00 AM IST corresponds to 7:30 PM the PREVIOUS day in UTC) proving that
naively displaying UTC-truncated dates can shift activity into the wrong
calendar cell from the user's perspective.

**The resolved architecture:** keep UTC as the storage convention
(preserving the original justification), but perform local-day conversion
only at DISPLAY time, using the browser's automatic knowledge of the
user's current timezone (via plain, non-UTC Date methods:
getFullYear()/getMonth()/getDate(), the direct inverse of the backend's
getUTCDate() truncation). No timezone field needed anywhere in the
database — the browser already knows, and that knowledge is always
current even if the user travels, unlike a stored preference that could
go stale.

## A Genuine, Permanent Data-Loss Limitation — Different From Every Prior Gap

Discovered that neither github.normalizer.js nor leetcode.normalizer.js
ever preserved the RAW, untruncated timestamp — only the already-
UTC-truncated date survived normalization. This is fundamentally
different from every previous "gap" found in this project:
- M4.1's externalId gap was fixable via migration (SHA was still present
  in metadata, just not yet copied to the new field).
- This gap is NOT fixable for existing data — truncating a timestamp to
  midnight UTC destroys the time-of-day information permanently. There is
  no field anywhere containing what was discarded; a document showing
  `2026-03-14T00:00:00.000Z` carries zero information about whether the
  original event happened at 12:01 AM or 11:59 PM local time.

**Resolution:** fixed the normalizers going forward (added rawTimestamp
to metadata for all new events), and explicitly documented — not silently
absorbed — that historical events predating this fix will display using
UTC-day bucketing as an honest fallback, potentially off by one day from
the user's true local calendar day near timezone boundaries. This is
irreversible, and saying so plainly is the correct response, not trying
to engineer around an impossible recovery.

## An API Contract That Was Wrong, Not Just Incomplete

API_DESIGN.md's original GET /api/dashboard/heatmap response shape
({days: [{date, count, sources}]}) implicitly assumed the BACKEND would
group events by day before responding. Once we established that correct
grouping requires the user's local timezone — information the backend
structurally doesn't have (no timezone field exists on User) — that
original documented shape became actually impossible to fulfill
correctly, not just simplified. The endpoint's real job had to become
"return raw, ungrouped events," with the FRONTEND performing the grouping
the original design assumed the backend would do. This is a genuine
example of implementation revealing that a documented plan wasn't just
underspecified but structurally wrong given a fact (no stored timezone)
that only became relevant once someone actually tried to build the
feature correctly.

## Query Keys Must Include Every Parameter That Changes the Data

useHeatmap(days) uses queryKey: ["heatmap", days], not just ["heatmap"].
If a 90-day and 365-day heatmap request shared one cache key, React Query
would treat them as the same data, and whichever request happened to
resolve last would silently overwrite the other's cache entry — a subtle
bug that would only surface as "the heatmap shows the wrong date range"
with no error anywhere. The rule: any value that changes what the query
actually represents belongs in the key array.

## Same Code Shape, Genuinely Different Risk — Confirmed by Reasoning, Not Assumption

groupEventsByLocalDay's `counts.set(key, (counts.get(key) ?? 0) + 1)`
looks structurally identical to the exact "read-then-write" anti-pattern
that made a raw JS increment unsafe on the BACKEND ($inc's whole
justification back in M2.3). Explicitly confirmed why this frontend
instance is actually safe: JavaScript's single-threaded, synchronous
execution means there's no possibility of two iterations of this loop
interleaving — the backend risk existed specifically because multiple
independent PROCESSES could race on the same database document
concurrently. Same code pattern, genuinely different risk, entirely
because of the execution context — a reusable lesson that a pattern's
safety can't be judged from its shape alone.

## Eliminating Real Duplication, Not Just Noticing It

Caught duplicated date-key-construction logic between getLocalDateKey
(operating on events) and an inline version inside ActivityHeatmap's
calendar-cell-generation loop (operating on plain Date objects). Resolved
by extracting the actually-shared final step (Date → YYYY-MM-DD string)
into its own formatDateKey function, with getLocalDateKey becoming a thin
wrapper that extracts a timestamp from an event and delegates to it. The
general lesson: when two code paths do "the same final step" but arrive
there differently, extract the shared final step itself, rather than
either duplicating it or forcing both callers through an identical entry
point that doesn't fit one of them naturally.

## Verified With a Deliberately Chosen Edge Case, Not Just "It Looks Right"

Tested formatDateKey specifically against January 5th — the date most
likely to reveal an off-by-one bug, since getMonth() returns 0 for
January and requires the +1/padStart chain to work correctly to produce
"01" rather than "0" or "1". Ran this directly in the browser console
and confirmed the exact output before trusting the function, rather than
relying on code review alone — the same discipline applied to every real
verification in this project (hand-calculated CoV examples, real GitHub
data checks, predicted-then-confirmed weak-area results).



### [2026-09-2x] — Reinforcement, Query Validation, and Resume Generation From Scratch (M5.3)

## Extending validate.middleware.js Without Breaking Existing Callers

repos needed query-param validation (sort/limit), but validate.middleware.js
was built in M1.1 only for req.body. Extended it with a second parameter,
target = "body" (defaulted), so every existing call site
(validate(registerSchema), validate(loginSchema)) continues working
completely unchanged, while new callers opt into query validation by
explicitly passing validate(schema, "query"). This is a small, concrete
example of a general API-evolution principle: when extending a function
used elsewhere, a defaulted new parameter can add capability without
requiring any changes to existing correct code.

## Two-Layer Validation, and Recognizing When One Layer Becomes Redundant

Added Zod validation for sort/limit at the route boundary, while keeping
a lightweight defensive fallback inside the service function. Correctly
identified that Zod's presence makes the SERVICE's validation logic
redundant for requests arriving through the actual route — but chose to
keep it anyway as defense-in-depth for any future caller (a background
job, a test, a different route) that might call the service directly,
bypassing Zod entirely. The cost of keeping a trivial fallback is near
zero; the protection it offers against an unanticipated caller is real.

## A New AppError Subclass for a New HTTP Semantic

Resume generation's 30-day threshold needed a 422 response carrying
custom fields (reason, daysTracked, daysRequired) that no existing
AppError subclass supported. Rather than throwing a plain Error with
manually attached properties (which errorHandler.middleware.js wouldn't
know how to read), added a genuine new subclass, InsufficientHistoryError,
and extended errorHandler.middleware.js to conditionally include any
extra fields present on the error object using the same conditional-spread
pattern already used for weak-areas' empty-state message
(...(condition && {field}) safely contributes nothing when the condition
is false, since spreading false/null/undefined into an object literal is
a silent no-op — unlike spreading them into an array, which would throw).

## Designing generateResumeBullets: Real, Undesigned Business Logic

Unlike weak-areas and repos (pure wiring, since the underlying logic
already existed from M3.2/M4.2), resume generation was genuinely new:
a 30-day activity gate (measured from the user's EARLIEST ActivityEvent,
not their earliest connected account — a more honest measure of actual
tracked history), then mapping already-computed Score/Repo data into
natural-language bullets grouped by category. Chose a simple sorted
.findOne().limit(1) query for "days tracked" rather than an aggregation,
since the actual need (one single earliest date) doesn't warrant
aggregation machinery — the right tool matched to the actual complexity
of the question being asked, not reflexively reaching for the more
powerful tool.

## Distinguishing a Stable Business-Rule Rejection From a Transient Failure

useResumeSuggestions sets retry: false, since a 422 (insufficient history)
is a deterministic fact about current state — retrying moments later
returns the identical result, since daysTracked doesn't change that
quickly. This is a genuinely different category from a 500 or network
timeout, which COULD succeed on retry. React Query's default retry
behavior exists for the second category; applying it to the first wastes
requests and delays showing the user the correct message.

## Detecting a Specific Error Reason From the Frontend

ResumeSuggestionsPage checks error?.response?.data?.error?.reason ===
"insufficient_history" to render an encouraging progress message
("12 of 30 days tracked") rather than a generic error — treating a
meaningful, structured business-rule response differently from a genuine
failure. This required the backend error envelope to actually carry
enough structured information (reason, daysTracked, daysRequired) for
the frontend to make this distinction, which is precisely why the new
InsufficientHistoryError class needed those fields in the first place —
a good example of frontend UX requirements feeding back into backend
error design.

## Recognizing When Index-as-Key Is Actually Safe

Used key={i} for resume bullets after explicitly checking WHY this is
different from the SyncStatusBanner case where index keys were rejected:
the risk from index keys is specifically about a list's order or
membership CHANGING while already rendered. Resume bullets are generated
fresh, complete, and static per query response — never individually
reordered or mutated within one render. The principle isn't "avoid index
keys always" — it's "avoid index keys when order/membership can change
while mounted," and correctly identifying when that risk doesn't apply is
a more precise understanding than a blanket rule.

## Full Reinforcement, Confirmed Against Real Data

Built ReposPage, WeakAreasPage, and ResumeSuggestionsPage largely
independently, applying the useQuery + four-state (loading/error/empty/
data) pattern established twice already this project, without needing
the pattern re-explained. All three verified against real, live data:
repos correctly sorted by quality score (35/35/30/22, confirming
MongoDB-level sorting works), weak areas correctly showing the honest
cold-start empty state from M4.2, and resume suggestions showing a real,
correctly-generated, correctly-categorized bullet from actual computed
scores.