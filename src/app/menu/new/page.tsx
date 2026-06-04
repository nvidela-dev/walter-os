import type { ReactElement } from "react";

import { PageHeader } from "@/components/ui/page-header";
import { t } from "@/i18n";
import { getRecipeOptions } from "@/lib/queries/menu";

import { MenuForm } from "../menu-form";

export const dynamic = "force-dynamic";

export default async function NewMenuItemPage(): Promise<ReactElement> {
  const recipes = await getRecipeOptions();

  return (
    <div className="flex min-h-screen flex-col bg-[#faf8f5]">
      <PageHeader backHref="/menu" title={t.menu.newTitle} />
      <main className="flex-1 px-6 py-4"><div className="rounded-2xl bg-[#f5f0e8] p-6"><MenuForm recipes={recipes} /></div></main>
    </div>
  );
}
