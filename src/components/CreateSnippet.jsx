import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useIdentity } from '../hooks/useIdentity.js';
import { 
  generateAESKey, 
  encryptData, 
  exportAESKey, 
  signData, 
  generateHash,
  base64urlEncode 
} from '../lib/crypto.js';
import { storeSnippet } from '../lib/database.js';
import { publishSnippet, isWakuConnected } from '../lib/waku.js';
import { 
  validateSnippet, 
  generateShareUrl, 
  copyToClipboard, 
  debounce 
} from '../lib/utils.js';
// Note: Prism is handled by the prism.js module, no direct imports needed here

// Icons
const SendIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
  </svg>
);

const CopyIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>
);

const AlertIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.952-.833-2.732 0L4.268 15.5c-.77.833.192 2.5 1.732 2.5z" />
  </svg>
);

const CheckIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

export default function CreateSnippet() {
  const navigate = useNavigate();
  const { identity } = useIdentity();
  const textareaRef = useRef(null);
  
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('auto');
  const [isCreating, setIsCreating] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [validation, setValidation] = useState(null);
  const [copyStatus, setCopyStatus] = useState('');
  const [wakuStatus, setWakuStatus] = useState('connecting');

  // Check Waku connection status
  useEffect(() => {
    const checkWakuStatus = () => {
      setWakuStatus(isWakuConnected() ? 'connected' : 'connecting');
    };
    
    checkWakuStatus();
    const interval = setInterval(checkWakuStatus, 2000);
    return () => clearInterval(interval);
  }, []);

  // Debounced validation
  useEffect(() => {
    const debouncedValidate = debounce((codeValue) => {
      if (codeValue.trim()) {
        setValidation(validateSnippet(codeValue));
      } else {
        setValidation(null);
      }
    }, 300);

    debouncedValidate(code);
  }, [code]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [code]);

  const handleCreate = async () => {
    if (!identity) {
      alert('Identity not loaded. Please wait and try again.');
      return;
    }

    if (!validation?.isValid) {
      return;
    }

    try {
      setIsCreating(true);
      
      // Generate AES key for encryption
      const aesKey = await generateAESKey();
      const keyRaw = await exportAESKey(aesKey);
      
      // Encrypt the code
      const { ciphertext, iv } = await encryptData(code, aesKey);
      
      // Generate hash for the snippet
      const hash = await generateHash(ciphertext);
      
      // Create snippet metadata
      const snippetData = {
        hash,
        ciphertext,
        iv,
        authorPubKey: identity.publicKeyJWK,
        authorId: identity.id,
        algorithm: identity.algorithm,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
        lines: validation.lines,
        language: language === 'auto' ? validation.language : language
      };
      
      // Sign the snippet
      const dataToSign = new TextEncoder().encode(
        JSON.stringify({
          hash: snippetData.hash,
          ciphertext: base64urlEncode(ciphertext),
          iv: base64urlEncode(iv),
          authorPubKey: snippetData.authorPubKey,
          authorId: snippetData.authorId,
          algorithm: snippetData.algorithm,
          createdAt: snippetData.createdAt,
          expiresAt: snippetData.expiresAt,
          lines: snippetData.lines,
          language: snippetData.language
        })
      );
      
      const signature = await signData(dataToSign, identity.privateKey, identity.algorithm);
      snippetData.signature = signature;
      
      // Store locally first
      await storeSnippet(snippetData);
      
      // Generate share URL
      const url = generateShareUrl(hash, base64urlEncode(keyRaw));
      setShareUrl(url);
      
      // Publish to Waku network (non-blocking)
      if (isWakuConnected()) {
        publishSnippet(snippetData).catch(error => {
          console.warn('Failed to publish to Waku:', error);
        });
      }
      
      console.log('Snippet created successfully:', hash);
      
    } catch (error) {
      console.error('Failed to create snippet:', error);
      console.error('Error details:', error.message, error.stack);
      alert(`Failed to create snippet: ${error.message || 'Unknown error'}. Please try again.`);
    } finally {
      setIsCreating(false);
    }
  };

  const handleCopy = async () => {
    if (!shareUrl) return;
    
    const success = await copyToClipboard(shareUrl);
    if (success) {
      setCopyStatus('copied');
      setTimeout(() => setCopyStatus(''), 2000);
    } else {
      setCopyStatus('failed');
      setTimeout(() => setCopyStatus(''), 2000);
    }
  };

  const handleReset = () => {
    setCode('');
    setLanguage('auto');
    setShareUrl('');
    setValidation(null);
    setCopyStatus('');
  };

  const canCreate = validation?.isValid && !isCreating && identity;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white dark:bg-dark-800 rounded-lg shadow-sm border border-gray-200 dark:border-dark-700">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-dark-700">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                Create Code Snippet
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Share code securely with end-to-end encryption
              </p>
            </div>
            
            {/* Language Selector */}
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Language:
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="input w-32"
              >
                <option value="auto">Auto-detect</option>
                <option value="javascript">JavaScript</option>
                <option value="python">Python</option>
                <option value="java">Java</option>
                <option value="cpp">C++</option>
                <option value="go">Go</option>
                <option value="rust">Rust</option>
                <option value="css">CSS</option>
                <option value="html">HTML</option>
                <option value="sql">SQL</option>
                <option value="json">JSON</option>
                <option value="yaml">YAML</option>
                <option value="markdown">Markdown</option>
                <option value="bash">Shell</option>
                <option value="text">Plain Text</option>
              </select>
            </div>
          </div>
        </div>

        {/* Code Input */}
        <div className="p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Code
              </label>
              <textarea
                ref={textareaRef}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Paste your code here..."
                className="textarea w-full min-h-[300px] font-mono text-sm resize-none"
                autoFocus
              />
            </div>

            {/* Validation Messages */}
            {validation && (
              <div className="space-y-2">
                {validation.errors.map((error, index) => (
                  <div key={index} className="flex items-center space-x-2 text-red-600 dark:text-red-400">
                    <AlertIcon />
                    <span className="text-sm">{error}</span>
                  </div>
                ))}
                
                {validation.warnings.map((warning, index) => (
                  <div key={index} className="flex items-center space-x-2 text-yellow-600 dark:text-yellow-400">
                    <AlertIcon />
                    <span className="text-sm">{warning}</span>
                  </div>
                ))}
                
                {validation.isValid && (
                  <div className="flex items-center space-x-2 text-green-600 dark:text-green-400">
                    <CheckIcon />
                    <span className="text-sm">
                      {validation.lines} lines, {Math.round(validation.size / 1024)}KB
                      {validation.language !== 'text' && ` (${validation.language})`}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Status Bar */}
            <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center space-x-4">
                <span>Network: {wakuStatus}</span>
                <span>Identity: {identity?.nickname || 'Loading...'}</span>
              </div>
              <div>
                TTL: 7 days
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-dark-700 bg-gray-50 dark:bg-dark-700/50">
          <div className="flex items-center justify-between">
            <div>
              {shareUrl && (
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={shareUrl}
                    readOnly
                    className="input w-80 text-sm font-mono"
                  />
                  <button
                    onClick={handleCopy}
                    className="btn btn-secondary px-3 py-2"
                    title="Copy URL"
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
              )}
            </div>
            
            <div className="flex space-x-3">
              {shareUrl && (
                <button
                  onClick={handleReset}
                  className="btn btn-secondary px-4 py-2"
                >
                  New Snippet
                </button>
              )}
              
              <button
                onClick={handleCreate}
                disabled={!canCreate}
                className="btn btn-primary px-6 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCreating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    <span className="ml-2">Creating...</span>
                  </>
                ) : (
                  <>
                    <SendIcon />
                    <span className="ml-2">Create Snippet</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 