// Waku P2P networking layer
// Following the master plan: use Waku v2 for peer-to-peer snippet sharing

import { createLightNode, waitForRemotePeer } from '@waku/sdk';
import { base64urlEncode, base64urlDecode } from './crypto.js';

// Waku configuration
const WAKU_TOPIC = '/p2p-gists/1/snippets/proto';
// const BOOTSTRAP_PEERS = [
//   '/dns4/node-01.ac-cn-hongkong-c.wakuv2.test.statusim.net/tcp/30303/p2p/16Uiu2HAkvWiyFsgRhuJEb9JfjYxEkoHLgnUQmr1N5mKWnYjxYRVm',
//   '/dns4/node-01.do-ams3.wakuv2.test.statusim.net/tcp/30303/p2p/16Uiu2HAmL5okWopX7NqZWBUKVqW8iUxCEmd5GMHLVPwCgzYzQv3e',
// ];

let wakuNode = null;
let isConnected = false;
let connectionPromise = null;

/**
 * Initialize Waku node
 * @returns {Promise<void>}
 */
export async function initWaku() {
  if (connectionPromise) {
    return connectionPromise;
  }
  
  if (wakuNode && isConnected) {
    return;
  }
  
  connectionPromise = (async () => {
    try {
      console.log('Initializing Waku node...');
      
      // Create light node (suitable for browsers)
      wakuNode = await createLightNode({
        defaultBootstrap: false,
        networkConfig: {
            clusterId: 42,
            shards: [0]
        },
      });
      
      // Start the node
      await wakuNode.start();

      window["waku"] = wakuNode;
      
      // Connect to bootstrap peers
      // await Promise.all(
      //   BOOTSTRAP_PEERS.map(peer => 
      //     wakuNode.dial(peer).catch(err => 
      //       console.warn(`Failed to connect to ${peer}:`, err.message)
      //     )
      //   )
      // );
      await Promise.allSettled([
        wakuNode.dial("/dns4/waku-test.bloxy.one/tcp/8095/wss/p2p/16Uiu2HAmSZbDB7CusdRhgkD81VssRjQV5ZH13FbzCGcdnbbh6VwZ"),
        wakuNode.dial("/dns4/vps-aaa00d52.vps.ovh.ca/tcp/8000/wss/p2p/16Uiu2HAm9PftGgHZwWE3wzdMde4m3kT2eYJFXLZfGoSED3gysofk")
      ]);
      
      // Wait for at least one peer connection
      await waitForRemotePeer(wakuNode);
      
      isConnected = true;
      console.log('Waku node initialized successfully');
      
    } catch (error) {
      console.error('Failed to initialize Waku:', error);
      isConnected = false;
      wakuNode = null;
      throw error;
    }
  })();
  
  return connectionPromise;
}

/**
 * Check if Waku is connected
 * @returns {boolean}
 */
export function isWakuConnected() {
  return isConnected && wakuNode !== null;
}

/**
 * Get Waku node instance
 * @returns {Object|null} Waku node or null
 */
export function getWakuNode() {
  return wakuNode;
}

/**
 * Publish a snippet to Waku network
 * @param {Object} snippet - Snippet data
 * @returns {Promise<boolean>} Success status
 */
export async function publishSnippet(snippet) {
  if (!isWakuConnected()) {
    throw new Error('Waku not connected');
  }
  
  try {
    // Prepare message payload
    const payload = {
      hash: snippet.hash,
      ciphertext: base64urlEncode(snippet.ciphertext),
      iv: base64urlEncode(snippet.iv),
      authorPubKey: snippet.authorPubKey,
      signature: base64urlEncode(snippet.signature),
      createdAt: snippet.createdAt,
      expiresAt: snippet.expiresAt,
      lines: snippet.lines,
      language: snippet.language || 'text'
    };
    
    // Create message
    const message = {
      payload: new TextEncoder().encode(JSON.stringify(payload)),
    };
    
    // Publish message
    const result = await wakuNode.lightPush.send(wakuNode.createEncoder({
      contentTopic: WAKU_TOPIC,
      shardInfo: {
        clusterId: 42,
        shardsUnderCluster: 1
      }
    }), message);
    
    if (result.successes.length > 0) {
      console.log(`Snippet ${snippet.hash} published successfully`);
      return true;
    } else {
      console.error('Failed to publish snippet:', result.failures);
      return false;
    }
    
  } catch (error) {
    console.error('Error publishing snippet:', error);
    return false;
  }
}

/**
 * Query snippets from Waku network
 * @param {string} hash - Snippet hash to search for
 * @param {number} timeoutMs - Query timeout in milliseconds
 * @returns {Promise<Object|null>} Snippet data or null
 */
export async function querySnippet(hash, timeoutMs = 10000) {
  if (!isWakuConnected()) {
    throw new Error('Waku not connected');
  }
  
  try {
    console.log(`Querying snippet ${hash}...`);
    
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        resolve(null);
      }, timeoutMs);
      
      let found = false;
      
      // Query historical messages
      const callback = (wakuMessage) => {
        if (found) return;
        
        try {
          const payloadStr = new TextDecoder().decode(wakuMessage.payload);
          const payload = JSON.parse(payloadStr);
          
          if (payload.hash === hash) {
            found = true;
            clearTimeout(timeout);
            
            // Decode binary data
            const snippet = {
              hash: payload.hash,
              ciphertext: base64urlDecode(payload.ciphertext),
              iv: base64urlDecode(payload.iv),
              authorPubKey: payload.authorPubKey,
              signature: base64urlDecode(payload.signature),
              createdAt: payload.createdAt,
              expiresAt: payload.expiresAt,
              lines: payload.lines,
              language: payload.language || 'text'
            };
            
            resolve(snippet);
          }
        } catch (error) {
          console.error('Error processing Waku message:', error);
        }
      };
      
      // Start query
      wakuNode.store.queryOrderedCallback(
        [wakuNode.createDecoder({ contentTopic: WAKU_TOPIC })],
        callback,
        {
          timeFilter: {
            startTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
            endTime: new Date()
          }
        }
      ).catch(error => {
        clearTimeout(timeout);
        reject(error);
      });
    });
    
  } catch (error) {
    console.error('Error querying snippet:', error);
    return null;
  }
}

/**
 * Subscribe to new snippets
 * @param {Function} callback - Callback function for new snippets
 * @returns {Function} Unsubscribe function
 */
export function subscribeToSnippets(callback) {
  if (!isWakuConnected()) {
    throw new Error('Waku not connected');
  }
  
  const messageCallback = (wakuMessage) => {
    try {
      const payloadStr = new TextDecoder().decode(wakuMessage.payload);
      const payload = JSON.parse(payloadStr);
      
      // Decode binary data
      const snippet = {
        hash: payload.hash,
        ciphertext: base64urlDecode(payload.ciphertext),
        iv: base64urlDecode(payload.iv),
        authorPubKey: payload.authorPubKey,
        signature: base64urlDecode(payload.signature),
        createdAt: payload.createdAt,
        expiresAt: payload.expiresAt,
        lines: payload.lines,
        language: payload.language || 'text'
      };
      
      callback(snippet);
    } catch (error) {
      console.error('Error processing subscribed message:', error);
    }
  };
  
  // Subscribe to filter
  const unsubscribe = wakuNode.filter.subscribe(
    wakuNode.createDecoder({ contentTopic: WAKU_TOPIC }),
    messageCallback
  );
  
  return unsubscribe;
}

/**
 * Stop Waku node
 * @returns {Promise<void>}
 */
export async function stopWaku() {
  if (wakuNode) {
    try {
      await wakuNode.stop();
      console.log('Waku node stopped');
    } catch (error) {
      console.error('Error stopping Waku:', error);
    } finally {
      wakuNode = null;
      isConnected = false;
      connectionPromise = null;
    }
  }
}

/**
 * Get network statistics
 * @returns {Object} Network statistics
 */
export function getNetworkStats() {
  if (!wakuNode) {
    return {
      connected: false,
      peers: 0,
      protocols: []
    };
  }
  
  return {
    connected: isConnected,
    peers: wakuNode.libp2p.getPeers().length,
    protocols: Array.from(wakuNode.libp2p.getProtocols()),
    multiaddrs: wakuNode.libp2p.getMultiaddrs().map(addr => addr.toString())
  };
}

/**
 * Reconnect to Waku network
 * @returns {Promise<void>}
 */
export async function reconnectWaku() {
  console.log('Reconnecting to Waku network...');
  await stopWaku();
  await initWaku();
} 