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
  return <div className="ios-page max-w-2xl">
    <header className="mb-6 flex items-center justify-between">
      <Link href="/inventory" className="text-lg font-semibold">{t.inventory.title}</Link>
      <div className="flex items-center gap-4">
        {group === "admin" && <Link href="/" className="text-sm text-warm-dark">{t.access.mainApp}</Link>}
        <UserButton />
      </div>
    </header>
    {children}
    <p className="mt-8 text-center text-xs text-muted">{t.inventory.online}</p>
  </div>;
}
