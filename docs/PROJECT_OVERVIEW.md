# PROJECT_OVERVIEW.md

## Project Summary

**Dev Portfolio Analytics** is a MERN stack web application that connects to a developer's public accounts on GitHub, LeetCode, Codeforces, and CodeChef, ingests their activity data through a normalized adapter layer, and produces a unified analytics dashboard. The dashboard answers one question a static resume cannot: *"What does this person's real, verifiable coding activity look like, and where are the gaps?"*

The platform computes a cross-platform consistency score, per-topic weak-area detection, GitHub project quality scores, a unified skill/language profile, and auto-generated resume bullet suggestions — all derived from real data, all with visible, explainable computation (no black-box numbers).

This document is the anchor file for the whole project. Every other markdown file assumes you have read this one first.

## Problem Statement

Recruiters evaluate candidates through resumes: static, self-reported, and largely unverifiable. Meanwhile, candidates generate a continuous trail of objective activity — commits, submissions, contest ratings — scattered across GitHub, LeetCode, Codeforces, and CodeChef, in incompatible formats, with no unified view.

Two failures follow from this:

1. **Recruiters can't verify claims.** "Proficient in DSA" is unfalsifiable on a resume. A precise, timestamped, difficulty-weighted record of practice exists — but nobody aggregates it.
2. **Students can't see themselves clearly.** A student can view their LeetCode stats, GitHub graph, and Codeforces rating — but never combined, and never analyzed for *consistency* or *decay* (e.g., a topic that was once strong but hasn't been touched in three weeks).

Existing tools solve neither problem: platform-native dashboards are siloed, and third-party aggregators mostly just display numbers side by side without an analysis layer.

## Target Users

- **Primary:** Engineering students (2nd–4th year) actively preparing for campus placements or off-campus interviews, who already use LeetCode/Codeforces/CodeChef for practice and have at least one GitHub account with real projects.
- **Secondary:** Early-career developers (0–2 years experience) who want an honest, data-backed read on how their public developer footprint would look to a technical recruiter.

## Real-World Use Cases

- A final-year student wants to know, two months before placement season, whether their DSA practice is "recruiter-ready" and which topics need urgent attention.
- A student updating their resume wants three specific, verifiable bullet points instead of vague self-assessments.
- A student maintaining several GitHub repos wants to know, objectively, which of their projects actually look credible to a reviewer (README, tests, CI, recent commits) versus which look abandoned.
- A student who "codes a lot" wants to check whether their practice is evenly distributed or concentrated in unsustainable last-minute bursts.

## Goals

- Unify multi-platform developer activity into a single normalized model and a single heatmap.
- Score consistency and project quality using transparent, explainable heuristics.
- Detect weak areas using difficulty-weighting, recency-decay, and confidence-awareness — not raw averages.
- Generate specific, data-backed resume bullets from real activity.
- Degrade gracefully when any external API is slow, rate-limited, or unavailable.
- Serve as a genuine backend/systems-engineering learning vehicle: adapters, background jobs, rate-limit management, caching, scoring pipelines, auth, and a production-shaped architecture.

## Scope (MVP-focused; full detail in FEATURES.md)

**In scope for MVP:**
- GitHub integration (OAuth or public username-based ingestion), LeetCode ingestion (unofficial GraphQL), unified heatmap, consistency score, project quality score, basic weak-area detection, basic resume bullet generation, background sync jobs, per-user dashboard, authentication.

**In scope for later versions:**
- Codeforces and CodeChef adapters, recency-weighted trend visualizations, richer resume templates, notification/reminder system, public shareable profile pages.

## Out of Scope (explicitly, for all versions unless revisited)

- Real-time activity tracking (this is a periodically-synced system, not a live feed).
- Cross-user comparison, ranking, or leaderboards. This is a personal mirror, not a competition.
- Full resume document generation/formatting — the platform generates *raw material* (bullets), not a finished resume.
- Claims about a developer's actual skill or hireability — the platform measures observable signals only, and this limitation is stated in the product itself.

## Why This Project Is Valuable

- It forces you to design a **normalized data model across heterogeneous, uncooperative external APIs** — one of the more realistic, senior-flavored backend problems a portfolio project can contain.
- It requires **background job design and rate-limit-aware batching**, not just CRUD.
- It requires **designing heuristic scoring systems that must be defensible and explainable** — a genuinely hard product+engineering problem, not a tutorial-style feature.
- It has a believable, specific target user and a specific unmet need — this reads as a *product*, not a clone.

## Resume Value

This project lets you write resume bullets (once built) such as:
- "Designed a normalized adapter layer ingesting heterogeneous data from 4 external APIs (GitHub, LeetCode, Codeforces, CodeChef) with independent auth models and rate limits, using background job scheduling to stay within provider quotas."
- "Built a heuristic scoring engine (coefficient-of-variation-based consistency scoring, recency-decayed weak-area detection) with fully explainable, non-black-box outputs."
- "Implemented graceful degradation across 4 external dependencies, serving cached data with sync-freshness indicators during upstream outages."

These are architecturally substantive claims, not CRUD-app claims — which is exactly what separates this from a generic tutorial project in a recruiter's eyes.

## Possible Future Improvements

- Public shareable "developer profile" pages (opt-in), separate from the personal dashboard.
- Team/mentor view for bootcamps or college placement cells (aggregate, anonymized cohort insights — carefully out of scope for MVP given the "not a leaderboard" principle).
- ML-based topic-difficulty calibration instead of static difficulty weights.
- Webhook-based near-real-time GitHub sync (still not literally real-time, but event-driven instead of polling).

## Related Documents

- Feature breakdown: `FEATURES.md`
- Technology rationale: `TECH_STACK.md`
- System design: `SYSTEM_ARCHITECTURE.md`, `BACKEND_ARCHITECTURE.md`, `FRONTEND_ARCHITECTURE.md`
- Data model: `DATABASE_DESIGN.md`
- Endpoint contracts: `API_DESIGN.md`
- Mentoring rules for future AI sessions: `AI_MENTOR_INSTRUCTIONS.md`
