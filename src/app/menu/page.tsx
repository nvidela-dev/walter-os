import Link from "next/link";
import type { ReactElement } from "react";

import { PageHeader } from "@/components/ui/page-header";
import { getMenuVersions } from "@/lib/queries/menu-versions";
export const dynamic = "force-dynamic";
export default async function MenuPage(): Promise<ReactElement> {
  const versions = await getMenuVersions();
  const families = [...new Set(["Don Juan","Genüsse",...versions.map(version => version.menuName)])];
  return <div className="app-page max-w-4xl"><PageHeader title="Menús" backHref="/" actions={<Link href="/menu/new" className="rounded-xl bg-slate-800 px-4 py-3 text-sm font-semibold text-white">Nuevo menú</Link>} /><main className="space-y-5 py-5"><p className="text-sm text-muted">Cada carta conserva sus versiones y precios. Creá un borrador para preparar la próxima y comparar antes de presentarla.</p>{families.map(family => {
    const submitted = versions.filter(version => version.menuName === family && version.status === "submitted");
    const drafts = versions.filter(version => version.menuName === family && version.status === "draft");
    return <section key={family} className="space-y-3 rounded-2xl border p-4"><h2 className="text-xl font-bold">{family}</h2>{submitted[0] && <Link className="block rounded-xl bg-slate-50 p-3 font-semibold" href={`/menu/versions/${submitted[0].id}`}>Ver carta vigente · {submitted[0].submittedAt?.toLocaleDateString("es-UY",{timeZone:"America/Montevideo"})}</Link>}{drafts.map(draft => <Link key={draft.id} className="block rounded-xl border p-3" href={`/menu/versions/${draft.id}`}>Continuar borrador · {draft.createdAt.toLocaleString("es-UY",{timeZone:"America/Montevideo"})}</Link>)}<details><summary className="cursor-pointer py-2 text-sm">Historial · {submitted.length} versiones presentadas</summary><ol className="space-y-2">{submitted.map((version,index) => <li key={version.id}><Link className="block py-2 text-sm underline" href={`/menu/versions/${version.id}`}>{version.submittedAt?.toLocaleString("es-UY",{timeZone:"America/Montevideo"})} · {index === 0 ? "Vigente" : "Histórica"}{version.createdBy === "migration:existing-catalogue" ? " · Carta original" : ""}</Link></li>)}</ol></details></section>;
  })}</main></div>;
}
