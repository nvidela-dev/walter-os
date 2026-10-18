# Production readiness and lower-end phone audit

Audit date: 2026-10-18, America/Montevideo. Source baseline: `7ab74651b0c6721181575ea6e998ca6c8759bb5b`, also `origin/main` when fetched. Expected workload: approximately ten users. This is an audit and a plan, not an implementation or a production certification.

## Decision

Prioritize dependency security and migration reliability, then measure an affected phone before choosing performance fixes. There is **no measured root cause for the reported phone slowdown**. The current dataset is small, and two sampled SQL statements execute quickly. Buying database capacity, adding indexes everywhere, replacing the framework, or adding global caching is not justified by these observations.

The architecture is reasonable for a small internal application: server-rendered pages, narrowly scoped interactive components, server-side action authorization, atomic database operations, and substantial domain tests. However, passing local checks does not establish deployed security, recovery readiness, real-device responsiveness, or reliable updates of an installed PWA.

This PR changes documentation plus a branch-specific `git.deploymentEnabled` exclusion in `vercel.json`. The exclusion prevents this audit PR from triggering the existing database-writing build command. It does not disable other branches. Do not merge this PR as a deployment action during the audit.

## Evidence vocabulary and boundaries

- **Measured:** command, build artifact, API response, or read-only SQL observed during this audit. Timing samples are labeled with their environment.
- **Source-confirmed risk:** a specific code path or missing control, with a plausible consequence; not proof of an incident.
- **Hypothesis:** a candidate explanation requiring a trace or controlled comparison.
- **Unmeasured:** inaccessible or not exercised; never treated as a pass.

The clean, isolated worktree was branched before edits. No application fix, dependency upgrade, migration, database extension, load test, account change, or deployment was performed. Local build used the existing checkout's environment in process without printing credential values. Database diagnostics used explicit `READ ONLY` transactions; only SELECT and read-only EXPLAIN ANALYZE were issued. Such reads can wake compute and populate caches. No customer rows, emails, secrets, or query parameter values are included here.

## Checks and measured results

| Check | Result | Interpretation |
| --- | --- | --- |
| Locked install | `npm ci --ignore-scripts` succeeded, 758 packages added | Lifecycle scripts deliberately not run; subsequent build succeeded |
| Lint | Passed | Static quality only |
| TypeScript | `npm run typecheck` passed after build | Generated Next types available |
| Tests | 55 files, 216 tests passed, 16.96 s | Unit/component suite includes PGlite database tests; not browser E2E |
| Production build | `next build --webpack` passed; compilation 7.5 s, TypeScript 3.7 s | Local compilation time is not phone load time; deployment bootstrap not invoked |
| Runtime used locally | Node 23.10.0, npm 10.9.2 | Install warned this Node version is outside Vitest 4.1.0 and eslint-visitor-keys engine ranges; rerun future CI on a pinned supported LTS |
| Installed versions | Next 16.2.7, Clerk Next.js 6.39.5 | Clerk Core 2; do not apply Core 3-only advice blindly |
| Dependency advisory scan | 29 total: 1 critical, 19 high, 8 moderate, 1 low | Package-level advisory counts, not 29 independently exploitable production vulnerabilities |
| GitHub deployment metadata | Production deployment `7100374195`, successful 2026-10-15 18:01:11 UTC, baseline SHA | Confirms recorded deployment, not present runtime health or current domain routing |
| GitHub checks/config | No `.github` workflows; main branch protection API says `Branch not protected`; branch rules API returns `[]` | No applicable rules returned; external organizational procedures remain unverified |
| Deployment URL HTTP probes | `/`, `/inventory`, `/sw.js`, `/manifest.webmanifest` each 302 to Vercel SSO | Deployment protection blocked application inspection; these are not application timings or application headers |
| Database footprint | 9,848 kB; exact 269 products, 52 invoices, 3 drinks documents / 61 item snapshots | Inspected endpoint is from existing local `.env.local`; Vercel env mapping not independently verified |
| Database SQL plans | Drinks category listing 0.043 ms execution / 0.081 ms planning; simplified invoice/provider listing 0.123 ms execution / 7.094 ms planning | One warm/current-data sample each, not p95 and not the full page workload |
| Database transport | Initial metadata batch 545 ms; subsequent SELECT 1 round trips 431, 144, 144 ms | From audit machine to Neon, **not from Vercel**, not a proven cold-start measurement |
| Database health spot checks | 0 lock-waiting sessions; 0 unvalidated public constraints; 0 disabled user triggers | Point-in-time observations, not sustained monitoring or a complete schema equivalence check |
| Domain SQL spot checks | 0 inventory dates outside Tuesday; 0 active-menu family/status mismatches | Does not prove every domain invariant |

The connection's hostname indicates AWS us-east-1; PostgreSQL reports 17.11. Only `plpgsql` is installed: no `pg_stat_statements`, so historical slow-query attribution was unavailable. `pg_stat_database.stats_reset` was null, and postmaster start was 2026-10-18 17:19:55 UTC. Cumulative scan counters have no reliable observation window here; high scan counts are not evidence that indexes are needed. The connected Neon account listed no Walter project, so account-level compute sizing, suspension policy, restore retention and metrics were not verified. SQL access was available independently through existing local credentials.

### Build asset measurements

Local output contains 73 JavaScript chunks totaling **1,424,705 raw bytes** across the whole application. This is not a single page download. Root layout includes ClerkProvider; font files are built through `next/font/google`. CSS has no app-wide blur: fixed wallpaper and 28 px backdrop blur are limited to the launcher at `/`.

The following are static file inventories: union of `build-manifest.rootMainFiles` and route client-reference chunks, deduplicated, compressed individually with Node gzip. They exclude external Clerk scripts, HTML/RSC, CSS/fonts/images, cache effects, and conditional/lazy loading; they are **not measured first-load transfer or hydration times**.

| Route | JS files in inventory | Raw bytes | Gzip bytes |
| --- | ---: | ---: | ---: |
| `/` | 9 | 572,867 | 169,707 |
| `/inventory` | 11 | 596,997 | 178,440 |
| `/drinks` | 13 | 689,437 | 207,782 |
| `/invoices` | 11 | 598,235 | 178,347 |
| `/product-matching` | 10 | 583,796 | 173,548 |
| `/menu/versions/[id]` | 14 | 704,743 | 211,727 |

Generated `public/sw.js` contains 97 precache URLs totaling **1,842,687 raw asset bytes**. No private page URLs were present in that precache inventory. It does contain chunks/fonts across routes and the 113,142-byte launcher wallpaper. Browser transfer, duplicate network requests, cache reuse, and actual install CPU time remain unmeasured. Private source photos are 295,173 and 250,190 bytes; `getManualPhotos()` converts both into base64 data URLs sent through the `/inventory/review` page props (about 727 kB of base64 before transport compression). This is route-specific, not every inventory visit.

## Findings

### F1 — High: installed framework has security advisories (measured and source-confirmed)

`package-lock.json` resolves Next 16.2.7. The current registry advisory response flags the package critical overall. App Router plus Server Actions matches the feature prerequisites of [GHSA-m99w-x7hq-7vfj](https://github.com/advisories/GHSA-m99w-x7hq-7vfj), a CPU exhaustion issue fixed for that advisory in 16.2.11. Do not upgrade only to that minimum: later advisories in this scan require newer releases (some through 16.3.8). Select and verify a currently patched compatible version in the fix PR.

Exploitability is not identical across advisories: Windows hosting is not established; production builds use webpack rather than Turbopack; no custom server, external rewrite destination, or `next/og` ImageResponse route was found. Consequently the critical [ImageResponse advisory](https://github.com/advisories/GHSA-vcvr-r3jv-pc5j) is a dependency match, not a demonstrated reachable RCE here. Image optimizer reachability and hosting mitigations require deployment review. No exploit was attempted. This is a security maintenance priority, not evidence that an attack caused slow phones.

The scan also flags next-pwa/Workbox and development tools. `PRODUCTION.md` accepts older PWA findings but has no current advisory-by-advisory reachability review. Avoid `npm audit fix --force`: suggested fixes include major-version downgrades for some tools.

### F2 — High: migration ledger disagrees with deployed-looking schema (measured)

The inspected database's `drizzle.__drizzle_migrations` contains exactly five entries, whose hashes match repository migrations 0000–0004. The repository journal contains 28 entries through 0027, and later tables/functions exist. `scripts/inventory-bootstrap.ts` applies absent feature migrations inside its own SQL flow but does not reconcile the Drizzle journal.

The next journal migration, `drizzle/0005_opposite_hairball.sql`, drops `servicios` and `pagos_servicios` without `IF EXISTS`; both tables are already absent in the inspected database. Therefore the documented unconditional `npm run db:migrate` path would attempt an already-applied operation and fail on this state. This conclusion follows from the journal, SQL and existence checks; the mutating command was not run.

`docs/inventory.md` already warns against blindly applying the migration directory to an unknown ledger and calls out destructive older migrations. That is useful guidance, but it conflicts with the simpler deployment sequence in `PRODUCTION.md` and does not reconcile the measured ledger state. The follow-up should unify these instructions.

`vercel.json` runs `npm run build && npm run db:prepare-inventory`. Preparation checks only `VERCEL=1`, not production-vs-preview identity. Its fail-closed partial-schema checks are useful, but a build can still apply migrations to whatever `DATABASE_URL` it receives. Preview/production credential sharing is **unverified**, not asserted. Concurrent builds and the separation between schema changes and traffic promotion need an explicit policy. Recovery and rollback must be tested on a disposable copy before repairing the ledger; never mark migrations applied without comparing their actual effects.

### F3 — Medium: authorization repeats database round trips (source-confirmed; latency contribution unmeasured)

`src/proxy.ts` fetches the Clerk user and resolves access before forwarding a protected request. `src/lib/auth/access.ts` resolves Admin, then Waitress, then Kitchen through up to three sequential SQL lookups. Layouts, queries and actions call the same resolver again; it has no explicit request-scoped memoization. For example `/inventory` starts three query helpers in parallel, each gated, and its layout separately resolves the group. `/drinks` layout performs authorization, category-assignment fetching (itself gated), then another group resolution before rendering.

Repeated resolver invocations and SQL reads are visible in source. Do not equate every `currentUser()` call with a separate Clerk HTTP request: SDK/Next fetch deduplication can apply within a request, and proxy/render boundaries need tracing. [Clerk documents request deduplication](https://clerk.com/docs/reference/nextjs/app-router/current-user); installed SDK implementation delegates to `users.getUser`. Measure actual upstream counts.

Request-scoped memoization and a single precedence-preserving membership query could remove redundant waits without stale permissions between requests. Global role caching is unsafe without a deliberate revocation policy. Keep server-side action gates and Admin precedence.

### F4 — Medium: no diagnosis or recovery UI for slow/failing navigation (source-confirmed)

No route `loading.tsx`, `error.tsx`, or `global-error.tsx` exists. There is a small Suspense boundary around drinks navigation, not a general loading strategy for protected data. No app Web Vitals collector, request correlation, performance spans, or structured error reporting was found. Some failures log generic errors; membership lookup catches can silently deny access, and the drinks-save catch maps unknown failures to a user message without logging the failure.

The user may experience a wait with little visible feedback; a database outage may resemble revoked access. This is a concrete observability/recovery gap, not proof of slow server rendering. Add loading feedback and recoverable errors while preserving entered values, and make fail-closed permission errors diagnosable without exposing personal information.

### F5 — Medium: full-history fetching and large client state (source-confirmed; growth risk)

- `queries/invoices.ts:getInvoices()` loads every invoice and sends them to a client-filtered list. Invoice form data loads the full provider/product catalogue. Price history is unbounded.
- `queries/drink-documents.ts:getDrinkDocuments()` selects all columns, including JSON item snapshots, for every document in a category just to build list rows/counts. Drinks edit-event history is also unbounded.
- `queries/menu-versions.ts:getMenuVersions()` already omits document bodies, a useful existing projection, but still lists all version headers without pagination.
- `queries/product-matching.ts` groups catalogue providers with a nested `rows.map(...rows.filter(...))`; `matching-review.tsx` compares the inventory/catalogue cross-product. `duplicate-review.tsx` computes product pairs in `useMemo`. Memoization avoids some repeated work, but initial work and dependency-changing recomputation remain quadratic.
- `MenuVersionEditor` recomputes `compareMenus` and filters/maps editable items on render; each keystroke updates the document and rerenders the parent. Drinks editor likewise updates parent state for every count. No measured React commit times or wasted-render counts exist.

Do not label all this a current performance bug: there are only 52 invoices and 3 drinks documents now, and inventory history already paginates ten headers. Bound growth with projection/pagination; optimize editing/matching only on affected routes and representative data. Preserve complete manual search and explainable matching; never replace review with automatic merging.

### F6 — Medium: install/update and unsaved-entry resilience need device testing (source-confirmed risks)

`next.config.ts` disables start-URL caching and uses `NetworkOnly` runtime caching, which protects shared-device confidentiality. This is an **online-required** PWA, consistent with the UI. Do not promise offline saving. The generated worker still precaches static assets across the app, calls skipWaiting and claims clients. A new worker may activate while old UI is open; stale chunk/action compatibility across deployments is untested.

Drinks and menu edits are stored in component memory until saved; no leave-page warning or draft persistence exists there. A reload, tab eviction, or accidental navigation loses unsaved input. Ordinary save failures keep values in the mounted component, and drinks conflicts are surfaced rather than silently overwriting another user. Manual catalogue review separately has user-scoped localStorage drafts; do not generalize that behavior to other forms.

Investigate asset precache scope and dirty-form navigation/update UX together, retaining NetworkOnly for authenticated responses. Offline write queues are a separate product/data-consistency decision, not an audit fix.

### F7 — Medium: authorization defense and real-session coverage are uneven (source-confirmed risk)

All exported functions in `src/lib/actions` were scanned for their own access gates, including legacy `saveDrinkCounts`. Admin precedence and denied non-GET behavior are explicit in `auth/policy.ts`. New inventory/drinks/menu-version query helpers generally enforce access. However legacy invoice/provider/employee/recipe query paths and several pages rely on proxy protection rather than their own query/page access boundary. Example: `app/invoices/page.tsx` calls `getInvoices()` directly; neither adds a role check.

This is a defense-in-depth gap, **not a demonstrated bypass** of the deployed proxy. Consolidate authorization at server-only data entry points and prove it with real-role browser/direct-action tests. Existing policy and PGlite tests mock parts of Clerk/auth and cannot validate cookies, proxy execution, deployed assets, or browser back-cache behavior. Adding guards should be paired with F3 deduplication so safety does not amplify network waits.

### F8 — Medium: quality and recovery procedures are not enforced by repository automation (measured/source-confirmed)

The documented `npm run ci` gate exists, but there is no checked-in CI workflow. Vercel's build does not run lint or the test suite. The branch protection endpoint reports no traditional protection and the branch rules endpoint returns no applicable rules. Browser E2E is explicitly excluded by the old runbook. `scripts/snapshot-database.ts` exists, but backup freshness, independent retention, restoration time and production restore permissions were not established. The runbook also describes only Admin/Kitchen and is stale about Waitress/drinks and migration behavior.

Ten users reduce concurrency requirements, not the consequences of incorrect permission changes, lost counts, or a failed restore. Establish a small repeatable gate and a realistic recovery drill rather than adding infrastructure complexity.

### F9 — Low pending measurement: rendering and query-index candidates

Launcher-only backdrop blur/fixed wallpaper can be expensive on some GPUs; compare the same phone with those effects disabled in an isolated preview. No evidence connects it to slowness on inner work pages. Inputs already use mobile-friendly sizing in many places; drinks counts set `inputMode="decimal"`, and reduced-motion CSS exists. Keyboard obstruction, zoom, scrolling, touch targets, focus, contrast and old iOS/Android support were not tested on devices.

Existing indexes support inventory latest observations, unique weekly runs, drinks date/category identity, menu family/status history and document edit history. Several older foreign-key filter paths have only primary-key indexes (e.g. invoice lines by invoice/product, price history by product); `documentos_bebidas` unique index leads with date, not category. These are candidates at future volume, not justification for immediate indexing: present sample plans are fast and sequential scans of tiny tables are reasonable. Duplicate-product queries contain correlated aggregates that should be profiled if that screen is implicated.

No evidence justifies a new connection pool, switching Neon drivers, increasing compute, adding Redis, or a read replica for ten users.

## Domain and correctness review

| Domain | Verified source/tests | Remaining limit |
| --- | --- | --- |
| Roles | Admin unrestricted in `canAccess`; verified primary email; Admin resolves first; actions check area | No signed-in role matrix against deployment; legacy query gates as F7 |
| Inventory | Tuesday–Monday `inventory_week`, Montevideo clock; zero distinct from blank; append-only observation/snapshot safeguards | SQL spot check only for existing week dates; no two-phone save test |
| Products | Reviewed equivalences and archive state preserve separate IDs; guarded delete paths; historical references retained | No exhaustive concurrency test of delete/link races in live Postgres |
| Providers | Catalogue association not stock provenance; drinks supplier view explicitly states this | Some duplicate-review count evidence still references legacy drinks observations, now empty after 0027; review semantics before using those counts as complete drinks history |
| Menus | Explicit `menus_activos`, per-family versions, immutable submitted content, revision/base checks | Live check covered family/status mismatch, not every pointer/content relationship |
| Drinks | Unique date/category documents; creator/Admin edit; `save_drink_document` row lock and revision check; null quantity; actor/time-only events | No concurrent real-session/network-loss test; no automatic rollback snapshots by design |
| Invoices | Server-calculated money with Decimal, validation, repository `db.batch` for related writes | Create actions generate a new ID per attempt; a lost success response then retry can duplicate a create. Idempotency and double-submit testing needed; no incident demonstrated |

## Ordered separate fix PRs

P1 = next hardening work; P2 = measured performance/reliability work; P3 = conditional optimization. Each row is an independent reviewable PR. No row authorizes production migration or paid service adoption.

| Order / priority | Concrete scope and reason | Evidence / dependency | Validation and acceptance |
| --- | --- | --- | --- |
| 1 / P1 — Patched dependency baseline | Upgrade Next + compatible eslint config to a currently patched release; triage production vs tooling advisories; update dated risk acceptance. Keep PWA replacement separate. | F1; independent | Lockfile install, lint/types/216+ tests/build; current audit has no unaccepted reachable high/critical runtime finding; signed-in/out and action smoke checks; retain a tested rollback build. No force-fix downgrades. |
| 2 / P1 — Reconcile migration ownership | Compare journal/schema on disposable restored DB; define one migration authority, fail-closed reconciliation, explicit environment identity and serialized migration step; remove schema mutation from ordinary builds after replacement is proven; correct runbook. | F2; independent of profiling; required before any schema-changing PR | Fresh DB and restored existing-state migration tests pass twice; 0005 replay case covered; partial schema rejected; preview cannot target production; before/after constraints/triggers/data invariants match; documented backup/restore and app rollback compatibility. Never repair ledger by blind inserts. |
| 3 / P1 — Reproducible CI and critical browser gate | Pin supported Node LTS; run lint/types/unit/component/database/build checks; add isolated Admin/Kitchen/Waitress/unauthorized browser smoke and direct-action denial tests; document required checks and ruleset/protection setup. | F7/F8; 1 for stable dependency baseline; 2 for safe DB fixtures | No production credentials in tests; denial tests cannot read or mutate other areas; Admin remains unrestricted; a deliberately failing check blocks the intended merge workflow once configured; fresh checkout reproduces gate. |
| 4 / P2 — Minimal performance and error instrumentation | Add opt-in/limited-retention Web Vitals and request IDs, timings for proxy auth/group/data/render/action, sanitized failures and build version. Use existing logs first; no paid vendor required. | F3/F4; can begin while 1–3 proceed | One slow and one good phone yield correlatable navigation/input traces; no emails, counts, bodies or tokens logged; actual Clerk/SQL call counts visible; instrumentation overhead compared with disabled baseline; no authorization behavior changes. |
| 5 / P2 — Authorization consolidation | Request-scoped resolver memoization, one role membership query preserving precedence, legacy data-layer gates; retain proxy/action checks. | F3/F7; 3 and 4 | Real role/verified-email/revocation tests; denial on DB failure; group lookup count bounded per render request; compare p50/p95 auth and TTFB using identical scenarios; no cross-request stale role cache. |
| 6 / P2 — Loading, errors and save recovery | Add route loading/error boundaries and useful retry UI; log unexpected failures safely; keep dirty inputs on recoverable failure; add explicit idempotency to invoice creation with an appropriately scoped request key. | F4/F8 and invoice retry risk; 2 before schema addition, 3–4 | Offline/timeout/lost response/retry/double-tap tests create at most one invoice per intent; distinct intentional invoices still allowed; failed drinks save retains values; stale revision stays rejected; loading feedback appears promptly without exposing unauthorized data. |
| 7 / P2 — Bounded history payloads | Paginate invoice/drinks/version histories, select only list fields, compute counts server-side, fetch full document on open; retain search/filter completeness. Add indexes only with plans. | F5; 2–4; independent of renderer changes | Current-data and 10×/100× synthetic history comparisons; bounded response bytes/DOM rows; stable ordering/cursors and complete filter results; no null-to-zero conversions; plans and p95 captured before/after. |
| 8 / P2 — PWA update and dirty-form safety | Limit static precache where supported or replace PWA layer in this dedicated PR; deliberate activation/update UX; dirty-form leave protection or scoped draft recovery with retention/sign-out policy. | F6; 1, 3, 4 | Existing installed worker upgrades across two releases; no private HTML/RSC/API caches; sign-out/account switch/back/offline tests; reload/update never silently loses dirty input; first-install bytes and long tasks recorded; online-required messaging remains truthful. |
| 9 / P3 conditional — Fix measured interaction hot spots | Only implicated components: memoized/indexed matching data, isolated row editors, deferred search/windowing if needed; separately reduce launcher blur if frame trace implicates it. | F5/F9; 4 baseline and preferably 7–8 | Same weak phone shows lower interaction latency/long-task time and fewer excessive React commits; keyboard/focus/manual search preserved; compare good phone for regressions; keep changes without demonstrated benefit out. |
| 10 / P3 conditional — Private review image delivery | Authorized image endpoint/lazy retrieval and sensible thumbnail sizes instead of both base64 images in page props; preserve original review evidence access. | Asset measurements; only if review route used; 3–4 | Signed-out/unauthorized image denied; no public private-photo cache; substantially smaller initial RSC payload; legible zoomed review; manual draft recovery intact. |
| 11 / P2 — Recovery drill and operating guide | Restore isolated snapshot, verify critical read/write workflows there, record RPO/RTO and responsible operator; update role, online-only and deployment instructions. | F2/F8; 2–3 | Timed successful restore and rollback drill with domain invariants; retention and backup freshness known; credentials delivered via secure environment, not docs; production unaffected. |

Conditional PRs 9–10 may be dropped or reordered after profiling. If F4 reveals authentication dominates, prioritize 5; if input/scroll CPU dominates, prioritize the implicated part of 9. Do not wait for a phone trace to address F1/F2. Database capacity changes require separate evidence of saturation.

## Exact inputs needed to establish the bottleneck

| Needed input or access | Diagnostic purpose | Minimum safe collection |
| --- | --- | --- |
| One affected and one good phone: make/model, approximate RAM if known, OS and browser versions | Separate CPU/GPU/browser compatibility from server behavior | No identifiers/serial numbers needed |
| Exact slow screen and action, account role, approximate record count, expected vs observed delay | Distinguish launch/navigation/typing/scroll/save and role-specific queries | A reproducible sequence and timestamp with America/Montevideo timezone |
| Installed PWA vs browser, app last updated, first visit vs repeat, battery saver/thermal state | Test stale worker, cold cache and device throttling hypotheses | Compare without clearing storage or risking unsaved input first |
| Wi-Fi vs cellular, same network on both phones, one controlled repeat after idle | Isolate transport and possible cold startup | 5 cold-ish/first visits and 10 warm repetitions per device; report medians/ranges, not statistical p95 from tiny samples |
| 20–30 second screen recording showing the delay, with private values hidden | Identify the exact interaction and apparent freeze/feedback | Record only the relevant flow; secure attachment, not public issue |
| Android remote Chrome Performance/Network trace or iPhone Safari Web Inspector timeline | Split request wait, JS/hydration, style/layout/paint and long tasks; establish actual transferred bytes | Sanitized HAR and performance trace; strip cookies, Authorization, query values, form bodies and customer data before sharing |
| Canonical production URL and a signed-in test browser session for each role | Exercise real routes, cookies and installed worker safely | User signs in; no passwords/tokens pasted in chat; no production write tests |
| Vercel read-only access to `sobremesas-projects/juancarta`: deployments, runtime logs, metrics and settings | Match time/request/build to function region, duration/errors/memory, auth latency, preview DB isolation | Secure connector/session; inspect names/scopes of env settings and privately compare DB identities, never expose values |
| Correct Neon project/account access for the endpoint in local env | Verify it is production, compute region/size/suspension, metrics and restore retention | Read-only project access; existing SQL access is sufficient for narrow current-state queries |
| Optional approved `pg_stat_statements` instrumentation or equivalent DB tracing | Attribute repeated/slow queries over a known workload window | Extension installation is a separate mutation requiring approval; not necessary if app query timings answer the question |

No extra token budget fixes missing device evidence. These inputs let us choose whether to reduce bytes, remove CPU work, shorten auth/data round trips, or repair update/network handling.

### Reproducible measurement protocol

Use a production build on an isolated environment with representative data and safe test users. First collect navigation/interaction baselines with no app changes. Capture `/`, the user's implicated route, `/inventory`, and the relevant drinks/document or invoice path. Record deployment SHA, worker version/controller, role, counts, viewport, network profile and cache state for every run. Measure TTFB, LCP, CLS, interaction duration/INP when available, long tasks, resource transfer, RSC bytes, render commits and action completion separately.

Pair the trace with server timings using request IDs. A slow TTFB with little client CPU suggests upstream wait; a fast response followed by long scripting suggests hydration/rendering; janky scrolling with paint/compositing activity suggests visual effects; slow saves require action/auth/SQL timing and retry inspection. Test cold-ish and warm cases without assuming a warm SELECT represents a suspended compute. Browser CPU/network throttling is a useful comparison, not a substitute for a real weak phone.

Provisional targets for agreement: p75 LCP ≤2.5 s, INP ≤200 ms, CLS ≤0.1 in field-capable collection; visible feedback within 100 ms for tap/save; no lost input or duplicate writes in defined failure tests. For ten users, report individual worst cases and sample counts alongside aggregates; lab runs alone cannot establish a field p75. Each optimization must compare the same scenario before/after and preserve correctness.

## Reproduction notes and remaining exclusions

Run `npm ci`, `npm run lint`, `npm run test`, `npm run build`, then `npm run typecheck` on the chosen supported Node version with required environment securely supplied. Do **not** use `vercel.json`'s full build command or run migrations to reproduce this audit. The initial audit used `npm ci --ignore-scripts`; normal CI should explicitly assess required install scripts. Dependency results are time-sensitive; regenerate `npm audit --json` and review reachability at implementation time.

For SQL diagnostics use explicit read-only transactions: counts, table/index catalogues, `pg_extension`, migration hashes, lock waits, constraint/trigger state and domain aggregates. The sample plans were `SELECT * FROM documentos_bebidas WHERE categoria='Cervezas' ORDER BY fecha DESC` and a projection of invoice ID/date/provider name ordered by invoice date/created_at; neither is a complete page benchmark. No customer values were exported. Full bootstrap SQL was not run because it can write.

Not measured: authenticated HTML/RSC transfer, device Web Vitals, CPU/GPU/memory, React rerenders, Clerk backend timings/rate limiting, function logs or region, ten-user concurrent workload, production application security headers, installed PWA upgrades/offline/sign-out behavior, actual production env-to-database mapping, restore exercise, and live concurrent mutation semantics. The discovered immutable deployment URL redirects to Vercel SSO, so unauthenticated curl results cannot substitute for those checks.

Framework guidance consulted: [Next.js production checklist](https://nextjs.org/docs/app/guides/production-checklist) (streaming, data boundaries, real metrics), [Clerk currentUser](https://clerk.com/docs/reference/nextjs/app-router/current-user) (request deduplication), and [Vercel branch deployment exclusion](https://vercel.com/docs/project-configuration/git-configuration#gitdeploymentenabled). Recommendations above remain tied to this repository and the measurements, rather than generic checklist compliance.
