import { UserButton } from "@clerk/nextjs";
import {
  ArchiveBoxIcon,
  BanknotesIcon,
  ChatBubbleLeftRightIcon,
  ClipboardDocumentListIcon,
  ClockIcon,
  DocumentTextIcon,
  SparklesIcon,
  TruckIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import type { Viewport } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactElement } from "react";

import { type HomeApp, HomeTile } from "@/components/home-tile";
import { t } from "@/i18n";
import { getCurrentGroup } from "@/lib/auth/access";
import { landingPath } from "@/lib/auth/policy";

const sections: {
  groups: { apps: HomeApp[]; title: string }[];
  title: string;
}[] = [
  {
    title: t.home.sections.expenses.title,
    groups: [
      {
        title: t.home.sections.expenses.rawMaterials,
        apps: [
          {
            ...t.home.tiles.providers,
            href: "/providers",
            icon: TruckIcon,
          },
          {
            ...t.home.tiles.invoices,
            href: "/invoices",
            icon: DocumentTextIcon,
          },
        ],
      },
      {
        title: t.home.sections.expenses.people,
        apps: [
          {
            ...t.home.tiles.employees,
            href: "/employees",
            icon: UserGroupIcon,
          },
          {
            ...t.home.tiles.hours,
            href: "#",
            icon: ClockIcon,
          },
        ],
      },
    ],
  },
  {
    title: t.home.sections.kitchen.title,
    groups: [
      {
        title: t.home.sections.kitchen.kitchen,
        apps: [
          {
            ...t.home.tiles.inventory,
            href: "/inventory",
            icon: ArchiveBoxIcon,
          },
          {
            name: "Bebidas",
            description: "Inventario semanal de bebidas",
            href: "/drinks",
            icon: ArchiveBoxIcon,
          },
        ],
      },
    ],
  },
  {
    title: t.home.sections.outputs.title,
    groups: [
      {
        title: t.home.sections.outputs.outputs,
        apps: [
          {
            ...t.home.tiles.menu,
            href: "/menu",
            icon: ClipboardDocumentListIcon,
          },
          {
            ...t.home.tiles.cashOutputs,
            href: "#",
            icon: BanknotesIcon,
          },
        ],
      },
    ],
  },
  {
    title: "Asistente",
    groups: [{
      title: "Consultas de datos",
      apps: [{
        name: "Preguntale a Luna",
        description: "Consultá los datos de Walter con GPT Luna.",
        href: "/dashboard/database-chat",
        icon: ChatBubbleLeftRightIcon,
      }],
    }],
  },
  {
    title: "Relleno de Datos",
    groups: [{
      title: "Un poquito cada día",
      apps: [{
        name: "¿Quién lo trae?",
        description: "Elegí el proveedor de cada producto, uno por uno.",
        href: "/data-fill",
        icon: SparklesIcon,
      }, {
        name: "Plan de Inventario",
        description: "Definí cuánto debería haber de cada producto.",
        href: "/inventory-plan",
        icon: ClipboardDocumentListIcon,
      }],
    }],
  },
];

export const dynamic = "force-dynamic";
export const viewport: Viewport = { themeColor: "#ffffff" };

export default async function Home(): Promise<ReactElement> {
  const group = await getCurrentGroup();
  if (group !== "admin") redirect(landingPath(group));
  return (
    <div className="home-screen">
      <main className="ios-page flex flex-col">
        <header className="mb-9 flex items-center justify-between">
          <div className="ios-glass rounded-full px-4 py-2">
            <p className="text-sm font-semibold text-foreground">{t.app.name}</p>
          </div>
          <UserButton
            appearance={{
              elements: {
                avatarBox:
                  "w-12 h-12 ring-1 ring-white/70 shadow-[0_10px_28px_rgba(31,45,53,0.16)]",
              },
            }}
          />
        </header>

        <Link href="/access" className="ios-glass mb-6 rounded-2xl px-5 py-3 font-semibold">{t.access.title}</Link>
        <div className="space-y-8">
          {sections.map((section) => (
            <section key={section.title} className="space-y-3">
              <h2 className="px-1 text-[1.75rem] font-bold leading-none text-foreground ">
                {section.title}
              </h2>

              <div className="space-y-3">
                {section.groups.map((group) => (
                  <div
                    key={group.title}
                    className="ios-glass rounded-2xl  px-5 py-5 "
                  >
                    <div className="flex flex-wrap justify-center gap-x-10 gap-y-7">
                      {group.apps.map((app) => (
                        <HomeTile key={`${group.title}-${app.name}`} app={app} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}
