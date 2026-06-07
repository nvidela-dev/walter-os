import type { ReactElement, ReactNode } from "react";

import { cn } from "@/lib/cn";

export function FormField({
  children,
  className,
  htmlFor,
  label,
}: {
  children: ReactNode;
  className?: string;
  htmlFor: string;
  label: string;
}): ReactElement {
  return (
    <div className={className}>
      <label className={cn("mb-2 block text-sm font-semibold text-[#526b74]")} htmlFor={htmlFor}>
        {label}
      </label>
      {children}
    </div>
  );
}
