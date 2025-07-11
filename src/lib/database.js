// IndexedDB database layer using Dexie.js
// Following the master plan: store snippets and identity locally

import Dexie from 'dexie';

export class VibeCodingDB extends Dexie {
  constructor() {
    super('VibeCodingDB');
    
          this.version(1).stores({
        snippets: 'hash, ciphertext, iv, authorPubKey, authorId, algorithm, signature, createdAt, expiresAt, lines, language',
        identity: 'id, publicKey, privateKey, algorithm, nickname, createdAt',
        settings: 'key, value'
      });
    
    // Type definitions for better IDE support
    this.snippets = this.table('snippets');
    this.identity = this.table('identity');
    this.settings = this.table('settings');
  }
}

// Create database instance
export const db = new VibeCodingDB();

/**
 * Store a snippet in IndexedDB
 * @param {Object} snippet - Snippet data
 * @returns {Promise<void>}
 */
export async function storeSnippet(snippet) {
  await db.snippets.put(snippet);
}

/**
 * Get a snippet by hash
 * @param {string} hash - Snippet hash
 * @returns {Promise<Object|null>} Snippet data or null
 */
export async function getSnippet(hash) {
  return await db.snippets.get(hash);
}

/**
 * Get all snippets
 * @returns {Promise<Array>} Array of snippets
 */
export async function getAllSnippets() {
  return await db.snippets.toArray();
}

/**
 * Delete a snippet by hash
 * @param {string} hash - Snippet hash
 * @returns {Promise<void>}
 */
export async function deleteSnippet(hash) {
  await db.snippets.delete(hash);
}

/**
 * Clean up expired snippets
 * @returns {Promise<number>} Number of deleted snippets
 */
export async function cleanupExpiredSnippets() {
  const now = new Date().toISOString();
  const expiredSnippets = await db.snippets.where('expiresAt').below(now).toArray();
  
  for (const snippet of expiredSnippets) {
    await db.snippets.delete(snippet.hash);
  }
  
  return expiredSnippets.length;
}

/**
 * Store identity in IndexedDB
 * @param {Object} identity - Identity data
 * @returns {Promise<void>}
 */
export async function storeIdentity(identity) {
  await db.identity.put(identity);
}

/**
 * Get the current identity
 * @returns {Promise<Object|null>} Identity data or null
 */
export async function getIdentity() {
  const identities = await db.identity.toArray();
  return identities.length > 0 ? identities[0] : null;
}

/**
 * Delete all identities
 * @returns {Promise<void>}
 */
export async function clearIdentity() {
  await db.identity.clear();
}

/**
 * Store a setting
 * @param {string} key - Setting key
 * @param {any} value - Setting value
 * @returns {Promise<void>}
 */
export async function setSetting(key, value) {
  await db.settings.put({ key, value });
}

/**
 * Get a setting
 * @param {string} key - Setting key
 * @param {any} defaultValue - Default value if not found
 * @returns {Promise<any>} Setting value
 */
export async function getSetting(key, defaultValue = null) {
  const setting = await db.settings.get(key);
  return setting ? setting.value : defaultValue;
}

/**
 * Get database usage statistics
 * @returns {Promise<Object>} Usage statistics
 */
export async function getDatabaseStats() {
  const snippetCount = await db.snippets.count();
  const identityCount = await db.identity.count();
  const settingCount = await db.settings.count();
  
  // Calculate storage usage (approximate)
  const snippets = await db.snippets.toArray();
  const storageUsed = snippets.reduce((total, snippet) => {
    return total + snippet.ciphertext.length + snippet.signature.length;
  }, 0);
  
  return {
    snippetCount,
    identityCount,
    settingCount,
    storageUsed, // in bytes
    lastCleanup: await getSetting('lastCleanup', null)
  };
}

/**
 * Export all data for backup
 * @returns {Promise<Object>} All database data
 */
export async function exportAllData() {
  const snippets = await db.snippets.toArray();
  const identity = await db.identity.toArray();
  const settings = await db.settings.toArray();
  
  return {
    snippets,
    identity,
    settings,
    exportedAt: new Date().toISOString()
  };
}

/**
 * Import data from backup
 * @param {Object} data - Data to import
 * @returns {Promise<void>}
 */
export async function importAllData(data) {
  await db.transaction('rw', db.snippets, db.identity, db.settings, async () => {
    // Clear existing data
    await db.snippets.clear();
    await db.identity.clear();
    await db.settings.clear();
    
    // Import new data
    if (data.snippets) {
      await db.snippets.bulkAdd(data.snippets);
    }
    if (data.identity) {
      await db.identity.bulkAdd(data.identity);
    }
    if (data.settings) {
      await db.settings.bulkAdd(data.settings);
    }
  });
}

/**
 * Initialize database with cleanup task
 * @returns {Promise<void>}
 */
export async function initDatabase() {
  try {
    // Run cleanup on startup
    const deletedCount = await cleanupExpiredSnippets();
    if (deletedCount > 0) {
      console.log(`Cleaned up ${deletedCount} expired snippets`);
    }
    
    // Store last cleanup time
    await setSetting('lastCleanup', new Date().toISOString());
    
    // Set up periodic cleanup (every hour)
    setInterval(async () => {
      try {
        const deleted = await cleanupExpiredSnippets();
        if (deleted > 0) {
          console.log(`Periodic cleanup: removed ${deleted} expired snippets`);
        }
        await setSetting('lastCleanup', new Date().toISOString());
      } catch (error) {
        console.error('Periodic cleanup failed:', error);
      }
    }, 60 * 60 * 1000); // 1 hour
    
  } catch (error) {
    console.error('Database initialization failed:', error);
    throw error;
  }
} 