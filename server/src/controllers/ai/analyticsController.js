import { getRawStats, getAIPredictions, generateCSVReport } from '../../services/ai/analyticsService.js';
import { generatePDFReport } from '../../services/ai/pdfReportService.js';

/**
 * Get real-time statistics (no AI)
 * GET /api/ai/analytics/stats
 */
export const getStats = async (req, res) => {
  try {
    const stats = await getRawStats();
    return res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Get Stats Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
    });
  }
};

/**
 * Get public statistics for landing page (limited data, no auth)
 * GET /api/ai/analytics/public-stats
 */
export const getPublicStats = async (req, res) => {
  try {
    const stats = await getRawStats();
    return res.status(200).json({
      success: true,
      data: {
        stats: {
          totalDonors: stats.stats.totalDonors,
          activeRequests: stats.stats.activeRequests,
          completedMatches: stats.stats.completedMatches,
          upcomingEvents: stats.stats.upcomingEvents,
          criticalRequests: stats.stats.criticalRequests,
        },
        topNeeds: stats.topNeeds,
        alertLevel: stats.alertLevel,
        bloodTypeDistribution: stats.bloodTypeDistribution,
      },
    });
  } catch (error) {
    console.error('Public Stats Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch public statistics',
    });
  }
};

/**
 * Get AI-powered predictions
 * GET /api/ai/analytics/predictions
 */
export const getPredictions = async (req, res) => {
  try {
    const adminId = req.user?.id; // Get admin ID from token
    const predictions = await getAIPredictions(adminId);
    return res.status(200).json(predictions);
  } catch (error) {
    console.error('Get Predictions Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate predictions',
    });
  }
};

/**
 * Export analytics as CSV (Legacy)
 * GET /api/ai/analytics/export/csv
 */
export const exportAnalytics = async (req, res) => {
  try {
    const csv = await generateCSVReport();

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=sew_lesew_analytics_${new Date().toISOString().split('T')[0]}.csv`);

    return res.status(200).send(csv);
  } catch (error) {
    console.error('Export Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to export report',
    });
  }
};

/**
 * Export analytics as PDF
 * GET /api/ai/analytics/export/pdf
 */
export const exportPDFReport = async (req, res) => {
  try {
    const stats = await getRawStats();
    const adminId = req.user?.id;
    const predictions = await getAIPredictions(adminId);
    const pdfBuffer = await generatePDFReport(stats, predictions);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=sew_lesew_analytics_${new Date().toISOString().split('T')[0]}.pdf`);

    return res.status(200).send(pdfBuffer);
  } catch (error) {
    console.error('PDF Export Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate PDF report',
    });
  }
};