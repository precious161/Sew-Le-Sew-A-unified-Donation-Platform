
import { z } from "zod";

export const registerIntentSchema = z.object({
  body: z.object({
    category: z.enum(["Blood", "In_Kind","Organ"], {
      errorMap: () => ({
        message: "Donation category must be Blood, In_Kind, Organ.",
      }),
    }),

    plannedDate: z.coerce.date().refine(
      (date) => date > new Date(),
      { message: "The planned date must be in the future." }
    ),

    location: z.string().optional(),

    // In-Kind specific fields
    itemType: z.string().min(2, "Item type must be at least 2 characters").optional(),
    quantity: z.coerce.number().int().min(1, "Quantity must be at least 1").optional(),
  })

  // In-Kind validation

  .refine((data) => {
    if ((data.category === "In_Kind" || data.category === "Organ") && !data.itemType) return false;
    return true;
  }, {
    message: "itemType is required for In-Kind and Organ donations.",
    path: ["itemType"],
  })

  .refine((data) => {
    if (data.category === "In_Kind" && !data.quantity) return false;
    return true;
  }, {
    message: "quantity is required for In-Kind donations.",
    path: ["quantity"],
  }),
});