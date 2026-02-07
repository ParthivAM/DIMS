// utils/indexedDB.js - IndexedDB helper for storing credentials locally
import { openDB } from 'idb';

const DB_NAME = 'DigiLockerDB';
const STORE_NAME = 'credentials';
const DB_VERSION = 1;

// Initialize database
export const initDB = async () => {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'cid' });
        store.createIndex('holderAddress', 'holderAddress', { unique: false });
        store.createIndex('issuanceDate', 'issuanceDate', { unique: false });
        console.log('✅ IndexedDB store created');
      }
    },
  });
};

// Store credential
export const storeCredential = async (credential) => {
  try {
    const db = await initDB();
    await db.put(STORE_NAME, credential);
    console.log('✅ Credential stored in IndexedDB:', credential.cid);
    return { success: true };
  } catch (err) {
    console.error('❌ Error storing credential:', err);
    return { success: false, error: err.message };
  }
};

// Get all credentials for a holder
export const getCredentials = async (holderAddress) => {
  try {
    const db = await initDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const index = store.index('holderAddress');
    
    const credentials = await index.getAll(holderAddress.toLowerCase());
    
    console.log(`✅ Retrieved ${credentials.length} credentials from IndexedDB`);
    return credentials;
  } catch (err) {
    console.error('❌ Error getting credentials:', err);
    return [];
  }
};

// Get single credential by CID
export const getCredentialByCID = async (cid) => {
  try {
    const db = await initDB();
    const credential = await db.get(STORE_NAME, cid);
    return credential || null;
  } catch (err) {
    console.error('❌ Error getting credential:', err);
    return null;
  }
};

// Delete credential
export const deleteCredential = async (cid) => {
  try {
    const db = await initDB();
    await db.delete(STORE_NAME, cid);
    console.log('✅ Credential deleted from IndexedDB:', cid);
    return { success: true };
  } catch (err) {
    console.error('❌ Error deleting credential:', err);
    return { success: false, error: err.message };
  }
};

// Clear all credentials
export const clearAllCredentials = async () => {
  try {
    const db = await initDB();
    await db.clear(STORE_NAME);
    console.log('✅ All credentials cleared from IndexedDB');
    return { success: true };
  } catch (err) {
    console.error('❌ Error clearing credentials:', err);
    return { success: false, error: err.message };
  }
};

// Get credential count
export const getCredentialCount = async (holderAddress) => {
  try {
    const credentials = await getCredentials(holderAddress);
    return credentials.length;
  } catch (err) {
    console.error('❌ Error getting credential count:', err);
    return 0;
  }
};
