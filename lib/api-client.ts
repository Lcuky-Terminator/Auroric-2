import type { User, Pin, Board, Notification, Comment, PaginatedResult, Conversation, Message } from './types';

const BASE = '';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${url}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({ error: 'Request failed' }));
    const msg = errorBody.error || `Request failed: ${res.status}`;
    // Don't throw on 404 for mutation endpoints (pin/board may already be deleted)
    if (res.status === 404 && options?.method && options.method !== 'GET') {
      console.warn(`[API] ${options.method} ${url}: ${msg}`);
      return errorBody as T;
    }
    throw new Error(msg);
  }
  return res.json();
}

export const api = {
  // ============ AUTH ============
  login: (username: string, password: string) =>
    fetchJson<{ user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  signup: (username: string, displayName: string, email: string, password: string) =>
    fetchJson<{ user: User }>('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ username, displayName, email, password }),
    }),

  logout: () => fetchJson<{ ok: boolean }>('/api/auth/logout', { method: 'POST' }),

  me: () => fetchJson<{ user: User | null }>('/api/auth/me'),

  googleBridge: () =>
    fetchJson<{ user: User; isNewUser: boolean }>('/api/auth/google-bridge', {
      method: 'POST',
    }),

  /** Check if the current user's email is verified */
  checkVerification: () =>
    fetchJson<{ verified: boolean }>('/api/auth/verify'),

  /** Send a password reset email */
  forgotPassword: (email: string) =>
    fetchJson<{ ok: boolean; message: string }>('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  /** Reset password with a recovery token */
  resetPassword: (userId: string, secret: string, password: string) =>
    fetchJson<{ ok: boolean; message: string }>('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ userId, secret, password }),
    }),

  /** Change password (rate-limited: max 3 times, then 3-day lockout) */
  changePassword: (currentPassword: string, newPassword: string) =>
    fetchJson<{ ok?: boolean; error?: string; message?: string; attemptsRemaining?: number; lockedUntil?: string }>(
      '/api/auth/change-password',
      {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword }),
      }
    ),

  // ============ PINS ============
  getPins: () => fetchJson<Pin[]>('/api/pins'),

  getPinsPaginated: (page: number, limit: number, category?: string) => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (category && category !== 'All') params.set('category', category);
    return fetchJson<PaginatedResult<Pin>>(`/api/pins?${params}`);
  },

  getPin: (id: string) => fetchJson<Pin>(`/api/pins/${id}`),

  getTrendingPins: (limit = 30, category?: string) => {
    const params = new URLSearchParams({ limit: String(limit) });
    if (category && category !== 'All') params.set('category', category);
    return fetchJson<Pin[]>(`/api/pins/trending?${params}`);
  },

  getPopularPins: (sortBy: 'views' | 'likes' | 'comments' = 'views', limit = 20, category?: string) => {
    const params = new URLSearchParams({ sortBy, limit: String(limit) });
    if (category && category !== 'All') params.set('category', category);
    return fetchJson<Pin[]>(`/api/pins/popular?${params}`);
  },

  createPin: (data: Omit<Pin, 'id' | 'createdAt' | 'updatedAt' | 'likes' | 'saves' | 'comments'>) =>
    fetchJson<Pin>('/api/pins', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  deletePin: (id: string) => fetchJson<{ ok: boolean }>(`/api/pins/${id}`, { method: 'DELETE' }),

  toggleLike: (pinId: string) =>
    fetchJson<{ liked: boolean }>(`/api/pins/${pinId}/like`, { method: 'POST' }),

  toggleSave: (pinId: string) =>
    fetchJson<{ saved: boolean }>(`/api/pins/${pinId}/save`, { method: 'POST' }),

  savePinToBoard: (pinId: string, boardId: string) =>
    fetchJson<{ ok: boolean }>(`/api/pins/${pinId}/save-to-board`, {
      method: 'POST',
      body: JSON.stringify({ boardId }),
    }),

  addComment: (pinId: string, text: string) =>
    fetchJson<Comment>(`/api/pins/${pinId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ text }),
    }),

  toggleCommentLike: (pinId: string, commentId: string) =>
    fetchJson<{ liked: boolean }>(`/api/pins/${pinId}/comments/${commentId}/like`, {
      method: 'POST',
    }),

  deleteComment: (pinId: string, commentId: string) =>
    fetchJson<{ ok: boolean }>(`/api/pins/${pinId}/comments/${commentId}`, {
      method: 'DELETE',
    }),

  // ============ BOARDS ============
  getBoards: () => fetchJson<Board[]>('/api/boards'),

  getBoard: (id: string) => fetchJson<Board>(`/api/boards/${id}`),

  createBoard: (data: Omit<Board, 'id' | 'createdAt' | 'updatedAt' | 'pins' | 'followers' | 'collaborators'>) =>
    fetchJson<Board>('/api/boards', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateBoard: (id: string, data: Partial<Board>) =>
    fetchJson<Board>(`/api/boards/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteBoard: (id: string) =>
    fetchJson<{ ok: boolean }>(`/api/boards/${id}`, { method: 'DELETE' }),

  toggleFollowBoard: (boardId: string) =>
    fetchJson<{ following: boolean }>(`/api/boards/${boardId}/follow`, { method: 'POST' }),

  // ============ USERS ============
  getUsers: () => fetchJson<User[]>('/api/users'),

  getUser: (id: string) => fetchJson<User>(`/api/users/${id}`),

  getUserByUsername: (username: string) => fetchJson<User>(`/api/users/by-username/${encodeURIComponent(username)}`),

  updateUser: (id: string, updates: Partial<User>) =>
    fetchJson<User>(`/api/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),

  blockUser: (id: string) => fetchJson<{ blocked: boolean }>(`/api/users/${id}/block`, { method: 'POST' }),

  getBlockStatus: (id: string) => fetchJson<{ blocked: boolean }>(`/api/users/${id}/block`),

  toggleFollow: (userId: string) =>
    fetchJson<{ following: boolean }>(`/api/users/${userId}/follow`, { method: 'POST' }),

  getUserPins: (userId: string) => fetchJson<Pin[]>(`/api/users/${userId}/pins`),

  getUserSavedPins: (userId: string) => fetchJson<Pin[]>(`/api/users/${userId}/pins?type=saved`),

  getUserBoards: (userId: string) => fetchJson<Board[]>(`/api/users/${userId}/boards`),

  // ============ SEARCH ============
  search: (query: string) =>
    fetchJson<{ pins: Pin[]; users: User[]; boards: Board[] }>(
      `/api/search?q=${encodeURIComponent(query)}`
    ),

  // ============ NOTIFICATIONS ============
  getNotifications: () => fetchJson<Notification[]>('/api/notifications'),

  markRead: (id: string) =>
    fetchJson<{ ok: boolean }>('/api/notifications/read', {
      method: 'POST',
      body: JSON.stringify({ id }),
    }),

  markAllRead: () =>
    fetchJson<{ ok: boolean }>('/api/notifications/read', {
      method: 'POST',
      body: JSON.stringify({ all: true }),
    }),

  // ============ MESSAGES & DM ============
  getConversations: () => fetchJson<Conversation[]>('/api/messages'),

  sendMessage: (recipientId: string, text: string) =>
    fetchJson<{ message: Message; conversationId: string }>('/api/messages', {
      method: 'POST',
      body: JSON.stringify({ recipientId, text }),
    }),

  getMessages: (conversationId: string) =>
    fetchJson<Message[]>(`/api/messages/${conversationId}`),

  getChatStorage: () =>
    fetchJson<{ usedBytes: number; limitBytes: number; percentage: number; isVerified: boolean }>(
      '/api/messages/storage'
    ),

  // ============ ACCOUNT ============
  requestAccountDeletion: (reason: string) =>
    fetchJson<{ ok: boolean; message: string; requestId: string }>('/api/account/delete', {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),

  // ============ UPLOAD ============
  uploadFile: async (file: File): Promise<{ url: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('/api/upload', { method: 'POST', body: formData });
    if (!res.ok) throw new Error('Upload failed');
    return res.json();
  },

  // ============ SEED ============
  seed: () => fetchJson<{ seeded: boolean }>('/api/seed', { method: 'POST' }),
};

