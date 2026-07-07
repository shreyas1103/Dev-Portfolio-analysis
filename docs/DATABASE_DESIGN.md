# DATABASE_DESIGN.md

## Collections (MVP)

1. `users`
2. `connectedAccounts`
3. `repos`
4. `activityEvents`
5. `scores`
6. `syncStatuses`

## Design Philosophy: Normalization vs. Denormalization

This schema deliberately **denormalizes computed scores** (storing them as their own documents rather than computing on every read) but **normalizes raw source data** (keeping `activityEvents` and `repos` as their own collections rather than embedding everything into `users`).

Why: dashboard reads must be fast and frequent (every page load); score computation is comparatively expensive (aggregation over 90 days of events) and only needs to happen once per sync, not once per read. This is a classic **read-heavy, write-light** access pattern — precompute on write, serve cheaply on read. Embedding raw activity events directly into the `users` document would also blow past MongoDB's document size practicality long before "1 million users" — each user could accumulate thousands of events.

## Collection: `users`

```js
{
  _id: ObjectId,
  email: String,           // unique, indexed
  passwordHash: String,
  name: String,
  createdAt: Date,
  updatedAt: Date,
  settings: {
    publicProfileEnabled: Boolean,   // V2 feature flag, default false
  }
}
```
**Why:** Minimal — auth + identity only. Everything else (connections, activity, scores) lives in its own collection referencing `userId`, so `users` never grows unbounded.

## Collection: `connectedAccounts`

```js
{
  _id: ObjectId,
  userId: ObjectId,        // ref: users, indexed
  source: String,          // enum: 'github' | 'leetcode' | 'codeforces' | 'codechef'
  externalUsername: String,
  accessTokenEncrypted: String,   // null for username-only sources like LeetCode
  connectedAt: Date,
  isActive: Boolean
}
```
**Index:** compound unique index on `{ userId, source }` — a user can connect each platform exactly once.
**Why separate from `users`:** a user may have 1–4 connected accounts; modeling this as an array embedded in `users` would work too, but a separate collection makes per-source queries (e.g., "find all users with GitHub connected" for the sync job) a simple indexed query rather than an array-scan.

## Collection: `repos`

```js
{
  _id: ObjectId,
  userId: ObjectId,          // indexed
  externalRepoId: String,    // GitHub repo id
  name: String,
  language_bytes: Object,    // { "JavaScript": 45210, "Python": 12030, ... }
  hasReadme: Boolean,
  readmeLength: Number,
  hasCI: Boolean,
  hasTests: Boolean,
  contributorCount: Number,
  lastCommitAt: Date,
  qualityScore: Number,      // 0-100, computed
  scoreBreakdown: Object,    // { readme: 20, ci: 25, tests: 20, recency: 20, contributors: 15 }
  lastSyncedAt: Date
}
```
**Why store `scoreBreakdown`:** the product's success criteria explicitly require "no black box numbers" — the per-component breakdown is queried and displayed directly, not recomputed on the fly for display.

## Collection: `activityEvents` (the unified cross-platform model)

```js
{
  _id: ObjectId,
  userId: ObjectId,        // indexed
  source: String,          // 'github' | 'leetcode' | 'codeforces' | 'codechef'
  type: String,             // 'commit' | 'submission_accepted' | 'submission_failed' | 'contest'
  date: Date,               // truncated to day, indexed (compound with userId)
  topic: String,            // e.g. 'graphs', 'dp' — null for GitHub commits
  difficulty: String,       // 'easy'|'medium'|'hard' — null for GitHub commits
  metadata: Object          // source-specific extra fields, kept flexible on purpose
}
```
**Compound index:** `{ userId: 1, date: 1 }` — this is the query used to build the heatmap and the 90-day rolling window for consistency scoring, so it must be fast.

**Why one unified collection instead of one per source:** this is the central data-modeling decision of the whole project. A GitHub commit and a LeetCode accepted submission are different *kinds* of events, but the heatmap and consistency score need to treat them comparably as "activity on day X." The `type` and `source` fields preserve the distinction (so weak-area detection can filter to only LeetCode `submission_*` events, for instance) while `date` + `userId` let the heatmap/consistency logic query across all sources with one aggregation. Splitting this into per-source collections would force the heatmap query to run 4 queries and merge results in application code for every dashboard load — worse for the read-heavy access pattern this app has.

## Collection: `scores`

```js
{
  _id: ObjectId,
  userId: ObjectId,          // unique, indexed
  consistencyScore: Number,  // 0-100
  currentStreak: Number,
  longestStreak: Number,
  trend: String,             // 'improving' | 'declining' | 'stable'
  weakAreas: [
    {
      topic: String,
      successRate: Number,
      platformAvgSuccessRate: Number,
      lastPracticedDaysAgo: Number,
      attemptCount: Number,
      confidence: String,     // 'insufficient_data' | 'low' | 'medium' | 'high'
      reason: String          // human-readable generated explanation
    }
  ],
  languageBreakdown: Object,  // { "JavaScript": 40, "Python": 30, ... } (percentages)
  computedAt: Date
}
```
**Why one document per user (not one per computation run):** the dashboard only ever needs the *latest* score snapshot; historical score trends (V2) would be a separate `scoreHistory` collection rather than bloating this one, keeping the hot-path document small and fast to read.

## Collection: `syncStatuses`

```js
{
  _id: ObjectId,
  userId: ObjectId,          // indexed
  source: String,
  status: String,             // 'success' | 'partial' | 'failed' | 'pending'
  lastSyncedAt: Date,
  lastAttemptAt: Date,
  errorMessage: String,       // null if success
  consecutiveFailures: Number
}
```
**Why this exists as its own collection:** the "graceful degradation" success criterion requires the dashboard to show a per-source "last synced" timestamp and error state independent of whether the actual data sync succeeded. Storing this separately from `connectedAccounts` keeps volatile operational state (which changes every sync attempt) separate from stable configuration state (which changes rarely).

## Relationships (summary)

```
users (1) ──< connectedAccounts (many)
users (1) ──< repos (many)
users (1) ──< activityEvents (many)
users (1) ── scores (one, latest snapshot)
users (1) ──< syncStatuses (many, one per source)
```

## ER Diagram (ASCII)

```
┌─────────────┐        ┌────────────────────┐
│    users    │───────<│ connectedAccounts  │
└──────┬──────┘        └────────────────────┘
       │
       │───────<┌────────────────┐
       │        │      repos      │
       │        └────────────────┘
       │
       │───────<┌────────────────────┐
       │        │  activityEvents    │
       │        └────────────────────┘
       │
       │────────┌────────────────┐   (1:1 latest snapshot)
       │        │     scores      │
       │        └────────────────┘
       │
       │───────<┌────────────────┐
                │  syncStatuses   │
                └────────────────┘
```

## Indexes (summary)

| Collection | Index | Reason |
|---|---|---|
| `users` | `email` (unique) | Login lookup |
| `connectedAccounts` | `{ userId, source }` (unique compound) | One connection per source per user |
| `repos` | `{ userId }` | List user's repos fast |
| `activityEvents` | `{ userId, date }` (compound) | Heatmap + rolling-window queries |
| `scores` | `{ userId }` (unique) | Dashboard read |
| `syncStatuses` | `{ userId, source }` (compound) | Per-source status lookup |

## Validation

Mongoose schema-level validation (required fields, enums for `source`/`type`/`status`) plus Zod validation at the API boundary (see `SECURITY.md`). Two layers deliberately: Zod catches bad input before it reaches the database; Mongoose validation is a defense-in-depth backstop in case a service ever writes data that bypassed a route (e.g., from a background job).

## Example Documents

```js
// activityEvents example
{
  userId: ObjectId("..."),
  source: "leetcode",
  type: "submission_accepted",
  date: ISODate("2026-07-01"),
  topic: "graphs",
  difficulty: "medium",
  metadata: { problemSlug: "course-schedule", runtimeMs: 42 }
}

// scores example (partial)
{
  userId: ObjectId("..."),
  consistencyScore: 71,
  currentStreak: 6,
  weakAreas: [
    {
      topic: "graphs",
      successRate: 0.48,
      platformAvgSuccessRate: 0.61,
      lastPracticedDaysAgo: 18,
      attemptCount: 27,
      confidence: "high",
      reason: "Your graph success rate is 48% on medium-difficulty problems, below the platform average of 61%, and you haven't practiced it in 18 days."
    }
  ]
}
```

## Future Scalability

- At larger scale, `activityEvents` becomes the first collection to need sharding (by `userId`) or time-based archiving (moving events older than N days to cold storage) — addressed in `SCALABILITY.md`.
- A `scoreHistory` collection (V2) would let the trend visualization (#13 in FEATURES.md) show real historical score movement instead of only the current snapshot's `trend` label.

## Related Documents

- `API_DESIGN.md` — endpoints reading/writing these collections
- `BACKEND_ARCHITECTURE.md` — repository layer conventions
- `SCALABILITY.md` — sharding/archiving strategy for `activityEvents`
