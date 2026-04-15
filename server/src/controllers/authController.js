import { StatusCodes } from "http-status-codes";
import bcrypt from "bcryptjs";
import prisma from "../config/db.js";
import jwt from "jsonwebtoken";
import { config } from "../config/env.js";

export const signUp = async (req, res) => {
  try {
    const { FirstName, LastName, EmailAddress, password, phoneNumber, role } = req.body;

    const allowedRoles = ["DONOR", "RECIPIENT"];
    const finalRole = allowedRoles.includes(role) ? role : "DONOR";

    const existingUser = await prisma.user.findUnique({
      where: { EmailAddress },
    });

    if (existingUser) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "User already exists with this Email Address.",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await prisma.user.create({
      data: {
        FirstName,
        LastName,
        EmailAddress,
        password: hashedPassword,
        phoneNumber,
        role: finalRole,
      },
    });

    const token = jwt.sign({ userId: newUser.id }, config.jwtSecret, { expiresIn: "1d" });

    return res.status(StatusCodes.CREATED).json({
      success: true,
      message: "User registered successfully!",
      data: {
        token,
        user: {
          id: newUser.id,
          FirstName: newUser.FirstName,
          EmailAddress: newUser.EmailAddress,
          role: newUser.role
        }
      }
    });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Server error during registration"
    });
  }
};

export const login = async (req, res) => {
  try {
    const { EmailAddress, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { EmailAddress },
    });

    if (!user) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        message: "Invalid Email Address or Password",
      });
    }

    if (user.status !== "ACTIVE") {
      return res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        message: "Account is suspended or deactivated. Contact support.",
      });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);

    if (!isPasswordCorrect) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        message: "Invalid Email Address or Password",
      });
    }

    const token = jwt.sign({ userId: user.id }, config.jwtSecret, { expiresIn: "1d" });

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Login Successful!",
      data: {
        token,
        user: {
          id: user.id,
          FirstName: user.FirstName,
          EmailAddress: user.EmailAddress,
          role: user.role,
        }
      }
    });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Server error during login"
    });
  }
};

export const logout = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
       return res.status(StatusCodes.BAD_REQUEST).json({
         success: false,
         message: "No token provided"
       });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.decode(token);

    await prisma.blacklistedToken.create({
      data: {
        token: token,
        expiresAt: new Date(decoded.exp * 1000),
      },
    });

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Logged out successfully"
    });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Logout failed due to a system error",
    });
  }
};