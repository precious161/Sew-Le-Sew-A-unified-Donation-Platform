import prisma from '../src/config/db.js';
import bcrypt from 'bcryptjs';
import 'dotenv/config';


async function main() {
  const adminEmail = "admin@redcross.org.et";
  const hashedPassword = await bcrypt.hash("Admin123!", 10);

  const admin = await prisma.user.upsert({
    where: { EmailAddress: adminEmail },
    update: {},
    create: {
      EmailAddress: adminEmail,
      FirstName: "System",
      LastName: "Administrator",
      Password: hashedPassword,
      Role: "Red_Cross_Admin",
      status: "Active",
    },
  });

  console.log({ admin });

  // Medical Standards
  const standards = [
  // --- BLOOD (WHO/Red Cross International Standards) ---
  {
    category: 'Blood',
    ruleKey: 'MIN_AGE',
    value: '18',
    dataType: 'Number',
    description: 'WHO Standard: Minimum age for legal consent'
  },
  {
    category: 'Blood',
    ruleKey: 'MIN_WEIGHT',
    value: '50',
    dataType: 'Number',
    description: 'Global Standard: Minimum weight to ensure safe volume-to-weight ratio'
  },
  {
    category: 'Blood',
    ruleKey: 'HEMOGLOBIN_MIN',
    value: '12.5',
    dataType: 'Number',
    description: 'International Standard: Minimum g/dL to prevent donor anemia'
  },
  {
    category: 'Blood',
    ruleKey: 'DONATION_GAP_DAYS',
    value: '90',
    dataType: 'Number',
    description: 'Global Protocol: Recovery period for red cell regeneration'
  },

  // --- ORGAN (WHO Guiding Principles on Transplantation) ---
  {
    category: 'Organ',
    ruleKey: 'MIN_AGE',
    value: '18',
    dataType: 'Number',
    description: 'WHO Principle 3: Live donation requires legal capacity'
  },
  {
    category: 'Organ',
    ruleKey: 'COERCION_FREE',
    value: 'true',
    dataType: 'Boolean',
    description: 'WHO Principle 3: Consent must be given freely without financial incentive'
  },

  // --- FINANCIAL (Anti-Money Laundering (AML) & KYC Standards) ---
  {
    category: 'Financial',
    ruleKey: 'KYC_THRESHOLD',
    value: '10000',
    dataType: 'Number',
    description: 'FATF Standard: Amount exceeding this requires identity verification (AML)'
  },
  {
    category: 'Financial',
    ruleKey: 'MIN_AMOUNT',
    value: '5',
    dataType: 'Number',
    description: 'Standard transaction minimum to optimize gateway fees'
  },

  // --- IN_KIND (The Sphere Handbook / UN Logistics) ---
  {
    category: 'In_Kind',
    ruleKey: 'MIN_EXPIRY_MONTHS',
    value: '6',
    dataType: 'Number',
    description: 'UN Logistics: Perishables must have at least 6 months shelf life remaining'
  },
  {
    category: 'In_Kind',
    ruleKey: 'QUALITY_CERTIFIED',
    value: 'true',
    dataType: 'Boolean',
    description: 'Sphere Standard: Goods must meet safety/quality specifications for dignity'
  }
];


for (const standard of standards) {
  await prisma.medicalStandard.upsert({
    where: {
      category_ruleKey: {
        category: standard.category,
        ruleKey: standard.ruleKey,
      },
    },
    update: {},
    create: standard,
  });
}

console.log("International Medical Standards seeded successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });