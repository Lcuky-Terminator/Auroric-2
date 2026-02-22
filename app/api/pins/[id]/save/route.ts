import { NextResponse } from 'next/server';
import { toggleSavePin } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

    const { id } = await params;
    const saved = await toggleSavePin(id, user.id);
    return NextResponse.json({ saved });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
