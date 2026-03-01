import { NextResponse } from 'next/server';
import { getUserByUsername, getUserByEmail, stripPassword } from '@/lib/db';
import { verifyPassword, createToken, COOKIE_NAME, COOKIE_OPTIONS } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    // ── Step 1: Parse input ──
    let body: any;
    try {
      body = await request.json();
    } catch (parseErr) {
      console.error('LOGIN_ERROR: Failed to parse request body:', parseErr);
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const username = (body.username || '').trim().toLowerCase();
    const password = body.password || '';

    console.log('[Login] Attempt for:', username ? `"${username}"` : 'EMPTY');

    if (!username || !password) {
      console.error('LOGIN_ERROR: Missing credentials');
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
    }

    // ── Step 2: Find user by username or email ──
    let user: any = null;
    try {
      user = await getUserByUsername(username);
      if (!user) user = await getUserByEmail(username);
    } catch (dbErr: any) {
      console.error('LOGIN_ERROR: Database lookup failed:', {
        message: dbErr?.message,
        code: dbErr?.code,
        stack: dbErr?.stack,
      });
      return NextResponse.json(
        { error: 'Database error. Please try again.' },
        { status: 500 },
      );
    }

    if (!user) {
      console.error('LOGIN_ERROR: No user found for:', username);
      return NextResponse.json({ error: 'No account found with that username or email' }, { status: 401 });
    }

    // ── Step 3: Check password ──
    if (!user.passwordHash) {
      console.error('LOGIN_ERROR: Google-only account, no password set:', username);
      return NextResponse.json(
        { error: 'This account uses Google sign-in. Please use the "Sign in with Google" button.' },
        { status: 401 },
      );
    }

    let passwordValid = false;
    try {
      passwordValid = verifyPassword(password, user.passwordHash);
    } catch (bcryptErr) {
      console.error('LOGIN_ERROR: bcrypt verify crashed:', bcryptErr);
      return NextResponse.json({ error: 'Authentication error. Please try again.' }, { status: 500 });
    }

    if (!passwordValid) {
      console.error('LOGIN_ERROR: Invalid password for:', username);
      return NextResponse.json(
        { error: 'Invalid password. If you signed up with Google, please use the "Sign in with Google" button instead.' },
        { status: 401 },
      );
    }

    // ── Step 4: Create JWT and return ──
    const token = await createToken(user.id);
    console.log('[Login] SUCCESS — user:', user.id, 'username:', username);
    const response = NextResponse.json({ user: stripPassword(user) });
    response.cookies.set(COOKIE_NAME, token, COOKIE_OPTIONS);
    return response;

  } catch (outerErr: any) {
    console.error('LOGIN_ERROR: UNHANDLED EXCEPTION:', {
      message: outerErr?.message,
      name: outerErr?.name,
      stack: outerErr?.stack,
    });
    return NextResponse.json(
      { error: `Unexpected server error: ${outerErr?.message || 'Unknown error'}` },
      { status: 500 },
    );
  }
}
