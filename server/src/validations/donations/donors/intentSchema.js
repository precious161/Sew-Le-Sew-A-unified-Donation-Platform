import { z } from "zod";


export const registerIntentSchema = z.object({
  body: z.object({
    category: z.enum(['Blood', 'Organ', 'Financial', 'In_Kind'], {
      errorMap: () => ({ message: "Please select a valid donation category." })
    }),


    plannedDate: z.coerce.date().refine((date) => {
      return date > new Date();
    }, {
      message: "The planned date must be in the future."
    }),


    location: z.string().optional()
  })
});