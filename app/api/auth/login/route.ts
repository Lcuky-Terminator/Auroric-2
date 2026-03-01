import { NextResponse } from 'next/server';
import { getUserByUsername, getUserByEmail, stripPassword } from '@/lib/db';
import { verifyPassword, createToken, COOKIE_NAME, COOKIE_OPTIONS } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const username = (body.username || '').trim().toLowerCase();
    const password = body.password || '';

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
    }

    // Find user by username or email (case-insensitive since we lowercase the input)
    let user = await getUserByUsername(username);
    if (!user) user = await getUserByEmail(username);
    if (!user) {
      return NextResponse.json({ error: 'No account found with that username or email' }, { status: 401 });
    }

    if (!user.passwordHash) {
      // User signed up via Google and has no password set
      return NextResponse.json({ error: 'This account uses Google sign-in. Please use the "Sign in with Google" button.' }, { status: 401 });
    }

    if (!verifyPassword(password, user.passwordHash)) {
      return NextResponse.json({ error: 'Invalid password. If you signed up with Google, please use the "Sign in with Google" button instead.' }, { status: 401 });
    }

    const token = await createToken(user.id);
    const response = NextResponse.json({ user: stripPassword(user) });
    response.cookies.set(COOKIE_NAME, token, COOKIE_OPTIONS);
    return response;
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
