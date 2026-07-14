import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/server';
import { prisma } from '@/lib/db/prisma';
import { AppError, buildErrorResponse } from '@/lib/utils/error-handler';

const SAVED_SOURCE = 'saved';

// GET /api/affirmations/saved - List affirmations the user has saved
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (!user) {
      return buildErrorResponse(new AppError('Unauthorized', 401));
    }

    const affirmations = await prisma.affirmation.findMany({
      where: { userId: user.id, source: SAVED_SOURCE },
      orderBy: { createdAt: 'desc' },
      select: { id: true, text: true, createdAt: true },
    });

    return NextResponse.json({ affirmations });
  } catch (error) {
    return buildErrorResponse(error);
  }
}

// POST /api/affirmations/saved - Save an affirmation (idempotent per text)
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (!user) {
      return buildErrorResponse(new AppError('Unauthorized', 401));
    }

    const { text } = await request.json();
    const trimmed = typeof text === 'string' ? text.trim() : '';
    if (!trimmed) {
      return buildErrorResponse(new AppError('Affirmation text is required', 400));
    }
    if (trimmed.length > 500) {
      return buildErrorResponse(new AppError('Affirmation is too long', 400));
    }

    // Idempotent: don't create duplicates of the same saved text
    const existing = await prisma.affirmation.findFirst({
      where: { userId: user.id, source: SAVED_SOURCE, text: trimmed },
      select: { id: true, text: true, createdAt: true },
    });
    if (existing) {
      return NextResponse.json({ affirmation: existing, alreadySaved: true });
    }

    const affirmation = await prisma.affirmation.create({
      data: {
        userId: user.id,
        text: trimmed,
        category: 'saved',
        isCustom: false,
        source: SAVED_SOURCE,
      },
      select: { id: true, text: true, createdAt: true },
    });

    return NextResponse.json({ affirmation }, { status: 201 });
  } catch (error) {
    return buildErrorResponse(error);
  }
}

// DELETE /api/affirmations/saved?text=... - Remove a saved affirmation
export async function DELETE(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (!user) {
      return buildErrorResponse(new AppError('Unauthorized', 401));
    }

    const text = request.nextUrl.searchParams.get('text')?.trim();
    if (!text) {
      return buildErrorResponse(new AppError('Affirmation text is required', 400));
    }

    await prisma.affirmation.deleteMany({
      where: { userId: user.id, source: SAVED_SOURCE, text },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return buildErrorResponse(error);
  }
}
