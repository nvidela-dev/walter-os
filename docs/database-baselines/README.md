# Database baseline before back-office matching

Captured on 2026-10-11 before the back-office and soft-delete changes, from the database configured in `.env.local` at Git commit `b3bf7eb638549b594d30351aada609c1ed1e1b95`.

The timestamped SQL file is a schema-only **initial restore baseline**, including actual database tables, constraints, functions, sequences and triggers. It is not a migration to replay on an existing database, and does not replace Drizzle's incremental migration history. For an empty database, load this baseline, then apply subsequent reviewed migrations starting with `0022`. The baseline also defines the migration ledger table, but does not include its private data; do not run the entire old migration ledger against a restored database.

The full schema-and-data snapshot is local and ignored by Git:

`backups/database/2026-10-11T19-19-15-526Z/database.dump`

Its manifest includes the SHA-256 checksum and source commit. `verification.json` records an isolated PostgreSQL-compatible PGlite restore of all 26 tables and 1,187 rows, with row counts checked. Archive decoding and schema/constraint/trigger restoration succeeded. No source rows were changed during capture.

Restore the full archive into an **empty disposable database** with PostgreSQL tools:

```sh
pg_restore --no-owner --no-acl --dbname=<empty-target-database> database.dump
```

To capture another baseline and private snapshot: `npx tsx scripts/snapshot-database.ts`. Set `PG_BIN` to your PostgreSQL tools directory if needed. The script uses a direct connection and stores no credentials in backup metadata. Keep full backups private; they contain business records and access emails.
