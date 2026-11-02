import type { TruckIcon } from "@heroicons/react/24/outline";
import type { ReactElement } from "react";

import { NavigationLink as Link } from "@/components/ui/navigation-link";

export interface HomeApp {
  description: string;
  href: string;
  icon: typeof TruckIcon;
  name: string;
}

export function HomeTile({ app }: { app: HomeApp }): ReactElement {
  const content = <>
      <div className="ios-icon flex h-14 w-14 items-center justify-center text-white"><app.icon className="h-7 w-7" aria-hidden="true" /></div>
      <span className="text-sm font-semibold">{app.name}</span>
      {app.href === "#" && <span className="text-xs text-muted">Próximamente</span>}
      <span className="sr-only">{app.description}</span>
    </>;
  if (app.href === "#") return <div className="flex w-[7.25rem] flex-col items-center gap-2 text-center opacity-50">{content}</div>;
  return (
    <Link
      href={app.href}
      className="group flex w-[7.25rem] min-w-0 flex-col items-center gap-2 text-center transition active:scale-[0.96]"
    >
      {content}
    </Link>
  );
}

