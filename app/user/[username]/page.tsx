'use client';

import React, { useMemo, use, useState } from 'react';
import Header from '@/components/header';
import Footer from '@/components/footer';
import PinCard from '@/components/pin-card';
import UserAvatar from '@/components/user-avatar';
import FollowButton from '@/components/follow-button';
import MasonryGrid from '@/components/masonry-grid';
import FollowListModal from '@/components/follow-list-modal';
import { Share2, Link as LinkIcon, Copy, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import { useApp } from '@/lib/app-context';
import { useRouter } from 'next/navigation';
import { formatCount, timeAgo } from '@/lib/helpers';

export default function PublicProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = use(params);
  const router = useRouter();
  const { getUserByUsername, currentUser, isLoggedIn, getPinsByUser, getBoardsByUser, toggleFollow } = useApp();

  const user = getUserByUsername(username);
  const isOwnProfile = user && currentUser ? user.id === currentUser.id : false;
  const isFollowing = user && currentUser ? currentUser.following.includes(user.id) : false;
  const [followModal, setFollowModal] = useState<{ type: 'Followers' | 'Following'; ids: string[] } | null>(null);

  const userPins = useMemo(() => user ? getPinsByUser(user.id).filter(p => !p.isPrivate) : [], [user, getPinsByUser]);
  const userBoards = useMemo(() => user ? getBoardsByUser(user.id).filter(b => !b.isPrivate) : [], [user, getBoardsByUser]);

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-4">User Not Found</h1>
            <p className="text-foreground/60 mb-6">@{username} doesn't exist</p>
            <Link href="/explore" className="luxury-button">Explore Pins</Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (isOwnProfile) {
    router.push('/profile');
    return null;
  }

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href).catch(() => { });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <section className="w-full bg-gradient-to-b from-card/30 to-background py-12 border-b border-border/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row gap-8 items-start sm:items-end">
            <UserAvatar userId={user.id} displayName={user.displayName} size="xl" />
            <div className="flex-1">
              <h1 className="text-4xl font-bold mb-1">{user.displayName}</h1>
              <p className="text-lg text-foreground/60 mb-3">@{user.username}</p>
              <p className="text-foreground/80 mb-4 max-w-2xl">{user.bio}</p>

              <div className="flex flex-wrap gap-4 mb-6 text-sm text-foreground/60">
                {user.website && (
                  <a href={user.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-accent smooth-transition">
                    <LinkIcon className="w-4 h-4" /> {user.website.replace('https://', '').replace('http://', '')}
                  </a>
                )}
                <span>Joined {timeAgo(user.createdAt)}</span>
              </div>

              <div className="flex gap-6 mb-6">
                <button onClick={() => setFollowModal({ type: 'Followers', ids: user.followers })} className="text-left hover:bg-card/30 rounded-lg px-2 py-1 -mx-2 smooth-transition">
                  <div className="text-2xl font-bold text-accent">{formatCount(user.followers.length)}</div>
                  <p className="text-sm text-foreground/60">Followers</p>
                </button>
                <button onClick={() => setFollowModal({ type: 'Following', ids: user.following })} className="text-left hover:bg-card/30 rounded-lg px-2 py-1 -mx-2 smooth-transition">
                  <div className="text-2xl font-bold text-accent">{formatCount(user.following.length)}</div>
                  <p className="text-sm text-foreground/60">Following</p>
                </button>
                <div>
                  <div className="text-2xl font-bold text-accent">{userPins.length}</div>
                  <p className="text-sm text-foreground/60">Pins</p>
                </div>
                <div>
                  <div className="text-2xl font-bold text-accent">{userBoards.length}</div>
                  <p className="text-sm text-foreground/60">Boards</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                {isLoggedIn && (
                  <>
                    <FollowButton isFollowing={isFollowing} onToggle={() => toggleFollow(user.id)} />
                    <button onClick={() => router.push(`/messages?to=${user.id}`)} className="luxury-button-outline flex items-center gap-2">
                      <MessageCircle className="w-4 h-4" /> Message
                    </button>
                  </>
                )}
                <button onClick={handleShare} className="luxury-button-outline flex items-center gap-2">
                  <Share2 className="w-4 h-4" /> Share Profile
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="flex-1 w-full py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {userPins.length > 0 ? (
            <div>
              <h2 className="text-3xl font-bold mb-8">Pins from {user.displayName}</h2>
              <MasonryGrid columns={3}>
                {userPins.map(pin => (
                  <PinCard key={pin.id} id={pin.id} title={pin.title} imageUrl={pin.imageUrl} authorId={pin.authorId} likes={pin.likes} saves={pin.saves} comments={pin.comments} views={pin.views} createdAt={pin.createdAt} />
                ))}
              </MasonryGrid>
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-lg text-foreground/60">{user.displayName} hasn't created any public pins yet.</p>
            </div>
          )}

          {userBoards.length > 0 && (
            <div className="mt-16">
              <h2 className="text-3xl font-bold mb-8">Boards</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {userBoards.map(board => (
                  <Link key={board.id} href={`/board/${board.id}`} className="pin-card p-4 group hover:border-accent/50">
                    <h3 className="font-semibold text-foreground group-hover:text-accent smooth-transition">{board.name}</h3>
                    <p className="text-sm text-foreground/60 line-clamp-2 mt-1">{board.description}</p>
                    <p className="text-xs text-foreground/50 mt-2">{board.pins.length} pins</p>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />

      {followModal && (
        <FollowListModal
          isOpen={true}
          onClose={() => setFollowModal(null)}
          title={followModal.type}
          userIds={followModal.ids}
        />
      )}
    </div>
  );
}
