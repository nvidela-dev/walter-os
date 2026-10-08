import type { ReactElement, ReactNode } from "react";

/** Neutral surfaces keep the same treatment in current and historical lists. */
export function FridgeGroup({ number, name, children }: {
  number: number; name: string | null; children: ReactNode;
}): ReactElement {
  return <section className="app-card overflow-hidden rounded-2xl">
    <header className="border-b border-zinc-300 bg-zinc-200 px-4 py-3">
      <h2 className="text-lg font-semibold text-foreground">Heladera {number}{name === null ? "" : ` · ${name}`}</h2>
    </header>
    <div className="space-y-2 px-4 py-3">{children}</div>
  </section>;
}
