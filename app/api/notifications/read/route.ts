import { NextResponse } from 'next/server';
import { markNotificationRead, markAllNotificationsRead } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

    const body = await request.json();

    if (body.all) {
      await markAllNotificationsRead(user.id);
    } else if (body.id) {
      await markNotificationRead(body.id);
    } else {
      return NextResponse.json({ error: 'Provide id or all:true' }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
