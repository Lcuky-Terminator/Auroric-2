'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '@/lib/app-context';
import { useRouter } from 'next/navigation';
import { Mail, RefreshCw, CheckCircle } from 'lucide-react';

/**
 * /verify-email — "Check your inbox" page.
 *
 * Shown to users who are logged in but have not yet verified their email.
 * Uses a server-side endpoint for resending (no Appwrite client session needed).
 * Polls GET /api/auth/verify every 5 seconds to detect cross-device verification.
 */
export default function VerifyEmailPage() {
  const { currentUser, logout } = useApp();
  const router = useRouter();
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [error, setError] = useState('');
  const [verified, setVerified] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Poll for verification status (handles cross-device verification) ──
  useEffect(() => {
    if (verified) return;

    const checkVerification = async () => {
      try {
        const res = await fetch('/api/auth/verify');
        if (res.ok) {
          const data = await res.json();
          if (data.verified) {
            setVerified(true);
            // Redirect to home after showing success briefly
            setTimeout(() => {
              window.location.href = '/';
            }, 2000);
          }
        }
      } catch {
        // Ignore polling errors
      }
    };

    // Check immediately on mount
    checkVerification();

    // Then poll every 5 seconds
    pollRef.current = setInterval(checkVerification, 5000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [verified]);

  const handleResend = async () => {
    setResending(true);
    setError('');
    setResent(false);
    try {
      // Use server-side endpoint (works without Appwrite client session)
      const res = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          verifyUrl: `${window.location.origin}/verify`,
        }),
      });

      const data = await res.json();

      if (res.ok && data.sent) {
        setResent(true);
      } else if (res.status === 409) {
        // Already verified — redirect
        setVerified(true);
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
      } else {
        setError(data.error || data.message || 'Failed to resend verification email.');
      }
    } catch (err: any) {
      console.error('[VerifyEmail] Resend failed:', err);
      setError(err?.message || 'Failed to resend verification email. Please try again.');
    } finally {
      setResending(false);
    }
  };

  // ── Verified state ──
  if (verified) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-card border border-border/50 rounded-2xl p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Email Verified!</h1>
          <p className="text-foreground/60 mb-4">
            Your email has been verified successfully. Redirecting...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-card border border-border/50 rounded-2xl p-8 text-center">
        {/* Icon */}
        <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-6">
          <Mail className="w-8 h-8 text-accent" />
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold mb-2">Check your inbox</h1>
        <p className="text-foreground/60 mb-6">
          We sent a verification link to{' '}
          <span className="font-semibold text-foreground">
            {currentUser?.email || 'your email'}
          </span>
          . Click the link in the email to verify your account.
        </p>

        {/* Status messages */}
        {resent && (
          <div className="bg-green-500/20 text-green-400 border border-green-500/30 rounded-lg p-3 mb-4 text-sm">
            Verification email sent! Check your inbox (and spam folder).
          </div>
        )}
        {error && (
          <div className="bg-destructive/20 text-destructive border border-destructive/30 rounded-lg p-3 mb-4 text-sm">
            {error}
          </div>
        )}

        {/* Resend button */}
        <button
          onClick={handleResend}
          disabled={resending}
          className="luxury-button w-full py-3 flex items-center justify-center gap-2 mb-4"
        >
          <RefreshCw className={`w-4 h-4 ${resending ? 'animate-spin' : ''}`} />
          {resending ? 'Sending…' : 'Resend verification email'}
        </button>

        {/* Polling indicator */}
        <p className="text-foreground/30 text-xs mb-4">
          This page will automatically update when your email is verified.
        </p>

        {/* Actions */}
        <div className="flex flex-col gap-2 text-sm">
          <p className="text-foreground/40">
            Didn&apos;t receive it? Check your spam folder or try a different email.
          </p>
          <div className="flex items-center justify-center gap-4 mt-3">
            <a href="/" className="text-accent/80 hover:text-accent smooth-transition">
              Browse Auroric first
            </a>
            <span className="text-foreground/20">|</span>
            <button
              onClick={() => logout()}
              className="text-destructive/80 hover:text-destructive smooth-transition"
            >
              Sign out &amp; use a different email
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
