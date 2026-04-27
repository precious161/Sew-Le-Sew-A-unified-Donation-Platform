import { StatusCodes } from "http-status-codes";

export const validate = (schema) => {
  // If the route setup is broken, this will catch it when the server starts
  if (!schema || typeof schema.safeParse !== 'function') {
    console.error("❌ VALIDATION ERROR: The schema passed to the middleware is invalid!");
    console.error("Value received:", schema);
  }

  return (req, res, next) => {
    try {
      const result = schema.safeParse(req.body);

      if (!result.success) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: "Validation Failed",
          errors: result.error.issues.map((issue) => ({
            path: issue.path.join('.'),
            message: issue.message,
          })),
        });
      }

      req.body = result.data;
      next();
    } catch (err) {
      // This will catch the '_zod' error and tell us why
      console.error("Zod Internal Crash:", err.message);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Middleware Crash",
        details: err.message
      });
    }
  };
};