import fs from 'fs';
import path from 'path';
import type { User, Pin, Board, Comment, Notification, UserSettings } from './types';

// Server-side user type with password hash
export interface ServerUser extends User {
  passwordHash: string;
}

export type SafeUser = User;

interface Database {
  users: ServerUser[];
  pins: Pin[];
  boards: Board[];
  notifications: Notification[];
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DATA_DIR, 'db.json');

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

const emptyDb = (): Database => ({
  users: [],
  pins: [],
  boards: [],
  notifications: [],
});

export function readDb(): Database {
  ensureDir();
  if (!fs.existsSync(DB_PATH)) {
    const db = emptyDb();
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
    return db;
  }
  try {
    return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
  } catch {
    return emptyDb();
  }
}

export function writeDb(db: Database) {
  ensureDir();
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

export function stripPassword(u: ServerUser): SafeUser {
  const { passwordHash, ...safe } = u;
  return safe;
}

// ==================== USERS ====================

export function getAllUsers(): SafeUser[] {
  return readDb().users.map(stripPassword);
}

export function getUserById(id: string): SafeUser | null {
  const u = readDb().users.find(x => x.id === id);
  return u ? stripPassword(u) : null;
}

export function getUserFull(id: string): ServerUser | null {
  return readDb().users.find(x => x.id === id) || null;
}

export function getUserByUsername(username: string): ServerUser | null {
  return readDb().users.find(x => x.username.toLowerCase() === username.toLowerCase()) || null;
}

export function getUserByEmail(email: string): ServerUser | null {
  return readDb().users.find(x => x.email.toLowerCase() === email.toLowerCase()) || null;
}

export function createUser(user: ServerUser): SafeUser {
  const db = readDb();
  db.users.push(user);
  writeDb(db);
  return stripPassword(user);
}

export function updateUser(id: string, updates: Partial<Omit<ServerUser, 'id'>>): SafeUser | null {
  const db = readDb();
  const idx = db.users.findIndex(x => x.id === id);
  if (idx === -1) return null;
  db.users[idx] = { ...db.users[idx], ...updates };
  writeDb(db);
  return stripPassword(db.users[idx]);
}

export function toggleFollow(followerId: string, targetId: string): boolean {
  if (followerId === targetId) return false;
  const db = readDb();
  const follower = db.users.find(x => x.id === followerId);
  const target = db.users.find(x => x.id === targetId);
  if (!follower || !target) return false;

  const isFollowing = follower.following.includes(targetId);
  if (isFollowing) {
    follower.following = follower.following.filter(id => id !== targetId);
    target.followers = target.followers.filter(id => id !== followerId);
  } else {
    follower.following.push(targetId);
    target.followers.push(followerId);
    db.notifications.push({
      id: `notif-${Date.now()}-follow`,
      type: 'follow',
      fromUserId: followerId,
      toUserId: targetId,
      message: `${follower.displayName} started following you`,
      read: false,
      createdAt: new Date().toISOString(),
    });
  }
  writeDb(db);
  return !isFollowing; // true = now following
}

// ==================== PINS ====================

export function getAllPins(): Pin[] {
  return readDb().pins;
}

export function getPin(id: string): Pin | null {
  return readDb().pins.find(x => x.id === id) || null;
}

export function createPin(pin: Pin): Pin {
  const db = readDb();
  db.pins.unshift(pin); // newest first
  if (pin.boardId) {
    const board = db.boards.find(b => b.id === pin.boardId);
    if (board && !board.pins.includes(pin.id)) {
      board.pins.push(pin.id);
    }
  }
  writeDb(db);
  return pin;
}

export function deletePin(id: string): boolean {
  const db = readDb();
  const exists = db.pins.some(p => p.id === id);
  if (!exists) return false;
  db.pins = db.pins.filter(p => p.id !== id);
  db.boards.forEach(b => {
    b.pins = b.pins.filter(pid => pid !== id);
  });
  db.notifications = db.notifications.filter(n => n.pinId !== id);
  writeDb(db);
  return true;
}

export function toggleLikePin(pinId: string, userId: string): boolean {
  const db = readDb();
  const pin = db.pins.find(p => p.id === pinId);
  if (!pin) return false;

  const isLiked = pin.likes.includes(userId);
  if (isLiked) {
    pin.likes = pin.likes.filter(id => id !== userId);
  } else {
    pin.likes.push(userId);
    if (pin.authorId !== userId) {
      const user = db.users.find(u => u.id === userId);
      db.notifications.push({
        id: `notif-${Date.now()}-like`,
        type: 'like',
        fromUserId: userId,
        toUserId: pin.authorId,
        pinId,
        message: `${user?.displayName || 'Someone'} liked your pin "${pin.title}"`,
        read: false,
        createdAt: new Date().toISOString(),
      });
    }
  }
  writeDb(db);
  return !isLiked;
}

export function toggleSavePin(pinId: string, userId: string): boolean {
  const db = readDb();
  const pin = db.pins.find(p => p.id === pinId);
  if (!pin) return false;

  const isSaved = pin.saves.includes(userId);
  if (isSaved) {
    pin.saves = pin.saves.filter(id => id !== userId);
  } else {
    pin.saves.push(userId);
    if (pin.authorId !== userId) {
      const user = db.users.find(u => u.id === userId);
      db.notifications.push({
        id: `notif-${Date.now()}-save`,
        type: 'save',
        fromUserId: userId,
        toUserId: pin.authorId,
        pinId,
        message: `${user?.displayName || 'Someone'} saved your pin "${pin.title}"`,
        read: false,
        createdAt: new Date().toISOString(),
      });
    }
  }
  writeDb(db);
  return !isSaved;
}

export function savePinToBoard(pinId: string, boardId: string): boolean {
  const db = readDb();
  const board = db.boards.find(b => b.id === boardId);
  const pin = db.pins.find(p => p.id === pinId);
  if (!board || !pin) return false;
  if (!board.pins.includes(pinId)) board.pins.push(pinId);
  pin.boardId = boardId;
  writeDb(db);
  return true;
}

export function addComment(pinId: string, userId: string, text: string): Comment | null {
  const db = readDb();
  const pin = db.pins.find(p => p.id === pinId);
  if (!pin) return null;

  const comment: Comment = {
    id: `comment-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    text,
    authorId: userId,
    pinId,
    likes: [],
    createdAt: new Date().toISOString(),
  };
  pin.comments.push(comment);

  if (pin.authorId !== userId) {
    const user = db.users.find(u => u.id === userId);
    db.notifications.push({
      id: `notif-${Date.now()}-comment`,
      type: 'comment',
      fromUserId: userId,
      toUserId: pin.authorId,
      pinId,
      message: `${user?.displayName || 'Someone'} commented on your pin "${pin.title}"`,
      read: false,
      createdAt: new Date().toISOString(),
    });
  }
  writeDb(db);
  return comment;
}

export function toggleLikeComment(pinId: string, commentId: string, userId: string): boolean {
  const db = readDb();
  const pin = db.pins.find(p => p.id === pinId);
  if (!pin) return false;
  const comment = pin.comments.find(c => c.id === commentId);
  if (!comment) return false;

  const isLiked = comment.likes.includes(userId);
  if (isLiked) {
    comment.likes = comment.likes.filter(id => id !== userId);
  } else {
    comment.likes.push(userId);
  }
  writeDb(db);
  return !isLiked;
}

export function searchPins(query: string, category?: string): Pin[] {
  const q = query.toLowerCase();
  return readDb().pins.filter(p => {
    if (p.isPrivate) return false;
    if (category && category !== 'All' && p.category !== category) return false;
    return (
      p.title.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.tags.some(t => t.toLowerCase().includes(q)) ||
      p.category.toLowerCase().includes(q)
    );
  });
}

export function getPinsByUser(userId: string): Pin[] {
  return readDb().pins.filter(p => p.authorId === userId);
}

export function getSavedPinsByUser(userId: string): Pin[] {
  return readDb().pins.filter(p => p.saves.includes(userId));
}

export function getTrendingPins(): Pin[] {
  return readDb()
    .pins.filter(p => !p.isPrivate)
    .sort(
      (a, b) =>
        b.likes.length + b.saves.length + b.comments.length -
        (a.likes.length + a.saves.length + a.comments.length)
    );
}

// ==================== BOARDS ====================

export function getAllBoards(): Board[] {
  return readDb().boards;
}

export function getBoard(id: string): Board | null {
  return readDb().boards.find(b => b.id === id) || null;
}

export function createBoard(board: Board): Board {
  const db = readDb();
  db.boards.push(board);
  writeDb(db);
  return board;
}

export function updateBoard(id: string, updates: Partial<Board>): Board | null {
  const db = readDb();
  const idx = db.boards.findIndex(b => b.id === id);
  if (idx === -1) return null;
  db.boards[idx] = { ...db.boards[idx], ...updates, updatedAt: new Date().toISOString() };
  writeDb(db);
  return db.boards[idx];
}

export function deleteBoard(id: string): boolean {
  const db = readDb();
  const exists = db.boards.some(b => b.id === id);
  if (!exists) return false;
  // Unlink pins from this board
  db.pins.forEach(p => {
    if (p.boardId === id) p.boardId = undefined;
  });
  db.boards = db.boards.filter(b => b.id !== id);
  writeDb(db);
  return true;
}

export function getBoardsByUser(userId: string): Board[] {
  return readDb().boards.filter(b => b.ownerId === userId);
}

export function toggleFollowBoard(boardId: string, userId: string): boolean {
  const db = readDb();
  const board = db.boards.find(b => b.id === boardId);
  if (!board) return false;

  const isFollowing = board.followers.includes(userId);
  if (isFollowing) {
    board.followers = board.followers.filter(id => id !== userId);
  } else {
    board.followers.push(userId);
  }
  writeDb(db);
  return !isFollowing;
}

// ==================== NOTIFICATIONS ====================

export function getNotifications(userId: string): Notification[] {
  return readDb()
    .notifications.filter(n => n.toUserId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function markNotificationRead(id: string): boolean {
  const db = readDb();
  const notif = db.notifications.find(n => n.id === id);
  if (!notif) return false;
  notif.read = true;
  writeDb(db);
  return true;
}

export function markAllNotificationsRead(userId: string): void {
  const db = readDb();
  db.notifications.forEach(n => {
    if (n.toUserId === userId) n.read = true;
  });
  writeDb(db);
}

// ==================== SEARCH ====================

export function searchUsers(query: string): SafeUser[] {
  const q = query.toLowerCase();
  return readDb()
    .users.filter(
      u => u.username.toLowerCase().includes(q) || u.displayName.toLowerCase().includes(q)
    )
    .map(stripPassword);
}

export function searchBoards(query: string): Board[] {
  const q = query.toLowerCase();
  return readDb().boards.filter(
    b =>
      !b.isPrivate &&
      (b.name.toLowerCase().includes(q) || b.description.toLowerCase().includes(q))
  );
}

// ==================== SEED ====================

export function isSeeded(): boolean {
  return readDb().users.length > 0;
}

export function seedDatabase(data: Database): void {
  writeDb(data);
}
