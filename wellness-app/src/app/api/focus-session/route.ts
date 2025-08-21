import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/server';
import { prisma } from '@/lib/db/prisma';

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const { duration, type, ambientSound } = await request.json();

    if (!duration || duration < 1) {
      return NextResponse.json(
        { error: 'Invalid duration' },
        { status: 400 }
      );
    }

    // Create focus session record
    const session = await prisma.focusSession.create({
      data: {
        userId: user.id,
        duration,
        type: type || 'custom',
        ambientSound: ambientSound || null,
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
        sessionMinutes: {
          increment: duration,
        },
      },
      create: {
        userId: user.id,
        date: today,
        affirmationsViewed: 0,
        sessionMinutes: duration,
        streakCount: 1,
      },
    });

    return NextResponse.json({ session });
  } catch (error) {
    console.error('Focus session error:', error);
    return NextResponse.json(
      { error: 'Failed to save focus session' },
      { status: 500 }
    );
  }
}
