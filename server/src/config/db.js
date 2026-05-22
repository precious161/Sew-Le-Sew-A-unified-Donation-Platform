// src/config/db.js
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import { config } from './env.js';

const globalForPrisma = global;

const createPrismaClient = () => {
  const pool = new pg.Pool({ connectionString: config.dbUrl });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
};

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;