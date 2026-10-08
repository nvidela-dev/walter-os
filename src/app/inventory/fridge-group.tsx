import type { ReactElement, ReactNode } from "react";

/** The number determines the same accent in current and historical lists. */
export function FridgeGroup({ number, name, children }: {
  number: number; name: string | null; children: ReactNode;
}): ReactElement {
  const hue = (205 + (number - 1) * 137.508) % 360;
  return <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
    <header className="border-b border-slate-200 px-4 py-3" style={{ borderLeft: `8px solid hsl(${hue} 58% 43%)`, backgroundColor: "#f8fafc" }}>
      <h2 className="text-lg font-semibold text-[#0f172a]">Heladera {number}{name === null ? "" : ` · ${name}`}</h2>
    </header>
    <div className="space-y-2 px-4 py-3">{children}</div>
  </section>;
}
