// alertController.js
import { StatusCodes } from "http-status-codes";
import prisma from "../../config/db.js";

export const getMyNotifications = async (req, res) => {
  try {
    const alerts = await prisma.notification.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: "desc" },
    });

    return res.status(StatusCodes.OK).json({
      success: true,
      count: alerts.length,
      data: alerts,
    });
  } catch (error) {
    console.error("getMyNotifications Error:", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Error fetching alerts",
    });
  }
};

export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    // Verify notification belongs to this user before updating
    const notification = await prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "Notification not found.",
      });
    }

    if (notification.userId !== req.user.id) {
      return res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        message: "You are not authorized to update this notification.",
      });
    }

    const updatedNotification = await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Notification marked as read",
      data: updatedNotification,
    });
  } catch (error) {
    console.error("markAsRead Error:", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Update failed",
    });
  }
};

// Mark all notifications as read at once
export const markAllAsRead = async (req, res) => {
  try {
    await prisma.notification.updateMany({
      where: {
        userId: req.user.id,
        isRead: false,
      },
      data: { isRead: true },
    });

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "All notifications marked as read",
    });
  } catch (error) {
    console.error("markAllAsRead Error:", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Failed to mark all notifications as read",
    });
  }
};

export const sendAlert = async (req, res) => {
  try {
    const { userId, message } = req.body;

    if (!userId || !message) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "userId and message are required.",
      });
    }

    const userExists = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!userExists) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: `User with ID ${userId} does not exist.`,
      });
    }

    const alert = await prisma.notification.create({
      data: { userId, message },
    });

    return res.status(StatusCodes.CREATED).json({
      success: true,
      message: "Alert dispatched successfully",
      data: alert,
    });
  } catch (error) {
    console.error("sendAlert Error:", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Failed to dispatch alert",
    });
  }
};