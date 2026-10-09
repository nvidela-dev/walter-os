import { z } from "zod";

export const accessInputSchema = z.object({
  email: z.string().trim().toLowerCase().max(254).pipe(z.email()),
  group: z.enum(["admin", "kitchen", "waitress", "none"]),
});
