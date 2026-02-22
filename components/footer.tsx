'use client';

import React from 'react';
import Link from 'next/link';
import { Heart } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full bg-background border-t border-border/30 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent to-accent/70 flex items-center justify-center">
                <span className="text-accent-foreground font-bold">A</span>
              </div>
              <span className="text-lg font-bold gradient-brand">Auroric</span>
            </div>
            <p className="text-sm text-foreground/60">
              A luxury platform for discovering and sharing beautiful inspiration.
            </p>
          </div>

          {/* Explore */}
          <div className="flex flex-col gap-3">
            <h4 className="font-semibold text-foreground">Explore</h4>
            <Link href="/explore" className="text-sm text-foreground/60 hover:text-accent smooth-transition">
              All Pins
            </Link>
            <Link href="/boards" className="text-sm text-foreground/60 hover:text-accent smooth-transition">
              Popular Boards
            </Link>
            <Link href="/trending" className="text-sm text-foreground/60 hover:text-accent smooth-transition">
              Trending
            </Link>
            <Link href="/categories" className="text-sm text-foreground/60 hover:text-accent smooth-transition">
              Categories
            </Link>
          </div>

          {/* Community */}
          <div className="flex flex-col gap-3">
            <h4 className="font-semibold text-foreground">Community</h4>
            <Link href="/profile" className="text-sm text-foreground/60 hover:text-accent smooth-transition">
              My Profile
            </Link>
            <Link href="/create" className="text-sm text-foreground/60 hover:text-accent smooth-transition">
              Create
            </Link>
            <Link href="/search" className="text-sm text-foreground/60 hover:text-accent smooth-transition">
              Search
            </Link>
            <Link href="/settings" className="text-sm text-foreground/60 hover:text-accent smooth-transition">
              Settings
            </Link>
          </div>

          {/* More */}
          <div className="flex flex-col gap-3">
            <h4 className="font-semibold text-foreground">More</h4>
            <button className="text-left text-sm text-foreground/60 hover:text-accent smooth-transition">
              About Auroric
            </button>
            <button className="text-left text-sm text-foreground/60 hover:text-accent smooth-transition">
              Privacy Policy
            </button>
            <button className="text-left text-sm text-foreground/60 hover:text-accent smooth-transition">
              Terms of Service
            </button>
            <button className="text-left text-sm text-foreground/60 hover:text-accent smooth-transition">
              Contact Support
            </button>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-border/30 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-foreground/60 flex items-center gap-1">
            Made with <Heart className="w-4 h-4 text-red-500 fill-red-500" /> by Lucky &copy; {currentYear}
          </p>
          <div className="flex items-center gap-6">
            <a href="#" className="text-sm text-foreground/60 hover:text-accent smooth-transition">
              Twitter
            </a>
            <a href="#" className="text-sm text-foreground/60 hover:text-accent smooth-transition">
              Instagram
            </a>
            <a href="#" className="text-sm text-foreground/60 hover:text-accent smooth-transition">
              Facebook
            </a>
            <a href="#" className="text-sm text-foreground/60 hover:text-accent smooth-transition">
              LinkedIn
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
