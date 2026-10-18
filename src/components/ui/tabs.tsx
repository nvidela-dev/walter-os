import type { ButtonHTMLAttributes, ReactElement, ReactNode } from "react";

import { cn } from "@/lib/cn";

import { NavigationLink } from "./navigation-link";

export function TabLink({ href, selected, children, secondary = false }: { href: string; selected: boolean; children: ReactNode; secondary?: boolean }): ReactElement {
  return <NavigationLink href={href} aria-current={selected ? "page" : undefined} className={cn("app-tab", secondary ? "app-subtab" : "border border-zinc-200")}>{children}</NavigationLink>;
}

export function FilterButton({ selected, className, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { selected: boolean }): ReactElement {
  return <button {...props} type="button" aria-pressed={selected} className={cn("app-tab app-press", className)} />;
}
