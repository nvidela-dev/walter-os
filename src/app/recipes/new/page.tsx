import type { ReactElement } from "react";

import { PageHeader } from "@/components/ui/page-header";
import { t } from "@/i18n";

import { RecipeForm } from "../recipe-form";

export default function NewRecipePage(): ReactElement {
  return (
    <div className="flex min-h-screen flex-col bg-[#faf8f5]">
      <PageHeader backHref="/recipes" title={t.recipes.newTitle} />
      <main className="flex-1 px-6 py-4"><div className="rounded-2xl bg-[#f5f0e8] p-6"><RecipeForm /></div></main>
    </div>
  );
}
