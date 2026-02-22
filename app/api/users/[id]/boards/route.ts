import { NextResponse } from 'next/server';
import { getBoardsByUser } from '@/lib/db';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const boards = await getBoardsByUser(id);
    return NextResponse.json(boards);
  } catch {
    return NextResponse.json([], { status: 500 });
  }
}
