import { NextResponse } from 'next/server';
import { getTrendingPins } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '30');
    const category = url.searchParams.get('category') || undefined;

    let pins = await getTrendingPins();

    if (category && category !== 'All') {
      pins = pins.filter(p => p.category === category);
    }

    return NextResponse.json(pins.slice(0, Math.min(limit, 100)));
  } catch {
    return NextResponse.json([], { status: 500 });
  }
}
