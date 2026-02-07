// credentialRequestRoutes.js - Credential Request Management Routes
const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");

// File path for storing credential requests
const REQUESTS_FILE = path.join(__dirname, "../data/credentialRequests.json");

// Ensure data directory exists
const dataDir = path.join(__dirname, "../data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize requests file if it doesn't exist
if (!fs.existsSync(REQUESTS_FILE)) {
  fs.writeFileSync(REQUESTS_FILE, JSON.stringify([], null, 2));
}

// Helper functions
function loadRequests() {
  try {
    const data = fs.readFileSync(REQUESTS_FILE, "utf8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Error loading credential requests:", error);
    return [];
  }
}

function saveRequests(requests) {
  try {
    fs.writeFileSync(REQUESTS_FILE, JSON.stringify(requests, null, 2));
    return true;
  } catch (error) {
    console.error("Error saving credential requests:", error);
    return false;
  }
}

// ==================== ROUTES ====================

/**
 * POST /holder/requestCredential
 * Holder submits a credential request to issuer
 * DISABLED - Using new challenge-response route in challengeRoutes.js
 */
/*
router.post("/holder/requestCredential", (req, res) => {
  try {
    const { holderDID, holderAddress, holderName, message, credentialType, verificationID } = req.body;

    if (!holderDID || !holderAddress || !message) {
      return res.status(400).json({
        success: false,
        message: "holderDID, holderAddress, and message are required"
      });
    }

    if (!verificationID) {
      return res.status(400).json({
        success: false,
        message: "verificationID is required"
      });
    }

    const requests = loadRequests();
    
    // Create new request
    const newRequest = {
      id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      holderDID,
      holderAddress,
      holderName: holderName || "Unknown",
      message,
      credentialType: credentialType || "General Credential",
      verificationID: verificationID,
      status: "pending", // pending, approved, rejected
      requestedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      issuedVCCID: null, // Will be filled when approved
      rejectionReason: null
    };

    requests.push(newRequest);

    if (saveRequests(requests)) {
      console.log(`✅ Credential request received: ${newRequest.id}`);
      return res.json({
        success: true,
        message: "Credential request submitted successfully",
        request: newRequest
      });
    } else {
      return res.status(500).json({
        success: false,
        message: "Failed to save credential request"
      });
    }
  } catch (error) {
    console.error("Error submitting credential request:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
});
*/

/**
 * GET /issuer/requests
 * Get all credential requests (optionally filter by status)
 */
router.get("/issuer/requests", (req, res) => {
  try {
    const { status } = req.query; // Optional: ?status=pending
    
    let requests = loadRequests();
    
    // Filter by status if provided
    if (status) {
      requests = requests.filter(r => r.status === status);
    }

    // Sort by most recent first
    requests.sort((a, b) => new Date(b.requestedAt) - new Date(a.requestedAt));

    return res.json({
      success: true,
      requests: requests,
      count: requests.length,
      pendingCount: requests.filter(r => r.status === "pending").length,
      approvedCount: requests.filter(r => r.status === "approved").length,
      rejectedCount: requests.filter(r => r.status === "rejected").length
    });
  } catch (error) {
    console.error("Error getting credential requests:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve credential requests",
      error: error.message
    });
  }
});

/**
 * GET /issuer/requests/:id
 * Get a specific credential request by ID
 */
router.get("/issuer/requests/:id", (req, res) => {
  try {
    const { id } = req.params;
    
    const requests = loadRequests();
    const request = requests.find(r => r.id === id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Request not found"
      });
    }

    return res.json({
      success: true,
      request: request
    });
  } catch (error) {
    console.error("Error getting credential request:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve credential request",
      error: error.message
    });
  }
});

/**
 * POST /issuer/approveRequest
 * Approve a credential request and mark it for issuance
 */
router.post("/issuer/approveRequest", (req, res) => {
  try {
    const { requestId, vcCID, issuerAddress } = req.body;

    if (!requestId) {
      return res.status(400).json({
        success: false,
        message: "requestId is required"
      });
    }

    const requests = loadRequests();
    const requestIndex = requests.findIndex(r => r.id === requestId);

    if (requestIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Request not found"
      });
    }

    const request = requests[requestIndex];

    // Check if already processed
    if (request.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Request already ${request.status}`
      });
    }

    // Update request status
    requests[requestIndex] = {
      ...request,
      status: "approved",
      updatedAt: new Date().toISOString(),
      approvedAt: new Date().toISOString(),
      issuedVCCID: vcCID || null,
      issuerAddress: issuerAddress || null
    };

    if (saveRequests(requests)) {
      console.log(`✅ Request approved: ${requestId}`);
      return res.json({
        success: true,
        message: "Request approved successfully",
        request: requests[requestIndex]
      });
    } else {
      return res.status(500).json({
        success: false,
        message: "Failed to approve request"
      });
    }
  } catch (error) {
    console.error("Error approving request:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
});

/**
 * POST /issuer/rejectRequest
 * Reject a credential request
 */
router.post("/issuer/rejectRequest", (req, res) => {
  try {
    const { requestId, reason } = req.body;

    if (!requestId) {
      return res.status(400).json({
        success: false,
        message: "requestId is required"
      });
    }

    const requests = loadRequests();
    const requestIndex = requests.findIndex(r => r.id === requestId);

    if (requestIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Request not found"
      });
    }

    const request = requests[requestIndex];

    // Check if already processed
    if (request.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Request already ${request.status}`
      });
    }

    // Update request status
    requests[requestIndex] = {
      ...request,
      status: "rejected",
      updatedAt: new Date().toISOString(),
      rejectedAt: new Date().toISOString(),
      rejectionReason: reason || "No reason provided"
    };

    if (saveRequests(requests)) {
      console.log(`❌ Request rejected: ${requestId}`);
      return res.json({
        success: true,
        message: "Request rejected successfully",
        request: requests[requestIndex]
      });
    } else {
      return res.status(500).json({
        success: false,
        message: "Failed to reject request"
      });
    }
  } catch (error) {
    console.error("Error rejecting request:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
});

/**
 * DELETE /issuer/requests/:id
 * Delete a credential request (cleanup)
 */
router.delete("/issuer/requests/:id", (req, res) => {
  try {
    const { id } = req.params;
    
    const requests = loadRequests();
    const filteredRequests = requests.filter(r => r.id !== id);

    if (filteredRequests.length === requests.length) {
      return res.status(404).json({
        success: false,
        message: "Request not found"
      });
    }

    if (saveRequests(filteredRequests)) {
      console.log(`🗑️ Request deleted: ${id}`);
      return res.json({
        success: true,
        message: "Request deleted successfully"
      });
    } else {
      return res.status(500).json({
        success: false,
        message: "Failed to delete request"
      });
    }
  } catch (error) {
    console.error("Error deleting request:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
});

/**
 * GET /holder/myRequests/:holderAddress
 * Get all requests submitted by a specific holder
 */
router.get("/holder/myRequests/:holderAddress", (req, res) => {
  try {
    const { holderAddress } = req.params;
    
    const requests = loadRequests();
    const holderRequests = requests.filter(r => r.holderAddress === holderAddress);

    // Sort by most recent first
    holderRequests.sort((a, b) => new Date(b.requestedAt) - new Date(a.requestedAt));

    return res.json({
      success: true,
      requests: holderRequests,
      count: holderRequests.length,
      pendingCount: holderRequests.filter(r => r.status === "pending").length,
      approvedCount: holderRequests.filter(r => r.status === "approved").length,
      rejectedCount: holderRequests.filter(r => r.status === "rejected").length
    });
  } catch (error) {
    console.error("Error getting holder requests:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve holder requests",
      error: error.message
    });
  }
});

module.exports = router;
