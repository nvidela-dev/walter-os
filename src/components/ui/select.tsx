import type { ComponentPropsWithRef, ReactElement } from "react";

import { cn } from "@/lib/cn";

export function Select({ className, ...props }: ComponentPropsWithRef<"select">): ReactElement {
  return (
    <select
      className={cn(
        "w-full rounded-xl border-2 border-[#e8e0d4] bg-white px-4 py-3 text-sm text-[#3d3530]",
        "focus:border-[#c4a77d] focus:outline-none disabled:bg-[#faf8f5] disabled:text-[#c4a77d]",
        className
      )}
      {...props}
    />
  );
}
