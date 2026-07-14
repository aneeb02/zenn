import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';
import { requireAuth } from '@/lib/auth/server';
import { updateHabitSchema } from '@/lib/validations/api';
import { AppError, buildErrorResponse } from '@/lib/utils/error-handler';

// PATCH /api/habits/[id] - Update or archive a habit
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
    const data = updateHabitSchema.parse(body);

    const existing = await prisma.habit.findFirst({ where: { id, userId: user.id } });
    if (!existing) {
      return buildErrorResponse(new AppError('Habit not found', 404));
    }

    const updateData: Record<string, unknown> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.cadence !== undefined) updateData.cadence = data.cadence;
    if (data.targetDays !== undefined) updateData.targetDays = data.targetDays;
    if (data.color !== undefined) updateData.color = data.color;
    if (data.order !== undefined) updateData.order = data.order;
    if (data.archived !== undefined) updateData.archivedAt = data.archived ? new Date() : null;

    const habit = await prisma.habit.update({ where: { id }, data: updateData });

    return NextResponse.json({ habit });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return buildErrorResponse(new AppError('Invalid input data', 400));
    }
    return buildErrorResponse(error);
  }
}

// DELETE /api/habits/[id] - Delete a habit (and its logs via cascade)
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

    const existing = await prisma.habit.findFirst({ where: { id, userId: user.id } });
    if (!existing) {
      return buildErrorResponse(new AppError('Habit not found', 404));
    }

    await prisma.habit.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    return buildErrorResponse(error);
  }
}
