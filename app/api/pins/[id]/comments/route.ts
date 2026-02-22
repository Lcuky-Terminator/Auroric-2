import { NextResponse } from 'next/server';
import { addComment } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

    const { id } = await params;
    const { text } = await request.json();
    if (!text?.trim()) return NextResponse.json({ error: 'Comment text is required' }, { status: 400 });

    const comment = await addComment(id, user.id, text.trim());
    if (!comment) return NextResponse.json({ error: 'Pin not found' }, { status: 404 });

    return NextResponse.json(comment, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
