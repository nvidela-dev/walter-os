import type { ComponentPropsWithRef, ReactElement } from "react";

import { cn } from "@/lib/cn";

export function Select({ className, ...props }: ComponentPropsWithRef<"select">): ReactElement {
  return (
    <select
      className={cn(
        "min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-base text-slate-900",
        "placeholder:text-slate-500 focus:border-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-800/20",
        "disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500",
        className
      )}
      {...props}
    />
  );
}
