import { NextResponse } from 'next/server';
import { getUserByUsername, getUserByEmail, createUser, type ServerUser } from '@/lib/db';
import { hashPassword, createToken, COOKIE_NAME, COOKIE_OPTIONS } from '@/lib/auth';
import { Users, ID } from 'node-appwrite';
import { Client } from 'node-appwrite';

// Server-side Appwrite client (admin) for creating Auth accounts
const awClient = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT || 'https://nyc.cloud.appwrite.io/v1')
  .setProject(process.env.APPWRITE_PROJECT_ID || '')
  .setKey(process.env.APPWRITE_API_KEY || '');

const awUsers = new Users(awClient);

export async function POST(request: Request) {
  try {
    const { username, displayName, email, password } = await request.json();

    if (!username || !displayName || !email || !password) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    // ── Username format enforcement (server-side) ──
    const USERNAME_REGEX = /^[a-z0-9_]{3,20}$/;
    if (!USERNAME_REGEX.test(username)) {
      return NextResponse.json(
        { error: 'Username must be 3-20 characters using only lowercase letters, numbers, and underscores' },
        { status: 400 },
      );
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    /*
     * ─── External Email Validation (Optional) ───────────────────────
     * Before creating the account you can pre-validate the email with
     * a 3rd-party service such as ZeroBounce or Hunter.io:
     *
     *   const isRealEmail = await validateWithZeroBounce(email);
     *   // or: const isRealEmail = await validateWithHunter(email);
     *   if (!isRealEmail) {
     *     return NextResponse.json(
     *       { error: 'Invalid email domain — please use a real address' },
     *       { status: 400 },
     *     );
     *   }
     *
     * Pseudo-code implementation:
     *
     *   async function validateWithZeroBounce(email: string): Promise<boolean> {
     *     const res = await fetch(
     *       `https://api.zerobounce.net/v2/validate?api_key=${process.env.ZEROBOUNCE_API_KEY}&email=${email}`
     *     );
     *     const data = await res.json();
     *     return data.status === 'valid';
     *   }
     * ────────────────────────────────────────────────────────────────
     */

    if (await getUserByUsername(username)) {
      return NextResponse.json({ error: 'Username already exists' }, { status: 409 });
    }

    if (await getUserByEmail(email)) {
      return NextResponse.json({ error: 'Email already in use' }, { status: 409 });
    }

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
      emailVerified: false, // ← starts unverified
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

    const user = await createUser(serverUser);

    // ── Also create an Appwrite Auth account (for email verification) ──
    // Appwrite Auth manages the verification email flow; the custom DB
    // user is the source of truth for app data.
    let appwriteUserId: string | null = null;
    try {
      const awUser = await awUsers.create(
        ID.unique(),
        email,
        undefined,    // phone
        password,
        displayName,
      );
      appwriteUserId = awUser.$id;
    } catch (err: any) {
      // User may already exist in Appwrite Auth (e.g. from Google sign-in)
      // — that's fine, we still proceed.
      console.warn('[Signup] Appwrite Auth account creation skipped:', err?.message);
    }

    const token = await createToken(user.id);
    const response = NextResponse.json({
      user,
      appwriteUserId,   // client uses this to call createVerification
      needsVerification: true,
    });
    response.cookies.set(COOKIE_NAME, token, COOKIE_OPTIONS);
    return response;
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
