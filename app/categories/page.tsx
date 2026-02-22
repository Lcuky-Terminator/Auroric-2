'use client';

import React, { useMemo } from 'react';
import Header from '@/components/header';
import Footer from '@/components/footer';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useApp } from '@/lib/app-context';
import { CATEGORIES } from '@/lib/types';

const categoryMeta: Record<string, { emoji: string; color: string; description: string }> = {
  'Fashion': { emoji: '👗', color: 'from-pink-500/20 to-rose-500/20', description: 'Clothing trends, accessories, and personal style' },
  'Interior Design': { emoji: '🏠', color: 'from-blue-500/20 to-blue-600/20', description: 'Modern spaces, furniture, decor, and home inspiration' },
  'Architecture': { emoji: '🏢', color: 'from-gray-500/20 to-slate-500/20', description: 'Building designs, urban spaces, and structures' },
  'Art': { emoji: '🎨', color: 'from-violet-500/20 to-purple-500/20', description: 'Digital art, paintings, and creative works' },
  'Food & Beverage': { emoji: '🍽', color: 'from-orange-500/20 to-yellow-500/20', description: 'Recipes, culinary art, and dining inspiration' },
  'Photography': { emoji: '📷', color: 'from-purple-500/20 to-indigo-500/20', description: 'Nature, portraits, and visual storytelling' },
  'Travel': { emoji: '✈️', color: 'from-teal-500/20 to-cyan-500/20', description: 'Destinations, cultures, and exploration' },
  'DIY & Crafts': { emoji: '✨', color: 'from-amber-500/20 to-orange-500/20', description: 'Handmade projects and creative tutorials' },
  'Technology': { emoji: '💻', color: 'from-blue-600/20 to-blue-700/20', description: 'Gadgets, startups, and innovation' },
  'Nature': { emoji: '🌿', color: 'from-green-500/20 to-emerald-500/20', description: 'Landscapes, wildlife, and the great outdoors' },
  'Fitness': { emoji: '💪', color: 'from-green-500/20 to-emerald-500/20', description: 'Workouts, health tips, and active living' },
  'Beauty': { emoji: '💄', color: 'from-pink-500/20 to-fuchsia-500/20', description: 'Makeup, skincare, and beauty inspiration' },
  'Automotive': { emoji: '🚗', color: 'from-red-500/20 to-orange-500/20', description: 'Cars, motorcycles, and automotive design' },
  'Music': { emoji: '🎵', color: 'from-indigo-500/20 to-blue-500/20', description: 'Albums, instruments, and musical inspiration' },
  'Books': { emoji: '📚', color: 'from-amber-500/20 to-yellow-500/20', description: 'Reading lists, book covers, and literary inspiration' },
};

export default function CategoriesPage() {
  const { pins } = useApp();

  const categoryPinCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    pins.filter(p => !p.isPrivate).forEach(p => {
      counts[p.category] = (counts[p.category] || 0) + 1;
    });
    return counts;
  }, [pins]);

  const categories = CATEGORIES.filter(c => c !== 'All');

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <section className="w-full bg-gradient-to-b from-card/30 to-background py-16 border-b border-border/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-5xl sm:text-6xl font-bold mb-4">Explore Categories</h1>
          <p className="text-xl text-foreground/70 max-w-2xl">
            Discover inspiration across all topics. Find what interests you most.
          </p>
        </div>
      </section>

      <main className="flex-1 w-full py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map(cat => {
              const meta = categoryMeta[cat] || { emoji: '📌', color: 'from-gray-500/20 to-gray-600/20', description: cat };
              const count = categoryPinCounts[cat] || 0;
              return (
                <Link key={cat} href={`/explore?category=${encodeURIComponent(cat)}`}>
                  <div className={`pin-card p-6 cursor-pointer group hover:border-accent/50 bg-gradient-to-br ${meta.color}`}>
                    <div className="flex items-start justify-between mb-4">
                      <div className="text-5xl mb-2">{meta.emoji}</div>
                      <ArrowRight className="w-5 h-5 text-foreground/40 group-hover:text-accent group-hover:translate-x-1 smooth-transition" />
                    </div>
                    <h3 className="text-2xl font-bold text-foreground mb-2 group-hover:text-accent smooth-transition">{cat}</h3>
                    <p className="text-sm text-foreground/70 mb-4">{meta.description}</p>
                    <div className="flex items-center justify-between pt-4 border-t border-border/30">
                      <span className="text-xs text-foreground/60 font-medium">{count} pins</span>
                      <span className="text-xs text-accent font-semibold">Explore →</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
