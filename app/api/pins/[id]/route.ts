import { NextResponse } from 'next/server';
import { getPin, deletePin as dbDeletePin, incrementPinViews } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const pin = await getPin(id);
    if (!pin) return NextResponse.json({ error: 'Pin not found' }, { status: 404 });

    // Increment view count (fire and forget — don't block the response)
    incrementPinViews(id).catch(() => {});

    return NextResponse.json(pin);
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

    const { id } = await params;
    const pin = await getPin(id);
    if (!pin) return NextResponse.json({ ok: true }); // Already deleted — idempotent
    if (pin.authorId !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    await dbDeletePin(id);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
