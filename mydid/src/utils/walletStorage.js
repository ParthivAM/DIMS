/**
 * Wallet Storage Utility
 * Local-only persistence for UI state (IndexedDB/localStorage)
 * Does NOT affect blockchain, IPFS, or backend state
 */

const STORAGE_VERSION = 1;
const DB_NAME = 'WalletUIStorage';

// Storage keys
const KEYS = {
  VERIFIER_HISTORY: 'verifier_history',
  ISSUER_HIDDEN: 'issuer_hidden',
  HOLDER_HIDDEN_CREDS: 'holder_hidden_creds',
  HOLDER_HIDDEN_REQUESTS: 'holder_hidden_requests',
};

/**
 * Get storage key with user context
 * @param {string} baseKey - Base storage key
 * @param {string} userAddress - User wallet address
 * @param {string} role - User role (issuer/holder/verifier)
 * @returns {string} Namespaced key
 */
function getStorageKey(baseKey, userAddress, role) {
  return `${baseKey}_${role}_${userAddress?.toLowerCase() || 'anonymous'}`;
}

/**
 * Get from localStorage with JSON parsing
 * @param {string} key - Storage key
 * @param {*} defaultValue - Default value if not found
 * @returns {*} Parsed value or default
 */
function getLocal(key, defaultValue = null) {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error('Error reading from localStorage:', error);
    return defaultValue;
  }
}

/**
 * Set to localStorage with JSON stringification
 * @param {string} key - Storage key
 * @param {*} value - Value to store
 */
function setLocal(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('Error writing to localStorage:', error);
  }
}

// ============================================================================
// VERIFIER HISTORY
// ============================================================================

/**
 * Save verification result to history
 * @param {Object} item - Verification result
 * @param {string} item.cid - IPFS CID
 * @param {string} item.issuerDid - Issuer DID
 * @param {string} item.subjectDid - Subject DID
 * @param {string} item.vcType - VC type
 * @param {'verified'|'failed'} item.result - Verification result
 * @param {boolean} item.chainHashMatch - Blockchain hash match
 * @param {string} userAddress - Verifier address
 */
export function saveVerifierHistory(item, userAddress = 'anonymous') {
  const key = getStorageKey(KEYS.VERIFIER_HISTORY, userAddress, 'verifier');
  const history = getLocal(key, []);
  
  const newItem = {
    id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
    ...item
  };
  
  history.unshift(newItem); // Add to beginning
  
  // Keep only last 100 items
  if (history.length > 100) {
    history.splice(100);
  }
  
  setLocal(key, history);
  return newItem;
}

/**
 * Get verifier history
 * @param {string} userAddress - Verifier address
 * @returns {Array} History items
 */
export function listVerifierHistory(userAddress = 'anonymous') {
  const key = getStorageKey(KEYS.VERIFIER_HISTORY, userAddress, 'verifier');
  return getLocal(key, []);
}

/**
 * Delete single history item
 * @param {string} id - Item ID
 * @param {string} userAddress - Verifier address
 */
export function deleteHistoryItem(id, userAddress = 'anonymous') {
  const key = getStorageKey(KEYS.VERIFIER_HISTORY, userAddress, 'verifier');
  const history = getLocal(key, []);
  const filtered = history.filter(item => item.id !== id);
  setLocal(key, filtered);
}

/**
 * Clear all verifier history
 * @param {string} userAddress - Verifier address
 */
export function clearVerifierHistory(userAddress = 'anonymous') {
  const key = getStorageKey(KEYS.VERIFIER_HISTORY, userAddress, 'verifier');
  setLocal(key, []);
}

// ============================================================================
// ISSUER VIEW STATE
// ============================================================================

/**
 * Hide credential from issuer view (local only)
 * @param {string} cid - Credential CID
 * @param {string} userAddress - Issuer address
 */
export function hideIssuerCredential(cid, userAddress) {
  const key = getStorageKey(KEYS.ISSUER_HIDDEN, userAddress, 'issuer');
  const hidden = getLocal(key, []);
  
  if (!hidden.includes(cid)) {
    hidden.push(cid);
    setLocal(key, hidden);
  }
}

/**
 * Check if credential is hidden in issuer view
 * @param {string} cid - Credential CID
 * @param {string} userAddress - Issuer address
 * @returns {boolean} True if hidden
 */
export function isIssuerCredentialHidden(cid, userAddress) {
  const key = getStorageKey(KEYS.ISSUER_HIDDEN, userAddress, 'issuer');
  const hidden = getLocal(key, []);
  return hidden.includes(cid);
}

/**
 * Unhide credential in issuer view
 * @param {string} cid - Credential CID
 * @param {string} userAddress - Issuer address
 */
export function unhideIssuerCredential(cid, userAddress) {
  const key = getStorageKey(KEYS.ISSUER_HIDDEN, userAddress, 'issuer');
  const hidden = getLocal(key, []);
  const filtered = hidden.filter(id => id !== cid);
  setLocal(key, filtered);
}

/**
 * Get all hidden issuer credentials
 * @param {string} userAddress - Issuer address
 * @returns {Array<string>} Array of hidden CIDs
 */
export function getHiddenIssuerCredentials(userAddress) {
  const key = getStorageKey(KEYS.ISSUER_HIDDEN, userAddress, 'issuer');
  return getLocal(key, []);
}

// ============================================================================
// HOLDER VIEW STATE
// ============================================================================

/**
 * Hide credential from holder view (local only)
 * @param {string} cid - Credential CID
 * @param {string} userAddress - Holder address
 */
export function hideHolderCredential(cid, userAddress) {
  const key = getStorageKey(KEYS.HOLDER_HIDDEN_CREDS, userAddress, 'holder');
  const hidden = getLocal(key, []);
  
  if (!hidden.includes(cid)) {
    hidden.push(cid);
    setLocal(key, hidden);
  }
}

/**
 * Check if credential is hidden in holder view
 * @param {string} cid - Credential CID
 * @param {string} userAddress - Holder address
 * @returns {boolean} True if hidden
 */
export function isHolderCredentialHidden(cid, userAddress) {
  const key = getStorageKey(KEYS.HOLDER_HIDDEN_CREDS, userAddress, 'holder');
  const hidden = getLocal(key, []);
  return hidden.includes(cid);
}

/**
 * Unhide credential in holder view
 * @param {string} cid - Credential CID
 * @param {string} userAddress - Holder address
 */
export function unhideHolderCredential(cid, userAddress) {
  const key = getStorageKey(KEYS.HOLDER_HIDDEN_CREDS, userAddress, 'holder');
  const hidden = getLocal(key, []);
  const filtered = hidden.filter(id => id !== cid);
  setLocal(key, filtered);
}

/**
 * Hide request from holder view (local only)
 * @param {string} requestId - Request ID
 * @param {string} userAddress - Holder address
 */
export function hideHolderRequest(requestId, userAddress) {
  const key = getStorageKey(KEYS.HOLDER_HIDDEN_REQUESTS, userAddress, 'holder');
  const hidden = getLocal(key, []);
  
  if (!hidden.includes(requestId)) {
    hidden.push(requestId);
    setLocal(key, hidden);
  }
}

/**
 * Check if request is hidden in holder view
 * @param {string} requestId - Request ID
 * @param {string} userAddress - Holder address
 * @returns {boolean} True if hidden
 */
export function isHolderRequestHidden(requestId, userAddress) {
  const key = getStorageKey(KEYS.HOLDER_HIDDEN_REQUESTS, userAddress, 'holder');
  const hidden = getLocal(key, []);
  return hidden.includes(requestId);
}

/**
 * Unhide request in holder view
 * @param {string} requestId - Request ID
 * @param {string} userAddress - Holder address
 */
export function unhideHolderRequest(requestId, userAddress) {
  const key = getStorageKey(KEYS.HOLDER_HIDDEN_REQUESTS, userAddress, 'holder');
  const hidden = getLocal(key, []);
  const filtered = hidden.filter(id => id !== requestId);
  setLocal(key, filtered);
}

/**
 * Get all hidden holder credentials
 * @param {string} userAddress - Holder address
 * @returns {Array<string>} Array of hidden CIDs
 */
export function getHiddenHolderCredentials(userAddress) {
  const key = getStorageKey(KEYS.HOLDER_HIDDEN_CREDS, userAddress, 'holder');
  return getLocal(key, []);
}

/**
 * Get all hidden holder requests
 * @param {string} userAddress - Holder address
 * @returns {Array<string>} Array of hidden request IDs
 */
export function getHiddenHolderRequests(userAddress) {
  const key = getStorageKey(KEYS.HOLDER_HIDDEN_REQUESTS, userAddress, 'holder');
  return getLocal(key, []);
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Clear all wallet storage for a user
 * @param {string} userAddress - User address
 * @param {string} role - User role
 */
export function clearAllWalletStorage(userAddress, role) {
  Object.values(KEYS).forEach(baseKey => {
    const key = getStorageKey(baseKey, userAddress, role);
    localStorage.removeItem(key);
  });
}

/**
 * Export wallet storage data (for backup/debugging)
 * @param {string} userAddress - User address
 * @param {string} role - User role
 * @returns {Object} Storage data
 */
export function exportWalletStorage(userAddress, role) {
  const data = {};
  Object.entries(KEYS).forEach(([name, baseKey]) => {
    const key = getStorageKey(baseKey, userAddress, role);
    data[name] = getLocal(key);
  });
  return data;
}

/**
 * Import wallet storage data (for restore)
 * @param {Object} data - Storage data
 * @param {string} userAddress - User address
 * @param {string} role - User role
 */
export function importWalletStorage(data, userAddress, role) {
  Object.entries(data).forEach(([name, value]) => {
    const baseKey = KEYS[name];
    if (baseKey) {
      const key = getStorageKey(baseKey, userAddress, role);
      setLocal(key, value);
    }
  });
}
