import prisma from "../../config/db.js"

const calculateIneligibleUntil = (reasonCode) => {
  const today = new Date();

  switch (reasonCode) {
    case 'DONATION_GAP_DAYS':
      today.setDate(today.getDate() + 90);
      return today;
    case 'MIN_WEIGHT':
    case 'HEMOGLOBIN_MIN':
      today.setDate(today.getDate() + 30);
      return today;
    case 'MIN_AGE':
      today.setDate(today.getDate() + 30);
      return today;
    case 'COERCION_FREE':
    case 'QUALITY_CERTIFIED':
      return null; // Permanent fail until manual intervention
    default:
      return null;
  }
};

/**
 * Core Engine to process donor eligibility against international standards.
 */
export const processEligibility = async (userId, category, userAnswers) => {
  // 1. Fetch Standards for the specific category
  const standards = await prisma.medicalStandard.findMany({
    where: { category }
  });

  if (standards.length === 0) {
    throw new Error(`No medical standards found for category: ${category}. Please seed the database.`);
  }

  let isEligible = true;
  let reasonCode = null;

  // 2. The Comparison Loop
  for (const standard of standards) {
    const userAnswer = userAnswers[standard.ruleKey];

    // Fail if an answer is missing
    if (userAnswer === undefined || userAnswer === null) {
      isEligible = false;
      reasonCode = `MISSING_${standard.ruleKey}`;
      break;
    }

    let isViolation = false;

    if (standard.dataType === 'Number') {
      if (parseFloat(userAnswer) < parseFloat(standard.value)) {
        isViolation = true;
      }
    } else if (standard.dataType === 'Boolean') {
      const boolAnswer = String(userAnswer).toLowerCase() === 'true';
      const boolStandard = String(standard.value).toLowerCase() === 'true';
      if (boolAnswer !== boolStandard) {
        isViolation = true;
      }
    }

    if (isViolation) {
      isEligible = false;
      reasonCode = standard.ruleKey;
      break;
    }
  }

  const ineligibleUntil = isEligible ? null : calculateIneligibleUntil(reasonCode);

  return await prisma.$transaction(async (tx) => {
    // Save the detailed log for audit
    await tx.eligibilityLog.create({
      data: {
        userId,
        category,
        isEligible,
        reasonCode,
        answers: userAnswers,
      },
    });

    // Update or Create the user's current status for this category
    const status = await tx.userEligibilityStatus.upsert({
      where: {
        userId_category: { userId, category },
      },
      update: {
        status: isEligible ? 'Eligible' : 'Ineligible',
        ineligibleUntil,
        lastCheckedAt: new Date(),
      },
      create: {
        userId,
        category,
        status: isEligible ? 'Eligible' : 'Ineligible',
        ineligibleUntil,
      },
    });

    return { isEligible, reasonCode, ineligibleUntil, status };
  });
};


/**
 * Retrieves the eligibility screening history for a specific user.
 */
export const getEligibilityHistory = async (userId) => {
  return await prisma.eligibilityLog.findMany({
    where: { userId },
    orderBy: {
      createdAt: 'desc', // Latest logs first
    },
    // We can select specific fields if we want to hide sensitive DB metadata
    select: {
      id: true,
      category: true,
      isEligible: true,
      reasonCode: true,
      createdAt: true,
      answers: true, // Useful for the user to see what they submitted
    }
  });
};