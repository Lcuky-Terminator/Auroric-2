import { ID, Query } from 'node-appwrite';
import { databases, DB_ID, USERS_COL, PINS_COL, BOARDS_COL, NOTIFICATIONS_COL, MESSAGES_COL, CONVERSATIONS_COL, DELETION_REQUESTS_COL } from './appwrite';
import type { User, Pin, Board, Comment, Notification, UserSettings, PaginatedResult, Conversation, Message, DeletionRequest } from './types';
import { CHAT_STORAGE_LIMIT_STANDARD, CHAT_STORAGE_LIMIT_VERIFIED } from './types';

// ── Types ──

export interface ServerUser extends User {
  passwordHash: string;
}

export type SafeUser = User;

// ── Document ↔ Model converters ──

function docToUser(doc: any): ServerUser {
  return {
    id: doc.$id,
    username: doc.username,
    displayName: doc.displayName,
    email: doc.email,
    bio: doc.bio || '',
    avatar: doc.avatar || '',
    website: doc.website || '',
    passwordHash: doc.passwordHash,
    followers: jsonParse(doc.followersJson),
    following: jsonParse(doc.followingJson),
    createdAt: doc.createdAt,
    emailVerified: doc.emailVerified ?? false,
    // Verification
    isVerified: doc.isVerified ?? false,
    verificationType: doc.verificationType || 'none',
    isPromoted: doc.isPromoted ?? false,
    // Expanded Profile
    gender: doc.gender || undefined,
    dob: doc.dob || undefined,
    country: doc.country || undefined,
    // Security
    passwordChangeCount: doc.passwordChangeCount ?? 0,
    passwordChangeLockUntil: doc.passwordChangeLockUntil || undefined,
    accountStatus: doc.accountStatus || 'active',
    settings: {
      privateProfile: doc.settingsPrivateProfile ?? false,
      showActivity: doc.settingsShowActivity ?? true,
      allowMessages: doc.settingsAllowMessages ?? true,
      allowNotifications: doc.settingsAllowNotifications ?? true,
      emailOnNewFollower: doc.settingsEmailOnNewFollower ?? false,
      emailOnPinInteraction: doc.settingsEmailOnPinInteraction ?? false,
      theme: (doc.settingsTheme as 'dark' | 'light') || 'dark',
    },
  };
}

function userToDoc(u: ServerUser): Record<string, any> {
  const s = u.settings || {} as any;
  // IMPORTANT: Only include attributes that exist in the Appwrite collection schema.
  // See scripts/setup-appwrite.ts for the definitive list of attributes.
  return {
    username: u.username,
    displayName: u.displayName,
    email: u.email,
    bio: u.bio || '',
    avatar: u.avatar || '',
    website: u.website || '',
    passwordHash: u.passwordHash,
    followersJson: JSON.stringify(u.followers),
    followingJson: JSON.stringify(u.following),
    createdAt: u.createdAt,
    emailVerified: u.emailVerified ?? false,
    settingsPrivateProfile: s.privateProfile ?? false,
    settingsShowActivity: s.showActivity ?? true,
    settingsAllowMessages: s.allowMessages ?? true,
    settingsAllowNotifications: s.allowNotifications ?? true,
    settingsEmailOnNewFollower: s.emailOnNewFollower ?? false,
    settingsEmailOnPinInteraction: s.emailOnPinInteraction ?? false,
    settingsTheme: s.theme || 'dark',
  };
}

function docToPin(doc: any): Pin {
  return {
    id: doc.$id,
    title: doc.title,
    description: doc.description || '',
    imageUrl: doc.imageUrl,
    sourceUrl: doc.sourceUrl || '',
    authorId: doc.authorId,
    boardId: doc.boardId || undefined,
    tags: jsonParse(doc.tagsJson),
    category: doc.category || 'All',
    likes: jsonParse(doc.likesJson),
    saves: jsonParse(doc.savesJson),
    comments: jsonParse(doc.commentsJson),
    views: doc.views ?? 0,
    isPrivate: doc.isPrivate ?? false,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt || doc.createdAt,
  };
}

function pinToDoc(p: Pin): Record<string, any> {
  return {
    title: p.title,
    description: p.description,
    imageUrl: p.imageUrl,
    sourceUrl: p.sourceUrl || '',
    authorId: p.authorId,
    boardId: p.boardId || '',
    category: p.category,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
    isPrivate: p.isPrivate,
    views: p.views ?? 0,
    tagsJson: JSON.stringify(p.tags),
    likesJson: JSON.stringify(p.likes),
    savesJson: JSON.stringify(p.saves),
    commentsJson: JSON.stringify(p.comments),
  };
}

function docToBoard(doc: any): Board {
  return {
    id: doc.$id,
    name: doc.name,
    description: doc.description || '',
    coverImage: doc.coverImage || '',
    ownerId: doc.ownerId,
    pins: jsonParse(doc.pinIdsJson),
    followers: jsonParse(doc.followersJson),
    collaborators: jsonParse(doc.collaboratorsJson),
    isPrivate: doc.isPrivate ?? false,
    category: doc.category || 'All',
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt || doc.createdAt,
  };
}

function boardToDoc(b: Board): Record<string, any> {
  return {
    name: b.name,
    description: b.description,
    coverImage: b.coverImage,
    ownerId: b.ownerId,
    category: b.category,
    createdAt: b.createdAt,
    updatedAt: b.updatedAt,
    isPrivate: b.isPrivate,
    pinIdsJson: JSON.stringify(b.pins),
    followersJson: JSON.stringify(b.followers),
    collaboratorsJson: JSON.stringify(b.collaborators),
  };
}

function docToNotification(doc: any): Notification {
  return {
    id: doc.$id,
    type: doc.type,
    fromUserId: doc.fromUserId,
    toUserId: doc.toUserId,
    pinId: doc.pinId || undefined,
    boardId: doc.boardId || undefined,
    message: doc.message,
    read: doc.read ?? false,
    createdAt: doc.createdAt,
  };
}

function notifToDoc(n: Notification): Record<string, any> {
  return {
    type: n.type,
    fromUserId: n.fromUserId,
    toUserId: n.toUserId,
    pinId: n.pinId || '',
    boardId: n.boardId || '',
    message: n.message,
    read: n.read,
    createdAt: n.createdAt,
  };
}

function jsonParse(val: string | undefined | null): any[] {
  if (!val) return [];
  try { return JSON.parse(val); } catch { return []; }
}

// ── Helpers ──

export function stripPassword(u: ServerUser): SafeUser {
  const { passwordHash, ...safe } = u;
  return safe;
}

async function listAll(collectionId: string, queries: string[] = []): Promise<any[]> {
  const allDocs: any[] = [];
  let offset = 0;
  const limit = 100;
  while (true) {
    const { documents } = await databases.listDocuments(DB_ID, collectionId, [
      ...queries,
      Query.limit(limit),
      Query.offset(offset),
    ]);
    allDocs.push(...documents);
    if (documents.length < limit) break;
    offset += limit;
  }
  return allDocs;
}

// ==================== USERS ====================

export async function getAllUsers(): Promise<SafeUser[]> {
  const docs = await listAll(USERS_COL);
  return docs.map(d => stripPassword(docToUser(d)));
}

export async function getUserById(id: string): Promise<SafeUser | null> {
  try {
    const doc = await databases.getDocument(DB_ID, USERS_COL, id);
    return stripPassword(docToUser(doc));
  } catch { return null; }
}

export async function getUserFull(id: string): Promise<ServerUser | null> {
  try {
    const doc = await databases.getDocument(DB_ID, USERS_COL, id);
    return docToUser(doc);
  } catch { return null; }
}

export async function getUserByUsername(username: string): Promise<ServerUser | null> {
  const { documents } = await databases.listDocuments(DB_ID, USERS_COL, [
    Query.equal('username', username),
    Query.limit(1),
  ]);
  return documents.length ? docToUser(documents[0]) : null;
}

export async function getUserByEmail(email: string): Promise<ServerUser | null> {
  const { documents } = await databases.listDocuments(DB_ID, USERS_COL, [
    Query.equal('email', email),
    Query.limit(1),
  ]);
  return documents.length ? docToUser(documents[0]) : null;
}

export async function createUser(user: ServerUser): Promise<SafeUser> {
  const docId = user.id || ID.unique();
  const doc = await databases.createDocument(DB_ID, USERS_COL, docId, userToDoc(user));
  return stripPassword(docToUser(doc));
}

export async function updateUser(id: string, updates: Partial<Omit<ServerUser, 'id'>>): Promise<SafeUser | null> {
  try {
    const current = await getUserFull(id);
    if (!current) return null;

    const merged = { ...current, ...updates } as ServerUser;
    if (updates.settings) {
      merged.settings = { ...current.settings, ...updates.settings };
    }

    const doc = await databases.updateDocument(DB_ID, USERS_COL, id, userToDoc(merged));
    return stripPassword(docToUser(doc));
  } catch { return null; }
}

export async function toggleFollow(followerId: string, targetId: string): Promise<boolean> {
  if (followerId === targetId) return false;

  const followerDoc = await databases.getDocument(DB_ID, USERS_COL, followerId);
  const targetDoc = await databases.getDocument(DB_ID, USERS_COL, targetId);
  const follower = docToUser(followerDoc);
  const target = docToUser(targetDoc);

  const isFollowing = follower.following.includes(targetId);
  if (isFollowing) {
    follower.following = follower.following.filter(id => id !== targetId);
    target.followers = target.followers.filter(id => id !== followerId);
  } else {
    follower.following.push(targetId);
    target.followers.push(followerId);
    await databases.createDocument(DB_ID, NOTIFICATIONS_COL, ID.unique(), notifToDoc({
      id: '',
      type: 'follow',
      fromUserId: followerId,
      toUserId: targetId,
      message: `${follower.displayName} started following you`,
      read: false,
      createdAt: new Date().toISOString(),
    }));
  }

  await databases.updateDocument(DB_ID, USERS_COL, followerId, {
    followingJson: JSON.stringify(follower.following),
  });
  await databases.updateDocument(DB_ID, USERS_COL, targetId, {
    followersJson: JSON.stringify(target.followers),
  });

  return !isFollowing;
}

// ==================== PINS ====================

export async function getAllPins(): Promise<Pin[]> {
  const docs = await listAll(PINS_COL, [Query.orderDesc('createdAt')]);
  return docs.map(docToPin);
}

export async function getPinsPaginated(page: number = 1, limit: number = 20, category?: string): Promise<PaginatedResult<Pin>> {
  const queries: string[] = [Query.orderDesc('createdAt')];
  if (category && category !== 'All') {
    queries.push(Query.equal('category', category));
  }
  // Get total count
  const { total } = await databases.listDocuments(DB_ID, PINS_COL, [
    ...queries.filter(q => !q.includes('orderDesc')),
    Query.limit(1),
  ]);
  const offset = (page - 1) * limit;
  const { documents } = await databases.listDocuments(DB_ID, PINS_COL, [
    ...queries,
    Query.limit(limit),
    Query.offset(offset),
  ]);
  const data = documents.map(docToPin);
  return { data, total, page, limit, hasMore: offset + data.length < total };
}

export async function getPin(id: string): Promise<Pin | null> {
  try {
    const doc = await databases.getDocument(DB_ID, PINS_COL, id);
    return docToPin(doc);
  } catch { return null; }
}

export async function createPin(pin: Pin): Promise<Pin> {
  const docId = pin.id || ID.unique();
  const doc = await databases.createDocument(DB_ID, PINS_COL, docId, pinToDoc(pin));
  const created = docToPin(doc);

  if (pin.boardId) {
    try {
      const boardDoc = await databases.getDocument(DB_ID, BOARDS_COL, pin.boardId);
      const board = docToBoard(boardDoc);
      if (!board.pins.includes(created.id)) {
        board.pins.push(created.id);
        await databases.updateDocument(DB_ID, BOARDS_COL, pin.boardId, {
          pinIdsJson: JSON.stringify(board.pins),
        });
      }
    } catch { /* board not found */ }
  }

  return created;
}

export async function deletePin(id: string): Promise<boolean> {
  try {
    await databases.deleteDocument(DB_ID, PINS_COL, id);

    const boardDocs = await listAll(BOARDS_COL);
    for (const bdoc of boardDocs) {
      const board = docToBoard(bdoc);
      if (board.pins.includes(id)) {
        board.pins = board.pins.filter(pid => pid !== id);
        await databases.updateDocument(DB_ID, BOARDS_COL, board.id, {
          pinIdsJson: JSON.stringify(board.pins),
        });
      }
    }

    const notifDocs = await listAll(NOTIFICATIONS_COL, [Query.equal('pinId', id)]);
    for (const ndoc of notifDocs) {
      await databases.deleteDocument(DB_ID, NOTIFICATIONS_COL, ndoc.$id);
    }

    return true;
  } catch { return false; }
}

export async function toggleLikePin(pinId: string, userId: string): Promise<boolean> {
  const doc = await databases.getDocument(DB_ID, PINS_COL, pinId);
  const pin = docToPin(doc);

  const isLiked = pin.likes.includes(userId);
  if (isLiked) {
    pin.likes = pin.likes.filter(id => id !== userId);
  } else {
    pin.likes.push(userId);
    if (pin.authorId !== userId) {
      let displayName = 'Someone';
      try {
        const u = await databases.getDocument(DB_ID, USERS_COL, userId);
        displayName = u.displayName;
      } catch { }
      await databases.createDocument(DB_ID, NOTIFICATIONS_COL, ID.unique(), notifToDoc({
        id: '',
        type: 'like',
        fromUserId: userId,
        toUserId: pin.authorId,
        pinId,
        message: `${displayName} liked your pin "${pin.title}"`,
        read: false,
        createdAt: new Date().toISOString(),
      }));
    }
  }

  await databases.updateDocument(DB_ID, PINS_COL, pinId, {
    likesJson: JSON.stringify(pin.likes),
  });
  return !isLiked;
}

export async function toggleSavePin(pinId: string, userId: string): Promise<boolean> {
  const doc = await databases.getDocument(DB_ID, PINS_COL, pinId);
  const pin = docToPin(doc);

  const isSaved = pin.saves.includes(userId);
  if (isSaved) {
    pin.saves = pin.saves.filter(id => id !== userId);
  } else {
    pin.saves.push(userId);
    if (pin.authorId !== userId) {
      let displayName = 'Someone';
      try {
        const u = await databases.getDocument(DB_ID, USERS_COL, userId);
        displayName = u.displayName;
      } catch { }
      await databases.createDocument(DB_ID, NOTIFICATIONS_COL, ID.unique(), notifToDoc({
        id: '',
        type: 'save',
        fromUserId: userId,
        toUserId: pin.authorId,
        pinId,
        message: `${displayName} saved your pin "${pin.title}"`,
        read: false,
        createdAt: new Date().toISOString(),
      }));
    }
  }

  await databases.updateDocument(DB_ID, PINS_COL, pinId, {
    savesJson: JSON.stringify(pin.saves),
  });
  return !isSaved;
}

export async function savePinToBoard(pinId: string, boardId: string): Promise<boolean> {
  try {
    const boardDoc = await databases.getDocument(DB_ID, BOARDS_COL, boardId);
    const board = docToBoard(boardDoc);

    if (!board.pins.includes(pinId)) {
      board.pins.push(pinId);
      await databases.updateDocument(DB_ID, BOARDS_COL, boardId, {
        pinIdsJson: JSON.stringify(board.pins),
      });
    }

    await databases.updateDocument(DB_ID, PINS_COL, pinId, { boardId });
    return true;
  } catch { return false; }
}

export async function addComment(pinId: string, userId: string, text: string): Promise<Comment | null> {
  try {
    const doc = await databases.getDocument(DB_ID, PINS_COL, pinId);
    const pin = docToPin(doc);

    const comment: Comment = {
      id: `comment-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      text,
      authorId: userId,
      pinId,
      likes: [],
      createdAt: new Date().toISOString(),
    };
    pin.comments.push(comment);

    await databases.updateDocument(DB_ID, PINS_COL, pinId, {
      commentsJson: JSON.stringify(pin.comments),
    });

    if (pin.authorId !== userId) {
      let displayName = 'Someone';
      try {
        const u = await databases.getDocument(DB_ID, USERS_COL, userId);
        displayName = u.displayName;
      } catch { }
      await databases.createDocument(DB_ID, NOTIFICATIONS_COL, ID.unique(), notifToDoc({
        id: '',
        type: 'comment',
        fromUserId: userId,
        toUserId: pin.authorId,
        pinId,
        message: `${displayName} commented on your pin "${pin.title}"`,
        read: false,
        createdAt: new Date().toISOString(),
      }));
    }

    return comment;
  } catch { return null; }
}

export async function deleteComment(pinId: string, commentId: string, userId: string): Promise<boolean> {
  try {
    const doc = await databases.getDocument(DB_ID, PINS_COL, pinId);
    const pin = docToPin(doc);
    const comment = pin.comments.find(c => c.id === commentId);
    if (!comment) return false;
    // Only comment author or pin author can delete
    if (comment.authorId !== userId && pin.authorId !== userId) return false;

    pin.comments = pin.comments.filter(c => c.id !== commentId);
    await databases.updateDocument(DB_ID, PINS_COL, pinId, {
      commentsJson: JSON.stringify(pin.comments),
    });
    return true;
  } catch { return false; }
}

export async function toggleLikeComment(pinId: string, commentId: string, userId: string): Promise<boolean> {
  const doc = await databases.getDocument(DB_ID, PINS_COL, pinId);
  const pin = docToPin(doc);
  const comment = pin.comments.find(c => c.id === commentId);
  if (!comment) return false;

  const isLiked = comment.likes.includes(userId);
  if (isLiked) {
    comment.likes = comment.likes.filter(id => id !== userId);
  } else {
    comment.likes.push(userId);
  }

  await databases.updateDocument(DB_ID, PINS_COL, pinId, {
    commentsJson: JSON.stringify(pin.comments),
  });
  return !isLiked;
}

export async function searchPins(query: string, category?: string): Promise<Pin[]> {
  const docs = await listAll(PINS_COL);
  const q = query.toLowerCase();
  return docs.map(docToPin).filter(p => {
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

export async function getPinsByUser(userId: string): Promise<Pin[]> {
  const docs = await listAll(PINS_COL, [Query.equal('authorId', userId)]);
  return docs.map(docToPin);
}

export async function getSavedPinsByUser(userId: string): Promise<Pin[]> {
  const docs = await listAll(PINS_COL);
  return docs.map(docToPin).filter(p => p.saves.includes(userId));
}

export async function getTrendingPins(): Promise<Pin[]> {
  const docs = await listAll(PINS_COL);
  return docs
    .map(docToPin)
    .filter(p => !p.isPrivate)
    .sort(
      (a, b) =>
        b.likes.length + b.saves.length + b.comments.length -
        (a.likes.length + a.saves.length + a.comments.length)
    );
}

/**
 * Get popular pins sorted by a specific metric.
 * @param sortBy - 'views' | 'likes' | 'comments'
 */
export async function getPopularPins(sortBy: 'views' | 'likes' | 'comments' = 'views'): Promise<Pin[]> {
  const docs = await listAll(PINS_COL);
  const publicPins = docs.map(docToPin).filter(p => !p.isPrivate);

  switch (sortBy) {
    case 'views':
      return publicPins.sort((a, b) => (b.views ?? 0) - (a.views ?? 0));
    case 'likes':
      return publicPins.sort((a, b) => b.likes.length - a.likes.length);
    case 'comments':
      return publicPins.sort((a, b) => b.comments.length - a.comments.length);
    default:
      return publicPins;
  }
}

/**
 * Increment the view counter for a pin.
 */
export async function incrementPinViews(pinId: string): Promise<number> {
  try {
    const doc = await databases.getDocument(DB_ID, PINS_COL, pinId);
    const currentViews = doc.views ?? 0;
    const newViews = currentViews + 1;
    await databases.updateDocument(DB_ID, PINS_COL, pinId, { views: newViews });
    return newViews;
  } catch {
    return 0;
  }
}

// ==================== BOARDS ====================

export async function getAllBoards(): Promise<Board[]> {
  const docs = await listAll(BOARDS_COL);
  return docs.map(docToBoard);
}

export async function getBoard(id: string): Promise<Board | null> {
  try {
    const doc = await databases.getDocument(DB_ID, BOARDS_COL, id);
    return docToBoard(doc);
  } catch { return null; }
}

export async function createBoard(board: Board): Promise<Board> {
  const docId = board.id || ID.unique();
  const doc = await databases.createDocument(DB_ID, BOARDS_COL, docId, boardToDoc(board));
  return docToBoard(doc);
}

export async function updateBoard(id: string, updates: Partial<Board>): Promise<Board | null> {
  try {
    const current = await getBoard(id);
    if (!current) return null;
    const merged = { ...current, ...updates, updatedAt: new Date().toISOString() };
    const doc = await databases.updateDocument(DB_ID, BOARDS_COL, id, boardToDoc(merged));
    return docToBoard(doc);
  } catch { return null; }
}

export async function deleteBoard(id: string): Promise<boolean> {
  try {
    const pinDocs = await listAll(PINS_COL, [Query.equal('boardId', id)]);
    for (const pdoc of pinDocs) {
      await databases.updateDocument(DB_ID, PINS_COL, pdoc.$id, { boardId: '' });
    }
    await databases.deleteDocument(DB_ID, BOARDS_COL, id);
    return true;
  } catch { return false; }
}

export async function getBoardsByUser(userId: string): Promise<Board[]> {
  const docs = await listAll(BOARDS_COL, [Query.equal('ownerId', userId)]);
  return docs.map(docToBoard);
}

export async function toggleFollowBoard(boardId: string, userId: string): Promise<boolean> {
  const doc = await databases.getDocument(DB_ID, BOARDS_COL, boardId);
  const board = docToBoard(doc);

  const isFollowing = board.followers.includes(userId);
  if (isFollowing) {
    board.followers = board.followers.filter(id => id !== userId);
  } else {
    board.followers.push(userId);
  }

  await databases.updateDocument(DB_ID, BOARDS_COL, boardId, {
    followersJson: JSON.stringify(board.followers),
  });
  return !isFollowing;
}

// ==================== NOTIFICATIONS ====================

export async function getNotifications(userId: string): Promise<Notification[]> {
  const docs = await listAll(NOTIFICATIONS_COL, [
    Query.equal('toUserId', userId),
    Query.orderDesc('createdAt'),
  ]);
  return docs.map(docToNotification);
}

export async function markNotificationRead(id: string): Promise<boolean> {
  try {
    await databases.updateDocument(DB_ID, NOTIFICATIONS_COL, id, { read: true });
    return true;
  } catch { return false; }
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  const docs = await listAll(NOTIFICATIONS_COL, [
    Query.equal('toUserId', userId),
    Query.equal('read', false),
  ]);
  for (const doc of docs) {
    await databases.updateDocument(DB_ID, NOTIFICATIONS_COL, doc.$id, { read: true });
  }
}

// ==================== SEARCH ====================

export async function searchUsers(query: string): Promise<SafeUser[]> {
  const docs = await listAll(USERS_COL);
  const q = query.toLowerCase();
  return docs
    .map(docToUser)
    .filter(u =>
      u.username.toLowerCase().includes(q) || u.displayName.toLowerCase().includes(q)
    )
    .map(stripPassword);
}

export async function searchBoards(query: string): Promise<Board[]> {
  const docs = await listAll(BOARDS_COL);
  const q = query.toLowerCase();
  return docs
    .map(docToBoard)
    .filter(b =>
      !b.isPrivate &&
      (b.name.toLowerCase().includes(q) || b.description.toLowerCase().includes(q))
    );
}

// ==================== SEED ====================

export async function isSeeded(): Promise<boolean> {
  const { total } = await databases.listDocuments(DB_ID, USERS_COL, [Query.limit(1)]);
  return total > 0;
}

export async function seedDatabase(data: {
  users: ServerUser[];
  pins: Pin[];
  boards: Board[];
  notifications: Notification[];
}): Promise<void> {
  for (const user of data.users) {
    try {
      await databases.createDocument(DB_ID, USERS_COL, user.id, userToDoc(user));
    } catch (e: any) {
      if (e.code !== 409) console.error('Seed user error:', e.message);
    }
  }

  for (const pin of data.pins) {
    try {
      await databases.createDocument(DB_ID, PINS_COL, pin.id, pinToDoc(pin));
    } catch (e: any) {
      if (e.code !== 409) console.error('Seed pin error:', e.message);
    }
  }

  for (const board of data.boards) {
    try {
      await databases.createDocument(DB_ID, BOARDS_COL, board.id, boardToDoc(board));
    } catch (e: any) {
      if (e.code !== 409) console.error('Seed board error:', e.message);
    }
  }

  for (const notif of data.notifications) {
    try {
      await databases.createDocument(DB_ID, NOTIFICATIONS_COL, notif.id, notifToDoc(notif));
    } catch (e: any) {
      if (e.code !== 409) console.error('Seed notif error:', e.message);
    }
  }
}

// ==================== CONVERSATIONS ====================

function docToConversation(doc: any): Conversation {
  return {
    id: doc.$id,
    participantIds: jsonParse(doc.participantIdsJson),
    lastMessageText: doc.lastMessageText || '',
    lastMessageAt: doc.lastMessageAt || doc.createdAt,
    createdAt: doc.createdAt,
  };
}

function conversationToDoc(c: Conversation): Record<string, any> {
  return {
    participantIdsJson: JSON.stringify(c.participantIds),
    lastMessageText: c.lastMessageText,
    lastMessageAt: c.lastMessageAt,
    createdAt: c.createdAt,
  };
}

export async function getConversationsByUser(userId: string): Promise<Conversation[]> {
  // Appwrite doesn't support array-contains on JSON strings, so we fetch all and filter
  const docs = await listAll(CONVERSATIONS_COL, [Query.orderDesc('lastMessageAt')]);
  return docs
    .map(docToConversation)
    .filter(c => c.participantIds.includes(userId));
}

export async function getConversation(id: string): Promise<Conversation | null> {
  try {
    const doc = await databases.getDocument(DB_ID, CONVERSATIONS_COL, id);
    return docToConversation(doc);
  } catch { return null; }
}

export async function getConversationByParticipants(userA: string, userB: string): Promise<Conversation | null> {
  const docs = await listAll(CONVERSATIONS_COL);
  const found = docs
    .map(docToConversation)
    .find(c =>
      c.participantIds.includes(userA) && c.participantIds.includes(userB)
    );
  return found || null;
}

export async function createConversation(participantIds: string[]): Promise<Conversation> {
  const conv: Conversation = {
    id: '',
    participantIds,
    lastMessageText: '',
    lastMessageAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };
  const doc = await databases.createDocument(DB_ID, CONVERSATIONS_COL, ID.unique(), conversationToDoc(conv));
  return docToConversation(doc);
}

// ==================== MESSAGES ====================

function docToMessage(doc: any): Message {
  return {
    id: doc.$id,
    conversationId: doc.conversationId,
    senderId: doc.senderId,
    text: doc.text,
    createdAt: doc.createdAt,
  };
}

function messageToDoc(m: Message): Record<string, any> {
  return {
    conversationId: m.conversationId,
    senderId: m.senderId,
    text: m.text,
    createdAt: m.createdAt,
  };
}

export async function getMessages(conversationId: string, limit: number = 50): Promise<Message[]> {
  const { documents } = await databases.listDocuments(DB_ID, MESSAGES_COL, [
    Query.equal('conversationId', conversationId),
    Query.orderDesc('createdAt'),
    Query.limit(limit),
  ]);
  return documents.map(docToMessage).reverse(); // chronological order
}

export async function createMessage(conversationId: string, senderId: string, text: string): Promise<Message> {
  const now = new Date().toISOString();
  const msg: Message = {
    id: '',
    conversationId,
    senderId,
    text,
    createdAt: now,
  };
  const doc = await databases.createDocument(DB_ID, MESSAGES_COL, ID.unique(), messageToDoc(msg));

  // Update conversation's last message
  await databases.updateDocument(DB_ID, CONVERSATIONS_COL, conversationId, {
    lastMessageText: text.substring(0, 100),
    lastMessageAt: now,
  });

  return docToMessage(doc);
}

// ==================== CHAT STORAGE ====================

/**
 * Calculate total chat storage used by a user (bytes = sum of message text lengths).
 */
export async function getUserChatStorageBytes(userId: string): Promise<number> {
  const docs = await listAll(MESSAGES_COL, [Query.equal('senderId', userId)]);
  return docs.reduce((sum, doc) => sum + new TextEncoder().encode(doc.text || '').length, 0);
}

/**
 * Get the user's storage limit based on verification status.
 */
export function getChatStorageLimit(user: { isVerified: boolean }): number {
  return user.isVerified ? CHAT_STORAGE_LIMIT_VERIFIED : CHAT_STORAGE_LIMIT_STANDARD;
}

/**
 * Delete oldest messages (FIFO) for a user until storage is under the limit.
 */
export async function enforceStorageQuota(userId: string, limitBytes: number): Promise<void> {
  let usedBytes = await getUserChatStorageBytes(userId);
  if (usedBytes <= limitBytes) return;

  // Get all messages by this user, oldest first
  const docs = await listAll(MESSAGES_COL, [Query.equal('senderId', userId)]);
  const sorted = docs.sort((a, b) =>
    (a.createdAt || '').localeCompare(b.createdAt || '')
  );

  for (const doc of sorted) {
    if (usedBytes <= limitBytes) break;
    const msgSize = new TextEncoder().encode(doc.text || '').length;
    await databases.deleteDocument(DB_ID, MESSAGES_COL, doc.$id);
    usedBytes -= msgSize;
  }
}

// ==================== DELETION REQUESTS ====================

function docToDeletionRequest(doc: any): DeletionRequest {
  return {
    id: doc.$id,
    userId: doc.userId,
    reason: doc.reason || '',
    status: doc.status || 'pending',
    createdAt: doc.createdAt,
  };
}

export async function createDeletionRequest(userId: string, reason: string): Promise<DeletionRequest> {
  const doc = await databases.createDocument(DB_ID, DELETION_REQUESTS_COL, ID.unique(), {
    userId,
    reason,
    status: 'pending',
    createdAt: new Date().toISOString(),
  });
  return docToDeletionRequest(doc);
}

export async function getDeletionRequest(userId: string): Promise<DeletionRequest | null> {
  const { documents } = await databases.listDocuments(DB_ID, DELETION_REQUESTS_COL, [
    Query.equal('userId', userId),
    Query.equal('status', 'pending'),
    Query.limit(1),
  ]);
  return documents.length ? docToDeletionRequest(documents[0]) : null;
}
