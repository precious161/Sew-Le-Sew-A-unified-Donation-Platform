import { StatusCodes } from "http-status-codes";
import prisma from "../../config/db.js";


export const monitorActivity = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        FirstName: true,
        LastName: true,
        EmailAddress: true,
        role: true,
        status: true,
      },
    });

    return res.status(StatusCodes.OK).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
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

    const validStatuses = ["ACTIVE", "SUSPENDED", "DEACTIVATED"];
    if (!validStatuses.includes(status)) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Invalid status value"
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { status }
    });

    return res.status(StatusCodes.OK).json({
      success: true,
      message: `User status updated to ${status}`,
      data: updatedUser
    });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Action failed"
    });
  }
};

export const assignRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    const validRoles = ["RED_CROSS_ADMIN", "DONOR", "RECIPIENT"];
    if (!validRoles.includes(role)) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Invalid role value"
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { role },
      select: { id: true, role: true }
    });

    return res.status(StatusCodes.OK).json({
      success: true,
      message: `User role updated to ${role}`,
      data: updatedUser
    });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Role assignment failed"
    });
  }
};