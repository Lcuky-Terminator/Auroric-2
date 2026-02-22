import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { updateUser, getUserByEmail, getUserFull } from '@/lib/db';
import { Users, Client } from 'node-appwrite';

// Server-side Appwrite client for reading the Auth user
const awClient = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT || 'https://nyc.cloud.appwrite.io/v1')
  .setProject(process.env.APPWRITE_PROJECT_ID || '')
  .setKey(process.env.APPWRITE_API_KEY || '');

const awUsers = new Users(awClient);

/**
 * POST /api/auth/verify
 *
 * Called after the client successfully runs `account.updateVerification()`.
 * We verify the claim server-side by checking the Appwrite Auth user's
 * `emailVerification` flag and then mirror it to the custom DB user.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));

    // Try to identify the user via the existing JWT cookie first
    let dbUser = await getCurrentUser();

    // Fallback: if the body contains the Appwrite userId we can look up
    // the Auth user's email and find the matching DB user.
    if (!dbUser && body.userId) {
      try {
        const awUser = await awUsers.get(body.userId);
        if (awUser.emailVerification) {
          const dbMatch = await getUserByEmail(awUser.email);
          if (dbMatch) {
            dbUser = { ...dbMatch, passwordHash: undefined } as any;
            // Also update the DB
            await updateUser(dbMatch.id, { emailVerified: true } as any);
            return NextResponse.json({ verified: true });
          }
        }
      } catch (err: any) {
        console.error('[Verify] Appwrite Auth lookup failed:', err?.message);
      }
    }

    if (!dbUser) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Look up the Appwrite Auth user by email
    try {
      const list = await awUsers.list([`equal("email", ["${dbUser.email}"])`]);
      const awUser = list.users[0];

      if (awUser?.emailVerification) {
        await updateUser(dbUser.id, { emailVerified: true } as any);
        return NextResponse.json({ verified: true });
      }

      return NextResponse.json({ error: 'Email not yet verified in Appwrite' }, { status: 400 });
    } catch (err: any) {
      console.error('[Verify] Failed to check Appwrite Auth:', err?.message);
      return NextResponse.json({ error: 'Verification check failed' }, { status: 500 });
    }
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * GET /api/auth/verify?check=1
 *
 * Quick endpoint the client can poll to see if the current user is verified.
 */
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ verified: false });

    // Re-read from DB in case it was updated
    const full = await getUserFull(user.id);
    return NextResponse.json({ verified: full?.emailVerified ?? false });
  } catch {
    return NextResponse.json({ verified: false });
  }
}
