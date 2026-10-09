import type { ReactElement } from "react";

import { PageHeader } from "@/components/ui/page-header";
import { getDataFillQueue } from "@/lib/queries/data-fill";

import { ProviderGame } from "./provider-game";

export const dynamic = "force-dynamic";

export default async function DataFillPage(): Promise<ReactElement> {
  const { pending, suppliers } = await getDataFillQueue();
  return <div className="app-page max-w-xl">
    <PageHeader title="Relleno de Datos" backHref="/" backLabel="Inicio" />
    <ProviderGame initialProducts={pending} suppliers={suppliers} />
  </div>;
}
