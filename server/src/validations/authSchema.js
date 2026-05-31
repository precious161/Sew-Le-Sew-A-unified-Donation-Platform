import { z } from "zod";

export const signUpSchema = z.object({
  FirstName: z.string().min(2, "First name is too short"),
  LastName: z.string().min(2, "Last name is too short"),
  EmailAddress: z.string().email("Invalid email format"),
  Password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  PhoneNumber: z.string().min(10, "Phone number is too short").max(15, "Phone number is too long"),
  Role: z.enum(["Donor", "Recipient"]).optional(),
  bloodType: z.enum(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]).optional(),
});

export const loginSchema = z.object({
  EmailAddress: z.string().email("Invalid email format"),
  Password: z.string().min(1, "Password is required"),
});

// Forgot password schema
export const forgotPasswordSchema = z.object({
  EmailAddress: z.string().email("Invalid email format"),
});

// Reset password schema
export const resetPasswordSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});