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
    const { FirstName, LastName, PhoneNumber, Role, bloodType } = req.body;

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


export const uploadIdentityDocument = async (req, res) => {
  try {
    const userId = req.user.id;

    // Check if file exists (multer puts the uploaded file details in req.file)
    if (!req.file || !req.file.path) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Please upload a valid image or PDF of your National ID/Passport.",
      });
    }

    // Check current identity verification status
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user.identityStatus === "Verified") {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Your identity is already verified.",
      });
    }

    // Update status to 'Pending' and save the Cloudinary URL
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        identityDocumentUrl: req.file.path,
        identityStatus: "Pending",
        identityRejectionReason: null, // Reset previous rejections if any
      },
      select: {
        id: true,
        identityStatus: true,
        identityDocumentUrl: true,
      }
    });

    // Notify user
    await prisma.notification.create({
      data: {
        userId,
        message: "Your Identity Document has been uploaded and is pending review by the Red Cross.",
      },
    });

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Identity document uploaded. Your verification status is now Pending.",
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