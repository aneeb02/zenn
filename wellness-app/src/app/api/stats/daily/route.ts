// app/api/stats/daily/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/server';
import { prisma } from '@/lib/db/prisma';

const ACTIVITY_MAP_DAYS = 84;

function toDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function getIntensity({
  affirmationsViewed,
  sessionMinutes,
  focusSessionsCount,
  journalEntriesCount,
}: {
  affirmationsViewed: number;
  sessionMinutes: number;
  focusSessionsCount: number;
  journalEntriesCount: number;
}): 0 | 1 | 2 | 3 | 4 {
  const activityCount =
    focusSessionsCount +
    journalEntriesCount +
    Math.min(affirmationsViewed, 1);

  if (activityCount === 0 && sessionMinutes === 0) return 0;
  if (activityCount <= 1 && sessionMinutes < 15) return 1;
  if (activityCount <= 2 && sessionMinutes < 30) return 2;
  if (activityCount <= 3 && sessionMinutes < 45) return 3;
  return 4;
}

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

    // Get last 12 weeks of stats for the dashboard activity map
    const activityStartDate = new Date(today);
    activityStartDate.setDate(activityStartDate.getDate() - (ACTIVITY_MAP_DAYS - 1));
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const activityStats = await prisma.dailyStats.findMany({
      where: {
        userId: user.id,
        date: {
          gte: activityStartDate,
          lte: today,
        },
      },
      orderBy: {
        date: 'asc',
      },
    });

    const focusSessions = await prisma.focusSession.findMany({
      where: {
        userId: user.id,
        createdAt: {
          gte: activityStartDate,
          lt: tomorrow,
        },
      },
      select: {
        createdAt: true,
      },
    });

    const statsByDate = new Map(
      activityStats.map((stat) => [toDateKey(stat.date), stat])
    );

    const focusSessionsByDate = new Map<string, number>();
    for (const session of focusSessions) {
      const dateKey = toDateKey(session.createdAt);
      focusSessionsByDate.set(dateKey, (focusSessionsByDate.get(dateKey) || 0) + 1);
    }

    const activityMap = Array.from({ length: ACTIVITY_MAP_DAYS }, (_, index) => {
      const date = new Date(activityStartDate);
      date.setDate(activityStartDate.getDate() + index);
      const dateKey = toDateKey(date);
      const stat = statsByDate.get(dateKey);

      const affirmationsViewed = stat?.affirmationsViewed || 0;
      const sessionMinutes = stat?.sessionMinutes || 0;
      const focusSessionsCount = focusSessionsByDate.get(dateKey) || 0;
      const journalEntriesCount = stat?.journalEntriesCount || 0;

      return {
        date: dateKey,
        affirmationsViewed,
        sessionMinutes,
        focusSessionsCount,
        journalEntriesCount,
        intensity: getIntensity({
          affirmationsViewed,
          sessionMinutes,
          focusSessionsCount,
          journalEntriesCount,
        }),
        completedFocusAndJournal: sessionMinutes > 0 && journalEntriesCount > 0,
      };
    });

    // Calculate current streak
    let currentStreak = 0;
    for (let index = activityMap.length - 1; index >= 0; index--) {
      const stat = activityMap[index];
      if (stat.affirmationsViewed > 0 || stat.sessionMinutes > 0 || stat.journalEntriesCount > 0) {
        currentStreak++;
      } else {
        break;
      }
    }

    const week = activityMap.slice(-7);

    return NextResponse.json({
      today: todayStats || {
        affirmationsViewed: 0,
        sessionMinutes: 0,
        journalEntriesCount: 0,
        streakCount: 0,
      },
      week,
      activityMap,
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
