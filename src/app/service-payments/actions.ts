"use server";

import { db } from "@/db";
import { pagosServicios, servicios, type NewPagoServicio } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getServicePayments() {
  return db
    .select({
      id: pagosServicios.id,
      monto: pagosServicios.monto,
      fecha: pagosServicios.fecha,
      notas: pagosServicios.notas,
      servicioId: pagosServicios.servicioId,
      servicioNombre: servicios.nombre,
      createdAt: pagosServicios.createdAt,
    })
    .from(pagosServicios)
    .innerJoin(servicios, eq(pagosServicios.servicioId, servicios.id))
    .orderBy(desc(pagosServicios.fecha));
}

export async function getServicePayment(id: string) {
  const result = await db
    .select({
      id: pagosServicios.id,
      monto: pagosServicios.monto,
      fecha: pagosServicios.fecha,
      notas: pagosServicios.notas,
      servicioId: pagosServicios.servicioId,
      servicioNombre: servicios.nombre,
      createdAt: pagosServicios.createdAt,
    })
    .from(pagosServicios)
    .innerJoin(servicios, eq(pagosServicios.servicioId, servicios.id))
    .where(eq(pagosServicios.id, id));
  return result[0] ?? null;
}

export async function createServicePayment(data: NewPagoServicio) {
  const result = await db.insert(pagosServicios).values(data).returning();
  revalidatePath("/service-payments");
  return result[0];
}

export async function updateServicePayment(id: string, data: Partial<NewPagoServicio>) {
  const result = await db
    .update(pagosServicios)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(pagosServicios.id, id))
    .returning();
  revalidatePath("/service-payments");
  return result[0];
}

export async function deleteServicePayment(id: string) {
  await db.delete(pagosServicios).where(eq(pagosServicios.id, id));
  revalidatePath("/service-payments");
}
