# INTERVIEW_NOTES.md

*Living document — running notes on concepts you can now confidently discuss in an interview, and ones you still need to revisit. Updated at the end of relevant sessions. Cross-reference `INTERVIEW_PREP.md` for the full Q&A treatment.*

## Confidently Interview-Ready

_None yet — will populate as milestones are completed and concepts are actually practiced, not just read._

## Needs Revisiting Before an Interview

_None yet._

## How to Use This File

When a session covers a concept from `INTERVIEW_PREP.md` deeply enough that you could explain it unprompted to an interviewer (not just recognize it), move it to "Confidently Interview-Ready" with the date. If you found a concept shaky even after building it, note it under "Needs Revisiting" with what specifically felt weak.

## Related Documents

- `INTERVIEW_PREP.md` — full question/answer treatment per concept
- `LEARNING_MAP.md` — concept inventory with interview-importance ratings



## Confidently Interview-Ready

### [2026-07-08] Password Hashing with bcrypt
Understand why passwords must never be stored in plaintext, how bcrypt hashing
works conceptually (salt + deliberately slow algorithm), and why the cost factor
is a tunable security/performance trade-off.

### [2026-07-08] Custom Error Handling (AppError hierarchy)
Can explain how custom error classes centralize HTTP status + error code per
error type (making invalid combinations unrepresentable), why controllers use
next(err) instead of handling errors themselves, and how centralized error
middleware converts exceptions into consistent API responses.

### [2026-07-08] .lean() in Mongoose
Can explain that .lean() returns a plain JS object instead of a full Mongoose
document (skipping methods, getters/setters, change tracking), and why that's
cheaper for read-only queries — relevant at the read-heavy scale this project
targets.

### [2026-07-08] Express error-middleware arity
Can explain that Express distinguishes error-handling middleware from normal
middleware by checking fn.length (declared parameter count) — 4 params
((err, req, res, next)) routes there specifically when next(err) is called.

## Needs Revisiting Before an Interview

### [2026-07-08] Repository/Service boundary — the testability argument
I can describe *what* the repository/service split is, but couldn't yet generate
*why it matters for testing*, unprompted, from scratch. The core idea: mocking
a repository function I wrote myself (e.g. userRepository.findByEmail) is trivial
and fast; mocking Mongoose's own internals directly is fragile and turns a "unit"
test into something closer to an integration test. Revisit this by actually
writing a real Jest test for auth.service.js once M6.2 (Testing Pass) arrives —
this will likely make it click permanently.



## Confidently Interview-Ready

### [2026-07-10] JWT Access/Refresh Token Design
Can explain why access tokens are short-lived and refresh tokens are long-lived,
why they use separate secrets (isolating the two trust domains — a leaked
access-token secret can't forge refresh tokens and vice versa), why access
tokens travel in the Authorization header while refresh tokens live in an
httpOnly cookie.

### [2026-07-10] Refresh Token Rotation: Option A vs Option B Trade-off
Can explain from scratch: Option A (server-side storage/tracking of the current
valid refresh token, enabling true revocation) vs Option B (stateless — new
tokens issued each refresh, but old ones remain valid until natural expiry).
Understand the concrete security trade-off and can justify why Option B was
the right choice for this project's current documented scope.

## Needs Revisiting Before an Interview

### [2026-07-10] Cookie flags — Strict vs Lax vs None (sameSite)
I understand what httpOnly, secure, and sameSite each protect against in
general terms, but want to nail the precise behavioral difference between
sameSite=Strict, Lax, and None before an interview — specifically what each
one actually blocks vs allows for cross-site requests, and why this project
uses Lax rather than Strict (frontend on Vercel, backend on Render — different
origins, and Strict would break the legitimate refresh flow between them).
Revisit: MDN's Set-Cookie/SameSite docs, and re-derive the answer to "why not
Strict" from the actual deployment topology in DEPLOYMENT.md, not from memory.



## Confidently Interview-Ready

### [2026-07-11] Protected Routes / Route Guards
Can explain the three-way status branch (loading/authenticated/unauthenticated)
and specifically why a boolean isn't sufficient — the "flash redirect" problem
during silent-refresh-on-load. Can explain why `replace` matters for the
back-button experience on guard redirects specifically.

### [2026-07-11] The Logout/requireAuth Collision
Can explain this as a real, self-found bug: two independently-reasonable
decisions (clear state immediately for good UX; exclude logout from refresh
retry logic) combined to break a third (requireAuth on logout), and can
articulate why the fix (removing requireAuth) is correct — because the
endpoint's actual logic never depends on `req.user`.

## Needs Revisiting Before an Interview

### [2026-07-11] CORS — the underlying mechanism
I understand CORS as "the browser blocked this cross-origin request until I
configured an allow-list," and I fixed it correctly, but I'd want to be able
to explain precisely what the browser's preflight OPTIONS request is checking
for, and why credentialed requests (cookies) have stricter CORS rules than
plain requests, before an interview. Revisit: MDN's CORS documentation,
specifically the preflight and credentialed-requests sections.

## Confidently Interview-Ready

### [2026-07-19] Cross-Source Data Normalization
Can explain why a unified ActivityEvent model needs a shared envelope
(userId/source/type/date) plus a flexible metadata field, why date is
truncated to day-level in UTC specifically (not server-local time), and
why explicit null is used for source-inapplicable fields rather than
omitting them. This is the concept LEARNING_MAP.md flags as most relevant
to system design interviews in this whole project, and I can walk through
the actual reasoning, not just recite the schema.

### [2026-07-19] Pagination Strategy Trade-offs
Can explain why following the Link header's rel="next" is more robust than
"fetch until empty comes back" — specifically the wasted-request edge case
when a result count is an exact multiple of per_page — and why silently
missing paginated data is a worse failure mode than a visible error.

## Needs Revisiting Before an Interview

### [2026-07-19] Rate-limit handling at real scale
I understand and can explain why M2.2 only implements awareness (reading
X-RateLimit-Remaining) rather than active throttling, and I did the math
on why this will matter sooner than it might seem (201 calls per user's
full sync, compounding across many users). But I haven't yet built or seen
the actual backoff/retry/queueing mechanism that would be needed at real
scale (BullMQ + Redis, per SCALABILITY.md) — revisit once that's actually
built, likely in a later Advanced-tier milestone, so I can speak to the
concrete implementation, not just the deferred plan.


## Confidently Interview-Ready

### [2026-07-25] Idempotent Writes (Upserts)
Can explain the difference between idempotent (PUT-like) and non-idempotent
(POST-like) operations, why insertMany() on repeated sync runs corrupts a
consistency score by counting the same activity multiple times, and how a
unique-key-based upsert filter (userId + a natural identifier like a commit
SHA) makes repeated writes safe. Can also explain why that filter should
sometimes NOT be a unique database index (heterogeneous collections where
the identifying field is legitimately absent on other document types would
cause unrelated documents to collide on a shared null value) versus when
it's correct to enforce uniqueness at the DB level (fields that are always
required and present, like {userId, source} on SyncStatus).

### [2026-07-25] Fault Isolation as a Hierarchy
Can explain fault isolation isn't a single try/catch "at the top" — it's
nested at every level where independent units of work exist (per-source
inside a user's sync, per-user inside the whole batch), so a failure at
any level is contained before it can cascade to siblings or the level
above. Can walk through a concrete example: one user's revoked GitHub
token failing shouldn't stop that user's LeetCode sync, and shouldn't stop
sync for the other 99 users in the batch either.

### [2026-07-25] Eventually Consistent Background Sync
Can explain why a background sync job doesn't need to wrap external API
calls in a database transaction: idempotent upserts mean a partial failure
(interrupted mid-sync) is safe to simply retry, since repeating already-
completed work is harmless. This is what allows the system to be "safe but
partially incomplete" temporarily rather than needing atomic all-or-
nothing success — and why wrapping a transaction around slow, unreliable
external I/O would be the wrong design in the first place.

### [2026-07-25] OAuth CSRF via Signed JWT state (carried over, still solid)
Can explain the account-linking attack a plain random state cookie doesn't
fully solve, and why encoding userId into a signed, short-lived JWT (a
separate secret from access/refresh tokens) closes the gap without needing
a second stored value to compare against.

## Needs Revisiting Before an Interview

### [2026-07-25] $inc and Atomicity — the General Principle
I can explain why $inc avoids the lost-update race condition in this
specific MongoDB context, but I'd want to be able to generalize this to
other datastores/languages under pressure — e.g., how this same problem
and fix show up with SQL's UPDATE ... SET x = x + 1 (also atomic at the
row level) versus, say, an in-memory counter shared across Node.js worker
threads (would need a different mechanism entirely, since there's no
database enforcing atomicity there). Revisit: think through 2-3 different
concurrency contexts and how each one's fix differs, so the concept isn't
tied to one specific tool.

### [2026-07-25] Rate limiting at real scale (still open from M2.2)
Still haven't built or seen the actual backoff/retry/queueing mechanism
SCALABILITY.md describes (BullMQ + Redis) — I understand why it's
deferred and did the math on why it'll matter, but I can only speak to the
plan, not a working implementation yet. Revisit once that's actually built.

## Confidently Interview-Ready

### [2026-07-27] Coefficient of Variation for Consistency Scoring
Can explain why CoV (not raw stdDev or a simple average) is the right
metric for comparing "steadiness" across users with different total
activity levels, why population variance (not sample) is correct when the
window IS the complete population being measured rather than a sample
used for inference, and why zero-activity days must be included as
explicit zeros rather than excluded (excluding them can make a genuinely
sporadic user's CoV collapse to 0, the opposite of the truth).

### [2026-07-27] Validating a Heuristic Scoring Formula Without Ground Truth
Can explain the actual process, not just recite it: build synthetic
fixtures spanning realistic scenarios, check the resulting scores against
intuitive product expectations, and treat any tunable constant (like the
CoV-to-score steepness) as an empirically-adjusted starting point rather
than a mathematically derived "correct" answer. Can also speak to a
concrete instance of getting this validation process wrong initially
(conflating two formula variants) and catching it through careful
re-verification — a real example of the discipline this process requires,
not just the theory of it.

## Needs Revisiting Before an Interview

### [2026-07-27] Trend Detection — Simple Heuristic vs. More Rigorous Methods
I can explain and defend the split-window relative-threshold approach I
built, but haven't studied more statistically rigorous trend-detection
methods (e.g., linear regression slope, exponential smoothing) that a more
mature version of this feature might use. Revisit if asked to compare
approaches — I should be able to name at least one more sophisticated
alternative and explain the complexity/interpretability trade-off, not
just defend the one I built.

## Confidently Interview-Ready

### [2026-08-01] Weighted Scoring Design (Multi-Signal Composite Scores)
Can explain how to design a composite score from multiple signals with
different reliability/importance: assign weights reflecting each signal's
actual strength as a quality indicator (not equal weighting by default),
and — more importantly — choose each sub-score's *functional shape*
(binary, tiered, smooth decay, step function) to match the true nature of
what's being measured, rather than applying one pattern everywhere. Can
give concrete examples of each shape and justify why that shape fits that
specific signal (e.g., why contributor count is a step function, not a
smooth curve — "more isn't proportionally better past a point, but
crossing from solo to collaborative is a real transition").

### [2026-08-01] Structural Transparency ("No Black Box Numbers")
Can explain how to make a transparency guarantee true by construction
rather than by convention: computing a total score by summing its own
displayed breakdown (not via a separate formula) means the total can never
drift from its components. Can also explain why an aggregate like a
top-5-average needs to honestly report its own sample size (repoCountUsed)
rather than presenting a 2-repo average identically to a 20-repo average.

### [2026-08-01] Adapter/Client/Service Boundaries Under Pressure
Can explain a real instance of catching my own boundary violation: put
app-specific scoring logic inside a GitHub adapter because it was
"convenient" for the adapter's output to already be fully scored, then
recognized this coupled app-specific business rules into a layer meant to
be provider-agnostic and swappable. Can articulate the concrete test used
to catch it: "would a different adapter (Codeforces) need to know about
this logic?" — if yes, it's in the wrong layer.

### [2026-08-01] Rate Limits vs. Concurrency (Distinct Concepts)
Can explain these are genuinely separate axes — total request volume over
a time window vs. how many requests are in flight simultaneously — and
that Promise.all() only affects the second, not the first. Can also
identify a case (early-exit search across candidate paths) where
sequential execution is actually the better choice because it reduces
total call count, not just because it's "simpler."

## Needs Revisiting Before an Interview

### [2026-08-01] Debugging Methodology — Generalizing Beyond This One Instance
I can walk through the specific debugging session where I traced a "design
was right, implementation wasn't finished" bug (a function written but
never called from its intended caller) using evidence — checking real
document timestamps, ruling out caching, comparing expected vs. actual
values field by field. I'd like to be able to generalize this into a
crisper, reusable framework I could state upfront in an interview (e.g.,
"reproduce, isolate the smallest failing unit, verify each layer's output
independently, don't trust 'no errors thrown' as proof of correctness")
rather than only being able to narrate this one specific example well.
Revisit by consciously naming the general steps next time a similar bug
comes up, rather than only recognizing the pattern in hindsight.


## Confidently Interview-Ready

### [2026-08-03] Multi-Dimensional Scoring: Gates vs. Modifiers vs. Magnitude
Can explain how to decompose a "how weak/good is X" score into genuinely
independent dimensions — magnitude (how weak), confidence (a gate that
can suppress the entire assessment, not a blended factor), and urgency
(a multiplier that can only ever reduce/redirect priority, never create
a weakness on its own). Can give the concrete counterexample that proves
why recency must be multiplicative, not additive — a perfect performer on
a stale topic must never be flagged, and only multiplication guarantees
that structurally.

### [2026-08-03] Reusing a Mathematical Shape for Different Architectural Roles
Can explain using e^(-x/k) three times across a project for three
different purposes — a direct bounded score, one additive component in a
weighted sum, and (inverted, as 1 - e^(-x/k)) a multiplicative urgency
factor — and can articulate why recognizing "same shape, different role"
is a more sophisticated design insight than either avoiding reuse
entirely or copy-pasting the same formula verbatim without adapting its
role.

### [2026-08-03] Validating Heuristic Thresholds With Constructed Edge Cases
Can describe the actual process of choosing between two candidate formulas
(absolute vs. relative weakness gap) by working through concrete numbers
across a realistic range (platform averages from 20% to 95%) rather than
picking one on instinct, and can explain the specific failure mode that
ruled out the relative version (over-sensitivity on inherently hard
topics). Can also state clearly that the final choice is a labeled,
tunable product heuristic, not a proven-optimal constant — and why that
honesty matters for a scoring system with no ground-truth labels.

## Needs Revisiting Before an Interview

### [2026-08-03] Real LeetCode Data Validation (Blocked on Phase 4)
Everything in M3.3 is verified against carefully constructed synthetic
data, predicted and confirmed correct — but not yet against real,
messy LeetCode submission data, since the LeetCode adapter doesn't exist
yet (Phase 4). I should revisit this milestone once real data is
available, the same way M3.1's hand-calculated examples were later
stress-tested against real GitHub activity and surfaced a genuine edge
case (near-total sparsity) the synthetic examples hadn't covered. I
should expect something similar might happen here too, and not assume
the synthetic validation alone is sufficient proof for production use.


## Confidently Interview-Ready

### [2026-08-05] Defending Against Unofficial/Undocumented APIs
Can explain the concrete practices this required: defensive parsing of
GraphQL's 200-OK-with-errors convention, verifying assumptions against
real network traffic rather than trusting secondhand community docs,
choosing conservative sequential requests over concurrent ones
specifically because the rate limit is unknown (versus GitHub, where a
documented budget justified controlled concurrency), and treating a
"recent window only" data limitation as an honest, documented constraint
rather than a hidden gap.

### [2026-08-05] The Adapter Pattern's Payoff, Concretely Observed
Can point to the literal one-line AdapterFactory change that registered
a second, structurally very different provider (GraphQL vs REST, no
OAuth vs OAuth, unofficial vs official, no documented rate limit vs
5000/hour) without touching sync.service.js at all — direct proof that
the interface design decisions made months earlier (why every adapter
implements all three methods even when meaningless, why credentials are
passed in rather than looked up internally) paid off exactly as intended
when a second real source was actually added.

### [2026-08-05] Global/Shared Data vs. User-Scoped Data in a Data Model
Can explain when a new collection needs fundamentally different design
treatment than the rest of a per-user data model — LeetCodeProblem is
global reference data (same fact for every user), so it's cached once
and shared, with no userId scoping and no per-user duplication, unlike
every other collection in this schema.

## Needs Revisiting Before an Interview

### [2026-08-05] Real LeetCode Data Validation (Still Pending)
Everything in M4.1 is built and reasoned through carefully, but not yet
tested end-to-end against a real, live LeetCode account and a real sync
run the way GitHub's adapter was validated in M2.2/M2.3. I should expect
this to surface at least one real surprise, the same way real GitHub data
surfaced a genuine sparsity edge case in M3.1 and a missing-wire-up bug
surfaced in M3.2 — synthetic/community-sourced verification is a good
first pass, not a substitute for testing against a live account.



## Confidently Interview-Ready

### [2026-09-1x] Timezone-Safe Date Handling (UTC Storage, Local Display)
Can explain the precise mechanism of the bug (a commit near midnight
local time can land on the "wrong" UTC calendar day) with a concrete
worked example, why UTC storage remains correct despite this (a
single universal reference point, independent of server/deployment
location), and why the fix belongs at DISPLAY time in the frontend
rather than requiring a stored user timezone — the browser already knows
this automatically, and that knowledge stays current without any stored
state to go stale.

### [2026-09-1x] Recognizing and Communicating a Permanent Data Limitation
Can explain a real, irreversible data-loss situation clearly: why
truncating a timestamp to midnight is a lossy, one-way operation with
literally nothing to migrate from, how this differs from every other
"fixable gap" found earlier in the project, and why the correct response
is fixing the issue going forward while explicitly documenting the
historical limitation rather than either ignoring it or attempting an
impossible recovery.

### [2026-09-1x] React Query Cache Keys Must Reflect Every Data-Changing Parameter
Can explain why queryKey: ["heatmap", days] is necessary rather than just
["heatmap"], and the specific silent-bug failure mode (wrong date range
displayed, no error thrown) that omitting a parameter from the key would
cause.

## Needs Revisiting Before an Interview

### [2026-09-1x] None new this session — all core concepts confidently articulated
This session's material was thoroughly reasoned through in real time
rather than surfacing gaps to revisit later — worth noting this pattern
itself: sessions involving genuine architectural discovery (like the
rawTimestamp limitation) tend to produce stronger retained understanding
than sessions that proceed smoothly, since the reasoning had to hold up
under real scrutiny of a real, unresolved problem.


## Confidently Interview-Ready

### [2026-09-2x] Extending Shared Infrastructure Without Breaking Existing Callers
Can explain adding a defaulted parameter to validate.middleware.js
(target = "body") to support query-param validation, and why this is
backward-compatible by construction — every existing call site keeps
working unchanged, since omitting the new parameter reproduces the old
behavior exactly.

### [2026-09-2x] Building a New Error Category Into an Existing Hierarchy
Can explain adding InsufficientHistoryError as a new AppError subclass
carrying custom structured fields, and extending the centralized error
handler to conditionally surface those fields — without touching any
existing error type's behavior. Can also explain the frontend payoff:
structured error fields let the UI distinguish a meaningful business-rule
response (show progress) from a generic failure (show an error message).

### [2026-09-2x] Choosing Retry Behavior Based on Failure Category
Can explain why retry: false is correct for a deterministic 422 (a stable
fact about current state that retrying can't change) versus React Query's
default retry behavior, which exists for genuinely transient failures —
and can generalize this to "does retrying this exact request have any
chance of producing a different result" as the actual deciding question.

### [2026-09-2x] Precise (Not Blanket) Rules About React Keys
Can explain why index-based keys are fine for resume bullets but wrong
for sync-status entries — the risk is specifically about list order/
membership changing while mounted, not index keys categorically. Can
identify which situation applies to a given list by asking whether that
specific array can be reordered or mutated during its own render
lifecycle.

## Needs Revisiting Before an Interview

### [2026-09-2x] The Unexplained Transient Blank Page
Hit a genuine blank-page failure that resolved itself before being fully
diagnosed (likely a dev-server hot-reload artifact after several
simultaneous file changes, though not confirmed). Unlike every other bug
in this project, this one wasn't root-caused before moving on. Worth
remembering this happened and, if it recurs, actually diagnosing it
properly next time rather than treating "it resolved on refresh" as
sufficient — an intermittent bug that goes away isn't the same as a bug
that's understood.