// src/config/db.js
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import { config } from './env.js';

const globalForPrisma = global;

const createPrismaClient = () => {
  // Neon requires SSL mode and connection pool settings
  const pool = new pg.Pool({
    connectionString: config.dbUrl,
    ssl: process.env.NODE_ENV === 'production'
      ? { rejectUnauthorized: false }  // Neon requires this
      : false,
    max: 20,  // Max connections in pool
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });

  const adapter = new PrismaPg(pool);

  const prisma = new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development'
      ? ['query', 'error', 'warn', 'info']
      : ['error'],  // Only log errors in production
    errorFormat: 'pretty',
  });

  return prisma;
};

// Handle connection pooling for serverless (Neon)
export const prisma = globalForPrisma.prisma || createPrismaClient();

// Cleanup function for graceful shutdown
export async function disconnectPrisma() {
  await prisma.$disconnect();
  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = undefined;
  }
}

// Prevent multiple connections in development
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;