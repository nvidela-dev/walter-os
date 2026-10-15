import type { ReactElement } from "react";
import { Suspense } from "react";

import { DrinksNavigation } from "@/app/drinks/drinks-navigation";
import { PageHeader } from "@/components/ui/page-header";
import { drinkCategory, drinkHref } from "@/lib/drinks/categories";
import { getDataFillQueue } from "@/lib/queries/data-fill";

import { ProviderGame } from "./provider-game";

export const dynamic = "force-dynamic";

export default async function DataFillPage({ searchParams }: { searchParams: Promise<{ scope?: string; category?: string }> }): Promise<ReactElement> {
  const params = await searchParams;
  const drinksOnly = params.scope === "drinks";
  const category = drinkCategory(params.category);
  const { pending, suppliers } = await getDataFillQueue(drinksOnly, drinksOnly ? category : undefined);
  return <div className="app-page max-w-xl">
    <PageHeader title={drinksOnly ? "¿Quién vende estas bebidas?" : "Relleno de Datos"} backHref={drinksOnly ? drinkHref("/drinks/manage", category) : "/"} backLabel="Volver" />
    {drinksOnly && <Suspense><DrinksNavigation admin /></Suspense>}
    <ProviderGame key={drinksOnly ? category : "all"} initialProducts={pending} suppliers={suppliers} />
  </div>;
}
