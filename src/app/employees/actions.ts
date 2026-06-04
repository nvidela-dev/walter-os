"use server";

import { count, eq, type SQL } from "drizzle-orm";
import type { PgTable } from "drizzle-orm/pg-core";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/db";
import { type Employee, employees, type ExtraHour, extraHours } from "@/db/schema";
import { t } from "@/i18n";
import { actionError, actionOk, type ActionResult, unknownActionError } from "@/lib/action-result";
import { getEmployeeDeleteBlock } from "@/lib/delete-guards";
import {
  isoDateSchema,
  moneySchema,
  requiredTextSchema,
  uuidSchema,
} from "@/lib/validation";

const employeeInputSchema = z.object({
  name: requiredTextSchema,
  monthlySalary: moneySchema,
  fixedWeeklyHours: z.coerce
    .number()
    .int(t.validation.weeklyHoursInteger)
    .positive(t.validation.weeklyHoursPositive),
});

const extraHoursInputSchema = z.object({
  employeeId: uuidSchema,
  date: isoDateSchema,
  hours: z.coerce
    .number()
    .int(t.validation.extraHoursInteger)
    .positive(t.validation.extraHoursPositive),
  amountPaid: moneySchema,
});

export type EmployeeInput = z.infer<typeof employeeInputSchema>;
export type ExtraHoursInput = z.infer<typeof extraHoursInputSchema>;

export async function getEmployees(): Promise<Employee[]> {
  return db.select().from(employees).orderBy(employees.name);
}

export async function getEmployee(id: string): Promise<Employee | null> {
  const result = await db.select().from(employees).where(eq(employees.id, id));
  return result[0] ?? null;
}

export async function getEmployeeWithHours(
  id: string
): Promise<(Employee & { extraHours: ExtraHour[] }) | null> {
  const employee = await getEmployee(id);
  if (!employee) return null;
  const hours = await db.select().from(extraHours).where(eq(extraHours.employeeId, id));
  return { ...employee, extraHours: hours };
}

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

async function countRows(table: PgTable, where: SQL | undefined): Promise<number> {
  const [row] = await db.select({ value: count() }).from(table).where(where);
  return row?.value ?? 0;
}
