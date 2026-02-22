'use client';

import React, { useState, useMemo } from 'react';
import Header from '@/components/header';
import Footer from '@/components/footer';
import PinCard from '@/components/pin-card';
import MasonryGrid from '@/components/masonry-grid';
import { ArrowRight, Flame, Compass, Zap } from 'lucide-react';
import Link from 'next/link';
import { useApp } from '@/lib/app-context';

export default function Home() {
  const { pins, isLoggedIn, currentUser, openAuthModal } = useApp();
  const [visibleCount, setVisibleCount] = useState(12);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const categories = useMemo(() => {
    const cats = new Set(pins.map(p => p.category).filter(Boolean));
    return Array.from(cats).slice(0, 8);
  }, [pins]);

  const feedPins = useMemo(() => {
    let filtered = pins.filter(p => !p.isPrivate);
    if (activeCategory) filtered = filtered.filter(p => p.category === activeCategory);
    return filtered.slice(0, visibleCount);
  }, [pins, visibleCount, activeCategory]);

  const loadMore = () => setVisibleCount(prev => prev + 12);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      {/* Hero — editorial, atmospheric */}
      <section className="w-full relative overflow-hidden hero-gradient">
        {/* Accent glow */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full opacity-[0.07] hero-accent-glow" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 py-24 lg:py-32">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="flex flex-col gap-8">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-8 rounded-full bg-accent" />
                <span className="text-sm font-medium text-accent tracking-wide uppercase mono">Curate · Create · Discover</span>
              </div>

              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-[0.95] tracking-tight">
                Your visual
                <br />
                <span className="gradient-brand">universe</span>,
                <br />
                organized.
              </h1>

              <p className="text-lg text-foreground/55 max-w-lg leading-relaxed">
                Collect ideas that inspire you. Build boards that tell stories.
                Share what moves you with a community that gets it.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                {isLoggedIn ? (
                  <>
                    <Link href="/create" className="luxury-button flex items-center justify-center gap-2.5">
                      <Zap className="w-4 h-4" />
                      Create a Pin
                    </Link>
                    <Link href="/explore" className="luxury-button-outline flex items-center justify-center gap-2.5">
                      <Compass className="w-4 h-4" />
                      Explore
                    </Link>
                  </>
                ) : (
                  <>
                    <Link href="/explore" className="luxury-button flex items-center justify-center gap-2.5">
                      <Compass className="w-4 h-4" />
                      Start Exploring
                    </Link>
                  </>
                )}
              </div>
            </div>

            {/* Right side — featured pin preview trio */}
            <div className="hidden lg:flex items-center justify-center">
              <div className="relative w-full max-w-md">
                {pins.slice(0, 3).map((pin, i) => (
                  <div
                    key={pin.id}
                    className={`absolute rounded-2xl overflow-hidden border border-border/20 shadow-2xl animate-slideUp hero-card-${i}`}
                  >
                    <img src={pin.imageUrl} alt="" className="w-full h-full object-cover" loading="eager" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                  </div>
                ))}
                {/* Spacer to maintain layout flow */}
                <div className="w-full hero-spacer" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Category Pills */}
      <div className="w-full border-b border-border/30 bg-background/80 backdrop-blur-sm sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 py-3 overflow-x-auto scrollbar-none">
            <button
              onClick={() => setActiveCategory(null)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap smooth-transition ${!activeCategory
                  ? 'bg-accent text-accent-foreground'
                  : 'bg-card/60 text-foreground/60 hover:text-foreground hover:bg-card'
                }`}
            >
              All
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap smooth-transition ${activeCategory === cat
                    ? 'bg-accent text-accent-foreground'
                    : 'bg-card/60 text-foreground/60 hover:text-foreground hover:bg-card'
                  }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Feed */}
      <main className="flex-1 w-full py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <Flame className="w-5 h-5 text-accent" />
              <h2 className="text-2xl font-bold">
                {isLoggedIn && currentUser
                  ? `Welcome back, ${currentUser.displayName.split(' ')[0]}`
                  : 'Staff Picks'}
              </h2>
            </div>
            <Link href="/explore" className="flex items-center gap-1.5 text-sm text-foreground/50 hover:text-accent smooth-transition group">
              See all <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 smooth-transition" />
            </Link>
          </div>

          {feedPins.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Compass className="w-12 h-12 text-foreground/20 mb-4" />
              <h3 className="text-xl font-semibold text-foreground/60 mb-2">Nothing here yet</h3>
              <p className="text-foreground/40 max-w-md">
                {activeCategory
                  ? `No pins in "${activeCategory}" yet. Try another category or be the first to create one!`
                  : isLoggedIn
                    ? 'Be the first! Upload a pin and start building your visual universe.'
                    : 'Be the first to share some inspiration. Create an account to get started!'}
              </p>
              {isLoggedIn ? (
                <Link href="/create" className="luxury-button mt-6">Upload Your First Pin</Link>
              ) : (
                <button onClick={() => openAuthModal('signup')} className="luxury-button mt-6">Sign Up to Upload</button>
              )}
            </div>
          ) : (
            <>
              <div className="hidden sm:block">
                <MasonryGrid columns={3}>
                  {feedPins.map((pin) => (
                    <PinCard
                      key={pin.id}
                      id={pin.id}
                      title={pin.title}
                      description={pin.description}
                      imageUrl={pin.imageUrl}
                      authorId={pin.authorId}
                      likes={pin.likes}
                      saves={pin.saves}
                      comments={pin.comments}
                      board={pin.boardId}
                      views={pin.views}
                      createdAt={pin.createdAt}
                    />
                  ))}
                </MasonryGrid>
              </div>
              <div className="sm:hidden grid grid-cols-2 gap-3">
                {feedPins.map((pin) => (
                  <PinCard
                    key={pin.id}
                    id={pin.id}
                    title={pin.title}
                    description={pin.description}
                    imageUrl={pin.imageUrl}
                    authorId={pin.authorId}
                    likes={pin.likes}
                    saves={pin.saves}
                    comments={pin.comments}
                    board={pin.boardId}
                    views={pin.views}
                    createdAt={pin.createdAt}
                    compact
                  />
                ))}
              </div>
            </>
          )}

          {visibleCount < pins.filter(p => !p.isPrivate && (!activeCategory || p.category === activeCategory)).length && (
            <div className="flex justify-center mt-12">
              <button onClick={loadMore} className="luxury-button-outline flex items-center gap-2">
                Load More <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
