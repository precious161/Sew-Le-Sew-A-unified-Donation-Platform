import { StatusCodes } from "http-status-codes";
import prisma from "../../config/db.js";
import * as AuditService from "../../services/security/auditService.js";

export const monitorActivity = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const [users, totalCount] = await Promise.all([
      prisma.user.findMany({
        skip,
        take: limit,
        select: { id: true, FirstName: true, LastName: true, EmailAddress: true, Role: true, status: true, identityStatus: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.user.count(),
    ]);

    return res.status(StatusCodes.OK).json({ success: true, count: users.length, totalCount, totalPages: Math.ceil(totalCount / limit), currentPage: page, data: users });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: "Error monitoring users" });
  }
};

export const deactivateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ["Active", "Deactivated"];
    if (!validStatuses.includes(status)) return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: "Invalid status value" });

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { status },
      select: { id: true, FirstName: true, LastName: true, status: true },
    });

    // --- AUDIT LOG ---
    await AuditService.createLogEntry(req.user.id, `Changed User Status to ${status}`, "User", `User ID: ${id}`);

    return res.status(StatusCodes.OK).json({ success: true, message: `User status updated to ${status}`, data: updatedUser });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: "Action failed" });
  }
};

export const assignRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { Role } = req.body;

    const validRoles = ["Red_Cross_Admin", "Donor", "Recipient"];
    if (!validRoles.includes(Role)) return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: "Invalid role value" });

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { Role },
      select: { id: true, Role: true },
    });

    // --- AUDIT LOG ---
    await AuditService.createLogEntry(req.user.id, `Changed User Role to ${Role}`, "User", `User ID: ${id}`);

    return res.status(StatusCodes.OK).json({ success: true, message: `User role updated to ${Role}`, data: updatedUser });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: "Role assignment failed" });
  }
};

export const getPendingIdentities = async (req, res) => {
  try {
    const pendingUsers = await prisma.user.findMany({
      where: { identityStatus: "Pending" },
      select: { id: true, FirstName: true, LastName: true, EmailAddress: true, Role: true, identityDocumentUrl: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    });
    return res.status(StatusCodes.OK).json({ success: true, count: pendingUsers.length, data: pendingUsers });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: "Error fetching pending identities." });
  }
};

export const reviewIdentity = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { id: userIdToVerify } = req.params;
    const { approved, rejectionReason } = req.body;

    if (typeof approved !== "boolean") return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: "Field 'approved' must be a boolean." });
    if (!approved && !rejectionReason) return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: "Rejection reason is required." });

    const newStatus = approved ? "Verified" : "Rejected";

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userIdToVerify },
        data: { identityStatus: newStatus, identityVerifiedBy: adminId, identityVerifiedAt: new Date(), identityRejectionReason: approved ? null : rejectionReason },
      });
      await tx.notification.create({
        data: { userId: userIdToVerify, message: approved ? "Your identity verification has been approved!" : `Your identity verification was rejected. Reason: ${rejectionReason}.` },
      });
    });

    // --- AUDIT LOG ---
    await AuditService.createLogEntry(adminId, approved ? "Approved User Identity" : "Rejected User Identity", "User", approved ? "Verified National ID" : rejectionReason);

    return res.status(StatusCodes.OK).json({ success: true, message: `User identity status updated to ${newStatus}.` });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: "Verification review failed." });
  }
};