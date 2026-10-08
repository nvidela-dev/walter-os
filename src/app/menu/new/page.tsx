import type { ReactElement } from "react";

import { PageHeader } from "@/components/ui/page-header";
import { t } from "@/i18n";
import { getRecipeOptions } from "@/lib/queries/menu";

import { MenuForm } from "../menu-form";

export const dynamic = "force-dynamic";

export default async function NewMenuItemPage(): Promise<ReactElement> {
  const recipes = await getRecipeOptions();

  return (
    <div className="app-page flex flex-col bg-white">
      <PageHeader backHref="/menu" title={t.menu.newTitle} />
      <main className="flex-1 py-5"><div className="app-card rounded-2xl p-6"><MenuForm recipes={recipes} /></div></main>
    </div>
  );
}
