// Identity management hook
import { useState, useEffect } from 'react';
import { 
  generateSigningKeyPair, 
  exportKey, 
  importPrivateKey, 
  importPublicKey,
  generateNickname 
} from '../lib/crypto.js';
import { 
  getIdentity, 
  storeIdentity, 
  clearIdentity 
} from '../lib/database.js';

export function useIdentity() {
  const [identity, setIdentity] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load identity on mount
  useEffect(() => {
    loadIdentity();
  }, []);

  const loadIdentity = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const storedIdentity = await getIdentity();
      
      if (storedIdentity) {
        try {
          // Reconstruct crypto keys from stored JWK data
          const publicKey = await importPublicKey(storedIdentity.publicKey);
          const privateKey = await importPrivateKey(storedIdentity.privateKey);
          
          // Detect algorithm from key type
          const algorithm = storedIdentity.publicKey.kty === 'OKP' ? 'Ed25519' : 'ECDSA';
          
          setIdentity({
            id: storedIdentity.id,
            publicKey,
            privateKey,
            publicKeyJWK: storedIdentity.publicKey,
            privateKeyJWK: storedIdentity.privateKey,
            algorithm,
            nickname: storedIdentity.nickname,
            createdAt: storedIdentity.createdAt
          });
        } catch (err) {
          console.warn('Failed to load stored identity, generating new one:', err);
          // Clear corrupted identity and generate new one
          await clearIdentity();
          await generateNewIdentity();
        }
      } else {
        // Generate new identity
        await generateNewIdentity();
      }
    } catch (err) {
      console.error('Failed to load identity:', err);
      setError('Failed to load identity');
    } finally {
      setIsLoading(false);
    }
  };

  const generateNewIdentity = async () => {
    try {
      // Generate signing key pair (Ed25519 with ECDSA fallback)
      const { keyPair, algorithm } = await generateSigningKeyPair();
      
      // Export keys to JWK format
      const publicKeyJWK = await exportKey(keyPair.publicKey);
      const privateKeyJWK = await exportKey(keyPair.privateKey);
      
      // Generate deterministic nickname from public key
      const keyString = JSON.stringify(publicKeyJWK);
      const nickname = generateNickname(new TextEncoder().encode(keyString));
      
      // Create identity ID from public key
      const id = btoa(JSON.stringify(publicKeyJWK)).replace(/[^a-zA-Z0-9]/g, '').slice(0, 32);
      
      // Create identity object
      const newIdentity = {
        id,
        publicKey: keyPair.publicKey,
        privateKey: keyPair.privateKey,
        publicKeyJWK,
        privateKeyJWK,
        algorithm,
        nickname,
        createdAt: new Date().toISOString()
      };
      
      // Store in database
      await storeIdentity({
        id: newIdentity.id,
        publicKey: publicKeyJWK,
        privateKey: privateKeyJWK,
        algorithm,
        nickname: newIdentity.nickname,
        createdAt: newIdentity.createdAt
      });
      
      setIdentity(newIdentity);
      console.log('New identity generated:', newIdentity.nickname, 'using', algorithm);
      
    } catch (err) {
      console.error('Failed to generate identity:', err);
      setError('Failed to generate identity');
      throw err;
    }
  };

  const exportIdentity = async () => {
    if (!identity) {
      throw new Error('No identity to export');
    }
    
    const exportData = {
      id: identity.id,
      publicKey: identity.publicKeyJWK,
      privateKey: identity.privateKeyJWK,
      algorithm: identity.algorithm,
      nickname: identity.nickname,
      createdAt: identity.createdAt,
      exportedAt: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
      type: 'application/json' 
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vibecoding-identity-${identity.nickname}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const importIdentity = async (file) => {
    try {
      const text = await file.text();
      const importData = JSON.parse(text);
      
      // Validate import data
      if (!importData.id || !importData.publicKey || !importData.privateKey) {
        throw new Error('Invalid identity file format');
      }
      
      // Handle legacy format (array of bytes) vs new format (JWK)
      let publicKeyJWK, privateKeyJWK;
      
      if (Array.isArray(importData.publicKey)) {
        // Legacy format - convert to JWK (this is a simplified conversion)
        throw new Error('Legacy identity format not supported. Please generate a new identity.');
      } else {
        // New JWK format
        publicKeyJWK = importData.publicKey;
        privateKeyJWK = importData.privateKey;
      }
      
      // Import crypto keys
      const publicKey = await importPublicKey(publicKeyJWK);
      const privateKey = await importPrivateKey(privateKeyJWK);
      
      // Clear existing identity
      await clearIdentity();
      
      // Store imported identity
      const importedIdentity = {
        id: importData.id,
        publicKey,
        privateKey,
        publicKeyJWK,
        privateKeyJWK,
        algorithm: importData.algorithm || 'Ed25519',
        nickname: importData.nickname,
        createdAt: importData.createdAt
      };
      
      await storeIdentity({
        id: importData.id,
        publicKey: publicKeyJWK,
        privateKey: privateKeyJWK,
        algorithm: importData.algorithm || 'Ed25519',
        nickname: importData.nickname,
        createdAt: importData.createdAt
      });
      
      setIdentity(importedIdentity);
      console.log('Identity imported successfully:', importData.nickname);
      
    } catch (err) {
      console.error('Failed to import identity:', err);
      setError('Failed to import identity');
      throw err;
    }
  };

  const resetIdentity = async () => {
    try {
      await clearIdentity();
      await generateNewIdentity();
    } catch (err) {
      console.error('Failed to reset identity:', err);
      setError('Failed to reset identity');
      throw err;
    }
  };

  return {
    identity,
    isLoading,
    error,
    generateNewIdentity,
    exportIdentity,
    importIdentity,
    resetIdentity,
    hasIdentity: !!identity
  };
} 