import type { ReactElement } from "react";

import { requireAccess } from "@/lib/auth/access";
import { getDrinkManagement } from "@/lib/queries/drinks";
import { getUnits } from "@/lib/queries/units";

import { DrinkManagement } from "./drink-management";

export const dynamic = "force-dynamic";

export default async function ManageDrinksPage(): Promise<ReactElement> {
  await requireAccess("main");
  const [items, units] = await Promise.all([getDrinkManagement(), getUnits()]);
  return <DrinkManagement items={items} units={units} />;
}
