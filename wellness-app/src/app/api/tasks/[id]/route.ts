import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';
import { requireAuth } from '@/lib/auth/server';
import { updateTaskSchema } from '@/lib/validations/api';
import { AppError, buildErrorResponse } from '@/lib/utils/error-handler';
import { dateKeyToPrismaDate, getLocalDateKey } from '@/lib/date/daily-stats';

// PATCH /api/tasks/[id] - Update a task
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request);
    if (!user) {
      return buildErrorResponse(new AppError('Unauthorized', 401));
    }

    const { id } = await params;
    const body = await request.json();
    const data = updateTaskSchema.parse(body);

    // Ownership check
    const existing = await prisma.task.findFirst({
      where: { id, userId: user.id },
    });
    if (!existing) {
      return buildErrorResponse(new AppError('Task not found', 404));
    }

    const updateData: Record<string, unknown> = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.priority !== undefined) updateData.priority = data.priority;
    if (data.order !== undefined) updateData.order = data.order;
    if (data.estimateMins !== undefined) updateData.estimateMins = data.estimateMins;
    if (data.dueDate !== undefined) {
      updateData.dueDate = data.dueDate ? dateKeyToPrismaDate(data.dueDate) : null;
    }

    // Track whether this update completes or un-completes the task
    let completionDelta = 0;
    if (data.status !== undefined && data.status !== existing.status) {
      updateData.status = data.status;
      const wasDone = existing.status === 'done';
      const willBeDone = data.status === 'done';
      if (willBeDone && !wasDone) {
        updateData.completedAt = new Date();
        completionDelta = 1;
      } else if (!willBeDone && wasDone) {
        updateData.completedAt = null;
        completionDelta = -1;
      }
    }

    const task = await prisma.task.update({
      where: { id },
      data: updateData,
    });

    // Keep today's completed-task count in sync for the activity map
    if (completionDelta !== 0) {
      const today = dateKeyToPrismaDate(getLocalDateKey());
      await prisma.dailyStats.upsert({
        where: { userId_date: { userId: user.id, date: today } },
        update: { tasksCompleted: { increment: completionDelta } },
        create: {
          userId: user.id,
          date: today,
          tasksCompleted: Math.max(0, completionDelta),
        },
      });
    }

    return NextResponse.json({ task });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return buildErrorResponse(new AppError('Invalid input data', 400));
    }
    return buildErrorResponse(error);
  }
}

// DELETE /api/tasks/[id] - Delete a task
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request);
    if (!user) {
      return buildErrorResponse(new AppError('Unauthorized', 401));
    }

    const { id } = await params;

    const existing = await prisma.task.findFirst({
      where: { id, userId: user.id },
    });
    if (!existing) {
      return buildErrorResponse(new AppError('Task not found', 404));
    }

    await prisma.task.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    return buildErrorResponse(error);
  }
}
