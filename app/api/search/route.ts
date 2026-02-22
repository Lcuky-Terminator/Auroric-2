import { NextResponse } from 'next/server';
import { searchPins, searchUsers, searchBoards } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const query = url.searchParams.get('q') || '';
    const category = url.searchParams.get('category') || undefined;

    if (!query.trim()) {
      return NextResponse.json({ pins: [], users: [], boards: [] });
    }

    const [pins, users, boards] = await Promise.all([
      searchPins(query, category),
      searchUsers(query),
      searchBoards(query),
    ]);

    return NextResponse.json({ pins, users, boards });
  } catch {
    return NextResponse.json({ pins: [], users: [], boards: [] }, { status: 500 });
  }
}
