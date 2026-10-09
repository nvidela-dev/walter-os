import type { ReactElement } from "react";

import { getDrinksInventory } from "@/lib/queries/drinks";

import { DrinksCounter } from "./drinks-counter";

export const dynamic = "force-dynamic";

export default async function DrinksPage(): Promise<ReactElement> {
  const inventory = await getDrinksInventory();
  return <DrinksCounter key={inventory.week} week={inventory.week} items={inventory.items} />;
}
