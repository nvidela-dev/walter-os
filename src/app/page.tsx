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
import type { ReactElement } from "react";

import { t } from "@/i18n";

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
            bg: "bg-[linear-gradient(145deg,#f6b05f,#d86e42)]",
          },
          {
            ...t.home.tiles.invoices,
            href: "/invoices",
            icon: DocumentTextIcon,
            bg: "bg-[linear-gradient(145deg,#8a96a8,#44556a)]",
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
            bg: "bg-[linear-gradient(145deg,#e990a9,#c84d7b)]",
          },
          {
            ...t.home.tiles.hours,
            href: "#",
            icon: ClockIcon,
            bg: "bg-[linear-gradient(145deg,#b9c0c5,#707b84)]",
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
            bg: "bg-[linear-gradient(145deg,#5bd0c6,#2c9b91)]",
          },
          {
            ...t.home.tiles.inventory,
            href: "#",
            icon: ArchiveBoxIcon,
            bg: "bg-[linear-gradient(145deg,#a8b3bd,#6f7b86)]",
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
            bg: "bg-[linear-gradient(145deg,#9f7aea,#6b4bd6)]",
          },
          {
            ...t.home.tiles.cashOutputs,
            href: "#",
            icon: BanknotesIcon,
            bg: "bg-[linear-gradient(145deg,#b8c0c5,#727d86)]",
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
      className="group flex w-[7.25rem] min-w-0 flex-col items-center gap-2 text-center transition active:scale-[0.96]"
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

export default function Home(): ReactElement {
  return (
    <div className="ios-screen">
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
