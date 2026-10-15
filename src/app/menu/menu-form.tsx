"use client";

import { useRouter } from "next/navigation";
import { type ReactElement, useId, useState } from "react";

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
import type { MenuItemView } from "@/lib/types/menu";

export function MenuForm({
  item,
  sections,
}: {
  item?: MenuItemView;
  sections: { id: string; name: string; menuName: string }[];
}): ReactElement {
  const router = useRouter();
  const formId = useId();
  const { error, isSubmitting, runAction } = useActionForm();
  const isEditing = !!item;
  const [options, setOptions] = useState(item?.priceOptions ?? []);

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      name: getFormString(formData, "name"),
      description: getFormString(formData, "description") || null,
      sellPrice: getFormString(formData, "sellPrice") || null,
      sectionId: getFormString(formData, "sectionId") || null,
      priceOptions: options.map((option) => ({ ...option, price: option.price === "" ? null : option.price })),
      sortOrder: Number(getFormString(formData, "sortOrder")),
      reviewNote: getFormString(formData, "reviewNote") || null,
      recipeId: item?.recipeId ?? null,
    };

    const result = await runAction(() =>
      isEditing ? updateMenuItem(item.id, data) : createMenuItem(data)
    );
    if (!result.ok) return;
    router.push("/menu");
    router.refresh();
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5">
      <FormMessage message={error} />
      <FormField htmlFor={`${formId  }-name`} label={t.menu.fields.name}>
        <Input id={`${formId  }-name`} name="name" required defaultValue={item?.name} />
      </FormField>

      <FormField htmlFor={`${formId  }-price`} label={t.menu.fields.sellPrice}>
        <Input id={`${formId  }-price`} name="sellPrice" type="number" step="0.01" min="0.01" placeholder="Pendiente / ver opciones" defaultValue={item?.sellPrice ?? ""} />
      </FormField>

      <FormField htmlFor={`${formId  }-section`} label="Carta y sección">
        <Select id={`${formId  }-section`} name="sectionId" defaultValue={item?.sectionId ?? ""}>
          <option value="">Sin sección</option>
          {sections.map((section) => <option key={section.id} value={section.id}>{section.menuName} · {section.name}</option>)}
        </Select>
      </FormField>
      <FormField htmlFor={`${formId  }-order`} label="Orden dentro de la sección"><Input id={`${formId  }-order`} name="sortOrder" type="number" min="0" max="10000" defaultValue={item?.sortOrder ?? 0} /></FormField>
      <fieldset className="space-y-2"><legend className="font-semibold">Tamaños / opciones con precio</legend>
        {options.map((option, index) => <div key={index} className="flex gap-2">
          <Input aria-label={`Opción ${  index + 1}`} value={option.label} required onChange={(event) => { setOptions((rows) => rows.map((row, n) => n === index ? { ...row, label: event.target.value } : row)); }} />
          <Input aria-label={`Precio de opción ${  index + 1}`} type="number" min="0.01" step="0.01" value={option.price ?? ""} placeholder="Pendiente" onChange={(event) => { setOptions((rows) => rows.map((row, n) => n === index ? { ...row, price: event.target.value } : row)); }} />
          <Button type="button" variant="ghost" aria-label={`Quitar opción ${  index + 1}`} onClick={() => { setOptions((rows) => rows.filter((_, n) => n !== index)); }}>×</Button>
        </div>)}
        <Button type="button" variant="secondary" onClick={() => { setOptions((rows) => [...rows, { label: "", price: null }]); }}>Agregar opción</Button>
      </fieldset>
      <FormField htmlFor={`${formId  }-review`} label="Nota para revisar"><Textarea id={`${formId  }-review`} name="reviewNote" defaultValue={item?.reviewNote ?? ""} /></FormField>
      {item?.sourceNote !== null && item?.sourceNote !== undefined && <p className="text-xs text-muted">Fuente: {item.sourceNote}</p>}

      <FormField htmlFor={`${formId  }-description`} label={t.menu.fields.description}>
        <Textarea
          id={`${formId  }-description`}
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
