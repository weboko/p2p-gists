import React, { useState, useEffect, useRef } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { 
  importAESKey, 
  importPublicKey, 
  decryptData, 
  verifySignature, 
  base64urlDecode, 
  base64urlEncode,
  generateNickname 
} from '../lib/crypto.js';
import { getSnippet } from '../lib/database.js';
import { querySnippet } from '../lib/waku.js';
import { 
  copyToClipboard, 
  formatRelativeTime, 
  getTimeUntilExpiration,
  parseSnippetUrl 
} from '../lib/utils.js';
import { highlightCode } from '../lib/prism.js';

// Icons
const CopyIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>
);

const ShieldCheckIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

const ShieldExclamationIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.618 5.984A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016zM12 9v2m0 4h.01" />
  </svg>
);

const ClockIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const UserIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const LoadingSpinner = () => (
  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600" />
);

export default function ViewSnippet() {
  const { hash } = useParams();
  const location = useLocation();
  const codeRef = useRef(null);
  
  const [snippet, setSnippet] = useState(null);
  const [decryptedCode, setDecryptedCode] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isVerified, setIsVerified] = useState(false);
  const [authorNickname, setAuthorNickname] = useState('');
  const [copyStatus, setCopyStatus] = useState('');
  const [highlightedCode, setHighlightedCode] = useState('');

  useEffect(() => {
    loadSnippet();
  }, [hash, location]);

  const loadSnippet = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Parse URL to get hash and key
      const urlData = parseSnippetUrl(window.location.href);
      if (!urlData) {
        throw new Error('Invalid snippet URL');
      }
      
      const { hash: urlHash, key: keyBase64 } = urlData;
      
      if (urlHash !== hash) {
        throw new Error('URL hash mismatch');
      }
      
      // Try to load from local storage first
      let snippetData = await getSnippet(hash);
      
      // If not found locally, query from Waku network
      if (!snippetData) {
        console.log('Snippet not found locally, querying Waku network...');
        snippetData = await querySnippet(hash, 15000); // 15 second timeout
      }
      
      if (!snippetData) {
        throw new Error('Snippet not found. It may have expired or the URL is invalid.');
      }
      
      // Check if snippet has expired
      const now = new Date();
      const expiryDate = new Date(snippetData.expiresAt);
      if (now > expiryDate) {
        throw new Error('This snippet has expired.');
      }
      
      setSnippet(snippetData);
      
      // Import decryption key
      const keyRaw = base64urlDecode(keyBase64);
      const aesKey = await importAESKey(keyRaw);
      
      // Decrypt the code
      const decrypted = await decryptData(
        snippetData.ciphertext,
        snippetData.iv,
        aesKey
      );
      
      setDecryptedCode(decrypted);
      
      // Verify signature
      await verifySnippetSignature(snippetData, decrypted);
      
      // Generate author nickname
      if (snippetData.authorPubKey) {
        // Generate nickname from public key JWK
        const keyString = JSON.stringify(snippetData.authorPubKey);
        const keyBytes = new TextEncoder().encode(keyString);
        const nickname = generateNickname(keyBytes);
        setAuthorNickname(nickname);
      }
      
    } catch (error) {
      console.error('Failed to load snippet:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const verifySnippetSignature = async (snippetData, decryptedCode) => {
    try {
      // Reconstruct the data that was signed
      const signedData = {
        hash: snippetData.hash,
        ciphertext: base64urlEncode(snippetData.ciphertext),
        iv: base64urlEncode(snippetData.iv),
        authorPubKey: snippetData.authorPubKey,
        authorId: snippetData.authorId,
        algorithm: snippetData.algorithm,
        createdAt: snippetData.createdAt,
        expiresAt: snippetData.expiresAt,
        lines: snippetData.lines,
        language: snippetData.language
      };
      
      const dataToVerify = new TextEncoder().encode(JSON.stringify(signedData));
      
      // Import public key from JWK format
      const publicKey = await importPublicKey(snippetData.authorPubKey);
      
      // Detect algorithm from JWK
      const algorithm = snippetData.authorPubKey.kty === 'OKP' ? 'Ed25519' : 'ECDSA';
      
      // Verify signature
      const isValid = await verifySignature(
        snippetData.signature,
        dataToVerify,
        publicKey,
        algorithm
      );
      
      setIsVerified(isValid);
      
      if (!isValid) {
        console.warn('Snippet signature verification failed');
      }
      
    } catch (error) {
      console.error('Signature verification failed:', error);
      setIsVerified(false);
    }
  };

  // Syntax highlighting
  useEffect(() => {
    if (decryptedCode && snippet) {
      const applyHighlighting = async () => {
        try {
          const language = snippet.language || 'text';
          const highlighted = await highlightCode(decryptedCode, language);
          setHighlightedCode(highlighted);
        } catch (error) {
          console.error('Syntax highlighting failed:', error);
          setHighlightedCode(decryptedCode);
        }
      };
      
      applyHighlighting();
    }
  }, [decryptedCode, snippet]);

  const handleCopy = async () => {
    const success = await copyToClipboard(decryptedCode);
    if (success) {
      setCopyStatus('copied');
      setTimeout(() => setCopyStatus(''), 2000);
    } else {
      setCopyStatus('failed');
      setTimeout(() => setCopyStatus(''), 2000);
    }
  };

  const generateLineNumbers = (code) => {
    const lines = code.split('\n');
    return lines.map((_, index) => (
      <div key={index} className="line-numbers">
        {index + 1}
      </div>
    ));
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-dark-800 rounded-lg shadow-sm border border-gray-200 dark:border-dark-700 p-8">
          <div className="flex items-center justify-center space-x-4">
            <LoadingSpinner />
            <span className="text-gray-600 dark:text-gray-400">Loading snippet...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-dark-800 rounded-lg shadow-sm border border-red-200 dark:border-red-800 p-8">
          <div className="text-center">
            <div className="text-red-600 dark:text-red-400 mb-4">
              <ShieldExclamationIcon className="w-12 h-12 mx-auto" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Unable to Load Snippet
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {error}
            </p>
            <button
              onClick={() => window.location.href = '/'}
              className="btn btn-primary px-6 py-2"
            >
              Create New Snippet
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white dark:bg-dark-800 rounded-lg shadow-sm border border-gray-200 dark:border-dark-700">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-dark-700">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                Code Snippet
              </h1>
              <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center space-x-1">
                  <UserIcon />
                  <span>{authorNickname || 'Anonymous'}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <ClockIcon />
                  <span>{formatRelativeTime(snippet.createdAt)}</span>
                </div>
                <div className="flex items-center space-x-1">
                  {isVerified ? (
                    <>
                      <ShieldCheckIcon className="text-green-600" />
                      <span className="text-green-600">Verified</span>
                    </>
                  ) : (
                    <>
                      <ShieldExclamationIcon className="text-yellow-600" />
                      <span className="text-yellow-600">Unverified</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {snippet.language || 'text'}
              </span>
              <button
                onClick={handleCopy}
                className="btn btn-secondary px-3 py-2"
                title="Copy code"
              >
                <CopyIcon />
              </button>
              {copyStatus && (
                <span className={`text-sm ${
                  copyStatus === 'copied' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {copyStatus === 'copied' ? 'Copied!' : 'Failed to copy'}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Code Display */}
        <div className="code-block">
          <div className="flex">
            {/* Line Numbers */}
            <div className="flex-none py-4 px-3 bg-gray-100 dark:bg-dark-700 text-sm leading-6 line-numbers">
              {generateLineNumbers(decryptedCode)}
            </div>
            
            {/* Code Content */}
            <div className="flex-1 overflow-auto">
              <pre className="p-4 text-sm leading-6 font-mono">
                <code
                  ref={codeRef}
                  className={`language-${snippet.language || 'text'}`}
                  dangerouslySetInnerHTML={{
                    __html: highlightedCode
                  }}
                />
              </pre>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-dark-700 bg-gray-50 dark:bg-dark-700/50">
          <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center space-x-4">
              <span>{snippet.lines} lines</span>
              <span>{Math.round(new TextEncoder().encode(decryptedCode).length / 1024)}KB</span>
            </div>
            <div className="flex items-center space-x-2">
              <ClockIcon />
              <span>
                Expires {getTimeUntilExpiration(snippet.expiresAt)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 