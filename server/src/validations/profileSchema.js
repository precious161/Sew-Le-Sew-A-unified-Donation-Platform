import { z } from "zod";

// Profile update schema - all fields optional (only send what you want to update)
export const updateProfileSchema = z.object({
  FirstName: z.string().min(2, "First name must be at least 2 characters").max(50, "First name too long").optional(),
  LastName: z.string().min(2, "Last name must be at least 2 characters").max(50, "Last name too long").optional(),
  PhoneNumber: z.string()
    .min(10, "Phone number must be at least 10 digits")
    .max(15, "Phone number too long")
    .regex(/^[0-9+\-\s]+$/, "Phone number contains invalid characters")
    .optional(),
  bloodType: z.enum(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]).optional().nullable(),

  // Prevent empty strings - convert to null/undefined
}).transform(data => {
  // Remove empty strings
  const cleaned = {};
  for (const [key, value] of Object.entries(data)) {
    if (value !== "" && value !== null && value !== undefined) {
      cleaned[key] = value;
    }
  }
  return cleaned;
});

// Password change schema (when user wants to update password)
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  confirmNewPassword: z.string()
}).refine((data) => data.newPassword === data.confirmNewPassword, {
  message: "New passwords don't match",
  path: ["confirmNewPassword"],
});