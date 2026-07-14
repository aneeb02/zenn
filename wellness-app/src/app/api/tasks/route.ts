import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';
import { requireAuth } from '@/lib/auth/server';
import { createTaskSchema, taskQuerySchema } from '@/lib/validations/api';
import { AppError, buildErrorResponse } from '@/lib/utils/error-handler';
import { dateKeyToPrismaDate, getLocalDateKey } from '@/lib/date/daily-stats';

// GET /api/tasks - List the current user's tasks
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (!user) {
      return buildErrorResponse(new AppError('Unauthorized', 401));
    }

    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const query = taskQuerySchema.parse(searchParams);

    const where: Record<string, unknown> = { userId: user.id };
    if (query.status) {
      where.status = query.status;
    } else if (!query.includeDone) {
      where.status = { not: 'done' };
    }

    const tasks = await prisma.task.findMany({
      where,
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
    });

    return NextResponse.json({ tasks });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return buildErrorResponse(new AppError('Invalid query parameters', 400));
    }
    return buildErrorResponse(error);
  }
}

// POST /api/tasks - Create a task
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (!user) {
      return buildErrorResponse(new AppError('Unauthorized', 401));
    }

    const body = await request.json();
    const data = createTaskSchema.parse(body);

    const isDone = data.status === 'done';

    const task = await prisma.task.create({
      data: {
        userId: user.id,
        title: data.title,
        notes: data.notes,
        status: data.status,
        priority: data.priority,
        dueDate: data.dueDate ? dateKeyToPrismaDate(data.dueDate) : null,
        estimateMins: data.estimateMins ?? null,
        completedAt: isDone ? new Date() : null,
      },
    });

    if (isDone) {
      const today = dateKeyToPrismaDate(getLocalDateKey());
      await prisma.dailyStats.upsert({
        where: { userId_date: { userId: user.id, date: today } },
        update: { tasksCompleted: { increment: 1 } },
        create: { userId: user.id, date: today, tasksCompleted: 1 },
      });
    }

    return NextResponse.json({ task }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return buildErrorResponse(new AppError('Invalid input data', 400));
    }
    return buildErrorResponse(error);
  }
}
