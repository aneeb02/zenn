import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ message: 'Logged out successfully' });
  
  // Delete the auth token cookie
  response.cookies.delete('auth-token');
  
  return response;
}
