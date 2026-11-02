export const DRINK_CATEGORIES = ["Alcoholes", "Cervezas", "Refrescos"] as const;
export type DrinkCategory = typeof DRINK_CATEGORIES[number];
export function drinkCategory(value?: string): DrinkCategory {
  return DRINK_CATEGORIES.find((category) => category === value) ?? "Alcoholes";
}
export function drinkHref(path: string, category: string): string {
  return `${path}${path.includes("?") ? "&" : "?"}category=${encodeURIComponent(category)}`;
}
