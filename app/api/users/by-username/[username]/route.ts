import { NextResponse } from 'next/server';
import { getUserByUsername, stripPassword } from '@/lib/db';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;
    const user = await getUserByUsername(username);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    return NextResponse.json(stripPassword(user));
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
