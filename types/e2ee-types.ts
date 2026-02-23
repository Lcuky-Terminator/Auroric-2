/**
 * ============================================================================
 * E2EE & BLOCKING SYSTEM - TYPES & INTERFACES
 * Production-Grade Type Definitions
 * ============================================================================
 */

// ============================================================================
// MESSAGE TYPES
// ============================================================================

export interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  ciphertext: string; // Base64-encoded encrypted message
  iv: string; // Base64-encoded initialization vector
  created_at: string; // ISO 8601 timestamp
  updated_at: string; // ISO 8601 timestamp
}

export interface DecryptedMessage extends Message {
  plaintext: string; // Decrypted message content (client-side only)
  decryptedAt: number; // Unix timestamp when decrypted
}

export interface EncryptedPayload {
  ciphertext: string; // Base64-encoded
  iv: string; // Base64-encoded
  algorithm: 'RSA-OAEP' | 'AES-GCM';
  senderPublicKeyId?: string; // Optional: for key versioning
  timestamp: number; // Unix timestamp
}

// ============================================================================
// USER & PROFILE TYPES
// ============================================================================

export interface UserProfile {
  id: string;
  email: string;
  username: string;
  public_key: string; // JWK format, stored as JSON string
  avatar_url?: string;
  bio?: string;
  created_at: string;
  updated_at: string;
}

export interface UserEncryptionKeys {
  userId: string;
  publicKey: CryptoKey; // Browser's CryptoKey object
  publicKeyJWK: string; // Stored in Supabase
  privateKeyLocally: boolean; // Indicates private key is stored locally
}

// ============================================================================
// BLOCKING SYSTEM TYPES
// ============================================================================

export interface BlockedUser {
  id: string;
  blocker_id: string; // User who initiated the block
  blocked_id: string; // User who is blocked
  created_at: string;
}

export interface BlockingStatus {
  isBlockedByUser: boolean; // Current user is blocked by recipient
  hasBlockedUser: boolean; // Current user has blocked recipient
}

export interface BlockAction {
  action: 'block' | 'unblock';
  blocker_id: string;
  blocked_id: string;
  timestamp: number;
}

// ============================================================================
// CONVERSATION & CHAT TYPES
// ============================================================================

export interface Conversation {
  id: string; // Usually: min(user1_id, user2_id) + max(user1_id, user2_id)
  participant1_id: string;
  participant2_id: string;
  last_message_id?: string;
  last_message_at?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ConversationPreview {
  id: string;
  participantId: string; // The other participant
  participantUsername: string;
  participantAvatar?: string;
  lastMessage?: string; // Decrypted on client
  lastMessageAt?: string;
  unreadCount: number;
  isEncrypted: boolean;
  isBlocked: boolean;
}

export interface ChatSession {
  conversationId: string;
  recipientId: string;
  recipientPublicKey: CryptoKey;
  userPrivateKey: CryptoKey;
  startedAt: number;
  lastActivityAt: number;
}

// ============================================================================
// ENCRYPTION KEY TYPES
// ============================================================================

export interface KeyPair {
  publicKey: CryptoKey;
  privateKey: CryptoKey;
}

export interface StoredKeyPair {
  publicKey: JsonWebKey;
  privateKey: JsonWebKey;
}

export interface KeyRotation {
  userId: string;
  oldPublicKeyId: string;
  newPublicKeyId: string;
  rotatedAt: number;
  messagesStillEncryptedWithOldKey?: number;
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

export interface SendMessageRequest {
  recipientId: string;
  ciphertext: string; // Pre-encrypted on client
  iv: string;
  algorithm: 'RSA-OAEP' | 'AES-GCM';
}

export interface SendMessageResponse {
  success: boolean;
  messageId: string;
  createdAt: string;
  error?: string;
}

export interface FetchMessagesRequest {
  conversationId: string;
  limit?: number;
  offset?: number;
  beforeTimestamp?: string;
}

export interface FetchMessagesResponse {
  messages: Message[];
  hasMore: boolean;
  cursor?: string;
}

export interface InitializeEncryptionResponse {
  success: boolean;
  publicKey: string;
  requiresKeyRotation?: boolean;
  error?: string;
}

// ============================================================================
// ERROR TYPES
// ============================================================================

export class E2EEError extends Error {
  constructor(
    message: string,
    public code: string,
    public context?: Record<string, any>
  ) {
    super(message);
    this.name = 'E2EEError';
  }
}

export class EncryptionError extends E2EEError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 'ENCRYPTION_ERROR', context);
    this.name = 'EncryptionError';
  }
}

export class DecryptionError extends E2EEError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 'DECRYPTION_ERROR', context);
    this.name = 'DecryptionError';
  }
}

export class KeyManagementError extends E2EEError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 'KEY_MANAGEMENT_ERROR', context);
    this.name = 'KeyManagementError';
  }
}

export class BlockingError extends E2EEError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 'BLOCKING_ERROR', context);
    this.name = 'BlockingError';
  }
}

// ============================================================================
// LOGGING & AUDIT TYPES
// ============================================================================

export interface SecurityEvent {
  id: string;
  userId: string;
  eventType:
    | 'KEY_GENERATION'
    | 'KEY_EXPORT'
    | 'MESSAGE_ENCRYPT'
    | 'MESSAGE_DECRYPT'
    | 'USER_BLOCKED'
    | 'USER_UNBLOCKED'
    | 'DECRYPTION_FAILED'
    | 'KEY_ROTATION';
  severity: 'info' | 'warning' | 'error';
  details: Record<string, any>;
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
}

// ============================================================================
// CONFIGURATION TYPES
// ============================================================================

export interface E2EEConfig {
  algorithm: 'RSA-OAEP';
  keySize: 4096;
  hash: 'SHA-256';
  storageMethod: 'indexeddb' | 'localstorage'; // indexeddb preferred
  keyRotationIntervalDays?: number;
  enableAuditLogging?: boolean;
  defaultBlockBehavior: {
    hideProfile: boolean;
    preventMessaging: boolean;
    removeFromConversations: boolean;
  };
}

// ============================================================================
// STATE MANAGEMENT TYPES (for Redux/Zustand)
// ============================================================================

export interface CryptoState {
  initialized: boolean;
  publicKeyLoaded: boolean;
  privateKeyLoaded: boolean;
  currentUserPublicKey?: string;
  keyRotationNeeded: boolean;
  encryptionErrors: string[];
}

export interface BlockingState {
  blockedUsers: Set<string>;
  blockedByUsers: Set<string>;
  loading: boolean;
  lastUpdated?: number;
}

export interface MessagesState {
  conversations: Map<string, Message[]>;
  decryptedCache: Map<string, string>;
  isDecrypting: Set<string>;
  syncStatus: 'idle' | 'syncing' | 'error';
}

// ============================================================================
// VALIDATION TYPES
// ============================================================================

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface KeyValidationResult {
  publicKeyValid: boolean;
  privateKeyValid: boolean;
  keyPairMatches: boolean;
  errors: string[];
}

// ============================================================================
// DATABASE QUERY TYPES
// ============================================================================

export interface BlockStatusQuery {
  userId: string;
  targetUserId: string;
}

export interface ConversationQuery {
  userId1: string;
  userId2: string;
  includeMessages?: boolean;
  limit?: number;
}

export interface MessageQuery {
  conversationId: string;
  senderId?: string;
  recipientId?: string;
  beforeDate?: string;
  afterDate?: string;
  limit?: number;
  offset?: number;
}
