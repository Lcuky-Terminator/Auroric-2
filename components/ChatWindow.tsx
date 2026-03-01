'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase-client';
import {
  encryptMessage,
  decryptMessage,
  getStoredPrivateKey,
  importPublicKeyFromJWK,
  initializeUserEncryption,
} from '@/lib/cryptoUtils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useApp } from '@/lib/app-context';

// ============================================================================
// TYPES
// ============================================================================

interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  ciphertext: string;
  iv: string;
  created_at: string;
  decrypted_text?: string; // Populated after decryption
  isEncrypting?: boolean;
}

interface BlockedUser {
  id: string;
  blocker_id: string;
  blocked_id: string;
  created_at: string;
}

interface ChatWindowProps {
  recipientId: string;
  recipientUsername?: string;
  onClose?: () => void;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function ChatWindow({ recipientId, recipientUsername, onClose }: ChatWindowProps) {
  const { currentUser } = useApp();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isBlocked, setIsBlocked] = useState(false);
  const [hasBlocked, setHasBlocked] = useState(false);
  const [recipientNotFound, setRecipientNotFound] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const decryptedCache = useRef<Map<string, string>>(new Map());

  const userId = currentUser?.id;

  // ========================================================================
  // INITIALIZATION & KEY SETUP
  // ========================================================================

  /**
   * Initialize encryption keys on mount if needed
   */
  useEffect(() => {
    const initializeEncryption = async () => {
      try {
        if (!userId) return;

        const { publicKeyJWK, keyPairGenerated } = await initializeUserEncryption();

        if (keyPairGenerated && publicKeyJWK) {
          // Save public key to user's profile in Supabase
          const { error: updateError } = await supabase
            .from('users')
            .update({ public_key: publicKeyJWK })
            .eq('id', userId);

          if (updateError) {
            console.error('Failed to save public key:', updateError);
            setError('Failed to initialize encryption. Please refresh and try again.');
          } else {
            console.log('Public key saved to profile');
          }
        }
      } catch (err) {
        console.error('Encryption initialization error:', err);
        setError('Failed to initialize encryption system');
      }
    };

    initializeEncryption();
  }, [userId]);

  // ========================================================================
  // CHECK BLOCKING STATUS
  // ========================================================================

  /**
   * Check if current user has blocked the recipient or vice versa
   */
  const checkBlockingStatus = useCallback(async () => {
    try {
      if (!userId) return;

      // Check if we have blocked them
      const { data: hasBlockedData, error: hasBlockedError } = await supabase
        .from('blocked_users')
        .select('id')
        .eq('blocker_id', userId)
        .eq('blocked_id', recipientId)
        .single();

      if (!hasBlockedError && hasBlockedData) {
        setHasBlocked(true);
      }

      // Check if they have blocked us
      const { data: isBlockedData, error: isBlockedError } = await supabase
        .from('blocked_users')
        .select('id')
        .eq('blocker_id', recipientId)
        .eq('blocked_id', userId)
        .single();

      if (!isBlockedError && isBlockedData) {
        setIsBlocked(true);
      }
    } catch (err) {
      console.error('Error checking block status:', err);
    }
  }, [userId, recipientId]);

  // ========================================================================
  // FETCH MESSAGES
  // ========================================================================

  /**
   * Fetch all messages in the conversation with the recipient
   * Messages are encrypted on the server, we decrypt them client-side
   */
  const fetchMessages = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!userId) {
        throw new Error('User not authenticated');
      }

      // Verify recipient exists and is not blocked by us
      const { data: recipientData, error: recipientError } = await supabase
        .from('users')
        .select('id, username, public_key')
        .eq('id', recipientId)
        .single();

      if (recipientError || !recipientData) {
        setRecipientNotFound(true);
        setError('User not found');
        setIsLoading(false);
        return;
      }

      if (!recipientData.public_key) {
        setError('Recipient has not set up encryption keys yet');
        setIsLoading(false);
        return;
      }

      // Fetch messages from Supabase (all messages are encrypted)
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .or(
          `and(sender_id.eq.${userId},recipient_id.eq.${recipientId}),and(sender_id.eq.${recipientId},recipient_id.eq.${userId})`
        )
        .order('created_at', { ascending: true });

      if (messagesError) {
        throw new Error(`Failed to fetch messages: ${messagesError.message}`);
      }

      // Decrypt messages on the client side
      const decryptedMessages: Message[] = [];
      const privateKey = await getStoredPrivateKey();

      if (!privateKey) {
        throw new Error('Private key not found. Encryption not initialized.');
      }

      for (const msg of messagesData || []) {
        try {
          // Check cache first
          const cacheKey = msg.id;
          let decryptedText = decryptedCache.current.get(cacheKey);

          if (!decryptedText) {
            // Only decrypt messages sent TO the current user
            if (msg.recipient_id === userId) {
              const decrypted = await decryptMessage(
                {
                  ciphertext: msg.ciphertext,
                  iv: msg.iv,
                  algorithm: 'RSA-OAEP',
                },
                privateKey
              );
              decryptedText = decrypted.text;
              decryptedCache.current.set(cacheKey, decryptedText);
            } else {
              // Messages sent by us are not encrypted (we already saw the plaintext)
              // But on server, they are stored encrypted. For this component,
              // we'd need to handle this. Alternative: only decrypt received messages.
              // For production, you might store the plaintext in a separate field.
              decryptedText = '[Encrypted message - sent by you]';
            }
          }

          decryptedMessages.push({
            ...msg,
            decrypted_text: decryptedText,
          });
        } catch (decryptErr) {
          console.error('Failed to decrypt message:', decryptErr);
          decryptedMessages.push({
            ...msg,
            decrypted_text: '[Failed to decrypt message]',
          });
        }
      }

      setMessages(decryptedMessages);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to load messages';
      setError(errorMsg);
      console.error('Error fetching messages:', err);
    } finally {
      setIsLoading(false);
    }
  }, [userId, recipientId]);

  // =========================================================================
  // SEND MESSAGE (WITH ENCRYPTION)
  // =========================================================================

  /**
   * Send a message to the recipient
   * Steps:
   * 1. Fetch recipient's public key
   * 2. Encrypt the message locally with recipient's public key
   * 3. Send the encrypted ciphertext to Supabase
   * 4. RLS policies prevent sending if recipient has blocked us
   */
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (!newMessage.trim()) {
        return;
      }

      if (!userId) {
        toast({
          title: 'Error',
          description: 'You must be logged in to send messages',
          variant: 'destructive',
        });
        return;
      }

      if (isBlocked) {
        toast({
          title: 'Error',
          description: 'This user has blocked you. You cannot send messages.',
          variant: 'destructive',
        });
        return;
      }

      if (hasBlocked) {
        toast({
          title: 'Error',
          description: 'You have blocked this user. Unblock them to send messages.',
          variant: 'destructive',
        });
        return;
      }

      setIsSending(true);

      // Step 1: Fetch recipient's public key from Supabase
      const { data: recipientData, error: recipientError } = await supabase
        .from('users')
        .select('public_key')
        .eq('id', recipientId)
        .single();

      if (recipientError || !recipientData?.public_key) {
        throw new Error('Could not find recipient\'s encryption key');
      }

      // Step 2: Import the recipient's public key
      let recipientPublicKey;
      try {
        recipientPublicKey = await importPublicKeyFromJWK(recipientData.public_key);
      } catch (keyErr) {
        throw new Error('Invalid recipient encryption key format');
      }

      // Step 3: Encrypt the message locally (NEVER sent plaintext to server)
      const encrypted = await encryptMessage(newMessage, recipientPublicKey);

      // Create optimistic UI message
      const optimisticMessage: Message = {
        id: `temp-${Date.now()}`,
        sender_id: userId,
        recipient_id: recipientId,
        ciphertext: encrypted.ciphertext,
        iv: encrypted.iv,
        created_at: new Date().toISOString(),
        decrypted_text: newMessage,
        isEncrypting: true,
      };

      setMessages([...messages, optimisticMessage]);

      // Step 4: Send the ENCRYPTED ciphertext to Supabase
      const { data: insertedMessage, error: insertError } = await supabase
        .from('messages')
        .insert({
          sender_id: userId,
          recipient_id: recipientId,
          ciphertext: encrypted.ciphertext,
          iv: encrypted.iv,
        })
        .select()
        .single();

      if (insertError) {
        // Check for specific RLS error (blocked user)
        if (insertError.message.includes('blocked')) {
          throw new Error('Cannot send message: User has blocked you or you have blocked them');
        }
        throw new Error(`Failed to send message: ${insertError.message}`);
      }

      // Update optimistic message with real data
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === optimisticMessage.id
            ? {
              ...msg,
              id: insertedMessage.id,
              created_at: insertedMessage.created_at,
              isEncrypting: false,
            }
            : msg
        )
      );

      setNewMessage('');
      toast({
        title: 'Success',
        description: 'Message sent (end-to-end encrypted)',
      });

      // Scroll to latest message
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to send message';
      toast({
        title: 'Error',
        description: errorMsg,
        variant: 'destructive',
      });
      console.error('Error sending message:', err);

      // Remove optimistic message on error
      setMessages((prev) => prev.filter((msg) => !msg.id.startsWith('temp-')));
    } finally {
      setIsSending(false);
    }
  };

  // ========================================================================
  // BLOCK/UNBLOCK USER
  // ========================================================================

  const handleBlockUser = async () => {
    try {
      if (!userId) return;

      const { error } = await supabase
        .from('blocked_users')
        .insert({
          blocker_id: userId,
          blocked_id: recipientId,
        });

      if (error) {
        if (error.message.includes('unique')) {
          toast({
            title: 'Error',
            description: 'User already blocked',
            variant: 'destructive',
          });
        } else {
          throw error;
        }
      } else {
        setHasBlocked(true);
        toast({
          title: 'Success',
          description: 'User blocked',
        });
      }
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to block user',
        variant: 'destructive',
      });
      console.error('Error blocking user:', err);
    }
  };

  const handleUnblockUser = async () => {
    try {
      if (!userId) return;

      const { error } = await supabase
        .from('blocked_users')
        .delete()
        .eq('blocker_id', userId)
        .eq('blocked_id', recipientId);

      if (error) throw error;

      setHasBlocked(false);
      toast({
        title: 'Success',
        description: 'User unblocked',
      });
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to unblock user',
        variant: 'destructive',
      });
      console.error('Error unblocking user:', err);
    }
  };

  // ========================================================================
  // EFFECTS
  // ========================================================================

  useEffect(() => {
    checkBlockingStatus();
  }, [recipientId, userId, checkBlockingStatus]);

  useEffect(() => {
    fetchMessages();

    // Set up real-time subscription using subscribe()
    const subscription = supabase
      .channel(`messages:${userId}:${recipientId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `or(and(sender_id=eq.${userId},recipient_id=eq.${recipientId}),and(sender_id=eq.${recipientId},recipient_id=eq.${userId}))`,
        },
        async (payload: any) => {
          if (payload.eventType === 'INSERT') {
            const newMsg = payload.new as Message;

            // Only decrypt if we're the recipient
            if (newMsg.recipient_id === userId) {
              try {
                const privateKey = await getStoredPrivateKey();
                if (privateKey) {
                  const decrypted = await decryptMessage(
                    {
                      ciphertext: newMsg.ciphertext,
                      iv: newMsg.iv,
                      algorithm: 'RSA-OAEP',
                    },
                    privateKey
                  );
                  newMsg.decrypted_text = decrypted.text;
                  decryptedCache.current.set(newMsg.id, decrypted.text);
                }
              } catch (err) {
                console.error('Failed to decrypt new message:', err);
                newMsg.decrypted_text = '[Failed to decrypt]';
              }
            }

            setMessages((prev) => [...prev, newMsg]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [userId, recipientId, fetchMessages]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ========================================================================
  // RENDER
  // ========================================================================

  if (recipientNotFound) {
    return (
      <Card className="p-6 text-center">
        <p className="text-red-600 font-semibold">User Not Found</p>
        <p className="text-gray-600 mt-2">This user does not exist or has deleted their account.</p>
        <Button onClick={onClose} className="mt-4">
          Go Back
        </Button>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col h-[600px] bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="border-b px-4 py-3 flex justify-between items-center bg-gradient-to-r from-blue-50 to-indigo-50">
        <div>
          <h2 className="font-bold text-lg">{recipientUsername || 'Chat'}</h2>
          <p className="text-xs text-gray-500">🔒 End-to-end encrypted</p>
        </div>
        <div className="flex gap-2">
          {!isBlocked && !hasBlocked && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleBlockUser}
              className="text-red-600 hover:bg-red-50"
            >
              Block
            </Button>
          )}
          {hasBlocked && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleUnblockUser}
              className="text-green-600 hover:bg-green-50"
            >
              Unblock
            </Button>
          )}
          {onClose && (
            <Button size="sm" variant="ghost" onClick={onClose}>
              ✕
            </Button>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Blocked Status */}
      {isBlocked && (
        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 text-yellow-700 text-sm">
          ⚠️ This user has blocked you. You cannot send messages.
        </div>
      )}

      {hasBlocked && (
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 text-blue-700 text-sm">
          ℹ️ You have blocked this user. Unblock them to send messages.
        </div>
      )}

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <p className="text-gray-500">Loading messages...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex justify-center items-center h-full">
            <p className="text-gray-500">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.sender_id === userId ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs px-4 py-2 rounded-lg ${msg.sender_id === userId
                    ? 'bg-blue-500 text-white rounded-br-none'
                    : 'bg-white border border-gray-200 text-gray-900 rounded-bl-none'
                  }`}
              >
                <p className="break-words text-sm">{msg.decrypted_text || msg.ciphertext}</p>
                <p
                  className={`text-xs mt-1 ${msg.sender_id === userId ? 'text-blue-100' : 'text-gray-500'
                    }`}
                >
                  {new Date(msg.created_at).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                  {msg.isEncrypting && ' (encrypting...)'}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <form onSubmit={handleSendMessage} className="border-t p-4 bg-white">
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder={
              isBlocked || hasBlocked
                ? 'Cannot send messages'
                : 'Type a message... (encrypted end-to-end)'
            }
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            disabled={isSending || isBlocked || hasBlocked}
            className="flex-1"
          />
          <Button
            type="submit"
            disabled={isSending || !newMessage.trim() || isBlocked || hasBlocked}
            className="px-6"
          >
            {isSending ? 'Sending...' : 'Send'}
          </Button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          💡 Messages are encrypted on your device before transmission. Only the recipient can
          decrypt them.
        </p>
      </form>
    </Card>
  );
}
