import { NextResponse } from 'next/server';
import { getUserById, updateUser, isBlocked } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    // Check if target user has blocked the current user
    const currentUser = await getCurrentUser();
    if (currentUser) {
      const blocked = await isBlocked(id, currentUser.id);
      if (blocked) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const user = await getUserById(id);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    return NextResponse.json(user);
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

    const { id } = await params;
    if (currentUser.id !== id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await request.json();
    // Only allow safe fields to be updated
    const allowedFields = ['displayName', 'email', 'bio', 'avatar', 'website', 'settings', 'gender', 'dob', 'country', 'publicKey'];
    const safeUpdates: Record<string, any> = {};
    for (const key of allowedFields) {
      if (body[key] !== undefined) safeUpdates[key] = body[key];
    }

    const updated = await updateUser(id, safeUpdates);
    if (!updated) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
