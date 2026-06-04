import type { ReactElement } from "react";

import { EmptyState, ListPageRow, ListPageShell } from "@/components/list-page-shell";

import { getMenuItems } from "./actions";

export const dynamic = "force-dynamic";

export default async function MenuPage(): Promise<ReactElement> {
  const items = await getMenuItems();

  return (
    <ListPageShell
      title="Menú"
      backHref="/"
      addHref="/menu/new"
      items={items}
      renderItem={(item) => (
        <ListPageRow
          key={item.id}
          href={`/menu/${item.id}`}
          emoji="☕"
          title={item.nombre}
          subtitle={`$${item.precioVenta}${item.recetaNombre != null ? ` · ${item.recetaNombre}` : ""}`}
        />
      )}
      emptyState={
        <EmptyState
          emoji="☕"
          title="Sin platos"
          description="Agrega los platos del menú"
          ctaHref="/menu/new"
          ctaText="Agregar Plato"
        />
      }
    />
  );
}
