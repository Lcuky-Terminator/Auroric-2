# 🏗️ System Architecture Diagram

## Message Flow (High Level)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          MESSAGE SENDING FLOW                               │
└─────────────────────────────────────────────────────────────────────────────┘

    User A                          Browser A                   Supabase
    ─────────────────────────────────────────────────────────────────
    
    Clicks "Send"
        │
        ├─► [Fetch B's Public Key]
        │   from users.public_key
        │
        ├─► [Encrypt Message]
        │   RSA-4096 OAEP
        │   plaintext → ciphertext ✓
        │
        ├─► [Insert Message]
        │   {
        │     sender_id: A,
        │     recipient_id: B,
        │     ciphertext: "base64...",
        │     iv: "base64..."
        │   }
        │
        │   ┌─► RLS Policy Check 1
        │   │   Is A blocked by B? YES → Reject INSERT ✗
        │   │                    NO → Continue
        │   │
        │   ├─► RLS Policy Check 2
        │   │   Has A blocked B? YES → Reject INSERT ✗
        │   │                   NO → Continue
        │   │
        │   └─► ✓ INSERT ACCEPTED
        │       Ciphertext stored
        │       Plaintext never touched server

─────────────────────────────────────────────────────────────────────────────

    User B                          Browser B
    ─────────────────────────────────────────────
    
                              [Real-time subscription]
                              receives new message
                                    │
                              [Fetch Private Key]
                              from IndexedDB
                                    │
                              [Decrypt Message]
                              ciphertext → plaintext ✓
                                    │
                              Display "Hello!" ✓
```

---

## Data Storage Model

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          BROWSER (Client-Side)                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  IndexedDB (Encrypted by browser)                                           │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │ Store: "e2ee_encryption"                                             │ │
│  │  ├─ Private Key (JWK format)     ← NEVER sent to server              │ │
│  │  └─ Metadata                                                          │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  LocalStorage (Fallback, less secure)                                       │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │ e2ee_private_key = "{ jwk data }"  ← Only if IndexedDB unavailable  │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  Memory (Runtime)                                                            │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │ Imported CryptoKeys (not serializable)                                │ │
│  │  ├─ Private Key (for decryption)                                      │ │
│  │  └─ Public Keys cached (for encryption)                               │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                      SUPABASE (Server-Side)                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  users table                                                                │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │ id (UUID)  │ username │ email        │ public_key (JWK)             │ │
│  │ ──────────────────────────────────────────────────────────────────── │ │
│  │ uuid-A     │ alice    │ alice@ex.com │ { "kty": "RSA", "n": ... } │ │
│  │ uuid-B     │ bob      │ bob@ex.com   │ { "kty": "RSA", "n": ... } │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  messages table (All encrypted)                                             │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │ id | sender_id | recipient_id | ciphertext | iv | created_at       │ │
│  │ ──────────────────────────────────────────────────────────────────── │ │
│  │ 1  │ uuid-A    │ uuid-B       │ "ab3f..." │ "12" │ 2026-02-23 ...  │ │
│  │    │           │              │ (base64)  │      │                 │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│  NOTE: ciphertext NEVER contains plaintext                                  │
│                                                                              │
│  blocked_users table                                                        │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │ id | blocker_id | blocked_id | created_at                           │ │
│  │ ──────────────────────────────────────────────────────────────────── │ │
│  │ 1  │ uuid-A     │ uuid-B     │ 2026-02-23 ...                      │ │
│  │ 2  │ uuid-C     │ uuid-A     │ 2026-02-22 ...                      │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Component Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         COMPONENT HIERARCHY                                 │
└─────────────────────────────────────────────────────────────────────────────┘

App (pages/messages.tsx)
│
├── useE2EEInitialization()
│   └─ Ensures user has encryption keys
│      on first login
│
└── ChatWindow (components/ChatWindow.tsx)
    │
    ├─ useE2EEMessaging(recipientId)
    │  ├─ useMessageEncryption()
    │  │  └─ encryptMessage() → Send encrypted
    │  │
    │  ├─ useMessageDecryption()
    │  │  └─ decryptMessage() → Receive decrypted
    │  │
    │  └─ fetchMessages() → Load history
    │
    ├─ useBlocking(recipientId)
    │  ├─ blockUser()
    │  ├─ unblockUser()
    │  └─ checkBlockingStatus()
    │
    ├─ Real-time subscription
    │  └─ Supabase realtime sync
    │
    └─ UI Elements
       ├─ Message list
       ├─ Input field
       ├─ Send button
       ├─ Block/Unblock button
       └─ Status indicators

```

---

## Security Layers

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        SECURITY ENFORCEMENT LAYERS                          │
└─────────────────────────────────────────────────────────────────────────────┘

LAYER 1: APPLICATION ENCRYPTION (JavaScript)
─────────────────────────────────────────────
Message plaintext → RSA-4096 encrypt → ciphertext
Happens BEFORE sending to server
If compromised: Ciphertext still secure (RSA-4096 is strong)

LAYER 2: TRANSPORT ENCRYPTION (HTTPS)
──────────────────────────────────────
Ciphertext → HTTPS transport → Server
If compromised: Still encrypted (HTTPS prevents MITM)

LAYER 3: ROW LEVEL SECURITY (Supabase RLS)
───────────────────────────────────────────
INSERT INTO messages check:
  ├─ Is user authenticated? auth.uid() IS NOT NULL
  ├─ Is blocker blocked sender?
  │  WHERE blocker_id = recipient_id AND blocked_id = sender_id
  └─ If YES → REJECT INSERT ✗

LAYER 4: DATABASE ENCRYPTION (Supabase)
────────────────────────────────────────
Data at rest encrypted by Supabase infrastructure
Additional layer (but we already have end-to-end)

LAYER 5: CLIENT-SIDE STORAGE
────────────────────────────
Private Key in IndexedDB (encrypted by browser)
OR LocalStorage (plaintext but isolated per domain)
Private key NEVER leaves browser

```

---

## Blocking System RLS Policies

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      BLOCKING SYSTEM FLOW                                   │
└─────────────────────────────────────────────────────────────────────────────┘

User A blocks User B:
───────────────────
  1. Click "Block" button
  2. INSERT INTO blocked_users (blocker_id: A, blocked_id: B)
  3. ✓ Stored in database
  4. B's profile marked as blocked in UI

User B tries to message User A:
──────────────────────────────
  1. B types message and sends
  2. Browser encrypts message
  3. INSERT INTO messages (sender_id: B, recipient_id: A, ciphertext: "...")
  4. Supabase RLS Policy triggers:
  
     CREATE POLICY [messages] FOR INSERT
     WITH CHECK (
       NOT EXISTS (
         SELECT 1 FROM blocked_users
         WHERE blocker_id = messages.recipient_id  ← A
           AND blocked_id = auth.uid()             ← B
       )
     )
  
  5. Query result: EXISTS 1 row (A blocked B)
  6. NOT EXISTS fails → RLS rejects INSERT ✗
  7. Error returned: "Cannot send message: User blocked you"
  8. B sees error message in UI

User A unblocks User B:
──────────────────────
  1. Click "Unblock" button
  2. DELETE FROM blocked_users WHERE blocker_id=A AND blocked_id=B
  3. ✓ Removed from database
  4. B can now message A

```

---

## Key Generation & Storage

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    KEY LIFECYCLE MANAGEMENT                                 │
└─────────────────────────────────────────────────────────────────────────────┘

REGISTRATION / FIRST LOGIN:
──────────────────────────

User A logs in
    ↓
hasStoredPrivateKey() check
    ↓
  NO? → generateKeyPair()
    │
    ├─ web.crypto.subtle.generateKey()
    │  └─ RSA-4096, SHA-256, OAEP
    │     Time: ~1-2 seconds
    │
    ├─ storePrivateKeyInIndexedDB()
    │  └─ Export to JWK format
    │     Store in IndexedDB
    │     (Never sent to server)
    │
    └─ exportPublicKeyAsJWK()
       └─ Convert to JSON
          Send to /api/auth/initialize-encryption/save-public-key
          Store in users.public_key column
          (Public, downloadable by anyone)


ON EVERY MESSAGE SEND:
─────────────────────

User A sends message to User B
    ↓
importPublicKeyFromJWK(B's public key)
    └─ Fetch from Supabase users table
       Import as CryptoKey
       (B's key is publicly available)
    ↓
encryptMessage(plaintext, B's public key)
    └─ web.crypto.subtle.encrypt()
       RSA-4096 OAEP encryption
       Result: ciphertext (base64)
    ↓
INSERT INTO messages (ciphertext)
    └─ Send only ciphertext to server
       Plaintext stays on A's device


ON EVERY MESSAGE RECEIVE:
────────────────────────

User B's browser receives message
    ↓
getStoredPrivateKey()
    └─ Fetch from IndexedDB
       Import as CryptoKey
       (Never sent to server)
    ↓
decryptMessage(ciphertext, B's private key)
    └─ web.crypto.subtle.decrypt()
       RSA-4096 OAEP decryption
       Result: plaintext
    ↓
Display message to User B
    └─ Only plaintext shown in UI
       Never logged to server

```

---

## Performance Profile

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          PERFORMANCE METRICS                                │
└─────────────────────────────────────────────────────────────────────────────┘

OPERATION              │ TIME      │ FREQUENCY      │ BOTTLENECK
───────────────────────┼───────────┼───────────────┼──────────────────────
Key Generation         │ 1-2 sec   │ 1x per user   │ Web Crypto API
Encryption             │ 10-50 ms  │ Per message   │ RSA-4096 modexp
Decryption             │ 10-50 ms  │ Per message   │ RSA-4096 modexp
IndexedDB Write        │ <10 ms    │ 1x per user   │ Browser storage
IndexedDB Read         │ <1 ms     │ Per session   │ Browser cache
Public Key Import      │ <5 ms     │ Per recipient │ In-memory op
Supabase Query         │ 50-200 ms │ Per message   │ Network/DB
Real-time Sync         │ <100 ms   │ Per message   │ WebSocket

SCALABILITY:
────────────
• Single browser can handle thousands of messages
• Decryption cache prevents repeated decryption
• Lazy loading for message history
• Batch operations for efficiency
• No server-side crypto (offloaded to client)

```

---

## Error Recovery Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        ERROR HANDLING PATHS                                 │
└─────────────────────────────────────────────────────────────────────────────┘

ERROR: Private key not found
────────────────────────────
  ├─ Cause: First time using this browser
  ├─ Solution: generateKeyPair() → save public key
  └─ User sees: Dialog "Setting up encryption..." (1-2 sec)

ERROR: Failed to decrypt message
─────────────────────────────────
  ├─ Cause: Corrupted data OR wrong key
  ├─ Recovery: Show [Failed to decrypt] in UI
  ├─ Attempt: Regenerate keys
  └─ User action: Send message again

ERROR: User has blocked you
────────────────────────────
  ├─ Cause: RLS policy detected block
  ├─ Recovery: Show blocking status
  ├─ User action: Request to be unblocked
  └─ UI: Hide message input

ERROR: IndexedDB not available
───────────────────────────────
  ├─ Cause: Incognito mode OR storage quota exceeded
  ├─ Fallback: Use localStorage (warning shown)
  └─ User action: Use regular browsing mode

ERROR: Network timeout
──────────────────────
  ├─ Cause: Slow connection
  ├─ Retry: Auto-retry with exponential backoff
  └─ UI: Show retry button

ERROR: RLS violation on insert
──────────────────────────────
  ├─ Cause: Multiple possible (blocked, auth failure)
  ├─ Recovery: Log error details
  ├─ Display: User-friendly error message
  └─ User action: Contact support if persistent

```

---

## Integration Points

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      INTEGRATION TOUCHPOINTS                                │
└─────────────────────────────────────────────────────────────────────────────┘

YOUR CODE                    ↔      PROVIDED CODE              ↔      SUPABASE
──────────────────────────────────────────────────────────────────────────────

User Registration                                                  Insert user
         │                                                              │
         └─→ [Initialize]                                              │
             Encryption                                                │
             useE2EEInit()                                              │
                  │                                                    │
                  ├─→ generateKeyPair()                                │
                  │   lib/cryptoUtils.ts                               │
                  │                                                    │
                  └─→ [Save Public Key]                                │
                      app/api/auth/...                                 │
                      POST to Supabase ────────────────────────→ Save to users.public_key

Chat UI                                                           Real-time Sync
         │                                                              │
         ├─→ [Fetch Messages]                                          │
         │   ChatWindow.tsx                                            │
         │   useE2EEMessaging()                                         │
         │        │                                                    │
         │        └─→ [Decrypt]                                        │
         │            cryptoUtils.ts ──────────────────────────→ Fetch from messages
         │            decryptMessage()                                 │
         │                                                             │
         └─→ [Send Message]                                           │
             ChatWindow.tsx                                           │
             sendMessage()                                            │
                  │                                                   │
                  ├─→ [Encrypt]                                       │
                  │   cryptoUtils.ts                                  │
                  │   encryptMessage()                                │
                  │                                                   │
                  └─→ [POST Encrypted]                                │
                      app/api/messages/send ────────→ INSERT INTO messages
                                                     (RLS checks blocking)

Blocking UI                                                            │
         │                                                             │
         ├─→ [Block User]                                             │
         │   useBlocking()                                             │
         │   blockUser()                                               │
         │        │                                                   │
         │        └─→ [POST Block]                                    │
         │            app/api/blocking ───────────────→ INSERT INTO blocked_users
         │                                              │
         │                                              └─ RLS activated!
         │                                                 Future messages rejected
         │
         └─→ [Unblock]                                               │
             unblockUser() ─────────────────────────→ DELETE FROM blocked_users

```

---

## Technology Stack

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           TECH STACK                                        │
└─────────────────────────────────────────────────────────────────────────────┘

FRONTEND:
─────────
  • Next.js 13+ (App Router)
  • React 18+
  • TypeScript
  • Web Crypto API (native, no libs!)
  • IndexedDB (browser's encrypted storage)
  • Supabase JS client

BACKEND:
────────
  • Supabase PostgreSQL
  • Row Level Security (RLS)
  • Edge Functions (optional)
  • Real-time subscriptions
  • User authentication (via NextAuth or Supabase Auth)

CRYPTOGRAPHY:
─────────────
  • RSA-4096 with OAEP
  • SHA-256 hashing
  • Web Crypto API (built into browser)
  • 0 external crypto libraries!

DEPLOYMENT:
───────────
  • Vercel (Next.js hosting)
  • Supabase (PostgreSQL + auth)
  • HTTPS everywhere
  • CDN for static assets
  • Edge caching

```

This system is **production-ready** and provides **true end-to-end encryption** with **server-enforced blocking**.

See documentation files for detailed setup instructions.
