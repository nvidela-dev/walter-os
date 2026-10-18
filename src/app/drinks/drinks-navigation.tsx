"use client";
import { usePathname, useSearchParams } from "next/navigation";
import type { ReactElement } from "react";

import { TabLink } from "@/components/ui/tabs";
import { DRINK_CATEGORIES, drinkCategory, drinkHref } from "@/lib/drinks/categories";

export function DrinksNavigation({ admin = false }: { admin?: boolean }): ReactElement {
  const params = useSearchParams();
  const pathname = usePathname();
  const category = drinkCategory(params.get("category") ?? undefined);
  const categoryPath = new URLSearchParams(params.toString());
  categoryPath.delete("category");
  categoryPath.delete("page");
  const documentPath = pathname.startsWith("/drinks/documents/");
  const tabPath = documentPath ? `/drinks?date=${params.get("date") ?? ""}` : `${pathname}?${categoryPath}`;
  return <div className="space-y-2 border-b py-3">
    <nav aria-label="Categorías de bebidas" className="grid grid-cols-3 gap-2">{DRINK_CATEGORIES.map((value) => <TabLink key={value} href={drinkHref(tabPath, value)} selected={category === value}>{value}</TabLink>)}</nav>
    <nav aria-label="Inventario de bebidas" className="flex gap-1 overflow-x-auto pb-1">{[[documentPath ? `/drinks?date=${params.get("date") ?? ""}` : "/drinks", "Inventarios"], ["/drinks/reports", "Crear pedidos"], [documentPath ? `/drinks/new?document=${pathname.split("/")[3] ?? ""}` : "/drinks/new", "Agregar bebida"], [documentPath ? `${pathname.replace(/\/edit$/, "")}?date=${params.get("date") ?? ""}&view=suppliers` : "/drinks/summary", "Por proveedor"], ...(admin ? [["/drinks/manage", "Bebidas y objetivos"]] : [])].map(([path, label]) => <TabLink key={path} href={drinkHref(path ?? "/drinks", category)} secondary selected={label === "Por proveedor" ? pathname === "/drinks/summary" || (documentPath && params.get("view") === "suppliers") : label === "Inventarios" ? pathname === "/drinks" || (documentPath && params.get("view") !== "suppliers") : pathname === path?.split("?")[0]}>{label}</TabLink>)}</nav>
  </div>;
}
