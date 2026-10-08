import type { ComponentPropsWithRef, ReactElement } from "react";

import { cn } from "@/lib/cn";

export function Input({ className, ...props }: ComponentPropsWithRef<"input">): ReactElement {
  return (
    <input
      className={cn(
        "min-h-11 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-base text-foreground",
        "placeholder:text-slate-500 focus:border-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-800/20",
        "disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:text-slate-500",
        className
      )}
      {...props}
    />
  );
}
