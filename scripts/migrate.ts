import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";
import { drizzle } from "drizzle-orm/neon-http";
import { migrate } from "drizzle-orm/neon-http/migrator";

config({ path: ".env.local" });
config({ path: ".env" });

const connectionString = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;

if (connectionString === undefined || connectionString === "") {
  throw new Error("DATABASE_URL_UNPOOLED or DATABASE_URL must be set before running migrations.");
}

const sql = neon(connectionString);
const db = drizzle(sql);

await migrate(db, { migrationsFolder: "drizzle" });
console.log("Database migrations completed.");
