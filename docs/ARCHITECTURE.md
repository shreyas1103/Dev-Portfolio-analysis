# ARCHITECTURE.md

*Living document — the current, real architecture of the implemented system. Starts as a pointer to the planning documents; as implementation diverges from the original plan (as it always does somewhat), update this file to reflect reality, and note the divergence and why.*

## Current State

No implementation exists yet. The authoritative architectural plan is currently exactly what's described in:
- `SYSTEM_ARCHITECTURE.md` (overall system)
- `BACKEND_ARCHITECTURE.md` (server layering)
- `FRONTEND_ARCHITECTURE.md` (client structure)
- `DATABASE_DESIGN.md` (data model)
- `FOLDER_STRUCTURE.md` (physical layout)

## Divergences From Original Plan

_None yet — this section should be updated the first time implementation reveals the original plan needs adjustment (e.g., a folder gets restructured, an adapter interface changes shape, a collection gains/loses a field)._

Format for future entries:
```md
### [YYYY-MM-DD] — [What changed]

**Original plan:** (per which doc)
**What we actually did:**
**Why:**
**Docs updated:** (list which planning docs were revised to match, e.g. DATABASE_DESIGN.md)
```

## Related Documents

- All architecture/design docs listed above remain the detailed reference; this file is the "what's actually true right now" summary and changelog.


# Divergences From Original Plan

## D-001: Simplified Refresh Token Rotation (Option B)

### Original Plan

SECURITY.md describes refresh token rotation where each refresh operation issues a new refresh token and invalidates the previous one. This implies server-side tracking of the currently valid refresh token (or a hash/reference to it).

### Implemented Approach

M1.2 uses a stateless JWT refresh-token implementation.

On refresh:

1. Verify the refresh token using JWT_REFRESH_SECRET.
2. Generate a new access token.
3. Generate a new refresh token.
4. Overwrite the refresh-token cookie.

No refresh tokens are stored or tracked in the database.

### Reason For Divergence

The current User schema and DATABASE_DESIGN.md do not include any field for refresh-token storage or revocation tracking.

Implementing full invalidation would require:
- Schema changes
- Additional persistence logic
- Token comparison/revocation checks

This would significantly expand the scope of M1.2 beyond the documented architecture.

Following the project's principle of incremental development, the simpler stateless approach was chosen for the MVP authentication system.

### Consequences

Benefits:
- Simpler implementation
- No database changes
- Easier to understand and maintain

Limitations:
- Previously issued refresh tokens remain valid until expiry.
- Logout clears the refresh cookie but does not truly revoke already-issued refresh tokens.
- Stolen refresh tokens remain usable until their natural expiration time.

### Future Upgrade Path

A future version may implement full rotation by storing the current valid refresh token (preferably a hash) and rejecting superseded tokens during refresh operations.


### [2026-07-11] — GET /api/auth/me promoted from temporary to permanent

**Original plan:** Not present in API_DESIGN.md at all; built ad hoc in M1.2
purely to verify requireAuth middleware worked end-to-end.

**What we actually did:** Kept it as a permanent, documented endpoint.

**Why:** M1.3's frontend work revealed that POST /api/auth/refresh alone
cannot repopulate user state on page reload (it only returns an accessToken,
no user object) — the silent-refresh flow structurally needs a way to fetch
the current user after refreshing. Rather than changing /refresh's response
shape (which would be a backend contract change affecting anything already
built against it) or storing user data in localStorage (violates SECURITY.md),
keeping /me as a real endpoint is the cleanest fix.

**Docs updated:** API_DESIGN.md (endpoint added to Auth section).


### [2026-07-11] — D-002: requireAuth removed from POST /api/auth/logout

**Original plan:** `API_DESIGN.md` documents `POST /api/auth/logout` as
"Auth required: Yes." M1.2 initially implemented it this way, reasoned
deliberately at the time (logout is a protected session action; keeping
`requireAuth` preserves API contract consistency even though today it mostly
enforces semantics rather than enabling revocation).

**What we actually did:** Removed `requireAuth` from the `/logout` route.

**Why:** M1.3 browser testing revealed a real bug: `AuthContext.logout()`
clears the local access token *before* calling the backend logout endpoint
(a deliberate UX choice — the user shouldn't wait on a network round-trip to
see themselves logged out). Combined with `/auth/logout` being deliberately
excluded from the interceptor's refresh-and-retry logic (refreshing a session
purely to destroy it is nonsensical), this meant logout requests were sent
with no valid Authorization header. With `requireAuth` in place, this caused
a 401 *before the controller ever ran* — so the refresh-token cookie was
never actually cleared server-side, even though the user appeared logged out
locally. The user's session was silently still revivable via `/auth/refresh`.

Unlike `GET /api/auth/me` (which genuinely needs `req.user` to answer "who is
this"), the logout controller doesn't use `req.user` for anything — it only
clears a cookie. There's no legitimate reason for it to depend on token
validity, so requiring auth here provided no real benefit while actively
breaking the feature it was meant to protect.

**Consequences:**
- Logout now works correctly regardless of access-token state (expired,
  missing, or valid) — the cookie is reliably cleared.
- `API_DESIGN.md`'s "Auth required: Yes" for this endpoint is now inaccurate
  and should be corrected to "No" to match reality.
- This does not weaken security meaningfully: logout has no side effects
  that depend on knowing the caller's identity, and per D-001, true
  server-side revocation isn't implemented anyway (Option B).

**Docs updated:** `API_DESIGN.md` (auth requirement corrected for
`POST /api/auth/logout`).


### [2026-07-18] — D-003: OAuth `state` Redesigned as a Signed JWT (No Cookie)

**Original plan:** Initial M2.1 implementation generated `state` as random
bytes (`crypto.randomBytes`), stored it in a short-lived httpOnly cookie,
and compared the cookie's value against the callback's returned `state` to
verify the request's legitimacy.

**What we actually did:** `state` is now a short-lived (10 min), signed JWT
containing `{ userId }`, signed with a dedicated `OAUTH_STATE_SECRET`. The
callback verifies the JWT's signature and expiry, extracting `userId`
directly from the verified payload. No cookie is used anywhere in this flow.

**Why:** The original cookie-based design correctly proved "this callback
belongs to a request my server initiated," but had no way to answer "for
which user?" — since the callback route can't use `requireAuth` (GitHub's
redirect carries no Authorization header). Tracing through the actual
threat model: a plain random state doesn't itself enable a *harmful*
CSRF-style attack (an attacker tricking a victim into completing the
attacker's own flow doesn't compromise the victim), but it does leave the
core identity problem unsolved — nothing about it lets the callback know
which user's `connectedAccounts` document to touch. A signed JWT solves both
problems at once: the signature proves authenticity/integrity (equivalent
to what the cookie comparison provided), and the payload carries verified
identity directly, without a second stored value to manage, compare, or
have expire independently.

**Consequences:**
- No `oauth_state` cookie is set or read anywhere in the codebase.
- A new secret, `OAUTH_STATE_SECRET`, was added to `config/env.js` — kept
  separate from `JWT_ACCESS_SECRET`/`JWT_REFRESH_SECRET` since it represents
  a different trust domain with a different purpose and lifetime.
- The `/connect` endpoint's service function (`buildAuthorizationUrl`) now
  requires `userId` as a parameter, since it must sign that value into the
  state token.

**Docs updated:** None externally facing yet — `API_DESIGN.md`'s
description of `/connect`/`/callback` doesn't specify state's internal
implementation, so no contract change was needed, only internal design.


### [2026-08-05] — D-004: LeetCode Sync Uses Full-Window Fetch + Client-Side Date Filtering, Not Server-Side Incremental Sync

**Original plan:** SYSTEM_ARCHITECTURE.md's sync flow and the SourceAdapter
interface (fetchActivity(credentials, sinceDate)) were designed around
GitHub's model — server-side `since` filtering via a documented,
paginated REST API.

**What we actually did:** LeetCode's unofficial GraphQL endpoint
(recentSubmissionList) returns only a capped window of a user's most
recent submissions, with no way to request older data or filter
server-side. Every sync fetches this full available window, then applies
sinceDate as a CLIENT-SIDE filter after the fact, purely to avoid
reprocessing (cache lookups, normalization) of submissions already synced
— not to reduce the LeetCode API call itself, which is unavoidable
regardless.

**Why:** This is a hard constraint of the unofficial endpoint, not a
design choice. There is no pagination mechanism to walk further back in
a user's submission history, and using sinceDate to skip the fetch
entirely (rather than filtering after) risked creating silent data gaps
— a submission could fall outside the recent window before the next sync
captured it.

**Consequences:**
- LeetCode-derived activity data represents the "recently observed"
  window LeetCode exposes, not the user's complete historical submission
  record. This is an honest, documented limitation, not a bug.
- M3.3's confidence gate (attemptCount thresholds) provides meaningful,
  if incidental, protection against this limitation — a topic with too
  few observed attempts is correctly excluded from weakness claims,
  whether the sparsity is real or an artifact of the capped window.
- If LeetCode's endpoint or an alternative data source ever supports
  fuller historical access, this adapter can be updated without changing
  the SourceAdapter interface or sync.service.js at all — the interface's
  intent (avoid reprocessing) was preserved even though the mechanism
  changed completely.

**Docs updated:** None externally facing yet — this is an internal
adapter implementation detail, not a documented API contract change.

### [2026-09-05] — D-005: ActivityEvent Upsert Key Generalized to externalId (Fixing a Real Data-Loss Bug)

**Original plan:** `activityEventRepository.bulkUpsert` used `{userId, "metadata.sha"}` as its
idempotency filter, designed during M2.3 when GitHub was the only source. This was documented
and reasoned through carefully at the time, including a deliberate decision to keep the
underlying index non-unique (correctly anticipating that other sources' events might lack
a `sha` field).

**What we actually discovered:** That non-uniqueness precaution correctly prevented a database-level
error, but it didn't prevent the actual bug: every LeetCode `ActivityEvent` had `metadata.sha`
`undefined` (LeetCode submissions have no SHA at all), so every single LeetCode submission's
upsert filter evaluated to the same `{userId, "metadata.sha": undefined}` — meaning all of a
user's distinct LeetCode submissions silently collapsed into a single, repeatedly-overwritten
document. Verified against a real, live LeetCode account: 16 distinct problems were correctly
fetched and cached, but only 1 `ActivityEvent` existed where there should have been 20+.

**Why this happened:** The original design was correct for its one known use case (GitHub) but
implicitly baked in a source-specific assumption (every event has a meaningful SHA) into
shared, source-agnostic infrastructure. This surfaced only once a second, structurally different
source was actually built and tested against real data — the exact kind of gap unit tests
against synthetic/assumed data can miss, since a synthetic LeetCode fixture built by hand might
easily have included a plausible-looking `sha` field without anyone noticing it wasn't real.

**What we actually did:** Introduced a new required field, `externalId`, that every normalizer
(not the repository) is responsible for producing — a single, source-agnostic string uniquely
identifying one event, regardless of source's specific data shape:
- GitHub commits: `externalId = commit SHA`
- LeetCode submissions: `externalId = "{titleSlug}-{timestamp}"` (a composite key, since a user
  can submit to the same problem multiple times)

`activityEventRepository.bulkUpsert`'s filter changed from `{userId, "metadata.sha"}` to
`{userId, externalId}` — now genuinely source-agnostic, with zero knowledge of any provider's
internal field names. A future Codeforces/CodeChef adapter only needs to ensure its own
normalizer populates `externalId` correctly; the repository requires no changes at all.

**Migration:** A one-time script (`migrate-external-id.js`, deleted after use) backfilled
`externalId = metadata.sha` on all 979 existing GitHub `ActivityEvent` documents. The single
corrupted, repeatedly-overwritten LeetCode document was deleted and correctly recreated by
the next real sync, this time producing one distinct document per real submission.

**Consequences:**
- All future adapters must ensure their normalizer populates a genuinely unique `externalId`
  per event — this is now a documented, enforced contract (schema-level `required: true`),
  not just an implicit convention.
- This is a genuine example of a real, live data-integrity bug — not a design gap caught in
  review, but an actual silent data-loss bug that had been running against real user data for
  some time before being caught, specifically because a second, structurally different source
  was tested end-to-end rather than assumed to behave like the first.

**Docs updated:** `DATABASE_DESIGN.md`'s `ActivityEvent` schema should be updated to include
`externalId` as a documented, required field alongside the existing ones.


### [2026-09-06] — Known Limitation: Weak-Area Detection Requires a Minimum User Base (Cold-Start Dependency)

**What we discovered:** getWeakAreasForUser correctly returns an empty
list for every user until at least MIN_CONTRIBUTING_USERS (5) users have
practiced a given topic on LeetCode. This is not a bug — it is the
correct, intended behavior of the platform-benchmark reliability gate
added in M4.2 (see LEARNING_NOTES). With a small early user base, this
gate can never be satisfied for any topic, so weak-area detection will
show no results for anyone, regardless of their actual performance.

**Why this is the right behavior, not a flaw:** Weak-area detection is
fundamentally a relative comparison (user vs. peers). Without enough real
peer data, any claimed benchmark would be statistically meaningless or
outright fabricated. The system correctly refuses to pretend it has a
reliable comparison when it doesn't, consistent with the confidence-gate
principle already established for personal attempt counts.

**Product consequence to address later (not now):** Once a larger user
base exists, this resolves itself naturally as MIN_CONTRIBUTING_USERS
gets satisfied for popular topics. Until then, the "Weak Areas" page will
show an empty state for every user. Per USER_FLOW.md's existing pattern
for insufficient personal data ("Keep practicing — we need at least 10
attempts..."), a similar honest, explicit empty-state message should
eventually be added for the "not enough platform data yet" case
specifically — distinct from "not enough personal data" — so users
understand why the feature shows nothing, rather than assuming it's
broken. This is a frontend/UX task for a later milestone, not a backend
correctness issue.

**Docs updated:** None yet — flagging here for future UX/frontend work
when the Weak Areas page is built (Phase 5).


### [2026-09-1x] — D-006: Historical ActivityEvents Lack rawTimestamp — A Permanent, Unrecoverable Limitation

**What happened:** Building the timezone-safe activity heatmap (M5.2)
required the ORIGINAL, untruncated timestamp of each event to correctly
bucket it into the user's local calendar day. Neither github.normalizer.js
nor leetcode.normalizer.js ever preserved this — only the already-
UTC-truncated `date` field was stored. This was never caught before
because M2.2/M4.1's own testing never needed anything more precise than
"which UTC day did this happen on."

**Why this is unlike every prior divergence/limitation in this project:**
Every previous gap (M2.2-vs-M3.2 scope, M4.1's externalId, M4.2's
platform-benchmark cold start) was either a deliberate scope decision or
a fixable implementation gap where the needed data existed somewhere and
just hadn't been wired through yet. This one is neither. Truncating a
timestamp to midnight UTC is a lossy, one-way transformation — there is
no field, no backup, no derivable source anywhere in the existing
database that contains what was discarded. A stored value of
`2026-03-14T00:00:00.000Z` is permanently indistinguishable from any
other moment on that same UTC calendar day.

**What we did:**
- Fixed both normalizers going forward: `metadata.rawTimestamp` now
  preserves the original, untruncated timestamp for every newly-synced
  event (GitHub commit author date; LeetCode submission timestamp
  converted to milliseconds).
- Did NOT attempt a migration — confirmed explicitly that none is
  possible, rather than leaving this ambiguous or silently working
  around it.
- The frontend's heatmap bucketing function (`getLocalDateKey`) falls
  back to the UTC-truncated `date` field when `rawTimestamp` is absent,
  documented explicitly as a known-imprecise fallback for historical
  data, not treated as equivalent to the precise, local-day-correct
  bucketing new events receive.

**Consequences:**
- Events synced before this fix may display in the heatmap on a
  UTC-day basis rather than the user's true local calendar day — visible
  only as a potential one-day shift near timezone boundaries (a user
  whose local day starts several hours before/after UTC midnight).
  This is a minor, cosmetic imprecision, not a data-corruption risk —
  the underlying activity is still correctly counted and dated within
  one day of accuracy.
- All events synced after this fix ships will bucket correctly by the
  user's actual local day.
- This also changed a documented API contract: `API_DESIGN.md`'s original
  `GET /api/dashboard/heatmap` response shape assumed backend-side
  grouping, which is structurally impossible without a stored user
  timezone (confirmed: `User.js` has no timezone field). The endpoint's
  real, corrected job is returning raw, ungrouped events; the frontend
  performs local-day grouping using the browser's automatic timezone
  knowledge.

**Docs updated:** `API_DESIGN.md`'s heatmap endpoint response shape
corrected to reflect raw event data, not pre-grouped daily counts.