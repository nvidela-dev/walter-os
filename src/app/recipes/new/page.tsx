import type { ReactElement } from "react";

import { PageHeader } from "@/components/ui/page-header";
import { t } from "@/i18n";

import { RecipeForm } from "../recipe-form";

export default function NewRecipePage(): ReactElement {
  return (
    <div className="app-page flex flex-col bg-white">
      <PageHeader backHref="/recipes" title={t.recipes.newTitle} />
      <main className="flex-1 py-5"><div className="app-card rounded-2xl p-6"><RecipeForm /></div></main>
    </div>
  );
}
