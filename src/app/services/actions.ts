"use server";

import { db } from "@/db";
import { servicios, type NewServicio } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getServices() {
  return db.select().from(servicios).orderBy(servicios.nombre);
}

export async function getService(id: string) {
  const result = await db.select().from(servicios).where(eq(servicios.id, id));
  return result[0] ?? null;
}

export async function createService(data: NewServicio) {
  const result = await db.insert(servicios).values(data).returning();
  revalidatePath("/services");
  return result[0];
}

export async function updateService(id: string, data: Partial<NewServicio>) {
  const result = await db.update(servicios).set({ ...data, updatedAt: new Date() }).where(eq(servicios.id, id)).returning();
  revalidatePath("/services");
  return result[0];
}

export async function deleteService(id: string) {
  await db.delete(servicios).where(eq(servicios.id, id));
  revalidatePath("/services");
}
