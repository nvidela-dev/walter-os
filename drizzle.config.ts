import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

import { requireEnv } from "./src/lib/env";

// Load .env.local for local development
config({ path: ".env.local" });

export default defineConfig({
  schema: "./src/db/schema/index.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: requireEnv("DATABASE_URL"),
  },
});
