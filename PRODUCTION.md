# Production Runbook

## Deployment Order

1. Confirm the quality gate passes locally or in CI:
   ```bash
   npm run ci
   ```

2. Confirm production environment variables are present:
   - `DATABASE_URL`
   - `DATABASE_URL_UNPOOLED` if available
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`

3. Apply database migrations before deploying application code:
   ```bash
   npm run db:migrate
   ```

   The migration script uses `DATABASE_URL_UNPOOLED` when present and falls back to `DATABASE_URL`.

4. Verify the migrated schema and a small read/write path in Neon.

5. Deploy the application.

## Auth Assumption

Clerk authentication remains the only access control layer. Walter OS intentionally has no app-level admin email allowlist and no role or permission matrix. Any signed-in production user is treated as an admin user.

## Database Safety

- Migrations are checked into `drizzle/` and applied manually.
- Financial integrity is enforced in server actions and database constraints.
- The current destructive delete policy is conservative: providers, products, invoices, and employees can only be deleted while unused.
- DB-backed pages are dynamic and fetch live Neon data per request.

## Neon Restore Expectations

Before risky data work, create or identify a Neon restore point. If a production migration fails after partial application, restore from Neon point-in-time recovery or a branch created before the migration, then re-run the fixed migration after validating the data issue.

## Accepted Risk

`next-pwa` remains installed. Its transitive Workbox audit findings are accepted for now because the package is intentionally kept unchanged. Revisit this when replacing the PWA layer or when a compatible maintained alternative is chosen.

Next.js currently pins an older PostCSS subdependency, so `package.json` overrides Next's PostCSS resolution to a patched 8.5.x release. Remove that override once Next ships the patched dependency directly.

## Quality Gate

CI and production readiness checks are:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

The automated suite covers unit and component tests only. Browser E2E is intentionally out of scope.
