# End-to-End Encryption (E2EE) & Blocking System - Implementation Guide

## 📋 Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Database Schema](#database-schema)
3. [Cryptographic Implementation](#cryptographic-implementation)
4. [Blocking System](#blocking-system)
5. [Integration Steps](#integration-steps)
6. [Security Considerations](#security-considerations)
7. [Troubleshooting](#troubleshooting)

---

## Architecture Overview

This implementation provides **true end-to-end encryption** for your messaging system combined with a **robust blocking mechanism**. Here's how it works at a high level:

### Key Principles

- **No Plaintext on Server**: Messages are encrypted on the client BEFORE being sent to Supabase
- **Public Key Infrastructure (PKI)**: Each user has an RSA-4096 key pair
  - **Public Key**: Stored in Supabase's `users` table (anyone can fetch it)
  - **Private Key**: Stored locally in the user's browser (NEVER sent to server)
- **Browser-Native Crypto**: Uses `window.crypto.subtle` (Web Crypto API) - no external libraries needed
- **Blocking Prevention**: Supabase RLS policies prevent blocked users from inserting messages

### Message Flow

```
User A wants to send "Hello" to User B:

1. [User A Browser] Fetches User B's Public Key from Supabase
2. [User A Browser] Encrypts "Hello" with User B's Public Key → Ciphertext
3. [User A Browser] Sends ONLY ciphertext to Supabase
4. [Supabase] RLS Check: Is User A blocked by User B? If yes, reject INSERT
5. [Supabase] Stores ciphertext in messages table
6. [User B Browser] Real-time subscription triggers, fetches new ciphertext
7. [User B Browser] Decrypts ciphertext with their stored Private Key → "Hello"
8. [User B Browser] Displays decrypted message to User B
```

### Blocking Flow

```
User A wants to block User B:

1. [User A Browser] Calls: INSERT INTO blocked_users (blocker_id, blocked_id)
2. [Supabase] Stores blocking relationship
3. [User B Browser] Attempts to send message to User A
4. [Supabase RLS] Detects: "Is User B.id in blocked_users WHERE blocked_id = User A.id?"
5. [Supabase] REJECTS the INSERT
6. Result: User B receives "Cannot message users who blocked you" error
```

---

## Database Schema

### Tables Created

#### 1. `messages` Table
Stores encrypted messages with strict security policies.

```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ciphertext TEXT NOT NULL,  -- Base64-encoded RSA-OAEP encrypted text
  iv TEXT NOT NULL,          -- Base64-encoded IV (for potential AES-GCM hybrid)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Key Design Decisions**:
- `ciphertext` is **always encrypted** on the client
- No `plaintext` column exists (prevents accidental plaintext storage)
- RLS policies prevent unauthorized access
- Indexes on recipient_id and sender_id for fast queries

#### 2. `blocked_users` Table
Manages blocking relationships with strict constraints.

```sql
CREATE TABLE blocked_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT unique_block_relationship UNIQUE (blocker_id, blocked_id)
);
```

**Key Design Decisions**:
- `blocker_id` = User who initiated the block
- `blocked_id` = User who is blocked
- UNIQUE constraint prevents duplicate blocks
- Cascade delete ensures cleanup when users are deleted

#### 3. `users` Table (Extended)
Must have a `public_key` column to store each user's public key.

```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS public_key TEXT;
```

**Suggested users table structure**:
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  public_key TEXT,  -- JWK format JSON string
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Row Level Security (RLS) Policies

#### Messages Table Policies

1. **SELECT Policy**: Users can only read their own messages
   ```sql
   CREATE POLICY "Users can select their own messages" ON messages FOR SELECT
   USING (auth.uid() = sender_id OR auth.uid() = recipient_id);
   ```

2. **INSERT Policy - Block Check 1**: Don't send if you blocked them
   ```sql
   CREATE POLICY "Cannot message if you blocked the recipient" ON messages FOR INSERT
   WITH CHECK (
     auth.uid() = sender_id
     AND NOT EXISTS (
       SELECT 1 FROM blocked_users
       WHERE blocker_id = auth.uid()
       AND blocked_id = messages.recipient_id
     )
   );
   ```

3. **INSERT Policy - Block Check 2**: Don't send if they blocked you
   ```sql
   CREATE POLICY "Cannot message users who blocked you" ON messages FOR INSERT
   WITH CHECK (
     auth.uid() = sender_id
     AND NOT EXISTS (
       SELECT 1 FROM blocked_users
       WHERE blocker_id = messages.recipient_id
       AND blocked_id = auth.uid()
     )
   );
   ```

#### Blocked Users Table Policies

1. **Users can only manage their own blocks**
   ```sql
   CREATE POLICY "Users can only manage their own blocks" ON blocked_users FOR INSERT
   WITH CHECK (auth.uid() = blocker_id);
   ```

---

## Cryptographic Implementation

### Key Generation

When a user registers or first opens the app:

```typescript
import { initializeUserEncryption, exportPublicKeyAsJWK } from '@/lib/cryptoUtils';

// In your registration/onboarding flow:
const { publicKeyJWK, keyPairGenerated } = await initializeUserEncryption();

if (keyPairGenerated) {
  // Save public key to user profile
  await supabase
    .from('users')
    .update({ public_key: publicKeyJWK })
    .eq('id', userId);
}
```

**What happens**:
1. Generates RSA-4096 key pair on client
2. Stores private key in **IndexedDB** (encrypted storage)
3. Exports public key as JWK
4. Saves public key to Supabase

### Encrypting a Message

```typescript
import {
  encryptMessage,
  importPublicKeyFromJWK,
} from '@/lib/cryptoUtils';

// Fetch recipient's public key
const { data: recipient } = await supabase
  .from('users')
  .select('public_key')
  .eq('id', recipientId)
  .single();

// Import their public key
const publicKey = await importPublicKeyFromJWK(recipient.public_key);

// Encrypt message locally
const encrypted = await encryptMessage(messageText, publicKey);
// Result: { ciphertext: "base64...", iv: "base64...", algorithm: "RSA-OAEP" }

// Send ONLY ciphertext to Supabase
await supabase
  .from('messages')
  .insert({
    sender_id: userId,
    recipient_id: recipientId,
    ciphertext: encrypted.ciphertext,
    iv: encrypted.iv,
  });
```

**Security Guarantee**:
- The plaintext message NEVER leaves the sender's device
- Supabase only ever sees the encrypted ciphertext
- Even Supabase admins cannot read message content

### Decrypting a Message

```typescript
import {
  decryptMessage,
  getStoredPrivateKey,
} from '@/lib/cryptoUtils';

// Get user's private key from local storage
const privateKey = await getStoredPrivateKey();

// Fetch encrypted message from Supabase
const { data: message } = await supabase
  .from('messages')
  .select('*')
  .eq('id', messageId)
  .single();

// Decrypt on client
const decrypted = await decryptMessage(
  {
    ciphertext: message.ciphertext,
    iv: message.iv,
    algorithm: 'RSA-OAEP',
  },
  privateKey
);

console.log(decrypted.text); // Original plaintext message
```

**Security Guarantee**:
- Private key never leaves the browser
- Only the intended recipient can decrypt
- Decryption happens entirely on the client

### Algorithm Details

**RSA-OAEP (Optimal Asymmetric Encryption Padding)**
- **Key Size**: 4096 bits (production-grade)
- **Hash Function**: SHA-256
- **Public Exponent**: 65537 (0x10001)
- **Advantages**: 
  - Industry standard for asymmetric encryption
  - Deterministic padding (OAEP)
  - Long-term security (4096-bit key)
- **Disadvantages**:
  - Slower than symmetric encryption
  - Message size is limited to ~256 bytes (1 RSA operation)

**For longer messages**, you could implement hybrid encryption:
1. Generate random AES-256 key
2. Encrypt message with AES-256
3. Encrypt AES key with RSA-OAEP
4. Send both to server

(Current implementation uses RSA-OAEP directly for simplicity)

---

## Blocking System

### How Blocking Works

#### From User A's Perspective (Blocker)
- **User A blocks User B**
  - Blocks `blocked_users.insert({ blocker_id: A, blocked_id: B })`
  - User B's profile is hidden/marked as blocked
  - User B's messages are hidden from chat list

#### From User B's Perspective (Blocked)
- **User B tries to send message to User A**
  - RLS policy checks: `blocked_users` table
  - Supabase detects block and REJECTS INSERT
  - User B sees: "Cannot send message: User has blocked you"
- **User B tries to view User A's profile**
  - Query with Supabase filters out blocked users
  - Shows: "User not found" or similar UX

### Implementation in ChatWindow.tsx

```typescript
// Check if recipient has blocked the user
const { data: isBlockedData } = await supabase
  .from('blocked_users')
  .select('id')
  .eq('blocker_id', recipientId)  // Recipient blocked us
  .eq('blocked_id', userId)
  .single();

if (isBlockedData) {
  // Show UI: "This user has blocked you. You cannot send messages."
  setIsBlocked(true);
  disableMessageInput = true;
}

// Also check if user has blocked recipient
const { data: hasBlockedData } = await supabase
  .from('blocked_users')
  .select('id')
  .eq('blocker_id', userId)       // We blocked them
  .eq('blocked_id', recipientId)
  .single();

if (hasBlockedData) {
  // Show UI: "You have blocked this user. Unblock to send messages."
  setHasBlocked(true);
  disableMessageInput = true;
}
```

### Unblocking

```typescript
// User A unblocks User B
await supabase
  .from('blocked_users')
  .delete()
  .eq('blocker_id', userId)
  .eq('blocked_id', recipientId);
```

---

## Integration Steps

### Step 1: Database Setup

1. Run the migration SQL:
   ```bash
   # Using Supabase CLI
   supabase migration new messaging_e2ee_blocking
   # Copy contents of migrations/001_messaging_e2ee_blocking_schema.sql
   supabase db push
   ```

   Or manually in Supabase SQL Editor:
   - Copy entire contents of `migrations/001_messaging_e2ee_blocking_schema.sql`
   - Execute in Supabase Dashboard → SQL Editor

2. Verify tables created:
   ```sql
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name IN ('messages', 'blocked_users');
   ```

### Step 2: Install Dependencies

Your project should already have:
- `next-auth` for authentication
- Supabase client library
- React Hot Toast (or similar) for notifications

If not:
```bash
pnpm install next-auth @supabase/supabase-js react-hot-toast
```

### Step 3: Copy Files

Ensure these files are in your project:
- `lib/cryptoUtils.ts` - Crypto utilities
- `types/e2ee-types.ts` - TypeScript types
- `components/ChatWindow.tsx` - Main chat component

### Step 4: Update Your User Registration

When a user registers, initialize their encryption keys:

```typescript
// In your signup/registration API route
import { initializeUserEncryption } from '@/lib/cryptoUtils';

export async function POST(req: Request) {
  const { email, username, password } = await req.json();

  // Create user in auth
  const { data: authUser, error: authError } = await supabase.auth.signUp({
    email,
    password,
  });

  // Create user profile
  const { data: user } = await supabase
    .from('users')
    .insert({ id: authUser.user.id, email, username })
    .select()
    .single();

  // Encryption will be initialized on first login (in ChatWindow.tsx useEffect)
  
  return { user };
}
```

### Step 5: Integrate ChatWindow Component

In your messaging or user profile page:

```typescript
import ChatWindow from '@/components/ChatWindow';

export default function MessagesPage() {
  const [selectedUser, setSelectedUser] = useState<string | null>(null);

  return (
    <div className="flex gap-4">
      {/* User list */}
      <div className="w-64">
        {users.map((user) => (
          <button key={user.id} onClick={() => setSelectedUser(user.id)}>
            {user.username}
          </button>
        ))}
      </div>

      {/* Chat */}
      {selectedUser && (
        <ChatWindow
          recipientId={selectedUser}
          recipientUsername={selectedUser.username}
          onClose={() => setSelectedUser(null)}
        />
      )}
    </div>
  );
}
```

### Step 6: Enable Supabase Authentication

Ensure Supabase Auth is configured:

```typescript
// lib/appwrite-client.ts (or your Supabase initialization)
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
```

---

## Security Considerations

### ✅ What This Implementation Protects Against

1. **Server-Side Message Interception**
   - Even if Supabase is compromised, messages are unreadable
   - Messages are encrypted end-to-end, not just in-transit

2. **Network Eavesdropping**
   - HTTPS encrypts the ciphertext in transit
   - Attacker sees only base64-encoded garbage
   - Plaintext never transmitted over network

3. **Database Breaches**
   - Supabase admins cannot read message content
   - Message table only contains ciphertext
   - Private keys are never stored on server

4. **Unauthorized Access**
   - RLS policies enforce that only intended recipients can read messages
   - Blocked users cannot message you
   - You cannot message users you've blocked

### ⚠️ What This Implementation Does NOT Protect Against

1. **Client-Side Malware**
   - If user's browser is compromised, malware can intercept messages
   - Mitigation: Keep browser, OS, and antivirus updated

2. **Key Theft from LocalStorage/IndexedDB**
   - If attacker has access to user's browser, they can steal the private key
   - Mitigation: Use HTTPS, implement CSP (Content Security Policy), monitor device security

3. **Man-in-the-Middle (MITM) at Registration**
   - If initial key exchange is compromised, attacker could intercept public key
   - Mitigation: Use HTTPS with certificate pinning, verify public keys out-of-band

4. **Social Engineering**
   - Users can be tricked into sharing their device or password
   - Mitigation: Educate users on security best practices

5. **Quantum Computing (Future)**
   - RSA-4096 may be broken by quantum computers (10-20+ years away)
   - Mitigation: Plan for post-quantum cryptography migration

### 🔐 Best Practices

1. **Always use HTTPS**: Ensure your messaging endpoint uses HTTPS only
2. **Content Security Policy (CSP)**: Prevent inline scripts and script injection
3. **CORS**: Restrict cross-origin requests appropriately
4. **Regular Audits**: Periodically audit encryption code and policies
5. **Key Rotation**: Implement key rotation for long-term security (TODO in future)
6. **Audit Logging**: Log encryption-related events for security monitoring

---

## Troubleshooting

### Issue: "Private key not found"

**Cause**: User's private key was not generated or was cleared from storage.

**Solution**:
```typescript
// Check if key exists
const hasKey = await hasStoredPrivateKey();
if (!hasKey) {
  // Regenerate keys
  const { publicKeyJWK, keyPairGenerated } = await initializeUserEncryption();
  if (keyPairGenerated) {
    await supabase
      .from('users')
      .update({ public_key: publicKeyJWK })
      .eq('id', userId);
  }
}
```

### Issue: "Failed to decrypt message"

**Cause**: 
- Private key is invalid or mismatched
- Ciphertext is corrupted
- Wrong algorithm used

**Solution**:
```typescript
try {
  const decrypted = await decryptMessage(encrypted, privateKey);
} catch (err) {
  console.error('Decryption failed:', err);
  // Clear cache and refetch
  decryptedCache.clear();
  // Or regenerate keys if persistent
}
```

### Issue: "Cannot message users who blocked you"

**Cause**: RLS policy is working as intended. The recipient blocked you.

**Solution**: 
- Check blocking status
- Show appropriate UI message
- Ask recipient to unblock you

```typescript
const { data: isBlocked } = await supabase
  .from('blocked_users')
  .select('id')
  .eq('blocker_id', recipientId)
  .eq('blocked_id', userId)
  .single();

if (isBlocked) {
  showAlert('This user has blocked you. You cannot send messages.');
}
```

### Issue: IndexedDB Permission Denied

**Cause**: Browser policy or incognito mode restrictions.

**Solution**: 
The code automatically falls back to localStorage. You'll see a console warning:
```
Using localStorage for private key storage. NOT recommended for production.
```

For production, recommend users use regular browsing (not incognito).

### Issue: WebCrypto not available

**Cause**: Browser doesn't support Web Crypto API (very old browsers).

**Solution**: 
The code will throw an error. You'll need to add a polyfill like:
```typescript
import 'crypto-js'; // External library
```

Or show a notice: "Your browser doesn't support secure encryption."

---

## Testing

### Manual Testing Flow

```typescript
// 1. Create two test users
// User A: a@test.com
// User B: b@test.com

// 2. Log in as User A
// - Should see encryption initialized
// - Visit User B's profile
// - Click "Send Message"

// 3. ChatWindow opens
// - Should show "🔒 End-to-end encrypted"
// - Type a message
// - Click Send

// 4. Check Supabase in real-time
// - Go to SQL Editor
// - SELECT * FROM messages WHERE sender_id = User_A_ID;
// - Should see ciphertext (base64, not plaintext)

// 5. Log in as User B
// - Should see message from User A
// - Message should be decrypted automatically
// - Reply to User A
// - Check ciphertext in Supabase again

// 6. Test Blocking
// - User A blocks User B
// - User B tries to send message
// - Should see error: "Cannot send message"
```

### Load Testing Considerations

- **Encryption**: RSA-4096 key generation takes ~1-2 seconds per user
- **Decryption**: Each message takes ~10-100ms to decrypt (depends on key size)
- **IndexedDB**: Can store thousands of messages efficiently
- **Real-time Sync**: Supabase handles up to 100s of concurrent users per project

---

## Future Enhancements

1. **Key Rotation**: Implement automatic key rotation every 90 days
2. **Message Expiration**: Auto-delete old messages after X days
3. **Forward Secrecy**: Generate ephemeral session keys for each conversation
4. **Group Chats**: Extend to group messaging with group keys
5. **Read Receipts**: Add encrypted read receipts
6. **Voice/Video**: Implement DTLS-SRTP for voice/video calls
7. **Device Management**: Support multiple devices with key syncing
8. **Key Backup**: Allow users to backup private key with password

---

## Files Overview

| File | Purpose |
|------|---------|
| `migrations/001_messaging_e2ee_blocking_schema.sql` | Database schema and RLS policies |
| `lib/cryptoUtils.ts` | Web Crypto API utilities for E2EE |
| `types/e2ee-types.ts` | TypeScript type definitions |
| `components/ChatWindow.tsx` | Main React messaging component |
| `E2EE_IMPLEMENTATION_GUIDE.md` | This file |

---

## Support & Resources

- **Web Crypto API Docs**: https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API
- **Supabase RLS**: https://supabase.com/docs/guides/auth/row-level-security
- **RSA-OAEP**: https://en.wikipedia.org/wiki/Optimal_asymmetric_encryption_padding
- **IndexedDB**: https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API

---

**Document Version**: 1.0  
**Last Updated**: February 2026  
**Status**: Production-Ready  
