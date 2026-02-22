import { NextResponse } from 'next/server';
import { getUserByEmail } from '@/lib/db';
import { Client, Account } from 'node-appwrite';

/**
 * POST /api/auth/forgot-password
 *
 * Accepts { email } and triggers Appwrite's password recovery email.
 * The user receives a link like:
 *   <resetUrl>?userId=xxx&secret=yyy&expire=zzz
 */
export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Verify the user exists in our DB
    const user = await getUserByEmail(email);
    if (!user) {
      // Don't reveal whether the email exists — always return success
      return NextResponse.json({ ok: true, message: 'If an account with that email exists, a reset link has been sent.' });
    }

    // Use the server SDK with a fresh client configured for admin actions
    const client = new Client()
      .setEndpoint(process.env.APPWRITE_ENDPOINT || 'https://nyc.cloud.appwrite.io/v1')
      .setProject(process.env.APPWRITE_PROJECT_ID || '')
      .setKey(process.env.APPWRITE_API_KEY || '');

    const serverAccount = new Account(client);

    // Create a password recovery token
    // Appwrite will send an email to the user with the reset link
    const origin = request.headers.get('origin') || process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const resetUrl = `${origin}/reset-password`;

    await serverAccount.createRecovery(email, resetUrl);

    return NextResponse.json({
      ok: true,
      message: 'If an account with that email exists, a reset link has been sent.',
    });
  } catch (err: any) {
    console.error('[forgot-password] Error:', err?.message || err);
    // Still return success to avoid email enumeration
    return NextResponse.json({
      ok: true,
      message: 'If an account with that email exists, a reset link has been sent.',
    });
  }
}
