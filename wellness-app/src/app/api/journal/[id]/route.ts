import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';
import { requireAuth } from '@/lib/auth/server';
import { updateJournalEntrySchema } from '@/lib/validations/api';
import { AppError, buildErrorResponse } from '@/lib/utils/error-handler';
import { 
  encrypt, 
  decrypt,
  packEncryptedData,
  unpackEncryptedData,
  calculateWordCount,
  calculateReadingTime
} from '@/lib/security/encryption';

// GET /api/journal/[id] - Get a specific journal entry (with decrypted content)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify authentication
    const user = await requireAuth(request);
    if (!user) {
      return buildErrorResponse(new AppError('Unauthorized', 401));
    }

    const { id } = await params;

    // Get the journal entry
    const entry = await prisma.journalEntry.findFirst({
      where: {
        id,
        userId: user.id, // Ensure user owns this entry
      },
      include: {
        reflections: {
          orderBy: { createdAt: 'desc' },
          take: 5, // Get latest 5 reflections
        },
      },
    });

    if (!entry) {
      return buildErrorResponse(new AppError('Journal entry not found', 404));
    }

    // Decrypt the content
    const encryptedData = unpackEncryptedData(entry.content, entry.contentIv);
    const decryptedContent = decrypt(encryptedData);

    // Update last viewed timestamp
    await prisma.journalEntry.update({
      where: { id },
      data: { lastViewedAt: new Date() },
    });

    // Return entry with decrypted content
    return NextResponse.json({
      entry: {
        ...entry,
        content: decryptedContent, // Replace encrypted content with decrypted
      }
    });
  } catch (error) {
    return buildErrorResponse(error);
  }
}

// PUT /api/journal/[id] - Update a journal entry
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify authentication
    const user = await requireAuth(request);
    if (!user) {
      return buildErrorResponse(new AppError('Unauthorized', 401));
    }

    const { id } = await params;
    const body = await request.json();
    const validatedData = updateJournalEntrySchema.parse(body);

    // Check if entry exists and user owns it
    const existingEntry = await prisma.journalEntry.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!existingEntry) {
      return buildErrorResponse(new AppError('Journal entry not found', 404));
    }

    // Prepare update data
    const updateData: any = {};

    if (validatedData.title !== undefined) {
      updateData.title = validatedData.title;
    }

    if (validatedData.content !== undefined) {
      // Encrypt new content
      const encryptedData = encrypt(validatedData.content);
      const { content: encryptedContent, iv } = packEncryptedData(encryptedData);
      
      updateData.content = encryptedContent;
      updateData.contentIv = iv;
      updateData.wordCount = calculateWordCount(validatedData.content);
      updateData.readingTime = calculateReadingTime(updateData.wordCount);
    }

    if (validatedData.mood !== undefined) {
      updateData.mood = validatedData.mood;
    }

    if (validatedData.tags !== undefined) {
      updateData.tags = validatedData.tags;
    }

    if (validatedData.isPrivate !== undefined) {
      updateData.isPrivate = validatedData.isPrivate;
    }

    // Update the entry
    const updatedEntry = await prisma.journalEntry.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        title: true,
        mood: true,
        tags: true,
        wordCount: true,
        readingTime: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      message: 'Journal entry updated successfully',
      entry: updatedEntry,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return buildErrorResponse(new AppError('Invalid input data', 400));
    }
    return buildErrorResponse(error);
  }
}

// DELETE /api/journal/[id] - Delete a journal entry
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify authentication
    const user = await requireAuth(request);
    if (!user) {
      return buildErrorResponse(new AppError('Unauthorized', 401));
    }

    const { id } = await params;

    // Check if entry exists and user owns it
    const existingEntry = await prisma.journalEntry.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!existingEntry) {
      return buildErrorResponse(new AppError('Journal entry not found', 404));
    }

    // Delete the entry (reflections will be cascade deleted)
    await prisma.journalEntry.delete({
      where: { id },
    });

    return NextResponse.json({
      message: 'Journal entry deleted successfully',
    });
  } catch (error) {
    return buildErrorResponse(error);
  }
}
