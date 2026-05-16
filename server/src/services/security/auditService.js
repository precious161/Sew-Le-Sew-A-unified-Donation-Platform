import prisma from "../../config/db.js";


export const createLogEntry = async (adminId, action, targetEntity, remarks = null) => {
  try {
    await prisma.auditLog.create({
      data: {
        adminId,
        action,
        targetEntity,
        remarks,
      },
    });
  } catch (error) {
    // We log to console so the main app doesn't crash if auditing fails
    console.error("CRITICAL: Audit Logging Failed:", error);
  }
};

// ── 2. Get Logs (With optional filters for AdminId or Entity) ──
export const getAuditLogs = async (page = 1, limit = 20, adminId = null, targetEntity = null) => {
  const skip = (page - 1) * limit;

  // Build dynamic where clause
  const where = {};
  if (adminId) where.adminId = adminId;
  if (targetEntity) where.targetEntity = targetEntity;

  const [logs, totalCount] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      skip,
      take: limit,
      include: {
        admin: { select: { FirstName: true, LastName: true, EmailAddress: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.auditLog.count({ where }),
  ]);

  return {
    logs,
    totalCount,
    totalPages: Math.ceil(totalCount / limit),
    currentPage: page,
  };
};

// ── 3. Export Audit Trail (Generates a CSV string) ──
export const exportAuditTrail = async () => {
  const logs = await prisma.auditLog.findMany({
    include: { admin: { select: { EmailAddress: true } } },
    orderBy: { createdAt: "desc" },
  });

  // Convert JSON to CSV format for the professors!
  let csv = "LogId,AdminEmail,Action,TargetEntity,ActionDate,Remarks\n";
  logs.forEach(log => {
    const safeRemarks = log.remarks ? `"${log.remarks.replace(/"/g, '""')}"` : "None";
    csv += `${log.id},${log.admin.EmailAddress},"${log.action}",${log.targetEntity},${log.createdAt.toISOString()},${safeRemarks}\n`;
  });

  return csv;
};