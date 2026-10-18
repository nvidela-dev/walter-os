import Link from "next/link";
import type { ReactElement } from "react";

import { PageHeader } from "@/components/ui/page-header";
import { getActiveMenuVersion, getMenuVersions } from "@/lib/queries/menu-versions";

import { ActiveMenuCatalogue } from "./active-menu-catalogue";
import { DiscardDraft } from "./discard-draft";

export const dynamic = "force-dynamic";
export default async function MenuPage(): Promise<ReactElement> {
  const versions = await getMenuVersions();
  const families = [...new Set(["Don Juan","Genüsse",...versions.map(version => version.menuName)])];
  const active = (await Promise.all(families.map(getActiveMenuVersion))).filter((version) => version !== null);
  return <div className="app-page max-w-4xl"><PageHeader title="Menús" backHref="/" actions={<Link href="/menu/new" className="rounded-xl bg-slate-800 px-4 py-3 text-sm font-semibold text-white">Nuevo menú</Link>} /><main className="space-y-5 py-5"><p className="text-sm text-muted">Estos son los menús activos. Crear un borrador no los cambia; presentar la nueva versión la activa y conserva la anterior en el historial.</p><ActiveMenuCatalogue menus={active}/><h2 className="pt-4 text-lg font-bold">Borradores e historial</h2>{families.map(family => {
    const submitted = versions.filter(version => version.menuName === family && version.status === "submitted" && !active.some(current => current.id === version.id));
    const drafts = versions.filter(version => version.menuName === family && version.status === "draft");
    return <section key={family} className="space-y-3 rounded-2xl border p-4"><h2 className="text-xl font-bold">{family}</h2>{drafts.map(draft => <div key={draft.id} className="space-y-2 rounded-xl border p-3"><Link className="block min-h-11 py-2" href={`/menu/versions/${draft.id}`}>Continuar borrador · {draft.createdAt.toLocaleString("es-UY",{timeZone:"America/Montevideo"})}</Link><DiscardDraft id={draft.id} revision={draft.revision} /></div>)}<details><summary className="cursor-pointer py-2 text-sm">Historial · {submitted.length} versiones anteriores</summary><ol className="space-y-2">{submitted.map((version) => <li key={version.id}><Link className="block py-2 text-sm underline" href={`/menu/versions/${version.id}`}>{version.submittedAt?.toLocaleString("es-UY",{timeZone:"America/Montevideo"})} · Histórica{version.createdBy === "migration:existing-catalogue" ? " · Carta original" : ""}</Link></li>)}</ol></details></section>;
  })}</main></div>;
}
