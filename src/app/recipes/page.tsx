import { BookOpenIcon } from "@heroicons/react/24/outline";
import type { ReactElement } from "react";

import { EmptyState, ListPageRow, ListPageShell } from "@/components/list-page-shell";
import { t } from "@/i18n";
import { getRecipes } from "@/lib/queries/recipes";

export const dynamic = "force-dynamic";

export default async function RecipesPage(): Promise<ReactElement> {
  const recipes = await getRecipes();

  return (
    <ListPageShell
      title={t.recipes.title}
      backHref="/"
      addHref="/recipes/new"
      items={recipes}
      renderItem={(recipe) => (
        <ListPageRow
          key={recipe.id}
          href={`/recipes/${recipe.id}`}
          icon={BookOpenIcon}
          title={recipe.name}
          subtitle={recipe.description}
        />
      )}
      emptyState={
        <EmptyState
          icon={BookOpenIcon}
          title={t.recipes.emptyTitle}
          description={t.recipes.emptyDescription}
          ctaHref="/recipes/new"
          ctaText={t.recipes.addCta}
        />
      }
    />
  );
}
