import { NextResponse } from 'next/server';
import { getBoard, updateBoard as dbUpdateBoard, deleteBoard as dbDeleteBoard } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const board = await getBoard(id);
    if (!board) return NextResponse.json({ error: 'Board not found' }, { status: 404 });
    return NextResponse.json(board);
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

    const { id } = await params;
    const board = await getBoard(id);
    if (!board) return NextResponse.json({ error: 'Board not found' }, { status: 404 });
    if (board.ownerId !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await request.json();
    const updated = await dbUpdateBoard(id, body);
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

    const { id } = await params;
    const board = await getBoard(id);
    if (!board) return NextResponse.json({ error: 'Board not found' }, { status: 404 });
    if (board.ownerId !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    await dbDeleteBoard(id);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
