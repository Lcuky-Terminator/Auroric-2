import { NextResponse } from 'next/server';
import { updateUser, getUserFull } from '@/lib/db';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

/**
 * POST /api/auth/verify
 *
 * Verifies a user's email using a JWT token sent via Resend.
 * The token contains userId, email, and purpose='email-verification'.
 */
export async function POST(request: Request) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json({ error: 'Missing verification token' }, { status: 400 });
    }

    // Verify the JWT token
    let payload: any;
    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch (err: any) {
      if (err.name === 'TokenExpiredError') {
        return NextResponse.json({ error: 'Verification link has expired. Please request a new one.' }, { status: 400 });
      }
      return NextResponse.json({ error: 'Invalid verification token.' }, { status: 400 });
    }

    if (payload.purpose !== 'email-verification') {
      return NextResponse.json({ error: 'Invalid token purpose' }, { status: 400 });
    }

    // Update the user's emailVerified flag
    const user = await getUserFull(payload.userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.emailVerified) {
      return NextResponse.json({ verified: true, message: 'Email already verified' });
    }

    await updateUser(payload.userId, { emailVerified: true } as any);
    return NextResponse.json({ verified: true, message: 'Email verified successfully!' });
  } catch {
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
    // Import dynamically to avoid circular issues
    const { getCurrentUser } = await import('@/lib/auth');
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ verified: false });

    const full = await getUserFull(user.id);
    return NextResponse.json({ verified: full?.emailVerified ?? false });
  } catch {
    return NextResponse.json({ verified: false });
  }
}
