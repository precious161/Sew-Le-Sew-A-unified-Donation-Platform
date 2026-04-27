
import { z } from 'zod';

export const eligibilitySchema = z.object({
  category: z.enum(['Blood', 'Organ', 'Financial', 'In_Kind'], {
    required_error: "Category is required",
  }),

  answers: z.record(
    z.string(),
    z.union([z.string(), z.number(), z.boolean()])
  )
  .refine((val) => Object.keys(val).length > 0, {
    message: "You must provide at least one answer",
  }),
});