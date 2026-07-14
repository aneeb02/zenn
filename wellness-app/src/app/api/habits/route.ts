import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';
import { requireAuth } from '@/lib/auth/server';
import { createHabitSchema } from '@/lib/validations/api';
import { AppError, buildErrorResponse } from '@/lib/utils/error-handler';
import { addDaysToDateKey, getLocalDateKey, prismaDateToDateKey } from '@/lib/date/daily-stats';

const LOG_WINDOW_DAYS = 60;

// GET /api/habits - Active habits with today's status, streak, and last 7 days
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (!user) {
      return buildErrorResponse(new AppError('Unauthorized', 401));
    }

    const todayKey = getLocalDateKey();
    const windowStartKey = addDaysToDateKey(todayKey, -(LOG_WINDOW_DAYS - 1));

    const [habits, logs] = await Promise.all([
      prisma.habit.findMany({
        where: { userId: user.id, archivedAt: null },
        orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
      }),
      prisma.habitLog.findMany({
        where: { userId: user.id, date: { gte: new Date(`${windowStartKey}T00:00:00.000Z`) } },
        select: { habitId: true, date: true },
      }),
    ]);

    // habitId -> set of dateKeys with a completion
    const logsByHabit = new Map<string, Set<string>>();
    for (const log of logs) {
      const key = prismaDateToDateKey(log.date);
      if (!logsByHabit.has(log.habitId)) logsByHabit.set(log.habitId, new Set());
      logsByHabit.get(log.habitId)!.add(key);
    }

    const yesterdayKey = addDaysToDateKey(todayKey, -1);

    const enriched = habits.map((habit) => {
      const days = logsByHabit.get(habit.id) ?? new Set<string>();
      const doneToday = days.has(todayKey);

      // Streak: consecutive days ending today. Today counts if done; otherwise
      // we start from yesterday so an unfinished today doesn't break the streak.
      let streak = 0;
      let cursor = doneToday ? todayKey : yesterdayKey;
      while (days.has(cursor)) {
        streak++;
        cursor = addDaysToDateKey(cursor, -1);
      }

      const last7 = Array.from({ length: 7 }, (_, i) => {
        const key = addDaysToDateKey(todayKey, -(6 - i));
        return days.has(key);
      });

      // For weekly cadence, how many completions this rolling week
      const weekCount = Array.from({ length: 7 }, (_, i) => addDaysToDateKey(todayKey, -i)).filter((k) =>
        days.has(k)
      ).length;

      return {
        id: habit.id,
        name: habit.name,
        cadence: habit.cadence,
        targetDays: habit.targetDays,
        color: habit.color,
        doneToday,
        streak,
        last7,
        weekCount,
      };
    });

    return NextResponse.json({ habits: enriched });
  } catch (error) {
    return buildErrorResponse(error);
  }
}

// POST /api/habits - Create a habit
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (!user) {
      return buildErrorResponse(new AppError('Unauthorized', 401));
    }

    const body = await request.json();
    const data = createHabitSchema.parse(body);

    const habit = await prisma.habit.create({
      data: {
        userId: user.id,
        name: data.name,
        cadence: data.cadence,
        targetDays: data.targetDays,
        color: data.color,
      },
    });

    return NextResponse.json({ habit }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return buildErrorResponse(new AppError('Invalid input data', 400));
    }
    return buildErrorResponse(error);
  }
}
