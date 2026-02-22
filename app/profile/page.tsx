'use client';

import React, { useState, useMemo } from 'react';
import Header from '@/components/header';
import Footer from '@/components/footer';
import PinCard from '@/components/pin-card';
import UserAvatar from '@/components/user-avatar';
import MasonryGrid from '@/components/masonry-grid';
import { Edit3, Share2, Settings, Bookmark, Heart, Copy } from 'lucide-react';
import Link from 'next/link';
import { useApp } from '@/lib/app-context';
import { formatCount } from '@/lib/helpers';

export default function ProfilePage() {
  const { currentUser, isLoggedIn, pins, getPinsByUser, getSavedPins, getBoardsByUser, openAuthModal } = useApp();
  const [activeTab, setActiveTab] = useState<'pins' | 'saved' | 'boards'>('pins');
  const [copied, setCopied] = useState(false);

  if (!isLoggedIn || !currentUser) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-3">Sign in to view your profile</h1>
            <p className="text-foreground/60 mb-6">Log in or create an account to manage your pins, boards, and settings.</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => openAuthModal('login')} className="luxury-button-outline px-6 py-2.5">Log In</button>
              <button onClick={() => openAuthModal('signup')} className="luxury-button px-6 py-2.5">Sign Up</button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const myPins = getPinsByUser(currentUser.id);
  const savedPins = getSavedPins();
  const myBoards = getBoardsByUser(currentUser.id);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.origin + '/user/' + currentUser.username);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <section className="w-full bg-gradient-to-b from-card/30 to-background py-12 border-b border-border/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row gap-8 items-start sm:items-end">
            <div className="relative">
              <UserAvatar userId={currentUser.id} displayName={currentUser.displayName} size="xl" />
            </div>
            <div className="flex-1">
              <h1 className="text-4xl font-bold mb-2">{currentUser.displayName}</h1>
              <p className="text-lg text-foreground/70 mb-4">@{currentUser.username} • {currentUser.bio}</p>
              {currentUser.website && (
                <a href={currentUser.website} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline text-sm mb-4 inline-block">{currentUser.website}</a>
              )}

              <div className="flex flex-wrap gap-8 mb-6">
                <div>
                  <div className="text-2xl font-bold text-accent">{myBoards.length}</div>
                  <p className="text-sm text-foreground/60">Boards</p>
                </div>
                <div>
                  <div className="text-2xl font-bold text-accent">{myPins.length}</div>
                  <p className="text-sm text-foreground/60">Pins</p>
                </div>
                <div>
                  <div className="text-2xl font-bold text-accent">{formatCount(currentUser.followers.length)}</div>
                  <p className="text-sm text-foreground/60">Followers</p>
                </div>
                <div>
                  <div className="text-2xl font-bold text-accent">{formatCount(currentUser.following.length)}</div>
                  <p className="text-sm text-foreground/60">Following</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link href="/settings" className="luxury-button flex items-center gap-2">
                  <Edit3 className="w-4 h-4" /> Edit Profile
                </Link>
                <button onClick={handleShare} className="luxury-button-outline flex items-center gap-2">
                  {copied ? <><Copy className="w-4 h-4" /> Copied!</> : <><Share2 className="w-4 h-4" /> Share Profile</>}
                </button>
                <Link href="/settings" className="luxury-button-outline flex items-center gap-2">
                  <Settings className="w-4 h-4" /> Settings
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="flex-1 w-full py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 mb-8 border-b border-border/30 pb-4">
            <button onClick={() => setActiveTab('pins')}
              className={`flex items-center gap-2 px-4 py-2 font-semibold smooth-transition border-b-2 ${activeTab === 'pins' ? 'border-accent text-accent' : 'border-transparent text-foreground/60 hover:text-foreground'}`}>
              <Heart className="w-5 h-5" /> My Pins ({myPins.length})
            </button>
            <button onClick={() => setActiveTab('saved')}
              className={`flex items-center gap-2 px-4 py-2 font-semibold smooth-transition border-b-2 ${activeTab === 'saved' ? 'border-accent text-accent' : 'border-transparent text-foreground/60 hover:text-foreground'}`}>
              <Bookmark className="w-5 h-5" /> Saved ({savedPins.length})
            </button>
            <button onClick={() => setActiveTab('boards')}
              className={`flex items-center gap-2 px-4 py-2 font-semibold smooth-transition border-b-2 ${activeTab === 'boards' ? 'border-accent text-accent' : 'border-transparent text-foreground/60 hover:text-foreground'}`}>
              📋 Boards ({myBoards.length})
            </button>
          </div>

          {activeTab === 'pins' && (
            <div>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-foreground">My Creations</h2>
                <p className="text-foreground/60 mt-1">All pins created by you</p>
              </div>
              {myPins.length > 0 ? (
                <MasonryGrid columns={3}>
                  {myPins.map(pin => (
                    <PinCard key={pin.id} id={pin.id} title={pin.title} imageUrl={pin.imageUrl} authorId={pin.authorId} likes={pin.likes} saves={pin.saves} comments={pin.comments} views={pin.views} createdAt={pin.createdAt} />
                  ))}
                </MasonryGrid>
              ) : (
                <div className="text-center py-12">
                  <p className="text-foreground/60 mb-4">You haven't created any pins yet.</p>
                  <Link href="/create" className="luxury-button">Create Your First Pin</Link>
                </div>
              )}
            </div>
          )}

          {activeTab === 'saved' && (
            <div>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-foreground">Saved Inspiration</h2>
                <p className="text-foreground/60 mt-1">Pins you've saved from the community</p>
              </div>
              {savedPins.length > 0 ? (
                <MasonryGrid columns={3}>
                  {savedPins.map(pin => (
                    <PinCard key={pin.id} id={pin.id} title={pin.title} imageUrl={pin.imageUrl} authorId={pin.authorId} likes={pin.likes} saves={pin.saves} comments={pin.comments} views={pin.views} createdAt={pin.createdAt} />
                  ))}
                </MasonryGrid>
              ) : (
                <div className="text-center py-12">
                  <p className="text-foreground/60 mb-4">You haven't saved any pins yet.</p>
                  <Link href="/explore" className="luxury-button">Explore Pins</Link>
                </div>
              )}
            </div>
          )}

          {activeTab === 'boards' && (
            <div>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-foreground">My Boards</h2>
                <p className="text-foreground/60 mt-1">Your curated collections</p>
              </div>
              {myBoards.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {myBoards.map(board => {
                    const boardPins = pins.filter(p => board.pins.includes(p.id));
                    return (
                      <Link key={board.id} href={`/board/${board.id}`} className="pin-card group cursor-pointer">
                        <div className="relative w-full h-40 bg-card/30 overflow-hidden">
                          {boardPins[0] ? (
                            <img src={boardPins[0].imageUrl} alt={board.name} className="w-full h-full object-cover group-hover:scale-105 smooth-transition" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-foreground/30 text-4xl">📋</div>
                          )}
                        </div>
                        <div className="p-4">
                          <h3 className="font-semibold text-foreground group-hover:text-accent smooth-transition">{board.name}</h3>
                          <p className="text-sm text-foreground/60 mt-1">{board.pins.length} pins • {board.isPrivate ? '🔒 Private' : '🌐 Public'}</p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-foreground/60 mb-4">You haven't created any boards yet.</p>
                  <Link href="/create" className="luxury-button">Create a Board</Link>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
