import { StatusCodes } from "http-status-codes";
import prisma from "../../../config/db.js";

// ── Donor: View their own history ──
export const getMyDonationHistory = async (req, res) => {
  try {
    const history = await prisma.donationHistory.findMany({
      where: { donorId: req.user.id },
      orderBy: { donationDate: "desc" },
    });

    return res.status(StatusCodes.OK).json({
      success: true,
      count: history.length,
      data: history,
    });
  } catch (error) {
    console.error("getMyDonationHistory Error:", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: "Failed to fetch history." });
  }
};

// ── Admin: View all history (for analytics/records) ──
export const getAllDonationHistory = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const [history, totalCount] = await Promise.all([
      prisma.donationHistory.findMany({
        skip, take: limit,
        include: { donor: { select: { FirstName: true, LastName: true, EmailAddress: true } } },
        orderBy: { donationDate: "desc" },
      }),
      prisma.donationHistory.count(),
    ]);

    return res.status(StatusCodes.OK).json({
      success: true,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
      data: history,
    });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: "Failed to fetch history." });
  }
};

// ── Admin: Update remarks or complications ──
export const updateHistoryRemarks = async (req, res) => {
  try {
    const { id } = req.params;
    const { complications, remarks } = req.body;

    const updatedHistory = await prisma.donationHistory.update({
      where: { id },
      data: { complications, remarks },
    });

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "History record updated successfully.",
      data: updatedHistory,
    });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: "Failed to update record." });
  }
};