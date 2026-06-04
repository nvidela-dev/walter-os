import { z } from "zod";

import { moneySchema, requiredTextSchema } from "@/lib/validation";

export const employeeInputSchema = z.object({
  nombre: requiredTextSchema,
  salarioMensual: moneySchema,
  horasFijasSemanales: z
    .number({ message: "Ingresá las horas semanales." })
    .int("Las horas semanales deben ser un número entero.")
    .positive("Las horas semanales deben ser mayores que cero."),
});

export type EmployeeInput = z.infer<typeof employeeInputSchema>;
