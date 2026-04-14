import { StatusCodes } from "http-status-codes";
import prisma from "../../config/db.js";

export const viewProfile = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        FirstName: true,
        LastName: true,
        EmailAddress: true,
        phoneNumber: true,
        role: true,
        status: true,
      },
    });
    return res.status(StatusCodes.OK).json(user);
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "Error fetching profile" });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { FirstName, LastName, phoneNumber, role } = req.body;



    let updatedRole = req.user.role;

    if (role) {
      const selfAssignRoles = ["DONOR", "RECIPIENT"];
      if (selfAssignRoles.includes(role)) {
        updatedRole = role;
      } else if (role === "RED_CROSS_ADMIN") {
        return res.status(StatusCodes.FORBIDDEN).json({
          message: "You cannot promote yourself to Admin. Contact an administrator."
        });
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        FirstName,
        LastName,
        phoneNumber,
        role: updatedRole
      },
      select: {
        id: true,
        FirstName: true,
        LastName: true,
        EmailAddress: true,
        phoneNumber: true,
        role: true
      }
    });

    return res.status(StatusCodes.OK).json({
      message: "Profile updated successfully",
      user: updatedUser
    });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: "Update failed"
    });
  }
};
