# LEARNING_MAP.md

Every concept introduced across the roadmap, with definition, purpose, difficulty, prerequisites, resources, where it appears, and interview importance.

| Concept | Definition | Purpose in this project | Difficulty | Prerequisites | Learning Resources | Where it appears | Interview Importance |
|---|---|---|---|---|---|---|---|
| JWT (access/refresh tokens) | A signed, stateless token encoding claims about a user | Auth without server-side session storage | Medium | HTTP basics, hashing | jwt.io introduction, Auth0 blog on refresh tokens | M1.2 | High — near-universal in Node.js interviews |
| bcrypt password hashing | Adaptive, slow one-way hash for passwords | Never store recoverable passwords | Low-Medium | Basic crypto concepts | bcrypt npm docs | M1.1 | High |
| httpOnly / sameSite cookies | Cookie attributes restricting JS access and cross-site sending | XSS/CSRF mitigation for refresh tokens | Medium | Cookies basics, XSS/CSRF concepts | MDN Set-Cookie docs | M1.2, SECURITY.md | Medium-High |
| React Context + useReducer | Built-in global state pattern | Auth state management without external libs | Medium | React hooks basics | React docs (Context, useReducer) | M1.3 | Medium |
| Protected routes / route guards | Conditional rendering/redirect based on auth state | Restrict dashboard to logged-in users | Low-Medium | React Router basics | React Router docs | M1.3 | Medium |
| OAuth 2.0 (authorization code flow) | Delegated auth protocol allowing third-party access without sharing passwords | Connecting GitHub without handling GitHub credentials | High | HTTP, redirects, tokens | GitHub OAuth Apps docs, oauth.net | M2.1 | High |
| Adapter pattern | Wrapping heterogeneous external interfaces behind one shared internal interface | Isolate GitHub/LeetCode/Codeforces differences from the rest of the system | Medium-High | OOP/module basics | Refactoring Guru: Adapter Pattern | M2.1–M4.2 | Medium (a strong signal of design maturity in interviews) |
| API pagination | Fetching large result sets across multiple requests | GitHub repos/commits often exceed one page | Low-Medium | REST basics | GitHub REST API pagination docs | M2.2 | Medium |
| Rate limiting (client-side awareness) | Respecting/managing a provider's request quota | Avoid exhausting GitHub's 5000 req/hour budget | Medium | HTTP headers | GitHub rate limit docs | M2.2 | Medium |
| Data normalization (cross-source) | Transforming heterogeneous data into one unified internal shape | Enables the unified heatmap/consistency score across 4 platforms | High | Domain modeling basics | Martin Fowler on data modeling (general) | M2.2, DATABASE_DESIGN.md | High (system design interviews) |
| Job scheduling (`node-cron`) | Running code on a fixed schedule outside the request/response cycle | Background sync without blocking dashboard reads | Medium | Node.js event loop basics | node-cron README | M2.3 | Medium |
| Idempotent writes / upserts | Writes that produce the same end-state no matter how many times they're applied | Prevent duplicate data on repeated syncs | Medium | MongoDB basics | MongoDB `upsert` docs | M2.3 | Medium-High |
| Fault isolation / partial failure handling | Ensuring one failing component doesn't take down unrelated work | One broken adapter shouldn't block others | Medium-High | Error handling basics | "Release It!" (Michael Nygard) concepts | M2.3, SYSTEM_ARCHITECTURE.md | High (distributed systems interviews) |
| Coefficient of variation | Standard deviation divided by mean — measures relative variability | Core of the consistency score algorithm | Medium | Basic statistics (mean, std dev) | Khan Academy: standard deviation | M3.1 | Low-Medium (unusual but impressive if you can explain it) |
| Weighted scoring design | Combining multiple signals into one explainable composite score | Project quality score, weak-area confidence | Medium-High | Basic arithmetic, product thinking | General software design reading | M3.2, M3.3 | Medium (product-engineering interviews especially) |
| Recency decay | Reducing confidence/weight of older data over time | "Not practiced in 21 days" flagging | Medium | Basic math | General time-series concepts | M3.3 | Low-Medium |
| Working with unofficial/undocumented APIs | Building resilient integrations against APIs that can change without notice | LeetCode adapter | High | HTTP/GraphQL basics | General defensive-programming practices | M4.1 | Medium (shows real-world resilience thinking) |
| GraphQL basics (as a consumer) | Query language for APIs, contrasted with REST | Required to call LeetCode's endpoint | Medium | JSON, HTTP | graphql.org introduction | M4.1 | Medium |
| React Query (TanStack Query) | Server-state caching/synchronization library for React | Manages all server data on the frontend | Medium | React hooks, fetch/promises | TanStack Query docs | M5.1+ | Medium-High (increasingly common in frontend interviews) |
| Presentational vs. container components | Separating data-fetching logic from pure rendering logic | Reusable chart components | Low-Medium | React basics | Dan Abramov's original blog post (concept, not implementation) | M5.2 | Medium |
| Timezone-safe date bucketing | Correctly grouping events into calendar days across timezones | Heatmap correctness | Medium | Date/time fundamentals | date-fns docs, MDN Date | M5.2 | Medium (a classic real-world bug source) |
| Design systems / component libraries | Reusable, consistent UI building blocks | shadcn/ui usage | Low-Medium | CSS/Tailwind basics | shadcn/ui docs | M6.1 | Low-Medium |
| Unit vs. integration testing | Testing isolated logic vs. testing real request/response flows | Scoring service tests vs. route tests | Medium | JavaScript basics | Jest docs, Supertest docs | M6.2 | High |
| Centralized error handling middleware | Single place to map errors to HTTP responses | Consistent, safe error responses | Medium | Express middleware basics | Express error-handling docs | Throughout backend | Medium-High |
| Environment-based configuration & startup validation | Validating required config before the app runs | Fail-fast on misconfiguration | Low-Medium | Basic Node.js | Zod docs | M0.2 | Medium |
| Encryption at rest (application-level) | Encrypting sensitive fields before storing them in the database | Protecting stored GitHub tokens | Medium-High | Basic crypto concepts | Node.js `crypto` module docs | M2.1 | Medium |

## Related Documents

- `DEVELOPMENT_ROADMAP.md` — where each concept is first encountered
- `INTERVIEW_PREP.md` — deeper interview-style treatment of the higher-importance concepts
