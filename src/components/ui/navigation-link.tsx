"use client";

import Link, { useLinkStatus } from "next/link";
import type { ComponentProps, ReactElement } from "react";

import { cn } from "@/lib/cn";

function PendingIndicator(): ReactElement | null {
  const { pending } = useLinkStatus();
  return pending ? <span role="status" className="inline-flex items-center gap-1 text-xs"><span className="app-spinner" aria-hidden="true" /><span className="sr-only">Cargando…</span></span> : null;
}

/** Shared navigation feedback; selected state remains tied to the actual route. */
export function NavigationLink({ children, className, ...props }: ComponentProps<typeof Link>): ReactElement {
  return <Link {...props} className={cn("app-press", className)}>{children}<PendingIndicator /></Link>;
}
