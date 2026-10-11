import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { chmodSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { config } from "dotenv";

config({ path: ".env.local", quiet: true });
config({ path: ".env", quiet: true });
const connection = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;
if (connection === undefined || connection === "") throw new Error("DATABASE_URL is required.");
const url = new URL(connection);
// Dump requires a direct connection; retain the supplied database and role.
const host = url.hostname.replace("-pooler.", ".");
const env = { ...process.env, PGHOST: host, PGPORT: url.port || "5432", PGDATABASE: decodeURIComponent(url.pathname.slice(1)), PGUSER: decodeURIComponent(url.username), PGPASSWORD: decodeURIComponent(url.password), PGSSLMODE: "require" };
const bin = process.env.PG_BIN ?? "/opt/homebrew/opt/libpq/bin";
const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const directory = join("backups/database", timestamp);
mkdirSync(directory, { recursive: true, mode: 0o700 });
function run(command: string, args: string[]): string {
  const result = spawnSync(join(bin, command), args, { env, encoding: "utf8", maxBuffer: 128 * 1024 * 1024 });
  if (result.status !== 0) throw new Error(`${command} failed: ${result.error?.message ?? result.stderr}`);
  return result.stdout;
}
const dump = join(directory, "database.dump");
run("pg_dump", ["--format=custom", "--no-owner", "--no-acl", "--file", dump]);
chmodSync(dump, 0o600);
const contents = run("pg_restore", ["--list", dump]);
writeFileSync(join(directory, "contents.txt"), contents, { mode: 0o600 });
const schema = run("pg_restore", ["--schema-only", "--no-owner", "--no-acl", "--file=-", dump]);
const schemaPath = join("docs/database-baselines", `${timestamp}-schema.sql`);
writeFileSync(schemaPath, schema);
const commit = spawnSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).stdout.trim();
const manifest = { capturedAt: timestamp, gitCommit: commit, dump: "database.dump", sha256: createHash("sha256").update(readFileSync(dump)).digest("hex"), schema: schemaPath, scope: "Entire supplied database, schema and data; no credentials stored", restore: "pg_restore --no-owner --no-acl --dbname=<empty-target-database> database.dump" };
writeFileSync(join(directory, "manifest.json"), JSON.stringify(manifest, null, 2), { mode: 0o600 });
console.log(JSON.stringify({ directory, schemaPath, sha256: manifest.sha256, tableDataEntries: contents.split("\n").filter(line => line.includes("TABLE DATA")).length }));
