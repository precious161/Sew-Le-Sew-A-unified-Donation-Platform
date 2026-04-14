import { StatusCodes } from "http-status-codes";
import prisma from "../../config/db.js";



export const getMyNotifications = async (req, res) => {
  try {
    const alerts = await prisma.notification.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: "desc" },
    });
    return res.status(StatusCodes.OK).json(alerts);
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "Error fetching alerts" });
  }
};


export const sendAlert = async (req, res) => {
  try {
    const { userId, message } = req.body;

     const userExists = await prisma.user.findUnique({ where: { id: userId } });
    if (!userExists) {
      return res.status(StatusCodes.NOT_FOUND).json({
        message: `User with ID ${userId} does not exist in the database.`
      });
    }
    const alert = await prisma.notification.create({
      data: { userId, message },
    });

    return res.status(StatusCodes.CREATED).json(alert);
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "Failed to dispatch alert" });
  }
};


export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.notification.update({
      where: { id, userId: req.user.id },
      data: { isRead: true },
    });
    return res.status(StatusCodes.OK).json({ message: "Notification marked as read" });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "Update failed" });
  }
};