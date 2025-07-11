// Cryptographic utilities using Web Crypto API
// Following the master plan: AES-GCM for content encryption, Ed25519 for signatures

/**
 * Generate a random AES-GCM key
 * @returns {Promise<CryptoKey>}
 */
export async function generateAESKey() {
  return await crypto.subtle.generateKey(
    {
      name: 'AES-GCM',
      length: 256,
    },
    true,
    ['encrypt', 'decrypt']
  );
}

/**
 * Generate signing key pair (Ed25519 with ECDSA fallback)
 * @returns {Promise<{keyPair: CryptoKeyPair, algorithm: string}>}
 */
export async function generateSigningKeyPair() {
  // Try Ed25519 first
  try {
    const keyPair = await crypto.subtle.generateKey(
      {
        name: 'Ed25519',
      },
      true,
      ['sign', 'verify']
    );
    return { keyPair, algorithm: 'Ed25519' };
  } catch (error) {
    console.warn('Ed25519 not supported, falling back to ECDSA P-256');
    
    // Fallback to ECDSA P-256
    const keyPair = await crypto.subtle.generateKey(
      {
        name: 'ECDSA',
        namedCurve: 'P-256',
      },
      true,
      ['sign', 'verify']
    );
    return { keyPair, algorithm: 'ECDSA' };
  }
}

/**
 * Encrypt data using AES-GCM
 * @param {string} data - Data to encrypt
 * @param {CryptoKey} key - AES key
 * @returns {Promise<{ciphertext: Uint8Array, iv: Uint8Array}>}
 */
export async function encryptData(data, key) {
  const encoder = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV for GCM
  
  const ciphertext = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    key,
    encoder.encode(data)
  );
  
  return {
    ciphertext: new Uint8Array(ciphertext),
    iv: iv,
  };
}

/**
 * Decrypt data using AES-GCM
 * @param {Uint8Array} ciphertext - Encrypted data
 * @param {Uint8Array} iv - Initialization vector
 * @param {CryptoKey} key - AES key
 * @returns {Promise<string>} Decrypted data
 */
export async function decryptData(ciphertext, iv, key) {
  const decoder = new TextDecoder();
  
  const decrypted = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    key,
    ciphertext
  );
  
  return decoder.decode(decrypted);
}

/**
 * Sign data using the key's algorithm
 * @param {Uint8Array} data - Data to sign
 * @param {CryptoKey} privateKey - Private key
 * @param {string} algorithm - Algorithm name ('Ed25519' or 'ECDSA')
 * @returns {Promise<Uint8Array>} Signature
 */
export async function signData(data, privateKey, algorithm = 'Ed25519') {
  let signAlgorithm;
  
  if (algorithm === 'Ed25519') {
    signAlgorithm = 'Ed25519';
  } else {
    signAlgorithm = {
      name: 'ECDSA',
      hash: 'SHA-256',
    };
  }
  
  const signature = await crypto.subtle.sign(signAlgorithm, privateKey, data);
  return new Uint8Array(signature);
}

/**
 * Verify signature using the key's algorithm
 * @param {Uint8Array} signature - Signature to verify
 * @param {Uint8Array} data - Original data
 * @param {CryptoKey} publicKey - Public key
 * @param {string} algorithm - Algorithm name ('Ed25519' or 'ECDSA')
 * @returns {Promise<boolean>} Verification result
 */
export async function verifySignature(signature, data, publicKey, algorithm = 'Ed25519') {
  let verifyAlgorithm;
  
  if (algorithm === 'Ed25519') {
    verifyAlgorithm = 'Ed25519';
  } else {
    verifyAlgorithm = {
      name: 'ECDSA',
      hash: 'SHA-256',
    };
  }
  
  return await crypto.subtle.verify(verifyAlgorithm, publicKey, signature, data);
}

/**
 * Generate SHA-256 hash
 * @param {Uint8Array} data - Data to hash
 * @returns {Promise<string>} Hex-encoded hash
 */
export async function generateHash(data) {
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Export key to JWK format
 * @param {CryptoKey} key - Key to export
 * @returns {Promise<Object>} Exported key in JWK format
 */
export async function exportKey(key) {
  return await crypto.subtle.exportKey('jwk', key);
}

/**
 * Export AES key to raw format
 * @param {CryptoKey} key - AES key to export
 * @returns {Promise<Uint8Array>} Exported key in raw format
 */
export async function exportAESKey(key) {
  const exported = await crypto.subtle.exportKey('raw', key);
  return new Uint8Array(exported);
}

/**
 * Import AES key from raw format
 * @param {Uint8Array} keyData - Raw key data
 * @returns {Promise<CryptoKey>} Imported key
 */
export async function importAESKey(keyData) {
  return await crypto.subtle.importKey(
    'raw',
    keyData,
    {
      name: 'AES-GCM',
      length: 256,
    },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Import public key from JWK format
 * @param {Object} keyData - JWK key data
 * @returns {Promise<CryptoKey>} Imported public key
 */
export async function importPublicKey(keyData) {
  // Determine algorithm based on key type
  const algorithm = keyData.kty === 'OKP' ? 
    { name: 'Ed25519' } : 
    { name: 'ECDSA', namedCurve: 'P-256' };
  
  return await crypto.subtle.importKey(
    'jwk',
    keyData,
    algorithm,
    false,
    ['verify']
  );
}

/**
 * Import private key from JWK format
 * @param {Object} keyData - JWK key data
 * @returns {Promise<CryptoKey>} Imported private key
 */
export async function importPrivateKey(keyData) {
  // Determine algorithm based on key type
  const algorithm = keyData.kty === 'OKP' ? 
    { name: 'Ed25519' } : 
    { name: 'ECDSA', namedCurve: 'P-256' };
  
  return await crypto.subtle.importKey(
    'jwk',
    keyData,
    algorithm,
    false,
    ['sign']
  );
}

/**
 * Generate a deterministic nickname from public key
 * @param {Uint8Array} publicKeyRaw - Raw public key
 * @returns {string} 6-character nickname
 */
export function generateNickname(publicKeyRaw) {
  const hash = Array.from(publicKeyRaw.slice(0, 3))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  return hash.toUpperCase();
}

/**
 * Encode data to base64url (URL-safe base64)
 * @param {Uint8Array} data - Data to encode
 * @returns {string} Base64url encoded string
 */
export function base64urlEncode(data) {
  const base64 = btoa(String.fromCharCode(...data));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

/**
 * Decode base64url to Uint8Array
 * @param {string} base64url - Base64url encoded string
 * @returns {Uint8Array} Decoded data
 */
export function base64urlDecode(base64url) {
  const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(base64.length + (4 - base64.length % 4) % 4, '=');
  const binary = atob(padded);
  return new Uint8Array(binary.split('').map(c => c.charCodeAt(0)));
} 