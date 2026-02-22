'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { confirmVerification } from '@/lib/email-verification';
import { useApp } from '@/lib/app-context';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';

/**
 * /verify — Email verification callback page.
 *
 * Appwrite appends `?userId=xxx&secret=yyy` to this URL when the user
 * clicks the link in their verification email.
 *
 * This page:
 * 1. Reads `userId` and `secret` from the URL.
 * 2. Calls `confirmVerification(userId, secret)` which:
 *    a. Calls `account.updateVerification()` on the Appwrite client SDK.
 *    b. Calls `POST /api/auth/verify` to mirror the flag to the custom DB.
 * 3. Redirects the user to the home page on success.
 */
export default function VerifyPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { refresh } = useApp();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const userId = searchParams.get('userId');
    const secret = searchParams.get('secret');

    if (!userId || !secret) {
      setStatus('error');
      setErrorMessage('Invalid verification link — missing userId or secret.');
      return;
    }

    confirmVerification(userId, secret)
      .then(() => {
        setStatus('success');
        refresh(); // reload user data so emailVerified updates
        // Redirect to home after 3 seconds
        setTimeout(() => router.push('/'), 3000);
      })
      .catch((err: any) => {
        setStatus('error');
        setErrorMessage(
          err?.message || 'Verification failed. The link may have expired.',
        );
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-card border border-border/50 rounded-2xl p-8 text-center">
        {status === 'loading' && (
          <>
            <Loader2 className="w-12 h-12 text-accent animate-spin mx-auto mb-4" />
            <h1 className="text-xl font-bold mb-2">Verifying your email…</h1>
            <p className="text-foreground/60">Please wait while we confirm your address.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="w-14 h-14 text-green-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Email Verified!</h1>
            <p className="text-foreground/60 mb-6">
              Your account is now fully activated. Redirecting you to the home page…
            </p>
            <Link
              href="/"
              className="luxury-button inline-flex items-center gap-2 px-6 py-2.5"
            >
              Go to Home
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="w-14 h-14 text-destructive mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Verification Failed</h1>
            <p className="text-foreground/60 mb-6">{errorMessage}</p>
            <div className="flex flex-col gap-3">
              <Link
                href="/verify-email"
                className="luxury-button inline-flex items-center justify-center gap-2 px-6 py-2.5"
              >
                Request a new link
              </Link>
              <Link
                href="/"
                className="text-foreground/60 hover:text-foreground smooth-transition text-sm"
              >
                Back to home
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
