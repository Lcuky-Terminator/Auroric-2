'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Header from '@/components/header';
import Footer from '@/components/footer';
import PinCard from '@/components/pin-card';
import UserAvatar from '@/components/user-avatar';
import MasonryGrid from '@/components/masonry-grid';
import { Search, X, Loader2, Clock, Calendar } from 'lucide-react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useApp } from '@/lib/app-context';
import { api } from '@/lib/api-client';
import { formatCount } from '@/lib/helpers';
import type { Pin, User, Board } from '@/lib/types';

type AgeFilter = 'all' | 'new' | '1year' | '2year' | '2year+';

const AGE_FILTERS: { value: AgeFilter; label: string; icon: string }[] = [
  { value: 'all', label: 'All Time', icon: '🌐' },
  { value: 'new', label: 'Just Posted', icon: '🆕' },
  { value: '1year', label: '1 Year Old', icon: '📅' },
  { value: '2year', label: '2 Years Old', icon: '📆' },
  { value: '2year+', label: '2+ Years Old', icon: '🏛️' },
];

function filterByAge(pins: Pin[], filter: AgeFilter): Pin[] {
  if (filter === 'all') return pins;

  const now = new Date();

  return pins.filter(pin => {
    const created = new Date(pin.createdAt);
    const ageMs = now.getTime() - created.getTime();
    const ageDays = ageMs / (1000 * 60 * 60 * 24);
    const ageYears = ageDays / 365;

    switch (filter) {
      case 'new':
        // Posted within the last 24 hours
        return ageDays <= 1;
      case '1year':
        // Between 6 months and 1.5 years old
        return ageYears >= 0.5 && ageYears < 1.5;
      case '2year':
        // Between 1.5 and 2.5 years old
        return ageYears >= 1.5 && ageYears < 2.5;
      case '2year+':
        // Older than 2 years
        return ageYears >= 2;
      default:
        return true;
    }
  });
}

export default function SearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { searchPins: localSearchPins, searchUsers: localSearchUsers, searchBoards: localSearchBoards } = useApp();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [searchType, setSearchType] = useState<'all' | 'pins' | 'boards' | 'users'>('all');
  const [ageFilter, setAgeFilter] = useState<AgeFilter>('all');
  const [loading, setLoading] = useState(false);
  const [pinResults, setPinResults] = useState<Pin[]>([]);
  const [userResults, setUserResults] = useState<User[]>([]);
  const [boardResults, setBoardResults] = useState<Board[]>([]);

  useEffect(() => {
    const q = searchParams.get('q');
    if (q) setSearchQuery(q);
  }, [searchParams]);

  // Search via API with fallback to local
  useEffect(() => {
    if (!searchQuery.trim()) {
      setPinResults([]);
      setUserResults([]);
      setBoardResults([]);
      return;
    }

    // Immediately show local results for instant feedback
    setPinResults(localSearchPins(searchQuery));
    setUserResults(localSearchUsers(searchQuery));
    setBoardResults(localSearchBoards(searchQuery));

    // Then fetch from server for accurate results
    setLoading(true);
    api.search(searchQuery)
      .then(({ pins, users, boards }) => {
        setPinResults(pins);
        setUserResults(users);
        setBoardResults(boards);
      })
      .catch(() => {
        // Keep local results on error
      })
      .finally(() => setLoading(false));
  }, [searchQuery, localSearchPins, localSearchUsers, localSearchBoards]);

  // Apply age filter to pin results
  const filteredPins = useMemo(() => filterByAge(pinResults, ageFilter), [pinResults, ageFilter]);

  const totalResults = filteredPins.length + userResults.length + boardResults.length;

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
          <h1 className="text-4xl font-bold mb-6">Search Auroric</h1>
          <form onSubmit={handleSearch} className="relative max-w-2xl">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-6 h-6 text-foreground/40" />
            <input
              type="text"
              placeholder="Search pins, boards, or creators..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-card/50 border border-border/30 rounded-full pl-14 pr-12 py-3 text-lg text-foreground placeholder:text-foreground/40 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 smooth-transition"
            />
            {searchQuery && (
              <button type="button" onClick={() => { setSearchQuery(''); router.push('/search'); }}
                aria-label="Clear search"
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-foreground/60 hover:text-foreground smooth-transition">
                <X className="w-5 h-5" />
              </button>
            )}
          </form>
        </div>
      </section>

      <main className="flex-1 w-full py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {searchQuery ? (
            <>
              <div className="flex items-center gap-2 mb-4 border-b border-border/30 pb-4 overflow-x-auto">
                {[
                  { value: 'all', label: `All (${totalResults})` },
                  { value: 'pins', label: `Pins (${filteredPins.length})` },
                  { value: 'boards', label: `Boards (${boardResults.length})` },
                  { value: 'users', label: `Users (${userResults.length})` },
                ].map(filter => (
                  <button key={filter.value} onClick={() => setSearchType(filter.value as any)}
                    className={`px-4 py-2 font-semibold whitespace-nowrap smooth-transition border-b-2 ${searchType === filter.value ? 'border-accent text-accent' : 'border-transparent text-foreground/60 hover:text-foreground'}`}>
                    {filter.label}
                  </button>
                ))}
              </div>

              {/* Age Filter Chips — only shown for pins */}
              {(searchType === 'all' || searchType === 'pins') && (
                <div className="flex flex-wrap items-center gap-2 mb-6">
                  <Calendar className="w-4 h-4 text-foreground/40" />
                  <span className="text-sm text-foreground/40 mr-1">Filter by age:</span>
                  {AGE_FILTERS.map(f => (
                    <button
                      key={f.value}
                      onClick={() => setAgeFilter(f.value)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium smooth-transition flex items-center gap-1.5 ${ageFilter === f.value
                          ? 'bg-accent/20 text-accent border border-accent/50'
                          : 'bg-card/40 text-foreground/60 hover:bg-card/70 hover:text-foreground border border-transparent'
                        }`}
                    >
                      <span>{f.icon}</span>
                      {f.label}
                    </button>
                  ))}
                </div>
              )}

              <h2 className="text-xl font-bold mb-8 flex items-center gap-2">
                Results for <span className="text-accent">"{searchQuery}"</span>
                {ageFilter !== 'all' && (
                  <span className="text-sm font-normal text-foreground/50">
                    · {AGE_FILTERS.find(f => f.value === ageFilter)?.label}
                  </span>
                )}
                {loading && <Loader2 className="w-4 h-4 animate-spin text-accent" />}
              </h2>

              {/* Pins */}
              {(searchType === 'all' || searchType === 'pins') && filteredPins.length > 0 && (
                <div className="mb-12">
                  {searchType === 'all' && <h3 className="text-lg font-bold mb-4">Pins</h3>}
                  <MasonryGrid columns={3}>
                    {filteredPins.map(pin => (
                      <PinCard key={pin.id} id={pin.id} title={pin.title} imageUrl={pin.imageUrl} authorId={pin.authorId} likes={pin.likes} saves={pin.saves} comments={pin.comments} views={pin.views} createdAt={pin.createdAt} />
                    ))}
                  </MasonryGrid>
                </div>
              )}

              {/* No pins with age filter */}
              {(searchType === 'all' || searchType === 'pins') && filteredPins.length === 0 && pinResults.length > 0 && ageFilter !== 'all' && (
                <div className="mb-12 text-center py-8 rounded-xl border border-border/20 bg-card/5">
                  <Clock className="w-8 h-8 text-foreground/20 mx-auto mb-3" />
                  <p className="text-foreground/60">No pins match the "{AGE_FILTERS.find(f => f.value === ageFilter)?.label}" filter.</p>
                  <button onClick={() => setAgeFilter('all')} className="text-accent hover:underline text-sm mt-2">
                    Show all time periods
                  </button>
                </div>
              )}

              {/* Users */}
              {(searchType === 'all' || searchType === 'users') && userResults.length > 0 && (
                <div className="mb-12">
                  {searchType === 'all' && <h3 className="text-lg font-bold mb-4">Users</h3>}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {userResults.map(user => (
                      <Link key={user.id} href={`/user/${user.username}`} className="pin-card p-4 flex items-center gap-4 group hover:border-accent/50">
                        <UserAvatar userId={user.id} displayName={user.displayName} size="lg" />
                        <div>
                          <p className="font-semibold text-foreground group-hover:text-accent smooth-transition">{user.displayName}</p>
                          <p className="text-sm text-foreground/60">@{user.username}</p>
                          <p className="text-xs text-foreground/50 mt-1">{formatCount(user.followers.length)} followers</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Boards */}
              {(searchType === 'all' || searchType === 'boards') && boardResults.length > 0 && (
                <div className="mb-12">
                  {searchType === 'all' && <h3 className="text-lg font-bold mb-4">Boards</h3>}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {boardResults.map(board => (
                      <Link key={board.id} href={`/board/${board.id}`} className="pin-card p-4 group hover:border-accent/50">
                        <h4 className="font-semibold text-foreground group-hover:text-accent smooth-transition">{board.name}</h4>
                        <p className="text-sm text-foreground/60 line-clamp-2 mt-1">{board.description}</p>
                        <p className="text-xs text-foreground/50 mt-2">{board.pins.length} pins • {board.isPrivate ? '🔒 Private' : '🌐 Public'}</p>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {totalResults === 0 && (
                <div className="text-center py-16">
                  <Search className="w-16 h-16 text-foreground/20 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-foreground mb-2">No Results</h2>
                  <p className="text-lg text-foreground/60">No matches found for "{searchQuery}". Try different keywords.</p>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-16">
              <Search className="w-16 h-16 text-foreground/20 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-foreground mb-2">Start Searching</h2>
              <p className="text-lg text-foreground/60">Enter a search term to find pins, boards, and creators on Auroric</p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
