import { z } from "zod";

import { isPositiveDecimal } from "@/lib/money";
import {
  isoDateSchema,
  moneySchema,
  optionalTextSchema,
  proveedorTipoSchema,
  quantitySchema,
  requiredTextSchema,
  uuidSchema,
} from "@/lib/validation";

const facturaLineFormSchema = z.object({
  productoId: z.string(),
  cantidad: z.string(),
  precioUnit: z.string(),
});

export const facturaFormSchema = z
  .object({
    tipo: proveedorTipoSchema,
    proveedorId: z.string(),
    fecha: isoDateSchema,
    numero: optionalTextSchema,
    notas: optionalTextSchema,
    monto: z.string(),
    lineas: z.array(facturaLineFormSchema),
  })
  .superRefine((data, ctx) => {
    if (data.proveedorId === "") {
      ctx.addIssue({ code: "custom", message: "Selecciona un proveedor.", path: ["proveedorId"] });
    }
    if (data.tipo === "servicio") {
      if (!isPositiveDecimal(data.monto)) {
        ctx.addIssue({ code: "custom", message: "Ingresá un monto válido.", path: ["monto"] });
      }
      return;
    }
    data.lineas.forEach((linea, index) => {
      if (linea.productoId === "") {
        ctx.addIssue({
          code: "custom",
          message: "Elegí un producto.",
          path: ["lineas", index, "productoId"],
        });
      }
      if (!isPositiveDecimal(linea.precioUnit)) {
        ctx.addIssue({
          code: "custom",
          message: "Precio inválido.",
          path: ["lineas", index, "precioUnit"],
        });
      }
      if (!isPositiveDecimal(linea.cantidad)) {
        ctx.addIssue({
          code: "custom",
          message: "Cantidad inválida.",
          path: ["lineas", index, "cantidad"],
        });
      }
    });
  });

export type FacturaFormValues = z.input<typeof facturaFormSchema>;

export const newProductModalSchema = z.object({
  nombre: requiredTextSchema,
  unidadId: uuidSchema,
  precio: moneySchema,
  cantidad: quantitySchema,
});
export type NewProductModalValues = z.input<typeof newProductModalSchema>;

export const editProductModalSchema = z.object({
  unidadId: uuidSchema,
  precio: moneySchema,
});
export type EditProductModalValues = z.input<typeof editProductModalSchema>;
