import { UserButton } from "@clerk/nextjs";
import { ChatBubbleLeftRightIcon, SparklesIcon, TruckIcon } from "@heroicons/react/24/outline";
import type { Viewport } from "next";
import Link from "next/link";
import type { ReactElement } from "react";

import { type HomeApp, HomeTile } from "@/components/home-tile";
import { requireAccess } from "@/lib/auth/access";

const apps: HomeApp[] = [
  { name: "Dashboard", description: "Proveedores, productos y facturas.", href: "/dashboard/providers", icon: TruckIcon },
  { name: "Preguntale a Luna", description: "Consultá los datos de Walter con GPT Luna.", href: "/dashboard/database-chat", icon: ChatBubbleLeftRightIcon },
  { name: "Unir nombres", description: "Revisá equivalencias entre inventario y catálogo.", href: "/product-matching", icon: SparklesIcon },
  { name: "Revisar duplicados", description: "Compará productos y archivá los repetidos.", href: "/product-duplicates", icon: SparklesIcon },
];

export const dynamic = "force-dynamic";
export const viewport: Viewport = { themeColor: "#ffffff" };

export default async function DashboardMenu(): Promise<ReactElement> {
  await requireAccess("main");
  return <div className="home-screen">
    <main className="ios-page flex flex-col">
      <header className="mb-9 flex items-center justify-between">
        <Link href="/" className="ios-glass rounded-full px-4 py-2 text-sm font-semibold text-[#1f2d35]">← Inicio</Link>
        <UserButton appearance={{ elements: { avatarBox: "w-12 h-12 ring-1 ring-white/70 shadow-[0_10px_28px_rgba(31,45,53,0.16)]" } }} />
      </header>
      <h1 className="mb-6 px-1 text-[1.75rem] font-bold leading-none text-[#1f2d35] drop-shadow-[0_1px_10px_rgba(255,255,255,0.75)]">Menú privado</h1>
      <section className="ios-glass rounded-[2rem] border-white/[0.34] bg-white/[0.18] px-5 py-5 shadow-[0_16px_44px_rgba(31,45,53,0.07)]">
        <div className="flex flex-wrap justify-center gap-x-10 gap-y-7">{apps.map((app) => <HomeTile key={app.href} app={app} />)}</div>
      </section>
    </main>
  </div>;
}
