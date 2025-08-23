import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';
import { requireAuth } from '@/lib/auth/server';
import { createJournalEntrySchema, journalQuerySchema } from '@/lib/validations/api';
import { AppError, buildErrorResponse } from '@/lib/utils/error-handler';
import { 
  encrypt, 
  packEncryptedData, 
  calculateWordCount, 
  calculateReadingTime,
  decrypt,
  unpackEncryptedData
} from '@/lib/security/encryption';

// GET /api/journal - Get user's journal entries with pagination and filters
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const user = await requireAuth(request);
    if (!user) {
      return buildErrorResponse(new AppError('Unauthorized', 401));
    }

    // Parse and validate query parameters
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const query = journalQuerySchema.parse(searchParams);

    // Build where clause for filtering
    const where: any = { userId: user.id };

    if (query.mood) {
      where.mood = query.mood;
    }

    if (query.tags && query.tags.length > 0) {
      where.tags = { hasSome: query.tags };
    }

    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) {
        where.createdAt.gte = new Date(query.startDate);
      }
      if (query.endDate) {
        where.createdAt.lte = new Date(query.endDate);
      }
    }

    // Get total count for pagination
    const totalCount = await prisma.journalEntry.count({ where });

    // Get paginated entries
    const entries = await prisma.journalEntry.findMany({
      where,
      orderBy: { [query.sortBy]: query.sortOrder },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
      select: {
        id: true,
        title: true,
        mood: true,
        tags: true,
        wordCount: true,
        readingTime: true,
        createdAt: true,
        updatedAt: true,
        lastViewedAt: true,
        // Don't include encrypted content in list view
      },
    });

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / query.limit);
    const hasNextPage = query.page < totalPages;
    const hasPrevPage = query.page > 1;

    return NextResponse.json({
      entries,
      pagination: {
        page: query.page,
        limit: query.limit,
        totalCount,
        totalPages,
        hasNextPage,
        hasPrevPage,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return buildErrorResponse(new AppError('Invalid query parameters', 400));
    }
    return buildErrorResponse(error);
  }
}

// POST /api/journal - Create a new journal entry
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const user = await requireAuth(request);
    if (!user) {
      return buildErrorResponse(new AppError('Unauthorized', 401));
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = createJournalEntrySchema.parse(body);

    // Calculate word count and reading time
    const wordCount = calculateWordCount(validatedData.content);
    const readingTime = calculateReadingTime(wordCount);

    // Encrypt the content
    const encryptedData = encrypt(validatedData.content);
    const { content: encryptedContent, iv } = packEncryptedData(encryptedData);

    // Create the journal entry
    const entry = await prisma.journalEntry.create({
      data: {
        userId: user.id,
        title: validatedData.title,
        content: encryptedContent,
        contentIv: iv,
        mood: validatedData.mood,
        tags: validatedData.tags || [],
        isPrivate: validatedData.isPrivate,
        wordCount,
        readingTime,
      },
      select: {
        id: true,
        title: true,
        mood: true,
        tags: true,
        wordCount: true,
        readingTime: true,
        createdAt: true,
      },
    });

    // Update daily stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    await prisma.dailyStats.upsert({
      where: {
        userId_date: {
          userId: user.id,
          date: today,
        },
      },
      update: {
        // You might want to add a journalEntriesCount field to DailyStats
      },
      create: {
        userId: user.id,
        date: today,
      },
    });

    return NextResponse.json(
      {
        message: 'Journal entry created successfully',
        entry,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return buildErrorResponse(new AppError('Invalid input data', 400));
    }
    return buildErrorResponse(error);
  }
}
