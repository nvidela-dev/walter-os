import { notFound } from "next/navigation";
import type { ReactElement } from "react";

import { buttonClassName } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { Select } from "@/components/ui/select";
import { getActiveMenuVersion, getMenuVersion, getMenuVersions } from "@/lib/queries/menu-versions";

import { MenuComparison } from "./comparison";

export const dynamic = "force-dynamic";
export default async function CompareMenuPage({ searchParams }: { searchParams: Promise<{ family?: string; version?: string }> }): Promise<ReactElement> {
  const params = await searchParams;
  const selected = params.version === undefined ? null : await getMenuVersion(params.version);
  if (params.version !== undefined && (selected?.status !== "submitted")) notFound();
  const family = selected?.menuName ?? params.family ?? "Don Juan";
  const [current, versions] = await Promise.all([getActiveMenuVersion(family), getMenuVersions()]);
  const historical = versions.filter(version => version.menuName === family && version.status === "submitted" && version.id !== current?.id);
  if (selected !== null && selected.id === current?.id) notFound();
  const previous = selected ?? (historical[0] === undefined ? null : await getMenuVersion(historical[0].id));
  const date = (value: Date | null): string => value?.toLocaleString("es-UY", { timeZone: "America/Montevideo" }) ?? "Sin fecha";
  return <div className="app-page max-w-4xl">
    <PageHeader title={`Comparar menús · ${family}`} backHref="/menu" />
    <main className="space-y-5 py-5">
      <p className="text-sm text-muted">Compará la carta activa con una versión guardada de la misma carta. Los cambios se muestran desde el histórico hacia el menú actual.</p>
      <form className="space-y-3 rounded-xl border p-4">
        <input type="hidden" name="family" value={family} />
        <label className="block text-sm">Versión histórica<Select name="version" defaultValue={previous?.id}>{historical.map(version => <option key={version.id} value={version.id}>{date(version.submittedAt)}{version.createdBy === "migration:existing-catalogue" ? " · Carta original" : ""}</option>)}</Select></label>
        <button className={buttonClassName()} disabled={historical.length === 0}>Comparar con menú actual</button>
      </form>
      {current && previous ? <>
        <div className="grid gap-3 sm:grid-cols-2"><p className="rounded-xl bg-zinc-100 p-3 text-sm"><strong>Histórico:</strong> {date(previous.submittedAt)}</p><p className="rounded-xl bg-emerald-50 p-3 text-sm"><strong>Menú actual:</strong> {date(current.submittedAt)}</p></div>
        <MenuComparison key={`${previous.id}:${current.id}`} previous={previous.document} current={current.document} />
      </> : <p>No hay una versión histórica y un menú activo para comparar en esta carta.</p>}
    </main>
  </div>;
}
