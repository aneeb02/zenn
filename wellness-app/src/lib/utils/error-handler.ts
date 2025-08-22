import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

// Custom error classes
export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public isOperational: boolean = true
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, public details?: any) {
    super(message, 400);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed') {
    super(message, 401);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 403);
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Resource already exists') {
    super(message, 409);
    this.name = 'ConflictError';
  }
}

// Logger utility
export class Logger {
  private static formatMessage(level: string, message: string, meta?: any): string {
    const timestamp = new Date().toISOString();
    const metaString = meta ? JSON.stringify(meta) : '';
    return `[${timestamp}] [${level}] ${message} ${metaString}`;
  }

  static info(message: string, meta?: any) {
    console.log(this.formatMessage('INFO', message, meta));
  }

  static warn(message: string, meta?: any) {
    console.warn(this.formatMessage('WARN', message, meta));
  }

  static error(message: string, error?: Error | any, meta?: any) {
    const errorMeta = {
      ...meta,
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      } : error
    };
    console.error(this.formatMessage('ERROR', message, errorMeta));
  }

  static debug(message: string, meta?: any) {
    if (process.env.NODE_ENV === 'development') {
      console.debug(this.formatMessage('DEBUG', message, meta));
    }
  }
}

// Error response builder
export function buildErrorResponse(error: unknown) {
  // Handle Zod validation errors
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: 'Validation failed',
        details: error.flatten(),
      },
      { status: 400 }
    );
  }

  // Handle custom app errors
  if (error instanceof AppError) {
    return NextResponse.json(
      {
        error: error.message,
        ...(error instanceof ValidationError && error.details ? { details: error.details } : {}),
      },
      { status: error.statusCode }
    );
  }

  // Handle Prisma errors
  if (error && typeof error === 'object' && 'code' in error) {
    const prismaError = error as any;
    
    // Unique constraint violation
    if (prismaError.code === 'P2002') {
      return NextResponse.json(
        { error: 'A record with this value already exists' },
        { status: 409 }
      );
    }
    
    // Record not found
    if (prismaError.code === 'P2025') {
      return NextResponse.json(
        { error: 'Record not found' },
        { status: 404 }
      );
    }
  }

  // Log unexpected errors
  Logger.error('Unexpected error occurred', error);

  // Generic error response (don't expose internal details in production)
  return NextResponse.json(
    {
      error: process.env.NODE_ENV === 'development' && error instanceof Error 
        ? error.message 
        : 'An unexpected error occurred',
    },
    { status: 500 }
  );
}

// Async error wrapper for API routes
export function asyncHandler<T extends (...args: any[]) => Promise<any>>(fn: T): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args);
    } catch (error) {
      return buildErrorResponse(error);
    }
  }) as T;
}
