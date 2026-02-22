'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Header from '@/components/header';
import Footer from '@/components/footer';
import PinCard from '@/components/pin-card';
import MasonryGrid from '@/components/masonry-grid';
import { Flame, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { useApp } from '@/lib/app-context';
import { api } from '@/lib/api-client';
import { CATEGORIES } from '@/lib/types';
import type { Pin } from '@/lib/types';

export default function TrendingPage() {
  const { getTrendingPins, pins } = useApp();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [serverTrending, setServerTrending] = useState<Pin[] | null>(null);

  // Fetch trending from server API
  useEffect(() => {
    api.getTrendingPins(50, selectedCategory !== 'All' ? selectedCategory : undefined)
      .then(setServerTrending)
      .catch(() => setServerTrending(null));
  }, [selectedCategory]);

  // Use server data if available, otherwise fall back to local
  const trendingPins = useMemo(() => {
    if (serverTrending) return serverTrending;
    const trending = getTrendingPins();
    if (selectedCategory === 'All') return trending;
    return trending.filter(p => p.category === selectedCategory);
  }, [serverTrending, getTrendingPins, selectedCategory]);

  const topCategories = useMemo(() => {
    const catCount: Record<string, number> = {};
    pins.filter(p => !p.isPrivate).forEach(p => {
      catCount[p.category] = (catCount[p.category] || 0) + p.likes.length;
    });
    return Object.entries(catCount).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([cat]) => cat);
  }, [pins]);

  const categoryEmoji: Record<string, string> = {
    'Fashion': '👗', 'Interior Design': '🏠', 'Architecture': '🏢', 'Art': '🎨',
    'Food & Beverage': '🍽', 'Photography': '📷', 'Travel': '✈️', 'DIY & Crafts': '✨',
    'Technology': '💻', 'Nature': '🌿', 'Fitness': '💪', 'Beauty': '💄',
    'Automotive': '🚗', 'Music': '🎵', 'Books': '📚',
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <section className="w-full bg-gradient-to-br from-card/50 via-primary/5 to-background py-16 border-b border-border/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-4">
            <Flame className="w-8 h-8 text-accent" />
            <h1 className="text-5xl sm:text-6xl font-bold">Trending Now</h1>
          </div>
          <p className="text-xl text-foreground/70 max-w-2xl mb-6">
            Discover the most popular pins on Auroric.
          </p>

          <div className="flex flex-wrap gap-2">
            <button onClick={() => setSelectedCategory('All')}
              className={`px-4 py-2 rounded-full font-medium smooth-transition ${selectedCategory === 'All' ? 'bg-accent text-accent-foreground' : 'bg-card/50 text-foreground/70 hover:bg-card/80'}`}>
              All
            </button>
            {CATEGORIES.filter(c => c !== 'All').map(cat => (
              <button key={cat} onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full font-medium smooth-transition ${selectedCategory === cat ? 'bg-accent text-accent-foreground' : 'bg-card/50 text-foreground/70 hover:bg-card/80'}`}>
                {categoryEmoji[cat] || '📌'} {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      <main className="flex-1 w-full py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {topCategories.length > 0 && selectedCategory === 'All' && (
            <div className="mb-12">
              <h2 className="text-3xl font-bold mb-6 flex items-center gap-2">
                <TrendingUp className="w-7 h-7 text-accent" /> Top Categories
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {topCategories.map(cat => (
                  <button key={cat} onClick={() => setSelectedCategory(cat)}
                    className="pin-card p-6 text-center cursor-pointer group hover:border-accent/50">
                    <div className="text-4xl mb-3">{categoryEmoji[cat] || '📌'}</div>
                    <h3 className="font-semibold text-foreground group-hover:text-accent smooth-transition">{cat}</h3>
                    <p className="text-xs text-foreground/60 mt-1">Trending now</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <h2 className="text-3xl font-bold mb-8">
              {selectedCategory === 'All' ? 'Most Popular Pins' : `Trending in ${selectedCategory}`}
            </h2>
            {trendingPins.length > 0 ? (
              <MasonryGrid columns={3}>
                {trendingPins.map((pin, index) => (
                  <div key={pin.id} className="relative">
                    {index < 3 && (
                      <div className="absolute top-4 left-4 z-10">
                        <div className="flex items-center gap-1 bg-black/60 backdrop-blur-sm rounded-full px-3 py-1 border border-accent/50">
                          <Flame className="w-4 h-4 text-accent" />
                          <span className="text-xs font-semibold text-accent">#{index + 1}</span>
                        </div>
                      </div>
                    )}
                    <PinCard id={pin.id} title={pin.title} imageUrl={pin.imageUrl} authorId={pin.authorId} likes={pin.likes} saves={pin.saves} comments={pin.comments} views={pin.views} createdAt={pin.createdAt} />
                  </div>
                ))}
              </MasonryGrid>
            ) : (
              <div className="text-center py-16">
                <Flame className="w-12 h-12 text-foreground/20 mx-auto mb-4" />
                <p className="text-lg text-foreground/60 mb-2">No trending pins yet</p>
                <p className="text-sm text-foreground/40">Be the first to upload some inspiration!</p>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
