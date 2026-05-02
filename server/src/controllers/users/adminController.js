import { StatusCodes } from "http-status-codes";
import prisma from "../../config/db.js";

export const monitorActivity = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const [users, totalCount] = await Promise.all([
      prisma.user.findMany({
        skip,
        take: limit,
        select: {
          id: true,
          FirstName: true,
          LastName: true,
          EmailAddress: true,
          Role: true,
          status: true,
        },
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
      data: users,
    });
  } catch (error) {
    console.error("monitorActivity Error:", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Error monitoring users",
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
        message: "Invalid status value",
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { status },
      select: { id: true, FirstName: true, LastName: true, status: true },
    });

    return res.status(StatusCodes.OK).json({
      success: true,
      message: `User status updated to ${status}`,
      data: updatedUser,
    });
  } catch (error) {
    console.error("deactivateUser Error:", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Action failed",
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
        message: "Invalid role value",
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { Role },
      select: { id: true, Role: true },
    });

    return res.status(StatusCodes.OK).json({
      success: true,
      message: `User role updated to ${Role}`,
      data: updatedUser,
    });
  } catch (error) {
    console.error("assignRole Error:", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Role assignment failed",
    });
  }
};