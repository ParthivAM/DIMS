// server.js - Digital Identity Management with BBS+ Signatures, IPFS, and Blockchain
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const fs = require("fs");
// BBS+ library will be dynamically imported (ESM)
let bbsLib = null;

// Import utility modules
const { initializePinata, testPinataConnection } = require("./utils/ipfs");
const { initializeBlockchain, getWalletBalance, isBlockchainReady } = require("./utils/blockchain");

// Import route modules
const authRoutes = require("./routes/authRoutes");
const vcRoutes = require("./routes/vcRoutes");
const verifyRoutes = require("./routes/verifyRoutes");
const holderRoutes = require("./routes/holderRoutes");
const holderAdvancedRoutes = require("./routes/holderAdvancedRoutes");
const didRoutes = require("./routes/didRoutes");
const credentialRequestRoutes = require("./routes/credentialRequestRoutes");
const challengeRoutes = require("./routes/challengeRoutes");

const app = express();
app.use(cors({ origin: "*" }));
// Increase payload limit to handle VCs with photos (base64 images can be large)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

let loggedInUsers = {};
let bbsKeyPair = null;

// ------------------ BBS+ Key Management ------------------
async function initializeBBSKeys() {
  try {
    // Dynamically import ESM module
    if (!bbsLib) {
      bbsLib = await import('@digitalbazaar/bbs-signatures');
    }

    const keyFile = "bbs-keys.json";
    
    if (fs.existsSync(keyFile)) {
      console.log("🔑 Loading existing BBS+ keys...");
      const savedKeys = JSON.parse(fs.readFileSync(keyFile));
      
      // Validate saved keys
      if (savedKeys.publicKey && savedKeys.secretKey) {
        bbsKeyPair = {
          publicKey: new Uint8Array(Buffer.from(savedKeys.publicKey, 'base64')),
          secretKey: new Uint8Array(Buffer.from(savedKeys.secretKey, 'base64')),
          keyType: 'Bls12381G2'
        };
        console.log("✅ BBS+ keys loaded from file");
      } else {
        throw new Error("Invalid saved keys format");
      }
    } else {
      console.log("🔑 Generating new BBS+ key pair...");
      bbsKeyPair = await bbsLib.generateKeyPair({ ciphersuite: bbsLib.CIPHERSUITES.BLS12381_SHA256 });
      
      // Save keys for future use
      const keysToSave = {
        publicKey: Buffer.from(bbsKeyPair.publicKey).toString('base64'),
        secretKey: Buffer.from(bbsKeyPair.secretKey).toString('base64'),
        keyType: bbsKeyPair.keyType || 'Bls12381G2'
      };
      fs.writeFileSync(keyFile, JSON.stringify(keysToSave, null, 2));
      console.log("✅ BBS+ keys generated and saved");
    }
    
    console.log("✅ BBS+ keys initialized successfully");
    console.log("📋 Public Key (Base64):", Buffer.from(bbsKeyPair.publicKey).toString('base64'));
  } catch (error) {
    console.error("❌ Error initializing BBS+ keys:", error);
    // Generate new keys as fallback
    try {
      console.log("🔄 Generating fallback BBS+ keys...");
      if (!bbsLib) {
        bbsLib = await import('@digitalbazaar/bbs-signatures');
      }
      bbsKeyPair = await bbsLib.generateKeyPair({ ciphersuite: bbsLib.CIPHERSUITES.BLS12381_SHA256 });
      console.log("✅ Fallback BBS+ keys generated");
    } catch (fallbackError) {
      console.error("❌ Failed to generate fallback keys:", fallbackError);
      throw fallbackError;
    }
  }
}

// ------------------ Initialize Services ------------------
async function initializeServices() {
  console.log("\n🚀 Initializing Digital Identity Management System...\n");

  // 1. Initialize BBS+ Keys
  await initializeBBSKeys();

  // 2. Initialize IPFS (Pinata)
  try {
    initializePinata();
    const ipfsConnected = await testPinataConnection();
    if (!ipfsConnected) {
      console.warn("⚠️ IPFS connection test failed - check Pinata credentials");
    }
  } catch (ipfsError) {
    console.error("❌ IPFS initialization failed:", ipfsError.message);
    console.warn("⚠️ Continuing without IPFS support");
  }

  // 3. Initialize Blockchain
  try {
    await initializeBlockchain();
    if (isBlockchainReady()) {
      const balance = await getWalletBalance();
      console.log(`💰 Wallet balance: ${balance} ETH`);
    }
  } catch (blockchainError) {
    console.error("❌ Blockchain initialization failed:", blockchainError.message);
    console.warn("⚠️ Continuing without blockchain support");
  }

  console.log("\n✅ System initialization complete\n");
  
  // Mount routes AFTER initialization
  app.use("/", authRoutes(loggedInUsers));
  app.use("/", vcRoutes(loggedInUsers, bbsKeyPair, bbsLib));
  app.use("/", verifyRoutes(loggedInUsers, bbsLib));
  app.use("/holder", holderRoutes(loggedInUsers));
  app.use("/", holderAdvancedRoutes(loggedInUsers, bbsLib));
  app.use("/", didRoutes); // DID management routes
  app.use("/", challengeRoutes); // Challenge-response DID verification routes (NEW - mount first)
  app.use("/", credentialRequestRoutes); // Credential request routes (old - kept for compatibility)
}



// ------------------ Health Check ------------------
app.get("/health", async (req, res) => {
  let walletBalance = "N/A";
  try {
    if (isBlockchainReady()) {
      walletBalance = await getWalletBalance();
    }
  } catch (e) {
    // Ignore balance check errors
  }

  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    services: {
      bbsKeys: !!bbsKeyPair,
      ipfs: process.env.PINATA_API_KEY ? "configured" : "not configured",
      blockchain: isBlockchainReady() ? "ready" : "not configured",
      walletBalance: walletBalance
    },
    loggedInUsers: Object.keys(loggedInUsers).length
  });
});

// ------------------ BBS+ Test Route ------------------
app.get("/test-bbs", async (req, res) => {
  try {
    console.log("\n🧪 Testing BBS+ signatures...");
    
    if (!bbsLib) {
      bbsLib = await import('@digitalbazaar/bbs-signatures');
    }

    // Generate test key pair
    const testKeyPair = await bbsLib.generateKeyPair({ ciphersuite: bbsLib.CIPHERSUITES.BLS12381_SHA256 });
    console.log("✅ Test key pair generated");

    // Create test messages
    const messages = ["Hello", "World", "BBS+"].map(m => new TextEncoder().encode(m));
    console.log("✅ Test messages created");

    // Sign messages (header can be empty)
    const header = new Uint8Array();
    const signature = await bbsLib.sign({
      secretKey: testKeyPair.secretKey,
      publicKey: testKeyPair.publicKey,
      header: header,
      messages: messages,
      ciphersuite: bbsLib.CIPHERSUITES.BLS12381_SHA256
    });
    console.log("✅ Signature generated");

    // Verify signature
    const verified = await bbsLib.verifySignature({
      publicKey: testKeyPair.publicKey,
      header: header,
      signature: signature,
      messages: messages,
      ciphersuite: bbsLib.CIPHERSUITES.BLS12381_SHA256
    });
    console.log(`✅ Verification result: ${verified}`);

    // Test selective disclosure
    const presentationHeader = new Uint8Array();
    const proof = await bbsLib.deriveProof({
      publicKey: testKeyPair.publicKey,
      header: header,
      presentationHeader: presentationHeader,
      signature: signature,
      messages: messages,
      disclosedMessageIndexes: [0, 2], // Reveal "Hello" and "BBS+", hide "World"
      ciphersuite: bbsLib.CIPHERSUITES.BLS12381_SHA256
    });
    console.log("✅ Selective disclosure proof generated");

    // Verify proof (only pass disclosed messages)
    const disclosedMessages = [messages[0], messages[2]]; // "Hello" and "BBS+"
    const proofVerified = await bbsLib.verifyProof({
      publicKey: testKeyPair.publicKey,
      header: header,
      presentationHeader: presentationHeader,
      proof: proof,
      disclosedMessages: disclosedMessages,
      disclosedMessageIndexes: [0, 2],
      ciphersuite: bbsLib.CIPHERSUITES.BLS12381_SHA256
    });
    console.log(`✅ Proof verification result: ${proofVerified}\n`);

    res.json({
      success: true,
      verified: verified,
      proofVerified: proofVerified,
      message: "BBS+ signatures working correctly!",
      details: {
        signatureLength: signature.length,
        proofLength: proof.length,
        messagesCount: messages.length,
        disclosedCount: 2
      }
    });
  } catch (err) {
    console.error("❌ BBS+ test failed:", err);
    res.status(500).json({
      success: false,
      error: err.message,
      stack: err.stack
    });
  }
});

// ------------------ Start Server ------------------
const PORT = process.env.PORT || 5000;

initializeServices()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`🚀 Digital Identity Management Server`);
      console.log(`${'='.repeat(60)}`);
      console.log(`📍 Server URL: http://localhost:${PORT}`);
      console.log(`🔐 BBS+ Signatures: Enabled (BLS12-381)`);
      console.log(`📦 IPFS: ${process.env.PINATA_API_KEY ? 'Configured' : 'Not Configured'}`);
      console.log(`⛓️  Blockchain: ${isBlockchainReady() ? 'Connected (Sepolia)' : 'Not Configured'}`);
      console.log(`${'='.repeat(60)}\n`);
    });
  })
  .catch((error) => {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  });