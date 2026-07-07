# FRONTEND_DESIGN_SYSTEM.md

## Design Philosophy

The visual goal is: **modern SaaS/FinTech analytics dashboard** — think Linear, Vercel, Mercury, or Stripe's dashboard — clean, data-dense but not cluttered, generous whitespace, restrained color used purposefully (mostly for status/score signaling, not decoration). Visual design is explicitly *not* the primary learning goal of this project, so this system exists to remove decision fatigue: follow it rather than improvising from scratch.

## UI Inspiration

Modern analytics SaaS products (Linear, Vercel, Stripe Dashboard, Mercury) share: neutral gray-scale base palette, a single accent color, monospace or tabular numerals for data, subtle borders instead of heavy shadows, and card-based layout for grouped metrics. This project follows that language.

## Recommended Component Library: shadcn/ui

**Why shadcn/ui over alternatives:**
- Components are copied into your repo as real code (not a black-box npm dependency) — you can read, learn from, and modify them, which fits the "learn production practices" goal better than a fully opaque library.
- Built on Radix primitives — accessibility (keyboard nav, focus management, ARIA) is handled correctly by default, which you'd otherwise have to learn and hand-build.
- Tailwind-based styling — Tailwind is the dominant utility-CSS approach in current SaaS frontend hiring, so this is itself a resume-relevant skill.
- Visual language matches the SaaS/FinTech target aesthetic out of the box, with minimal customization needed.

Chakra UI and Mantine are reasonable alternatives but both impose more of their own styling abstraction (styled-system props, theme objects) rather than plain Tailwind classes, which is less transferable and slightly further from the current dominant SaaS visual pattern. Material UI's visual identity is distinctly "Google Material," which doesn't match the target aesthetic without heavy overriding.

## Color Palette

- **Base:** neutral gray scale (Tailwind `slate` or `zinc`) for backgrounds, borders, and body text.
- **Accent:** a single indigo or blue (`indigo-600` / `blue-600`) for primary actions and links.
- **Semantic:**
  - Success/positive (high consistency score, passing check): `emerald-500`
  - Warning (at-risk topic, partial sync): `amber-500`
  - Danger (failed sync, low score): `rose-500`
  - Neutral/insufficient-data: `slate-400`
- Scores are color-graded on a scale (e.g., 0–40 rose, 41–70 amber, 71–100 emerald) — always paired with the number and label, never color alone (accessibility).

## Typography

- **Font:** Inter (or system-ui fallback) — the de facto modern SaaS typeface, free, excellent readability at small sizes.
- **Numerals:** tabular-nums for all scores/metrics so numbers align in tables/cards.
- **Scale:** Tailwind's default type scale (`text-sm` body, `text-2xl`/`text-3xl` for headline metrics like the consistency score).

## Spacing System

Tailwind's default 4px-based spacing scale, used consistently: `p-4`/`p-6` for card padding, `gap-4`/`gap-6` between grid items, `space-y-6` between page sections. No custom spacing values — consistency here is more valuable than pixel-perfect tuning.

## Border Radius

`rounded-lg` (8px) as the default for cards, buttons, and inputs — matches the shadcn/ui default and the general "SaaS" feel (softer than sharp corners, less rounded than a consumer/playful app).

## Shadows

Minimal. `shadow-sm` on cards at rest, `shadow-md` on hover/elevated elements (modals, dropdowns). Avoid heavy drop shadows — flat, border-based separation (`border border-slate-200`) is the dominant modern SaaS pattern and is also simpler to reason about than shadow layering.

## Icons

`lucide-react` — pairs naturally with shadcn/ui (same author ecosystem), consistent stroke-based icon style, huge coverage.

## Buttons

- Primary: solid accent background, white text — for the single most important action per view (e.g., "Connect GitHub," "Generate Bullets").
- Secondary: outline/border style — for secondary actions (e.g., "Disconnect," "Cancel").
- Destructive: `rose` variant, always paired with a confirmation dialog for irreversible actions (disconnecting an account, deleting data).

## Inputs

Standard shadcn/ui `Input`/`Select` components; validation errors shown inline below the field in `rose-500` text, never as a blocking alert.

## Tables

Used for repo lists — zebra-free (flat background, border-separated rows), sortable column headers, right-aligned numeric columns.

## Cards

The primary layout unit for the dashboard — each metric (consistency score, a repo, a weak-area topic) is a card: `border`, `rounded-lg`, `p-6`, white/near-white background against a light gray page background, so cards visually "lift" off the page without needing heavy shadows.

## Modals

shadcn/ui `Dialog` — used sparingly, primarily for destructive confirmations (disconnect account) and the "connect account" flow's username input step.

## Toasts

shadcn/ui `Toast`/`Sonner` — used for transient feedback (e.g., "Bullet copied to clipboard," "Sync triggered") — never for critical errors, which should be inline/persistent instead.

## Badges

Used heavily for status signaling: sync status (`success`/`pending`/`failed`), weak-area confidence (`high`/`medium`/`insufficient data`), score bands. Small, pill-shaped, color per the semantic palette above.

## Empty States

Every list-type view (repos, weak areas, resume bullets) has a designed empty state — not just a blank area — with a short explanation and a clear next action (e.g., weak areas: "Connect LeetCode to see your topic-level analysis"). This directly serves the graceful-degradation product principle.

## Loading States

Skeleton loaders (shadcn/ui `Skeleton`) matching the shape of the eventual content (card-shaped skeletons for score cards, row-shaped skeletons for repo lists) — never a generic spinner for content that has a known shape, since skeletons reduce perceived loading time and layout shift.

## Skeleton Loaders

Applied specifically during: initial dashboard load, and while `syncStatus.status === 'pending'` for a freshly-connected account.

## Responsive Design Strategy

Mobile-first Tailwind breakpoints (`sm`, `md`, `lg`). Dashboard grid: single column on mobile, 2-column on `md`, 3-column on `lg`. Sidebar collapses to a bottom nav or hamburger drawer below `md`. Tables (repo list) switch to a stacked card layout below `sm` rather than horizontal scrolling, which is a poor mobile pattern for data tables.

## Accessibility Guidelines

- All color-coded status (score bands, badges) paired with text labels, never color alone.
- All interactive elements keyboard-navigable (shadcn/ui + Radix handles most of this by default — verify, don't assume).
- Sufficient contrast ratios (Tailwind's default slate/zinc palettes are WCAG-AA compliant at the shades specified above).
- Form inputs always have associated `<label>` elements, not placeholder-only labeling.

---

## ASCII Wireframes

### Dashboard Page
```
┌────────────────────────────────────────────────────┐
│ Navbar: Logo         [Repos][WeakAreas][Resume] [⚙]│
├───────────┬──────────────────────────────────────────┤
│           │  Sync banners: GitHub ✓ synced 2m ago    │
│ Sidebar   │            LeetCode ✓ synced 5m ago      │
│  Dashboard│  ┌────────────────┐ ┌───────────────────┐│
│  Repos    │  │ Consistency:71 │ │ Streak: 6 days     ││
│  Weak Area│  │ Trend: ↑       │ │ Longest: 14 days   ││
│  Resume   │  └────────────────┘ └───────────────────┘│
│  Settings │  ┌──────────────────────────────────────┐│
│           │  │        Unified Activity Heatmap        ││
│           │  │  ▢▢▨▨▧▧▨▢▢▨▧▨▨▢▢▨▧ ... (90 days)      ││
│           │  └──────────────────────────────────────┘│
│           │  ┌──────────────────────────────────────┐│
│           │  │  Language Breakdown (donut chart)      ││
│           │  └──────────────────────────────────────┘│
└───────────┴──────────────────────────────────────────┘
```

### Weak Areas Page
```
┌────────────────────────────────────────────────────┐
│  Weak Areas                                          │
│  ┌──────────────────────────────────────────────┐  │
│  │ Graphs        [HIGH CONFIDENCE]  48% ▾         │  │
│  │   below platform avg 61%, last practiced 18d   │  │
│  ├──────────────────────────────────────────────┤  │
│  │ Dynamic Prog. [MEDIUM CONFIDENCE]  55% ▾       │  │
│  ├──────────────────────────────────────────────┤  │
│  │ Trees         [INSUFFICIENT DATA]              │  │
│  └──────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────┘
```

### Repo Detail Page
```
┌────────────────────────────────────────────────────┐
│  ← Back to Repos                                     │
│  repo-name                       Quality Score: 82   │
│  ┌──────────────┬──────────────┬──────────────────┐│
│  │ README ✓ 20/20│ CI ✓ 25/25   │ Tests ✓ 15/20     ││
│  ├──────────────┴──────────────┴──────────────────┤│
│  │ Recency: 12/15   Contributors: 10/20             ││
│  └──────────────────────────────────────────────────┘│
└────────────────────────────────────────────────────┘
```

## Related Documents

- `FRONTEND_ARCHITECTURE.md` — component structure these styles apply to
- `TECH_STACK.md` — shadcn/ui rationale in the broader stack context
