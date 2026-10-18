import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactElement } from "react";

import { PageHeader } from "@/components/ui/page-header";
import { getActiveMenuVersion, getMenuVersion } from "@/lib/queries/menu-versions";

import { MenuVersionEditor } from "./version-editor";
export const dynamic = "force-dynamic";
export default async function MenuVersionPage({params}: {params: Promise<{id:string}>}): Promise<ReactElement> {
  const version = await getMenuVersion((await params).id);
  if (!version) notFound();
  const baseline = version.baseVersionId === null ? null : await getMenuVersion(version.baseVersionId);
  const latest = await getActiveMenuVersion(version.menuName);
  return <div className="app-page max-w-4xl"><PageHeader title={`${version.menuName} · ${version.status === "draft" ? "Borrador" : latest?.id === version.id ? "Menú activo" : "Histórica"}`} backHref="/menu" actions={version.status === "submitted" ? <Link className="app-text-action underline" href={latest?.id === version.id ? `/menu/compare?family=${encodeURIComponent(version.menuName)}` : `/menu/compare?version=${version.id}`}>{latest?.id === version.id ? "Comparar con histórico" : "Comparar con actual"}</Link> : undefined} /><MenuVersionEditor key={`${version.id}:${version.revision}`} version={version} baseline={baseline?.document ?? {sections:[],items:[]}} stale={version.status === "draft" && (latest?.id ?? null) !== version.baseVersionId} baselineDate={baseline?.submittedAt?.toISOString() ?? null} /></div>;
}
