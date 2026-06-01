import * as financialService from "../../services/matching/financialService.js";
import * as auditService from "../../services/security/auditService.js";
import logger from "../../utils/logger.js";

export const checkEligibility = async (req, res) => {
  try {
    const result = await financialService.checkEligibility(req.user.id);
    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    logger.error("checkEligibility Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const submitContribution = async (req, res) => {
  try {
    const donorId = req.user.id;
    const data = {
      ...req.body,
      documentUrl: req.file?.path || null,
    };

    const contribution = await financialService.submitContribution(donorId, data);

    return res.status(201).json({
      success: true,
      message: "💰 Contribution pledge submitted successfully. The Red Cross will verify your payment shortly.",
      data: contribution,
    });
  } catch (error) {
    logger.error("submitContribution Error:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to submit contribution.",
    });
  }
};

export const cancelContribution = async (req, res) => {
  try {
    const donorId = req.user.id;
    const { id } = req.params;

    const contribution = await financialService.cancelContribution(donorId, id);

    return res.status(200).json({
      success: true,
      message: "Contribution cancelled successfully.",
      data: contribution,
    });
  } catch (error) {
    logger.error("cancelContribution Error:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to cancel contribution.",
    });
  }
};

export const getMyContributions = async (req, res) => {
  try {
    const donorId = req.user.id;
    const contributions = await financialService.getMyContributions(donorId);

    return res.status(200).json({
      success: true,
      count: contributions.length,
      data: contributions,
    });
  } catch (error) {
    logger.error("getMyContributions Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch contributions.",
    });
  }
};

export const getAllContributions = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const result = await financialService.getAllContributions(page, limit);

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    logger.error("getAllContributions Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch contributions.",
    });
  }
};

export const getPendingContributions = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const result = await financialService.getPendingContributions(page, limit);

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    logger.error("getPendingContributions Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch pending contributions.",
    });
  }
};

export const getVerifiedContributions = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const result = await financialService.getVerifiedContributions(page, limit);

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    logger.error("getVerifiedContributions Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch verified contributions.",
    });
  }
};

export const reviewContribution = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { id } = req.params;
    const { approved, rejectionReason } = req.body;

    if (typeof approved !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "Field 'approved' must be a boolean."
      });
    }

    if (!approved && !rejectionReason) {
      return res.status(400).json({
        success: false,
        message: "Rejection reason is required when rejecting a contribution."
      });
    }

    await financialService.reviewContribution(adminId, id, { approved, rejectionReason });

    await auditService.createLogEntry(
      adminId,
      approved ? "Verified Financial Contribution" : "Rejected Financial Contribution",
      "FinancialContribution",
      approved ? "Verified Receipt" : rejectionReason
    );

    return res.status(200).json({
      success: true,
      message: approved ? "✅ Contribution verified successfully." : "❌ Contribution rejected."
    });
  } catch (error) {
    logger.error("reviewContribution Error:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to review contribution.",
    });
  }
};

export const allocateContribution = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { id } = req.params;
    const { allocationNote } = req.body;

    if (!allocationNote) {
      return res.status(400).json({
        success: false,
        message: "Allocation note is required."
      });
    }

    const contribution = await financialService.allocateContribution(adminId, id, allocationNote);

    await auditService.createLogEntry(
      adminId,
      "Allocated Financial Contribution",
      "FinancialContribution",
      `Note: ${allocationNote}`
    );

    return res.status(200).json({
      success: true,
      message: "Contribution allocated successfully.",
      data: contribution,
    });
  } catch (error) {
    logger.error("allocateContribution Error:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to allocate contribution.",
    });
  }
};

export const distributeToRecipient = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { contributionId, requestId } = req.params;
    const { amount, note } = req.body;

    if (!amount || !note) {
      return res.status(400).json({
        success: false,
        message: "Amount and note are required."
      });
    }

    await financialService.distributeToRecipient(adminId, contributionId, requestId, parseFloat(amount), note);

    await auditService.createLogEntry(
      adminId,
      "Distributed Financial Contribution",
      "DonationRequest",
      `Amount: ${amount}, Note: ${note}`
    );

    return res.status(200).json({
      success: true,
      message: "✅ Funds distributed to recipient successfully."
    });
  } catch (error) {
    logger.error("distributeToRecipient Error:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to distribute funds.",
    });
  }
};