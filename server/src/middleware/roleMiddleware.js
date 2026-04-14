import { StatusCodes } from "http-status-codes";

export const authorize = (...allowedRoles) => {
  return (req, res, next) => {

    if (!req.user) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        message: "Authorization attempted without user context. Ensure 'protect' middleware is called first."
      });
    }



    if (!allowedRoles.includes(req.user.role)) {
      return res.status(StatusCodes.FORBIDDEN).json({
        message: `Forbidden: Role '${req.user.role}' does not have access to this resource.`
      });
    }


    next();
  };
};