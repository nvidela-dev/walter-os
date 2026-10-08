import { UserButton } from "@clerk/nextjs";
import {
  ArchiveBoxIcon,
  BanknotesIcon,
  BookOpenIcon,
  ClipboardDocumentListIcon,
  ClockIcon,
  DocumentTextIcon,
  TruckIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactElement } from "react";

import { t } from "@/i18n";
import { getCurrentGroup } from "@/lib/auth/access";
import { landingPath } from "@/lib/auth/policy";

interface HomeApp {
  bg: string;
  description: string;
  href: string;
  icon: typeof TruckIcon;
  name: string;
}

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
            bg: "bg-[linear-gradient(145deg,#71717a,#3f3f46)]",
          },
          {
            ...t.home.tiles.invoices,
            href: "/invoices",
            icon: DocumentTextIcon,
            bg: "bg-[linear-gradient(145deg,#71717a,#3f3f46)]",
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
            bg: "bg-[linear-gradient(145deg,#71717a,#3f3f46)]",
          },
          {
            ...t.home.tiles.hours,
            href: "#",
            icon: ClockIcon,
            bg: "bg-[linear-gradient(145deg,#71717a,#3f3f46)]",
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
            ...t.home.tiles.recipes,
            href: "/recipes",
            icon: BookOpenIcon,
            bg: "bg-[linear-gradient(145deg,#71717a,#3f3f46)]",
          },
          {
            ...t.home.tiles.inventory,
            href: "/inventory",
            icon: ArchiveBoxIcon,
            bg: "bg-[linear-gradient(145deg,#71717a,#3f3f46)]",
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
            bg: "bg-[linear-gradient(145deg,#71717a,#3f3f46)]",
          },
          {
            ...t.home.tiles.cashOutputs,
            href: "#",
            icon: BanknotesIcon,
            bg: "bg-[linear-gradient(145deg,#71717a,#3f3f46)]",
          },
        ],
      },
    ],
  },
];

function HomeTile({ app }: { app: HomeApp }): ReactElement {
  return (
    <Link
      href={app.href}
      className="group flex w-[6.5rem] min-w-0 sm:w-[7.25rem] flex-col items-center gap-2 text-center transition active:scale-[0.96]"
    >
      <div className={`ios-icon flex h-[4.25rem] w-[4.25rem] items-center justify-center text-white transition group-hover:scale-[1.03] ${app.bg}`}>
        <app.icon className="h-8 w-8" />
      </div>
      <span className="w-full text-center text-[13px] font-semibold leading-tight text-[#1f2d35] drop-shadow-[0_1px_8px_rgba(255,255,255,0.72)]">
        {app.name}
      </span>
      <span className="sr-only">{app.description}</span>
    </Link>
  );
}

export const dynamic = "force-dynamic";

export default async function Home(): Promise<ReactElement> {
  const group = await getCurrentGroup();
  if (group !== "admin") redirect(landingPath(group));
  return (
    <div className="home-screen">
      <main className="ios-page flex flex-col">
        <header className="mb-9 flex items-center justify-between">
          <div className="ios-glass rounded-full px-4 py-2">
            <p className="text-sm font-semibold text-[#1f2d35]">{t.app.name}</p>
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
            <section key={section.title} className="space-y-6">
              <h1 className="px-1 text-[1.75rem] font-bold leading-none text-[#1f2d35] drop-shadow-[0_1px_10px_rgba(255,255,255,0.75)]">
                {section.title}
              </h1>

              <div className="space-y-7">
                {section.groups.map((group) => (
                  <div
                    key={group.title}
                    className="ios-glass rounded-[2rem] border-white/[0.34] bg-white/[0.18] px-5 py-5 shadow-[0_16px_44px_rgba(31,45,53,0.07)]"
                  >
                    <h2 className="mb-5 px-1 text-[15px] font-semibold text-[#53656d] drop-shadow-[0_1px_8px_rgba(255,255,255,0.8)]">
                      {group.title}
                    </h2>
                    <div className="flex flex-wrap justify-center gap-x-6 gap-y-7 sm:gap-x-10">
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
