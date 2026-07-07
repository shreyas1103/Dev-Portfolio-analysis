# FRONTEND_ARCHITECTURE.md

This document teaches React *architecture* — how pages, components, state, and data fetching are organized and why — not visual design (see `FRONTEND_DESIGN_SYSTEM.md` for that).

## Pages (route-level)

| Route | Page Component | Protected? |
|---|---|---|
| `/login` | `LoginPage` | No |
| `/register` | `RegisterPage` | No |
| `/dashboard` | `DashboardPage` | Yes |
| `/repos` | `ReposPage` | Yes |
| `/repos/:id` | `RepoDetailPage` | Yes |
| `/weak-areas` | `WeakAreasPage` | Yes |
| `/resume` | `ResumeSuggestionsPage` | Yes |
| `/settings` | `SettingsPage` | Yes |

Pages are **composition-only**: they arrange feature components and layout, and contain little to no logic of their own. This keeps logic testable and reusable independent of routing.

## Component Hierarchy (example: DashboardPage)

```
DashboardPage
├── PageLayout (Sidebar + Navbar)
│   └── DashboardContent
│       ├── SyncStatusBanner (per connected source)
│       ├── ConsistencyScoreCard
│       │     └── ScoreExplanationTooltip
│       ├── ActivityHeatmap
│       ├── LanguageBreakdownChart
│       └── QuickLinks (to Repos / Weak Areas / Resume)
```

## Reusable Components

- `ui/` primitives (Button, Card, Badge, Dialog, Toast, Skeleton) — from shadcn/ui, feature-agnostic.
- `charts/ActivityHeatmap`, `charts/TrendLine`, `charts/BreakdownChart` — data-driven, take normalized props (`{ date, value }[]`), never fetch data themselves. This separation (dumb/presentational chart components vs. container components that fetch) is the single most important reusability pattern in this app: it lets the same `ActivityHeatmap` component be reused for GitHub-only data, LeetCode-only data, or unified data, depending on what the parent passes in.
- `layout/PageLayout`, `layout/Sidebar`, `layout/Navbar` — shared shell across all authenticated pages.

## Routing

React Router v6, defined centrally in `client/src/routes/`:

```jsx
<Routes>
  <Route path="/login" element={<LoginPage />} />
  <Route path="/register" element={<RegisterPage />} />
  <Route element={<ProtectedRoute />}>
    <Route path="/dashboard" element={<DashboardPage />} />
    <Route path="/repos" element={<ReposPage />} />
    <Route path="/repos/:id" element={<RepoDetailPage />} />
    <Route path="/weak-areas" element={<WeakAreasPage />} />
    <Route path="/resume" element={<ResumeSuggestionsPage />} />
    <Route path="/settings" element={<SettingsPage />} />
  </Route>
</Routes>
```

## Protected Routes

`ProtectedRoute` is a layout route (wraps children via `<Outlet />`) that checks `AuthContext`. If no valid access token exists, it attempts a silent refresh (`POST /api/auth/refresh` using the httpOnly cookie) before redirecting to `/login` — so a page reload doesn't log the user out unnecessarily. This teaches a subtlety many beginner apps get wrong: "not logged in" and "token just expired but refresh cookie is valid" are different states, and conflating them creates a bad UX (forced re-login on every refresh).

## State Management

- **Server state** (dashboard data, repos, weak areas, sync status): owned entirely by **TanStack Query**. Components never store server data in `useState` — they call `useQuery` and let the cache be the source of truth. This is a deliberate architectural rule, not a suggestion: mixing manually-managed copies of server state with React Query's cache is the most common source of stale-UI bugs in apps like this.
- **Client/UI state** (form inputs, modal open/closed, selected filter): local `useState` in the owning component, or `useReducer` for a feature with several related pieces of state (e.g., the multi-step "connect account" flow).
- **Global auth state**: `AuthContext` + `useReducer`, holding `{ user, accessToken, status }`. This is the one piece of state that's truly global (needed by the routing layer, the API client, and many pages) — everything else stays local or in React Query.

## Data Fetching

All API calls go through `client/src/api/` — thin wrapper functions (`getDashboard()`, `getRepos()`, etc.) that call a shared `axios`/`fetch` instance configured with the base URL and an interceptor that attaches the current access token and handles 401 → silent-refresh → retry. Feature hooks (`useDashboard()`, `useRepos()`) wrap these in `useQuery` calls with sensible `staleTime`/`refetchInterval` (e.g., dashboard refetches every 30s while a sync is `pending`, otherwise on-focus only — matching the "not real-time" product principle while still feeling responsive).

## Folder Organization (recap from `FOLDER_STRUCTURE.md`)

Each entry in `features/` (e.g., `features/weak-areas/`) contains:
```
weak-areas/
├── WeakAreasPage.jsx        (or a components subfolder if the page grows)
├── WeakAreaRow.jsx
├── useWeakAreas.js          (React Query hook)
└── weakAreas.api.js         (raw API call)
```
This keeps everything about one feature colocated, so extending or debugging a feature never requires jumping between three unrelated top-level folders.

## Why This Architecture Matters for Learning

The instinct beginners have is to fetch data in `useEffect` and store it in `useState` scattered across components. This project deliberately avoids that pattern from day one so you build the habit of separating **server cache state** (React Query) from **UI state** (local `useState`) from **global app state** (Context) — the exact distinction that separates junior from mid-level React usage in real codebases.

## Related Documents

- `FRONTEND_DESIGN_SYSTEM.md` — visual/styling system for these components
- `API_DESIGN.md` — endpoints these hooks call
- `USER_FLOW.md` — user journeys these pages implement
