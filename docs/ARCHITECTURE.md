# ARCHITECTURE.md

*Living document — the current, real architecture of the implemented system. Starts as a pointer to the planning documents; as implementation diverges from the original plan (as it always does somewhat), update this file to reflect reality, and note the divergence and why.*

## Current State

No implementation exists yet. The authoritative architectural plan is currently exactly what's described in:
- `SYSTEM_ARCHITECTURE.md` (overall system)
- `BACKEND_ARCHITECTURE.md` (server layering)
- `FRONTEND_ARCHITECTURE.md` (client structure)
- `DATABASE_DESIGN.md` (data model)
- `FOLDER_STRUCTURE.md` (physical layout)

## Divergences From Original Plan

_None yet — this section should be updated the first time implementation reveals the original plan needs adjustment (e.g., a folder gets restructured, an adapter interface changes shape, a collection gains/loses a field)._

Format for future entries:
```md
### [YYYY-MM-DD] — [What changed]

**Original plan:** (per which doc)
**What we actually did:**
**Why:**
**Docs updated:** (list which planning docs were revised to match, e.g. DATABASE_DESIGN.md)
```

## Related Documents

- All architecture/design docs listed above remain the detailed reference; this file is the "what's actually true right now" summary and changelog.
