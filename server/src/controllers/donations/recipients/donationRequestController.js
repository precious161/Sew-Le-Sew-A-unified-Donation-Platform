import * as DonationRequestService from "../../../services/donations/recipients/donationRequestService.js";

export const requestDonation = async (req, res) => {
  try {
    const userId = req.user.id;

    const request = await DonationRequestService .createDonationRequest(userId, req.body);

    return res.status(201).json({
      success: true,
      message: "Donation request submitted successfully. We will notify you when a match is found.",
      data: request
    });
  } catch (error) {
    console.error("Request Donation Error:", error);
    // Handle our custom 403 precondition error
    if (error.statusCode === 403) {
      return res.status(403).json({ success: false, message: error.message });
    }
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
};