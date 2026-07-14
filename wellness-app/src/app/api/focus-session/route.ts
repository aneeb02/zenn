import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/server';
import { prisma } from '@/lib/db/prisma';
import { dateKeyToPrismaDate, getLocalDateKey } from '@/lib/date/daily-stats';

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const { duration, type, ambientSound, intention, taskId, completedTasks } =
      await request.json();

    if (!duration || duration < 1) {
      return NextResponse.json(
        { error: 'Invalid duration' },
        { status: 400 }
      );
    }

    const sessionIntention =
      typeof intention === 'string' && intention.trim().length > 0
        ? intention.trim().slice(0, 240)
        : null;

    // Verify the linked task belongs to this user before associating it
    let linkedTaskId: string | null = null;
    if (typeof taskId === 'string' && taskId.length > 0) {
      const task = await prisma.task.findFirst({
        where: { id: taskId, userId: user.id },
        select: { id: true },
      });
      linkedTaskId = task?.id ?? null;
    }

    const taskSnapshot = Array.isArray(completedTasks)
      ? completedTasks
          .filter((t) => t && typeof t.text === 'string')
          .slice(0, 10)
          .map((t) => ({ text: String(t.text).slice(0, 240), done: Boolean(t.done) }))
      : undefined;

    // Create focus session record
    const session = await prisma.focusSession.create({
      data: {
        userId: user.id,
        taskId: linkedTaskId,
        duration,
        type: type || 'custom',
        intention: sessionIntention,
        ambientSound: ambientSound || null,
        completedTasks: taskSnapshot,
      },
    });

    // Roll the session's minutes up onto the linked task
    if (linkedTaskId) {
      await prisma.task.update({
        where: { id: linkedTaskId },
        data: { spentMins: { increment: duration } },
      });
    }

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
