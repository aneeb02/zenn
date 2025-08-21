// app/api/stats/daily/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/server';
import { prisma } from '@/lib/db/prisma';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get today's stats
    const todayStats = await prisma.dailyStats.findUnique({
      where: {
        userId_date: {
          userId: user.id,
          date: today,
        },
      },
    });

    // Get last 7 days of stats
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const weekStats = await prisma.dailyStats.findMany({
      where: {
        userId: user.id,
        date: {
          gte: sevenDaysAgo,
          lte: today,
        },
      },
      orderBy: {
        date: 'desc',
      },
    });

    // Calculate current streak
    let currentStreak = 0;
    const sortedStats = weekStats.sort((a, b) => b.date.getTime() - a.date.getTime());
    
    for (const stat of sortedStats) {
      if (stat.affirmationsViewed > 0 || stat.sessionMinutes > 0) {
        currentStreak++;
      } else {
        break;
      }
    }

    return NextResponse.json({
      today: todayStats || {
        affirmationsViewed: 0,
        sessionMinutes: 0,
        streakCount: 0,
      },
      week: weekStats,
      currentStreak,
    });
  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}