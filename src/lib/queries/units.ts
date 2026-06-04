import "server-only";

import { db } from "@/db";
import { units } from "@/db/schema";
import type { UnitOption } from "@/lib/types/providers";

export async function getUnits(): Promise<UnitOption[]> {
  return db
    .select({ id: units.id, code: units.code, name: units.name })
    .from(units)
    .orderBy(units.name);
}
