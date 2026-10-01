import { neon } from "@neondatabase/serverless";

import { inventoryBootstrapSql } from "./inventory-bootstrap";

async function main(): Promise<void> {
  // Local builds/tests must not mutate the database from .env.local.
  if (process.env.VERCEL !== "1") {
    throw new Error("Inventory deployment setup must run in Vercel's build environment.");
  }
  const connection = process.env.DATABASE_URL;
  if (connection === undefined || connection === "") {
    throw new Error("DATABASE_URL is required for inventory deployment setup.");
  }
  // Use the deployment's own database, not a direct URL for another environment.
  const sql = neon(connection);
  await sql.query(inventoryBootstrapSql());
  console.log("Inventory schema verified and requested owner access provisioned.");
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Inventory setup failed");
  process.exitCode = 1;
});
