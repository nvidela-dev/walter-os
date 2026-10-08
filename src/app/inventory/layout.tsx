import { UserButton } from "@clerk/nextjs";
import type { Metadata } from "next";
import Link from "next/link";
import type { ReactElement, ReactNode } from "react";

import { buttonClassName } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
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
    <PageHeader
      title={t.inventory.title} titleHref="/inventory" titleAs="div" className="mb-6"
      backHref={group === "admin" ? "/" : undefined} backLabel={t.access.mainApp}
      actions={<><Link href="/inventory/new" aria-label={t.inventory.newInventory} className={buttonClassName({ variant: "secondary", size: "compact" })}>{t.inventory.newInventoryShort}</Link><UserButton /></>}
    />
    {children}
    <p className="mt-8 text-center text-xs text-muted">{t.inventory.online}</p>
  </div>;
}
