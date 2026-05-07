
import * as FinancialService from "../../services/matching/financialService.js";

export const submitContribution = async (req, res) => {
  try {
    const donorId = req.user.id;
    const contribution = await FinancialService.submitContribution(donorId, req.body);

    return res.status(201).json({
      success: true,
      message: "Contribution pledge submitted successfully. Please complete your transfer.",
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

export const cancelContribution = async (req, res) => {
  try {
    const donorId = req.user.id;
    const { id } = req.params;

    const contribution = await FinancialService.cancelContribution(donorId, id);

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

export const verifyContribution = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { id } = req.params;

    const contribution = await FinancialService.verifyContribution(adminId, id);

    return res.status(200).json({
      success: true,
      message: "Contribution verified successfully.",
      data: contribution,
    });
  } catch (error) {
    console.error("verifyContribution Error:", error);
    const status = error.statusCode || 500;
    return res.status(status).json({
      success: false,
      message: error.message || "Failed to verify contribution.",
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
        message: "Allocation note is required.",
      });
    }

    const contribution = await FinancialService.allocateContribution(
      adminId,
      id,
      allocationNote
    );

    return res.status(200).json({
      success: true,
      message: "Contribution allocated successfully.",
      data: contribution,
    });
  } catch (error) {
    console.error("allocateContribution Error:", error);
    const status = error.statusCode || 500;
    return res.status(status).json({
      success: false,
      message: error.message || "Failed to allocate contribution.",
    });
  }
};

export const rejectContribution = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { id } = req.params;

    const contribution = await FinancialService.rejectContribution(adminId, id);

    return res.status(200).json({
      success: true,
      message: "Contribution rejected successfully.",
      data: contribution,
    });
  } catch (error) {
    console.error("rejectContribution Error:", error);
    const status = error.statusCode || 500;
    return res.status(status).json({
      success: false,
      message: error.message || "Failed to reject contribution.",
    });
  }
};

// Add this to existing financialController.js

export const distributeToRecipient = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { contributionId, requestId } = req.params;
    const { amount, note } = req.body;

    if (!amount || !note) {
      return res.status(400).json({
        success: false,
        message: "Amount and note are required for distribution.",
      });
    }

    await FinancialService.distributeToRecipient(
      adminId,
      contributionId,
      requestId,
      amount,
      note
    );

    return res.status(200).json({
      success: true,
      message: "Funds distributed to recipient successfully.",
    });
  } catch (error) {
    console.error("distributeToRecipient Error:", error);
    const status = error.statusCode || 500;
    return res.status(status).json({
      success: false,
      message: error.message || "Failed to distribute funds.",
    });
  }
};