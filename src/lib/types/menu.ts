export interface MenuItemView {
  id: string;
  name: string;
  description: string | null;
  sellPrice: string;
  recipeId: string | null;
}

export interface MenuItemRow extends MenuItemView {
  recipeName: string | null;
}

export interface RecipeOption {
  id: string;
  name: string;
}
