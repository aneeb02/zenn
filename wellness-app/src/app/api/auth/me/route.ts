import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/server';

export async function GET(request: NextRequest) {
  try {
    const user = await getServerSession(request);

    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    return NextResponse.json({ user });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get user session' },
      { status: 500 }
    );
  }
}
