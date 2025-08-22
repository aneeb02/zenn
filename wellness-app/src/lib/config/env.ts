import { z } from 'zod';

// Define the environment variables schema
const envSchema = z.object({
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
  
  // Optional: External API keys (add as needed)
  // OPENAI_API_KEY: z.string().optional(),
  // SMTP settings for email (if needed)
  // SMTP_HOST: z.string().optional(),
  // SMTP_PORT: z.string().regex(/^\d+$/).transform(Number).optional(),
  // SMTP_USER: z.string().optional(),
  // SMTP_PASSWORD: z.string().optional(),
});

// Type for the validated environment
export type Env = z.infer<typeof envSchema>;

// Validate environment variables
// Note: This function must be Edge Runtime compatible
function validateEnv(): Env {
  try {
    const env = envSchema.parse(process.env);
    return env;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.issues.map(issue => {
        const path = issue.path.join('.');
        return `  - ${path}: ${issue.message}`;
      }).join('\n');
      
      const errorMessage = '❌ Environment validation failed:\n' + missingVars;
      
      // In production, throw an error instead of using process.exit (Edge Runtime compatible)
      if (process.env.NODE_ENV === 'production') {
        throw new Error(errorMessage);
      } else {
        // In development, just log the warning
        console.error(errorMessage);
        // Return a partial env object to allow development to continue
        return {
          DATABASE_URL: process.env.DATABASE_URL || '',
          NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || 'development-secret-change-in-production',
          NEXTAUTH_URL: process.env.NEXTAUTH_URL,
          NODE_ENV: 'development',
        } as Env;
      }
    }
    throw error;
  }
}

// Export validated environment variables
export const env = validateEnv();

// Helper to check if we're in production
export const isProduction = env.NODE_ENV === 'production';

// Helper to check if we're in development
export const isDevelopment = env.NODE_ENV === 'development';
