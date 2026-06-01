import { getRawStats, getAIPredictions, generateCSVReport } from '../../services/ai/analyticsService.js';
import { generatePDFReport } from '../../services/ai/pdfReportService.js';
import logger from '../../utils/logger.js';

export const getStats = async (req, res) => {
  try {
    const stats = await getRawStats();
    return res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    logger.error('Get Stats Error: %O', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
    });
  }
};

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
    logger.error('Public Stats Error: %O', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch public statistics',
    });
  }
};

export const getPredictions = async (req, res) => {
  try {
    const adminId = req.user?.id;
    const predictions = await getAIPredictions(adminId);
    return res.status(200).json(predictions);
  } catch (error) {
    logger.error('Get Predictions Error: %O', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate predictions',
    });
  }
};

export const exportAnalytics = async (req, res) => {
  try {
    const csv = await generateCSVReport();

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=sew_lesew_analytics_${new Date().toISOString().split('T')[0]}.csv`);

    return res.status(200).send(csv);
  } catch (error) {
    logger.error('CSV Export Error: %O', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to export report',
    });
  }
};

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
    logger.error('PDF Export Error: %O', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate PDF report',
    });
  }
};