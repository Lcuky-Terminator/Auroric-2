'use client';

import React, { useState, useEffect } from 'react';
import Header from '@/components/header';
import Footer from '@/components/footer';
import PinCard from '@/components/pin-card';
import MasonryGrid from '@/components/masonry-grid';
import { Eye, Heart, MessageCircle, Crown, TrendingUp, Sparkles } from 'lucide-react';
import { api } from '@/lib/api-client';
import { CATEGORIES } from '@/lib/types';
import type { Pin } from '@/lib/types';
import { formatCount } from '@/lib/helpers';

type SortBy = 'views' | 'likes' | 'comments';

const SECTIONS: { key: SortBy; label: string; icon: React.ReactNode; color: string; gradient: string }[] = [
  {
    key: 'views',
    label: 'Most Viewed',
    icon: <Eye className="w-6 h-6" />,
    color: 'text-blue-400',
    gradient: 'from-blue-500/20 to-blue-600/5',
  },
  {
    key: 'likes',
    label: 'Most Liked',
    icon: <Heart className="w-6 h-6" />,
    color: 'text-red-400',
    gradient: 'from-red-500/20 to-red-600/5',
  },
  {
    key: 'comments',
    label: 'Most Discussed',
    icon: <MessageCircle className="w-6 h-6" />,
    color: 'text-green-400',
    gradient: 'from-green-500/20 to-green-600/5',
  },
];

function SectionBadge({ rank, metric, value, color }: { rank: number; metric: SortBy; value: number; color: string }) {
  const Icon = metric === 'views' ? Eye : metric === 'likes' ? Heart : MessageCircle;
  return (
    <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5">
      <div className={`flex items-center gap-1 bg-black/60 backdrop-blur-sm rounded-full px-2.5 py-1 border border-white/10`}>
        {rank <= 3 && <Crown className={`w-3.5 h-3.5 ${rank === 1 ? 'text-yellow-400' : rank === 2 ? 'text-gray-300' : 'text-amber-600'}`} />}
        <span className="text-xs font-bold text-white">#{rank}</span>
      </div>
      <div className={`flex items-center gap-1 bg-black/60 backdrop-blur-sm rounded-full px-2.5 py-1 border border-white/10`}>
        <Icon className={`w-3.5 h-3.5 ${color}`} />
        <span className="text-xs font-medium text-white">{formatCount(value)}</span>
      </div>
    </div>
  );
}

export default function PopularPage() {
  const [activeSection, setActiveSection] = useState<SortBy | 'all'>('all');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [data, setData] = useState<Record<SortBy, Pin[]>>({ views: [], likes: [], comments: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const cat = selectedCategory !== 'All' ? selectedCategory : undefined;

    Promise.allSettled([
      api.getPopularPins('views', 15, cat),
      api.getPopularPins('likes', 15, cat),
      api.getPopularPins('comments', 15, cat),
    ]).then(([viewsRes, likesRes, commentsRes]) => {
      setData({
        views: viewsRes.status === 'fulfilled' ? viewsRes.value : [],
        likes: likesRes.status === 'fulfilled' ? likesRes.value : [],
        comments: commentsRes.status === 'fulfilled' ? commentsRes.value : [],
      });
      setLoading(false);
    });
  }, [selectedCategory]);

  const getMetricValue = (pin: Pin, metric: SortBy): number => {
    switch (metric) {
      case 'views': return pin.views ?? 0;
      case 'likes': return pin.likes.length;
      case 'comments': return pin.comments.length;
    }
  };

  const sectionsToShow = activeSection === 'all' ? SECTIONS : SECTIONS.filter(s => s.key === activeSection);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      {/* Hero */}
      <section className="w-full bg-gradient-to-br from-card/50 via-accent/5 to-background py-16 border-b border-border/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-4">
            <Sparkles className="w-8 h-8 text-accent" />
            <h1 className="text-5xl sm:text-6xl font-bold">Popular Pins</h1>
          </div>
          <p className="text-xl text-foreground/70 max-w-2xl mb-8">
            Discover the most viewed, liked, and discussed pins across the community.
          </p>

          {/* Section Tabs */}
          <div className="flex flex-wrap gap-2 mb-6">
            <button
              onClick={() => setActiveSection('all')}
              className={`px-4 py-2 rounded-full font-medium smooth-transition flex items-center gap-2 ${activeSection === 'all'
                  ? 'bg-accent text-accent-foreground'
                  : 'bg-card/50 text-foreground/70 hover:bg-card/80'
                }`}
            >
              <TrendingUp className="w-4 h-4" /> All Sections
            </button>
            {SECTIONS.map(section => (
              <button
                key={section.key}
                onClick={() => setActiveSection(section.key)}
                className={`px-4 py-2 rounded-full font-medium smooth-transition flex items-center gap-2 ${activeSection === section.key
                    ? 'bg-accent text-accent-foreground'
                    : 'bg-card/50 text-foreground/70 hover:bg-card/80'
                  }`}
              >
                {section.icon} {section.label}
              </button>
            ))}
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium smooth-transition ${selectedCategory === cat
                    ? 'bg-accent/80 text-accent-foreground'
                    : 'bg-card/30 text-foreground/50 hover:bg-card/60'
                  }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Content */}
      <main className="flex-1 w-full py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="space-y-16">
              {[1, 2, 3].map(i => (
                <div key={i}>
                  <div className="h-8 bg-card/30 rounded w-48 mb-6 animate-pulse" />
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(j => (
                      <div key={j} className="aspect-[3/4] bg-card/30 rounded-2xl animate-pulse" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-16">
              {sectionsToShow.map(section => {
                const pins = data[section.key];
                return (
                  <section key={section.key}>
                    {/* Section Header */}
                    <div className={`rounded-2xl bg-gradient-to-r ${section.gradient} border border-border/20 p-6 mb-8`}>
                      <div className="flex items-center gap-3">
                        <div className={`${section.color}`}>{section.icon}</div>
                        <div>
                          <h2 className="text-2xl sm:text-3xl font-bold">{section.label}</h2>
                          <p className="text-sm text-foreground/50 mt-1">
                            {section.key === 'views' && 'Pins with the highest view counts'}
                            {section.key === 'likes' && 'The community\'s favorite pins'}
                            {section.key === 'comments' && 'Pins sparking the most conversations'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {pins.length > 0 ? (
                      <MasonryGrid columns={activeSection === 'all' ? 3 : 4}>
                        {pins.map((pin, index) => (
                          <div key={pin.id} className="relative">
                            <SectionBadge
                              rank={index + 1}
                              metric={section.key}
                              value={getMetricValue(pin, section.key)}
                              color={section.color}
                            />
                            <PinCard
                              id={pin.id}
                              title={pin.title}
                              imageUrl={pin.imageUrl}
                              authorId={pin.authorId}
                              likes={pin.likes}
                              saves={pin.saves}
                              comments={pin.comments}
                              views={pin.views}
                              createdAt={pin.createdAt}
                            />
                          </div>
                        ))}
                      </MasonryGrid>
                    ) : (
                      <div className="text-center py-12 rounded-2xl border border-border/20 bg-card/10">
                        <div className={`${section.color} mx-auto mb-3`}>{section.icon}</div>
                        <p className="text-foreground/50">No popular pins in this category yet.</p>
                      </div>
                    )}
                  </section>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
