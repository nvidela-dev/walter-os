import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import type { ReactElement, ReactNode } from "react";

import { PageHeader } from "@/components/ui/page-header";
import { getCurrentGroup, requireAccess } from "@/lib/auth/access";

export default async function DrinksLayout({ children }: { children: ReactNode }): Promise<ReactElement> {
  await requireAccess("drinks");
  const group = await getCurrentGroup();
  return <div className="app-page max-w-2xl">
    <PageHeader title="Inventario de Bebidas" titleHref="/drinks" backHref={group === "admin" ? "/" : undefined} backLabel="Inicio" actions={<UserButton />} />
    <nav className="flex flex-wrap gap-4 border-b py-3 text-sm font-semibold">
      <Link href="/drinks" className="inline-flex min-h-11 items-center">Contar</Link>
      <Link href="/drinks/history" className="inline-flex min-h-11 items-center">Historial</Link>
      {group === "admin" && <Link href="/drinks/manage" className="inline-flex min-h-11 items-center">Bebidas y objetivos</Link>}
    </nav>
    {children}
    <p className="py-6 text-center text-xs text-muted">Se necesita conexión para consultar y guardar.</p>
  </div>;
}
