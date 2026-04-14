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
    return res.status(StatusCodes.OK).json(users);
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "Error monitoring users" });
  }
};

export const deactivateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;


    const validStatuses = ["ACTIVE", "SUSPENDED", "DEACTIVATED"];
    if (!validStatuses.includes(status)) {
      return res.status(StatusCodes.BAD_REQUEST).json({ message: "Invalid status value" });
    }

    await prisma.user.update({ where: { id }, data: { status } });
    return res.status(StatusCodes.OK).json({ message: `User status updated to ${status}` });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "Action failed" });
  }
};

export const assignRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;


    const validRoles = ["RED_CROSS_ADMIN", "DONOR", "RECIPIENT"];
    if (!validRoles.includes(role)) {
      return res.status(StatusCodes.BAD_REQUEST).json({ message: "Invalid role value" });
    }

    await prisma.user.update({ where: { id }, data: { role } });
    return res.status(StatusCodes.OK).json({ message: `User role updated to ${role}` });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "Role assignment failed" });
  }
};