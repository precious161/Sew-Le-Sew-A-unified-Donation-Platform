import { z } from "zod";

export const donationRequestSchema = z.object({
  body: z.object({
    donationType: z.enum(["Blood", "In_Kind", "Financial", "Organ"], {
      errorMap: () => ({
        message: "Donation type must be Blood, In_Kind, Financial or Organ",
      }),
    }),

    // Blood specific
    requiredBloodType: z
      .enum(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"], {
        errorMap: () => ({ message: "Please provide a valid blood type." }),
      })
      .optional(),

    // In-Kind specific
    itemType: z.string().min(2, "Item type must be at least 2 characters").optional(),
    itemQuantity: z.coerce.number().int().min(1, "Item quantity must be at least 1").optional(),

    // Organ specific <--- THIS IS WHAT WAS MISSING!
    organType: z.string().min(2, "Organ type must be at least 2 characters").optional(),

    // General fields
    quantity: z.coerce.number().int().min(1, "Quantity must be at least 1").default(1),
    urgencyLevel: z.enum(["Low", "Medium", "High", "Critical"], {
      errorMap: () => ({ message: "Urgency level must be Low, Medium, High, or Critical." }),
    }),
    notes: z.string().optional(),

    // Verification fields
    hospitalName: z.string().min(2, "Hospital name must be at least 2 characters").optional(),
    attendingDoctor: z.string().min(2, "Doctor name must be at least 2 characters").optional(),
  })

  // Blood validation
  .refine((data) => {
    if (data.donationType === "Blood" && !data.requiredBloodType) return false;
    return true;
  }, {
    message: "Required blood type must be provided for Blood donation requests.",
    path: ["requiredBloodType"],
  })

  // In-Kind validation
  .refine((data) => {
    if (data.donationType === "In_Kind" && !data.itemType) return false;
    return true;
  }, {
    message: "Item type must be provided for In-Kind donation requests.",
    path: ["itemType"],
  })

  // Organ Validation
  .refine((data) => {
    if (data.donationType === "Organ" && !data.organType) return false;
    return true;
  }, {
    message: "Organ type must be provided for Organ donation requests.",
    path: ["organType"],
  })

  .refine((data) => {
    if (data.donationType === "In_Kind" && !data.itemQuantity) return false;
    return true;
  }, {
    message: "Item quantity must be provided for In-Kind donation requests.",
    path: ["itemQuantity"],
  }),
});