import { z } from "zod";

export const signUpSchema= z.object({
  FirstName: z.string().min(2,"First name is toos short"),
  LastName: z.string().min(2,"Last name is too short"),
  EmailAddress: z.string().email("Invalid email format"),
  Password: z.string().min(8,"Password must be at least 8 characters"),
  PhoneNumber: z.string().min(10,"Phone number is too short"),
});

export const loginSchema= z.object({
  EmailAddress: z.string().email("Invalid email format"),
  Password: z.string().min(1, "Password is required ")
});