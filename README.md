# Walter OS

A mobile-first PWA for small restaurant operations.

## Tech Stack

- **Framework:** Next.js 16 App Router
- **Styling:** Tailwind CSS
- **Database:** Neon Postgres with Drizzle ORM
- **Auth:** Clerk
- **PWA:** next-pwa
- **Validation/tests:** Zod, decimal.js, Vitest, Testing Library

## Getting Started

1. Copy `.env.example` to `.env.local` and fill in credentials:
   - `DATABASE_URL` - Neon pooled application connection string
   - `DATABASE_URL_UNPOOLED` - Optional Neon direct connection string for migrations
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Clerk publishable key
   - `CLERK_SECRET_KEY` - Clerk secret key

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000)

## Current Modules

- **Proveedores** - Product and service providers, catalog links, current prices, visit days, and provider debt.
- **Facturas** - Product and service invoices with a simple `paid` boolean, provider-owned product lines, price history, and service amounts.
- **Empleados** - Employee profiles and extra hours.
- **Recetas** - Recipes and product ingredient quantities.
- **Menu** - Sellable menu items and optional recipe links.

## Data And Validation

- Server actions validate public mutation inputs with Zod before writes.
- Money and invoice totals use decimal.js with explicit two-decimal rounding.
- Client forms stay lightweight and show Spanish action errors via shared form feedback.
- Destructive deletes are blocked when records have financial or historical references.
- DB-backed pages are marked dynamic so invoices, providers, employees, recipes, and menu data are read per request instead of captured during `next build`.

## Database Commands

```bash
npm run db:generate  # Generate Drizzle migrations from schema changes
npm run db:migrate   # Apply checked-in migrations with Neon HTTP migrator
npm run db:push      # Development-only schema push
npm run db:studio    # Open Drizzle Studio
```

Production deploy order is documented in [PRODUCTION.md](./PRODUCTION.md).

## Quality Gate

```bash
npm run lint
npm run typecheck
npm run test
npm run build
npm run ci
```

GitHub Actions runs lint, typecheck, unit/component tests, and build. There is no browser E2E suite.

## Auth Assumption

Clerk protects the application. This app intentionally has no admin email allowlist and no authorization matrix; any signed-in production user is allowed to use it.
