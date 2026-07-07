# USER_FLOW.md

## 1. Registration

1. User visits landing page, clicks "Sign up."
2. Enters email, password, name.
3. Client validates format client-side (fast feedback), submits to `POST /api/auth/register`.
4. Server validates again (never trust client-side validation alone — see `SECURITY.md`), hashes password, creates user, issues tokens.
5. Client stores access token in memory, redirects to an empty-state dashboard ("Connect your first account to get started").

## 2. Login

1. User enters email/password.
2. `POST /api/auth/login`.
3. On success, tokens issued as in registration; on failure, generic "invalid email or password" message (never reveal which field was wrong — see `SECURITY.md`).
4. Redirect to dashboard (populated if accounts already connected, empty-state otherwise).

## 3. Connecting GitHub

1. From Settings or the empty-state dashboard, user clicks "Connect GitHub."
2. `POST /api/accounts/github/connect` returns a GitHub OAuth URL; client redirects the browser there.
3. User authorizes on GitHub's own page.
4. GitHub redirects back to `GET /api/accounts/github/callback` with a code.
5. Server exchanges code for an access token, encrypts and stores it in `connectedAccounts`, creates a `syncStatuses` entry with `status: 'pending'`, and enqueues an immediate first sync.
6. Client redirects to dashboard showing a "Syncing your GitHub data..." indicator.
7. Once the background job completes (typically well under the 60-second success-criterion window for a first sync), the dashboard's polling (or a short-lived WebSocket/SSE in a later version — MVP just polls `GET /api/accounts` every few seconds while status is `pending`) picks up `status: 'success'` and renders real data.

## 4. Connecting LeetCode

1. User clicks "Connect LeetCode," enters their LeetCode username (no OAuth exists for this platform).
2. `POST /api/accounts/leetcode/connect` verifies the username exists (a lightweight profile lookup) before saving.
3. Same sync-and-poll pattern as GitHub, using the adapter's own rate limits and defensive parsing (LeetCode's endpoint is unofficial and can change without notice — the adapter must fail safely if the response shape is unexpected, marking that sync `failed` with a clear reason rather than crashing).

## 5. Viewing the Dashboard (CRUD: Read)

1. `GET /api/dashboard` — single aggregate call.
2. Client renders consistency score, streak, sync status banners (with per-source "last synced" timestamps), and triggers `GET /api/dashboard/heatmap` for the calendar view.
3. If a source's `syncStatus.status === 'failed'`, that section shows cached last-known data plus a small non-blocking warning — never a full-page error.

## 6. Reviewing Weak Areas

1. User navigates to "Weak Areas" tab.
2. `GET /api/weak-areas`.
3. Each topic row is collapsed by default showing topic + confidence badge; expanding shows the full reasoning string and the underlying numbers (success rate vs. platform average, days since last practice, attempt count).
4. If insufficient data exists, an explicit message replaces the list: "Keep practicing — we need at least 10 attempts on a topic before we can assess it."

## 7. Reviewing Project Quality

1. User navigates to "Projects" tab.
2. `GET /api/repos?sort=quality`.
3. List shows top repos with score badges; clicking a repo opens `GET /api/repos/:id` detail view showing the full breakdown (README, CI, tests, recency, contributors) with plain-language explanations of each component.

## 8. Generating Resume Suggestions

1. User navigates to "Resume Suggestions" tab.
2. `GET /api/resume/suggestions`.
3. If the user has fewer than 30 days of tracked activity, the UI shows a friendly "come back after a bit more activity" message with a progress indicator (`daysTracked / daysRequired`) instead of a generic error.
4. Otherwise, bullets are grouped by category (Competitive Programming / Projects / Activity) with a "Copy" button per bullet.

## 9. Searching / Filtering (Repos & Weak Areas)

- Repo list: filter by language, sort by quality score or recency.
- Weak-area list: filter by confidence level (hide "insufficient data" topics if desired).
These are client-side filters over already-fetched data in MVP (dataset size per user is small) — no new endpoints needed; a V2 with much larger per-user datasets could move filtering server-side.

## 10. Disconnecting an Account

1. User goes to Settings, clicks "Disconnect" next to a platform.
2. Confirmation modal (destructive action — following the same care principle as the mentor's own event-deletion caution).
3. `DELETE /api/accounts/:source`.
4. Server marks the account inactive (soft-disable, not necessarily hard-deleting historical `activityEvents` — a product decision worth discussing explicitly with the user in Settings copy: "Your historical data will be kept but no longer updated").

## 11. Password Reset

1. User clicks "Forgot password" on login page.
2. Enters email; server generates a short-lived, single-use reset token, emails a reset link (requires an email-sending integration — flagged as a small V2/MVP-boundary decision; MVP can ship without email delivery configured by logging the reset link in dev, and adding real email delivery as the first production-hardening step).
3. User submits new password via the reset link; server verifies token validity/expiry, updates password hash, invalidates the reset token.

## 12. Logout

1. User clicks logout.
2. `POST /api/auth/logout` clears the refresh cookie server-side (revocation) and client-side.
3. Client clears in-memory access token, redirects to landing/login page.

## 13. Notifications (V2, not MVP)

Not implemented in MVP. Planned flow (see `FEATURES.md` #16): background job evaluates decay conditions (e.g., a previously-strong topic untouched for 21+ days) and creates in-app/email notifications. Documented here for continuity so a future session implementing this doesn't need to redesign the flow from scratch.

## Related Documents

- `API_DESIGN.md` — exact request/response shapes referenced above
- `FRONTEND_ARCHITECTURE.md` — how these flows map to pages/components/routes
- `SECURITY.md` — token handling, password reset token design
