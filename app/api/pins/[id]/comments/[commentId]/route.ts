import { NextResponse } from 'next/server';
import { deleteComment } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

    const { id, commentId } = await params;
    const deleted = await deleteComment(id, commentId, user.id);
    if (!deleted) return NextResponse.json({ error: 'Comment not found or forbidden' }, { status: 404 });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
