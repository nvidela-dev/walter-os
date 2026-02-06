"use server";

import { db } from "@/db";
import { empleados, horasExtra, type NewEmpleado, type NewHoraExtra } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

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

export async function createEmployee(data: NewEmpleado) {
  const result = await db.insert(empleados).values(data).returning();
  revalidatePath("/employees");
  return result[0];
}

export async function updateEmployee(id: string, data: Partial<NewEmpleado>) {
  const result = await db.update(empleados).set({ ...data, updatedAt: new Date() }).where(eq(empleados.id, id)).returning();
  revalidatePath("/employees");
  return result[0];
}

export async function deleteEmployee(id: string) {
  await db.delete(empleados).where(eq(empleados.id, id));
  revalidatePath("/employees");
}

export async function addExtraHours(data: NewHoraExtra) {
  await db.insert(horasExtra).values(data);
  revalidatePath(`/employees/${data.empleadoId}`);
}
