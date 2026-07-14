import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/server';
import { prisma } from '@/lib/db/prisma';
import { AppError, buildErrorResponse } from '@/lib/utils/error-handler';
import {
  addDaysToDateKey,
  dateKeyToLocalDate,
  getLocalDateKey,
  prismaDateToDateKey,
} from '@/lib/date/daily-stats';

const RANGE_DAYS = 84; // 12 weeks
const WEEKS = RANGE_DAYS / 7;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function dayOffset(fromKey: string, toKey: string): number {
  const from = dateKeyToLocalDate(fromKey).getTime();
  const to = dateKeyToLocalDate(toKey).getTime();
  return Math.round((to - from) / 86_400_000);
}

// GET /api/stats/progress - Aggregated review data for the /progress page
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (!user) {
      return buildErrorResponse(new AppError('Unauthorized', 401));
    }

    const todayKey = getLocalDateKey();
    const startKey = addDaysToDateKey(todayKey, -(RANGE_DAYS - 1));
    const rangeStart = dateKeyToLocalDate(startKey);
    const rangeEnd = dateKeyToLocalDate(addDaysToDateKey(todayKey, 1)); // exclusive upper bound

    const [sessions, journals, dailyStats, habits, habitLogs] = await Promise.all([
      prisma.focusSession.findMany({
        where: { userId: user.id, createdAt: { gte: rangeStart, lt: rangeEnd } },
        select: { createdAt: true, duration: true },
      }),
      prisma.journalEntry.findMany({
        where: { userId: user.id, createdAt: { gte: rangeStart, lt: rangeEnd } },
        select: { createdAt: true, mood: true },
      }),
      prisma.dailyStats.findMany({
        where: { userId: user.id, date: { gte: rangeStart } },
        select: { date: true, tasksCompleted: true, habitsCompleted: true, journalEntriesCount: true, sessionMinutes: true },
      }),
      prisma.habit.findMany({
        where: { userId: user.id, archivedAt: null },
        select: { id: true, name: true, color: true, cadence: true, targetDays: true, createdAt: true },
        orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
      }),
      prisma.habitLog.findMany({
        where: { userId: user.id, date: { gte: rangeStart } },
        select: { habitId: true },
      }),
    ]);

    // Weekly buckets (12), focus by hour (24), mood counts
    const weeks = Array.from({ length: WEEKS }, (_, i) => {
      const weekStartKey = addDaysToDateKey(startKey, i * 7);
      const d = dateKeyToLocalDate(weekStartKey);
      return {
        label: `${MONTHS[d.getMonth()]} ${d.getDate()}`,
        focusMinutes: 0,
        sessions: 0,
        tasksCompleted: 0,
        habitsCompleted: 0,
        journalEntries: 0,
      };
    });

    const focusByHour = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      minutes: 0,
      sessions: 0,
    }));

    let totalFocusMinutes = 0;
    for (const session of sessions) {
      const key = getLocalDateKey(session.createdAt);
      const offset = dayOffset(startKey, key);
      const weekIndex = Math.floor(offset / 7);
      if (weekIndex >= 0 && weekIndex < WEEKS) {
        weeks[weekIndex].focusMinutes += session.duration;
        weeks[weekIndex].sessions += 1;
      }
      const hour = session.createdAt.getHours();
      focusByHour[hour].minutes += session.duration;
      focusByHour[hour].sessions += 1;
      totalFocusMinutes += session.duration;
    }

    const moodCounts = new Map<string, number>();
    for (const entry of journals) {
      if (!entry.mood) continue;
      moodCounts.set(entry.mood, (moodCounts.get(entry.mood) || 0) + 1);
      const key = getLocalDateKey(entry.createdAt);
      const offset = dayOffset(startKey, key);
      const weekIndex = Math.floor(offset / 7);
      if (weekIndex >= 0 && weekIndex < WEEKS) {
        weeks[weekIndex].journalEntries += 1;
      }
    }

    let totalTasksCompleted = 0;
    let totalHabitsCompleted = 0;
    for (const stat of dailyStats) {
      const key = prismaDateToDateKey(stat.date);
      const offset = dayOffset(startKey, key);
      const weekIndex = Math.floor(offset / 7);
      if (weekIndex >= 0 && weekIndex < WEEKS) {
        weeks[weekIndex].tasksCompleted += stat.tasksCompleted;
        weeks[weekIndex].habitsCompleted += stat.habitsCompleted;
      }
      totalTasksCompleted += stat.tasksCompleted;
      totalHabitsCompleted += stat.habitsCompleted;
    }

    // Per-habit consistency over the range: completions vs. days the habit existed
    const logCountByHabit = new Map<string, number>();
    for (const log of habitLogs) {
      logCountByHabit.set(log.habitId, (logCountByHabit.get(log.habitId) || 0) + 1);
    }

    const habitConsistency = habits.map((habit) => {
      const createdKey = getLocalDateKey(habit.createdAt);
      // Habit only "counts" from whichever is later: its creation or the range start
      const effectiveStartKey = createdKey > startKey ? createdKey : startKey;
      const eligibleDays = Math.max(1, dayOffset(effectiveStartKey, todayKey) + 1);
      const completions = logCountByHabit.get(habit.id) || 0;
      const denom =
        habit.cadence === 'weekly'
          ? Math.max(1, (eligibleDays / 7) * habit.targetDays)
          : eligibleDays;
      const rate = Math.min(1, completions / denom);
      return {
        id: habit.id,
        name: habit.name,
        color: habit.color,
        cadence: habit.cadence,
        completions,
        eligibleDays,
        rate: Math.round(rate * 100),
      };
    });

    // Best focus window: hour with the most accumulated minutes
    let bestFocusHour: number | null = null;
    let bestFocusMinutes = 0;
    for (const bucket of focusByHour) {
      if (bucket.minutes > bestFocusMinutes) {
        bestFocusMinutes = bucket.minutes;
        bestFocusHour = bucket.hour;
      }
    }

    const moods = Array.from(moodCounts.entries())
      .map(([mood, count]) => ({ mood, count }))
      .sort((a, b) => b.count - a.count);

    return NextResponse.json({
      rangeDays: RANGE_DAYS,
      summary: {
        totalFocusMinutes,
        totalSessions: sessions.length,
        totalTasksCompleted,
        totalHabitsCompleted,
        totalJournalEntries: journals.length,
        bestFocusHour,
        bestFocusMinutes,
      },
      weeks,
      focusByHour,
      moods,
      habitConsistency,
    });
  } catch (error) {
    return buildErrorResponse(error);
  }
}
