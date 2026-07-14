import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireAuth } from '@/lib/auth/server';
import { AppError, buildErrorResponse } from '@/lib/utils/error-handler';
import { dateKeyToPrismaDate, getLocalDateKey } from '@/lib/date/daily-stats';

// POST /api/habits/[id]/toggle - Toggle today's completion for a habit
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request);
    if (!user) {
      return buildErrorResponse(new AppError('Unauthorized', 401));
    }

    const { id } = await params;

    const habit = await prisma.habit.findFirst({ where: { id, userId: user.id } });
    if (!habit) {
      return buildErrorResponse(new AppError('Habit not found', 404));
    }

    const today = dateKeyToPrismaDate(getLocalDateKey());

    const existingLog = await prisma.habitLog.findUnique({
      where: { habitId_date: { habitId: id, date: today } },
    });

    const delta = existingLog ? -1 : 1;
    const doneToday = !existingLog;

    // Toggle the log and keep the daily rollup consistent in one transaction
    await prisma.$transaction([
      existingLog
        ? prisma.habitLog.delete({ where: { id: existingLog.id } })
        : prisma.habitLog.create({ data: { habitId: id, userId: user.id, date: today } }),
      prisma.dailyStats.upsert({
        where: { userId_date: { userId: user.id, date: today } },
        update: { habitsCompleted: { increment: delta } },
        create: { userId: user.id, date: today, habitsCompleted: Math.max(0, delta) },
      }),
    ]);

    return NextResponse.json({ doneToday });
  } catch (error) {
    return buildErrorResponse(error);
  }
}
