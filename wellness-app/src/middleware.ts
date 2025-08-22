import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { authRateLimit, apiRateLimit } from '@/lib/security/rate-limit';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Add security headers to all responses
  const securityHeaders = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  };
  
  // Apply rate limiting to auth endpoints
  if (pathname.startsWith('/api/auth/login') || pathname.startsWith('/api/auth/register')) {
    const rateLimitResult = await authRateLimit(request);
    if (rateLimitResult) {
      return rateLimitResult;
    }
  }
  
  // Apply general rate limiting to all API endpoints
  if (pathname.startsWith('/api/')) {
    const rateLimitResult = await apiRateLimit(request);
    if (rateLimitResult) {
      return rateLimitResult;
    }
  }
  
  // Public routes that don't require authentication
  const publicRoutes = [
    '/',
    '/login',
    '/register',
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/logout'
  ];
  
  // Check if the current route is public
  const isPublicRoute = publicRoutes.some(route => pathname === route || pathname.startsWith(`${route}/`));
  
  if (isPublicRoute) {
    const response = NextResponse.next();
    // Add security headers
    Object.entries(securityHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    return response;
  }

  // Protected routes - check for auth token
  const token = request.cookies.get('auth-token')?.value;
  
  if (!token) {
    // For API routes, return 401
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // For pages, redirect to login
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Token validation is handled in the API routes themselves
  // This is just a basic check for presence
  const response = NextResponse.next();
  
  // Add security headers to all responses
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
