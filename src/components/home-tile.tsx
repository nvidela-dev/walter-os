import type { TruckIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import type { ReactElement } from "react";

export interface HomeApp {
  bg: string;
  description: string;
  href: string;
  icon: typeof TruckIcon;
  name: string;
}

export function HomeTile({ app }: { app: HomeApp }): ReactElement {
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

