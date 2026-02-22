'use client';

import React, { useState } from 'react';
import Header from '@/components/header';
import Footer from '@/components/footer';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setSent(true);
      } else {
        setError(data.error || 'Something went wrong. Please try again.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md">
          {sent ? (
            <div className="pin-card p-8 text-center animate-slideUp">
              <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <h1 className="text-2xl font-bold mb-2">Check Your Email</h1>
              <p className="text-foreground/60 text-sm mb-6">
                If an account with <span className="font-medium text-foreground">{email}</span> exists,
                we&apos;ve sent a password reset link. Check your inbox and spam folder.
              </p>
              <p className="text-xs text-foreground/40 mb-6">
                The link will expire in 1 hour.
              </p>

              <div className="space-y-3">
                <button
                  onClick={() => { setSent(false); setEmail(''); }}
                  className="w-full px-4 py-2.5 rounded-lg border border-border/30 text-foreground/70 hover:bg-card/50 smooth-transition text-sm font-medium"
                >
                  Try a different email
                </button>
                <Link href="/" className="block w-full luxury-button text-center py-2.5">
                  Back to Home
                </Link>
              </div>
            </div>
          ) : (
            <div className="pin-card p-8 animate-slideUp">
              <Link href="/" className="inline-flex items-center gap-1 text-sm text-foreground/60 hover:text-accent smooth-transition mb-6">
                <ArrowLeft className="w-4 h-4" /> Back to Home
              </Link>

              <div className="text-center mb-6">
                <div className="w-14 h-14 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-7 h-7 text-accent" />
                </div>
                <h1 className="text-2xl font-bold mb-1">Forgot Password?</h1>
                <p className="text-foreground/60 text-sm">
                  Enter the email you used to sign up and we&apos;ll send you a reset link.
                </p>
              </div>

              {error && (
                <div className="bg-destructive/20 text-destructive border border-destructive/30 rounded-lg p-3 mb-4 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-1">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    autoFocus
                    className="w-full bg-background/50 border border-border/30 rounded-lg px-4 py-2.5 text-foreground placeholder:text-foreground/40 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20"
                  />
                </div>

                <button
                  type="submit"
                  className="luxury-button w-full py-3"
                  disabled={loading}
                >
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </button>
              </form>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
