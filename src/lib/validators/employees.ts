import { z } from "zod";

import { t } from "@/i18n";
import { isoDateSchema, moneySchema, requiredTextSchema, uuidSchema } from "@/lib/validation";

export const employeeInputSchema = z.object({
  name: requiredTextSchema,
  hourlyRate: moneySchema,
  extraHourRate: moneySchema,
  fixedWeeklyHours: z.coerce
    .number()
    .int(t.validation.weeklyHoursInteger)
    .positive(t.validation.weeklyHoursPositive),
});

export const extraHoursInputSchema = z.object({
  employeeId: uuidSchema,
  date: isoDateSchema,
  hours: z.coerce
    .number()
    .int(t.validation.extraHoursInteger)
    .positive(t.validation.extraHoursPositive),
});

export type EmployeeInput = z.infer<typeof employeeInputSchema>;
export type ExtraHoursInput = z.infer<typeof extraHoursInputSchema>;
