import type { ReactElement } from "react";

import { PageHeader } from "@/components/ui/page-header";
import { getMenuVersions } from "@/lib/queries/menu-versions";

import { NewMenuForm } from "./new-menu-form";
export const dynamic = "force-dynamic";
export default async function NewMenuPage(): Promise<ReactElement> {
  const versions = await getMenuVersions();
  const families = [...new Set(["Don Juan","Genüsse",...versions.map(version => version.menuName)])];
  return <div className="app-page max-w-2xl"><PageHeader title="Nuevo menú" backHref="/menu" /><main className="space-y-4 py-5"><p className="text-sm text-muted">Copiamos el menú activo. Podés editar el borrador y comparar todos los cambios antes de presentarlo. Los precios anteriores se conservan.</p><NewMenuForm families={families} /></main></div>;
}
