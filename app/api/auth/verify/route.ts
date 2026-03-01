import { NextResponse } from 'next/server';
import { updateUser, getUserFull, getUserByEmail } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

/**
 * POST /api/auth/verify
 *
 * Called by the /verify page after Appwrite's updateVerification succeeds.
 * Updates the emailVerified flag in our Appwrite Database collection.
 *
 * Supports two modes:
 *  1. JWT-authenticated: gets user from cookie (same device)
 *  2. userId + email fallback: when the verifying device may not have a JWT
 *     session (e.g. user clicked the link on their phone)
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (body.appwriteVerified) {
      // Try JWT cookie first (same device)
      let user = await getCurrentUser();

      // Fallback: use email from the request body to find the user
      if (!user && body.email) {
        try {
          user = await getUserByEmail(body.email);
        } catch {
          // Ignore
        }
      }

      if (user) {
        await updateUser(user.id, { emailVerified: true } as any);
        return NextResponse.json({ verified: true, message: 'Email verified in database' });
      }
    }

    return NextResponse.json({ verified: false, message: 'Could not update verification status' });
  } catch (err: any) {
    console.error('[verify] Error:', err?.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * GET /api/auth/verify
 *
 * Quick endpoint the client can poll to see if the current user is verified.
 */
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ verified: false });

    const full = await getUserFull(user.id);
    return NextResponse.json({ verified: full?.emailVerified ?? false });
  } catch {
    return NextResponse.json({ verified: false });
  }
}
