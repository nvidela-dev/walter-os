export interface MenuItemView {
  id: string;
  name: string;
  description: string | null;
  sellPrice: string | null;
  sectionId: string | null;
  priceOptions: { label: string; price: string | null }[];
  sourceNote: string | null;
  reviewNote: string | null;
  sortOrder: number;
  recipeId: string | null;
}

export interface MenuItemRow extends MenuItemView {
  recipeName: string | null;
  sectionName: string | null;
  menuName: string | null;
}

export interface RecipeOption {
  id: string;
  name: string;
}
