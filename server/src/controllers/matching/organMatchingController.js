import * as OrganMatchingService from "../../services/matching/organMatchingService.js";
import * as AuditService from "../../services/security/auditService.js";

export const triggerOrganMatching = async (req, res) => {
  try {
    await OrganMatchingService.runOrganMatching();
    return res.status(200).json({ success: true, message: "Organ matching engine ran successfully." });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to run organ matching." });
  }
};

export const getAllOrganMatches = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const result = await OrganMatchingService.getAllOrganMatches(page, limit);
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to fetch matches." });
  }
};

export const getOrganMatchById = async (req, res) => {
  try {
    const match = await OrganMatchingService.getOrganMatchById(req.params.id);
    return res.status(200).json({ success: true, data: match });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

export const getUnmatchedOrganRequests = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const result = await OrganMatchingService.getUnmatchedOrganRequests(page, limit);
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to fetch unmatched requests." });
  }
};

export const respondToOrganMatch = async (req, res) => {
  try {
    const { accepted } = req.body;
    await OrganMatchingService.handleOrganDonorResponse(req.params.id, req.user.id, accepted);
    return res.status(200).json({ success: true, message: accepted ? "Match accepted!" : "Match declined." });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

export const completeOrganDonation = async (req, res) => {
  try {
    const matchId = req.params.id;
    const adminId = req.user.id;

    await OrganMatchingService.confirmOrganCompletion(matchId, adminId);

    // --- AUDIT LOG ---
    await AuditService.createLogEntry(adminId, "Completed Organ Transplant", "Match", `Match ID: ${matchId}`);

    return res.status(200).json({ success: true, message: "Organ transplant completed!" });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};