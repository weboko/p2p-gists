// Utility functions for the P2P Gists app
import clsx from 'clsx';

/**
 * Combine class names using clsx
 * @param {...any} classes - Class names to combine
 * @returns {string} Combined class name
 */
export function cn(...classes) {
  return clsx(...classes);
}

/**
 * Format file size in human-readable format
 * @param {number} bytes - Size in bytes
 * @returns {string} Formatted size
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Format date in relative time
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted date
 */
export function formatRelativeTime(date) {
  const now = new Date();
  const targetDate = new Date(date);
  const diffInSeconds = Math.floor((now - targetDate) / 1000);
  
  if (diffInSeconds < 60) {
    return 'just now';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  }
}

/**
 * Get time until expiration
 * @param {string|Date} expiresAt - Expiration date
 * @returns {string} Time until expiration
 */
export function getTimeUntilExpiration(expiresAt) {
  const now = new Date();
  const expiry = new Date(expiresAt);
  const diffInSeconds = Math.floor((expiry - now) / 1000);
  
  if (diffInSeconds <= 0) {
    return 'expired';
  }
  
  if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes}m`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours}h`;
  } else {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days}d`;
  }
}

/**
 * Detect programming language from code content
 * @param {string} code - Code to analyze
 * @returns {string} Detected language
 */
export function detectLanguage(code) {
  const patterns = {
    javascript: [
      /^(import|export)\s+/m,
      /\bconst\s+\w+\s*=\s*require\(/,
      /\bfunction\s*\(/,
      /\bvar\s+\w+\s*=\s*/,
      /\blet\s+\w+\s*=\s*/,
      /\bconst\s+\w+\s*=\s*/,
      /\b(async|await)\b/,
      /\bconsole\.log\(/,
      /\b(JSON|Promise|Array|Object)\b/
    ],
    python: [
      /^from\s+\w+\s+import\s+/m,
      /^import\s+\w+/m,
      /^def\s+\w+\s*\(/m,
      /^class\s+\w+\s*:/m,
      /\bprint\s*\(/,
      /\bif\s+__name__\s*==\s*['""]__main__['""]:/,
      /\b(self|cls)\b/,
      /\bwith\s+\w+\s*as\s+\w+:/
    ],
    java: [
      /^package\s+[\w.]+;/m,
      /^import\s+[\w.]+;/m,
      /\bpublic\s+class\s+\w+/,
      /\bpublic\s+static\s+void\s+main\(/,
      /\bSystem\.out\.println\(/,
      /\b(public|private|protected)\s+(static\s+)?[\w<>]+\s+\w+\s*\(/
    ],
    cpp: [
      /^#include\s*<[\w.]+>/m,
      /\bstd::/,
      /\busing\s+namespace\s+std;/,
      /\bint\s+main\s*\(/,
      /\bcout\s*<<\s*/,
      /\bcin\s*>>\s*/,
      /\b(public|private|protected):/
    ],
    go: [
      /^package\s+\w+/m,
      /^import\s+\(/m,
      /\bfunc\s+\w+\s*\(/,
      /\bfmt\.Print/,
      /\bvar\s+\w+\s+\w+/,
      /\b:=\s*/,
      /\bgo\s+\w+\(/
    ],
    rust: [
      /^use\s+[\w:]+;/m,
      /\bfn\s+\w+\s*\(/,
      /\blet\s+\w+\s*=\s*/,
      /\blet\s+mut\s+\w+\s*=\s*/,
      /\bprintln!\s*\(/,
      /\bmatch\s+\w+\s*\{/,
      /\bimpl\s+\w+/
    ],
    css: [
      /^[.#]?[\w-]+\s*\{/m,
      /\b(color|background|margin|padding|font|width|height):\s*/,
      /@(media|import|keyframes)\s+/,
      /\b(px|em|rem|vh|vw|%)\b/
    ],
    html: [
      /^<!DOCTYPE\s+html>/i,
      /<html[\s>]/i,
      /<\/?(div|p|span|h[1-6]|a|img|ul|ol|li)[\s>]/i,
      /<\w+[^>]*>/
    ],
    sql: [
      /\b(SELECT|INSERT|UPDATE|DELETE|CREATE|DROP|ALTER|TABLE)\b/i,
      /\b(FROM|WHERE|JOIN|GROUP BY|ORDER BY|HAVING)\b/i,
      /\b(INT|VARCHAR|TEXT|DATE|TIMESTAMP)\b/i
    ],
    json: [
      /^\s*\{/,
      /^\s*\[/,
      /^[\s\S]*\}[\s\S]*$/
    ],
    xml: [
      /^<\?xml\s+version=/i,
      /<\/\w+>/,
      /<\w+[^>]*\/>/
    ],
    yaml: [
      /^[\w-]+:\s*$/m,
      /^[\w-]+:\s+[\w-]+$/m,
      /^\s*-\s+/m
    ],
    markdown: [
      /^#{1,6}\s+/m,
      /^\*\*[\s\S]*?\*\*$/m,
      /^\*[\s\S]*?\*$/m,
      /^```[\s\S]*?```$/m,
      /^\[[\s\S]*?\]\([\s\S]*?\)$/m
    ],
    shell: [
      /^#!/,
      /\$\w+/,
      /\becho\s+/,
      /\bcd\s+/,
      /\b(ls|pwd|mkdir|rm|mv|cp)\b/,
      /\||&&|\|\|/
    ]
  };
  
  let maxScore = 0;
  let detectedLanguage = 'text';
  
  for (const [language, langPatterns] of Object.entries(patterns)) {
    let score = 0;
    for (const pattern of langPatterns) {
      if (pattern.test(code)) {
        score++;
      }
    }
    
    if (score > maxScore) {
      maxScore = score;
      detectedLanguage = language;
    }
  }
  
  return detectedLanguage;
}

/**
 * Validate code snippet
 * @param {string} code - Code to validate
 * @returns {Object} Validation result
 */
export function validateSnippet(code) {
  const errors = [];
  const warnings = [];
  
  if (!code || code.trim().length === 0) {
    errors.push('Code cannot be empty');
  }
  
  const lines = code.split('\n');
  
  if (lines.length > 500) {
    errors.push('Code snippet cannot exceed 500 lines');
  }
  
  const totalSize = new TextEncoder().encode(code).length;
  if (totalSize > 64 * 1024) { // 64KB limit
    errors.push('Code snippet cannot exceed 64KB');
  }
  
  if (lines.length > 100) {
    warnings.push('Large snippet may take longer to load');
  }
  
  // Check for potentially sensitive data
  const sensitivePatterns = [
    /password\s*[:=]\s*['""][^'"]*['"]/i,
    /api[_-]?key\s*[:=]\s*['""][^'"]*['"]/i,
    /secret\s*[:=]\s*['""][^'"]*['"]/i,
    /token\s*[:=]\s*['""][^'"]*['"]/i,
    /-----BEGIN\s+PRIVATE\s+KEY-----/i
  ];
  
  for (const pattern of sensitivePatterns) {
    if (pattern.test(code)) {
      warnings.push('Code may contain sensitive information');
      break;
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    lines: lines.length,
    size: totalSize,
    language: detectLanguage(code)
  };
}

/**
 * Generate a shortened URL for sharing
 * @param {string} hash - Snippet hash
 * @param {string} key - Base64url encoded key
 * @returns {string} Shortened URL
 */
export function generateShareUrl(hash, key) {
  const baseUrl = window.location.origin;
  return `${baseUrl}/s/${hash}#${key}`;
}

/**
 * Parse snippet URL to extract hash and key
 * @param {string} url - URL to parse
 * @returns {Object|null} Parsed components or null
 */
export function parseSnippetUrl(url) {
  try {
    const urlObj = new URL(url);
    const pathMatch = urlObj.pathname.match(/^\/s\/([a-f0-9]+)$/);
    
    if (!pathMatch) {
      return null;
    }
    
    const hash = pathMatch[1];
    const key = urlObj.hash.substring(1); // Remove #
    
    if (!hash || !key) {
      return null;
    }
    
    return { hash, key };
  } catch (error) {
    return null;
  }
}

/**
 * Copy text to clipboard
 * @param {string} text - Text to copy
 * @returns {Promise<boolean>} Success status
 */
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    // Fallback for older browsers
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const success = document.execCommand('copy');
      document.body.removeChild(textArea);
      return success;
    } catch (fallbackError) {
      console.error('Failed to copy to clipboard:', fallbackError);
      return false;
    }
  }
}

/**
 * Debounce function calls
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function calls
 * @param {Function} func - Function to throttle
 * @param {number} limit - Time limit in milliseconds
 * @returns {Function} Throttled function
 */
export function throttle(func, limit) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
} 