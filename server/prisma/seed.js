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
      password: hashedPassword,
      role: "RED_CROSS_ADMIN",
      status: "ACTIVE",
    },
  });

  console.log({ admin });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });