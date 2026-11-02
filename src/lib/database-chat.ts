import "server-only";

import { neon } from "@neondatabase/serverless";
import { z } from "zod";

import { requireEnv } from "@/lib/env";

const database = neon(requireEnv("DATABASE_URL"), { fullResults: true });
const maxRows = 80;
const maxCellCharacters = 300;
const maxColumns = 60;
const maxResultCharacters = 18_000;

const queryResultSchema = z.object({
  fields: z.array(z.object({ name: z.string() })),
  rows: z.array(z.record(z.string(), z.unknown())),
});

const statementTimeout = "SET LOCAL statement_timeout = '5s'";
const publicSearchPath = "SET LOCAL search_path = public";

export async function getDatabaseChatSchema(deadline: number): Promise<string> {
  const remaining = Math.min(8_000, deadline - Date.now());
  if (remaining < 1) throw new Error("Database chat timed out");
  const [result] = await database.transaction(
    (transaction) => [transaction.query(
      `SELECT table_name, column_name, data_type
       FROM information_schema.columns
       WHERE table_schema = 'public'
       ORDER BY table_name, ordinal_position
       LIMIT 800`
    )],
    { readOnly: true, fullResults: true, fetchOptions: { signal: AbortSignal.timeout(remaining) } }
  );

  const rows = queryResultSchema.parse(result).rows;
  return rows.map((row) => `${String(row.table_name)}: ${String(row.column_name)} (${String(row.data_type)})`).join("\n");
}

export async function queryDatabaseReadOnly(query: string, deadline: number): Promise<string> {
  const trimmedQuery = query.trim().replace(/;\s*$/, "");
  if (
    trimmedQuery.length === 0 || trimmedQuery.length > 6_000 ||
    !/^(select|with)\b/i.test(trimmedQuery) ||
    /;|--|\/\*|\*\/|\\/i.test(trimmedQuery) ||
    /\b(?:insert|update|delete|merge|alter|create|drop|truncate|copy|call|do|grant|revoke|vacuum|refresh|reindex|execute|pg_[a-z0-9_]+|information_schema|lo_import|lo_export|dblink|set_config|nextval|setval)\b/i.test(trimmedQuery)
  ) {
    throw new Error("Only one bounded, read-only SELECT query is allowed.");
  }

  const boundedQuery = `SELECT * FROM (${trimmedQuery}) AS database_chat_result LIMIT ${maxRows + 1}`;
  const remaining = Math.min(8_000, deadline - Date.now());
  if (remaining < 1) throw new Error("Database chat timed out");
  const [, , result] = await database.transaction(
    (transaction) => [
      transaction.query(statementTimeout),
      transaction.query(publicSearchPath),
      transaction.query(boundedQuery),
    ],
    { readOnly: true, fullResults: true, fetchOptions: { signal: AbortSignal.timeout(remaining) } }
  );

  const queryResult = queryResultSchema.parse(result);
  const rows = queryResult.rows.slice(0, maxRows).map((row) => Object.fromEntries(
    Object.entries(row).slice(0, maxColumns).map(([key, value]) => [
      key,
      typeof value === "string" && value.length > maxCellCharacters ? `${value.slice(0, maxCellCharacters)}…` : value,
    ])
  ));
  const columns = queryResult.fields.slice(0, maxColumns).map((field) => field.name);
  let resultRows = rows;
  let output = "";
  do {
    output = JSON.stringify({
      columns,
      rows: resultRows,
      rowCount: resultRows.length,
      hasMore: queryResult.rows.length > resultRows.length,
    });
    if (output.length > maxResultCharacters) resultRows = resultRows.slice(0, Math.max(0, resultRows.length - 1));
  } while (output.length > maxResultCharacters && resultRows.length > 0);
  return output;
}
