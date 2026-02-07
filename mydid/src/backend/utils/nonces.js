/**
 * Nonce Management Utilities
 * Handles cryptographic nonce generation, storage, and verification
 * for DID ownership proof via challenge-response
 */

const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

// File paths for persistent storage
const DATA_DIR = path.join(__dirname, '../data');
const NONCES_FILE = path.join(DATA_DIR, 'nonces.json');
const PENDING_REQUESTS_FILE = path.join(DATA_DIR, 'pendingRequests.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// In-memory storage (backed by files)
let nonces = {};
let pendingRequests = {};

// Load data from files on startup
function loadData() {
  try {
    if (fs.existsSync(NONCES_FILE)) {
      const data = fs.readFileSync(NONCES_FILE, 'utf8');
      nonces = JSON.parse(data);
      console.log('✅ Loaded nonces from file');
    }
  } catch (error) {
    console.error('⚠️ Error loading nonces:', error.message);
    nonces = {};
  }

  try {
    if (fs.existsSync(PENDING_REQUESTS_FILE)) {
      const data = fs.readFileSync(PENDING_REQUESTS_FILE, 'utf8');
      pendingRequests = JSON.parse(data);
      console.log('✅ Loaded pending requests from file');
    }
  } catch (error) {
    console.error('⚠️ Error loading pending requests:', error.message);
    pendingRequests = {};
  }
}

// Save data to files
function saveNonces() {
  try {
    fs.writeFileSync(NONCES_FILE, JSON.stringify(nonces, null, 2));
    return true;
  } catch (error) {
    console.error('❌ Error saving nonces:', error.message);
    return false;
  }
}

function savePendingRequests() {
  try {
    fs.writeFileSync(PENDING_REQUESTS_FILE, JSON.stringify(pendingRequests, null, 2));
    return true;
  } catch (error) {
    console.error('❌ Error saving pending requests:', error.message);
    return false;
  }
}

// Generate cryptographically secure random nonce
function generateNonce(bytes = 32) {
  return crypto.randomBytes(bytes).toString('hex');
}

// Create a new pending request
function createPendingRequest(holderDID, holderAddress, holderName, vcType, verificationID, message, attachedStudentVC) {
  const requestId = uuidv4();
  
  const request = {
    requestId,
    holderDID,
    holderAddress,
    holderName: holderName || 'Unknown',
    vcType,
    verificationID,
    message,
    status: 'pending', // pending, verified, rejected
    createdAt: new Date().toISOString(),
    nonceId: null,
    verifiedAt: null,
    signature: null,
    recoveredAddress: null
  };

  // Add attached Student ID VC if present (for Academic Certificate requests)
  if (attachedStudentVC) {
    request.attachedStudentVC = attachedStudentVC;
    console.log(`🔗 Attached Student ID VC with CID: ${attachedStudentVC.cid}`);
  }

  pendingRequests[requestId] = request;
  savePendingRequests();
  console.log(`✅ Created pending request: ${requestId}`);
  
  return requestId;
}

// Create a challenge nonce for a request
function createChallenge(requestId) {
  const request = pendingRequests[requestId];
  
  if (!request) {
    throw new Error('Request not found');
  }

  if (request.status !== 'pending') {
    throw new Error(`Request is already ${request.status}`);
  }

  const nonceId = uuidv4();
  const nonce = generateNonce(32);
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

  // Create message to sign
  const messageToSign = `DigiLocker DID Ownership Proof\n\nNonce: ${nonce}\nRequest ID: ${requestId}\nAction: Prove DID Ownership\nExpires: ${expiresAt.toISOString()}\n\nSign this message to verify you own: ${request.holderDID}`;

  nonces[nonceId] = {
    nonceId,
    nonce,
    requestId,
    holderDID: request.holderDID,
    messageToSign,
    expiresAt: expiresAt.toISOString(),
    used: false,
    createdAt: new Date().toISOString()
  };

  // Link nonce to request
  pendingRequests[requestId].nonceId = nonceId;

  saveNonces();
  savePendingRequests();

  console.log(`✅ Created challenge nonce: ${nonceId} for request: ${requestId}`);

  return {
    nonceId,
    nonce,
    messageToSign,
    expiresAt: expiresAt.toISOString()
  };
}

// Verify a challenge response
function verifyChallenge(requestId, nonceId, signature, recoveredAddress) {
  const request = pendingRequests[requestId];
  const nonceData = nonces[nonceId];

  // Validate nonce exists
  if (!nonceData) {
    throw new Error('Nonce not found');
  }

  // Validate request exists
  if (!request) {
    throw new Error('Request not found');
  }

  // Validate nonce matches request
  if (nonceData.requestId !== requestId) {
    throw new Error('Nonce does not match request');
  }

  // Validate nonce not expired
  if (new Date() > new Date(nonceData.expiresAt)) {
    throw new Error('Nonce has expired');
  }

  // Validate nonce not already used
  if (nonceData.used) {
    throw new Error('Nonce has already been used');
  }

  // Validate DID ownership
  // Extract address from DID (format: did:ethr:0x...)
  const didAddress = request.holderDID.split(':')[2];
  
  if (!didAddress) {
    throw new Error('Invalid DID format');
  }

  // Compare addresses (case-insensitive)
  if (recoveredAddress.toLowerCase() !== didAddress.toLowerCase()) {
    throw new Error('Signature does not match DID owner');
  }

  // Mark nonce as used (atomically)
  nonceData.used = true;
  nonceData.usedAt = new Date().toISOString();
  nonceData.signature = signature;

  // Mark request as verified
  request.status = 'verified';
  request.verifiedAt = new Date().toISOString();
  request.signature = signature;
  request.recoveredAddress = recoveredAddress;

  // Save changes
  saveNonces();
  savePendingRequests();

  console.log(`✅ Challenge verified for request: ${requestId}`);

  return true;
}

// Get pending request by ID
function getPendingRequest(requestId) {
  return pendingRequests[requestId] || null;
}

// Get all pending requests
function getAllPendingRequests() {
  return Object.values(pendingRequests);
}

// Get verified requests only
function getVerifiedRequests() {
  return Object.values(pendingRequests).filter(req => req.status === 'verified');
}

// Get requests by holder address
function getRequestsByHolder(holderAddress) {
  return Object.values(pendingRequests).filter(req => req.holderAddress === holderAddress);
}

// Update request status (for approval/rejection by issuer)
function updateRequestStatus(requestId, status, additionalData = {}) {
  const request = pendingRequests[requestId];
  
  if (!request) {
    throw new Error('Request not found');
  }

  request.status = status;
  request.updatedAt = new Date().toISOString();
  
  // Merge additional data (e.g., issuedVCCID, rejectionReason)
  Object.assign(request, additionalData);

  savePendingRequests();
  
  return request;
}

// Cleanup expired nonces (run periodically)
function cleanupExpiredNonces() {
  const now = new Date();
  let cleaned = 0;

  Object.keys(nonces).forEach(nonceId => {
    if (new Date(nonces[nonceId].expiresAt) < now) {
      delete nonces[nonceId];
      cleaned++;
    }
  });

  if (cleaned > 0) {
    saveNonces();
    console.log(`🧹 Cleaned up ${cleaned} expired nonces`);
  }

  return cleaned;
}

/**
 * Delete a pending request
 */
function deletePendingRequest(requestId) {
  try {
    if (!pendingRequests[requestId]) {
      console.log(`⚠️ Request ${requestId} not found`);
      return { success: false, message: 'Request not found' };
    }

    console.log(`🗑️ Deleting request: ${requestId}`);
    delete pendingRequests[requestId];
    savePendingRequests();
    
    console.log(`✅ Request ${requestId} deleted successfully`);
    return { success: true, message: 'Request deleted successfully' };
  } catch (error) {
    console.error('❌ Error deleting request:', error);
    return { success: false, message: error.message };
  }
}

// Initialize on module load
loadData();

// Cleanup expired nonces every 10 minutes
setInterval(cleanupExpiredNonces, 10 * 60 * 1000);

module.exports = {
  createPendingRequest,
  createChallenge,
  verifyChallenge,
  getPendingRequest,
  getAllPendingRequests,
  getVerifiedRequests,
  getRequestsByHolder,
  updateRequestStatus,
  cleanupExpiredNonces,
  generateNonce,
  deletePendingRequest
};
