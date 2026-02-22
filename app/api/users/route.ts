import { NextResponse } from 'next/server';
import { getAllUsers } from '@/lib/db';

export async function GET() {
  try {
    const users = await getAllUsers();
    return NextResponse.json(users);
  } catch (err) {
    console.error('[API] GET /api/users error:', err);
    return NextResponse.json([]);
  }
}
