# GLOSSARY.md

| Term | Definition |
|---|---|
| Adapter (adapter pattern) | A module that wraps an external system's specific interface behind a shared, internal-facing interface, isolating the rest of the codebase from that system's quirks. |
| Access token | A short-lived credential proving a user's identity for a limited time, sent with each authenticated request. |
| ActivityEvent | This project's unified internal representation of any tracked action (commit, submission, contest) across all connected platforms. |
| Authorization vs. Authentication | Authentication confirms *who* a user is; authorization confirms *what* they're allowed to do/access. |
| Background job | Code executed outside the normal request/response cycle, typically on a schedule or queue, used here for external data syncing. |
| bcrypt | A slow, adaptive password-hashing algorithm resistant to brute-force attacks. |
| Coefficient of variation (CoV) | Standard deviation divided by the mean; used here to measure activity consistency independent of total volume. |
| Confidence (weak-area) | A label (`insufficient_data` / `low` / `medium` / `high`) indicating how much attempt data backs a weak-area assessment. |
| Consistency Score | This project's 0–100 metric of how regularly (not just how much) a user practices, based on CoV over a 90-day window. |
| CORS (Cross-Origin Resource Sharing) | A browser security mechanism controlling which origins may make requests to a server. |
| CSRF (Cross-Site Request Forgery) | An attack tricking a logged-in user's browser into making an unwanted authenticated request. |
| Difficulty-weighted success rate | A success-rate metric where harder problems count more than easier ones, used in weak-area detection. |
| Empty state | A deliberately designed UI view for when there's no data yet, rather than a blank or broken-looking screen. |
| Encryption at rest | Encrypting stored data (e.g., external API tokens) so it's unreadable even if the underlying storage is compromised. |
| Fault isolation | Designing a system so that one component's failure doesn't cascade into unrelated components' failures. |
| Graceful degradation | A system's ability to continue functioning (with reduced but honest capability) when a dependency fails, instead of breaking entirely. |
| GraphQL | A query language for APIs allowing clients to request exactly the data shape they need (used by LeetCode's unofficial endpoint). |
| Helmet | An Express middleware that sets several security-related HTTP response headers. |
| httpOnly cookie | A cookie flagged inaccessible to JavaScript, mitigating XSS-based token theft. |
| Idempotent | An operation that produces the same result no matter how many times it's applied — critical for safe retry/upsert logic. |
| JWT (JSON Web Token) | A signed, self-contained token format used here for stateless authentication. |
| Middleware (Express) | A function that runs during the request/response cycle before the final route handler, used for auth, validation, error handling, etc. |
| Normalization (data) | Transforming heterogeneous source data into one consistent internal shape. |
| Normalization vs. Denormalization (DB) | Structuring data as separate, referenced collections (normalized) vs. embedding/precomputing data together (denormalized) for read efficiency. |
| OAuth 2.0 | An authorization protocol letting a user grant an app limited access to their account on another service (e.g., GitHub) without sharing their password. |
| Presentational vs. container component | A React pattern separating pure rendering logic (presentational) from data-fetching/state logic (container). |
| Project Quality Score | This project's 0–100 per-repo score based on README, CI, tests, recency, and contributor signals. |
| Rate limiting | Restricting how many requests a client (or the app itself, against an external API) can make in a given time window. |
| React Query (TanStack Query) | A library managing server-state caching, refetching, and synchronization in React apps. |
| Recency decay | Reducing the weight/confidence of older data as it ages, used to flag "at risk" topics not practiced recently. |
| Refresh token | A longer-lived credential used to obtain new access tokens without re-authenticating. |
| Repository (backend layer) | The code layer responsible solely for database queries, isolating persistence details from business logic. |
| Resume Suggestion Generator | The feature that produces data-backed resume bullet points from a user's computed scores. |
| Service (backend layer) | The code layer containing business logic, orchestrating repositories and adapters. |
| Sync status | Per-user, per-platform metadata tracking whether the last data sync succeeded, failed, or is pending. |
| Weak-Area Detection | The feature that ranks topics needing attention using difficulty-weighted success rate, recency, and confidence. |
| XSS (Cross-Site Scripting) | An attack injecting malicious script into a page viewed by other users, mitigated here via React's default escaping and avoiding raw HTML rendering. |
| Zod | A TypeScript/JavaScript schema validation library used here for both environment variable and request-body validation. |

## Related Documents

All terms above are used throughout `SYSTEM_ARCHITECTURE.md`, `BACKEND_ARCHITECTURE.md`, `DATABASE_DESIGN.md`, `SECURITY.md`, and `LEARNING_MAP.md` — refer back to those for full context on each term's application.
