"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { employees, extraHours } from "@/db/schema";
import { t } from "@/i18n";
import { actionError, actionOk, type ActionResult, unknownActionError } from "@/lib/action-result";
import { countRows } from "@/lib/db/count-rows";
import { getEmployeeDeleteBlock } from "@/lib/delete-guards";
import { uuidSchema } from "@/lib/validation";
import { employeeInputSchema, extraHoursInputSchema } from "@/lib/validators/employees";

export async function createEmployee(input: unknown): Promise<ActionResult<{ id: string }>> {
  const parsed = employeeInputSchema.safeParse(input);
  if (!parsed.success) return unknownActionError(parsed.error);

  try {
    const [created] = await db
      .insert(employees)
      .values(parsed.data)
      .returning({ id: employees.id });
    if (!created) return actionError(t.errors.employee.createFailed);
    revalidatePath("/employees");
    return actionOk(created);
  } catch (error) {
    return unknownActionError(error);
  }
}

export async function updateEmployee(
  id: string,
  input: unknown
): Promise<ActionResult<{ id: string }>> {
  const parsedId = uuidSchema.safeParse(id);
  if (!parsedId.success) return unknownActionError(parsedId.error);

  const parsed = employeeInputSchema.safeParse(input);
  if (!parsed.success) return unknownActionError(parsed.error);

  try {
    const [updated] = await db
      .update(employees)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(eq(employees.id, parsedId.data))
      .returning({ id: employees.id });

    if (!updated) return actionError(t.errors.employee.notFound);

    revalidatePath("/employees");
    revalidatePath(`/employees/${parsedId.data}`);
    return actionOk(updated);
  } catch (error) {
    return unknownActionError(error);
  }
}

export async function deleteEmployee(id: string): Promise<ActionResult> {
  const parsedId = uuidSchema.safeParse(id);
  if (!parsedId.success) return unknownActionError(parsedId.error);

  try {
    const extraHoursCount = await countRows(extraHours, eq(extraHours.employeeId, parsedId.data));
    const blockMessage = getEmployeeDeleteBlock({ extraHours: extraHoursCount });
    if (blockMessage != null) return actionError(blockMessage);

    const [deleted] = await db
      .delete(employees)
      .where(eq(employees.id, parsedId.data))
      .returning({ id: employees.id });

    if (!deleted) return actionError(t.errors.employee.notFound);

    revalidatePath("/employees");
    return actionOk(undefined);
  } catch (error) {
    return unknownActionError(error);
  }
}

export async function addExtraHours(input: unknown): Promise<ActionResult> {
  const parsed = extraHoursInputSchema.safeParse(input);
  if (!parsed.success) return unknownActionError(parsed.error);

  try {
    await db.insert(extraHours).values(parsed.data);
    revalidatePath(`/employees/${parsed.data.employeeId}`);
    return actionOk(undefined);
  } catch (error) {
    return unknownActionError(error);
  }
}
