import { StatusCodes } from "http-status-codes";

export const validate = (schema) => {

  if (!schema || typeof schema.safeParse !== 'function') {
    throw new Error(
      `VALIDATION SETUP ERROR: Invalid schema passed to validate() middleware. Received: ${JSON.stringify(schema)}`
    );
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
      console.error("Zod Internal Crash:", err.message);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Middleware Crash",
        details: err.message
      });
    }
  };
};