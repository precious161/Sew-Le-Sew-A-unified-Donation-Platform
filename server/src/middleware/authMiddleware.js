// authMiddleware.js
import jwt from "jsonwebtoken";
import { StatusCodes } from "http-status-codes";
import { config } from "../config/env.js";
import prisma from "../config/db.js";

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
          message: "Session expired. Please log in again.",
        });
      }

      const decoded = jwt.verify(token, config.jwtSecret);

      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          Role: true,
          status: true,
          identityStatus: true,
        },
      });

      if (!user) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
          message: "The user belonging to this token no longer exists.",
        });
      }

      // Double check account is still active on every request
      if (user.status !== "Active") {
        return res.status(StatusCodes.FORBIDDEN).json({
          message: "Your account has been deactivated. Please contact support.",
        });
      }

      req.user = user;
      return next();
    } catch (error) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        message: "Not authorized, token failed",
      });
    }
  }

  if (!token) {
    return res.status(StatusCodes.UNAUTHORIZED).json({
      message: "Not authorized, no token",
    });
  }
};