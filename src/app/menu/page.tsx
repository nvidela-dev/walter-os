import { ClipboardDocumentListIcon } from "@heroicons/react/24/outline";
import type { ReactElement } from "react";

import { EmptyState, ListPageRow, ListPageShell } from "@/components/list-page-shell";
import { t } from "@/i18n";
import { getMenuItems } from "@/lib/queries/menu";

export const dynamic = "force-dynamic";

export default async function MenuPage(): Promise<ReactElement> {
  const items = await getMenuItems();

  return (
    <ListPageShell
      title={t.menu.title}
      backHref="/"
      addHref="/menu/new"
      items={items}
      renderItem={(item) => (
        <ListPageRow
          key={item.id}
          href={`/menu/${item.id}`}
          icon={ClipboardDocumentListIcon}
          title={item.name}
          subtitle={`$${item.sellPrice}${item.recipeName != null ? ` · ${item.recipeName}` : ""}`}
        />
      )}
      emptyState={
        <EmptyState
          icon={ClipboardDocumentListIcon}
          title={t.menu.emptyTitle}
          description={t.menu.emptyDescription}
          ctaHref="/menu/new"
          ctaText={t.menu.addCta}
        />
      }
    />
  );
}
