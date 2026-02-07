// routes/holderRoutes.js - Holder Dashboard routes for managing received credentials
const express = require("express");
const fs = require("fs");
const path = require("path");
const { retrieveJSONFromIPFS } = require("../utils/ipfs");
const { verifyVCOnChain } = require("../utils/blockchain");

module.exports = (loggedInUsers) => {
  const router = express.Router();

  // Storage file for holder VCs (persistent across restarts)
  const HOLDER_VCS_FILE = path.join(__dirname, "../data/holder-vcs.json");

  // Ensure data directory exists
  const dataDir = path.join(__dirname, "../data");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  // Load VCs from file
  const loadVCsForHolder = (address) => {
    try {
      if (!fs.existsSync(HOLDER_VCS_FILE)) {
        return [];
      }
      const data = JSON.parse(fs.readFileSync(HOLDER_VCS_FILE, "utf8"));
      const normalizedAddress = address.toLowerCase();
      return data[normalizedAddress] || [];
    } catch (err) {
      console.error("Error loading holder VCs:", err);
      return [];
    }
  };

  // Save VCs to file
  const saveVCsForHolder = (address, vcs) => {
    try {
      let data = {};
      if (fs.existsSync(HOLDER_VCS_FILE)) {
        data = JSON.parse(fs.readFileSync(HOLDER_VCS_FILE, "utf8"));
      }
      const normalizedAddress = address.toLowerCase();
      data[normalizedAddress] = vcs;
      fs.writeFileSync(HOLDER_VCS_FILE, JSON.stringify(data, null, 2));
      return true;
    } catch (err) {
      console.error("Error saving holder VCs:", err);
      return false;
    }
  };

  /**
   * POST /holder/store-vc - Store VC reference when holder receives a credential
   * Called automatically after VC issuance or manually by holder
   */
  router.post("/store-vc", (req, res) => {
    try {
      const { holderAddress, vcCID, issuerDID, issuanceDate, credentialType, credentialSubject } = req.body;

      if (!holderAddress || !vcCID) {
        return res.status(400).json({
          success: false,
          message: "holderAddress and vcCID are required"
        });
      }

      // Load existing VCs for this holder
      const existingVCs = loadVCsForHolder(holderAddress);

      // Check if VC already exists
      const vcExists = existingVCs.some(vc => vc.vcCID === vcCID);
      if (vcExists) {
        return res.json({
          success: true,
          message: "VC already stored for this holder"
        });
      }

      // Add new VC reference
      const newVC = {
        vcCID,
        issuerDID,
        issuanceDate,
        credentialType: credentialType || "VerifiableCredential",
        credentialSubject: credentialSubject || {},
        receivedAt: new Date().toISOString()
      };

      existingVCs.push(newVC);

      // Save to file
      const saved = saveVCsForHolder(holderAddress, existingVCs);

      if (saved) {
        console.log(`✅ Stored VC reference for holder: ${holderAddress}`);
        console.log(`   CID: ${vcCID}`);
        console.log(`   Total VCs for holder: ${existingVCs.length}`);

        res.json({
          success: true,
          message: "VC reference stored successfully",
          totalVCs: existingVCs.length
        });
      } else {
        throw new Error("Failed to save VC reference");
      }
    } catch (err) {
      console.error("❌ Error storing VC reference:", err);
      res.status(500).json({
        success: false,
        message: err.message
      });
    }
  });

  /**
   * GET /holder/vcs/:address - Get all VCs for a wallet address
   * Returns list of VCs received by the holder
   */
  router.get("/vcs/:address", async (req, res) => {
    try {
      const { address } = req.params;

      console.log(`\n📋 Fetching VCs for holder: ${address}`);

      // Load VCs from persistent storage
      const holderVCs = loadVCsForHolder(address);

      console.log(`✅ Found ${holderVCs.length} VCs for holder`);

      // Optionally fetch full VC data from IPFS
      const enrichedVCs = await Promise.all(
        holderVCs.map(async (vcRef) => {
          try {
            // Fetch full VC from IPFS
            const fullVC = await retrieveJSONFromIPFS(vcRef.vcCID);
            
            return {
              ...vcRef,
              fullVC: fullVC,
              name: fullVC.credentialSubject?.name || "Unknown",
              rollNumber: fullVC.credentialSubject?.rollNumber || "N/A",
              department: fullVC.credentialSubject?.department || "N/A",
              documentType: fullVC.credentialSubject?.documentType || "Credential"
            };
          } catch (err) {
            console.warn(`⚠️ Could not fetch full VC for CID ${vcRef.vcCID}:`, err.message);
            return {
              ...vcRef,
              error: "Could not retrieve full VC data"
            };
          }
        })
      );

      res.json({
        success: true,
        count: enrichedVCs.length,
        vcs: enrichedVCs
      });

    } catch (err) {
      console.error("❌ Error fetching holder VCs:", err);
      res.status(500).json({
        success: false,
        message: err.message
      });
    }
  });

  /**
   * GET /holder/vc/:cid - Get specific VC by CID
   * Returns full VC data
   */
  router.get("/vc/:cid", async (req, res) => {
    try {
      const { cid } = req.params;

      console.log(`\n📥 Fetching VC: ${cid}`);

      // Retrieve from IPFS
      const vcData = await retrieveJSONFromIPFS(cid);

      console.log("✅ VC retrieved successfully");

      res.json({
        success: true,
        vc: vcData
      });

    } catch (err) {
      console.error("❌ Error fetching VC:", err);
      res.status(500).json({
        success: false,
        message: err.message
      });
    }
  });

  /**
   * DELETE /holder/vc/:cid - Remove VC reference from holder's list
   * Note: This doesn't delete from IPFS or blockchain, just removes from local tracking
   */
  router.delete("/vc/:cid", (req, res) => {
    try {
      const { cid } = req.params;
      const { address } = req.body;

      if (!address) {
        return res.status(400).json({
          success: false,
          message: "Wallet address is required"
        });
      }

      // Load existing VCs
      const holderVCs = loadVCsForHolder(address);

      // Find and remove VC
      const index = holderVCs.findIndex(vc => vc.vcCID === cid);

      if (index !== -1) {
        holderVCs.splice(index, 1);
        
        // Save updated list
        const saved = saveVCsForHolder(address, holderVCs);

        if (saved) {
          console.log(`✅ Removed VC reference: ${cid} for holder: ${address}`);
          
          res.json({
            success: true,
            message: "VC reference removed from your dashboard",
            remainingVCs: holderVCs.length
          });
        } else {
          throw new Error("Failed to save updated VC list");
        }
      } else {
        res.status(404).json({
          success: false,
          message: "VC not found in your credentials"
        });
      }

    } catch (err) {
      console.error("❌ Error removing VC reference:", err);
      res.status(500).json({
        success: false,
        message: err.message
      });
    }
  });

  /**
   * GET /holder/stats/:address - Get statistics for holder
   */
  router.get("/stats/:address", (req, res) => {
    try {
      const { address } = req.params;

      const holderVCs = loadVCsForHolder(address);

      // Sort by received date to get latest
      const sortedVCs = holderVCs.sort((a, b) => 
        new Date(b.receivedAt || b.issuanceDate) - new Date(a.receivedAt || a.issuanceDate)
      );

      res.json({
        success: true,
        stats: {
          totalCredentials: holderVCs.length,
          latestIssuance: sortedVCs.length > 0 
            ? sortedVCs[0].issuanceDate 
            : null,
          latestReceived: sortedVCs.length > 0
            ? sortedVCs[0].receivedAt
            : null
        }
      });

    } catch (err) {
      console.error("❌ Error fetching holder stats:", err);
      res.status(500).json({
        success: false,
        message: err.message
      });
    }
  });

  return router;
};
