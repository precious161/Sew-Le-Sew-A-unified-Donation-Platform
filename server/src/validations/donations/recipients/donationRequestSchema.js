import { z } from "zod";

export const donationRequestSchema = z.object({
  body: z.object({
    donationType: z.enum(['Blood', 'Organ', 'Financial', 'In_Kind']),
    requiredBloodType: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).optional(),
    organType: z.string().optional(),
    quantity: z.number().int().min(1, "Quantity must be at least 1").default(1),
    urgencyLevel: z.enum(['Low', 'Medium', 'High', 'Critical']),
    notes: z.string().optional(),
  }).refine((data) => {

    if (data.donationType === 'Blood' && !data.requiredBloodType) return false;
    return true;
  }, {
    message: "Required blood type must be provided for Blood donations.",
    path: ["requiredBloodType"]
  }).refine((data) => {

    if (data.donationType === 'Organ' && !data.organType) return false;
    return true;
  }, {
    message: "Organ type must be provided for Organ donations.",
    path: ["organType"]
  })
});