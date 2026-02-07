// didRoutes.js - DID Registration and Resolution Routes
const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");

// File paths for storing DID data
const REGISTERED_HOLDERS_FILE = path.join(__dirname, "../data/registeredHolders.json");
const VC_HOLDER_MAP_FILE = path.join(__dirname, "../data/vcHolderMap.json");

// Ensure data directory exists
const dataDir = path.join(__dirname, "../data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize files if they don't exist
if (!fs.existsSync(REGISTERED_HOLDERS_FILE)) {
  fs.writeFileSync(REGISTERED_HOLDERS_FILE, JSON.stringify([], null, 2));
}
if (!fs.existsSync(VC_HOLDER_MAP_FILE)) {
  fs.writeFileSync(VC_HOLDER_MAP_FILE, JSON.stringify({}, null, 2));
}

// Helper functions
function loadRegisteredHolders() {
  try {
    const data = fs.readFileSync(REGISTERED_HOLDERS_FILE, "utf8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Error loading registered holders:", error);
    return [];
  }
}

function saveRegisteredHolders(holders) {
  try {
    fs.writeFileSync(REGISTERED_HOLDERS_FILE, JSON.stringify(holders, null, 2));
    return true;
  } catch (error) {
    console.error("Error saving registered holders:", error);
    return false;
  }
}

function loadVCHolderMap() {
  try {
    const data = fs.readFileSync(VC_HOLDER_MAP_FILE, "utf8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Error loading VC holder map:", error);
    return {};
  }
}

function saveVCHolderMap(map) {
  try {
    fs.writeFileSync(VC_HOLDER_MAP_FILE, JSON.stringify(map, null, 2));
    return true;
  } catch (error) {
    console.error("Error saving VC holder map:", error);
    return false;
  }
}

// ==================== ROUTES ====================

// Manual DID registration disabled - using request-only flow
/* 
/**
 * POST /registerHolderDID
 * Register a holder's DID for issuer selection
 * DISABLED: No longer needed with request-only flow
 */
/*
router.post("/registerHolderDID", (req, res) => {
  try {
    const { holderAddress, holderDID, holderName } = req.body;

    if (!holderAddress || !holderDID) {
      return res.status(400).json({
        success: false,
        message: "holderAddress and holderDID are required"
      });
    }

    const holders = loadRegisteredHolders();
    
    // Check if holder already registered
    const existingIndex = holders.findIndex(h => h.holderAddress === holderAddress);
    
    if (existingIndex !== -1) {
      // Update existing holder
      holders[existingIndex] = {
        holderAddress,
        holderDID,
        holderName: holderName || holders[existingIndex].holderName || "Unknown",
        registeredAt: holders[existingIndex].registeredAt,
        updatedAt: new Date().toISOString()
      };
    } else {
      // Add new holder
      holders.push({
        holderAddress,
        holderDID,
        holderName: holderName || "Unknown",
        registeredAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }

    if (saveRegisteredHolders(holders)) {
      console.log(`✅ Holder DID registered: ${holderDID}`);
      return res.json({
        success: true,
        message: "DID registered successfully",
        holder: {
          holderAddress,
          holderDID,
          holderName: holderName || "Unknown"
        }
      });
    } else {
      return res.status(500).json({
        success: false,
        message: "Failed to save holder registration"
      });
    }
  } catch (error) {
    console.error("Error registering holder DID:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
});
*/

/**
 * GET /getRegisteredHolders
 * Get list of all registered holders for issuer dropdown
 * DISABLED: No longer needed with request-only flow
 */
/*
router.get("/getRegisteredHolders", (req, res) => {
  try {
    const holders = loadRegisteredHolders();
    
    return res.json({
      success: true,
      holders: holders.map(h => ({
        holderAddress: h.holderAddress,
        holderDID: h.holderDID,
        holderName: h.holderName || "Unknown",
        registeredAt: h.registeredAt
      })),
      count: holders.length
    });
  } catch (error) {
    console.error("Error getting registered holders:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve holders",
      error: error.message
    });
  }
});
*/

/**
 * POST /linkVCToHolder
 * Link an issued VC (by CID) to a holder's DID
 */
router.post("/linkVCToHolder", (req, res) => {
  try {
    const { holderDID, vcCID } = req.body;

    if (!holderDID || !vcCID) {
      return res.status(400).json({
        success: false,
        message: "holderDID and vcCID are required"
      });
    }

    const vcMap = loadVCHolderMap();
    
    // Initialize array if DID doesn't exist
    if (!vcMap[holderDID]) {
      vcMap[holderDID] = [];
    }

    // Add CID if not already linked
    if (!vcMap[holderDID].includes(vcCID)) {
      vcMap[holderDID].push(vcCID);
    }

    if (saveVCHolderMap(vcMap)) {
      console.log(`✅ VC linked to holder: ${holderDID} -> ${vcCID}`);
      return res.json({
        success: true,
        message: "VC linked to holder successfully",
        holderDID,
        vcCID,
        totalVCs: vcMap[holderDID].length
      });
    } else {
      return res.status(500).json({
        success: false,
        message: "Failed to save VC-holder mapping"
      });
    }
  } catch (error) {
    console.error("Error linking VC to holder:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
});

/**
 * GET /getHolderVCs/:did
 * Get all VCs linked to a holder's DID
 */
router.get("/getHolderVCs/:did", (req, res) => {
  try {
    const { did } = req.params;

    if (!did) {
      return res.status(400).json({
        success: false,
        message: "DID parameter is required"
      });
    }

    const vcMap = loadVCHolderMap();
    const vcs = vcMap[did] || [];

    return res.json({
      success: true,
      holderDID: did,
      vcCIDs: vcs,
      count: vcs.length
    });
  } catch (error) {
    console.error("Error getting holder VCs:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve holder VCs",
      error: error.message
    });
  }
});

/**
 * GET /resolveDID/:did
 * Resolve a DID to get holder information
 * Note: For now, this returns stored info. Can be enhanced with ethr-did-resolver
 */
router.get("/resolveDID/:did", (req, res) => {
  try {
    const { did } = req.params;

    if (!did) {
      return res.status(400).json({
        success: false,
        message: "DID parameter is required"
      });
    }

    const holders = loadRegisteredHolders();
    const holder = holders.find(h => h.holderDID === did);

    if (holder) {
      return res.json({
        success: true,
        did: holder.holderDID,
        address: holder.holderAddress,
        name: holder.holderName,
        registeredAt: holder.registeredAt,
        resolved: true
      });
    } else {
      // Try to extract address from DID
      const addressMatch = did.match(/did:ethr:(0x[a-fA-F0-9]{40})/);
      if (addressMatch) {
        return res.json({
          success: true,
          did: did,
          address: addressMatch[1],
          name: "Unknown",
          resolved: false,
          message: "DID not registered, but address extracted"
        });
      } else {
        return res.status(404).json({
          success: false,
          message: "DID not found and could not extract address"
        });
      }
    }
  } catch (error) {
    console.error("Error resolving DID:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to resolve DID",
      error: error.message
    });
  }
});

/**
 * DELETE /unregisterHolder/:address
 * Remove a holder's registration (optional cleanup)
 */
router.delete("/unregisterHolder/:address", (req, res) => {
  try {
    const { address } = req.params;

    if (!address) {
      return res.status(400).json({
        success: false,
        message: "Address parameter is required"
      });
    }

    const holders = loadRegisteredHolders();
    const filteredHolders = holders.filter(h => h.holderAddress !== address);

    if (filteredHolders.length === holders.length) {
      return res.status(404).json({
        success: false,
        message: "Holder not found"
      });
    }

    if (saveRegisteredHolders(filteredHolders)) {
      return res.json({
        success: true,
        message: "Holder unregistered successfully"
      });
    } else {
      return res.status(500).json({
        success: false,
        message: "Failed to unregister holder"
      });
    }
  } catch (error) {
    console.error("Error unregistering holder:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
});

module.exports = router;
