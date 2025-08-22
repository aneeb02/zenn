import { PrismaClient } from '@/generated/prisma';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Configure Prisma client with optimized settings
const prismaClientOptions = {
  log: process.env.NODE_ENV === 'development' 
    ? ['query', 'error', 'warn'] 
    : ['error'],
  errorFormat: process.env.NODE_ENV === 'development' ? 'pretty' : 'minimal',
} as const;

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient();

// Only cache the client in development to prevent connection issues
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Ensure proper cleanup on application shutdown
if (typeof process !== 'undefined' && process.env.NODE_ENV === 'production') {
  process.on?.('beforeExit', async () => {
    await prisma.$disconnect();
  });
}
