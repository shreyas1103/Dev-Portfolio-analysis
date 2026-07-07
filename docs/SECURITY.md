# SECURITY.md

Every measure below exists for a specific, named reason — not "because it's standard practice."

## JWT (Access + Refresh Tokens)

**Why it exists:** Stateless authentication that scales without a server-side session store, while still supporting revocation via refresh-token rotation.
- Access token: short-lived (~15 min), sent in `Authorization: Bearer` header, held only in memory on the client (see Cookies vs Local Storage below).
- Refresh token: longer-lived (~7 days), stored as an **httpOnly, secure, sameSite=strict cookie** — never accessible to JavaScript, which is the specific defense against token theft via XSS.
- Refresh tokens are rotated on use (each refresh issues a new refresh token and invalidates the old one) — this limits the damage window if a refresh token is ever leaked.

## Password Hashing (bcrypt)

**Why:** Passwords must never be stored in a recoverable form. bcrypt is deliberately slow (adaptive cost factor) which resists brute-force/rainbow-table attacks far better than fast hashes like SHA-256.
- Cost factor of 10–12 (balances security against login latency).
- Never log passwords, even hashed, in any log statement.

## Cookies vs. Local Storage

**Why this matters:** `localStorage` is readable by any JavaScript running on the page — including injected malicious scripts (XSS). Storing a long-lived refresh token there means a single XSS bug compromises every user's account persistently.
- **Decision:** access token in memory only (React state/context, lost on page refresh — mitigated by the silent-refresh-on-load flow in `FRONTEND_ARCHITECTURE.md`); refresh token in an httpOnly cookie (invisible to JS, sent automatically by the browser only to the API origin).
- This is a deliberate trade-off: slightly more complex client logic, in exchange for meaningfully better token-theft resistance.

## CORS

**Why:** Prevents arbitrary origins from making authenticated requests against your API using a logged-in user's cookies.
- Configure Express `cors` middleware with an explicit allow-list (your frontend's deployed origin + `localhost` in dev) — never `origin: '*'` once cookies are involved.
- `credentials: true` required for the httpOnly refresh cookie to be sent cross-origin (client and API are on different subdomains in most deployment setups).

## Helmet

**Why:** Sets a set of security-related HTTP headers (`X-Content-Type-Options`, `X-Frame-Options`, a baseline Content-Security-Policy, etc.) that mitigate several classes of attack (clickjacking, MIME-sniffing) with near-zero implementation cost.
- Applied globally as Express middleware early in `app.js`.

## Rate Limiting

**Why:** Protects both your own server (from brute-force login attempts, abusive clients) and your external API quotas (GitHub's 5000 req/hour budget must not be exhausted by one user spamming `/api/sync/trigger`).
- `express-rate-limit` on auth routes (e.g., 5 attempts per 15 min per IP) and on `/api/sync/trigger` (e.g., 1 per 5 min per user).
- This is distinct from and complementary to the adapter-level rate-limit handling described in `BACKEND_ARCHITECTURE.md` (that protects against exhausting GitHub's quota across all your users combined; this protects against a single abusive user or IP).

## Input Validation

**Why:** The single most effective defense against injection-style attacks and malformed-data bugs — validate everything crossing a trust boundary, always server-side (client-side validation is a UX nicety, never a security control, since it can be trivially bypassed).
- Zod schemas per route (see `BACKEND_ARCHITECTURE.md`), rejecting unexpected fields, enforcing types/lengths/enums before any service logic runs.

## XSS (Cross-Site Scripting)

**Why it matters here:** User-controlled strings could appear in the UI (e.g., a GitHub repo name, a LeetCode username) — if rendered unsanitized, a malicious value could execute script in another user's browser.
- React escapes rendered content by default (a major built-in defense) — the specific danger is any use of `dangerouslySetInnerHTML`, which this project should avoid entirely; there is no legitimate need for raw HTML rendering anywhere in this app's feature set.
- Helmet's CSP header as a defense-in-depth layer.

## CSRF (Cross-Site Request Forgery)

**Why it matters here:** Because the refresh token lives in a cookie, a malicious site could otherwise trick a logged-in user's browser into making a request that rides on that cookie.
- Mitigations: `sameSite=strict` (or `lax` if cross-site refresh flows are needed) on the refresh cookie, which prevents it from being sent on cross-origin requests in the first place; the access token (in the `Authorization` header, not a cookie) is immune to CSRF by construction, since headers aren't automatically attached by the browser the way cookies are.

## NoSQL Injection

**Why it matters here:** MongoDB queries built from unsanitized user input can be manipulated (e.g., passing an object like `{ "$ne": null }` as a "string" field) to bypass intended query logic.
- Zod validation enforces primitive types (string/number/enum) before any value reaches a Mongoose query, which structurally prevents operator-injection since a validated string can never be `{ $ne: null }`.
- Mongoose's built-in casting adds a second layer of defense.

## Environment Variables

**Why:** Secrets (DB connection string, JWT signing secret, GitHub OAuth client secret, LeetCode adapter config) must never be committed to source control or hardcoded.
- `.env` (gitignored) locally, provider's secret manager in production (Render/Railway env var UI).
- Validated at startup (see `BACKEND_ARCHITECTURE.md`'s `config/env.js`) so a missing secret fails loudly at boot, not silently mid-request.

## Secret Management

- GitHub/LeetCode credentials stored in `connectedAccounts.accessTokenEncrypted` — encrypted at rest using a server-side encryption key (itself stored as an env var, never in the database), not stored in plaintext even though the database itself should also be access-controlled.
- JWT signing secret: long, random, rotated if ever suspected compromised (rotation invalidates all existing tokens — a real operational trade-off worth understanding, not just implementing).

## Best Practices Summary

| Practice | Threat mitigated |
|---|---|
| bcrypt hashing | Credential stuffing / DB leak password recovery |
| httpOnly refresh cookie | XSS-based token theft |
| In-memory access token | XSS-based token theft |
| CORS allow-list | Cross-origin credentialed requests |
| Helmet headers | Clickjacking, MIME sniffing |
| Rate limiting | Brute force, quota exhaustion |
| Zod validation everywhere | Injection, malformed data, NoSQL operator injection |
| React default escaping, no `dangerouslySetInnerHTML` | XSS |
| sameSite cookies | CSRF |
| Encrypted-at-rest external tokens | Credential leak if DB is compromised |
| Env var validation at startup | Silent misconfiguration |

## Related Documents

- `BACKEND_ARCHITECTURE.md` — where these controls are implemented (middleware layer)
- `API_DESIGN.md` — auth header conventions
- `DEPLOYMENT.md` — production secret management specifics
