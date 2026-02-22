import { NextResponse } from 'next/server';
import { getAllPins, getPinsPaginated, createPin as dbCreatePin } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import type { Pin } from '@/lib/types';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '0');
    const limit = parseInt(url.searchParams.get('limit') || '0');
    const category = url.searchParams.get('category') || undefined;

    // If pagination params provided, return paginated result
    if (page > 0 && limit > 0) {
      const result = await getPinsPaginated(page, Math.min(limit, 50), category);
      return NextResponse.json(result);
    }

    // Legacy: return all pins (for backward compatibility)
    const pins = await getAllPins();
    // Filter out private pins for public API
    const publicPins = pins.filter((p: Pin) => !p.isPrivate);
    return NextResponse.json(publicPins);
  } catch (err) {
    console.error('[API] GET /api/pins error:', err);
    return NextResponse.json([]);
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    if (!body.title || !body.imageUrl) {
      return NextResponse.json({ error: 'Title and image URL are required' }, { status: 400 });
    }

    const now = new Date().toISOString();
    const pin: Pin = {
      id: `pin-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      title: body.title,
      description: body.description || '',
      imageUrl: body.imageUrl,
      sourceUrl: body.sourceUrl || '',
      authorId: user.id,
      boardId: body.boardId || undefined,
      tags: body.tags || [],
      category: body.category || 'All',
      likes: [],
      saves: [],
      comments: [],
      views: 0,
      isPrivate: body.isPrivate || false,
      createdAt: now,
      updatedAt: now,
    };

    const created = await dbCreatePin(pin);
    return NextResponse.json(created, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
