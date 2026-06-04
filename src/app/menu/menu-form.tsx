"use client";

import { useRouter } from "next/navigation";
import type { ReactElement } from "react";

import { FormMessage } from "@/components/form-feedback";
import { useActionForm } from "@/components/hooks/use-action-form";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { t } from "@/i18n";
import { createMenuItem, updateMenuItem } from "@/lib/actions/menu";
import { getFormString } from "@/lib/form";
import type { MenuItemView, RecipeOption } from "@/lib/types/menu";

export function MenuForm({
  item,
  recipes,
}: {
  item?: MenuItemView;
  recipes: RecipeOption[];
}): ReactElement {
  const router = useRouter();
  const { error, isSubmitting, runAction } = useActionForm();
  const isEditing = !!item;

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      name: getFormString(formData, "name"),
      description: getFormString(formData, "description") || null,
      sellPrice: getFormString(formData, "sellPrice"),
      recipeId: getFormString(formData, "recipeId") || null,
    };

    const result = await runAction(() =>
      isEditing ? updateMenuItem(item.id, data) : createMenuItem(data)
    );
    if (!result.ok) return;
    router.push("/menu");
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5">
      <FormMessage message={error} />
      <FormField htmlFor="menu-name" label={t.menu.fields.name}>
        <Input id="menu-name" name="name" required defaultValue={item?.name} />
      </FormField>

      <FormField htmlFor="menu-price" label={t.menu.fields.sellPrice}>
        <Input id="menu-price" name="sellPrice" type="number" step="0.01" required defaultValue={item?.sellPrice} />
      </FormField>

      <FormField htmlFor="menu-recipe" label={t.menu.fields.recipe}>
        <Select id="menu-recipe" name="recipeId" defaultValue={item?.recipeId ?? ""}>
          <option value="">{t.menu.fields.noRecipe}</option>
          {recipes.map((recipe) => <option key={recipe.id} value={recipe.id}>{recipe.name}</option>)}
        </Select>
      </FormField>

      <FormField htmlFor="menu-description" label={t.menu.fields.description}>
        <Textarea
          id="menu-description"
          name="description"
          rows={3}
          defaultValue={item?.description ?? ""}
          placeholder={t.menu.fields.descriptionPlaceholder}
        />
      </FormField>

      <Button type="submit" disabled={isSubmitting} className="w-full py-4 text-base">
        {isSubmitting ? t.common.loading : isEditing ? t.common.save : t.menu.addCta}
      </Button>
    </form>
  );
}
