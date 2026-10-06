# Inventory MVP

Implemented on `codex/inventory-pwa`. This repository is named Walter OS; its
restaurant data model and existing app are preserved for the requested Juancarta
inventory capability. No remote deployment or production schema change was made.

## Repository investigation

- Next.js 16 App Router, React 19, TypeScript, Tailwind 4. Pages/feature components
  live in `src/app`; there is no separate API service.
- Server-only queries and mutation-only Server Actions live in `src/lib`, with
  Zod validation and shared `ActionResult`/form feedback.
- Neon PostgreSQL via Drizzle's HTTP driver. Multi-statement writes use atomic
  `db.batch`, not interactive transactions (unsupported by that driver).
- Canonical `products` maps to `productos`. Units are in `unidades`; the legacy
  product unit string remains populated alongside `unidad_id`.
- Providers (`proveedores`) and products have an existing many-to-many join
  (`proveedor_productos`) carrying price and package quantity. A product with no
  join rows is already a valid provider-less product. No nullable provider column,
  product rewrite, or product/provider migration is needed.
- Clerk handles identities; `usuarios_autorizados` is the actual main-app
  allowlist. README/runbook auth claims were stale and have been corrected.
- Root manifest and next-pwa already exist. Root layout supplies global styling
  and Clerk, without forcing main-app navigation into inventory.
- Drizzle SQL migrations + snapshots + journal; manually applied by
  `scripts/migrate.ts` before deployment. No checked-in hosting-provider setup or
  browser E2E suite. Vitest covers unit and Testing Library component tests.
- Working tree was clean on `main`; feature branch created before implementation.
  Existing branches and worktree branch were left untouched.

## Data relationships

```text
heladeras ──< heladera_productos >── productos ──< proveedor_productos >── proveedores
                       │
                       └──< observaciones_inventario
Clerk user ID ─────────────── registrado_por (immutable actor identifier)
```

New tables:

- `heladeras`: UUID, unique positive number, optional name, active, timestamps.
- `heladera_productos`: composite fridge/product key; a product may be in multiple
  fridges. Restrictive foreign keys prevent deletion of tracked products.
- `observaciones_inventario`: identity ID, fridge/product composite FK, absolute
  nonnegative quantity, unit snapshot, database timestamp with timezone, Clerk
  user ID. No updates/deletes are exposed; a database trigger also rejects them.
- `usuarios_inventario`: separate normalized email membership, following the
  existing main-app allowlist pattern. No users are seeded automatically.

No session or current-state table. One save inserts all submitted observations
atomically with a common database timestamp. History already answers date-based
questions; adding a session entity has insufficient immediate value.

Quantities allow two decimal places (for existing weight/volume units), including
zero, up to 9,999,999,999.99. Empty fields are omitted rather than treated as zero.
At most 200 entered counts per save; users may save larger catalogues in portions.
Creating a product and its fridge membership uses one atomic batch.

## Current count and weekly comparison

For each fridge/product:

1. Current = highest `registrado_at`, then highest identity `id` to break ties.
2. Target = current timestamp minus **168 elapsed hours**.
3. Previous = highest timestamp **at or before** target, then highest ID.
4. Difference = current minus previous using decimal arithmetic.

Indexed lateral queries retrieve only these two observations for each catalogue
row, instead of loading its complete history. An older available baseline is
allowed without a cutoff; the UI explicitly shows its date and quantity. The
comparison is anchored to the latest observation, not today's wall-clock date.
No baseline means “Sin inventario anterior”, never an assumed zero. Changed unit
codes suppress comparison. Historical dates display in America/Montevideo.
This is stock change, not usage, consumption, or restocking inference.

## Access and provider handling

The application now has two groups backed by the existing membership tables:

- **Admin** (`usuarios_autorizados`): main app and inventory, landing at `/`.
- **Kitchen / Cocina** (`usuarios_inventario`, without Admin membership): inventory
  only, landing at `/inventory`.
- Neither table: no application access. Spanish “Solicitá acceso” guidance asks the
  user to contact an administrator using their login email.

Admin takes precedence for existing dual memberships. No migration, copying, or
replacement of existing membership IDs is required. Sign-in and PWA installation
do not assign a group. Clerk's verified primary email is required in both cases.

Admins use **Accesos** (`/access`) to assign a normalized email to Administrador,
Cocina, or Sin acceso. Group changes atomically remove conflicting membership;
revocation removes both. An admin cannot demote or revoke their own account.
Kitchen users cannot read the member list or invoke group-management actions.
This screen assigns permissions only; it does not send invitations or emails.

Kitchen requests to administrative pages redirect to inventory; forbidden POSTs
and API requests receive 403 instead of being forwarded. All action boundaries
independently authorize their own feature, including main actions posted to an
inventory URL. Main home rendering also checks the group before returning admin
navigation. Admin sees an active inventory tile and a return-to-home inventory
link; Kitchen never receives the main navigation. Reopening `/` or retrying from
the request-access page resolves the current group without signing in again.

Provider information lists all linked provider names (the actual relationship is
many-to-many). With none, the UI says “Proveedor no asignado”. On an existing
product-provider page, “Asociar producto existente” lets a main user select the
canonical product, price, and package quantity. It adds the usual provider link
and price history atomically; product IDs and inventory history do not change.
Product deletion gives a clear error for inventory-tracked products.

## PWA and interaction

- `/inventory`: numbered fridge list and lightweight fridge creation form.
- `/inventory/[id]`: catalogue search/add/create plus inline absolute counts.
- `/inventory/manifest.webmanifest`: separate identity, name, start URL, scope,
  standalone display, and existing 192/512/maskable icons.
- Manifest scope is `/inventory` to include Next's canonical no-trailing-slash
  landing URL; all implemented subroutes are under `/inventory/`.
- Root service worker is reused. Service-worker scope is shared; manifest/UI
  boundaries are separate. Browser installation and Clerk sign-in may temporarily
  use browser UI outside the inventory scope.
- Runtime requests are network-only, and root start-page caching is disabled.
  This applies to the main app too: authenticated HTML/data should not be retained
  for shared-device offline access. Static assets remain precached by next-pwa.
- No offline writes, automatic retry queue, or invented offline success. Failed
  saves preserve form inputs. All copy stays in the existing Spanish dictionary.

## Migration safety and rollout

`drizzle/0012_inventory.sql` creates four new tables, their indexes/constraints,
and one append-only trigger/function. It contains no alteration of an existing
table, data rewrite, destructive seed, ID replacement, or removal. Existing
products and providers remain valid. New foreign keys can block future deletion
of inventory-linked products; the main delete action now explains that restriction.
Trigger SQL is hand-authored after generated DDL and must be retained in migration
history (Drizzle snapshots do not describe triggers).

**Do not blindly apply the whole migration directory to a database with an unknown
migration ledger.** Existing older migrations include destructive operations,
notably 0011's employee salary-column replacement. Before rollout, confirm the
intended environment and that migrations through 0011 are already applied. Review
any unrelated pending migrations separately. No configured database was migrated
for this task.

Validate on an isolated database/branch first, then apply 0012 through the existing
migration workflow before deploying the new app. Provision chosen inventory
memberships explicitly. Fridges can then be created in the inventory UI.

Application rollback: keep the new tables/history and restore previous app code.
Do not drop observation tables to roll back the UI; that would destroy counts.
The restrictive product FK continues to protect records under old app code too.

## Verification

The tests use dev-only PGlite (embedded PostgreSQL) and the actual Drizzle queries
and action code. They apply the existing migrations in a fresh isolated database,
insert pre-feature product/provider fixtures, then apply 0012 and confirm those
rows remain unchanged. No production connection is used. A test adapter models
Neon batch transaction semantics; production HTTP transport is not exercised.

Coverage includes linked/unlinked products, atomic creation and provider linking,
12 then 8 with both observations retained, weekly boundaries and timestamp ties,
fridge isolation, missing baselines, zero and decimal quantities, invalid counts,
append-only/FK constraints, inactive fridges, batch rollback, separate access,
unverified/unauthenticated users, unavailable allowlist, and inline form success
and network-failure behavior. Full existing unit/component suite also runs.

Deployment/real-account smoke checks still needed when rollout is requested:
verify an inventory-only account can count but cannot access main pages/actions,
provision the intended users, and install on the actual phone over HTTPS. These
checks cannot be claimed from isolated database/component tests.

Verified locally on 2026-09-30: `npm run ci` passed (lint, typecheck, 70 tests
across 16 files, production build). `npm run db:generate` reported no schema
changes. Production-mode HTTP smoke checks returned public HTTP 200 for the
inventory/root manifests, service worker, and inventory icons; signed-out
inventory list/detail and main provider routes redirected to sign-in. The built
worker uses NetworkOnly runtime handling. Physical phone installation and
signed-in production behavior remain unverified.

## Important implementation files

- `src/db/schema/inventory.ts` and `drizzle/0012_inventory.sql`: persistence and
  append-only enforcement; snapshot/journal kept in sync.
- `src/lib/auth/access.ts`, `src/proxy.ts`, existing main action files: independent
  membership checks at routing and action boundaries.
- `src/lib/actions/inventory.ts`, `src/lib/validators/inventory.ts`: validated
  absolute counts, catalogue membership, fridge and canonical product creation.
- `src/lib/queries/inventory.ts`, `src/lib/inventory/comparison.ts`: indexed
  current/baseline lookup and exact decimal differences.
- `src/app/inventory/`: mobile list, catalogue forms, inline counts, own layout,
  explicit manifest route. `src/lib/inventory/manifest.ts` defines its metadata.
- `src/app/providers/[id]/link-product-form.tsx` and products actions/queries:
  associate an existing canonical product with a provider.
- `next.config.ts`: shared service worker network-only runtime policy.
- `src/i18n/messages.ts`: Spanish inventory copy.
- Inventory unit/database/component tests under `src/__tests__/`; dev-only
  `@electric-sql/pglite` dependency for isolated PostgreSQL verification.

## Vercel inventory setup

`vercel.json` runs the production build followed by `db:prepare-inventory`.
The latter runs only when `VERCEL=1` and uses that deployment's `DATABASE_URL`.
It atomically applies only 0012 when all four inventory tables are absent and
checks existing installations. An advisory transaction lock serializes concurrent
setup. Partial installations fail closed without modifying existing data.

**Deployments no longer grant or restore access to any email.** Existing
memberships remain valid; new users need an explicit group assignment by an
Admin. This also ensures revoked access stays revoked after another deployment.

The configured legacy database has schema changes newer than its Drizzle ledger.
The deployment setup deliberately neither replays older migrations nor fabricates
ledger entries for them. Reconcile that pre-existing ledger drift before using the
full `db:migrate` workflow. Setup does not run during local builds or tests.

`/inventario` and its subpaths redirect to the established English `/inventory`
routes, preserving existing installed PWA identity, scope, and bookmarked links.
Installing either entry point does not grant access.

Group-access verification (2026-10-01): full `npm run ci` passed with 87 tests
across 20 files. PostgreSQL tests exercise group assignment, promotion, demotion,
revocation, no-group denial, Kitchen self-promotion denial, and Admin precedence.
Component tests verify Admin navigation, Kitchen redirects, and Spanish access
requests. Production-mode HTTP checks confirm `/inventario` aliases, signed-out
protection on `/`, `/inventory`, and `/access`, and the public PWA manifest.

## One-time handwritten catalogue review

`/inventory/review` contains the two user-supplied handwritten pages dated
29/9/26 and 72 manually transcribed candidate lines. This is a fixed review,
not a general photo-upload or OCR service; it needs no AI API key or new schema.
Photos live outside `public` and are included in the deployment's server file
trace. The authorized inventory page returns them as inline images.

Each candidate shows its page, section, original transcription, clarification,
editable canonical name, existing-product selector, fridge and unit. Reviewing
an entry only changes a browser-local draft scoped by Clerk user ID. The final
batch button creates canonical products and fridge memberships atomically.
Existing exact-name products with matching units are reused on retries; ambiguous
existing names or conflicting units require correction. Cross-device simultaneous
creation is not protected by a unique product-name constraint in the legacy
schema. No stock observations are written, and HAY/fractions/circled symbols
remain source references. Browser progress does not sync across devices.

Candidate names are tentative readings, especially abbreviations, bastones,
canadiense and handwriting marked by a clarification. Sections are not assigned
as fridges automatically. The user must confirm actual storage and units.

## Simple inventory list

`/inventory/list`, linked from the inventory home as “Ver último inventario”,
shows a plain text list grouped by active fridge. It uses each product's latest
saved observation, including its date, rather than implying a shared count
session that the schema does not store. Products without counts say “Sin conteo”.
Editing a quantity appends a new observation using the existing count action.
Removing an entry requires inline confirmation and sets the fridge membership's
`activo` flag to false; canonical products and observation history are preserved.
Re-adding through catalogue search or the paper review restores that membership.
Removed entries cannot receive new counts until restored.

Migration `0013_soft_valkyrie.sql` adds only the membership flag, defaulting all
existing rows to active. The deployment bootstrap applies that reviewed addition
only when the column is absent, without replaying legacy migrations. Tests use
isolated PostgreSQL; no production schema or inventory data is modified locally.

Each fridge/product also has an optional shared note (`heladera_productos.nota`,
migration 0014). The list shows the note and edits it alongside quantity. Notes
are specific to the fridge membership and visible to all inventory-authorized
users. Editing or clearing only a note creates no observation; when quantity is
changed, the note update and new count are committed atomically. Notes are limited
to 1,000 characters. Existing notes are retained when memberships are hidden or
restored. The deployment bootstrap safely adds the nullable note column.

Kitchen and Admin can edit fridge names and shared commentary through “Editar
nombre y comentario” on the fridge list, fridge detail or simple inventory list.
Names allow 200 characters; commentary allows 1,000; either can be cleared.
Fridge number, memberships and counts are unchanged. The action independently
requires inventory access and only updates active fridges. Migration 0015 adds
nullable `heladeras.comentario`; the deployment bootstrap applies it if absent.
