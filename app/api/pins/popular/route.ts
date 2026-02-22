import { NextResponse } from 'next/server';
import { getPopularPins } from '@/lib/db';

/**
 * GET /api/pins/popular?sortBy=views|likes|comments&limit=20&category=Fashion
 *
 * Returns pins sorted by the given metric.
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const sortBy = (url.searchParams.get('sortBy') || 'views') as 'views' | 'likes' | 'comments';
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const category = url.searchParams.get('category') || undefined;

    let pins = await getPopularPins(sortBy);

    if (category && category !== 'All') {
      pins = pins.filter(p => p.category === category);
    }

    return NextResponse.json(pins.slice(0, Math.min(limit, 100)));
  } catch {
    return NextResponse.json([], { status: 500 });
  }
}
