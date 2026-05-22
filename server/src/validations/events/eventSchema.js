import { z } from "zod";

export const eventSchema = z.object({
  body: z.object({
    eventName: z.string().min(3, "Event name must be at least 3 characters."),
    description: z.string().optional(),
    location: z.string().min(3, "Location is required."),

    // Coerce converts strings to numbers automatically just in case
    latitude: z.coerce.number().min(-90).max(90).optional(),
    longitude: z.coerce.number().min(-180).max(180).optional(),

    // Ensure the date is today or in the future
    eventDate: z.coerce.date().refine((date) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Strip time for a fair comparison
      return date >= today;
    }, { message: "Event date cannot be in the past." }),

    // Regex ensures time is strictly HH:MM format
    startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid start time format (HH:MM)."),
    endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid end time format (HH:MM)."),
  }).refine((data) => {
    // Advanced Validation: Ensure end time is after start time
    if (data.startTime && data.endTime) {
      return data.endTime > data.startTime;
    }
    return true;
  }, {
    message: "End time must be after the start time.",
    path: ["endTime"],
  })
});

// A separate tiny schema just for updating the status
export const eventStatusSchema = z.object({
  body: z.object({
    status: z.enum(["Active", "Cancelled", "Completed"], {
      errorMap: () => ({ message: "Status must be Active, Cancelled, or Completed." })
    })
  })
});