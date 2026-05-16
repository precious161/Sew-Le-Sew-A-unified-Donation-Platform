import * as FinancialService from "../../services/matching/financialService.js";
import * as AuditService from "../../services/security/auditService.js";

// ─────────────────────────────────────────
// Donor: Submit a contribution pledge
// ─────────────────────────────────────────
export const submitContribution = async (req, res) => {
  try {
    const donorId = req.user.id;

    const data = {
      ...req.body,
      documentUrl: req.file?.path || null,
    };

    const contribution = await FinancialService.submitContribution(
      donorId,
      data
    );

    return res.status(201).json({
      success: true,
      message:
        "Contribution pledge submitted successfully. The Red Cross will verify your payment shortly.",
      data: contribution,
    });
  } catch (error) {
    console.error("submitContribution Error:", error);
    const status = error.statusCode || 500;
    return res.status(status).json({
      success: false,
      message: error.message || "Failed to submit contribution.",
    });
  }
};

// ─────────────────────────────────────────
// Donor: Cancel a pending contribution
// ─────────────────────────────────────────
export const cancelContribution = async (req, res) => {
  try {
    const donorId = req.user.id;
    const { id } = req.params;

    const contribution = await FinancialService.cancelContribution(
      donorId,
      id
    );

    return res.status(200).json({
      success: true,
      message: "Contribution cancelled successfully.",
      data: contribution,
    });
  } catch (error) {
    console.error("cancelContribution Error:", error);
    const status = error.statusCode || 500;
    return res.status(status).json({
      success: false,
      message: error.message || "Failed to cancel contribution.",
    });
  }
};

// ─────────────────────────────────────────
// Donor: View own contributions
// ─────────────────────────────────────────
export const getMyContributions = async (req, res) => {
  try {
    const donorId = req.user.id;
    const contributions = await FinancialService.getMyContributions(donorId);

    return res.status(200).json({
      success: true,
      count: contributions.length,
      data: contributions,
    });
  } catch (error) {
    console.error("getMyContributions Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch contributions.",
    });
  }
};

// ─────────────────────────────────────────
// Admin: Get all contributions
// ─────────────────────────────────────────
export const getAllContributions = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const result = await FinancialService.getAllContributions(page, limit);

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("getAllContributions Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch contributions.",
    });
  }
};

// ─────────────────────────────────────────
// Admin: Get pending contributions
// ─────────────────────────────────────────
export const getPendingContributions = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const result = await FinancialService.getPendingContributions(page, limit);

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("getPendingContributions Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch pending contributions.",
    });
  }
};

// ─────────────────────────────────────────
// Admin: Review a contribution (approve or reject)
// ─────────────────────────────────────────
export const reviewContribution = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { id } = req.params;
    const { approved, rejectionReason } = req.body;

    if (typeof approved !== "boolean") return res.status(400).json({ success: false, message: "Field 'approved' must be a boolean." });
    if (!approved && !rejectionReason) return res.status(400).json({ success: false, message: "Rejection reason is required." });

    await FinancialService.reviewContribution(adminId, id, { approved, rejectionReason });

    // --- AUDIT LOG ---
    await AuditService.createLogEntry(adminId, approved ? "Verified Financial Contribution" : "Rejected Financial Contribution", "FinancialContribution", approved ? "Verified Receipt" : rejectionReason);

    return res.status(200).json({ success: true, message: approved ? "Contribution verified successfully." : "Contribution rejected." });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────
// Admin: Allocate a verified contribution
// ─────────────────────────────────────────
export const allocateContribution = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { id } = req.params;
    const { allocationNote } = req.body;

    if (!allocationNote) return res.status(400).json({ success: false, message: "Allocation note is required." });

    const contribution = await FinancialService.allocateContribution(adminId, id, allocationNote);

    // --- AUDIT LOG ---
    await AuditService.createLogEntry(adminId, "Allocated Financial Contribution", "FinancialContribution", `Note: ${allocationNote}`);

    return res.status(200).json({ success: true, message: "Contribution allocated successfully.", data: contribution });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};
// ─────────────────────────────────────────
// Admin: Distribute funds to recipient
// ─────────────────────────────────────────
export const distributeToRecipient = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { contributionId, requestId } = req.params;
    const { amount, note } = req.body;

    if (!amount || !note) return res.status(400).json({ success: false, message: "Amount and note are required." });

    await FinancialService.distributeToRecipient(adminId, contributionId, requestId, amount, note);

    // --- AUDIT LOG ---
    await AuditService.createLogEntry(adminId, "Distributed Financial Contribution", "DonationRequest", `Amount: ${amount}, Note: ${note}`);

    return res.status(200).json({ success: true, message: "Funds distributed to recipient successfully." });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};