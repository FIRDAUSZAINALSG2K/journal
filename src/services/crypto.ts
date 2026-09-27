/**
 * Client-Side Zero-Knowledge Cryptographic Engine
 * Uses the Web Cryptography API (AES-GCM 256-bit with PBKDF2 Key Derivation)
 */

const VERIFIER_PAYLOAD = 'SANCTUARY_KEY_VERIFIED_V1';
const PBKDF2_ITERATIONS = 100000;

// Helper: Convert ArrayBuffer / Uint8Array to Base64
export function bufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

// Helper: Convert Base64 to Uint8Array
export function base64ToBuffer(base64: string): Uint8Array {
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// Generate cryptographically secure random salt (16 bytes)
export function generateSalt(): string {
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  return bufferToBase64(salt);
}

// Generate cryptographically secure random IV (12 bytes for AES-GCM)
export function generateIV(): Uint8Array {
  return window.crypto.getRandomValues(new Uint8Array(12));
}

/**
 * Derive AES-GCM 256-bit key from passphrase and salt using PBKDF2
 */
export async function deriveKey(passphrase: string, saltBase64: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passphraseKey = await window.crypto.subtle.importKey(
    'raw',
    encoder.encode(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  const saltBuffer = base64ToBuffer(saltBase64);

  return await window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBuffer as unknown as BufferSource,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    passphraseKey,
    {
      name: 'AES-GCM',
      length: 256,
    },
    false, // key is non-extractable from memory for security
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt generic serializable object with AES-GCM
 */
export async function encryptData<T>(
  data: T,
  key: CryptoKey
): Promise<{ ciphertext: string; iv: string }> {
  const encoder = new TextEncoder();
  const plaintextBytes = encoder.encode(JSON.stringify(data));
  const iv = generateIV();

  const encryptedBuffer = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv as unknown as BufferSource,
    },
    key,
    plaintextBytes
  );

  return {
    ciphertext: bufferToBase64(encryptedBuffer),
    iv: bufferToBase64(iv),
  };
}

/**
 * Decrypt ciphertext with AES-GCM and parse into target type T
 */
export async function decryptData<T>(
  ciphertextBase64: string,
  ivBase64: string,
  key: CryptoKey
): Promise<T> {
  const ciphertextBuffer = base64ToBuffer(ciphertextBase64);
  const ivBuffer = base64ToBuffer(ivBase64);

  const decryptedBuffer = await window.crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: ivBuffer as unknown as BufferSource,
    },
    key,
    ciphertextBuffer as unknown as BufferSource
  );

  const decoder = new TextDecoder();
  const plaintext = decoder.decode(decryptedBuffer);
  return JSON.parse(plaintext) as T;
}

/**
 * Create a verification payload to store in Firestore
 * This allows the client to verify if a passphrase is correct without sending keys or plaintexts to the server.
 */
export async function createVaultVerifier(key: CryptoKey): Promise<{ ciphertext: string; iv: string }> {
  return await encryptData({ check: VERIFIER_PAYLOAD }, key);
}

/**
 * Verify whether a derived key is capable of decrypting the vault
 */
export async function verifyVaultKey(
  verifier: { ciphertext: string; iv: string },
  key: CryptoKey
): Promise<boolean> {
  try {
    const result = await decryptData<{ check: string }>(verifier.ciphertext, verifier.iv, key);
    return result.check === VERIFIER_PAYLOAD;
  } catch {
    return false;
  }
}
