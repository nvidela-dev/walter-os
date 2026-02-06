"use server";

import { db } from "@/db";
import { gastosHogar, type NewGastoHogar } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getHouseExpenses() {
  return db.select().from(gastosHogar).orderBy(gastosHogar.nombre);
}

export async function getHouseExpense(id: string) {
  const result = await db.select().from(gastosHogar).where(eq(gastosHogar.id, id));
  return result[0] ?? null;
}

export async function createHouseExpense(data: NewGastoHogar) {
  const result = await db.insert(gastosHogar).values(data).returning();
  revalidatePath("/house-expenses");
  return result[0];
}

export async function updateHouseExpense(id: string, data: Partial<NewGastoHogar>) {
  const result = await db.update(gastosHogar).set({ ...data, updatedAt: new Date() }).where(eq(gastosHogar.id, id)).returning();
  revalidatePath("/house-expenses");
  return result[0];
}

export async function deleteHouseExpense(id: string) {
  await db.delete(gastosHogar).where(eq(gastosHogar.id, id));
  revalidatePath("/house-expenses");
}
