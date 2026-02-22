import { NextResponse } from 'next/server';
import { savePinToBoard } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

    const { id } = await params;
    const { boardId } = await request.json();
    if (!boardId) return NextResponse.json({ error: 'boardId is required' }, { status: 400 });

    const ok = await savePinToBoard(id, boardId);
    if (!ok) return NextResponse.json({ error: 'Pin or board not found' }, { status: 404 });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
