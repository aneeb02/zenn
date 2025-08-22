import { NextRequest, NextResponse } from 'next/server';
import { Logger } from '@/lib/utils/error-handler';

// Simple in-memory store for rate limiting
// In production, use Redis or another distributed cache
class RateLimitStore {
  private store = new Map<string, { count: number; resetTime: number }>();
  
  increment(key: string, windowMs: number): { count: number; remaining: number; resetTime: number } {
    const now = Date.now();
    const record = this.store.get(key);
    
    if (!record || record.resetTime < now) {
      const resetTime = now + windowMs;
      this.store.set(key, { count: 1, resetTime });
      return { count: 1, remaining: 0, resetTime };
    }
    
    record.count++;
    return { 
      count: record.count, 
      remaining: record.resetTime - now,
      resetTime: record.resetTime 
    };
  }
  
  // Clean up expired entries periodically
  cleanup() {
    const now = Date.now();
    for (const [key, record] of this.store.entries()) {
      if (record.resetTime < now) {
        this.store.delete(key);
      }
    }
  }
}

const store = new RateLimitStore();

// Cleanup expired entries every minute
if (typeof setInterval !== 'undefined') {
  setInterval(() => store.cleanup(), 60 * 1000);
}

export interface RateLimitConfig {
  windowMs?: number;  // Time window in milliseconds
  max?: number;       // Max requests per window
  skipSuccessfulRequests?: boolean;
  keyGenerator?: (req: NextRequest) => string;
}

const defaultConfig: Required<RateLimitConfig> = {
  windowMs: 60 * 1000, // 1 minute
  max: 60,             // 60 requests per minute
  skipSuccessfulRequests: false,
  keyGenerator: (req) => {
    // Use IP address as key, fallback to a generic key if not available
    const ip = req.headers.get('x-forwarded-for') || 
               req.headers.get('x-real-ip') || 
               'unknown';
    return ip;
  }
};

export function rateLimit(userConfig: RateLimitConfig = {}) {
  const config = { ...defaultConfig, ...userConfig };
  
  return async function rateLimitMiddleware(request: NextRequest) {
    const key = config.keyGenerator(request);
    const { count, remaining, resetTime } = store.increment(key, config.windowMs);
    
    // Add rate limit headers
    const headers = new Headers();
    headers.set('X-RateLimit-Limit', config.max.toString());
    headers.set('X-RateLimit-Remaining', Math.max(0, config.max - count).toString());
    headers.set('X-RateLimit-Reset', new Date(resetTime).toISOString());
    
    if (count > config.max) {
      Logger.warn(`Rate limit exceeded for ${key}`, { count, max: config.max });
      
      return NextResponse.json(
        { 
          error: 'Too many requests', 
          retryAfter: Math.ceil(remaining / 1000) 
        },
        { 
          status: 429,
          headers 
        }
      );
    }
    
    return null; // Continue to next middleware/handler
  };
}

// Pre-configured rate limiters for different use cases
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per 15 minutes
});

export const apiRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute
});

export const strictRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute
});
