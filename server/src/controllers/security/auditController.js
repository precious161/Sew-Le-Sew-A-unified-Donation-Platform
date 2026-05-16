import { StatusCodes } from "http-status-codes";
import * as AuditService from "../../services/security/auditService.js";

export const fetchLogs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const adminId = req.query.adminId || null;
    const targetEntity = req.query.targetEntity || null;

    const result = await AuditService.getAuditLogs(page, limit, adminId, targetEntity);

    return res.status(StatusCodes.OK).json({ success: true, ...result });
  } catch (error) {
    console.error("fetchLogs Error:", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: "Failed to fetch audit logs." });
  }
};

export const downloadAuditTrail = async (req, res) => {
  try {
    const csvData = await AuditService.exportAuditTrail();


    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=sewlesew_audit_trail.csv");

    return res.status(StatusCodes.OK).send(csvData);
  } catch (error) {
    console.error("downloadAuditTrail Error:", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: "Failed to export audit trail." });
  }
};