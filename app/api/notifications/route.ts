import { NextResponse } from 'next/server';
import { getNotifications } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json([], { status: 401 });

    const notifications = await getNotifications(user.id);
    return NextResponse.json(notifications);
  } catch {
    return NextResponse.json([], { status: 500 });
  }
}
