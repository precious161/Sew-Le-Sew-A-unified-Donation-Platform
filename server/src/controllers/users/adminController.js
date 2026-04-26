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
        Role: true,
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

    const validStatuses = ["Active", "Deactivated"];
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
      select: { id: true, Role: true }
    });

    return res.status(StatusCodes.OK).json({
      success: true,
      message: `User role updated to ${Role}`,
      data: updatedUser
    });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Role assignment failed"
    });
  }
};