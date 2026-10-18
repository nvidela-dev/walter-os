import "server-only";

import { sql } from "drizzle-orm";

import { db } from "@/db";
import { invoiceScanUsage } from "@/db/schema";

export async function claimScanQuota(actor: string): Promise<boolean> {
  // Both counters are atomic across server instances. Failed scans consume quota too.
  const queries = [{ key: "global", limit: 200, cooldown: 0 }, { key: `user:${actor}`, limit: 30, cooldown: 15 }].map(({ key, limit, cooldown }) =>
    db.insert(invoiceScanUsage).values({ key, day: sql`(now() AT TIME ZONE 'America/Montevideo')::date`, count: 1, lastAt: sql`now()` })
      .onConflictDoUpdate({ target: invoiceScanUsage.key, set: {
        day: sql`excluded.dia`, count: sql`CASE WHEN ${invoiceScanUsage.day} = excluded.dia THEN ${invoiceScanUsage.count} + 1 ELSE 1 END`, lastAt: sql`now()`,
      }, setWhere: sql`(${invoiceScanUsage.day} <> excluded.dia OR ${invoiceScanUsage.count} < ${limit}) AND ${invoiceScanUsage.lastAt} <= now() - ${cooldown} * interval '1 second'` })
      .returning({ key: invoiceScanUsage.key })
  );
  const [globalQuery, userQuery] = queries;
  if (globalQuery === undefined || userQuery === undefined) return false;
  const results = await db.batch([globalQuery, userQuery]);
  return results.every((rows) => rows.length === 1);
}
