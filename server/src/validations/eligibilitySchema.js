import { z } from 'zod';

export const eligibilitySchema = z.object({
  body: z.object({
    // 1. Enforce strict category selection
    category: z.enum(['Blood', 'Organ', 'Financial', 'In_Kind'], {
      required_error: "Category is required",
      invalid_type_error: "Category must be one of: Blood, Organ, Financial, or In_Kind",
    }),

    // 2. Ensure answers is a non-empty object
    answers: z
      .record(z.union([z.string(), z.number(), z.boolean()]))
      .refine((val) => Object.keys(val).length > 0, {
        message: "You must provide at least one answer to check eligibility",
      }),
  }),
});