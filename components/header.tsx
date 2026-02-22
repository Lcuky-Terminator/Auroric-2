'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, Bell, Menu, X, Plus, LogOut, User, Settings, Bookmark } from 'lucide-react';
import { useApp } from '@/lib/app-context';
import UserAvatar from '@/components/user-avatar';
import AuthModal from '@/components/auth-modal';
import { timeAgo } from '@/lib/helpers';

export default function Header() {
  const router = useRouter();
  const { currentUser, isLoggedIn, logout, notifications, unreadCount, markNotificationRead, markAllRead, openAuthModal, showAuthModal, authModalMode, closeAuthModal } = useApp();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifications(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setShowProfileMenu(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setIsMenuOpen(false);
    }
  };

  const openAuth = (mode: 'login' | 'signup') => openAuthModal(mode);

  return (
    <>
      <header className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-xl border-b border-border/50 smooth-transition">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2 group flex-shrink-0">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent to-accent/70 flex items-center justify-center">
                <span className="text-accent-foreground font-bold text-lg">A</span>
              </div>
              <h1 className="text-xl font-bold gradient-brand hidden sm:inline">Auroric</h1>
            </Link>

            <div className="hidden md:flex items-center gap-6">
              <Link href="/" className="text-foreground/70 hover:text-accent smooth-transition text-sm font-medium">Home</Link>
              <Link href="/explore" className="text-foreground/70 hover:text-accent smooth-transition text-sm font-medium">Explore</Link>
              <Link href="/trending" className="text-foreground/70 hover:text-accent smooth-transition text-sm font-medium">Trending</Link>
              <Link href="/popular" className="text-foreground/70 hover:text-accent smooth-transition text-sm font-medium">Popular</Link>
              {isLoggedIn && (
                <Link href="/boards" className="text-foreground/70 hover:text-accent smooth-transition text-sm font-medium">Boards</Link>
              )}
            </div>

            <form onSubmit={handleSearch} className="hidden lg:flex items-center flex-1 max-w-md mx-6">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-foreground/40" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search pins, boards, users..."
                  className="w-full bg-card/50 border border-border/30 rounded-full pl-10 pr-4 py-2 text-sm text-foreground placeholder:text-foreground/40 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 smooth-transition"
                />
              </div>
            </form>

            <div className="hidden md:flex items-center gap-2">
              {isLoggedIn ? (
                <>
                  <Link href="/create" className="flex items-center gap-1.5 px-3 py-1.5 bg-accent/10 hover:bg-accent/20 rounded-full smooth-transition" title="Create Pin">
                    <Plus className="w-4 h-4 text-accent" />
                    <span className="text-sm font-medium text-accent hidden lg:inline">Create</span>
                  </Link>

                  <div className="relative" ref={notifRef}>
                    <button onClick={() => setShowNotifications(!showNotifications)} aria-label="Notifications" className="p-2 hover:bg-card/50 rounded-full smooth-transition relative">
                      <Bell className="w-5 h-5 text-foreground/70 hover:text-accent" />
                      {unreadCount > 0 && (
                        <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center font-bold">{unreadCount > 9 ? '9+' : unreadCount}</span>
                      )}
                    </button>
                    {showNotifications && (
                      <div className="absolute right-0 top-12 w-80 bg-card border border-border/50 rounded-xl shadow-2xl overflow-hidden z-50 animate-slideUp">
                        <div className="flex items-center justify-between p-3 border-b border-border/30">
                          <h4 className="font-semibold text-sm">Notifications</h4>
                          {unreadCount > 0 && <button onClick={markAllRead} className="text-xs text-accent hover:text-accent/80">Mark all read</button>}
                        </div>
                        <div className="max-h-80 overflow-y-auto">
                          {notifications.length === 0 ? (
                            <div className="p-6 text-center text-foreground/60 text-sm">No notifications yet</div>
                          ) : notifications.slice(0, 10).map(notif => (
                            <button key={notif.id} onClick={() => { markNotificationRead(notif.id); if (notif.pinId) router.push(`/pin/${notif.pinId}`); setShowNotifications(false); }}
                              className={`w-full text-left p-3 hover:bg-background/50 smooth-transition border-b border-border/10 ${!notif.read ? 'bg-accent/5' : ''}`}>
                              <p className="text-sm text-foreground/80">{notif.message}</p>
                              <p className="text-xs text-foreground/40 mt-1">{timeAgo(notif.createdAt)}</p>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="relative ml-1" ref={profileRef}>
                    <button onClick={() => setShowProfileMenu(!showProfileMenu)} aria-label="Profile menu">
                      <UserAvatar userId={currentUser?.id} displayName={currentUser?.displayName || 'U'} size="md" />
                    </button>
                    {showProfileMenu && (
                      <div className="absolute right-0 top-12 w-56 bg-card border border-border/50 rounded-xl shadow-2xl overflow-hidden z-50 animate-slideUp">
                        <div className="p-3 border-b border-border/30">
                          <p className="font-semibold text-sm">{currentUser?.displayName}</p>
                          <p className="text-xs text-foreground/60">@{currentUser?.username}</p>
                        </div>
                        <Link href="/profile" onClick={() => setShowProfileMenu(false)} className="flex items-center gap-2 px-3 py-2.5 text-sm text-foreground/70 hover:bg-background/50 hover:text-accent smooth-transition"><User className="w-4 h-4" /> Profile</Link>
                        <Link href="/boards" onClick={() => setShowProfileMenu(false)} className="flex items-center gap-2 px-3 py-2.5 text-sm text-foreground/70 hover:bg-background/50 hover:text-accent smooth-transition"><Bookmark className="w-4 h-4" /> My Boards</Link>
                        <Link href="/settings" onClick={() => setShowProfileMenu(false)} className="flex items-center gap-2 px-3 py-2.5 text-sm text-foreground/70 hover:bg-background/50 hover:text-accent smooth-transition"><Settings className="w-4 h-4" /> Settings</Link>
                        <button onClick={() => { logout(); setShowProfileMenu(false); }} className="flex items-center gap-2 px-3 py-2.5 text-sm text-red-400 hover:bg-background/50 smooth-transition w-full border-t border-border/30"><LogOut className="w-4 h-4" /> Sign Out</button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <button onClick={() => openAuth('login')} className="luxury-button-outline text-sm px-4 py-1.5">Log In</button>
                  <button onClick={() => openAuth('signup')} className="luxury-button text-sm px-4 py-1.5">Sign Up</button>
                </div>
              )}
            </div>

            <button onClick={() => setIsMenuOpen(!isMenuOpen)} aria-label="Toggle menu" className="md:hidden p-2 hover:bg-card/50 rounded-lg smooth-transition">
              {isMenuOpen ? <X className="w-6 h-6 text-foreground" /> : <Menu className="w-6 h-6 text-foreground" />}
            </button>
          </div>

          {isMenuOpen && (
            <div className="md:hidden absolute top-16 left-0 right-0 bg-background border-b border-border/50 animate-slideDown z-40">
              <div className="flex flex-col gap-3 p-4">
                <form onSubmit={handleSearch} className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-foreground/40" />
                  <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search pins..." className="w-full bg-card/50 border border-border/30 rounded-full pl-10 pr-4 py-2 text-foreground placeholder:text-foreground/40 focus:outline-none focus:border-accent/50" />
                </form>
                <Link href="/" onClick={() => setIsMenuOpen(false)} className="text-foreground/70 hover:text-accent py-2">Home</Link>
                <Link href="/explore" onClick={() => setIsMenuOpen(false)} className="text-foreground/70 hover:text-accent py-2">Explore</Link>
                <Link href="/trending" onClick={() => setIsMenuOpen(false)} className="text-foreground/70 hover:text-accent py-2">Trending</Link>
                <Link href="/popular" onClick={() => setIsMenuOpen(false)} className="text-foreground/70 hover:text-accent py-2">Popular</Link>
                {isLoggedIn ? (
                  <>
                    <Link href="/boards" onClick={() => setIsMenuOpen(false)} className="text-foreground/70 hover:text-accent py-2">Boards</Link>
                    <Link href="/create" onClick={() => setIsMenuOpen(false)} className="text-foreground/70 hover:text-accent py-2">Create</Link>
                    <Link href="/profile" onClick={() => setIsMenuOpen(false)} className="text-foreground/70 hover:text-accent py-2">Profile</Link>
                    <button onClick={() => { logout(); setIsMenuOpen(false); }} className="text-red-400 hover:text-red-300 py-2 text-left">Sign Out</button>
                  </>
                ) : (
                  <div className="flex gap-2 pt-2">
                    <button onClick={() => { openAuth('login'); setIsMenuOpen(false); }} className="luxury-button-outline flex-1 text-sm">Log In</button>
                    <button onClick={() => { openAuth('signup'); setIsMenuOpen(false); }} className="luxury-button flex-1 text-sm">Sign Up</button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </header>
      <AuthModal isOpen={showAuthModal} onClose={closeAuthModal} initialMode={authModalMode} />
    </>
  );
}
