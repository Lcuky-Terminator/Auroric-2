'use client';

import React, { useState, Suspense } from 'react';
import Header from '@/components/header';
import Footer from '@/components/footer';
import { Lock, ArrowLeft, CheckCircle, AlertCircle, Check } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const userId = searchParams.get('userId') || '';
  const secret = searchParams.get('secret') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const isValid = userId && secret;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!password || password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, secret, password }),
      });
      const data = await res.json();

      if (res.ok) {
        setSuccess(true);
      } else {
        setError(data.error || 'Failed to reset password. The link may have expired.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isValid) {
    return (
      <div className="pin-card p-8 text-center animate-slideUp">
        <div className="w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8 text-destructive" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Invalid Reset Link</h1>
        <p className="text-foreground/60 text-sm mb-6">
          This password reset link is invalid or has expired. Please request a new one.
        </p>
        <Link href="/forgot-password" className="luxury-button inline-block py-2.5 px-6">
          Request New Link
        </Link>
      </div>
    );
  }

  if (success) {
    return (
      <div className="pin-card p-8 text-center animate-slideUp">
        <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-green-500" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Password Reset!</h1>
        <p className="text-foreground/60 text-sm mb-6">
          Your password has been successfully updated. You can now sign in with your new password.
        </p>
        <button
          onClick={() => router.push('/')}
          className="luxury-button py-2.5 px-6"
        >
          Go to Home & Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="pin-card p-8 animate-slideUp">
      <Link href="/" className="inline-flex items-center gap-1 text-sm text-foreground/60 hover:text-accent smooth-transition mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to Home
      </Link>

      <div className="text-center mb-6">
        <div className="w-14 h-14 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-4">
          <Lock className="w-7 h-7 text-accent" />
        </div>
        <h1 className="text-2xl font-bold mb-1">Set New Password</h1>
        <p className="text-foreground/60 text-sm">
          Choose a strong password for your account.
        </p>
      </div>

      {error && (
        <div className="bg-destructive/20 text-destructive border border-destructive/30 rounded-lg p-3 mb-4 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-foreground mb-1">New Password</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
            autoFocus
            className="w-full bg-background/50 border border-border/30 rounded-lg px-4 py-2.5 text-foreground placeholder:text-foreground/40 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20"
          />
          {password && password.length < 8 && (
            <p className="text-xs mt-1 text-destructive">Must be at least 8 characters</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-semibold text-foreground mb-1">Confirm New Password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
            className={`w-full bg-background/50 border rounded-lg px-4 py-2.5 text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-1 smooth-transition ${
              confirmPassword && confirmPassword !== password
                ? 'border-destructive/60 focus:border-destructive/80 focus:ring-destructive/30'
                : confirmPassword && confirmPassword === password
                ? 'border-green-500/60 focus:border-green-500/80 focus:ring-green-500/30'
                : 'border-border/30 focus:border-accent/50 focus:ring-accent/20'
            }`}
          />
          {confirmPassword && confirmPassword !== password && (
            <p className="text-xs mt-1 text-destructive flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> Passwords do not match
            </p>
          )}
          {confirmPassword && confirmPassword === password && (
            <p className="text-xs mt-1 text-green-500 flex items-center gap-1">
              <Check className="w-3 h-3" /> Passwords match
            </p>
          )}
        </div>

        <button
          type="submit"
          className="luxury-button w-full py-3"
          disabled={loading || password.length < 8 || password !== confirmPassword}
        >
          {loading ? 'Resetting...' : 'Reset Password'}
        </button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md">
          <Suspense fallback={
            <div className="pin-card p-8 text-center animate-pulse">
              <div className="w-14 h-14 rounded-full bg-card/50 mx-auto mb-4" />
              <div className="h-6 bg-card/50 rounded w-2/3 mx-auto mb-2" />
              <div className="h-4 bg-card/50 rounded w-1/2 mx-auto" />
            </div>
          }>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </main>

      <Footer />
    </div>
  );
}
