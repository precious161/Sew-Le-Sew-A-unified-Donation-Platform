import { StatusCodes } from "http-status-codes";

export const validateIntent = (schema) => {
  return (req, res, next) => {
    try {

      const result = schema.safeParse({
        body: req.body,
        query: req.query,
        params: req.params,
      });


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


      if (result.data.body) req.body = result.data.body;
      if (result.data.query) req.query = result.data.query;
      if (result.data.params) req.params = result.data.params;

      next();
    } catch (err) {
      console.error("Zod Validation Middleware Crash:", err.message);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Middleware Crash",
        details: err.message
      });
    }
  };
};