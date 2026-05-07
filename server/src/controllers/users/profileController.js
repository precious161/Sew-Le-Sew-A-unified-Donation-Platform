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
        PhoneNumber: true,
        Role: true,
        status: true,
        bloodType:true,
      },
    });

    return res.status(StatusCodes.OK).json({
      success: true,
      data: user
    });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Error fetching profile"
    });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { FirstName, LastName, PhoneNumber, Role } = req.body;

    let updatedRole = req.user.Role;

    if (Role) {
      const selfAssignRoles = ["Donor", "Recipient"];
      if (selfAssignRoles.includes(Role)) {
        updatedRole = Role;
      } else if (Role === "Red_Cross_Admin") {
        return res.status(StatusCodes.FORBIDDEN).json({
          success: false,
          message: "You cannot promote yourself to Admin. Contact an administrator."
        });
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        FirstName,
        LastName,
        PhoneNumber,
        Role: updatedRole,
        bloodType,
      },
      select: {
        id: true,
        FirstName: true,
        LastName: true,
        EmailAddress: true,
        PhoneNumber: true,
        Role: true,
        bloodType:true
      }
    });

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Profile updated successfully",
      data: updatedUser
    });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Update failed"
    });
  }
};