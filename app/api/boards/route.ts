import { NextResponse } from 'next/server';
import { getAllBoards, createBoard as dbCreateBoard } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import type { Board } from '@/lib/types';

export async function GET() {
  try {
    const boards = await getAllBoards();
    return NextResponse.json(boards);
  } catch (err) {
    console.error('[API] GET /api/boards error:', err);
    return NextResponse.json([]);
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

    const body = await request.json();
    if (!body.name) return NextResponse.json({ error: 'Board name is required' }, { status: 400 });

    const now = new Date().toISOString();
    const board: Board = {
      id: `board-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: body.name,
      description: body.description || '',
      coverImage: body.coverImage || '',
      ownerId: user.id,
      pins: [],
      followers: [],
      collaborators: [],
      isPrivate: body.isPrivate || false,
      category: body.category || 'All',
      createdAt: now,
      updatedAt: now,
    };

    const created = await dbCreateBoard(board);
    return NextResponse.json(created, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
