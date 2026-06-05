import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/server';
import { generateDailyAffirmations } from '@/lib/affirmations/generator';
import { prisma } from '@/lib/db/prisma';
import { dateKeyToPrismaDate, getLocalDateKey } from '@/lib/date/daily-stats';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    // Get user profile
    const profile = await prisma.profile.findUnique({
      where: { userId: user.id },
    });

    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    // Generate daily affirmations
    const affirmations = await generateDailyAffirmations({
      goals: profile.goals,
      healthConditions: profile.healthConditions,
      tone: profile.tone,
      userName: user.name || 'friend',
    });

    // Update daily stats
    const today = dateKeyToPrismaDate(getLocalDateKey());

    await prisma.dailyStats.upsert({
      where: {
        userId_date: {
          userId: user.id,
          date: today,
        },
      },
      update: {
        affirmationsViewed: {
          increment: 1,
        },
      },
      create: {
        userId: user.id,
        date: today,
        affirmationsViewed: 1,
        sessionMinutes: 0,
        streakCount: 1,
      },
    });

    return NextResponse.json({ affirmations });
  } catch (error) {
    console.error('Daily affirmations error:', error);
    return NextResponse.json(
      { error: 'Failed to generate affirmations' },
      { status: 500 }
    );
  }
}
