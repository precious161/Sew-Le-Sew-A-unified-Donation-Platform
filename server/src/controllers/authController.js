import crypto from 'crypto';
import { StatusCodes } from "http-status-codes";
import bcrypt from "bcryptjs";
import prisma from "../config/db.js";
import jwt from "jsonwebtoken";
import { config } from "../config/env.js";
import { sendPasswordResetEmail } from '../services/emailService.js';
import logger from '../utils/logger.js';

export const signUp = async (req, res) => {
  try {
    const { FirstName, LastName, EmailAddress, Password, PhoneNumber, Role, bloodType } = req.body;

    const allowedRoles = ["Donor", "Recipient"];
    const finalRole = allowedRoles.includes(Role) ? Role : "Donor";

    const existingUser = await prisma.user.findUnique({
      where: { EmailAddress },
    });

    if (existingUser) {
      logger.warn(`Signup attempt with existing email`, { email: EmailAddress });
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "User already exists with this Email Address.",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(Password, salt);

    const newUser = await prisma.user.create({
      data: {
        FirstName,
        LastName,
        EmailAddress,
        Password: hashedPassword,
        PhoneNumber,
        Role: finalRole,
        bloodType: bloodType || null,
      },
    });

    const token = jwt.sign(
      { userId: newUser.id },
      config.jwtSecret,
      { expiresIn: "1d" }
    );

    logger.info(`New user registered`, { email: EmailAddress, role: finalRole });

    return res.status(StatusCodes.CREATED).json({
      success: true,
      message: "User registered successfully!",
      data: {
        token,
        user: {
          id: newUser.id,
          FirstName: newUser.FirstName,
          EmailAddress: newUser.EmailAddress,
          Role: newUser.Role,
          identityStatus: newUser.identityStatus,
        },
      },
    });
  } catch (error) {
    logger.error("signUp Error:", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Server error during registration",
    });
  }
};

export const login = async (req, res) => {
  try {
    const { EmailAddress, Password } = req.body;

    const user = await prisma.user.findUnique({
      where: { EmailAddress },
    });

    if (!user) {
      logger.warn(`Login attempt with non-existent email`, { email: EmailAddress });
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        message: "Invalid Email Address or Password",
      });
    }

    if (user.status !== "Active") {
      logger.warn(`Login attempt on deactivated account`, { email: EmailAddress });
      return res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        message: "Account is suspended or deactivated. Contact support.",
      });
    }

    const isPasswordCorrect = await bcrypt.compare(Password, user.Password);

    if (!isPasswordCorrect) {
      logger.warn(`Failed login attempt`, { email: EmailAddress });
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        message: "Invalid Email Address or Password",
      });
    }

    const token = jwt.sign(
      { userId: user.id },
      config.jwtSecret,
      { expiresIn: "1d" }
    );

    logger.info(`User logged in`, { email: EmailAddress, role: user.Role });

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Login Successful!",
      data: {
        token,
        user: {
          id: user.id,
          FirstName: user.FirstName,
          EmailAddress: user.EmailAddress,
          Role: user.Role,
          identityStatus: user.identityStatus,
        },
      },
    });
  } catch (error) {
    logger.error("login Error:", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Server error during login",
    });
  }
};

export const logout = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "No token provided",
      });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.decode(token);

    if (!decoded || !decoded.exp) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Invalid token format.",
      });
    }

    await prisma.blacklistedToken.create({
      data: {
        token,
        expiresAt: new Date(decoded.exp * 1000),
      },
    });

    logger.info(`User logged out`, { userId: req.user?.id, email: req.user?.EmailAddress });

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    logger.error("logout Error:", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Logout failed due to a system error",
    });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { EmailAddress } = req.body;

    const user = await prisma.user.findUnique({
      where: { EmailAddress },
    });

    if (!user) {
      logger.warn(`Password reset requested for non-existent email`, { email: EmailAddress });
      return res.status(StatusCodes.OK).json({
        success: true,
        message: "If an account exists with that email, you will receive a password reset link.",
      });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: resetToken,
        resetPasswordExpires: resetExpires,
      },
    });

    await sendPasswordResetEmail(EmailAddress, user.FirstName, resetToken);
    logger.info(`Password reset requested`, { email: EmailAddress });

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Password reset link has been sent to your email.",
    });
  } catch (error) {
    logger.error("forgotPassword Error:", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Server error processing request",
    });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const user = await prisma.user.findFirst({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: { gt: new Date() },
      },
    });

    if (!user) {
      logger.warn(`Password reset attempt with invalid/expired token`);
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Password reset token is invalid or has expired. Please request a new one.",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        Password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null,
      },
    });

    await prisma.notification.create({
      data: {
        userId: user.id,
        message: "Your password has been successfully changed. If you did not make this change, please contact support immediately.",
      },
    });

    logger.info(`Password reset successfully`, { email: user.EmailAddress });

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Password has been reset successfully. You can now log in with your new password.",
    });
  } catch (error) {
    logger.error("resetPassword Error:", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Server error resetting password",
    });
  }
};