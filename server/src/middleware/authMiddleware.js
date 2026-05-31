import jwt from "jsonwebtoken";
import { StatusCodes } from "http-status-codes";
import { config } from "../config/env.js";
import prisma from "../config/db.js";
import logger from "../utils/logger.js";

export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];

      const isBlacklisted = await prisma.blacklistedToken.findUnique({
        where: { token },
      });

      if (isBlacklisted) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
          success: false,
          message: "Session expired. Please log in again.",
        });
      }

      const decoded = jwt.verify(token, config.jwtSecret);

      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          FirstName: true,
          LastName: true,
          EmailAddress: true,
          Role: true,
          status: true,
          identityStatus: true,
        },
      });

      if (!user) {
        logger.warn(`Token belongs to non-existent user`, { userId: decoded.userId });
        return res.status(StatusCodes.UNAUTHORIZED).json({
          success: false,
          message: "The user belonging to this token no longer exists.",
        });
      }

      if (user.status !== "Active") {
        logger.warn(`Inactive user attempted access`, { userId: user.id, email: user.EmailAddress });
        return res.status(StatusCodes.FORBIDDEN).json({
          success: false,
          message: "Your account has been deactivated. Please contact support.",
        });
      }

      req.user = user;
      return next();
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        return res.status(StatusCodes.UNAUTHORIZED).json({
          success: false,
          message: "Session expired. Please log in again.",
        });
      }

      if (error.name === "JsonWebTokenError") {
        return res.status(StatusCodes.UNAUTHORIZED).json({
          success: false,
          message: "Invalid token. Please log in again.",
        });
      }

      logger.error("Auth middleware error:", error.message);
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        message: "Not authorized, token failed",
      });
    }
  }

  if (!token) {
    return res.status(StatusCodes.UNAUTHORIZED).json({
      success: false,
      message: "Not authorized, no token provided",
    });
  }
};