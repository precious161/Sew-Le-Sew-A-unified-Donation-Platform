import { z } from "zod";

export const financialContributionSchema = z.object({
  body: z.object({
    amount: z.coerce.number().min(5, "Minimum contribution is 5 Birr."),
    currency: z.string().default("ETB"),
    purpose: z.string().optional(),
  })
});