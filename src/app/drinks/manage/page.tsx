import type { ReactElement } from "react";

import { requireAccess } from "@/lib/auth/access";
import { DRINK_CATEGORIES, drinkCategory } from "@/lib/drinks/categories";
import { getDrinkManagement } from "@/lib/queries/drinks";
import { getUnits } from "@/lib/queries/units";

import { DrinkManagement } from "./drink-management";

export const dynamic = "force-dynamic";

export default async function ManageDrinksPage({ searchParams }: { searchParams: Promise<{ category?: string }> }): Promise<ReactElement> {
  const category = drinkCategory((await searchParams).category);
  await requireAccess("main");
  const [items, units] = await Promise.all([getDrinkManagement(), getUnits()]);
  const unclassified = items.filter((item) => !DRINK_CATEGORIES.some((value) => value === item.category));
  return <>{unclassified.length > 0 && <details className="rounded-xl border p-3"><summary>Clasificar {unclassified.length} bebidas pendientes</summary><p className="py-2 text-sm">Elegí la pestaña correcta y agregá el mismo nombre, ubicación y unidad para clasificar la bebida existente.</p>{unclassified.map((item) => <p key={item.id} className="text-sm">{item.name} · {item.location} · {item.unit}</p>)}</details>}<DrinkManagement category={category} items={items.filter((item) => item.category === category)} units={units} /></>;
}
