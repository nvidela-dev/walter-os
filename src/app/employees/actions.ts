"use server";

import { db } from "@/db";
import { empleados, horasExtra } from "@/db/schema";
import { actionError, actionOk, type ActionResult, unknownActionError } from "@/lib/action-result";
import { getEmployeeDeleteBlock } from "@/lib/delete-guards";
import {
  isoDateSchema,
  moneySchema,
  requiredTextSchema,
  uuidSchema,
} from "@/lib/validation";
import { count, eq, type SQL } from "drizzle-orm";
import type { PgTable } from "drizzle-orm/pg-core";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const employeeInputSchema = z.object({
  nombre: requiredTextSchema,
  salarioMensual: moneySchema,
  horasFijasSemanales: z.coerce
    .number()
    .int("Las horas semanales deben ser un número entero.")
    .positive("Las horas semanales deben ser mayores que cero."),
});

const extraHoursInputSchema = z.object({
  empleadoId: uuidSchema,
  fecha: isoDateSchema,
  horas: z.coerce
    .number()
    .int("Las horas extra deben ser un número entero.")
    .positive("Las horas extra deben ser mayores que cero."),
  montoPagado: moneySchema,
});

export type EmployeeInput = z.infer<typeof employeeInputSchema>;
export type ExtraHoursInput = z.infer<typeof extraHoursInputSchema>;

export async function getEmployees() {
  return db.select().from(empleados).orderBy(empleados.nombre);
}

export async function getEmployee(id: string) {
  const result = await db.select().from(empleados).where(eq(empleados.id, id));
  return result[0] ?? null;
}

export async function getEmployeeWithHours(id: string) {
  const employee = await getEmployee(id);
  if (!employee) return null;
  const hours = await db.select().from(horasExtra).where(eq(horasExtra.empleadoId, id));
  return { ...employee, horasExtra: hours };
}

export async function createEmployee(input: unknown): Promise<ActionResult<{ id: string }>> {
  const parsed = employeeInputSchema.safeParse(input);
  if (!parsed.success) return unknownActionError(parsed.error);

  try {
    const [created] = await db
      .insert(empleados)
      .values(parsed.data)
      .returning({ id: empleados.id });
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
      .update(empleados)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(eq(empleados.id, parsedId.data))
      .returning({ id: empleados.id });

    if (!updated) return actionError("Empleado no encontrado.");

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
    const extraHours = await countRows(horasExtra, eq(horasExtra.empleadoId, parsedId.data));
    const blockMessage = getEmployeeDeleteBlock({ extraHours });
    if (blockMessage) return actionError(blockMessage);

    const [deleted] = await db
      .delete(empleados)
      .where(eq(empleados.id, parsedId.data))
      .returning({ id: empleados.id });

    if (!deleted) return actionError("Empleado no encontrado.");

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
    await db.insert(horasExtra).values(parsed.data);
    revalidatePath(`/employees/${parsed.data.empleadoId}`);
    return actionOk(undefined);
  } catch (error) {
    return unknownActionError(error);
  }
}

async function countRows(table: PgTable, where: SQL | undefined) {
  const [row] = await db.select({ value: count() }).from(table).where(where);
  return row?.value ?? 0;
}
