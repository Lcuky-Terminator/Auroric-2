import { NextResponse } from 'next/server';
import { toggleFollow } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

    const { id } = await params;
    if (user.id === id) return NextResponse.json({ error: 'Cannot follow yourself' }, { status: 400 });

    const following = await toggleFollow(user.id, id);
    return NextResponse.json({ following });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
