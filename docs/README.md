# Dev Portfolio Analytics

> A unified analytics dashboard that connects GitHub, LeetCode, Codeforces, and CodeChef to answer one question a resume can't: *what does your real, verifiable coding activity actually look like — and where are the gaps?*

## Overview

Dev Portfolio Analytics ingests a developer's public activity across multiple platforms through a normalized adapter layer, then produces:

- A **unified activity heatmap** merging commits, submissions, and contest participation into one calendar
- A **Consistency Score** (coefficient-of-variation based) distinguishing steady practice from last-minute bursts
- **Weak-Area Detection** — difficulty-weighted, recency-aware, confidence-labeled topic analysis with transparent reasoning
- **Project Quality Scores** for GitHub repos based on README quality, CI presence, tests, recency, and collaboration signals — not star count
- A **Resume Suggestion Generator** producing specific, data-backed resume bullets from verified activity

Every score is fully explainable — no black-box numbers.

## Tech Stack

**Frontend:** React (Vite), React Router, TanStack Query, shadcn/ui + Tailwind, Recharts
**Backend:** Node.js, Express, Mongoose, JWT auth, node-cron
**Database:** MongoDB (Atlas)
**External integrations:** GitHub REST/GraphQL API, LeetCode (unofficial GraphQL), Codeforces API (V2), CodeChef (V2)

Full rationale for every technology choice: [`docs/TECH_STACK.md`](docs/TECH_STACK.md)

## Architecture Highlights

- **Adapter pattern** isolating each external platform's auth model, rate limits, and data shape behind a shared interface — adding a new platform requires no changes to scoring or sync logic.
- **Background-job-driven sync**, never live external calls on the dashboard read path — dashboard reads are always fast and always available, even when an upstream API is down (graceful degradation with visible "last synced" timestamps).
- **Layered backend** (Routes → Controllers → Services → Repositories) keeping business logic independently testable from persistence and HTTP concerns.

Full system design: [`docs/SYSTEM_ARCHITECTURE.md`](docs/SYSTEM_ARCHITECTURE.md), [`docs/BACKEND_ARCHITECTURE.md`](docs/BACKEND_ARCHITECTURE.md)

## Getting Started

```bash
# Clone
git clone https://github.com/<your-username>/dev-portfolio-analytics.git
cd dev-portfolio-analytics

# Backend
cd server
cp .env.example .env   # fill in MongoDB URI, JWT secrets, GitHub OAuth credentials
npm install
npm run dev

# Frontend
cd ../client
npm install
npm run dev
```

Visit `http://localhost:5173`.

## Project Documentation

This project is documented extensively before/alongside implementation. Full docs live in [`/docs`](docs):

- [`PROJECT_OVERVIEW.md`](docs/PROJECT_OVERVIEW.md) — problem, users, goals, scope
- [`FEATURES.md`](docs/FEATURES.md) — full feature breakdown by version
- [`SYSTEM_ARCHITECTURE.md`](docs/SYSTEM_ARCHITECTURE.md) / [`BACKEND_ARCHITECTURE.md`](docs/BACKEND_ARCHITECTURE.md) / [`FRONTEND_ARCHITECTURE.md`](docs/FRONTEND_ARCHITECTURE.md)
- [`DATABASE_DESIGN.md`](docs/DATABASE_DESIGN.md) / [`API_DESIGN.md`](docs/API_DESIGN.md)
- [`SECURITY.md`](docs/SECURITY.md) / [`SCALABILITY.md`](docs/SCALABILITY.md) / [`DEPLOYMENT.md`](docs/DEPLOYMENT.md) / [`TESTING.md`](docs/TESTING.md)
- [`DEVELOPMENT_ROADMAP.md`](docs/DEVELOPMENT_ROADMAP.md) — milestone-by-milestone build plan

## Status

🚧 In active development — see [`PROJECT_PROGRESS.md`](docs/PROJECT_PROGRESS.md) for current state.

## What This Project Is Not

- Not a real-time tracker (data syncs periodically, with visible freshness timestamps)
- Not a leaderboard or comparison tool — entirely personal, never ranks users against each other
- Not a full resume builder — generates data-backed bullet suggestions, not a formatted document
- Not a claim of skill or hireability — measures observable activity signals only

## License

MIT (or your preferred license)
