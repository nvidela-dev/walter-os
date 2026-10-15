import { UserButton } from "@clerk/nextjs";
import type { ReactElement, ReactNode } from "react";
import { Suspense } from "react";

import { PageHeader } from "@/components/ui/page-header";
import { getCurrentGroup, requireAccess } from "@/lib/auth/access";
import { DRINK_CATEGORIES } from "@/lib/drinks/categories";
import { getDrinkCategoryAssignments } from "@/lib/queries/drinks";

import { DrinksNavigation } from "./drinks-navigation";

export default async function DrinksLayout({ children }: { children: ReactNode }): Promise<ReactElement> {
  await requireAccess("drinks");
  const assignments = await getDrinkCategoryAssignments();
  const unclassified = assignments.filter((item) => !DRINK_CATEGORIES.some((category) => category === item.category)).length;
  const group = await getCurrentGroup();
  return <div className="app-page max-w-2xl">
    <PageHeader title="Inventario de Bebidas" backHref={group === "admin" ? "/" : undefined} backLabel="Inicio" actions={<UserButton />} />
    <Suspense><DrinksNavigation admin={group === "admin"} /></Suspense>
    {unclassified > 0 && <p role="status" className="rounded-xl bg-amber-50 p-3 text-sm">{unclassified} bebidas sin categoría. Admin debe clasificarlas en Bebidas y objetivos usando el mismo nombre y ubicación. Sus datos se conservan.</p>}
    {children}
    <p className="py-6 text-center text-xs text-muted">Se necesita conexión para consultar y guardar.</p>
  </div>;
}
