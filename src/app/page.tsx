import { UserButton } from "@clerk/nextjs";
import {
  BookOpenIcon,
  ClipboardDocumentListIcon,
  DocumentTextIcon,
  TruckIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import type { ReactElement } from "react";

import { t } from "@/i18n";

const apps = [
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
  {
    ...t.home.tiles.employees,
    href: "/employees",
    icon: UserGroupIcon,
    bg: "bg-[linear-gradient(145deg,#e990a9,#c84d7b)]",
  },
  {
    ...t.home.tiles.recipes,
    href: "/recipes",
    icon: BookOpenIcon,
    bg: "bg-[linear-gradient(145deg,#5bc5af,#2f8f83)]",
  },
  {
    ...t.home.tiles.menu,
    href: "/menu",
    icon: ClipboardDocumentListIcon,
    bg: "bg-[linear-gradient(145deg,#a891ee,#7656d9)]",
  },
];

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

        <div className="grid grid-cols-3 gap-x-4 gap-y-7">
          {apps.map((app) => (
            <Link
              key={app.href}
              href={app.href}
              className="group flex min-w-0 flex-col items-center gap-2 text-center transition active:scale-[0.96]"
            >
              <div className={`ios-icon flex h-[4.25rem] w-[4.25rem] items-center justify-center text-white transition group-hover:scale-[1.03] ${app.bg}`}>
                <app.icon className="h-8 w-8" />
              </div>
              <span className="max-w-full truncate text-[13px] font-semibold text-[#1f2d35] drop-shadow-[0_1px_8px_rgba(255,255,255,0.72)]">
                {app.name}
              </span>
              <span className="sr-only">{app.description}</span>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
