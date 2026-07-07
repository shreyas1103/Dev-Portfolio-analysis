# TESTING.md

## Unit Testing

**Scope:** Pure logic with no external dependencies — scoring algorithms (`consistencyScore.service.js`, `qualityScore.service.js`, `weakArea.service.js`), utility functions (`utils/stats.js`, date helpers), and normalizers (`*.normalizer.js`, tested against fixed sample raw-API responses).

**Tooling:** Jest.

**Why these specifically:** These are the highest-value, cheapest-to-test parts of the system — no database, no network, deterministic inputs/outputs. They're also where correctness matters most (a scoring bug silently produces wrong, misleading numbers for a user, unlike a UI bug which is usually visibly obvious).

**Key test cases to write:**
- Consistency score: "burst" pattern vs. "steady" pattern with equal totals must produce clearly different scores (this is the project's own stated success criterion — write it as a literal test).
- Weak-area detection: a topic with <10 attempts must be labeled `insufficient_data` regardless of its computed success rate.
- Quality score: an empty/no-README/no-CI repo must score meaningfully lower than a README+CI+tests+recent-commits repo.
- Normalizers: given a known, fixed sample of raw GitHub/LeetCode API response JSON, the normalizer output must exactly match the expected `ActivityEvent`/`Repo` shape — this test also protects you from silently missing a schema change (LeetCode's unofficial API in particular).

## Integration Testing

**Scope:** Real HTTP requests against real routes, hitting a **test MongoDB instance** (in-memory via `mongodb-memory-server`, or a dedicated test Atlas database — in-memory preferred for speed and isolation).

**Tooling:** Jest + Supertest.

**Key flows to cover:**
- Full auth cycle: register → login → authenticated request succeeds → request without token fails with 401.
- Authorization boundary: user A cannot read user B's repo via `GET /api/repos/:id` even with a valid token (a real, easy-to-miss bug class per `INTERVIEW_PREP.md`).
- Dashboard endpoint returns a sensible empty-state shape when no accounts are connected, rather than erroring.
- Sync status endpoint reflects a `failed` state correctly when an adapter is mocked to throw.

**External APIs are always mocked in tests** (using `nock` or manually mocking the adapter modules) — tests must never make real calls to GitHub/LeetCode, which would be slow, flaky, and could consume real rate-limit quota.

## API Testing (manual/exploratory)

**Tooling:** Postman, organized as a collection mirroring `API_DESIGN.md`'s endpoint list, with environment variables for local vs. deployed base URLs. Useful during active development of a new endpoint, before an automated test is written for it — and doubles as living, runnable documentation.

## Manual Testing

Before considering any milestone in `DEVELOPMENT_ROADMAP.md` complete, manually verify its "Completion Criteria" in the actual running app (not just via automated tests) — particularly for anything involving real external API behavior (OAuth flows, actual GitHub/LeetCode data) that's hard to fully replicate in mocked tests.

## Testing Tools Summary

| Layer | Tool |
|---|---|
| Unit | Jest |
| Integration | Jest + Supertest + `mongodb-memory-server` |
| External API mocking | `nock` or manual adapter mocks |
| Manual/exploratory | Postman |
| (V2) E2E | Playwright or Cypress |

## Future Automation

- **CI integration:** run the Jest suite automatically via GitHub Actions on every pull request (see `DEPLOYMENT.md`), blocking merge on failure — introduce once the suite is substantial enough to be worth gating on.
- **E2E testing (Playwright/Cypress):** simulate a full user journey in a real browser (register → connect account → view dashboard) — valuable but genuinely postponable; the unit + integration layers catch the large majority of realistic bugs in this project at far lower cost, and E2E suites are comparatively expensive to write and maintain. Introduce this only once the core feature set is stable (post-MVP), not while pages are still actively changing shape.
- **Test coverage reporting** (Jest's built-in `--coverage`): useful as a *guide*, not a target to game — 100% coverage on trivial getters is worthless; prioritize coverage on the scoring services and adapters, where correctness actually matters most.

## Related Documents

- `DEVELOPMENT_ROADMAP.md` — M6.2 testing milestone
- `BACKEND_ARCHITECTURE.md` — the layered structure that makes unit-testing services in isolation possible
