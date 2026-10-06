"use client";

import { useRouter } from "next/navigation";
import type { ReactElement } from "react";

import { FormMessage } from "@/components/form-feedback";
import { useActionForm } from "@/components/hooks/use-action-form";
import { Button } from "@/components/ui/button";
import { startInventoryRun } from "@/lib/actions/inventory";
import { runDate } from "@/lib/inventory/run-display";

export function RunControls({ day, today }: { day: string | null; today: string }): ReactElement {
  const router = useRouter();
  const { error, isSubmitting, runAction } = useActionForm();
  async function start(): Promise<void> {
    const result = await runAction(startInventoryRun);
    if (result.ok) router.refresh();
  }
  return <div className="space-y-2">
    <p className="text-sm">{day === null ? "Todavía no hay inventarios." : `Último inventario: ${runDate(day)}`}</p>
    {day === today ? <p className="text-sm text-muted">Los conteos de hoy se guardan juntos en este inventario.</p> : <><Button disabled={isSubmitting} onClick={() => { void start(); }}>Comenzar inventario de hoy</Button><p className="text-sm text-muted">Los productos quedan sin conteo hasta que los revises. El inventario anterior se conserva.</p></>}
    <FormMessage message={error} />
  </div>;
}
