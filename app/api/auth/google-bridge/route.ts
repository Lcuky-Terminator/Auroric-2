import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth-config';
import { getUserByEmail, createUser, stripPassword, type ServerUser } from '@/lib/db';
import { createToken, hashPassword, COOKIE_NAME, COOKIE_OPTIONS } from '@/lib/auth';
import crypto from 'crypto';

/**
 * After Google OAuth sign-in via NextAuth, the client calls this endpoint
 * to bridge the Google session into our existing JWT auth system.
 * 
 * It finds or creates the user in Appwrite, then sets the JWT cookie
 * so the rest of the app works seamlessly.
 */
export async function POST() {
  try {
    const session = await auth();

    if (!session?.googleEmail) {
      return NextResponse.json({ error: 'No Google session found' }, { status: 401 });
    }

    const email = session.googleEmail as string;
    const name = (session.googleName as string) || email.split('@')[0];
    const avatar = (session.googleImage as string) || '';

    // Check if user already exists with this email
    let user = await getUserByEmail(email);

    if (!user) {
      // Create a new user from Google profile
      const baseUsername = email
        .split('@')[0]
        .replace(/[^a-zA-Z0-9]/g, '')
        .toLowerCase()
        .slice(0, 20);

      // Add random suffix to ensure uniqueness
      const username = `${baseUsername}${crypto.randomInt(100, 999)}`;

      const serverUser: ServerUser = {
        id: `user-${Date.now()}`,
        username,
        displayName: name,
        email,
        passwordHash: hashPassword(crypto.randomUUID()), // random password for Google users
        bio: '',
        avatar,
        website: '',
        followers: [],
        following: [],
        createdAt: new Date().toISOString(),
        emailVerified: true, // Google-verified email is inherently trusted
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

      const safeUser = await createUser(serverUser);
      const token = await createToken(safeUser.id);
      const response = NextResponse.json({ user: safeUser, isNewUser: true });
      response.cookies.set(COOKIE_NAME, token, COOKIE_OPTIONS);
      return response;
    }

    // Existing user — update avatar if they don't have one
    const safeUser = stripPassword(user);
    const token = await createToken(user.id);
    const response = NextResponse.json({ user: safeUser, isNewUser: false });
    response.cookies.set(COOKIE_NAME, token, COOKIE_OPTIONS);
    return response;
  } catch (err) {
    console.error('Google bridge error:', err);
    return NextResponse.json({ error: 'Failed to process Google sign-in' }, { status: 500 });
  }
}
