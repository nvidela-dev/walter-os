import type { ReactElement } from "react";
import { Suspense } from "react";

import { DrinksNavigation } from "@/app/drinks/drinks-navigation";
import { PageHeader } from "@/components/ui/page-header";
import { drinkCategory, drinkHref } from "@/lib/drinks/categories";
import { getDataFillQueue } from "@/lib/queries/data-fill";

import { ProviderGame } from "./provider-game";

export const dynamic = "force-dynamic";

export default async function DataFillPage({ searchParams }: { searchParams: Promise<{ scope?: string; category?: string; products?: string }> }): Promise<ReactElement> {
  const params = await searchParams;
  const drinksOnly = params.scope === "drinks";
  const category = drinkCategory(params.category);
  const { pending, suppliers } = await getDataFillQueue(drinksOnly, drinksOnly ? category : undefined);
  const requestedProducts = params.products?.split(",");
  const queue = requestedProducts ? pending.filter(product => requestedProducts.includes(product.id)) : pending;
  return <div className="app-page max-w-xl">
    <PageHeader title={drinksOnly ? "¿Quién vende estas bebidas?" : "¿Quién lo trae?"} backHref={drinksOnly ? drinkHref("/drinks/manage", category) : "/"} backLabel="Volver" />
    {drinksOnly && <Suspense><DrinksNavigation admin /></Suspense>}
    {requestedProducts && <p className="text-sm text-muted">Completá los proveedores pendientes del pedido. Después volvé al informe para actualizar la compra.</p>}
    <ProviderGame key={drinksOnly ? category : "all"} initialProducts={queue} suppliers={suppliers} />
  </div>;
}
