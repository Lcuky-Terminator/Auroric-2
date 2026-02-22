import { NextResponse } from 'next/server';
import { getUserByUsername, getUserByEmail, stripPassword } from '@/lib/db';
import { verifyPassword, createToken, COOKIE_NAME, COOKIE_OPTIONS } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
    }

    // Find user by username or email
    let user = await getUserByUsername(username);
    if (!user) user = await getUserByEmail(username);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 });
    }

    if (!verifyPassword(password, user.passwordHash)) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
    }

    const token = await createToken(user.id);
    const response = NextResponse.json({ user: stripPassword(user) });
    response.cookies.set(COOKIE_NAME, token, COOKIE_OPTIONS);
    return response;
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
