# API_DESIGN.md

All routes prefixed `/api`. All responses use the envelope:
```json
{ "success": true, "data": { ... }, "meta": { ... } }
```
Errors:
```json
{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "..." } }
```

---

## Auth

### `POST /api/auth/register`
- **Purpose:** Create a new user account.
- **Auth required:** No.
- **Request body:** `{ email, password, name }`
- **Response:** `201` `{ user: { id, email, name }, accessToken }` (+ refresh token as httpOnly cookie)
- **Validation:** email format, password min length 8, name non-empty.
- **Error cases:** `409` email already exists; `400` validation failure.

### `POST /api/auth/login`
- **Purpose:** Authenticate existing user.
- **Auth required:** No.
- **Request body:** `{ email, password }`
- **Response:** `200` `{ user, accessToken }` (+ refresh cookie)
- **Error cases:** `401` invalid credentials; `400` validation failure.

### `POST /api/auth/refresh`
- **Purpose:** Exchange a valid refresh token (httpOnly cookie) for a new access token.
- **Auth required:** Refresh cookie only.
- **Response:** `200` `{ accessToken }`
- **Error cases:** `401` missing/expired/invalid refresh token.

### `POST /api/auth/logout`
- **Purpose:** Invalidate refresh token / clear cookie.
- **Auth required:** No.
- **Response:** `204`

---

## Connected Accounts

### `POST /api/accounts/github/connect`
- **Purpose:** Initiate GitHub OAuth flow.
- **Auth required:** Yes.
- **Response:** `200` `{ redirectUrl }`

### `GET /api/accounts/github/callback`
- **Purpose:** OAuth callback; exchanges code for token, stores encrypted, triggers initial sync.
- **Auth required:** Yes (session tied to state param).
- **Response:** `302` redirect to dashboard.
- **Error cases:** `400` invalid/expired state; `502` GitHub token exchange failed.

### `POST /api/accounts/leetcode/connect`
- **Purpose:** Register a LeetCode username (no OAuth available).
- **Auth required:** Yes.
- **Request body:** `{ username }`
- **Response:** `201` `{ connectedAccount }`
- **Error cases:** `404` username not found on LeetCode; `409` already connected.

### `GET /api/accounts`
- **Purpose:** List current user's connected accounts + their sync status.
- **Auth required:** Yes.
- **Response:** `200` `{ accounts: [{ source, externalUsername, connectedAt, syncStatus }] }`

### `DELETE /api/accounts/:source`
- **Purpose:** Disconnect a platform.
- **Auth required:** Yes.
- **Response:** `200` `{ disconnected: true }`
- **Error cases:** `404` no such connection.

---

## Dashboard

### `GET /api/dashboard`
- **Purpose:** Primary aggregate endpoint — everything the dashboard needs in one call (scores, sync status summary, heatmap data). Always reads from MongoDB; never calls external APIs live.
- **Auth required:** Yes.
- **Response:** `200`
```json
{
  "consistencyScore": 71,
  "currentStreak": 6,
  "longestStreak": 14,
  "trend": "improving",
  "languageBreakdown": { "JavaScript": 40, "Python": 30 },
  "syncStatuses": [{ "source": "github", "status": "success", "lastSyncedAt": "..." }],
  "computedAt": "..."
}
```
- **Error cases:** `200` with empty/placeholder data if no accounts connected yet (not an error — a legitimate empty state).

### `GET /api/dashboard/heatmap?days=90`
- **Purpose:** Unified activity heatmap data.
- **Auth required:** Yes.
- **Query params:** `days` (default 90, max 365).
- **Response:** `200` `{ days: [{ date, count, sources: ["github","leetcode"] }] }`

---

## Repos / Project Quality

### `GET /api/repos`
- **Purpose:** List user's GitHub repos with quality scores.
- **Auth required:** Yes.
- **Query params:** `sort` (`quality` | `recent`), `limit`.
- **Response:** `200` `{ repos: [{ name, qualityScore, scoreBreakdown, lastCommitAt }] }`

### `GET /api/repos/:id`
- **Purpose:** Full detail for one repo, including full score breakdown explanation.
- **Auth required:** Yes.
- **Response:** `200` `{ repo }`
- **Error cases:** `404` repo not found or not owned by user.

---

## Weak Areas

### `GET /api/weak-areas`
- **Purpose:** Ranked list of topics needing attention with transparent reasoning.
- **Auth required:** Yes.
- **Response:** `200`
```json
{
  "weakAreas": [
    {
      "topic": "graphs",
      "successRate": 0.48,
      "platformAvgSuccessRate": 0.61,
      "lastPracticedDaysAgo": 18,
      "confidence": "high",
      "reason": "Your graph success rate is 48%..."
    }
  ]
}
```
- **Error cases:** `200` `{ weakAreas: [], message: "Not enough data yet" }` when insufficient activity exists (explicit empty state, not an error).

---

## Resume Suggestions

### `GET /api/resume/suggestions`
- **Purpose:** Generate resume bullet suggestions from computed scores.
- **Auth required:** Yes.
- **Response:** `200` `{ bullets: [{ category: "competitive_programming"|"projects"|"activity", text }] }`
- **Error cases:** `422` if user has fewer than 30 days of tracked activity (per success criteria) — response includes `{ reason: "insufficient_history", daysTracked: 12, daysRequired: 30 }`.

---

## Sync (manual trigger, rate-limited)

### `POST /api/sync/trigger`
- **Purpose:** Manually request an out-of-cycle sync (e.g., user just connected a new account).
- **Auth required:** Yes.
- **Response:** `202` `{ queued: true }`
- **Error cases:** `429` if triggered more than once per N minutes (rate-limited to protect external API quotas).

---

## Status Codes Used

| Code | Meaning in this API |
|---|---|
| 200 | Successful read |
| 201 | Resource created |
| 202 | Accepted for async processing (sync job queued) |
| 204 | Successful action, no content |
| 302 | OAuth redirect |
| 400 | Validation error |
| 401 | Missing/invalid/expired auth |
| 403 | Authenticated but not authorized for this resource |
| 404 | Resource not found |
| 409 | Conflict (duplicate connection, duplicate email) |
| 422 | Request understood but business rule not satisfiable (e.g., insufficient history) |
| 429 | Rate limited |
| 502 | Upstream external API failure |
| 500 | Unexpected server error |

## Conventions

- All list endpoints support pagination-ready shape (`limit`/`cursor`) even if MVP doesn't need it yet — cheap to add now, painful to retrofit later.
- All dates are ISO 8601 UTC.
- All endpoints requiring auth expect `Authorization: Bearer <accessToken>`.

## Related Documents

- `DATABASE_DESIGN.md` — underlying collections
- `SECURITY.md` — auth header/token handling, rate limiting rationale
- `USER_FLOW.md` — how these endpoints compose into full user journeys


### `GET /api/auth/me`
- **Purpose:** Return the current authenticated user's profile. Originally
  built as a test-only endpoint to verify JWT middleware end-to-end (M1.2),
  but discovered during M1.3 to be structurally required: since
  `POST /api/auth/refresh` returns only a new access token (no user data),
  the frontend's silent-refresh-on-load flow needs this endpoint to
  repopulate `user` state after a page reload.
- **Auth required:** Yes.
- **Response:** `200` `{ id, email, name }`
- **Error cases:** `401` missing/invalid/expired access token.