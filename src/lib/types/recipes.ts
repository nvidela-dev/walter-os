export interface RecipeView {
  id: string;
  name: string;
  description: string | null;
}

export interface RecipeIngredient {
  productId: string;
  quantity: string;
  name: string;
  unit: string;
}

export interface RecipeDetail extends RecipeView {
  ingredients: RecipeIngredient[];
}
