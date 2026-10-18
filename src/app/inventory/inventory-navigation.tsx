"use client";
import { usePathname } from "next/navigation";
import type { ReactElement } from "react";

import { TabLink } from "@/components/ui/tabs";

export function InventoryNavigation(): ReactElement {
  const path = usePathname();
  return <nav aria-label="Inventario y pedidos" className="mb-5 flex gap-2 overflow-x-auto">
    <TabLink href="/inventory" selected={!path.startsWith("/inventory/purchases") && !path.startsWith("/inventory/history")}>Inventario</TabLink>
    <TabLink href="/inventory/purchases" selected={path.startsWith("/inventory/purchases")}>Crear pedidos</TabLink>
    <TabLink href="/inventory/history" selected={path.startsWith("/inventory/history")}>Historial</TabLink>
  </nav>;
}
