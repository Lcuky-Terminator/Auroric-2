/**
 * ============================================================================
 * QUICK REFERENCE: How to Use E2EE + Blocking System
 * ============================================================================
 */

// ===========================================================================
// 1. INITIALIZE ENCRYPTION ON USER LOGIN
// ===========================================================================

// In your login/registration handler:
import { useE2EEInitialization } from '@/hooks/useE2EEMessaging';

function LoginPage() {
  const { initialized, isInitializing, error } = useE2EEInitialization();

  if (isInitializing) return <p>Setting up encryption...</p>;
  if (error) return <p>Error: {error}</p>;
  if (initialized) return <p>✅ Encryption ready</p>;
}

// ===========================================================================
// 2. FETCH & DECRYPT MESSAGES
// ===========================================================================

import { useE2EEMessaging } from '@/hooks/useE2EEMessaging';

function MessagesComponent({ recipientId }) {
  const {
    messages,
    isLoading,
    error,
    sendMessage,
  } = useE2EEMessaging(recipientId);

  if (isLoading) return <p>Loading messages...</p>;

  return (
    <div>
      {messages.map((msg) => (
        <div key={msg.id}>
          {/* msg.decryptedText contains the plaintext (decrypted on client) */}
          <p>{msg.decryptedText}</p>
        </div>
      ))}
    </div>
  );
}

// ===========================================================================
// 3. SEND ENCRYPTED MESSAGE
// ===========================================================================

function SendMessageForm({ recipientId }) {
  const { sendMessage, isSending } = useE2EEMessaging(recipientId);
  const [text, setText] = useState('');

  const handleSend = async () => {
    const success = await sendMessage(text);
    if (success) {
      setText('');
      // Message encrypted and sent ✅
    }
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); handleSend(); }}>
      <input 
        value={text} 
        onChange={(e) => setText(e.target.value)}
        placeholder="Type encrypted message..."
      />
      <button disabled={isSending}>
        {isSending ? 'Encrypting...' : 'Send'}
      </button>
    </form>
  );
}

// ===========================================================================
// 4. CHECK & MANAGE BLOCKING
// ===========================================================================

import { useBlocking } from '@/hooks/useE2EEMessaging';

function UserActions({ targetUserId }) {
  const {
    isBlockedByUser,
    hasBlockedUser,
    blockUser,
    unblockUser,
  } = useBlocking(targetUserId);

  return (
    <div>
      {isBlockedByUser && (
        <p>⚠️ This user has blocked you</p>
      )}

      {hasBlockedUser ? (
        <button onClick={unblockUser}>Unblock User</button>
      ) : (
        <button onClick={blockUser}>Block User</button>
      )}
    </div>
  );
}

// ===========================================================================
// 5. COMPLETE CHAT COMPONENT
// ===========================================================================

import ChatWindow from '@/components/ChatWindow';

export default function ChatPage() {
  const router = useRouter();
  const { userId } = router.query;

  return (
    <div>
      <h1>Messages</h1>
      <ChatWindow
        recipientId={userId}
        recipientUsername="john_doe"
        onClose={() => router.back()}
      />
    </div>
  );
}

// ===========================================================================
// 6. MANUAL ENCRYPTION (Low-level)
// ===========================================================================

import {
  encryptMessage,
  decryptMessage,
  importPublicKeyFromJWK,
  getStoredPrivateKey,
} from '@/lib/cryptoUtils';

async function manualEncrypt() {
  // Fetch public key
  const { data: recipient } = await supabase
    .from('users')
    .select('public_key')
    .eq('id', recipientId)
    .single();

  // Import public key
  const publicKey = await importPublicKeyFromJWK(recipient.public_key);

  // Encrypt
  const encrypted = await encryptMessage('Hello World', publicKey);
  // Result: { ciphertext: "base64...", iv: "base64...", algorithm: "RSA-OAEP" }

  // Send ciphertext to server
  await supabase
    .from('messages')
    .insert({
      sender_id: userId,
      recipient_id: recipientId,
      ciphertext: encrypted.ciphertext,
      iv: encrypted.iv,
    });
}

async function manualDecrypt() {
  // Fetch encrypted message
  const { data: message } = await supabase
    .from('messages')
    .select('*')
    .eq('id', messageId)
    .single();

  // Get private key
  const privateKey = await getStoredPrivateKey();

  // Decrypt
  const decrypted = await decryptMessage(
    {
      ciphertext: message.ciphertext,
      iv: message.iv,
      algorithm: 'RSA-OAEP',
    },
    privateKey
  );

  console.log('Plaintext:', decrypted.text); // "Hello World"
}

// ===========================================================================
// 7. API CALLS REFERENCE
// ===========================================================================

// Check encryption status
async function checkEncryption() {
  const response = await fetch('/api/auth/initialize-encryption');
  const data = await response.json();
  console.log(data.initialized); // true/false
}

// Save public key (called after key generation)
async function savePublicKey(publicKeyJWK) {
  const response = await fetch('/api/auth/initialize-encryption/save-public-key', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ publicKey: publicKeyJWK }),
  });
  console.log(await response.json());
}

// Send message (encrypted on client first)
async function sendEncryptedMessage(recipientId, ciphertext, iv) {
  const response = await fetch('/api/messages/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      recipientId,
      ciphertext,
      iv,
      algorithm: 'RSA-OAEP',
    }),
  });
  return await response.json();
}

// Fetch messages
async function fetchMessages(recipientId) {
  const response = await fetch(`/api/messages/send?recipientId=${recipientId}&limit=50`);
  const data = await response.json();
  return data.messages; // Still encrypted, decrypt on client
}

// Check blocking status
async function checkBlockingStatus(userId) {
  const response = await fetch(`/api/blocking?userId=${userId}`);
  const data = await response.json();
  console.log('Blocked by user:', data.isBlockedByUser);
  console.log('Blocked user:', data.hasBlockedUser);
}

// Block user
async function blockUser(blockUserId) {
  const response = await fetch('/api/blocking', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ blockUserId }),
  });
  return await response.json();
}

// Unblock user
async function unblockUser(unblockUserId) {
  const response = await fetch(`/api/blocking?userId=${unblockUserId}`, {
    method: 'DELETE',
  });
  return await response.json();
}

// ===========================================================================
// 8. SECURITY CHECKLIST
// ===========================================================================

/*
✅ Before deploying to production:

ENCRYPTION:
[✓] RSA-4096 keys generated on client
[✓] Private key stored in IndexedDB (not sent to server)
[✓] Public key stored in Supabase users table
[✓] Messages encrypted before sending to server
[✓] Messages decrypted on client (server never sees plaintext)
[✓] HTTPS enabled on all endpoints

BLOCKING:
[✓] RLS policies enforced in Supabase
[✓] Blocked users cannot insert messages
[✓] Blocking checked on client AND server
[✓] Block relationships stored in blocked_users table

BEST PRACTICES:
[✓] Use HTTPS everywhere (never HTTP)
[✓] Implement CSP headers
[✓] Regular security audits
[✓] Monitor for suspicious patterns
[✓] User education on password security
[✓] Device management recommendations

TESTING:
[✓] Test E2EE with multiple browsers
[✓] Test blocking in all scenarios
[✓] Check IndexedDB storage
[✓] Verify ciphertext in Supabase
[✓] Test with slow networks
[✓] Test key rotation (if implemented)
*/

// ===========================================================================
// 9. ERROR HANDLING
// ===========================================================================

function withErrorHandling(Component) {
  return function ErrorBoundary(props) {
    const [error, setError] = useState(null);

    if (error) {
      return (
        <div>
          <p>⚠️ Error: {error}</p>
          <button onClick={() => setError(null)}>Retry</button>
        </div>
      );
    }

    return (
      <ErrorHandler onError={setError}>
        <Component {...props} />
      </ErrorHandler>
    );
  };
}

// Common errors and solutions:
const ERRORS = {
  'Private key not found': 'User encryption not initialized. Call initializeUserEncryption()',
  'Failed to decrypt message': 'Private key invalid or message corrupted. Regenerate keys.',
  'Cannot message users who blocked you': 'RLS policy working correctly. User blocked you.',
  'User has blocked you': 'Blocking is enforced. Prevent message sending on UI.',
  'Invalid ciphertext format': 'Ensure message encrypted with RSA-OAEP before sending.',
  'IndexedDB permission denied': 'User in incognito mode. Falls back to localStorage.',
};

// ===========================================================================
// 10. MONITORING & LOGGING
// ===========================================================================

function logSecurityEvent(eventType, details) {
  console.log(`[SECURITY] ${eventType}:`, details);

  // In production, send to your logging service:
  // sendToLoggingService({
  //   timestamp: new Date().toISOString(),
  //   eventType,
  //   details,
  //   userId: currentUser.id,
  // });
}

// Usage:
// logSecurityEvent('MESSAGE_ENCRYPTED', { messageId, recipientId });
// logSecurityEvent('USER_BLOCKED', { blockedUserId });
// logSecurityEvent('DECRYPTION_FAILED', { messageId });

// ===========================================================================
// SUMMARY
// ===========================================================================

/*
COMPONENT HIERARCHY:

App
├── LoginPage
│   └── useE2EEInitialization() → Initialize keys
│
├── ChatPage
│   └── ChatWindow.tsx
│       ├── useE2EEMessaging() → Send/receive encrypted messages
│       ├── useBlocking() → Check/manage blocks
│       └── Real-time sync with Supabase
│
├── UserProfilePage
│   └── useBlocking(userId) → Show block status & actions
│
└── SettingsPage
    └── Encryption key management

KEY FILES:
- lib/cryptoUtils.ts → Low-level crypto operations
- hooks/useE2EEMessaging.ts → React hooks for messaging
- components/ChatWindow.tsx → Complete UI component
- app/api/messages/send/route.ts → Message API
- app/api/blocking/route.ts → Blocking API
- migrations/001_messaging_e2ee_blocking_schema.sql → Database schema

FLOW:
User A sends message → Client encrypts with B's public key →
Server stores ciphertext → Real-time to B's browser →
B's browser decrypts with B's private key → B sees plaintext

BLOCKING:
User A blocks B → RLS policy active → B tries to send →
Server checks RLS → Policy fails → B sees error
*/
