import 'dotenv/config';
import { PrismaClient } from './generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';

// Prisma 7's client no longer reads a connection string from schema.prisma —
// the app constructs its own driver adapter and hands it to PrismaClient directly.
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });

// Single shared Prisma client for the process.
export const prisma = new PrismaClient({ adapter });
