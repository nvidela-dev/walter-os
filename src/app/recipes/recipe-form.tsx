"use client";

import { useRouter } from "next/navigation";
import type { ReactElement } from "react";

import { FormMessage } from "@/components/form-feedback";
import { useActionForm } from "@/components/hooks/use-action-form";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { t } from "@/i18n";
import { createRecipe, updateRecipe } from "@/lib/actions/recipes";
import { getFormString } from "@/lib/form";
import type { RecipeView } from "@/lib/types/recipes";

export function RecipeForm({ recipe }: { recipe?: RecipeView }): ReactElement {
  const router = useRouter();
  const { error, isSubmitting, runAction } = useActionForm();
  const isEditing = !!recipe;

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      name: getFormString(formData, "name"),
      description: getFormString(formData, "description") || null,
    };
    const result = await runAction(() =>
      isEditing ? updateRecipe(recipe.id, data) : createRecipe(data)
    );
    if (!result.ok) return;
    router.push("/recipes");
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5">
      <FormMessage message={error} />
      <FormField htmlFor="recipe-name" label={t.recipes.fields.name}>
        <Input id="recipe-name" name="name" required defaultValue={recipe?.name} />
      </FormField>
      <FormField htmlFor="recipe-description" label={t.recipes.fields.instructions}>
        <Textarea
          id="recipe-description"
          name="description"
          rows={5}
          defaultValue={recipe?.description ?? ""}
          placeholder={t.recipes.fields.instructionsPlaceholder}
        />
      </FormField>
      <Button type="submit" disabled={isSubmitting} className="w-full py-4 text-base">
        {isSubmitting ? t.common.loading : isEditing ? t.common.save : t.recipes.addCta}
      </Button>
    </form>
  );
}
