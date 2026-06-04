import type { ReactElement } from "react";

import { EmptyState, ListPageRow, ListPageShell } from "@/components/list-page-shell";

import { getRecipes } from "./actions";

export const dynamic = "force-dynamic";

export default async function RecipesPage(): Promise<ReactElement> {
  const recipes = await getRecipes();

  return (
    <ListPageShell
      title="Recetas"
      backHref="/"
      addHref="/recipes/new"
      items={recipes}
      renderItem={(recipe) => (
        <ListPageRow
          key={recipe.id}
          href={`/recipes/${recipe.id}`}
          emoji="📿"
          title={recipe.nombre}
          subtitle={recipe.descripcion}
        />
      )}
      emptyState={
        <EmptyState
          emoji="📿"
          title="Sin recetas"
          description="Agrega tus recetas aquí"
          ctaHref="/recipes/new"
          ctaText="Agregar Receta"
        />
      }
    />
  );
}
