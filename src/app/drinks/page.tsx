import type { ReactElement } from "react";

import { drinkCategory } from "@/lib/drinks/categories";
import { getDrinksInventory } from "@/lib/queries/drinks";

import { DrinksCounter } from "./drinks-counter";

export const dynamic = "force-dynamic";

export default async function DrinksPage({ searchParams }: { searchParams: Promise<{ category?: string }> }): Promise<ReactElement> {
  const category = drinkCategory((await searchParams).category);
  const inventory = await getDrinksInventory();
  return <DrinksCounter key={inventory.week} week={inventory.week} category={category} items={inventory.items.filter((item) => item.category === category)} />;
}
