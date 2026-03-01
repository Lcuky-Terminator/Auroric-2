import { NextResponse } from 'next/server';
import { getUserByUsername, getUserByEmail, createUser, type ServerUser } from '@/lib/db';
import { hashPassword, createToken, COOKIE_NAME, COOKIE_OPTIONS } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    // ── Step 1: Parse and validate input ──
    let body: any;
    try {
      body = await request.json();
    } catch (parseErr) {
      console.error('SIGNUP_ERROR: Failed to parse request body:', parseErr);
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const { username, displayName, email, password } = body;

    console.log('[Signup] Received fields:', {
      username: username ? `"${username}"` : 'MISSING',
      displayName: displayName ? `"${displayName}"` : 'MISSING',
      email: email ? `"${email}"` : 'MISSING',
      password: password ? '***SET***' : 'MISSING',
    });

    if (!username || !displayName || !email || !password) {
      const missing = [
        !username && 'username',
        !displayName && 'displayName',
        !email && 'email',
        !password && 'password',
      ].filter(Boolean);
      console.error('SIGNUP_ERROR: Missing required fields:', missing.join(', '));
      return NextResponse.json(
        { error: `Missing required fields: ${missing.join(', ')}` },
        { status: 400 },
      );
    }

    // ── Step 2: Validate username format ──
    const USERNAME_REGEX = /^[a-z0-9_]{3,20}$/;
    if (!USERNAME_REGEX.test(username)) {
      console.error('SIGNUP_ERROR: Invalid username format:', username);
      return NextResponse.json(
        { error: 'Username must be 3-20 characters using only lowercase letters, numbers, and underscores' },
        { status: 400 },
      );
    }

    if (password.length < 8) {
      console.error('SIGNUP_ERROR: Password too short');
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }

    // ── Step 3: Check for existing user ──
    let existingByUsername: any = null;
    try {
      existingByUsername = await getUserByUsername(username);
    } catch (dbErr) {
      console.error('SIGNUP_ERROR: Appwrite DB query failed (getUserByUsername):', dbErr);
      return NextResponse.json(
        { error: 'Database error while checking username. Please try again.' },
        { status: 500 },
      );
    }

    if (existingByUsername) {
      console.error('SIGNUP_ERROR: Username already taken:', username);
      return NextResponse.json({ error: 'Username already exists' }, { status: 409 });
    }

    let existingByEmail: any = null;
    try {
      existingByEmail = await getUserByEmail(email);
    } catch (dbErr) {
      console.error('SIGNUP_ERROR: Appwrite DB query failed (getUserByEmail):', dbErr);
      return NextResponse.json(
        { error: 'Database error while checking email. Please try again.' },
        { status: 500 },
      );
    }

    if (existingByEmail) {
      console.error('SIGNUP_ERROR: Email already in use:', email);
      return NextResponse.json({ error: 'Email already in use' }, { status: 409 });
    }

    // ── Step 4: Hash password ──
    let passwordHash: string;
    try {
      passwordHash = hashPassword(password);
    } catch (hashErr) {
      console.error('SIGNUP_ERROR: bcrypt hash failed:', hashErr);
      return NextResponse.json(
        { error: 'Failed to process password. Please try again.' },
        { status: 500 },
      );
    }

    // ── Step 5: Create user in Appwrite Database (single source of truth) ──
    const userId = `user-${Date.now()}`;
    const serverUser: ServerUser = {
      id: userId,
      username,
      displayName,
      email,
      passwordHash,
      bio: '',
      avatar: '',
      website: '',
      followers: [],
      following: [],
      createdAt: new Date().toISOString(),
      emailVerified: false,
      isVerified: false,
      verificationType: 'none',
      isPromoted: false,
      passwordChangeCount: 0,
      accountStatus: 'active',
      settings: {
        privateProfile: false,
        showActivity: true,
        allowMessages: true,
        allowNotifications: true,
        emailOnNewFollower: true,
        emailOnPinInteraction: true,
        theme: 'dark',
      },
    };

    let user: any;
    try {
      user = await createUser(serverUser);
      console.log('[Signup] User created successfully in Appwrite DB:', user.id);
    } catch (createErr: any) {
      console.error('SIGNUP_ERROR: Appwrite DB createUser() CRASHED:', {
        message: createErr?.message,
        code: createErr?.code,
        type: createErr?.type,
        stack: createErr?.stack,
      });
      return NextResponse.json(
        { error: `Failed to create account: ${createErr?.message || 'Database error'}` },
        { status: 500 },
      );
    }

    // ── Step 6: Create JWT token ──
    let token: string;
    try {
      token = await createToken(user.id);
    } catch (tokenErr) {
      console.error('SIGNUP_ERROR: JWT token creation failed:', tokenErr);
      return NextResponse.json(
        { error: 'Account created but failed to sign in. Please try logging in.' },
        { status: 500 },
      );
    }

    // ── Step 7: Return success ──
    console.log('[Signup] SUCCESS — user:', user.id, 'username:', username);
    const response = NextResponse.json({
      user,
      needsVerification: true,
    });
    response.cookies.set(COOKIE_NAME, token, COOKIE_OPTIONS);
    return response;

  } catch (outerErr: any) {
    // This catch should NEVER be reached if the above try/catch blocks work
    // If it IS reached, something truly unexpected happened
    console.error('SIGNUP_ERROR: UNHANDLED EXCEPTION:', {
      message: outerErr?.message,
      name: outerErr?.name,
      code: outerErr?.code,
      stack: outerErr?.stack,
    });
    return NextResponse.json(
      { error: `Unexpected server error: ${outerErr?.message || 'Unknown error'}` },
      { status: 500 },
    );
  }
}
