import { getRecipes } from "./actions";
import { ListPageShell, EmptyState, ListPageRow } from "@/components/list-page-shell";

export default async function RecipesPage() {
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
