'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { account } from '@/lib/appwrite-client';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

/**
 * /verify — Appwrite email verification callback page.
 *
 * When a user clicks the verification link in their email, Appwrite redirects
 * them here with `userId` and `secret` query parameters. This page calls
 * `account.updateVerification()` to complete the verification.
 */
export default function VerifyPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const userId = searchParams.get('userId');
    const secret = searchParams.get('secret');

    if (!userId || !secret) {
      setStatus('error');
      setErrorMessage('Invalid verification link. Missing userId or secret.');
      return;
    }

    async function verify() {
      try {
        await account.updateVerification(userId!, secret!);

        // Update our DB to mark email as verified
        // Send the userId so the server can find the user even without a JWT session
        try {
          await fetch('/api/auth/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, appwriteVerified: true }),
          });
        } catch {
          // Non-critical — the DB flag is secondary to Appwrite's verification
        }

        setStatus('success');
        // Redirect to home after a short delay
        setTimeout(() => router.push('/'), 3000);
      } catch (err: any) {
        console.error('[Verify] Appwrite updateVerification failed:', err);
        setStatus('error');
        if (err?.code === 401) {
          setErrorMessage('Verification link has expired or is invalid. Please request a new one.');
        } else {
          setErrorMessage(err?.message || 'Verification failed. Please try again.');
        }
      }
    }

    verify();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-card border border-border/50 rounded-2xl p-8 text-center">
        {status === 'verifying' && (
          <>
            <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-6">
              <Loader2 className="w-8 h-8 text-accent animate-spin" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Verifying your email...</h1>
            <p className="text-foreground/60">Please wait while we verify your email address.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Email Verified!</h1>
            <p className="text-foreground/60 mb-4">
              Your email has been verified successfully. You now have full access to Auroric.
            </p>
            <p className="text-foreground/40 text-sm">Redirecting to home page...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-8 h-8 text-destructive" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Verification Failed</h1>
            <p className="text-foreground/60 mb-4">{errorMessage}</p>
            <div className="flex flex-col gap-3">
              <a href="/verify-email" className="luxury-button w-full py-3 inline-block text-center">
                Request New Verification Email
              </a>
              <a href="/" className="text-accent/80 hover:text-accent smooth-transition text-sm">
                Go to Home
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
