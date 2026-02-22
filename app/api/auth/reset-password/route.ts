import { NextResponse } from 'next/server';
import { Client, Account } from 'node-appwrite';
import { getUserByEmail, updateUser, getUserFull } from '@/lib/db';
import { hashPassword } from '@/lib/auth';

/**
 * POST /api/auth/reset-password
 *
 * Accepts { userId, secret, password } from the password-reset page.
 * 1. Confirms the recovery with Appwrite Auth
 * 2. Updates the password hash in our custom DB
 */
export async function POST(request: Request) {
  try {
    const { userId, secret, password } = await request.json();

    if (!userId || !secret || !password) {
      return NextResponse.json(
        { error: 'userId, secret, and password are required' },
        { status: 400 },
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 },
      );
    }

    // Confirm the recovery with Appwrite Auth
    const client = new Client()
      .setEndpoint(process.env.APPWRITE_ENDPOINT || 'https://nyc.cloud.appwrite.io/v1')
      .setProject(process.env.APPWRITE_PROJECT_ID || '')
      .setKey(process.env.APPWRITE_API_KEY || '');

    const serverAccount = new Account(client);

    await serverAccount.updateRecovery(userId, secret, password);

    // Also update the password hash in our custom users collection
    // We need to find the user by their Appwrite Auth userId
    // The Appwrite Auth userId might not be our custom DB id, so we
    // try to find the user via the Appwrite Auth user's email
    try {
      // Get the Appwrite Auth user to find their email
      const { Users } = await import('node-appwrite');
      const users = new Users(client);
      const appwriteUser = await users.get(userId);
      const email = appwriteUser.email;

      if (email) {
        const dbUser = await getUserByEmail(email);
        if (dbUser) {
          const passwordHash = await hashPassword(password);
          await updateUser(dbUser.id, { passwordHash } as any);
        }
      }
    } catch (dbErr: any) {
      console.warn('[reset-password] Could not update custom DB hash:', dbErr?.message);
      // The Appwrite Auth password is already updated, so the user can still
      // log in via Appwrite, but our custom JWT login might be out of sync.
      // We'll handle this gracefully.
    }

    return NextResponse.json({ ok: true, message: 'Password has been reset successfully.' });
  } catch (err: any) {
    console.error('[reset-password] Error:', err?.message || err);
    return NextResponse.json(
      { error: 'Invalid or expired reset link. Please request a new one.' },
      { status: 400 },
    );
  }
}
