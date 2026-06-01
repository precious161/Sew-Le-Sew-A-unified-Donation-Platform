import { StatusCodes } from "http-status-codes";
import prisma from "../../config/db.js";
import * as AuditService from "../../services/security/auditService.js";
import logger from "../../utils/logger.js";

export const monitorActivity = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const [users, totalCount] = await Promise.all([
      prisma.user.findMany({
        skip,
        take: limit,
        select: { id: true, FirstName: true, LastName: true, EmailAddress: true, Role: true, status: true, identityStatus: true, createdAt: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.user.count(),
    ]);

    return res.status(StatusCodes.OK).json({
      success: true,
      count: users.length,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
      data: users
    });
  } catch (error) {
    logger.error("monitorActivity Error:", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Error monitoring users"
    });
  }
};

export const deactivateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ["Active", "Deactivated"];
    if (!validStatuses.includes(status)) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Invalid status value"
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { status },
      select: { id: true, FirstName: true, LastName: true, status: true, EmailAddress: true },
    });

    await AuditService.createLogEntry(req.user.id, `Changed User Status to ${status}`, "User", `User ID: ${id}`);

    logger.info(`User status updated`, {
      adminId: req.user.id,
      userId: id,
      newStatus: status,
      userEmail: updatedUser.EmailAddress
    });

    return res.status(StatusCodes.OK).json({
      success: true,
      message: `User status updated to ${status}`,
      data: updatedUser
    });
  } catch (error) {
    logger.error("deactivateUser Error:", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Action failed"
    });
  }
};

export const assignRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { Role } = req.body;

    const validRoles = ["Red_Cross_Admin", "Donor", "Recipient"];
    if (!validRoles.includes(Role)) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Invalid role value"
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { Role },
      select: { id: true, Role: true, EmailAddress: true },
    });

    await AuditService.createLogEntry(req.user.id, `Changed User Role to ${Role}`, "User", `User ID: ${id}`);

    logger.info(`User role updated`, {
      adminId: req.user.id,
      userId: id,
      newRole: Role,
      userEmail: updatedUser.EmailAddress
    });

    return res.status(StatusCodes.OK).json({
      success: true,
      message: `User role updated to ${Role}`,
      data: updatedUser
    });
  } catch (error) {
    logger.error("assignRole Error:", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Role assignment failed"
    });
  }
};

export const getPendingIdentities = async (req, res) => {
  try {
    const pendingUsers = await prisma.user.findMany({
      where: { identityStatus: "Pending" },
      select: { id: true, FirstName: true, LastName: true, EmailAddress: true, Role: true, identityDocumentUrl: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    });

    logger.info(`Pending identities fetched`, { count: pendingUsers.length });

    return res.status(StatusCodes.OK).json({
      success: true,
      count: pendingUsers.length,
      data: pendingUsers
    });
  } catch (error) {
    logger.error("getPendingIdentities Error:", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Error fetching pending identities."
    });
  }
};

export const reviewIdentity = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { id: userIdToVerify } = req.params;
    const { approved, rejectionReason } = req.body;

    if (typeof approved !== "boolean") {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Field 'approved' must be a boolean."
      });
    }
    if (!approved && !rejectionReason) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Rejection reason is required."
      });
    }

    const newStatus = approved ? "Verified" : "Rejected";

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userIdToVerify },
        data: {
          identityStatus: newStatus,
          identityVerifiedBy: adminId,
          identityVerifiedAt: new Date(),
          identityRejectionReason: approved ? null : rejectionReason
        },
      });
      await tx.notification.create({
        data: {
          userId: userIdToVerify,
          message: approved
            ? "Your identity verification has been approved!"
            : `Your identity verification was rejected. Reason: ${rejectionReason}.`
        },
      });
    });

    await AuditService.createLogEntry(
      adminId,
      approved ? "Approved User Identity" : "Rejected User Identity",
      "User",
      approved ? "Verified National ID" : rejectionReason
    );

    logger.info(`Identity ${approved ? 'approved' : 'rejected'}`, {
      adminId,
      userId: userIdToVerify,
      newStatus
    });

    return res.status(StatusCodes.OK).json({
      success: true,
      message: `User identity status updated to ${newStatus}.`
    });
  } catch (error) {
    logger.error("reviewIdentity Error:", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Verification review failed."
    });
  }
};

// ============================================
// SAFE ROLE CHANGE (ADMIN ONLY)
// ============================================
export const safeRoleChange = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { userId } = req.params;
    const { newRole, reason } = req.body;

    const validRoles = ["Donor", "Recipient"];
    if (!validRoles.includes(newRole)) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Invalid role. Allowed roles: Donor, Recipient",
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

    if (user.Role === newRole) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: `User is already a ${newRole}`,
      });
    }

    if (user.Role === "Red_Cross_Admin" || newRole === "Red_Cross_Admin") {
      return res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        message: "Admin role changes must be done through system administration.",
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

    if (user.Role === "Donor" && newRole === "Recipient") {
      const activeIntents = user.donationIntents.filter(
        i => ["Active", "PendingVerification", "Matched"].includes(i.status)
      );

      if (activeIntents.length > 0) {
        warnings.push(`Found ${activeIntents.length} active donation intent(s) that will be cancelled`);
        changes.push(`Cancelled ${activeIntents.length} active donor intents`);
      }
    }

    if (user.Role === "Recipient" && newRole === "Donor") {
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
      if (user.Role === "Donor" && newRole === "Recipient") {
        await tx.donationIntent.updateMany({
          where: {
            userId: userId,
            status: { in: ["Active", "PendingVerification", "Matched"] }
          },
          data: {
            status: "Cancelled",
            rejectionReason: `Role changed to Recipient by admin. Reason: ${reason || "Admin action"}`,
          },
        });
      }

      if (user.Role === "Recipient" && newRole === "Donor") {
        await tx.donationRequest.updateMany({
          where: {
            recipientId: userId,
            status: { in: ["PendingVerification", "Pending", "Matching"] }
          },
          data: {
            status: "Cancelled",
            rejectionReason: `Role changed to Donor by admin. Reason: ${reason || "Admin action"}`,
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
            remarks: `Role changed by admin. Reason: ${reason || "Admin action"}`,
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
          message: `🔔 Your account role has been changed from ${user.Role} to ${newRole}. ${warnings.length > 0 ? "Your active donations/requests have been cancelled." : ""} Reason: ${reason || "Admin action"}. Please log out and log back in to see changes.`,
        },
      });
    });

    await AuditService.createLogEntry(
      adminId,
      `Changed user role from ${user.Role} to ${newRole}`,
      "User",
      `User ID: ${userId}. Changes: ${changes.join(", ")}. Warnings: ${warnings.join(", ")}. Reason: ${reason || "Not specified"}`
    );

    logger.info(`Admin changed user role`, {
      adminId,
      userId,
      fromRole: user.Role,
      toRole: newRole,
      userEmail: user.EmailAddress
    });

    return res.status(StatusCodes.OK).json({
      success: true,
      message: `User role changed from ${user.Role} to ${newRole}`,
      data: {
        warnings: warnings,
        changes: changes,
      },
    });
  } catch (error) {
    logger.error("Safe Role Change Error:", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Failed to change user role",
      error: error.message,
    });
  }
};