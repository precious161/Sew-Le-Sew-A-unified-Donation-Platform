import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import { config } from './env.js';

// Setup the pool
const pool = new pg.Pool({ connectionString: config.dbUrl });
const adapter = new PrismaPg(pool);

// Initialize the client
const prisma = new PrismaClient({ adapter });

export default prisma;