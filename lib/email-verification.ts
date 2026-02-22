/**
 * Email Verification module — client-side helpers.
 *
 * ─── How `emailVerification` works in Appwrite ────────────────────────
 * When you create a user via Appwrite Auth, the `emailVerification` field
 * on the user object is `false` by default.
 *
 * Calling `account.createVerification(url)` tells Appwrite to send the
 * user an email containing a link like:
 *   <url>?userId=xxx&secret=yyy
 *
 * When the user clicks that link your app calls
 *   `account.updateVerification(userId, secret)`
 * which flips `emailVerification` to `true` on the Appwrite Auth user.
 *
 * We mirror that boolean into our own `users` collection so the rest of
 * the app can check it without hitting Appwrite Auth every time.
 * ──────────────────────────────────────────────────────────────────────
 */

import { account } from './appwrite-client';
import { ID } from 'appwrite';
import { api } from './api-client';

/* ------------------------------------------------------------------ */
/*  External email validation (optional pre-check)                    */
/* ------------------------------------------------------------------ */

/**
 * Optional: validate the email with a 3rd-party service **before**
 * creating any account. Uncomment and supply your API key to enable.
 *
 * Example with ZeroBounce:
 * ```ts
 * async function isRealEmail(email: string): Promise<boolean> {
 *   const res = await fetch(
 *     `https://api.zerobounce.net/v2/validate` +
 *     `?api_key=${process.env.NEXT_PUBLIC_ZEROBOUNCE_KEY}&email=${email}`
 *   );
 *   const data = await res.json();
 *   return data.status === 'valid';
 * }
 * ```
 *
 * Example with Hunter.io:
 * ```ts
 * async function isRealEmail(email: string): Promise<boolean> {
 *   const res = await fetch(
 *     `https://api.hunter.io/v2/email-verifier` +
 *     `?email=${email}&api_key=${process.env.NEXT_PUBLIC_HUNTER_KEY}`
 *   );
 *   const data = await res.json();
 *   return data.data.result === 'deliverable';
 * }
 * ```
 *
 * Usage:
 *   if (!await isRealEmail(email)) throw new Error('Invalid email domain');
 */

/* ------------------------------------------------------------------ */
/*  registerUser                                                      */
/* ------------------------------------------------------------------ */

/**
 * Register a new user, create an Appwrite Auth session, and trigger
 * the verification email.
 *
 * Flow:
 * 1. (Optional) call `isRealEmail(email)` to pre-validate.
 * 2. Call the app's `/api/auth/signup` endpoint which creates the user
 *    in the custom Appwrite DB **and** in Appwrite Auth.
 * 3. Log into Appwrite Auth (client-side session) so we can call
 *    `account.createVerification()`.
 * 4. Trigger the verification email via Appwrite.
 *
 * @returns The created user + whether verification was sent.
 */
export async function registerUser(
  email: string,
  password: string,
  name: string,
  username?: string,
) {
  /*
   * ── Step 0 (optional): External email existence check ──
   * if (!await isRealEmail(email)) {
   *   throw new Error('Invalid email domain');
   * }
   */

  // ── Step 1: Create user in our backend (custom DB + Appwrite Auth) ──
  const signupResult = await api.signup(
    username || email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '').toLowerCase(),
    name,
    email,
    password,
  );

  // ── Step 2: Create an Appwrite Auth *session* on the client ──
  // This is required before calling `createVerification`.
  try {
    await account.createEmailPasswordSession(email, password);
  } catch (err: any) {
    console.warn('[Verification] Could not create Appwrite session:', err?.message);
    // The user is still registered — they just won't get the email now.
    // They can request it again from the /verify-email page.
    return { user: signupResult.user, verificationSent: false };
  }

  // ── Step 3: Trigger the email verification ──
  try {
    const verifyUrl = `${window.location.origin}/verify`;
    await account.createVerification(verifyUrl);
    return { user: signupResult.user, verificationSent: true };
  } catch (err: any) {
    console.warn('[Verification] createVerification failed:', err?.message);
    return { user: signupResult.user, verificationSent: false };
  }
}

/* ------------------------------------------------------------------ */
/*  confirmVerification                                               */
/* ------------------------------------------------------------------ */

/**
 * Called on the `/verify` page after the user clicks the link in their
 * email. Appwrite appends `?userId=...&secret=...` to the URL.
 *
 * This function:
 * 1. Calls `account.updateVerification(userId, secret)` on the client
 *    to flip the Appwrite Auth flag.
 * 2. Calls our API to update the custom DB user `emailVerified = true`.
 */
export async function confirmVerification(userId: string, secret: string) {
  // Flip the flag in Appwrite Auth
  await account.updateVerification(userId, secret);

  // Mirror the flag to our custom DB via the server API
  await fetch('/api/auth/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, secret }),
  });
}

/* ------------------------------------------------------------------ */
/*  resendVerification                                                */
/* ------------------------------------------------------------------ */

/**
 * Re-send the verification email (requires an active Appwrite session).
 */
export async function resendVerification() {
  const verifyUrl = `${window.location.origin}/verify`;
  await account.createVerification(verifyUrl);
}

/* ------------------------------------------------------------------ */
/*  Re-create Appwrite session (for resend on /verify-email page)     */
/* ------------------------------------------------------------------ */

/**
 * If the user's Appwrite session expired, re-create it so they can
 * request another verification email.
 */
export async function ensureAppwriteSession(email: string, password: string) {
  try {
    await account.get(); // already has a session
  } catch {
    await account.createEmailPasswordSession(email, password);
  }
}
