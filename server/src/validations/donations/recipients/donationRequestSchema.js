import { z } from "zod";

export const donationRequestSchema = z.object({
  body: z.object({
    donationType: z.enum(["Blood", "In_Kind", "Financial", "Organ"], {
      errorMap: () => ({
        message: "Donation type must be Blood, In_Kind, Financial or Organ",
      }),
    }),

    // Blood specific
    requiredBloodType: z.enum(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"], {
        errorMap: () => ({ message: "Please provide a valid blood type." }),
    }).optional(),

    // In-Kind specific
    itemType: z.string().min(2, "Item type must be at least 2 characters").optional(),
    itemQuantity: z.coerce.number().int().min(1, "Item quantity must be at least 1").optional(),

    // Organ specific
    organType: z.string().min(2, "Organ type must be at least 2 characters").optional(),

    // --- NEW: FINANCIAL SPECIFIC ---
    financialAmount: z.coerce.number().min(100, "Minimum financial request is 100 Birr.").optional(),
    financialPurpose: z.string().optional(),
    bankName: z.string().optional(),
    bankAccount: z.string().optional(),
    // -------------------------------

    // General fields
    quantity: z.coerce.number().min(1, "Quantity must be at least 1").default(1),
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
  }, { message: "Required blood type must be provided for Blood requests.", path: ["requiredBloodType"] })

  // In-Kind validation
  .refine((data) => {
    if (data.donationType === "In_Kind" && !data.itemType) return false;
    return true;
  }, { message: "Item type must be provided for In-Kind requests.", path: ["itemType"] })

  // Organ Validation
  .refine((data) => {
    if (data.donationType === "Organ" && !data.organType) return false;
    return true;
  }, { message: "Organ type must be provided for Organ requests.", path: ["organType"] })

  //  FINANCIAL VALIDATION ---
  .refine((data) => {
    if (data.donationType === "Financial" && !data.financialAmount) return false;
    return true;
  }, { message: "Amount is required for Financial requests.", path: ["financialAmount"] })
  .refine((data) => {
    if (data.donationType === "Financial" && !data.bankName) return false;
    return true;
  }, { message: "Bank Name is required for Financial requests.", path: ["bankName"] })
  .refine((data) => {
    if (data.donationType === "Financial" && !data.bankAccount) return false;
    return true;
  }, { message: "Bank Account is required for Financial requests.", path: ["bankAccount"] })
});