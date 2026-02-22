/**
 * Email Verification module — client-side helpers.
 *
 * Uses Resend via our own API endpoints for sending verification emails.
 * No Appwrite Auth dependency required.
 */

import { api } from './api-client';

/* ------------------------------------------------------------------ */
/*  registerUser                                                      */
/* ------------------------------------------------------------------ */

/**
 * Register a new user and trigger the verification email via Resend.
 *
 * Flow:
 * 1. Call the app's `/api/auth/signup` endpoint which creates the user
 *    in the custom Appwrite DB.
 * 2. Call `/api/auth/send-verification` to send a verification email
 *    via Resend with a JWT token link.
 *
 * @returns The created user + whether verification was sent.
 */
export async function registerUser(
  email: string,
  password: string,
  name: string,
  username?: string,
) {
  // ── Step 1: Create user in our backend (custom DB) ──
  const signupResult = await api.signup(
    username || email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '').toLowerCase(),
    name,
    email,
    password,
  );

  // ── Step 2: Send verification email via Resend ──
  let verificationSent = false;
  try {
    const res = await fetch('/api/auth/send-verification', { method: 'POST' });
    if (res.ok) {
      verificationSent = true;
    }
  } catch (err: any) {
    console.warn('[Verification] Could not send verification email:', err?.message);
  }

  return { user: signupResult.user, verificationSent };
}

/* ------------------------------------------------------------------ */
/*  resendVerification                                                */
/* ------------------------------------------------------------------ */

/**
 * Re-send the verification email via our API (uses Resend).
 */
export async function resendVerification() {
  const res = await fetch('/api/auth/send-verification', { method: 'POST' });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to send verification email');
  }
}
