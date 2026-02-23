/**
 * E2EE Messaging Utilities using Web Crypto API.
 * 
 * Features:
 * - RSA-OAEP 2048-bit key pair generation.
 * - Private key storage in IndexedDB (never leaves browser).
 * - Hybrid encryption: AES-256-GCM for message data, RSA-OAEP for AES key wrapping.
 */

const DB_NAME = 'auroric_e2ee';
const STORE_NAME = 'private_keys';

export interface EncryptedPayload {
    v: 1;
    iv: string; // Base64 AES-GCM IV
    data: string; // Base64 AES-encrypted ciphertext
    keys: {
        [userId: string]: string; // Base64 RSA-wrapped AES key
    };
}

// --- IndexedDB Helpers for Private Key Storage ---

async function openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, 1);
        request.onupgradeneeded = () => {
            request.result.createObjectStore(STORE_NAME);
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

export async function savePrivateKey(userId: string, key: CryptoKey): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const request = store.put(key, userId);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

export async function loadPrivateKey(userId: string): Promise<CryptoKey | null> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const request = store.get(userId);
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
    });
}

// --- Key Management ---

export async function generateKeyPair(): Promise<CryptoKeyPair> {
    return window.crypto.subtle.generateKey(
        {
            name: 'RSA-OAEP',
            modulusLength: 2048,
            publicExponent: new Uint8Array([1, 0, 1]),
            hash: 'SHA-256',
        },
        true, // extractable
        ['encrypt', 'decrypt', 'wrapKey', 'unwrapKey']
    );
}

export async function exportPublicKey(key: CryptoKey): Promise<string> {
    const jwk = await window.crypto.subtle.exportKey('jwk', key);
    return JSON.stringify(jwk);
}

export async function importPublicKey(jwkString: string): Promise<CryptoKey> {
    const jwk = JSON.parse(jwkString);
    return window.crypto.subtle.importKey(
        'jwk',
        jwk,
        { name: 'RSA-OAEP', hash: 'SHA-256' },
        true,
        ['encrypt', 'wrapKey']
    );
}

/**
 * Ensures a keypair exists for the user. If not, generates one, saves the private key,
 * and returns the public key as a JWK string.
 * @returns { publicKeyJwk: string }
 */
export async function ensureKeyPair(userId: string): Promise<{ publicKeyJwk: string, isNew: boolean }> {
    let privateKey = await loadPrivateKey(userId);
    if (privateKey) {
        // Already exists in this browser, but we might need the public key to return
        // Realistically, to return the public key, we might need a separate mechanism if we didn't save it.
        // For now, if we have private key, we assume public key is already on server.
        return { publicKeyJwk: '', isNew: false };
    }

    // Generate new pair
    const keyPair = await generateKeyPair();
    await savePrivateKey(userId, keyPair.privateKey);
    const publicKeyJwk = await exportPublicKey(keyPair.publicKey);

    return { publicKeyJwk, isNew: true };
}

// --- Base64 Utilities ---

function arrayBufferToBase64(buffer: ArrayBuffer): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary_string = window.atob(base64);
    const len = binary_string.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes.buffer;
}

// --- Encryption / Decryption ---

/**
 * Encrypts a message using a random AES-GCM key, then wraps the AES key
 * for both the sender and the recipient using their respective RSA public keys.
 */
export async function encryptMessage(
    text: string,
    senderId: string,
    senderPubKeyJwk: string,
    recipientId: string,
    recipientPubKeyJwk: string
): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);

    // 1. Generate AES-256-GCM key
    const aesKey = await window.crypto.subtle.generateKey(
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
    );

    // 2. Encrypt the actual message text
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const ciphertext = await window.crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        aesKey,
        data
    );

    // 3. Import public keys
    const senderPubKey = await importPublicKey(senderPubKeyJwk);
    const recipientPubKey = await importPublicKey(recipientPubKeyJwk);

    // 4. Wrap the AES key with both static RSA public keys
    const [wrappedForSender, wrappedForRecipient] = await Promise.all([
        window.crypto.subtle.wrapKey('raw', aesKey, senderPubKey, { name: 'RSA-OAEP' }),
        window.crypto.subtle.wrapKey('raw', aesKey, recipientPubKey, { name: 'RSA-OAEP' })
    ]);

    const payload: EncryptedPayload = {
        v: 1,
        iv: arrayBufferToBase64(iv.buffer),
        data: arrayBufferToBase64(ciphertext),
        keys: {
            [senderId]: arrayBufferToBase64(wrappedForSender),
            [recipientId]: arrayBufferToBase64(wrappedForRecipient)
        }
    };

    return JSON.stringify(payload);
}

/**
 * Decrypts a message payload using the user's private key.
 */
export async function decryptMessage(
    payloadString: string,
    userId: string,
    privateKey: CryptoKey
): Promise<string> {
    try {
        const payload: EncryptedPayload = JSON.parse(payloadString);
        if (payload.v !== 1 || !payload.keys[userId]) {
            throw new Error("Invalid payload or no key for user");
        }

        const wrappedKeyB64 = payload.keys[userId];
        const wrappedKeyBuffer = base64ToArrayBuffer(wrappedKeyB64);
        const iv = base64ToArrayBuffer(payload.iv);
        const ciphertext = base64ToArrayBuffer(payload.data);

        // 1. Unwrap AES key
        const aesKey = await window.crypto.subtle.unwrapKey(
            'raw',
            wrappedKeyBuffer,
            privateKey,
            { name: 'RSA-OAEP' },
            { name: 'AES-GCM', length: 256 },
            false,
            ['decrypt']
        );

        // 2. Decrypt ciphertext
        const decryptedData = await window.crypto.subtle.decrypt(
            { name: 'AES-GCM', iv },
            aesKey,
            ciphertext
        );

        const decoder = new TextDecoder();
        return decoder.decode(decryptedData);
    } catch (err) {
        console.error("Failed to decrypt message:", err);
        return "[Encrypted Message - Key Not Found]";
    }
}
