import { z } from "zod";

import { nonNegativeDecimalSchema, uuidSchema } from "@/lib/validation";

export const inventoryTargetSchema = z.object({
  productId: uuidSchema,
  quantity: nonNegativeDecimalSchema(2).refine((value) => Number(value) < 10000000000),
});
