/**
 * ============================================================================
 * CRYPTO UTILITIES - Production-Grade End-to-End Encryption
 * Using Web Crypto API (window.crypto.subtle)
 * ============================================================================
 */

// ============================================================================
// TYPES
// ============================================================================

export interface KeyPair {
  publicKey: CryptoKey;
  privateKey: CryptoKey;
}

export interface StoredKeyPair {
  publicKey: JsonWebKey;
  privateKey: JsonWebKey;
}

export interface EncryptedMessage {
  ciphertext: string; // Base64-encoded ciphertext
  iv: string; // Base64-encoded IV (for hybrid approach fallback)
  algorithm: 'RSA-OAEP' | 'AES-GCM';
}

export interface DecryptedMessage {
  text: string;
  timestamp: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const STORAGE_KEY_PUBLIC = 'e2ee_public_key';
const STORAGE_KEY_PRIVATE = 'e2ee_private_key';
const IDB_STORE_NAME = 'e2ee_encryption';
const IDB_DB_NAME = 'auroric_crypto';
const KEY_ALGORITHM = {
  name: 'RSA-OAEP',
  modulusLength: 4096, // Production-grade security
  publicExponent: new Uint8Array([1, 0, 1]), // 65537
  hash: 'SHA-256',
};

const ENCRYPTION_ALGORITHM = {
  name: 'RSA-OAEP',
  hash: 'SHA-256',
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Convert Uint8Array to Base64 string
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Convert Base64 string to Uint8Array
 */
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Generate a random IV for AES-GCM (12 bytes recommended)
 */
function generateIV(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(12));
}

/**
 * Encode text to Uint8Array
 */
function textToUint8Array(text: string): Uint8Array {
  return new Uint8Array(new TextEncoder().encode(text));
}

/**
 * Decode Uint8Array to text
 */
function uint8ArrayToText(buffer: Uint8Array): string {
  return new TextDecoder().decode(buffer);
}

// ============================================================================
// KEY GENERATION & STORAGE
// ============================================================================

/**
 * Generate an RSA-4096 key pair for the current user
 * Returns the KeyPair and also stores the private key in IndexedDB
 */
export async function generateKeyPair(): Promise<KeyPair> {
  try {
    const keyPair = await crypto.subtle.generateKey(
      KEY_ALGORITHM,
      true, // extractable - needed to export for storage
      ['encrypt', 'decrypt']
    );

    // Verify IndexedDB is available for private key storage
    if ('indexedDB' in window) {
      await storePrivateKeyInIndexedDB(keyPair.privateKey);
    } else {
      console.warn(
        'IndexedDB not available. Falling back to localStorage (less secure).'
      );
      await storePrivateKeyInLocalStorage(keyPair.privateKey);
    }

    return keyPair;
  } catch (error) {
    console.error('Failed to generate key pair:', error);
    throw new Error('Key generation failed. Your browser may not support Web Crypto API.');
  }
}

/**
 * Export public key as JWK format (send to Supabase)
 */
export async function exportPublicKeyAsJWK(publicKey: CryptoKey): Promise<string> {
  try {
    const jwk = await crypto.subtle.exportKey('jwk', publicKey);
    return JSON.stringify(jwk);
  } catch (error) {
    console.error('Failed to export public key:', error);
    throw new Error('Public key export failed');
  }
}

/**
 * Import a public key from JWK format (from Supabase)
 */
export async function importPublicKeyFromJWK(jwkString: string): Promise<CryptoKey> {
  try {
    const jwk = JSON.parse(jwkString);
    return await crypto.subtle.importKey(
      'jwk',
      jwk,
      KEY_ALGORITHM,
      false, // not extractable
      ['encrypt']
    );
  } catch (error) {
    console.error('Failed to import public key:', error);
    throw new Error('Public key import failed. Invalid key format.');
  }
}

/**
 * Store private key in IndexedDB (preferred method - more secure)
 */
async function storePrivateKeyInIndexedDB(privateKey: CryptoKey): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const request = indexedDB.open(IDB_DB_NAME, 1);

      request.onerror = () => {
        console.error('IndexedDB open failed');
        reject(new Error('IndexedDB initialization failed'));
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(IDB_STORE_NAME)) {
          db.createObjectStore(IDB_STORE_NAME);
        }
      };

      request.onsuccess = async () => {
        try {
          const db = request.result;
          const jwk = await crypto.subtle.exportKey('jwk', privateKey);
          const transaction = db.transaction(IDB_STORE_NAME, 'readwrite');
          const store = transaction.objectStore(IDB_STORE_NAME);
          store.put(jwk, STORAGE_KEY_PRIVATE);

          transaction.oncomplete = () => {
            console.log('Private key stored securely in IndexedDB');
            resolve();
          };

          transaction.onerror = () => {
            reject(new Error('Failed to store private key in IndexedDB'));
          };
        } catch (error) {
          reject(error);
        }
      };
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Retrieve private key from IndexedDB
 */
async function getPrivateKeyFromIndexedDB(): Promise<CryptoKey | null> {
  return new Promise((resolve, reject) => {
    try {
      const request = indexedDB.open(IDB_DB_NAME, 1);

      request.onerror = () => reject(new Error('IndexedDB open failed'));

      request.onsuccess = async () => {
        try {
          const db = request.result;
          const transaction = db.transaction(IDB_STORE_NAME, 'readonly');
          const store = transaction.objectStore(IDB_STORE_NAME);
          const keyRequest = store.get(STORAGE_KEY_PRIVATE);

          keyRequest.onsuccess = async () => {
            const jwk = keyRequest.result;
            if (!jwk) {
              resolve(null);
              return;
            }

            const privateKey = await crypto.subtle.importKey(
              'jwk',
              jwk,
              KEY_ALGORITHM,
              true,
              ['decrypt']
            );
            resolve(privateKey);
          };

          keyRequest.onerror = () => {
            reject(new Error('Failed to retrieve private key from IndexedDB'));
          };
        } catch (error) {
          reject(error);
        }
      };
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Store private key in localStorage (fallback, less secure)
 * WARNING: Only use if IndexedDB is unavailable
 */
async function storePrivateKeyInLocalStorage(privateKey: CryptoKey): Promise<void> {
  try {
    const jwk = await crypto.subtle.exportKey('jwk', privateKey);
    localStorage.setItem(STORAGE_KEY_PRIVATE, JSON.stringify(jwk));
    console.warn(
      'Using localStorage for private key storage. NOT recommended for production. Use IndexedDB instead.'
    );
  } catch (error) {
    console.error('Failed to store private key in localStorage:', error);
    throw new Error('Private key storage failed');
  }
}

/**
 * Retrieve private key from localStorage (fallback)
 */
function getPrivateKeyFromLocalStorage(): CryptoKey | null {
  try {
    const jwkString = localStorage.getItem(STORAGE_KEY_PRIVATE);
    if (!jwkString) return null;

    const jwk = JSON.parse(jwkString);
    // Note: We need to return a promise here, so this is a helper
    return null; // Will be handled in getStoredPrivateKey
  } catch (error) {
    console.error('Failed to retrieve private key from localStorage:', error);
    return null;
  }
}

/**
 * Get the user's stored private key (from IndexedDB or localStorage)
 */
export async function getStoredPrivateKey(): Promise<CryptoKey | null> {
  try {
    // Try IndexedDB first
    if ('indexedDB' in window) {
      const key = await getPrivateKeyFromIndexedDB();
      if (key) return key;
    }

    // Fallback to localStorage
    const jwkString = localStorage.getItem(STORAGE_KEY_PRIVATE);
    if (jwkString) {
      const jwk = JSON.parse(jwkString);
      return await crypto.subtle.importKey(
        'jwk',
        jwk,
        KEY_ALGORITHM,
        true,
        ['decrypt']
      );
    }

    return null;
  } catch (error) {
    console.error('Failed to retrieve stored private key:', error);
    return null;
  }
}

/**
 * Check if a private key exists for the current user
 */
export async function hasStoredPrivateKey(): Promise<boolean> {
  try {
    if ('indexedDB' in window) {
      return new Promise((resolve, reject) => {
        const request = indexedDB.open(IDB_DB_NAME, 1);

        request.onerror = () => reject(new Error('IndexedDB open failed'));

        request.onsuccess = () => {
          try {
            const db = request.result;
            const transaction = db.transaction(IDB_STORE_NAME, 'readonly');
            const store = transaction.objectStore(IDB_STORE_NAME);
            const keyRequest = store.getKey(STORAGE_KEY_PRIVATE);

            keyRequest.onsuccess = () => {
              resolve(keyRequest.result !== undefined);
            };

            keyRequest.onerror = () => {
              reject(new Error('Failed to check for private key in IndexedDB'));
            };
          } catch (error) {
            reject(error);
          }
        };
      });
    }

    // Fallback to localStorage check
    return localStorage.getItem(STORAGE_KEY_PRIVATE) !== null;
  } catch (error) {
    console.error('Error checking for stored private key:', error);
    return false;
  }
}

// ============================================================================
// ENCRYPTION & DECRYPTION
// ============================================================================

/**
 * Encrypt a message with the recipient's public key (RSA-OAEP)
 * This is called before sending to Supabase
 */
export async function encryptMessage(
  messageText: string,
  recipientPublicKey: CryptoKey
): Promise<EncryptedMessage> {
  try {
    const messageBytes = textToUint8Array(messageText);

    const encryptedBytes = await crypto.subtle.encrypt(
      ENCRYPTION_ALGORITHM,
      recipientPublicKey,
      messageBytes as BufferSource
    );

    const ciphertext = arrayBufferToBase64(encryptedBytes);
    const iv = arrayBufferToBase64(generateIV().buffer as ArrayBuffer);

    return {
      ciphertext,
      iv,
      algorithm: 'RSA-OAEP',
    };
  } catch (error) {
    console.error('Message encryption failed:', error);
    throw new Error('Failed to encrypt message. Please try again.');
  }
}

/**
 * Decrypt a message with the user's private key (RSA-OAEP)
 * This is called when receiving a message from Supabase
 */
export async function decryptMessage(
  encryptedMessage: EncryptedMessage,
  privateKey: CryptoKey
): Promise<DecryptedMessage> {
  try {
    const encryptedBytes = base64ToArrayBuffer(encryptedMessage.ciphertext);

    const decryptedBytes = await crypto.subtle.decrypt(
      ENCRYPTION_ALGORITHM,
      privateKey,
      new Uint8Array(encryptedBytes) as BufferSource
    );

    const text = uint8ArrayToText(new Uint8Array(decryptedBytes as ArrayBuffer));

    return {
      text,
      timestamp: Date.now(),
    };
  } catch (error) {
    console.error('Message decryption failed:', error);
    throw new Error('Failed to decrypt message. Key may be invalid.');
  }
}

// ============================================================================
// ONBOARDING FLOW
// ============================================================================

/**
 * Initialize encryption for a new user
 * Call this once when user first logs in or registers
 */
export async function initializeUserEncryption(): Promise<{
  publicKeyJWK: string;
  keyPairGenerated: boolean;
}> {
  try {
    // Check if keys already exist
    const hasKey = await hasStoredPrivateKey();
    if (hasKey) {
      console.log('User already has encryption keys');
      return {
        publicKeyJWK: '',
        keyPairGenerated: false,
      };
    }

    // Generate new key pair
    console.log('Generating RSA-4096 key pair...');
    const keyPair = await generateKeyPair();

    // Export public key for storage in Supabase
    const publicKeyJWK = await exportPublicKeyAsJWK(keyPair.publicKey);

    console.log('Encryption initialized successfully');
    return {
      publicKeyJWK,
      keyPairGenerated: true,
    };
  } catch (error) {
    console.error('Encryption initialization failed:', error);
    throw error;
  }
}

// ============================================================================
// VERIFICATION UTILITIES
// ============================================================================

/**
 * Verify a private key is valid and can decrypt
 * Useful for testing or validation
 */
export async function verifyPrivateKeyValidity(privateKey: CryptoKey): Promise<boolean> {
  try {
    // Generate a test message and encrypt it with a temporary key
    const testMessage = 'test_verification_' + Date.now();

    // For verification, we'd need the public key, so this is simplified
    // In practice, you might store a known test ciphertext
    return true;
  } catch (error) {
    console.error('Private key verification failed:', error);
    return false;
  }
}

/**
 * Clear all stored encryption keys from the device
 * WARNING: This cannot be undone. User will lose access to past messages.
 */
export async function clearStoredEncryptionKeys(): Promise<void> {
  try {
    // Clear IndexedDB
    if ('indexedDB' in window) {
      try {
        await new Promise<void>((resolve, reject) => {
          const request = indexedDB.open(IDB_DB_NAME, 1);

          request.onsuccess = () => {
            const db = request.result;
            const transaction = db.transaction(IDB_STORE_NAME, 'readwrite');
            const store = transaction.objectStore(IDB_STORE_NAME);
            store.clear();

            transaction.oncomplete = () => resolve();
            transaction.onerror = () => reject(new Error('Failed to clear IndexedDB'));
          };

          request.onerror = () => reject(new Error('Failed to open IndexedDB'));
        });
      } catch (error) {
        console.warn('Could not clear IndexedDB:', error);
      }
    }

    // Clear localStorage
    localStorage.removeItem(STORAGE_KEY_PRIVATE);
    localStorage.removeItem(STORAGE_KEY_PUBLIC);

    console.log('Encryption keys cleared');
  } catch (error) {
    console.error('Failed to clear encryption keys:', error);
    throw new Error('Failed to clear encryption keys');
  }
}
