/**
 * Challenge-Response Routes
 * Handles DID ownership verification via cryptographic nonce challenges
 */

const express = require('express');
const router = express.Router();
const { ethers } = require('ethers');
const {
  createPendingRequest,
  createChallenge,
  verifyChallenge,
  getPendingRequest,
  getAllPendingRequests,
  getVerifiedRequests,
  getRequestsByHolder,
  updateRequestStatus,
  deletePendingRequest
} = require('../utils/nonces');

/**
 * POST /holder/requestCredential
 * Create a new credential request (status: pending)
 * Holder must then complete challenge-response to verify DID ownership
 */
router.post('/holder/requestCredential', (req, res) => {
  try {
    console.log('\n📥 Received credential request:');
    console.log('Request body:', req.body);
    
    const { holderDID, holderAddress, holderName, vcType, verificationID, message, attachedStudentVC } = req.body;

    console.log('Extracted fields:', { holderDID, holderAddress, holderName, vcType, verificationID, message, attachedStudentVC: !!attachedStudentVC });

    // Validate required fields
    if (!holderDID || !holderAddress || !vcType || !verificationID) {
      console.log('❌ Validation failed - missing fields:', {
        holderDID: !!holderDID,
        holderAddress: !!holderAddress,
        vcType: !!vcType,
        verificationID: !!verificationID
      });
      return res.status(400).json({
        success: false,
        message: 'holderDID, holderAddress, vcType, and verificationID are required'
      });
    }

    // Create pending request (not verified yet)
    const requestId = createPendingRequest(
      holderDID,
      holderAddress,
      holderName,
      vcType,
      verificationID,
      message || '',
      attachedStudentVC // Pass attached Student ID VC if present
    );

    console.log(`📝 New credential request created: ${requestId}`);
    console.log(`   Holder: ${holderName || 'Unknown'}`);
    console.log(`   DID: ${holderDID}`);
    console.log(`   Type: ${vcType}`);
    console.log(`   Status: pending (awaiting DID verification)`);

    return res.json({
      success: true,
      requestId,
      message: 'Request created. Please complete DID ownership verification.',
      status: 'pending'
    });

  } catch (error) {
    console.error('❌ Error creating credential request:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * POST /challenge/request
 * Request a cryptographic challenge (nonce) for DID ownership proof
 */
router.post('/challenge/request', (req, res) => {
  try {
    console.log('\n🔐 Received challenge request:');
    console.log('Request body:', req.body);
    
    const { requestId } = req.body;
    console.log('Extracted requestId:', requestId);
    console.log('RequestId type:', typeof requestId);

    if (!requestId) {
      console.log('❌ RequestId is missing or falsy');
      return res.status(400).json({
        success: false,
        message: 'requestId is required'
      });
    }

    // Validate request exists
    console.log('Looking up request:', requestId);
    const request = getPendingRequest(requestId);
    console.log('Found request:', request ? 'Yes' : 'No');
    
    if (!request) {
      console.log('❌ Request not found in storage');
      return res.status(404).json({
        success: false,
        message: 'Request not found'
      });
    }

    // Validate request is pending
    if (request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Request is already ${request.status}. Cannot create new challenge.`
      });
    }

    // Create challenge
    const challenge = createChallenge(requestId);

    console.log(`🔐 Challenge created for request: ${requestId}`);
    console.log(`   Nonce ID: ${challenge.nonceId}`);
    console.log(`   Expires: ${challenge.expiresAt}`);

    return res.json({
      success: true,
      nonceId: challenge.nonceId,
      nonce: challenge.nonce,
      messageToSign: challenge.messageToSign,
      expiresAt: challenge.expiresAt,
      message: 'Sign this message with your wallet to prove DID ownership'
    });

  } catch (error) {
    console.error('❌ Error creating challenge:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
});

/**
 * POST /challenge/verify
 * Verify the challenge response (signature)
 */
router.post('/challenge/verify', async (req, res) => {
  try {
    const { requestId, nonceId, signature } = req.body;

    if (!requestId || !nonceId || !signature) {
      return res.status(400).json({
        success: false,
        message: 'requestId, nonceId, and signature are required'
      });
    }

    // Get request and nonce data
    const request = getPendingRequest(requestId);
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found'
      });
    }

    // Get nonce data from nonces utility
    const nonceModule = require('../utils/nonces');
    const nonces = require('../utils/nonces');
    
    // Access nonce data directly (we'll need to export this)
    const fs = require('fs');
    const path = require('path');
    const NONCES_FILE = path.join(__dirname, '../data/nonces.json');
    let nonceData = null;
    
    try {
      const noncesData = JSON.parse(fs.readFileSync(NONCES_FILE, 'utf8'));
      nonceData = noncesData[nonceId];
    } catch (err) {
      return res.status(404).json({
        success: false,
        message: 'Nonce not found'
      });
    }

    if (!nonceData) {
      return res.status(404).json({
        success: false,
        message: 'Nonce not found'
      });
    }

    // Recover address from signature
    let recoveredAddress;
    try {
      recoveredAddress = ethers.verifyMessage(nonceData.messageToSign, signature);
      console.log(`🔍 Signature verification:`);
      console.log(`   Message: ${nonceData.messageToSign.substring(0, 50)}...`);
      console.log(`   Signature: ${signature.substring(0, 20)}...`);
      console.log(`   Recovered address: ${recoveredAddress}`);
    } catch (error) {
      console.error('❌ Signature verification failed:', error);
      return res.status(400).json({
        success: false,
        message: 'Invalid signature',
        error: error.message
      });
    }

    // Verify challenge
    try {
      verifyChallenge(requestId, nonceId, signature, recoveredAddress);

      console.log(`✅ DID ownership verified for request: ${requestId}`);
      console.log(`   DID: ${request.holderDID}`);
      console.log(`   Recovered address: ${recoveredAddress}`);
      console.log(`   Status: verified`);

      return res.json({
        success: true,
        verified: true,
        message: 'DID ownership verified successfully',
        requestId,
        status: 'verified'
      });

    } catch (error) {
      console.error('❌ Challenge verification failed:', error);
      return res.status(400).json({
        success: false,
        verified: false,
        message: error.message
      });
    }

  } catch (error) {
    console.error('❌ Error verifying challenge:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * GET /issuer/verifiedRequests
 * Get all verified credential requests (ready for issuance)
 */
router.get('/issuer/verifiedRequests', (req, res) => {
  try {
    const verifiedRequests = getVerifiedRequests();

    console.log(`📋 Fetching verified requests: ${verifiedRequests.length} found`);

    return res.json({
      success: true,
      requests: verifiedRequests,
      count: verifiedRequests.length,
      pendingCount: getAllPendingRequests().filter(r => r.status === 'pending').length,
      verifiedCount: verifiedRequests.length,
      approvedCount: getAllPendingRequests().filter(r => r.status === 'approved').length,
      rejectedCount: getAllPendingRequests().filter(r => r.status === 'rejected').length
    });

  } catch (error) {
    console.error('❌ Error fetching verified requests:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * GET /issuer/allRequests
 * Get all credential requests (pending, verified, approved, rejected)
 */
router.get('/issuer/allRequests', (req, res) => {
  try {
    const allRequests = getAllPendingRequests();

    console.log(`📋 Fetching all requests: ${allRequests.length} found`);

    return res.json({
      success: true,
      requests: allRequests,
      count: allRequests.length,
      pendingCount: allRequests.filter(r => r.status === 'pending').length,
      verifiedCount: allRequests.filter(r => r.status === 'verified').length,
      approvedCount: allRequests.filter(r => r.status === 'approved').length,
      rejectedCount: allRequests.filter(r => r.status === 'rejected').length
    });

  } catch (error) {
    console.error('❌ Error fetching all requests:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * GET /holder/myRequests/:holderAddress
 * Get all requests for a specific holder
 */
router.get('/holder/myRequests/:holderAddress', (req, res) => {
  try {
    const { holderAddress } = req.params;

    if (!holderAddress) {
      return res.status(400).json({
        success: false,
        message: 'holderAddress is required'
      });
    }

    const requests = getRequestsByHolder(holderAddress);

    return res.json({
      success: true,
      requests,
      count: requests.length
    });

  } catch (error) {
    console.error('❌ Error fetching holder requests:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * POST /issuer/approveRequest
 * Approve a verified request and mark it for VC issuance
 */
router.post('/issuer/approveRequest', (req, res) => {
  try {
    const { requestId, vcCID, issuerAddress } = req.body;

    console.log('\n📝 POST /issuer/approveRequest');
    console.log('Request body:', { requestId, vcCID, issuerAddress });

    if (!requestId) {
      return res.status(400).json({
        success: false,
        message: 'requestId is required'
      });
    }

    const request = getPendingRequest(requestId);
    
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found'
      });
    }

    // Allow updating verified or already approved requests (to add VC CID)
    if (request.status !== 'verified' && request.status !== 'approved') {
      return res.status(400).json({
        success: false,
        message: `Request must be verified before approval. Current status: ${request.status}`
      });
    }

    // Update request status
    console.log('💾 Updating request with:', {
      status: 'approved',
      issuedVCCID: vcCID,
      approvedBy: issuerAddress
    });
    
    const updatedRequest = updateRequestStatus(requestId, 'approved', {
      issuedVCCID: vcCID,
      approvedBy: issuerAddress,
      approvedAt: new Date().toISOString()
    });

    console.log(`✅ Request approved: ${requestId}`);
    console.log(`   VC CID: ${vcCID}`);
    console.log(`   Updated request:`, updatedRequest);

    return res.json({
      success: true,
      message: 'Request approved successfully',
      requestId,
      status: 'approved'
    });

  } catch (error) {
    console.error('❌ Error approving request:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * POST /issuer/rejectRequest
 * Reject a request
 */
router.post('/issuer/rejectRequest', (req, res) => {
  try {
    const { requestId, rejectionReason, issuerAddress } = req.body;

    if (!requestId || !rejectionReason) {
      return res.status(400).json({
        success: false,
        message: 'requestId and rejectionReason are required'
      });
    }

    const request = getPendingRequest(requestId);
    
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found'
      });
    }

    // Update request status
    updateRequestStatus(requestId, 'rejected', {
      rejectionReason,
      rejectedBy: issuerAddress,
      rejectedAt: new Date().toISOString()
    });

    console.log(`❌ Request rejected: ${requestId}`);
    console.log(`   Reason: ${rejectionReason}`);

    return res.json({
      success: true,
      message: 'Request rejected',
      requestId,
      status: 'rejected'
    });

  } catch (error) {
    console.error('❌ Error rejecting request:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * DELETE /holder/request/:requestId
 * Delete a credential request (Holder)
 */
router.delete('/holder/request/:requestId', (req, res) => {
  try {
    const { requestId } = req.params;
    const { holderAddress } = req.body;

    console.log(`\n🗑️ Holder delete request: ${requestId}`);
    console.log('Holder address:', holderAddress);

    if (!requestId) {
      return res.status(400).json({
        success: false,
        message: 'Request ID is required'
      });
    }

    // Delete the request
    const result = deletePendingRequest(requestId);

    if (!result.success) {
      return res.status(404).json(result);
    }

    return res.json({
      success: true,
      message: 'Request deleted successfully'
    });
  } catch (error) {
    console.error('❌ Error deleting holder request:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * DELETE /issuer/request/:requestId
 * Delete a credential request (Issuer)
 */
router.delete('/issuer/request/:requestId', (req, res) => {
  try {
    const { requestId } = req.params;
    const { issuerAddress } = req.body;

    console.log(`\n🗑️ Issuer delete request: ${requestId}`);
    console.log('Issuer address:', issuerAddress);

    if (!requestId) {
      return res.status(400).json({
        success: false,
        message: 'Request ID is required'
      });
    }

    // Delete the request
    const result = deletePendingRequest(requestId);

    if (!result.success) {
      return res.status(404).json(result);
    }

    return res.json({
      success: true,
      message: 'Request deleted successfully'
    });
  } catch (error) {
    console.error('❌ Error deleting issuer request:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * GET /debug/requests
 * Debug endpoint to view all pending requests
 */
router.get('/debug/requests', (req, res) => {
  try {
    const allRequests = getAllPendingRequests();
    console.log('📋 Debug: All pending requests:', allRequests.length);
    
    return res.json({
      success: true,
      count: allRequests.length,
      requests: allRequests
    });
  } catch (error) {
    console.error('❌ Error fetching debug requests:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

module.exports = router;
