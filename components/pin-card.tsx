'use client';

import React, { useState } from 'react';
import { Heart, MessageCircle, Bookmark, MoreHorizontal, Eye, Clock } from 'lucide-react';
import Link from 'next/link';
import { useApp } from '@/lib/app-context';
import UserAvatar from '@/components/user-avatar';
import SaveToBoardModal from '@/components/save-to-board-modal';
import { formatCount, timeAgo } from '@/lib/helpers';

interface PinCardProps {
  id: string;
  title: string;
  description?: string;
  imageUrl: string;
  authorId: string;
  likes: string[];
  saves: string[];
  comments: { id: string }[];
  board?: string;
  compact?: boolean;
  views?: number;
  createdAt?: string;
}

export default function PinCard({
  id,
  title,
  description,
  imageUrl,
  authorId,
  likes,
  saves,
  comments,
  board,
  compact = false,
  views = 0,
  createdAt,
}: PinCardProps) {
  const { currentUser, isLoggedIn, toggleLike, toggleSave, getUser, getBoard, openAuthModal } = useApp();
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  const author = getUser(authorId);
  const isLiked = currentUser ? likes.includes(currentUser.id) : false;
  const isSaved = currentUser ? saves.includes(currentUser.id) : false;

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isLoggedIn) { openAuthModal('login'); return; }
    toggleLike(id);
  };

  const handleSave = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isLoggedIn) { openAuthModal('login'); return; }
    setShowSaveModal(true);
  };

  const handleQuickSave = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isLoggedIn) { openAuthModal('login'); return; }
    toggleSave(id);
  };

  const boardData = board ? getBoard(board) : undefined;

  return (
    <>
      <Link href={`/pin/${id}`} className="block group">
        <div className="pin-card h-full flex flex-col overflow-hidden cursor-pointer">
          {/* Image Container */}
          <div className="relative w-full bg-card/50 overflow-hidden">
            {/* Skeleton shimmer while loading */}
            {!imgLoaded && (
              <div className="absolute inset-0 animate-shimmer" />
            )}
            <img
              src={imageUrl}
              alt={title}
              className={`w-full h-auto object-cover smooth-transition group-hover:scale-[1.03] ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
              loading="lazy"
              onLoad={() => setImgLoaded(true)}
              onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; setImgLoaded(true); }}
            />

            {/* Hover Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 smooth-transition flex flex-col justify-between p-3">
              {/* Top row */}
              <div className="flex justify-end">
                <button
                  onClick={handleQuickSave}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold smooth-transition font-syne ${isSaved
                      ? 'bg-foreground/90 text-background'
                      : 'bg-accent text-accent-foreground hover:brightness-110'
                    }`}
                >
                  {isSaved ? 'Saved' : 'Save'}
                </button>
              </div>

              {/* Bottom row */}
              <div className="flex items-center justify-between">
                <button
                  onClick={handleLike}
                  aria-label="Like"
                  className={`p-2.5 rounded-full smooth-transition backdrop-blur-sm ${isLiked ? 'bg-red-500/20' : 'bg-white/10 hover:bg-white/20'
                    }`}
                >
                  <Heart className={`w-4 h-4 ${isLiked ? 'fill-red-500 text-red-500' : 'text-white'}`} />
                </button>
                <button
                  onClick={handleSave}
                  aria-label="Save to board"
                  className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 smooth-transition backdrop-blur-sm"
                >
                  <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-accent text-accent' : 'text-white'}`} />
                </button>
              </div>
            </div>
          </div>

          {/* Info */}
          {!compact ? (
            <div className="p-3.5 flex flex-col gap-2">
              <h3 className="font-semibold text-foreground/90 text-[13px] leading-snug line-clamp-2 group-hover:text-accent smooth-transition font-syne">
                {title}
              </h3>

              {boardData && (
                <div className="text-[11px] text-foreground/40 flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-accent/60" />
                  {boardData.name}
                </div>
              )}

              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2">
                  {author && (
                    <>
                      <UserAvatar userId={author.id} displayName={author.displayName} size="sm" />
                      <span className="text-[11px] text-foreground/50 truncate max-w-[100px]">{author.displayName}</span>
                    </>
                  )}
                </div>

                <div className="flex items-center gap-2.5 text-[11px] text-foreground/40">
                  <span className="flex items-center gap-1">
                    <Heart className={`w-3 h-3 ${isLiked ? 'fill-red-500/70 text-red-500/70' : ''}`} />
                    {formatCount(likes.length)}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageCircle className="w-3 h-3" />
                    {formatCount(comments.length)}
                  </span>
                  {views > 0 && (
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {formatCount(views)}
                    </span>
                  )}
                </div>
              </div>

              {/* Relative time */}
              {createdAt && (
                <div className="flex items-center gap-1 text-[10px] text-foreground/30">
                  <Clock className="w-2.5 h-2.5" />
                  {timeAgo(createdAt)}
                </div>
              )}
            </div>
          ) : (
            <div className="p-2.5">
              <h3 className="font-medium text-foreground/80 text-xs line-clamp-1 font-syne">
                {title}
              </h3>
            </div>
          )}
        </div>
      </Link>

      <SaveToBoardModal isOpen={showSaveModal} onClose={() => setShowSaveModal(false)} pinId={id} />
    </>
  );
}

