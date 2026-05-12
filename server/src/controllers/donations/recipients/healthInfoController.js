import * as HealthInfoService from "../../../services/donations/recipients/healthInfoService.js";

export const getHealthInfo = async (req, res) => {
  try {
    const userId = req.user.id;
    const healthInfo = await HealthInfoService.getHealthInfoByUserId(userId);

    if (!healthInfo) {
      return res.status(404).json({
        success: false,
        message: "No health information found for this user."
      });
    }

    return res.status(200).json({
      success: true,
      data: healthInfo
    });
  } catch (error) {
    console.error("Get Health Info Error:", error);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
};

export const submitHealthInfo = async (req, res) => {
  try {
    const userId = req.user.id;

    const healthInfo = await HealthInfoService.upsertHealthInfo(userId, req.body);

    return res.status(200).json({
      success: true,
      message: "Health information successfully updated.",
      data: healthInfo
    });
  } catch (error) {
    console.error("Submit Health Info Error:", error);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
};