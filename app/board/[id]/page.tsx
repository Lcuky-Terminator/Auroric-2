'use client';

import React, { useState, useMemo, use } from 'react';
import Header from '@/components/header';
import Footer from '@/components/footer';
import PinCard from '@/components/pin-card';
import UserAvatar from '@/components/user-avatar';
import MasonryGrid from '@/components/masonry-grid';
import { Share2, Trash2, Edit3, Lock, Globe, Copy } from 'lucide-react';
import Link from 'next/link';
import { useApp } from '@/lib/app-context';
import { useRouter } from 'next/navigation';
import { formatCount, timeAgo } from '@/lib/helpers';

export default function BoardDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: boardId } = use(params);
  const router = useRouter();
  const { getBoard, getUser, currentUser, isLoggedIn, pins, deleteBoard, updateBoard, toggleFollowBoard } = useApp();
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [copied, setCopied] = useState(false);

  const board = getBoard(boardId);
  const owner = board ? getUser(board.ownerId) : undefined;
  const isOwner = board && currentUser ? board.ownerId === currentUser.id : false;
  const isFollowing = board && currentUser ? board.followers.includes(currentUser.id) : false;

  const boardPins = useMemo(() => {
    if (!board) return [];
    return pins.filter(p => board.pins.includes(p.id));
  }, [board, pins]);

  if (!board) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-4">Board Not Found</h1>
            <Link href="/boards" className="luxury-button">View All Boards</Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const handleStartEdit = () => {
    setEditName(board.name);
    setEditDesc(board.description);
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    updateBoard(board.id, { name: editName.trim(), description: editDesc.trim() });
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (confirm('Delete this board? Pins will not be deleted.')) {
      deleteBoard(board.id);
      router.push('/boards');
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href).catch(() => { });
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const coverImg = boardPins[0]?.imageUrl || board.coverImage;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <section className="w-full bg-gradient-to-b from-card/30 to-background py-12 border-b border-border/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row gap-8 items-start">
            <div className="w-full sm:w-48 flex-shrink-0">
              {coverImg ? (
                <img src={coverImg} alt={board.name} className="w-full rounded-xl object-cover border border-border/30 max-h-48" loading="lazy" />
              ) : (
                <div className="w-full h-48 rounded-xl bg-card/30 border border-border/30 flex items-center justify-center text-5xl text-foreground/20">📋</div>
              )}
            </div>

            <div className="flex-1">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  {isEditing ? (
                    <div className="space-y-2 mb-4">
                      <input type="text" value={editName} onChange={e => setEditName(e.target.value)} aria-label="Board name"
                        className="text-3xl font-bold bg-background/50 border border-border/30 rounded-lg px-3 py-1 text-foreground focus:outline-none focus:border-accent/50 w-full" />
                      <textarea value={editDesc} onChange={e => setEditDesc(e.target.value)} rows={2} aria-label="Board description"
                        className="w-full bg-background/50 border border-border/30 rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-accent/50 resize-none" />
                      <div className="flex gap-2">
                        <button onClick={handleSaveEdit} className="luxury-button text-sm">Save</button>
                        <button onClick={() => setIsEditing(false)} className="luxury-button-outline text-sm">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <h1 className="text-4xl font-bold mb-2">{board.name}</h1>
                      <div className="flex items-center gap-4 text-sm text-foreground/60 mb-4">
                        {owner && (
                          <Link href={`/user/${owner.username}`} className="flex items-center gap-2 hover:text-accent smooth-transition">
                            <UserAvatar userId={owner.id} displayName={owner.displayName} size="sm" />
                            <span>{owner.displayName}</span>
                          </Link>
                        )}
                        <span>•</span>
                        <span>{timeAgo(board.createdAt)}</span>
                      </div>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {board.isPrivate ? <Lock className="w-5 h-5 text-foreground/60" /> : <Globe className="w-5 h-5 text-foreground/60" />}
                </div>
              </div>

              {!isEditing && <p className="text-lg text-foreground/80 mb-6">{board.description}</p>}

              <div className="flex gap-8 mb-6 text-sm">
                <div>
                  <div className="text-2xl font-bold text-accent">{boardPins.length}</div>
                  <p className="text-foreground/60">Pins</p>
                </div>
                <div>
                  <div className="text-2xl font-bold text-accent">{formatCount(board.followers.length)}</div>
                  <p className="text-foreground/60">Followers</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                {!isOwner && isLoggedIn && (
                  <button onClick={() => toggleFollowBoard(board.id)}
                    className={`luxury-button flex items-center gap-2 ${isFollowing ? 'opacity-80' : ''}`}>
                    {isFollowing ? 'Following' : 'Follow Board'}
                  </button>
                )}
                <button onClick={handleShare} className="luxury-button-outline flex items-center gap-2">
                  {copied ? <><Copy className="w-4 h-4" /> Copied!</> : <><Share2 className="w-4 h-4" /> Share</>}
                </button>
                {isOwner && (
                  <>
                    <button onClick={handleStartEdit} className="luxury-button-outline flex items-center gap-2">
                      <Edit3 className="w-4 h-4" /> Edit
                    </button>
                    <button onClick={handleDelete} className="luxury-button-outline flex items-center gap-2 text-red-400 border-red-400/30 hover:bg-red-400/10">
                      <Trash2 className="w-4 h-4" /> Delete
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="flex-1 w-full py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold mb-8">{boardPins.length} Pins</h2>
          {boardPins.length > 0 ? (
            <MasonryGrid columns={3}>
              {boardPins.map(pin => (
                <PinCard key={pin.id} id={pin.id} title={pin.title} imageUrl={pin.imageUrl} authorId={pin.authorId} likes={pin.likes} saves={pin.saves} comments={pin.comments} views={pin.views} createdAt={pin.createdAt} />
              ))}
            </MasonryGrid>
          ) : (
            <div className="text-center py-16">
              <p className="text-lg text-foreground/60">No pins in this board yet.</p>
              {isOwner && <Link href="/create" className="luxury-button mt-4 inline-block">Add a Pin</Link>}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
