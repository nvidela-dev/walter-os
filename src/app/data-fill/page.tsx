import type { ReactElement } from "react";

import { PageHeader } from "@/components/ui/page-header";
import { getDataFillQueue } from "@/lib/queries/data-fill";

import { ProviderGame } from "./provider-game";

export const dynamic = "force-dynamic";

export default async function DataFillPage({ searchParams }: { searchParams: Promise<{ scope?: string }> }): Promise<ReactElement> {
  const drinksOnly = (await searchParams).scope === "drinks";
  const { pending, suppliers } = await getDataFillQueue(drinksOnly);
  return <div className="app-page max-w-xl">
    <PageHeader title={drinksOnly ? "¿Quién vende estas bebidas?" : "Relleno de Datos"} backHref={drinksOnly ? "/drinks/manage" : "/"} backLabel="Volver" />
    <ProviderGame initialProducts={pending} suppliers={suppliers} />
  </div>;
}
