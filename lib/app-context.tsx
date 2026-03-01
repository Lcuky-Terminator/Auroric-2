'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { getSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { User, Pin, Board, Notification } from './types';
import { api } from './api-client';
import { registerUser } from './email-verification';

interface AppContextType {
  // Auth
  currentUser: User | undefined;
  isLoggedIn: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  signup: (username: string, displayName: string, email: string, password: string) => Promise<boolean>;
  loginWithGoogle: () => Promise<boolean>;
  logout: () => void;
  updateProfile: (updates: Partial<User>) => Promise<void>;

  // Pins
  pins: Pin[];
  getPin: (id: string) => Pin | undefined;
  createPin: (pin: Omit<Pin, 'id' | 'createdAt' | 'updatedAt' | 'likes' | 'saves' | 'comments'>) => Promise<Pin>;
  deletePin: (id: string) => void;
  toggleLike: (pinId: string) => void;
  toggleSave: (pinId: string) => void;
  addComment: (pinId: string, text: string) => void;
  deleteComment: (pinId: string, commentId: string) => void;
  toggleCommentLike: (pinId: string, commentId: string) => void;
  savePinToBoard: (pinId: string, boardId: string) => void;
  searchPins: (query: string, category?: string) => Pin[];
  getPinsByUser: (userId: string) => Pin[];
  getSavedPins: () => Pin[];
  getTrendingPins: () => Pin[];

  // Boards
  boards: Board[];
  getBoard: (id: string) => Board | undefined;
  createBoard: (board: Omit<Board, 'id' | 'createdAt' | 'updatedAt' | 'pins' | 'followers' | 'collaborators'>) => Promise<Board>;
  updateBoard: (id: string, updates: Partial<Board>) => void;
  deleteBoard: (id: string) => void;
  getBoardsByUser: (userId: string) => Board[];
  toggleFollowBoard: (boardId: string) => void;

  // Users
  users: User[];
  getUser: (id: string) => User | undefined;
  getUserByUsername: (username: string) => User | undefined;
  toggleFollow: (targetUserId: string) => void;
  searchUsers: (query: string) => User[];
  searchBoards: (query: string) => Board[];

  // Notifications
  notifications: Notification[];
  unreadCount: number;
  markNotificationRead: (id: string) => void;
  markAllRead: () => void;

  // Refresh
  refresh: () => void;

  // Auth modal
  showAuthModal: boolean;
  authModalMode: 'login' | 'signup';
  openAuthModal: (mode?: 'login' | 'signup') => void;
  closeAuthModal: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | undefined>();
  const [pins, setPins] = useState<Pin[]>([]);
  const [boards, setBoards] = useState<Board[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [ready, setReady] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup'>('login');

  // Load all data from API
  const loadData = useCallback(async () => {
    const results = await Promise.allSettled([
      api.getPins(),
      api.getBoards(),
      api.getUsers(),
    ]);
    if (results[0].status === 'fulfilled') setPins(results[0].value);
    if (results[1].status === 'fulfilled') setBoards(results[1].value);
    if (results[2].status === 'fulfilled') setUsers(results[2].value);
  }, []);

  const loadNotifications = useCallback(async () => {
    try {
      const notifs = await api.getNotifications();
      setNotifications(notifs);
    } catch {
      // Not logged in or error
    }
  }, []);

  // Initialize: check auth (including Google OAuth), load data
  useEffect(() => {
    const init = async () => {
      try {
        // Clear old localStorage data from previous version
        if (typeof window !== 'undefined') {
          Object.keys(localStorage).forEach(key => {
            if (key.startsWith('auroric_')) localStorage.removeItem(key);
          });
        }

        // Detect if we just came back from a Google OAuth redirect
        const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
        const isGoogleRedirect = params?.get('google') === '1';

        // If this is a Google redirect, prioritize bridging the Google session
        if (isGoogleRedirect) {
          // Clean up the URL param
          if (typeof window !== 'undefined') {
            const url = new URL(window.location.href);
            url.searchParams.delete('google');
            window.history.replaceState({}, '', url.pathname + url.search);
          }
          // Retry bridging a few times (session cookie may take a moment)
          for (let attempt = 0; attempt < 5; attempt++) {
            try {
              const session = await getSession();
              if (session?.provider === 'google') {
                const { user: googleUser } = await api.googleBridge();
                if (googleUser) {
                  setCurrentUser(googleUser);
                  break;
                }
              }
            } catch { /* retry */ }
            await new Promise(r => setTimeout(r, 600));
          }
        } else {
          // Normal init: check existing JWT auth first
          const meResult = await api.me().catch(() => ({ user: null }));
          if (meResult.user) {
            setCurrentUser(meResult.user);
          } else {
            // No JWT cookie — check if there's a NextAuth Google session to bridge
            const tryGoogleBridge = async (retries = 3, delay = 800): Promise<boolean> => {
              for (let i = 0; i < retries; i++) {
                try {
                  const session = await getSession();
                  if (session?.provider === 'google') {
                    const { user: googleUser } = await api.googleBridge();
                    if (googleUser) {
                      setCurrentUser(googleUser);
                      return true;
                    }
                  }
                  if (session && !session.provider) return false;
                } catch { /* retry */ }
                if (i < retries - 1) {
                  await new Promise(r => setTimeout(r, delay));
                }
              }
              return false;
            };
            await tryGoogleBridge();
          }
        }
      } catch {
        // Not logged in
      }
      await loadData();
      setReady(true);
    };
    init();
  }, [loadData]);

  // Load notifications when user changes
  useEffect(() => {
    if (currentUser) loadNotifications();
  }, [currentUser, loadNotifications]);

  const refresh = useCallback(() => { loadData(); }, [loadData]);

  // Auto-refresh data every 30 seconds to keep in sync with server
  useEffect(() => {
    if (!ready) return;
    const interval = setInterval(() => {
      loadData();
      if (currentUser) loadNotifications();
    }, 30_000);
    return () => clearInterval(interval);
  }, [ready, currentUser, loadData, loadNotifications]);

  // Helper: refresh after a short delay (for mutations that need server to process)
  const refreshAfterMutation = useCallback(() => {
    setTimeout(() => loadData(), 500);
  }, [loadData]);

  const login = useCallback(async (username: string, password: string): Promise<boolean> => {
    try {
      const { user } = await api.login(username, password);
      setCurrentUser(user);
      await loadData();
      return true;
    } catch (err) {
      // Re-throw so the UI can display the specific error message
      throw err;
    }
  }, [loadData]);

  const signup = useCallback(async (username: string, displayName: string, email: string, password: string): Promise<boolean> => {
    try {
      const { user, verificationSent } = await registerUser(email, password, displayName, username);
      setCurrentUser(user);
      await loadData();
      // If verification email was sent, the RequireAuth component will
      // redirect unverified users to /verify-email automatically.
      return true;
    } catch (err) {
      // Re-throw so the UI can display the specific error message
      throw err;
    }
  }, [loadData]);

  const loginWithGoogle = useCallback(async (): Promise<boolean> => {
    try {
      // Call the bridge endpoint that converts Google session → JWT cookie
      const { user } = await api.googleBridge();
      setCurrentUser(user);
      await loadData();
      return true;
    } catch {
      return false;
    }
  }, [loadData]);

  const logout = useCallback(async () => {
    await api.logout();
    setCurrentUser(undefined);
    setNotifications([]);
  }, []);

  const updateProfile = useCallback(async (updates: Partial<User>) => {
    if (!currentUser) return;
    try {
      const updated = await api.updateUser(currentUser.id, updates);
      setCurrentUser(updated);
      setUsers(prev => prev.map(x => x.id === updated.id ? updated : x));
    } catch (err) {
      console.error('Failed to update profile:', err);
    }
  }, [currentUser]);

  // Helper: check if user is email-verified; redirect to verify page if not
  const requireVerified = useCallback((): boolean => {
    if (!currentUser) return false;
    if (!currentUser.emailVerified) {
      window.location.href = '/verify-email';
      return false;
    }
    return true;
  }, [currentUser]);

  const value: AppContextType = {
    currentUser,
    isLoggedIn: !!currentUser,
    login,
    signup,
    loginWithGoogle,
    logout,
    updateProfile,

    pins,
    getPin: (id) => pins.find(p => p.id === id),
    createPin: async (pin) => {
      if (!requireVerified()) throw new Error('Email verification required');
      const newPin = await api.createPin(pin);
      setPins(prev => [newPin, ...prev]);
      if (newPin.boardId) {
        setBoards(prev => prev.map(b =>
          b.id === newPin.boardId ? { ...b, pins: [...b.pins, newPin.id] } : b
        ));
      }
      return newPin;
    },
    deletePin: (id) => {
      // Optimistic update
      setPins(prev => prev.filter(p => p.id !== id));
      setBoards(prev => prev.map(b => ({ ...b, pins: b.pins.filter(pid => pid !== id) })));
      api.deletePin(id).catch(console.error);
    },
    toggleLike: (pinId) => {
      if (!currentUser || !requireVerified()) return;
      const userId = currentUser.id;
      // Optimistic update
      setPins(prev => prev.map(p => {
        if (p.id !== pinId) return p;
        const likes = p.likes.includes(userId)
          ? p.likes.filter(id => id !== userId)
          : [...p.likes, userId];
        return { ...p, likes };
      }));
      api.toggleLike(pinId).then(() => refreshAfterMutation()).catch(() => loadData());
    },
    toggleSave: (pinId) => {
      if (!currentUser || !requireVerified()) return;
      const userId = currentUser.id;
      // Optimistic update
      setPins(prev => prev.map(p => {
        if (p.id !== pinId) return p;
        const saves = p.saves.includes(userId)
          ? p.saves.filter(id => id !== userId)
          : [...p.saves, userId];
        return { ...p, saves };
      }));
      api.toggleSave(pinId).then(() => refreshAfterMutation()).catch(() => loadData());
    },
    addComment: (pinId, text) => {
      if (!currentUser || !requireVerified()) return;
      api.addComment(pinId, text).then(comment => {
        setPins(prev => prev.map(p =>
          p.id === pinId ? { ...p, comments: [...p.comments, comment] } : p
        ));
      }).catch(console.error);
    },
    deleteComment: (pinId, commentId) => {
      if (!currentUser) return;
      // Optimistic update
      setPins(prev => prev.map(p =>
        p.id === pinId ? { ...p, comments: p.comments.filter(c => c.id !== commentId) } : p
      ));
      api.deleteComment(pinId, commentId).then(() => refreshAfterMutation()).catch(() => loadData());
    },
    toggleCommentLike: (pinId, commentId) => {
      if (!currentUser) return;
      const userId = currentUser.id;
      // Optimistic update
      setPins(prev => prev.map(p => {
        if (p.id !== pinId) return p;
        return {
          ...p,
          comments: p.comments.map(c => {
            if (c.id !== commentId) return c;
            const likes = c.likes.includes(userId)
              ? c.likes.filter(id => id !== userId)
              : [...c.likes, userId];
            return { ...c, likes };
          }),
        };
      }));
      api.toggleCommentLike(pinId, commentId).then(() => refreshAfterMutation()).catch(() => loadData());
    },
    savePinToBoard: (pinId, boardId) => {
      // Optimistic update
      setPins(prev => prev.map(p => p.id === pinId ? { ...p, boardId } : p));
      setBoards(prev => prev.map(b =>
        b.id === boardId && !b.pins.includes(pinId)
          ? { ...b, pins: [...b.pins, pinId] }
          : b
      ));
      api.savePinToBoard(pinId, boardId).then(() => refreshAfterMutation()).catch(() => loadData());
    },
    searchPins: (query, category) => {
      const q = query.toLowerCase();
      return pins.filter(p => {
        if (p.isPrivate) return false;
        if (category && category !== 'All' && p.category !== category) return false;
        return (
          p.title.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.tags.some(t => t.toLowerCase().includes(q)) ||
          p.category.toLowerCase().includes(q)
        );
      });
    },
    getPinsByUser: (userId) => pins.filter(p => p.authorId === userId),
    getSavedPins: () => currentUser ? pins.filter(p => p.saves.includes(currentUser.id)) : [],
    getTrendingPins: () =>
      [...pins]
        .filter(p => !p.isPrivate)
        .sort((a, b) =>
          b.likes.length + b.saves.length + b.comments.length -
          (a.likes.length + a.saves.length + a.comments.length)
        ),

    boards,
    getBoard: (id) => boards.find(b => b.id === id),
    createBoard: async (board) => {
      const newBoard = await api.createBoard(board);
      setBoards(prev => [...prev, newBoard]);
      return newBoard;
    },
    updateBoard: (id, updates) => {
      // Optimistic update
      setBoards(prev => prev.map(b =>
        b.id === id ? { ...b, ...updates, updatedAt: new Date().toISOString() } : b
      ));
      api.updateBoard(id, updates).then(() => refreshAfterMutation()).catch(() => loadData());
    },
    deleteBoard: (id) => {
      // Optimistic update
      setBoards(prev => prev.filter(b => b.id !== id));
      setPins(prev => prev.map(p => p.boardId === id ? { ...p, boardId: undefined } : p));
      api.deleteBoard(id).catch(() => loadData());
    },
    getBoardsByUser: (userId) => boards.filter(b => b.ownerId === userId),
    toggleFollowBoard: (boardId) => {
      if (!currentUser) return;
      const userId = currentUser.id;
      // Optimistic update
      setBoards(prev => prev.map(b => {
        if (b.id !== boardId) return b;
        const followers = b.followers.includes(userId)
          ? b.followers.filter(id => id !== userId)
          : [...b.followers, userId];
        return { ...b, followers };
      }));
      api.toggleFollowBoard(boardId).then(() => refreshAfterMutation()).catch(() => loadData());
    },

    users,
    getUser: (id) => users.find(u => u.id === id),
    getUserByUsername: (username) => users.find(u => u.username.toLowerCase() === username.toLowerCase()),
    toggleFollow: (targetUserId) => {
      if (!currentUser || !requireVerified()) return;
      const userId = currentUser.id;
      // Optimistic update
      const isFollowing = currentUser.following.includes(targetUserId);
      setCurrentUser(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          following: isFollowing
            ? prev.following.filter(id => id !== targetUserId)
            : [...prev.following, targetUserId],
        };
      });
      setUsers(prev => prev.map(u => {
        if (u.id === targetUserId) {
          return {
            ...u,
            followers: isFollowing
              ? u.followers.filter(id => id !== userId)
              : [...u.followers, userId],
          };
        }
        if (u.id === userId) {
          return {
            ...u,
            following: isFollowing
              ? u.following.filter(id => id !== targetUserId)
              : [...u.following, targetUserId],
          };
        }
        return u;
      }));
      api.toggleFollow(targetUserId).then(() => { refreshAfterMutation(); loadNotifications(); }).catch(() => loadData());
    },
    searchUsers: (query) => {
      const q = query.toLowerCase();
      return users.filter(u =>
        u.username.toLowerCase().includes(q) || u.displayName.toLowerCase().includes(q)
      );
    },
    searchBoards: (query) => {
      const q = query.toLowerCase();
      return boards.filter(b =>
        !b.isPrivate &&
        (b.name.toLowerCase().includes(q) || b.description.toLowerCase().includes(q))
      );
    },

    notifications,
    unreadCount: notifications.filter(n => !n.read).length,
    markNotificationRead: (id) => {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      api.markRead(id).catch(console.error);
    },
    markAllRead: () => {
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      api.markAllRead().catch(console.error);
    },

    refresh,

    showAuthModal,
    authModalMode,
    openAuthModal: (mode: 'login' | 'signup' = 'login') => {
      setAuthModalMode(mode);
      setShowAuthModal(true);
    },
    closeAuthModal: () => setShowAuthModal(false),
  };

  if (!ready) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-accent to-accent/70 flex items-center justify-center mx-auto mb-4 animate-pulse">
            <span className="text-accent-foreground font-bold text-xl">A</span>
          </div>
          <p className="text-foreground/60">Loading Auroric...</p>
        </div>
      </div>
    );
  }

  return (
    <AppContext.Provider value={value}>
      <EmailVerificationGuard>
        {children}
      </EmailVerificationGuard>
    </AppContext.Provider>
  );
}

/**
 * Email verification guard — shows a non-blocking banner for unverified users.
 * Users can still browse the app, but feature actions are gated.
 */
function EmailVerificationGuard({ children }: { children: ReactNode }) {
  const { currentUser, isLoggedIn } = useApp();
  const pathname = usePathname();
  const [dismissed, setDismissed] = useState(false);

  const showBanner = isLoggedIn && currentUser && !currentUser.emailVerified
    && !dismissed
    && !['/verify-email', '/verify', '/settings'].includes(pathname);

  return (
    <>
      {showBanner && (
        <div className="bg-accent/10 border-b border-accent/30 px-4 py-2.5 text-center text-sm flex items-center justify-center gap-3">
          <span className="text-foreground/80">
            📧 Please verify your email to unlock all features (commenting, posting, following).
          </span>
          <a href="/verify-email" className="text-accent font-semibold hover:underline">Verify now</a>
          <button onClick={() => setDismissed(true)} className="text-foreground/40 hover:text-foreground/60 ml-2">✕</button>
        </div>
      )}
      {children}
    </>
  );
}

const noop = () => { };
const noopReturn = () => undefined as any;
const noopArray = () => [] as any;
const noopPromisePin = () => Promise.resolve({} as any);
const noopPromiseBoard = () => Promise.resolve({} as any);
const noopPromiseBool = () => Promise.resolve(false);

const defaultContext: AppContextType = {
  currentUser: undefined,
  isLoggedIn: false,
  login: noopPromiseBool,
  signup: noopPromiseBool,
  loginWithGoogle: noopPromiseBool,
  logout: noop,
  updateProfile: async () => { },
  pins: [],
  getPin: noopReturn,
  createPin: noopPromisePin,
  deletePin: noop,
  toggleLike: noop,
  toggleSave: noop,
  addComment: noop,
  deleteComment: noop,
  toggleCommentLike: noop,
  savePinToBoard: noop,
  searchPins: noopArray,
  getPinsByUser: noopArray,
  getSavedPins: noopArray,
  getTrendingPins: noopArray,
  boards: [],
  getBoard: noopReturn,
  createBoard: noopPromiseBoard,
  updateBoard: noop,
  deleteBoard: noop,
  getBoardsByUser: noopArray,
  toggleFollowBoard: noop,
  users: [],
  getUser: noopReturn,
  getUserByUsername: noopReturn,
  toggleFollow: noop,
  searchUsers: noopArray,
  searchBoards: noopArray,
  notifications: [],
  unreadCount: 0,
  markNotificationRead: noop,
  markAllRead: noop,
  refresh: noop,
  showAuthModal: false,
  authModalMode: 'login' as const,
  openAuthModal: noop,
  closeAuthModal: noop,
};

export function useApp() {
  const context = useContext(AppContext);
  return context ?? defaultContext;
}
