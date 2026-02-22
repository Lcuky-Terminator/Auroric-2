'use client';

import React, { useState, useMemo, use, useEffect, useRef } from 'react';
import Header from '@/components/header';
import Footer from '@/components/footer';
import PinCard from '@/components/pin-card';
import UserAvatar from '@/components/user-avatar';
import FollowButton from '@/components/follow-button';
import SaveToBoardModal from '@/components/save-to-board-modal';
import { Heart, MessageCircle, Share2, Copy, Bookmark, Trash2, Send, Eye } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/app-context';
import { timeAgo, formatCount } from '@/lib/helpers';

export default function PinDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: pinId } = use(params);
  const router = useRouter();
  const { getPin, getUser, currentUser, isLoggedIn, toggleLike, toggleSave, addComment, deleteComment, toggleCommentLike, toggleFollow, pins, deletePin: deletePinAction, getBoard, openAuthModal } = useApp();
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [showSaveModal, setShowSaveModal] = useState(false);

  const pin = getPin(pinId);

  const author = pin ? getUser(pin.authorId) : undefined;
  const isLiked = pin && currentUser ? pin.likes.includes(currentUser.id) : false;
  const isSaved = pin && currentUser ? pin.saves.includes(currentUser.id) : false;
  const isOwner = pin && currentUser ? pin.authorId === currentUser.id : false;
  const isFollowingAuthor = currentUser && author ? currentUser.following.includes(author.id) : false;
  const boardData = pin?.boardId ? getBoard(pin.boardId) : undefined;

  const relatedPins = useMemo(() => {
    if (!pin) return [];
    return pins
      .filter(p => p.id !== pin.id && !p.isPrivate && (p.category === pin.category || p.tags.some(t => pin.tags.includes(t))))
      .slice(0, 6);
  }, [pin, pins]);

  // ── Track view after 2 seconds on the page ──
  const viewTracked = useRef(false);
  useEffect(() => {
    if (!pin || viewTracked.current) return;
    const timer = setTimeout(() => {
      viewTracked.current = true;
      fetch(`/api/pins/${pin.id}/view`, { method: 'POST' }).catch(() => { });
    }, 2000);
    return () => clearTimeout(timer);
  }, [pin]);

  if (!pin) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-4">Pin Not Found</h1>
            <Link href="/explore" className="luxury-button">Explore Pins</Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href).catch(() => { });
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleComment = () => {
    if (!commentText.trim() || !isLoggedIn) return;
    addComment(pin.id, commentText.trim());
    setCommentText('');
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this pin?')) {
      deletePinAction(pin.id);
      router.push('/profile');
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 w-full py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Pin Image */}
            <div className="lg:col-span-2">
              <div className="relative rounded-2xl overflow-hidden bg-card/30 border border-border/30 animate-slideUp">
                <img src={pin.imageUrl} alt={pin.title} className="w-full h-auto object-cover" loading="eager" onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }} />

                <div className="absolute top-4 right-4 flex gap-2 z-10">
                  <div className="relative">
                    <button onClick={() => setShowShareMenu(!showShareMenu)} aria-label="Share" className="p-3 rounded-full bg-black/40 hover:bg-black/60 smooth-transition backdrop-blur-sm">
                      <Share2 className="w-5 h-5 text-white" />
                    </button>
                    {showShareMenu && (
                      <div className="absolute top-12 right-0 bg-card border border-border rounded-lg shadow-xl p-2 space-y-1 animate-slideUp min-w-[160px]">
                        <button onClick={handleCopyLink} className="flex items-center gap-2 w-full px-3 py-2 text-foreground/80 hover:bg-background/50 smooth-transition rounded text-sm">
                          <Copy className="w-4 h-4" /> {copied ? 'Copied!' : 'Copy Link'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Comments Section */}
              <div className="mt-8">
                <h3 className="text-2xl font-bold mb-6">Comments ({pin.comments.length})</h3>

                {isLoggedIn ? (
                  <div className="flex gap-4 mb-6">
                    <UserAvatar userId={currentUser!.id} displayName={currentUser!.displayName} size="md" />
                    <div className="flex-1">
                      <textarea
                        value={commentText}
                        onChange={e => setCommentText(e.target.value)}
                        placeholder="Add a comment..."
                        className="w-full bg-card/50 border border-border/30 rounded-lg px-4 py-3 text-foreground placeholder:text-foreground/40 focus:outline-none focus:border-accent/50 resize-none"
                        rows={2}
                        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleComment(); } }}
                      />
                      <div className="flex justify-end mt-2">
                        <button onClick={handleComment} disabled={!commentText.trim()} className="luxury-button text-sm flex items-center gap-1 disabled:opacity-50">
                          <Send className="w-4 h-4" /> Comment
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => openAuthModal('login')} className="w-full text-center py-3 mb-6 rounded-lg border border-border/30 text-foreground/60 hover:text-accent hover:border-accent/30 smooth-transition text-sm">
                    Log in to leave a comment
                  </button>
                )}

                <div className="space-y-4">
                  {pin.comments.map(comment => {
                    const commentAuthor = getUser(comment.authorId);
                    const isCommentLiked = currentUser ? comment.likes.includes(currentUser.id) : false;
                    const canDeleteComment = currentUser && (comment.authorId === currentUser.id || pin.authorId === currentUser.id);
                    return (
                      <div key={comment.id} className="flex gap-3 pb-4 border-b border-border/30">
                        <Link href={`/user/${commentAuthor?.username || ''}`}>
                          <UserAvatar userId={comment.authorId} displayName={commentAuthor?.displayName || 'User'} size="sm" />
                        </Link>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <Link href={`/user/${commentAuthor?.username || ''}`} className="font-semibold text-foreground text-sm hover:text-accent">
                              {commentAuthor?.displayName || 'User'}
                            </Link>
                            {canDeleteComment && (
                              <button
                                onClick={() => deleteComment(pin.id, comment.id)}
                                className="text-foreground/30 hover:text-red-400 smooth-transition p-1"
                                aria-label="Delete comment"
                                title="Delete comment"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                          <p className="text-sm text-foreground/70 mt-1">{comment.text}</p>
                          <div className="flex gap-4 mt-2 text-xs text-foreground/60">
                            <button onClick={() => isLoggedIn ? toggleCommentLike(pin.id, comment.id) : openAuthModal('login')}
                              className={`hover:text-accent smooth-transition flex items-center gap-1 ${isCommentLiked ? 'text-red-400' : ''}`}>
                              <Heart className={`w-3 h-3 ${isCommentLiked ? 'fill-red-400' : ''}`} />
                              {comment.likes.length > 0 && comment.likes.length}
                            </button>
                            <span>{timeAgo(comment.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              <div className="pin-card p-6 animate-slideUp">
                <h2 className="text-2xl font-bold mb-2 text-foreground line-clamp-3">{pin.title}</h2>
                <p className="text-sm text-foreground/60 mb-4">{timeAgo(pin.createdAt)}</p>
                <p className="text-foreground/80 text-sm mb-6 leading-relaxed">{pin.description}</p>

                {boardData && (
                  <Link href={`/board/${boardData.id}`} className="inline-block mb-4">
                    <span className="text-xs bg-accent/20 text-accent border border-accent/30 rounded-full px-3 py-1 hover:bg-accent/30 smooth-transition">
                      📌 {boardData.name}
                    </span>
                  </Link>
                )}

                <div className="flex flex-wrap gap-2 mb-6">
                  {pin.tags.map(tag => (
                    <Link key={tag} href={`/search?q=${encodeURIComponent(tag)}`}>
                      <span className="text-xs text-foreground/60 hover:text-accent smooth-transition">#{tag}</span>
                    </Link>
                  ))}
                </div>

                <div className="flex gap-3 py-4 border-y border-border/30">
                  <button onClick={() => isLoggedIn ? toggleLike(pin.id) : openAuthModal('login')} className={`flex items-center gap-2 flex-1 justify-center py-2 rounded-lg hover:bg-card/50 smooth-transition ${isLiked ? 'text-red-400' : 'text-foreground/70'}`}>
                    <Heart className={`w-5 h-5 ${isLiked ? 'fill-red-400' : ''}`} />
                    <span className="text-sm font-medium">{formatCount(pin.likes.length)}</span>
                  </button>
                  <button onClick={() => isLoggedIn ? toggleSave(pin.id) : openAuthModal('login')} className={`flex items-center gap-2 flex-1 justify-center py-2 rounded-lg hover:bg-card/50 smooth-transition ${isSaved ? 'text-accent' : 'text-foreground/70'}`}>
                    <Bookmark className={`w-5 h-5 ${isSaved ? 'fill-accent' : ''}`} />
                    <span className="text-sm font-medium">{formatCount(pin.saves.length)}</span>
                  </button>
                  <div className="flex items-center gap-2 flex-1 justify-center py-2 text-foreground/50">
                    <Eye className="w-5 h-5" />
                    <span className="text-sm font-medium">{formatCount(pin.views ?? 0)}</span>
                  </div>
                </div>

                {isLoggedIn && (
                  <button onClick={() => setShowSaveModal(true)} className="luxury-button w-full mt-4">
                    Save to Board
                  </button>
                )}

                {isOwner && (
                  <button onClick={handleDelete} className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-red-400/30 text-red-400 hover:bg-red-400/10 smooth-transition text-sm">
                    <Trash2 className="w-4 h-4" /> Delete Pin
                  </button>
                )}
              </div>

              {/* Author */}
              {author && (
                <div className="pin-card p-6 animate-slideUp">
                  <div className="flex items-center gap-4 mb-4">
                    <Link href={`/user/${author.username}`}>
                      <UserAvatar userId={author.id} displayName={author.displayName} size="lg" />
                    </Link>
                    <div>
                      <Link href={`/user/${author.username}`} className="font-semibold text-foreground hover:text-accent">{author.displayName}</Link>
                      <p className="text-xs text-foreground/60">{formatCount(author.followers.length)} followers</p>
                    </div>
                  </div>
                  <p className="text-sm text-foreground/70 mb-4">{author.bio}</p>
                  {!isOwner && isLoggedIn && (
                    <FollowButton isFollowing={isFollowingAuthor} onToggle={() => toggleFollow(author.id)} />
                  )}
                </div>
              )}

              {/* Related */}
              {relatedPins.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold mb-4 text-foreground">Related Pins</h3>
                  <div className="space-y-3">
                    {relatedPins.slice(0, 4).map(rp => (
                      <Link key={rp.id} href={`/pin/${rp.id}`} className="group block">
                        <div className="relative rounded-lg overflow-hidden bg-card/30 h-32 mb-2">
                          <img src={rp.imageUrl} alt={rp.title} className="w-full h-full object-cover group-hover:scale-105 smooth-transition" loading="lazy" />
                        </div>
                        <p className="text-sm font-medium text-foreground line-clamp-2 group-hover:text-accent smooth-transition">{rp.title}</p>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <SaveToBoardModal isOpen={showSaveModal} onClose={() => setShowSaveModal(false)} pinId={pin.id} />
      <Footer />
    </div>
  );
}
