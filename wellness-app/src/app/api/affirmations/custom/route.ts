import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/server';
import { prisma } from '@/lib/db/prisma';

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const { text, category } = await request.json();

    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        { error: 'Affirmation text is required' },
        { status: 400 }
      );
    }

    const affirmation = await prisma.affirmation.create({
      data: {
        userId: user.id,
        text: text.trim(),
        category: category || 'personal',
        isCustom: true,
      },
    });

    return NextResponse.json({ affirmation });
  } catch (error) {
    console.error('Custom affirmation error:', error);
    return NextResponse.json(
      { error: 'Failed to save custom affirmation' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    const affirmations = await prisma.affirmation.findMany({
      where: {
        userId: user.id,
        isCustom: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ affirmations });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch custom affirmations' },
      { status: 500 }
    );
  }
}