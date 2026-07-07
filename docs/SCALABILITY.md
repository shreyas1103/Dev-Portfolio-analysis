# SCALABILITY.md

Assume this project grows to one million users. This document distinguishes what genuinely needs to change from what's already fine — over-engineering for scale you don't have is its own mistake, and this file exists partly to teach that judgment.

## What Breaks First

1. **`node-cron` single-process polling.** At 1M users, even a modest per-user sync frequency (every 6 hours) means hundreds of thousands of sync operations per hour, all currently scheduled and executed within one Node.js process. This is the first, most obvious bottleneck.
2. **External API rate limits become a hard ceiling, not just a design concern.** GitHub's 5000 req/hour/token limit means, at scale, syncing must be distributed across many OAuth app tokens or a per-user-token model with careful global quota tracking — a single server-side token pool cannot serve 1M users.
3. **`activityEvents` collection size.** At 1M users generating daily events, this collection reaches billions of documents within a couple of years — read/write performance on a single unsharded MongoDB instance degrades.
4. **Dashboard read load.** Even cached reads, at 1M concurrent-ish users, exceed what a single Node.js instance + single MongoDB primary can serve.
5. **Synchronous score recomputation on every sync.** Recomputing consistency/weak-area/quality scores inline within the sync job doesn't parallelize well and couples ingestion latency to scoring latency.

## Possible Optimizations (mapped to what breaks)

### Job Scheduling → BullMQ + Redis
Replace `node-cron`'s in-process scheduling with a Redis-backed job queue (BullMQ), allowing multiple worker processes/machines to pull sync jobs concurrently, with built-in retry/backoff and per-job rate limiting. This is the direct fix for bottleneck #1, and lays groundwork for #2 (queue-level rate limiting per external API).

### Redis (Caching)
Beyond queueing, Redis serves as a read-through cache for the `GET /api/dashboard` hot path, reducing MongoDB read load — directly addressing bottleneck #4. Cache invalidated/refreshed whenever a sync recomputes scores for that user.

### CDN
Serve the frontend's static assets (JS/CSS bundles, images) via a CDN (Vercel/Netlify already do this by default) — reduces load and latency for anything that isn't per-user dynamic data. Low effort, meaningful win, largely already "free" with the chosen hosting providers.

### Queues (beyond job scheduling)
Decouple sync ingestion from score computation: the sync job writes raw `ActivityEvent`s and pushes a "recompute scores for user X" message onto a separate queue, processed by independent scoring workers. This directly addresses bottleneck #5 by letting ingestion and scoring scale independently.

### Database Scaling
- **Read replicas** for MongoDB to offload dashboard reads from the primary (addresses #4 further).
- **Sharding** `activityEvents` by `userId` (a natural, evenly-distributed shard key here) once the collection's size/throughput genuinely requires it (#3) — not before, since sharding adds real operational complexity.
- **Time-based archiving:** since the consistency score only needs a 90-day rolling window, events older than, say, 180 days can be moved to a cheaper cold-storage collection or deleted/aggregated into monthly summaries, keeping the hot collection smaller.

### Horizontal Scaling (API servers)
Once traffic exceeds one instance's capacity, run multiple stateless Express instances behind a load balancer. This is straightforward *because* the architecture is already stateless (JWT auth, no server-side session store) — a direct payoff of the auth design choice made in `SECURITY.md`.

### Load Balancers
Standard L7 load balancer (or the managed equivalent from Render/Railway/AWS) distributing requests across API instances; health-checks removing unhealthy instances automatically.

### Microservices (discussed, not currently recommended)
The adapter+service separation in `BACKEND_ARCHITECTURE.md` means the "sync engine" *could* be extracted into an independently-deployed service from the "dashboard API" — worth doing only once their scaling needs genuinely diverge (sync is write/CPU-heavy and bursty; dashboard reads are latency-sensitive and steady). At MVP-to-early-growth scale, a single well-layered monolith is simpler to operate and is not a mistake — splitting prematurely would be.

### Caching Strategies
- Cache computed scores (already effectively "cached" by being precomputed and stored — see `DATABASE_DESIGN.md`'s normalization rationale).
- Cache external API responses briefly (e.g., a repo's metadata) to reduce duplicate calls within a sync cycle.
- Use ETags/conditional requests where the external API supports them (GitHub does) to avoid consuming rate-limit quota on unchanged data.

## Current Needs vs. Future Improvements (explicit line)

| Concern | Needed now (MVP) | Needed later (scale) |
|---|---|---|
| Job scheduling | `node-cron`, single process | BullMQ + Redis, multiple workers |
| Caching | None (MongoDB reads are fast enough at this scale) | Redis read-through cache |
| DB topology | Single Atlas cluster (free/shared tier) | Read replicas, then sharding by `userId` |
| API servers | Single instance | Multiple instances behind a load balancer |
| Event storage | Keep everything indefinitely | Archive/aggregate data older than ~180 days |
| External API access | Single OAuth app / shared rate-limit pool | Per-user token isolation, global quota tracking service |

The core lesson this file teaches: **none of the "future improvements" column should be built now.** Building Redis-backed queues before you have real concurrent sync load to manage would violate the project's own stated principle of avoiding unnecessary complexity — the same principle applied to itself.

## Related Documents

- `SYSTEM_ARCHITECTURE.md` — the current, appropriately-simple architecture this document extends
- `TECH_STACK.md` — where Redis/BullMQ are flagged as explicitly postponable
- `DATABASE_DESIGN.md` — schema decisions this scaling plan builds on
