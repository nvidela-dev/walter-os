import type { ComponentPropsWithRef, ReactElement } from "react";

import { cn } from "@/lib/cn";

export function Input({ className, ...props }: ComponentPropsWithRef<"input">): ReactElement {
  return (
    <input
      className={cn(
        "w-full rounded-2xl border border-white/60 bg-white/58 px-4 py-3 text-sm text-[#1f2d35] shadow-inner shadow-white/20 backdrop-blur-xl",
        "placeholder:text-[#7d9299] focus:border-[#2388d1]/55 focus:bg-white/75 focus:outline-none focus:ring-4 focus:ring-[#2388d1]/15",
        "disabled:bg-white/30 disabled:text-[#8aa0a7]",
        className
      )}
      {...props}
    />
  );
}
