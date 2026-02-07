// routes/authRoutes.js - Authentication routes
const express = require("express");
const { verifyMessage } = require("ethers");

module.exports = (loggedInUsers) => {
  const router = express.Router();

  /**
   * POST /login - MetaMask authentication
   */
  router.post("/login", async (req, res) => {
    const { address, message, signature } = req.body;
    
    if (!address || !message || !signature) {
      return res.status(400).json({ 
        success: false, 
        message: "Missing required fields: address, message, signature" 
      });
    }

    try {
      // Verify the signature
      const signer = verifyMessage(message, signature);
      if (signer.toLowerCase() !== address.toLowerCase()) {
        return res.status(403).json({ 
          success: false, 
          message: "Invalid signature verification" 
        });
      }

      // Store logged-in user
      loggedInUsers[address] = {
        address: address,
        loginTime: new Date().toISOString(),
        did: `did:ethr:${address}`,
        publicKey: address
      };

      console.log("✅ User logged in:", address);
      console.log("📋 Current logged-in users:", Object.keys(loggedInUsers).length);

      res.json({ 
        success: true, 
        message: "Login successful",
        user: {
          address: address,
          did: `did:ethr:${address}`,
          publicKey: address
        }
      });
    } catch (err) {
      console.error("❌ Login error:", err);
      res.status(500).json({ 
        success: false, 
        message: err.message 
      });
    }
  });

  /**
   * POST /logout - Logout user
   */
  router.post("/logout", (req, res) => {
    const { address } = req.body;
    
    if (loggedInUsers[address]) {
      delete loggedInUsers[address];
      console.log("✅ User logged out:", address);
    }

    res.json({ 
      success: true, 
      message: "Logout successful" 
    });
  });

  /**
   * GET /session - Check session status
   */
  router.get("/session/:address", (req, res) => {
    const { address } = req.params;
    
    if (loggedInUsers[address]) {
      res.json({
        success: true,
        loggedIn: true,
        user: loggedInUsers[address]
      });
    } else {
      res.json({
        success: true,
        loggedIn: false
      });
    }
  });

  return router;
};
