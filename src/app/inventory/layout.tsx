import { UserButton } from "@clerk/nextjs";
import type { Metadata } from "next";
import Link from "next/link";
import type { ReactElement, ReactNode } from "react";

import { t } from "@/i18n";
import { getCurrentGroup } from "@/lib/auth/access";

export const metadata: Metadata = {
  title: t.inventory.title,
  applicationName: t.inventory.title,
  manifest: "/inventory/manifest.webmanifest",
  appleWebApp: { capable: true, title: t.inventory.title, statusBarStyle: "default" },
};

export default async function InventoryLayout({ children }: { children: ReactNode }): Promise<ReactElement> {
  const group = await getCurrentGroup();
  return <div className="app-page max-w-2xl">
    <header className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 pb-4">
      <Link href="/inventory" className="text-lg font-semibold">{t.inventory.title}</Link>
      <div className="flex flex-wrap items-center gap-3">
        <Link href="/inventory/new" className="app-text-action">Nuevo inventario</Link>
        {group === "admin" && <Link href="/" className="app-text-action">{t.access.mainApp}</Link>}
        <UserButton />
      </div>
    </header>
    {children}
    <p className="mt-8 text-center text-xs text-muted">{t.inventory.online}</p>
  </div>;
}
