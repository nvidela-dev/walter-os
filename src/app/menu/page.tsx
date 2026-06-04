import { getMenuItems } from "./actions";
import { ListPageShell, EmptyState, ListPageRow } from "@/components/list-page-shell";

export const dynamic = "force-dynamic";

export default async function MenuPage() {
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
          subtitle={`$${item.precioVenta}${item.recetaNombre ? ` · ${item.recetaNombre}` : ""}`}
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
