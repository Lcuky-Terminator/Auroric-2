import { User, Pin, Board, Notification } from './types';
import { generateSeedData } from './seed-data';

const STORAGE_KEYS = {
  USERS: 'auroric_users',
  PINS: 'auroric_pins',
  BOARDS: 'auroric_boards',
  NOTIFICATIONS: 'auroric_notifications',
  CURRENT_USER: 'auroric_current_user',
  INITIALIZED: 'auroric_initialized',
};

function getItem<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function setItem(key: string, value: unknown) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('Storage error:', e);
  }
}

export function initializeStore() {
  if (typeof window === 'undefined') return;
  const initialized = localStorage.getItem(STORAGE_KEYS.INITIALIZED);
  if (initialized) return;

  const seed = generateSeedData();
  setItem(STORAGE_KEYS.USERS, seed.users);
  setItem(STORAGE_KEYS.PINS, seed.pins);
  setItem(STORAGE_KEYS.BOARDS, seed.boards);
  setItem(STORAGE_KEYS.NOTIFICATIONS, seed.notifications);
  setItem(STORAGE_KEYS.CURRENT_USER, 'user-current');
  localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
}

// ---- Users ----
export function getUsers(): User[] {
  return getItem<User[]>(STORAGE_KEYS.USERS) || [];
}

export function getUser(id: string): User | undefined {
  return getUsers().find(u => u.id === id);
}

export function getUserByUsername(username: string): User | undefined {
  return getUsers().find(u => u.username === username);
}

export function getCurrentUserId(): string | null {
  return getItem<string>(STORAGE_KEYS.CURRENT_USER);
}

export function getCurrentUser(): User | undefined {
  const id = getCurrentUserId();
  return id ? getUser(id) : undefined;
}

export function setCurrentUserId(id: string | null) {
  if (id) {
    setItem(STORAGE_KEYS.CURRENT_USER, id);
  } else {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  }
}

export function updateUser(id: string, updates: Partial<User>): User | undefined {
  const users = getUsers();
  const idx = users.findIndex(u => u.id === id);
  if (idx === -1) return undefined;
  users[idx] = { ...users[idx], ...updates };
  setItem(STORAGE_KEYS.USERS, users);
  return users[idx];
}

export function createUser(user: User): User {
  const users = getUsers();
  users.push(user);
  setItem(STORAGE_KEYS.USERS, users);
  return user;
}

export function toggleFollow(currentUserId: string, targetUserId: string): boolean {
  const users = getUsers();
  const currentIdx = users.findIndex(u => u.id === currentUserId);
  const targetIdx = users.findIndex(u => u.id === targetUserId);
  if (currentIdx === -1 || targetIdx === -1) return false;

  const isFollowing = users[currentIdx].following.includes(targetUserId);
  if (isFollowing) {
    users[currentIdx].following = users[currentIdx].following.filter(id => id !== targetUserId);
    users[targetIdx].followers = users[targetIdx].followers.filter(id => id !== currentUserId);
  } else {
    users[currentIdx].following.push(targetUserId);
    users[targetIdx].followers.push(currentUserId);
    addNotification({
      id: `notif-${Date.now()}`,
      type: 'follow',
      fromUserId: currentUserId,
      toUserId: targetUserId,
      message: `${users[currentIdx].displayName} started following you`,
      read: false,
      createdAt: new Date().toISOString(),
    });
  }
  setItem(STORAGE_KEYS.USERS, users);
  return !isFollowing;
}

// ---- Pins ----
export function getPins(): Pin[] {
  return getItem<Pin[]>(STORAGE_KEYS.PINS) || [];
}

export function getPin(id: string): Pin | undefined {
  return getPins().find(p => p.id === id);
}

export function createPin(pin: Omit<Pin, 'id' | 'createdAt' | 'updatedAt' | 'likes' | 'saves' | 'comments'>): Pin {
  const pins = getPins();
  const newPin: Pin = {
    ...pin,
    id: `pin-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    likes: [],
    saves: [],
    comments: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  pins.unshift(newPin);
  setItem(STORAGE_KEYS.PINS, pins);

  // Add to board if specified
  if (pin.boardId) {
    const boards = getBoards();
    const boardIdx = boards.findIndex(b => b.id === pin.boardId);
    if (boardIdx !== -1) {
      boards[boardIdx].pins.push(newPin.id);
      boards[boardIdx].updatedAt = new Date().toISOString();
      setItem(STORAGE_KEYS.BOARDS, boards);
    }
  }

  return newPin;
}

export function updatePin(id: string, updates: Partial<Pin>): Pin | undefined {
  const pins = getPins();
  const idx = pins.findIndex(p => p.id === id);
  if (idx === -1) return undefined;
  pins[idx] = { ...pins[idx], ...updates, updatedAt: new Date().toISOString() };
  setItem(STORAGE_KEYS.PINS, pins);
  return pins[idx];
}

export function deletePin(id: string): boolean {
  const pins = getPins();
  const idx = pins.findIndex(p => p.id === id);
  if (idx === -1) return false;
  const pin = pins[idx];
  pins.splice(idx, 1);
  setItem(STORAGE_KEYS.PINS, pins);

  // Remove from board
  if (pin.boardId) {
    const boards = getBoards();
    const boardIdx = boards.findIndex(b => b.id === pin.boardId);
    if (boardIdx !== -1) {
      boards[boardIdx].pins = boards[boardIdx].pins.filter(pId => pId !== id);
      setItem(STORAGE_KEYS.BOARDS, boards);
    }
  }
  return true;
}

export function toggleLikePin(pinId: string, userId: string): boolean {
  const pins = getPins();
  const idx = pins.findIndex(p => p.id === pinId);
  if (idx === -1) return false;

  const isLiked = pins[idx].likes.includes(userId);
  if (isLiked) {
    pins[idx].likes = pins[idx].likes.filter(id => id !== userId);
  } else {
    pins[idx].likes.push(userId);
    if (pins[idx].authorId !== userId) {
      const user = getUser(userId);
      addNotification({
        id: `notif-${Date.now()}`,
        type: 'like',
        fromUserId: userId,
        toUserId: pins[idx].authorId,
        pinId,
        message: `${user?.displayName || 'Someone'} liked your pin`,
        read: false,
        createdAt: new Date().toISOString(),
      });
    }
  }
  setItem(STORAGE_KEYS.PINS, pins);
  return !isLiked;
}

export function toggleSavePin(pinId: string, userId: string): boolean {
  const pins = getPins();
  const idx = pins.findIndex(p => p.id === pinId);
  if (idx === -1) return false;

  const isSaved = pins[idx].saves.includes(userId);
  if (isSaved) {
    pins[idx].saves = pins[idx].saves.filter(id => id !== userId);
  } else {
    pins[idx].saves.push(userId);
    if (pins[idx].authorId !== userId) {
      const user = getUser(userId);
      addNotification({
        id: `notif-${Date.now()}`,
        type: 'save',
        fromUserId: userId,
        toUserId: pins[idx].authorId,
        pinId,
        message: `${user?.displayName || 'Someone'} saved your pin`,
        read: false,
        createdAt: new Date().toISOString(),
      });
    }
  }
  setItem(STORAGE_KEYS.PINS, pins);
  return !isSaved;
}

export function savePinToBoard(pinId: string, boardId: string): boolean {
  const boards = getBoards();
  const boardIdx = boards.findIndex(b => b.id === boardId);
  if (boardIdx === -1) return false;
  if (!boards[boardIdx].pins.includes(pinId)) {
    boards[boardIdx].pins.push(pinId);
    boards[boardIdx].updatedAt = new Date().toISOString();
    setItem(STORAGE_KEYS.BOARDS, boards);
  }
  const pins = getPins();
  const pinIdx = pins.findIndex(p => p.id === pinId);
  if (pinIdx !== -1 && !pins[pinIdx].boardId) {
    pins[pinIdx].boardId = boardId;
    setItem(STORAGE_KEYS.PINS, pins);
  }
  return true;
}

export function addComment(pinId: string, userId: string, text: string): import('./types').Comment | undefined {
  const pins = getPins();
  const idx = pins.findIndex(p => p.id === pinId);
  if (idx === -1) return undefined;

  const comment: import('./types').Comment = {
    id: `comment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    text,
    authorId: userId,
    pinId,
    likes: [],
    createdAt: new Date().toISOString(),
  };

  pins[idx].comments.push(comment);
  pins[idx].updatedAt = new Date().toISOString();
  setItem(STORAGE_KEYS.PINS, pins);

  if (pins[idx].authorId !== userId) {
    const user = getUser(userId);
    addNotification({
      id: `notif-${Date.now()}`,
      type: 'comment',
      fromUserId: userId,
      toUserId: pins[idx].authorId,
      pinId,
      message: `${user?.displayName || 'Someone'} commented on your pin`,
      read: false,
      createdAt: new Date().toISOString(),
    });
  }

  return comment;
}

export function toggleLikeComment(pinId: string, commentId: string, userId: string): boolean {
  const pins = getPins();
  const pinIdx = pins.findIndex(p => p.id === pinId);
  if (pinIdx === -1) return false;
  const commentIdx = pins[pinIdx].comments.findIndex(c => c.id === commentId);
  if (commentIdx === -1) return false;

  const isLiked = pins[pinIdx].comments[commentIdx].likes.includes(userId);
  if (isLiked) {
    pins[pinIdx].comments[commentIdx].likes = pins[pinIdx].comments[commentIdx].likes.filter(id => id !== userId);
  } else {
    pins[pinIdx].comments[commentIdx].likes.push(userId);
  }
  setItem(STORAGE_KEYS.PINS, pins);
  return !isLiked;
}

export function searchPins(query: string, category?: string): Pin[] {
  const pins = getPins().filter(p => !p.isPrivate);
  const q = query.toLowerCase();
  let results = pins;

  if (q) {
    results = results.filter(p =>
      p.title.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.tags.some(t => t.toLowerCase().includes(q)) ||
      p.category.toLowerCase().includes(q)
    );
  }

  if (category && category !== 'All') {
    results = results.filter(p => p.category === category);
  }

  return results;
}

export function getPinsByUser(userId: string): Pin[] {
  return getPins().filter(p => p.authorId === userId);
}

export function getSavedPinsByUser(userId: string): Pin[] {
  return getPins().filter(p => p.saves.includes(userId));
}

export function getTrendingPins(): Pin[] {
  return getPins()
    .filter(p => !p.isPrivate)
    .sort((a, b) => (b.likes.length + b.saves.length + b.comments.length) - (a.likes.length + a.saves.length + a.comments.length));
}

// ---- Boards ----
export function getBoards(): Board[] {
  return getItem<Board[]>(STORAGE_KEYS.BOARDS) || [];
}

export function getBoard(id: string): Board | undefined {
  return getBoards().find(b => b.id === id);
}

export function createBoard(board: Omit<Board, 'id' | 'createdAt' | 'updatedAt' | 'pins' | 'followers' | 'collaborators'>): Board {
  const boards = getBoards();
  const newBoard: Board = {
    ...board,
    id: `board-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    pins: [],
    followers: [],
    collaborators: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  boards.push(newBoard);
  setItem(STORAGE_KEYS.BOARDS, boards);
  return newBoard;
}

export function updateBoard(id: string, updates: Partial<Board>): Board | undefined {
  const boards = getBoards();
  const idx = boards.findIndex(b => b.id === id);
  if (idx === -1) return undefined;
  boards[idx] = { ...boards[idx], ...updates, updatedAt: new Date().toISOString() };
  setItem(STORAGE_KEYS.BOARDS, boards);
  return boards[idx];
}

export function deleteBoard(id: string): boolean {
  const boards = getBoards();
  const idx = boards.findIndex(b => b.id === id);
  if (idx === -1) return false;

  // Unpin all pins from this board
  const pins = getPins();
  pins.forEach(p => {
    if (p.boardId === id) p.boardId = undefined;
  });
  setItem(STORAGE_KEYS.PINS, pins);

  boards.splice(idx, 1);
  setItem(STORAGE_KEYS.BOARDS, boards);
  return true;
}

export function getBoardsByUser(userId: string): Board[] {
  return getBoards().filter(b => b.ownerId === userId || b.collaborators.includes(userId));
}

export function toggleFollowBoard(boardId: string, userId: string): boolean {
  const boards = getBoards();
  const idx = boards.findIndex(b => b.id === boardId);
  if (idx === -1) return false;

  const isFollowing = boards[idx].followers.includes(userId);
  if (isFollowing) {
    boards[idx].followers = boards[idx].followers.filter(id => id !== userId);
  } else {
    boards[idx].followers.push(userId);
  }
  setItem(STORAGE_KEYS.BOARDS, boards);
  return !isFollowing;
}

// ---- Notifications ----
export function getNotifications(userId?: string): Notification[] {
  const notifs = getItem<Notification[]>(STORAGE_KEYS.NOTIFICATIONS) || [];
  if (userId) return notifs.filter(n => n.toUserId === userId);
  return notifs;
}

export function getUnreadCount(userId: string): number {
  return getNotifications(userId).filter(n => !n.read).length;
}

export function markNotificationRead(notifId: string) {
  const notifs = getItem<Notification[]>(STORAGE_KEYS.NOTIFICATIONS) || [];
  const idx = notifs.findIndex(n => n.id === notifId);
  if (idx !== -1) {
    notifs[idx].read = true;
    setItem(STORAGE_KEYS.NOTIFICATIONS, notifs);
  }
}

export function markAllNotificationsRead(userId: string) {
  const notifs = getItem<Notification[]>(STORAGE_KEYS.NOTIFICATIONS) || [];
  notifs.forEach(n => {
    if (n.toUserId === userId) n.read = true;
  });
  setItem(STORAGE_KEYS.NOTIFICATIONS, notifs);
}

function addNotification(notif: Notification) {
  const notifs = getItem<Notification[]>(STORAGE_KEYS.NOTIFICATIONS) || [];
  notifs.unshift(notif);
  setItem(STORAGE_KEYS.NOTIFICATIONS, notifs);
}

// ---- Search Users ----
export function searchUsers(query: string): User[] {
  const q = query.toLowerCase();
  return getUsers().filter(u =>
    u.displayName.toLowerCase().includes(q) ||
    u.username.toLowerCase().includes(q) ||
    u.bio.toLowerCase().includes(q)
  );
}

export function searchBoards(query: string): Board[] {
  const q = query.toLowerCase();
  return getBoards().filter(b => !b.isPrivate && (
    b.name.toLowerCase().includes(q) ||
    b.description.toLowerCase().includes(q) ||
    b.category.toLowerCase().includes(q)
  ));
}

// ---- Reset ----
export function resetStore() {
  Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
  initializeStore();
}
