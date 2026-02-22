'use client';

import React, { useState, useMemo } from 'react';
import Header from '@/components/header';
import Footer from '@/components/footer';
import PinCard from '@/components/pin-card';
import MasonryGrid from '@/components/masonry-grid';
import { Filter, Search, Grid, List, Compass } from 'lucide-react';
import { useApp } from '@/lib/app-context';
import { CATEGORIES } from '@/lib/types';
import { useRouter } from 'next/navigation';

export default function ExplorePage() {
  const { searchPins, pins } = useApp();
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'popular' | 'trending'>('recent');
  const [visibleCount, setVisibleCount] = useState(12);

  const filteredPins = useMemo(() => {
    let results = searchPins(searchQuery, selectedCategory);
    if (sortBy === 'popular') {
      results.sort((a, b) => (b.likes.length + b.saves.length) - (a.likes.length + a.saves.length));
    } else if (sortBy === 'trending') {
      results.sort((a, b) => (b.likes.length + b.comments.length) - (a.likes.length + a.comments.length));
    } else {
      results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return results;
  }, [searchQuery, selectedCategory, sortBy, pins]);

  const visiblePins = filteredPins.slice(0, visibleCount);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <section className="w-full bg-gradient-to-b from-card/30 to-background py-12 border-b border-border/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">Explore Inspiration</h1>
          <p className="text-lg text-foreground/70 mb-6">Discover amazing pins curated by our community</p>

          <form onSubmit={handleSearch} className="relative max-w-2xl">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-foreground/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search pins, boards, or creators..."
              className="w-full bg-card/50 border border-border/30 rounded-full pl-12 pr-4 py-3 text-foreground placeholder:text-foreground/40 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 smooth-transition"
            />
          </form>
        </div>
      </section>

      <main className="flex-1 w-full py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-8">
            <aside className="w-full lg:w-64 flex-shrink-0">
              <div className="sticky top-20 space-y-6">
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Filter className="w-5 h-5 text-accent" />
                    <h3 className="font-semibold text-foreground">Categories</h3>
                  </div>
                  <div className="space-y-1">
                    {CATEGORIES.map((category) => (
                      <button
                        key={category}
                        onClick={() => { setSelectedCategory(category); setVisibleCount(12); }}
                        className={`block w-full text-left px-3 py-2 rounded-lg smooth-transition text-sm ${selectedCategory === category
                            ? 'bg-accent/20 text-accent border border-accent/50'
                            : 'text-foreground/70 hover:bg-card/50 hover:text-foreground'
                          }`}
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="border-t border-border/30 pt-6">
                  <h3 className="font-semibold text-foreground mb-3 text-sm">Sort By</h3>
                  <div className="space-y-2">
                    {[
                      { value: 'recent', label: 'Most Recent' },
                      { value: 'popular', label: 'Most Popular' },
                      { value: 'trending', label: 'Trending Now' },
                    ].map(opt => (
                      <label key={opt.value} className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="radio"
                          name="sortBy"
                          checked={sortBy === opt.value}
                          onChange={() => setSortBy(opt.value as typeof sortBy)}
                          className="w-4 h-4 accent-[hsl(var(--accent))]"
                        />
                        <span className="text-sm text-foreground/70">{opt.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </aside>

            <div className="flex-1">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-foreground">{selectedCategory}</h2>
                  <p className="text-sm text-foreground/60 mt-1">{filteredPins.length} pins found</p>
                </div>
                <div className="flex items-center gap-2 bg-card/30 rounded-lg p-1 border border-border/30">
                  <button
                    onClick={() => setViewMode('grid')}
                    aria-label="Grid view"
                    className={`p-2 rounded smooth-transition ${viewMode === 'grid' ? 'bg-accent/20 text-accent' : 'text-foreground/60 hover:text-foreground'}`}
                  >
                    <Grid className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    aria-label="List view"
                    className={`p-2 rounded smooth-transition ${viewMode === 'list' ? 'bg-accent/20 text-accent' : 'text-foreground/60 hover:text-foreground'}`}
                  >
                    <List className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {filteredPins.length === 0 ? (
                <div className="text-center py-16">
                  <Compass className="w-12 h-12 text-foreground/20 mx-auto mb-4" />
                  <p className="text-lg text-foreground/60 mb-2">No pins found</p>
                  <p className="text-sm text-foreground/40">Try a different category, or be the first to upload a pin!</p>
                </div>
              ) : viewMode === 'grid' ? (
                <MasonryGrid columns={3}>
                  {visiblePins.map((pin) => (
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
              ) : (
                <div className="space-y-4">
                  {visiblePins.map((pin) => (
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
                </div>
              )}

              {visibleCount < filteredPins.length && (
                <div className="flex justify-center mt-16">
                  <button onClick={() => setVisibleCount(p => p + 12)} className="luxury-button-outline">
                    Load More
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
