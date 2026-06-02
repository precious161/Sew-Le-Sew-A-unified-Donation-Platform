import { StatusCodes } from "http-status-codes";
import bcrypt from "bcryptjs";
import prisma from "../../config/db.js";
import * as AuditService from "../../services/security/auditService.js";
import logger from "../../utils/logger.js";

export const viewProfile = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        FirstName: true,
        LastName: true,
        EmailAddress: true,
        PhoneNumber: true,
        Role: true,
        status: true,
        bloodType: true,
        identityStatus: true,
        identityDocumentUrl: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "User not found.",
      });
    }

    return res.status(StatusCodes.OK).json({
      success: true,
      data: user,
    });
  } catch (error) {
    logger.error("viewProfile Error:", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Error fetching profile",
    });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { FirstName, LastName, PhoneNumber, bloodType } = req.body;

    // ✅ VALIDATION: Check if any fields were actually sent
    if (FirstName === undefined && LastName === undefined && PhoneNumber === undefined && bloodType === undefined) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "No valid fields to update. Please provide FirstName, LastName, PhoneNumber, or bloodType."
      });
    }

    // ✅ VALIDATION: FirstName - if provided, must be valid
    if (FirstName !== undefined) {
      if (typeof FirstName !== 'string' || FirstName.trim().length === 0) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: "First name cannot be empty"
        });
      }
      if (FirstName.trim().length < 2) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: "First name must be at least 2 characters"
        });
      }
      if (FirstName.trim().length > 50) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: "First name cannot exceed 50 characters"
        });
      }
    }

    // ✅ VALIDATION: LastName - if provided, must be valid
    if (LastName !== undefined) {
      if (typeof LastName !== 'string' || LastName.trim().length === 0) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: "Last name cannot be empty"
        });
      }
      if (LastName.trim().length < 2) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: "Last name must be at least 2 characters"
        });
      }
      if (LastName.trim().length > 50) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: "Last name cannot exceed 50 characters"
        });
      }
    }

    // ✅ VALIDATION: PhoneNumber - if provided, must be valid
    if (PhoneNumber !== undefined) {
      const phoneRegex = /^[0-9+\-\s()]+$/;
      if (!phoneRegex.test(PhoneNumber)) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: "Phone number contains invalid characters. Use only numbers, +, -, spaces, or parentheses."
        });
      }
      const digitsOnly = PhoneNumber.replace(/\D/g, '');
      if (digitsOnly.length < 10) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: "Phone number must have at least 10 digits"
        });
      }
      if (digitsOnly.length > 15) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: "Phone number cannot exceed 15 digits"
        });
      }
    }

    // ✅ VALIDATION: bloodType - if provided, must be valid
    if (bloodType !== undefined) {
      const validBloodTypes = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
      if (!validBloodTypes.includes(bloodType)) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: "Invalid blood type. Valid types: A+, A-, B+, B-, AB+, AB-, O+, O-"
        });
      }
    }

    // Prepare update data (trim strings)
    const updateData = {};
    if (FirstName !== undefined) updateData.FirstName = FirstName.trim();
    if (LastName !== undefined) updateData.LastName = LastName.trim();
    if (PhoneNumber !== undefined) updateData.PhoneNumber = PhoneNumber;
    if (bloodType !== undefined) updateData.bloodType = bloodType;

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: updateData,
      select: {
        id: true,
        FirstName: true,
        LastName: true,
        EmailAddress: true,
        PhoneNumber: true,
        Role: true,
        bloodType: true,
        identityStatus: true,
      },
    });

    logger.info(`Profile updated`, { userId: req.user.id, fields: Object.keys(updateData) });

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Profile updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    logger.error("updateProfile Error:", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Update failed",
    });
  }
};

export const changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword, confirmNewPassword } = req.body;

    // ✅ VALIDATION: Check if all fields are provided
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "All password fields are required"
      });
    }

    // ✅ VALIDATION: Check if new passwords match
    if (newPassword !== confirmNewPassword) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "New passwords do not match"
      });
    }

    // ✅ VALIDATION: Password strength
    if (newPassword.length < 8) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Password must be at least 8 characters"
      });
    }

    if (!/[A-Z]/.test(newPassword)) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Password must contain at least one uppercase letter"
      });
    }

    if (!/[0-9]/.test(newPassword)) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Password must contain at least one number"
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "User not found"
      });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.Password);
    if (!isMatch) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        message: "Current password is incorrect"
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({
      where: { id: userId },
      data: { Password: hashedPassword }
    });

    await prisma.notification.create({
      data: {
        userId: userId,
        message: "Your password has been changed successfully. If you did not make this change, please contact support immediately."
      }
    });

    logger.info(`User ${userId} changed password`);

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Password changed successfully"
    });
  } catch (error) {
    logger.error("changePassword Error:", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Failed to change password"
    });
  }
};

export const uploadIdentityDocument = async (req, res) => {
  try {
    const userId = req.user.id;

    if (!req.file || !req.file.path) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Please upload a valid image or PDF of your National ID or Passport.",
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "User not found.",
      });
    }

    if (user.identityStatus === "Pending") {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Your identity document is currently under review. Please wait for admin verification before re-uploading.",
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        identityDocumentUrl: req.file.path,
        identityStatus: "Pending",
        identityRejectionReason: null,
        identityVerifiedAt: null,
        identityVerifiedBy: null,
      },
      select: {
        id: true,
        identityStatus: true,
        identityDocumentUrl: true,
      },
    });

    await prisma.notification.create({
      data: {
        userId,
        message: user.identityStatus === "Verified"
          ? "Your updated Identity Document has been uploaded and is pending re-verification by the Red Cross."
          : user.identityStatus === "Rejected"
          ? "Your new Identity Document has been uploaded for re-review. You will be notified once verified."
          : "Your Identity Document has been uploaded and is pending review by the Red Cross.",
      },
    });

    logger.info(`Identity document uploaded`, { userId, status: "Pending" });

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Identity document uploaded successfully. Your verification is now pending.",
      data: updatedUser,
    });
  } catch (error) {
    logger.error("uploadIdentityDocument Error:", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "An error occurred while uploading your document.",
    });
  }
};

// ============================================
// USER SELF ROLE CHANGE (WITH SAFETY CHECKS)
// ============================================
export const selfRoleChange = async (req, res) => {
  try {
    const userId = req.user.id;
    const currentRole = req.user.Role;
    const { newRole, reason } = req.body;

    // ✅ VALIDATION: Check if newRole is provided
    if (!newRole) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Please provide a new role (Donor or Recipient)",
      });
    }

    logger.info(`🔄 Self role change requested`, { userId, from: currentRole, to: newRole });

    const validRoles = ["Donor", "Recipient"];
    if (!validRoles.includes(newRole)) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Invalid role. Allowed roles: Donor, Recipient",
      });
    }

    if (currentRole === newRole) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: `You are already a ${newRole}`,
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        donationIntents: true,
        requests: true,
      },
    });

    if (!user) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "User not found",
      });
    }

    const activeMatchesAsDonor = await prisma.match.findMany({
      where: {
        intent: { userId: userId },
        status: { in: ["Pending", "Notified", "Accepted"] }
      },
    });

    const activeMatchesAsRecipient = await prisma.match.findMany({
      where: {
        request: { recipientId: userId },
        status: { in: ["Pending", "Notified", "Accepted"] }
      },
    });

    const activeMatches = [...activeMatchesAsDonor, ...activeMatchesAsRecipient];
    const changes = [];
    const warnings = [];

    if (currentRole === "Donor" && newRole === "Recipient") {
      const activeIntents = user.donationIntents.filter(
        i => ["Active", "PendingVerification", "Matched"].includes(i.status)
      );

      if (activeIntents.length > 0) {
        warnings.push(`Found ${activeIntents.length} active donation intent(s) that will be cancelled`);
        changes.push(`Cancelled ${activeIntents.length} active donor intents`);
      }
    }

    if (currentRole === "Recipient" && newRole === "Donor") {
      const activeRequests = user.requests.filter(
        r => ["PendingVerification", "Pending", "Matching"].includes(r.status)
      );

      if (activeRequests.length > 0) {
        warnings.push(`Found ${activeRequests.length} active donation request(s) that will be cancelled`);
        changes.push(`Cancelled ${activeRequests.length} active recipient requests`);
      }
    }

    if (activeMatches.length > 0) {
      warnings.push(`Found ${activeMatches.length} active match(es) that will be cancelled`);
      changes.push(`Cancelled ${activeMatches.length} active matches`);
    }

    await prisma.$transaction(async (tx) => {
      if (currentRole === "Donor" && newRole === "Recipient") {
        await tx.donationIntent.updateMany({
          where: {
            userId: userId,
            status: { in: ["Active", "PendingVerification", "Matched"] }
          },
          data: {
            status: "Cancelled",
            rejectionReason: `User changed role to Recipient. Reason: ${reason || "User requested"}`,
          },
        });
      }

      if (currentRole === "Recipient" && newRole === "Donor") {
        await tx.donationRequest.updateMany({
          where: {
            recipientId: userId,
            status: { in: ["PendingVerification", "Pending", "Matching"] }
          },
          data: {
            status: "Cancelled",
            rejectionReason: `User changed role to Donor. Reason: ${reason || "User requested"}`,
          },
        });
      }

      if (activeMatches.length > 0) {
        await tx.match.updateMany({
          where: {
            OR: [
              { intent: { userId: userId } },
              { request: { recipientId: userId } }
            ],
            status: { in: ["Pending", "Notified", "Accepted"] }
          },
          data: {
            status: "Cancelled",
            remarks: `User changed role. Reason: ${reason || "User requested"}`,
          },
        });
      }

      await tx.userEligibilityStatus.deleteMany({
        where: { userId: userId },
      });

      await tx.user.update({
        where: { id: userId },
        data: { Role: newRole },
      });

      await tx.notification.create({
        data: {
          userId: userId,
          message: `🔔 Your account role has been changed from ${currentRole} to ${newRole}. ${warnings.length > 0 ? "Your active donations/requests have been cancelled." : ""} Reason: ${reason || "You requested this change"}. Please log out and log back in to see changes.`,
        },
      });
    });

    await AuditService.createLogEntry(
      userId,
      `User self-changed role from ${currentRole} to ${newRole}`,
      "User",
      `User ID: ${userId}. Changes: ${changes.join(", ")}. Warnings: ${warnings.join(", ")}. Reason: ${reason || "User requested"}`
    );

    logger.info(`✅ Role changed successfully`, { userId, from: currentRole, to: newRole });

    return res.status(StatusCodes.OK).json({
      success: true,
      message: `Your role has been changed from ${currentRole} to ${newRole}`,
      data: {
        warnings: warnings,
        changes: changes,
      },
    });
  } catch (error) {
    logger.error("Self Role Change Error:", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Failed to change role: " + error.message,
    });
  }
};