import { StatusCodes } from "http-status-codes";
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
    const { FirstName, LastName, PhoneNumber, Role, bloodType } = req.body;

    let updatedRole = req.user.Role;

    if (Role) {
      const selfAssignRoles = ["Donor", "Recipient"];
      if (selfAssignRoles.includes(Role)) {
        updatedRole = Role;
      } else if (Role === "Red_Cross_Admin") {
        return res.status(StatusCodes.FORBIDDEN).json({
          success: false,
          message: "You cannot promote yourself to Admin. Contact an administrator.",
        });
      }
    }

    const updateData = {};
    if (FirstName !== undefined) updateData.FirstName = FirstName;
    if (LastName !== undefined) updateData.LastName = LastName;
    if (PhoneNumber !== undefined) updateData.PhoneNumber = PhoneNumber;
    if (bloodType !== undefined) updateData.bloodType = bloodType;
    updateData.Role = updatedRole;

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

    logger.info(`Profile updated`, { userId: req.user.id, email: req.user.EmailAddress });

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