import { NextResponse } from 'next/server';
import { updateUser, getUserFull } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

/**
 * POST /api/auth/verify
 *
 * Called by the /verify page after Appwrite's updateVerification succeeds.
 * Updates the emailVerified flag in our Appwrite Database collection.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // If called from the verify page with appwriteVerified flag
    if (body.appwriteVerified) {
      // Try to get the current user from JWT cookie
      const user = await getCurrentUser();
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
