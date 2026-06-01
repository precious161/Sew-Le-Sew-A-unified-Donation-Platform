import Groq from 'groq-sdk';
import prisma from '../../config/db.js';
import { config } from '../../config/env.js';
import logger from '../../utils/logger.js'; // <-- ADDED LOGGER IMPORT

const groq = new Groq({
  apiKey: config.groqApiKey,
});

/**
 * Get real statistics from database (no AI)
 */
export const getRawStats = async () => {
  const now = new Date();
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(now.getMonth() - 6);

  const [
    totalDonors,
    totalRecipients,
    activeRequests,
    completedMatches,
    upcomingEvents,
    criticalRequestsCount,
  ] = await Promise.all([
    prisma.user.count({ where: { Role: 'Donor', status: 'Active' } }),
    prisma.user.count({ where: { Role: 'Recipient', status: 'Active' } }),
    prisma.donationRequest.count({ where: { status: { in: ['PendingVerification', 'Pending', 'Matching'] } } }),
    prisma.match.count({ where: { status: 'Completed' } }),
    prisma.donationEvent.count({ where: { eventDate: { gte: now }, status: 'Active' } }),
    prisma.donationRequest.count({ where: { urgencyLevel: 'Critical', status: { in: ['PendingVerification', 'Pending'] } } }),
  ]);

  // --- FIXED: CORRECT PRISMA GROUP BY SYNTAX ---
  const [bloodDemand, organDemand, inKindDemand, financialDemand] = await Promise.all([
    prisma.donationRequest.groupBy({
      by: ['requiredBloodType'],
      where: { donationType: 'Blood', status: 'Pending', requiredBloodType: { not: null } },
      _count: true,
      orderBy: {
        _count: {
          requiredBloodType: 'desc',  // FIXED: Correct syntax for ordering by count
        },
      },
      take: 1,
    }),
    prisma.donationRequest.groupBy({
      by: ['organType'],
      where: { donationType: 'Organ', status: 'Pending', organType: { not: null } },
      _count: true,
      orderBy: {
        _count: {
          organType: 'desc',
        },
      },
      take: 1,
    }),
    prisma.donationRequest.groupBy({
      by: ['itemType'],
      where: { donationType: 'In_Kind', status: 'Pending', itemType: { not: null } },
      _count: true,
      orderBy: {
        _count: {
          itemType: 'desc',
        },
      },
      take: 1,
    }),
    prisma.donationRequest.count({
      where: { donationType: 'Financial', status: 'Pending' },
    }),
  ]);

  const topNeeds = {
    blood: bloodDemand[0]?.requiredBloodType || 'O-',
    organ: organDemand[0]?.organType || 'Kidney',
    inKind: inKindDemand[0]?.itemType || 'Medical Supplies',
    financialPendingCount: financialDemand || 0,
  };

  const bloodTypeDistribution = await prisma.user.groupBy({
    by: ['bloodType'],
    where: { bloodType: { not: null } },
    _count: true,
  });

  const monthlyRequests = await prisma.donationRequest.groupBy({
    by: ['donationType'],
    where: { requestDate: { gte: sixMonthsAgo } },
    _count: true,
  });

  return {
    stats: {
      totalDonors,
      totalRecipients,
      activeRequests,
      completedMatches,
      upcomingEvents,
      criticalRequests: criticalRequestsCount,
    },
    topNeeds,
    bloodTypeDistribution,
    monthlyTrends: monthlyRequests,
    alertLevel: criticalRequestsCount > 10 ? 'High' : criticalRequestsCount > 0 ? 'Medium' : 'Low',
  };
};

/**
 * Get AI-powered predictions and insights
 */
export const getAIPredictions = async (adminId = null) => {
  try {
    // Get real data for context
    const stats = await getRawStats();

    const prompt = `You are a data analyst for the Ethiopian Red Cross. Based on this donation data:

- Total Active Donors: ${stats.stats.totalDonors}
- Total Active Recipients: ${stats.stats.totalRecipients}
- Active Requests: ${stats.stats.activeRequests}
- Completed Matches: ${stats.stats.completedMatches}
- Critical Requests: ${stats.stats.criticalRequests}
- Current Alert Level: ${stats.alertLevel}

Blood type distribution: ${JSON.stringify(stats.bloodTypeDistribution)}

Please provide:
1. Which blood type will likely be in shortage next month?
2. What is the estimated demand increase percentage?
3. Where in Addis Ababa should we host the next donation drive?
4. One actionable recommendation for the Red Cross

Return ONLY valid JSON in this exact format:
{
  "shortageBloodType": "string",
  "demandIncrease": number,
  "recommendedLocation": "string",
  "recommendation": "string",
  "confidence": number
}`;

    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: 'You are a data analyst for a blood donation organization. Return ONLY valid JSON, no other text.' },
        { role: 'user', content: prompt },
      ],
      model: 'llama-3.1-8b-instant',
      temperature: 0.5,
      max_tokens: 300,
    });

    const responseText = completion.choices[0]?.message?.content || '{}';

    // Parse JSON response
    let predictions;
    try {
      predictions = JSON.parse(responseText);
    } catch {
      // Fallback predictions if AI returns malformed JSON
      predictions = {
        shortageBloodType: stats.bloodTypeDistribution[0]?.bloodType || 'O+',
        demandIncrease: 15,
        recommendedLocation: 'Bole Medhanialem',
        recommendation: 'Increase donor outreach in areas with high demand',
        confidence: 75,
      };
    }

    // Save predictions to database - NOW WITH PROPER RELATION
    if (adminId) {
      try {
        await prisma.analyticsReport.create({
          data: {
            reportType: 'PREDICTION',
            summary: JSON.stringify(predictions),
            generatedDate: new Date(),
            format: 'JSON',
            createdBy: adminId, // This now references the User model
          },
        });
        logger.info('Prediction saved to database by admin', { adminId }); // <-- REPLACED CONSOLE.LOG
      } catch (dbError) {
        logger.error('Failed to save prediction: %O', dbError); // <-- REPLACED CONSOLE.ERROR
      }
    } else {
      logger.info('No admin ID provided, prediction not saved to database'); // <-- REPLACED CONSOLE.LOG
    }

    return {
      success: true,
      data: predictions,
      generatedAt: new Date().toISOString(),
    };
  } catch (error) {
    logger.error('AI Prediction Error: %O', error); // <-- REPLACED CONSOLE.ERROR

    // Fallback without AI
    const stats = await getRawStats();
    return {
      success: false,
      data: {
        shortageBloodType: stats.bloodTypeDistribution[0]?.bloodType || 'O+',
        demandIncrease: 10,
        recommendedLocation: 'Addis Ababa',
        recommendation: 'Schedule regular donation drives',
        confidence: 60,
      },
      generatedAt: new Date().toISOString(),
      note: 'Using fallback predictions (AI service unavailable)',
    };
  }
};

/**
 * Generate CSV report for export
 */
export const generateCSVReport = async () => {
  const stats = await getRawStats();
  const predictions = await getAIPredictions();

  const rows = [
    ['Sew Le Sew Analytics Report'],
    [`Generated: ${new Date().toLocaleString()}`],
    [''],
    ['METRIC', 'VALUE'],
    ['Total Active Donors', stats.stats.totalDonors],
    ['Total Active Recipients', stats.stats.totalRecipients],
    ['Active Donation Requests', stats.stats.activeRequests],
    ['Completed Matches', stats.stats.completedMatches],
    ['Upcoming Events', stats.stats.upcomingEvents],
    ['Critical Requests', stats.stats.criticalRequests],
    ['Alert Level', stats.alertLevel],
    [''],
    ['TOP NEEDS', ''],
    ['Most Needed Blood Type', stats.topNeeds.blood],
    ['Most Needed Organ', stats.topNeeds.organ],
    ['Most Needed Supply', stats.topNeeds.inKind],
    ['Pending Financial Requests', stats.topNeeds.financialPendingCount],
    [''],
    ['AI PREDICTIONS', ''],
    ['Predicted Shortage Blood Type', predictions.data.shortageBloodType],
    ['Demand Increase (%)', predictions.data.demandIncrease],
    ['Recommended Location', predictions.data.recommendedLocation],
    ['AI Recommendation', predictions.data.recommendation],
    ['AI Confidence', `${predictions.data.confidence}%`],
  ];

  return rows.map(row => row.join(',')).join('\n');
};