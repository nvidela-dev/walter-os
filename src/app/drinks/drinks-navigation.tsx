"use client";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import type { ReactElement } from "react";

import { DRINK_CATEGORIES, drinkCategory, drinkHref } from "@/lib/drinks/categories";

export function DrinksNavigation({ admin = false }: { admin?: boolean }): ReactElement {
  const params = useSearchParams();
  const pathname = usePathname();
  const category = drinkCategory(params.get("category") ?? undefined);
  const categoryPath = new URLSearchParams(params.toString());
  categoryPath.delete("category");
  categoryPath.delete("page");
  return <div className="space-y-2 border-b py-3">
    <nav aria-label="Categorías de bebidas" className="grid grid-cols-3 gap-2">{DRINK_CATEGORIES.map((value) => <Link key={value} href={drinkHref(`${pathname}?${categoryPath}`, value)} aria-current={category === value ? "page" : undefined} className={`rounded-xl border px-2 py-3 text-center text-sm font-semibold ${category === value ? "bg-emerald-700 text-white" : ""}`}>{value}</Link>)}</nav>
    <nav aria-label="Inventario de bebidas" className="flex flex-wrap gap-4 text-sm font-semibold">{[["/drinks", "Contar"], ["/drinks/history", "Historial"], ["/drinks/new", "Agregar bebida"], ["/drinks/summary", "Por proveedor"], ...(admin ? [["/drinks/manage", "Bebidas y objetivos"]] : [])].map(([path, label]) => <Link key={path} href={drinkHref(path ?? "/drinks", category)} className="inline-flex min-h-11 items-center">{label}</Link>)}</nav>
  </div>;
}
