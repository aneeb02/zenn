import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/server';
import { prisma } from '@/lib/db/prisma';

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const profileData = await request.json();

    // Create or update profile
    const profile = await prisma.profile.upsert({
      where: { userId: user.id },
      update: {
        goals: profileData.goals,
        healthConditions: profileData.healthConditions,
        tone: profileData.tone,
        notificationTimes: profileData.notificationTimes,
        focusSessionLength: profileData.focusSessionLength,
      },
      create: {
        userId: user.id,
        goals: profileData.goals,
        healthConditions: profileData.healthConditions,
        tone: profileData.tone,
        notificationTimes: profileData.notificationTimes,
        focusSessionLength: profileData.focusSessionLength,
      },
    });

    return NextResponse.json({ profile });
  } catch (error) {
    console.error('Profile save error:', error);
    return NextResponse.json(
      { error: 'Failed to save profile' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    const profile = await prisma.profile.findUnique({
      where: { userId: user.id },
    });

    return NextResponse.json({ profile });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}