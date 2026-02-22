import { NextResponse } from 'next/server';
import { getPinsByUser, getSavedPinsByUser } from '@/lib/db';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const url = new URL(request.url);
    const type = url.searchParams.get('type');

    if (type === 'saved') {
      return NextResponse.json(await getSavedPinsByUser(id));
    }
    return NextResponse.json(await getPinsByUser(id));
  } catch {
    return NextResponse.json([], { status: 500 });
  }
}
