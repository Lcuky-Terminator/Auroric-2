import { NextResponse } from 'next/server';
import { getUserByUsername, getUserByEmail, createUser, type ServerUser } from '@/lib/db';
import { hashPassword, createToken, COOKIE_NAME, COOKIE_OPTIONS } from '@/lib/auth';
import { Client, Users, ID } from 'node-appwrite';

// Server-side Appwrite client (admin) for creating Auth accounts
const awClient = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT || 'https://nyc.cloud.appwrite.io/v1')
  .setProject(process.env.APPWRITE_PROJECT_ID || '')
  .setKey(process.env.APPWRITE_API_KEY || '');

const awUsers = new Users(awClient);

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
      return NextResponse.json(
        { error: `Missing required fields: ${missing.join(', ')}` },
        { status: 400 },
      );
    }

    const USERNAME_REGEX = /^[a-z0-9_]{3,20}$/;
    if (!USERNAME_REGEX.test(username)) {
      return NextResponse.json(
        { error: 'Username must be 3-20 characters using only lowercase letters, numbers, and underscores' },
        { status: 400 },
      );
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }

    // ── Step 2: Check for existing users ──
    try {
      if (await getUserByUsername(username)) {
        return NextResponse.json({ error: 'Username already exists' }, { status: 409 });
      }
      if (await getUserByEmail(email)) {
        return NextResponse.json({ error: 'Email already in use' }, { status: 409 });
      }
    } catch (dbErr: any) {
      console.error('SIGNUP_ERROR: DB lookup failed:', dbErr?.message);
      return NextResponse.json({ error: 'Database error. Please try again.' }, { status: 500 });
    }

    // ── Step 3: Create Appwrite Auth account ──
    // This is the primary auth identity — Appwrite handles email/password storage
    let appwriteUserId: string;
    try {
      const awUser = await awUsers.create(
        ID.unique(),
        email,
        undefined,    // phone
        password,
        displayName,
      );
      appwriteUserId = awUser.$id;
      console.log('[Signup] Appwrite Auth account created:', appwriteUserId);
    } catch (awErr: any) {
      console.error('SIGNUP_ERROR: Appwrite Auth create failed:', {
        message: awErr?.message,
        code: awErr?.code,
        type: awErr?.type,
      });
      // If user already exists in Appwrite Auth (e.g. from Google), that's an error here
      if (awErr?.code === 409) {
        return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 });
      }
      return NextResponse.json(
        { error: `Failed to create auth account: ${awErr?.message || 'Unknown error'}` },
        { status: 500 },
      );
    }

    // ── Step 4: Create user document in Appwrite Database ──
    const userId = `user-${Date.now()}`;
    const serverUser: ServerUser = {
      id: userId,
      username,
      displayName,
      email,
      passwordHash: hashPassword(password),
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
      console.log('[Signup] DB user created:', user.id);
    } catch (createErr: any) {
      console.error('SIGNUP_ERROR: Appwrite DB createUser() failed:', {
        message: createErr?.message,
        code: createErr?.code,
      });
      return NextResponse.json(
        { error: `Failed to create account: ${createErr?.message || 'Database error'}` },
        { status: 500 },
      );
    }

    // ── Step 5: Create JWT token for server-side session ──
    let token: string;
    try {
      token = await createToken(user.id);
    } catch (tokenErr) {
      console.error('SIGNUP_ERROR: JWT creation failed:', tokenErr);
      return NextResponse.json({ error: 'Account created but login failed. Please try logging in.' }, { status: 500 });
    }

    // ── Step 6: Return success with appwriteUserId for client-side verification ──
    console.log('[Signup] SUCCESS — user:', user.id, '| appwriteAuth:', appwriteUserId);
    const response = NextResponse.json({
      user,
      appwriteUserId,
      needsVerification: true,
    });
    response.cookies.set(COOKIE_NAME, token, COOKIE_OPTIONS);
    return response;

  } catch (outerErr: any) {
    console.error('SIGNUP_ERROR: UNHANDLED:', {
      message: outerErr?.message,
      stack: outerErr?.stack,
    });
    return NextResponse.json(
      { error: `Unexpected error: ${outerErr?.message || 'Unknown'}` },
      { status: 500 },
    );
  }
}
