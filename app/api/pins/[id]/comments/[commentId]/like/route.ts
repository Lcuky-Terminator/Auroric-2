import { NextResponse } from 'next/server';
import { toggleLikeComment } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

    const { id, commentId } = await params;
    const liked = await toggleLikeComment(id, commentId, user.id);
    return NextResponse.json({ liked });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
