'use client';

import React, { useState, useMemo } from 'react';
import Header from '@/components/header';
import Footer from '@/components/footer';
import { Plus, Lock, Globe } from 'lucide-react';
import Link from 'next/link';
import { useApp } from '@/lib/app-context';
import { formatCount } from '@/lib/helpers';

export default function BoardsPage() {
  const { currentUser, isLoggedIn, boards, pins, createBoard, openAuthModal } = useApp();
  const [filterType, setFilterType] = useState<'all' | 'public' | 'private'>('all');
  const [showCreate, setShowCreate] = useState(false);
  const [newBoardName, setNewBoardName] = useState('');
  const [newBoardDesc, setNewBoardDesc] = useState('');
  const [newBoardPrivate, setNewBoardPrivate] = useState(false);

  const myBoards = useMemo(() => {
    if (!currentUser) return boards.filter(b => !b.isPrivate);
    return boards.filter(b => b.ownerId === currentUser.id);
  }, [boards, currentUser]);

  const filteredBoards = useMemo(() => {
    if (filterType === 'public') return myBoards.filter(b => !b.isPrivate);
    if (filterType === 'private') return myBoards.filter(b => b.isPrivate);
    return myBoards;
  }, [myBoards, filterType]);

  const handleCreateBoard = async () => {
    if (!newBoardName.trim() || !isLoggedIn) return;
    try {
      await createBoard({
        name: newBoardName.trim(),
        description: newBoardDesc.trim(),
        coverImage: '',
        ownerId: currentUser!.id,
        isPrivate: newBoardPrivate,
        category: 'All',
      });
    } catch (err) {
      console.error('Failed to create board:', err);
    }
    setNewBoardName('');
    setNewBoardDesc('');
    setNewBoardPrivate(false);
    setShowCreate(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <section className="w-full bg-gradient-to-b from-card/30 to-background py-16 border-b border-border/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-6">
            <h1 className="text-5xl sm:text-6xl font-bold">{isLoggedIn ? 'Your Boards' : 'Boards'}</h1>
            <p className="text-xl text-foreground/70 max-w-2xl">
              {isLoggedIn ? 'Organize your pins into collections and collaborate with others.' : 'Browse collections curated by the community.'}
            </p>
            {isLoggedIn ? (
              <button onClick={() => setShowCreate(true)} className="luxury-button w-fit flex items-center gap-2">
                <Plus className="w-5 h-5" /> Create New Board
              </button>
            ) : (
              <button onClick={() => openAuthModal('signup')} className="luxury-button w-fit flex items-center gap-2">
                <Plus className="w-5 h-5" /> Sign Up to Create Boards
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Create Board Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowCreate(false)}>
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h2 className="text-2xl font-bold mb-4">Create New Board</h2>
            <input type="text" placeholder="Board name" value={newBoardName} onChange={e => setNewBoardName(e.target.value)}
              className="w-full bg-background/50 border border-border/30 rounded-lg px-4 py-2 mb-3 text-foreground focus:outline-none focus:border-accent/50" />
            <textarea placeholder="Description (optional)" value={newBoardDesc} onChange={e => setNewBoardDesc(e.target.value)} rows={2}
              className="w-full bg-background/50 border border-border/30 rounded-lg px-4 py-2 mb-3 text-foreground focus:outline-none focus:border-accent/50 resize-none" />
            <label className="flex items-center gap-2 mb-4 text-sm text-foreground/70 cursor-pointer">
              <input type="checkbox" checked={newBoardPrivate} onChange={e => setNewBoardPrivate(e.target.checked)} className="w-4 h-4 rounded accent" />
              Make this board private
            </label>
            <div className="flex gap-3">
              <button onClick={handleCreateBoard} disabled={!newBoardName.trim()} className="luxury-button flex-1 disabled:opacity-50">Create</button>
              <button onClick={() => setShowCreate(false)} className="luxury-button-outline flex-1">Cancel</button>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 w-full py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 mb-8 border-b border-border/30 pb-4">
            {(['all', 'public', 'private'] as const).map(type => (
              <button key={type} onClick={() => setFilterType(type)}
                className={`px-4 py-2 font-semibold smooth-transition border-b-2 capitalize ${filterType === type ? 'border-accent text-accent' : 'border-transparent text-foreground/60 hover:text-foreground'}`}>
                {type} ({type === 'all' ? myBoards.length : type === 'public' ? myBoards.filter(b => !b.isPrivate).length : myBoards.filter(b => b.isPrivate).length})
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBoards.map(board => {
              const boardPins = pins.filter(p => board.pins.includes(p.id));
              const coverImg = boardPins[0]?.imageUrl || board.coverImage;
              return (
                <Link key={board.id} href={`/board/${board.id}`} className="pin-card flex flex-col h-full group cursor-pointer animate-slideUp">
                  <div className="relative w-full h-40 bg-card/30 overflow-hidden">
                    {coverImg ? (
                      <img src={coverImg} alt={board.name} className="w-full h-full object-cover group-hover:scale-105 smooth-transition" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-foreground/20 text-5xl">📋</div>
                    )}
                  </div>
                  <div className="p-4 flex flex-col gap-3 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold text-foreground line-clamp-2 group-hover:text-accent smooth-transition">{board.name}</h3>
                        <p className="text-sm text-foreground/60 line-clamp-1 mt-1">{board.description}</p>
                      </div>
                      {board.isPrivate ? <Lock className="w-4 h-4 text-foreground/60 flex-shrink-0 mt-1" /> : <Globe className="w-4 h-4 text-foreground/60 flex-shrink-0 mt-1" />}
                    </div>
                    <div className="text-xs text-foreground/60 space-y-1 border-t border-border/30 pt-3">
                      <div className="flex justify-between">
                        <span>📌 {board.pins.length} pins</span>
                      </div>
                      {!board.isPrivate && (
                        <div className="text-accent font-medium">⭐ {formatCount(board.followers.length)} followers</div>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {filteredBoards.length === 0 && (
            <div className="text-center py-12">
              <p className="text-lg text-foreground/60 mb-4">No boards found.</p>
              {isLoggedIn && (
                <button onClick={() => setShowCreate(true)} className="luxury-button inline-flex items-center gap-2">
                  <Plus className="w-5 h-5" /> Create Your First Board
                </button>
              )}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
