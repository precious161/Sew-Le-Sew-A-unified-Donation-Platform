// validateSchema.js
import { StatusCodes } from "http-status-codes";

export const validate = (schema) => {
  if (!schema || typeof schema.safeParse !== "function") {
    throw new Error(
      `VALIDATION SETUP ERROR: Invalid schema passed to validate() middleware. Received: ${JSON.stringify(schema)}`
    );
  }

  return (req, res, next) => {
    try {
      const result = schema.safeParse(req.body);

      if (!result.success) {
        const zodErrors = result.error?.errors || [];

        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: "Validation Failed",
          errors: zodErrors.map((err) => ({
            field: err.path[0] || "general",
            message: err.message,
          })),
        });
      }

      req.body = result.data;
      next();
    } catch (err) {
      console.error("Zod Internal Crash:", err.message);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Middleware Crash",
        details: err.message,
      });
    }
  };
};