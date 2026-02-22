'use client';

import Link from 'next/link';
import Header from '@/components/header';
import Footer from '@/components/footer';
import { Search, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 flex items-center justify-center py-20">
        <div className="max-w-md text-center px-4">
          {/* 404 Number */}
          <div className="mb-6">
            <h1 className="text-9xl font-bold gradient-brand mb-2">404</h1>
            <p className="text-2xl font-semibold text-foreground">Page Not Found</p>
          </div>

          {/* Description */}
          <p className="text-lg text-foreground/70 mb-8">
            Oops! The inspiration you're looking for doesn't exist. It might have been moved or deleted.
          </p>

          {/* Search Box */}
          <div className="relative mb-8">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-foreground/40" />
            <input
              type="text"
              placeholder="Search for inspiration..."
              className="w-full bg-card/50 border border-border/30 rounded-full pl-12 pr-4 py-3 text-foreground placeholder:text-foreground/40 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 smooth-transition"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3 sm:flex-row justify-center">
            <Link href="/" className="luxury-button flex items-center justify-center gap-2">
              <Home className="w-5 h-5" />
              Go Home
            </Link>
            <Link href="/explore" className="luxury-button-outline">
              Explore Pins
            </Link>
          </div>

          {/* Helpful Links */}
          <div className="mt-12 pt-8 border-t border-border/30">
            <p className="text-sm text-foreground/60 mb-4">Need help?</p>
            <div className="flex flex-col gap-2">
              <Link href="/help" className="text-sm text-accent hover:text-accent/80 smooth-transition">
                Visit Help Center
              </Link>
              <Link href="/contact" className="text-sm text-accent hover:text-accent/80 smooth-transition">
                Contact Support
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
