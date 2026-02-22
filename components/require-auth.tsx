/**
 * RequireAuth — Route Guard / Gatekeeper Component
 *
 * Checks TWO conditions before rendering protected content:
 *   1. Is the user logged in?                → if NO  → redirect to home / show auth modal
 *   2. Is `user.emailVerification === true`?  → if NO  → redirect to `/verify-email`
 *
 * Usage:
 * ```tsx
 * <RequireAuth>
 *   <DashboardContent />
 * </RequireAuth>
 * ```
 *
 * Or wrap an entire page:
 * ```tsx
 * export default function DashboardPage() {
 *   return (
 *     <RequireAuth>
 *       <h1>Welcome to your dashboard</h1>
 *     </RequireAuth>
 *   );
 * }
 * ```
 */

'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/app-context';

interface RequireAuthProps {
  children: React.ReactNode;
  /** Where to redirect un-authenticated users (default: opens auth modal) */
  loginRedirect?: string;
  /** Where to redirect unverified users (default: /verify-email) */
  verifyRedirect?: string;
}

export default function RequireAuth({
  children,
  loginRedirect,
  verifyRedirect = '/verify-email',
}: RequireAuthProps) {
  const { currentUser, isLoggedIn, openAuthModal } = useApp();
  const router = useRouter();

  useEffect(() => {
    // ── Check 1: Is the user logged in? ──
    if (!isLoggedIn) {
      if (loginRedirect) {
        router.replace(loginRedirect);
      } else {
        // Show the auth modal instead of redirecting away
        openAuthModal('login');
        router.replace('/');
      }
      return;
    }

    // ── Check 2: Is the user's email verified? ──
    if (currentUser && !currentUser.emailVerified) {
      router.replace(verifyRedirect);
    }
  }, [isLoggedIn, currentUser, loginRedirect, verifyRedirect, router, openAuthModal]);

  // While redirecting, show a minimal loading state
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-foreground/60">Redirecting to login…</p>
      </div>
    );
  }

  if (currentUser && !currentUser.emailVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-foreground/60">Verifying email status…</p>
      </div>
    );
  }

  // ✓ Logged in AND email verified — render children
  return <>{children}</>;
}
