import type { ReactElement } from "react";

import { inventoryWeek } from "@/lib/inventory/run-display";
import { getFridgeRunInventory, getFridges } from "@/lib/queries/inventory";
import { getLatestInventoryRun } from "@/lib/queries/inventory-runs";

import { InventoryWizard } from "./wizard";

export const dynamic = "force-dynamic";

export default async function NewInventoryPage(): Promise<ReactElement> {
  const [fridges, run] = await Promise.all([getFridges(), getLatestInventoryRun()]);
  const groups = await Promise.all(fridges.map(async (fridge) => ({ id: fridge.id, number: fridge.number, name: fridge.name, rows: await getFridgeRunInventory(fridge.id) })));
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Montevideo", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  return <InventoryWizard groups={groups} today={today} continuing={run?.day === inventoryWeek(today)} />;
}
