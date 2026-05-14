// profileController.js
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
    console.error("viewProfile Error:", error);
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

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Profile updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    console.error("updateProfile Error:", error);
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

    if (user.identityStatus === "Verified") {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Your identity is already verified.",
      });
    }

    if (user.identityStatus === "Pending") {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Your identity document is already under review. Please wait for admin verification.",
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        identityDocumentUrl: req.file.path,
        identityStatus: "Pending",
        identityRejectionReason: null,
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
        message: "Your Identity Document has been uploaded and is pending review by the Red Cross. You will be notified once verified.",
      },
    });

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Identity document uploaded successfully. Your verification is now pending.",
      data: updatedUser,
    });
  } catch (error) {
    console.error("uploadIdentityDocument Error:", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "An error occurred while uploading your document.",
    });
  }
};