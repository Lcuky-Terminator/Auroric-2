/**
 * ============================================================================
 * Custom Hook: useE2EEMigration & useMessaging
 * ============================================================================
 */

import { useEffect, useCallback, useState } from 'react';
import { useApp } from '@/lib/app-context';
import { supabase } from '@/lib/supabase-client';
import {
  initializeUserEncryption,
  getStoredPrivateKey,
  importPublicKeyFromJWK,
  encryptMessage,
  decryptMessage,
  hasStoredPrivateKey,
  type EncryptedMessage,
} from '@/lib/cryptoUtils';

// ============================================================================
// HOOK: useE2EEInitialization
// Ensures user's encryption keys are set up
// ============================================================================

export function useE2EEInitialization() {
  const { currentUser } = useApp();
  const [initialized, setInitialized] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeEncryption = async () => {
      try {
        setIsInitializing(true);

        if (!currentUser?.id) {
          setIsInitializing(false);
          return;
        }

        const hasKeys = await hasStoredPrivateKey();

        if (hasKeys) {
          setInitialized(true);
          setIsInitializing(false);
          return;
        }

        // Generate new keys
        const { publicKeyJWK, keyPairGenerated } = await initializeUserEncryption();

        if (keyPairGenerated && publicKeyJWK) {
          // Save public key to Supabase
          const { error: updateError } = await supabase
            .from('users')
            .update({ public_key: publicKeyJWK })
            .eq('id', currentUser.id);

          if (updateError) {
            throw new Error('Failed to save encryption keys');
          }

          setInitialized(true);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Encryption initialization failed';
        setError(errorMessage);
        console.error('E2EE initialization error:', err);
      } finally {
        setIsInitializing(false);
      }
    };

    initializeEncryption();
  }, [currentUser?.id]);

  return { initialized, isInitializing, error };
}

// ============================================================================
// HOOK: useMessageEncryption
// Encrypt a message before sending
// ============================================================================

export function useMessageEncryption() {
  const [isEncrypting, setIsEncrypting] = useState(false);
  const [encryptError, setEncryptError] = useState<string | null>(null);

  const encryptForRecipient = useCallback(
    async (messageText: string, recipientId: string): Promise<EncryptedMessage | null> => {
      try {
        setIsEncrypting(true);
        setEncryptError(null);

        // Fetch recipient's public key
        const { data: recipientData, error: recipientError } = await supabase
          .from('users')
          .select('public_key')
          .eq('id', recipientId)
          .single();

        if (recipientError || !recipientData?.public_key) {
          throw new Error('Could not find recipient encryption key');
        }

        // Import public key
        const publicKey = await importPublicKeyFromJWK(recipientData.public_key);

        // Encrypt message
        const encrypted = await encryptMessage(messageText, publicKey);

        setIsEncrypting(false);
        return encrypted;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Encryption failed';
        setEncryptError(errorMessage);
        setIsEncrypting(false);
        return null;
      }
    },
    []
  );

  return { encryptForRecipient, isEncrypting, encryptError };
}

// ============================================================================
// HOOK: useMessageDecryption
// Decrypt received messages
// ============================================================================

export function useMessageDecryption() {
  const [decryptCache, setDecryptCache] = useState<Map<string, string>>(new Map());
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [decryptError, setDecryptError] = useState<string | null>(null);

  const decryptMessage_ = useCallback(
    async (messageId: string, encrypted: EncryptedMessage): Promise<string | null> => {
      try {
        // Check cache first
        if (decryptCache.has(messageId)) {
          return decryptCache.get(messageId) || null;
        }

        setIsDecrypting(true);
        setDecryptError(null);

        // Get private key
        const privateKey = await getStoredPrivateKey();

        if (!privateKey) {
          throw new Error('Private key not available for decryption');
        }

        // Decrypt
        const result = await decryptMessage(encrypted, privateKey);

        // Cache result
        setDecryptCache((prev) => new Map(prev).set(messageId, result.text));

        setIsDecrypting(false);
        return result.text;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Decryption failed';
        setDecryptError(errorMessage);
        setIsDecrypting(false);
        return null;
      }
    },
    [decryptCache]
  );

  return { decryptMessage_, isDecrypting, decryptError, decryptCache };
}

// ============================================================================
// HOOK: useBlocking
// Check and manage blocking relationships
// ============================================================================

export interface BlockingStatus {
  isBlockedByUser: boolean;
  hasBlockedUser: boolean;
  isLoading: boolean;
  error: string | null;
}

export function useBlocking(targetUserId?: string) {
  const { currentUser } = useApp();
  const [status, setStatus] = useState<BlockingStatus>({
    isBlockedByUser: false,
    hasBlockedUser: false,
    isLoading: true,
    error: null,
  });

  const checkBlockingStatus = useCallback(async () => {
    if (!currentUser?.id || !targetUserId) return;

    try {
      const response = await fetch(`/api/blocking?userId=${targetUserId}`);

      if (!response.ok) {
        throw new Error('Failed to check blocking status');
      }

      const data = await response.json();
      setStatus({
        isBlockedByUser: data.isBlockedByUser,
        hasBlockedUser: data.hasBlockedUser,
        isLoading: false,
        error: null,
      });
    } catch (err) {
      setStatus({
        isBlockedByUser: false,
        hasBlockedUser: false,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Error checking status',
      });
    }
  }, [currentUser?.id, targetUserId]);

  useEffect(() => {
    checkBlockingStatus();
  }, [checkBlockingStatus]);

  const blockUser = useCallback(async () => {
    if (!targetUserId) return;

    try {
      const response = await fetch('/api/blocking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blockUserId: targetUserId }),
      });

      if (!response.ok) {
        throw new Error('Failed to block user');
      }

      setStatus((prev) => ({ ...prev, hasBlockedUser: true }));
      return true;
    } catch (err) {
      setStatus((prev) => ({
        ...prev,
        error: err instanceof Error ? err.message : 'Failed to block user',
      }));
      return false;
    }
  }, [targetUserId]);

  const unblockUser = useCallback(async () => {
    if (!targetUserId) return;

    try {
      const response = await fetch(`/api/blocking?userId=${targetUserId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to unblock user');
      }

      setStatus((prev) => ({ ...prev, hasBlockedUser: false }));
      return true;
    } catch (err) {
      setStatus((prev) => ({
        ...prev,
        error: err instanceof Error ? err.message : 'Failed to unblock user',
      }));
      return false;
    }
  }, [targetUserId]);

  return { ...status, blockUser, unblockUser, checkBlockingStatus };
}

// ============================================================================
// HOOK: useE2EEMessaging (Complete messaging hook)
// ============================================================================

export interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  ciphertext: string;
  iv: string;
  created_at: string;
  decryptedText?: string;
}

export function useE2EEMessaging(recipientId: string) {
  const { currentUser } = useApp();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { encryptForRecipient } = useMessageEncryption();
  const { decryptMessage_, decryptCache } = useMessageDecryption();
  const { isBlockedByUser, hasBlockedUser } = useBlocking(recipientId);

  const fetchMessages = useCallback(async () => {
    try {
      setIsLoading(true);

      const response = await fetch(`/api/messages/send?recipientId=${recipientId}&limit=50`);

      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }

      const data = await response.json();

      // Decrypt all messages
      const decryptedMessages: Message[] = [];
      for (const msg of data.messages || []) {
        let decryptedText = msg.decryptedText;

        if (!decryptedText && msg.recipient_id === currentUser?.id) {
          decryptedText = await decryptMessage_(msg.id, {
            ciphertext: msg.ciphertext,
            iv: msg.iv,
            algorithm: 'RSA-OAEP',
          });
        }

        decryptedMessages.push({
          ...msg,
          decryptedText: decryptedText || '[Encrypted]',
        });
      }

      setMessages(decryptedMessages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load messages');
    } finally {
      setIsLoading(false);
    }
  }, [recipientId, currentUser?.id, decryptMessage_]);

  const sendMessage = useCallback(
    async (text: string): Promise<boolean> => {
      try {
        setIsSending(true);

        if (isBlockedByUser) {
          throw new Error('Cannot send message: User has blocked you');
        }

        if (hasBlockedUser) {
          throw new Error('Cannot send message: You have blocked this user');
        }

        // Encrypt message
        const encrypted = await encryptForRecipient(text, recipientId);

        if (!encrypted) {
          throw new Error('Encryption failed');
        }

        // Send to server
        const response = await fetch('/api/messages/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            recipientId,
            ciphertext: encrypted.ciphertext,
            iv: encrypted.iv,
            algorithm: encrypted.algorithm,
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to send message');
        }

        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to send message');
        return false;
      } finally {
        setIsSending(false);
      }
    },
    [recipientId, isBlockedByUser, hasBlockedUser, encryptForRecipient]
  );

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  return {
    messages,
    isLoading,
    isSending,
    error,
    sendMessage,
    fetchMessages,
  };
}
