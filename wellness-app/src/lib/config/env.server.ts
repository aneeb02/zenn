import { z } from 'zod';

// Server-only environment validation (not for Edge Runtime)
// This file should only be imported in API routes, not in middleware

const serverEnvSchema = z.object({
  // Database - Support both regular PostgreSQL and Prisma Accelerate URLs
  DATABASE_URL: z.string().url().refine(
    (url) => url.startsWith('postgresql://') || url.startsWith('prisma+postgres://'),
    'DATABASE_URL must be a valid PostgreSQL or Prisma Accelerate URL'
  ),
  
  // Authentication
  NEXTAUTH_SECRET: z.string().min(32, 'NEXTAUTH_SECRET must be at least 32 characters'),
  NEXTAUTH_URL: z.string().url().optional(),
  
  // Node environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

// Cached environment
let cachedEnv: ServerEnv | undefined;

export function getServerEnv(): ServerEnv {
  if (cachedEnv) return cachedEnv;
  
  try {
    cachedEnv = serverEnvSchema.parse(process.env);
    return cachedEnv;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.issues.map(issue => {
        const path = issue.path.join('.');
        return `  - ${path}: ${issue.message}`;
      }).join('\n');
      
      console.error('❌ Server environment validation failed:\n' + missingVars);
      
      if (process.env.NODE_ENV === 'production') {
        // In production, exit the process
        process.exit(1);
      }
      
      // In development, throw the error to be caught by error handlers
      throw new Error('Environment validation failed. Check your .env file.');
    }
    throw error;
  }
}

// Export helpers
export const serverEnv = getServerEnv();
export const isServerProduction = serverEnv.NODE_ENV === 'production';
export const isServerDevelopment = serverEnv.NODE_ENV === 'development';
