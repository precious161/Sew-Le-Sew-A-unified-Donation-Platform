import { z } from 'zod';

export const healthInfoSchema = z.object({
  body: z.object({
    bloodType: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'], {
      errorMap: () => ({ message: "Please provide a valid blood type (e.g., O+, A-)." })
    }),
    weight: z.number().min(30, "Weight must be at least 30kg").max(300),
    height: z.number().min(50, "Height must be at least 50cm").max(250),
    medicalConditions: z.string().optional(),
    allergies: z.string().optional(),
    notes: z.string().optional(),
  })
});