// // routes/generatedid.js
// const express = require("express");
// const bls = require("@noble/bls12-381");

// module.exports = (loggedInUsers) => {
//   const router = express.Router();

//   // Temporary store for DID key pairs (server-side only)
//   const didStore = {};

//   router.get("/:address", async (req, res) => {
//     const { address } = req.params;

//     if (!loggedInUsers[address]) {
//       return res.status(403).json({ success: false, message: "Unauthorized. Login first with MetaMask." });
//     }

//     // Return cached DID if already generated
//     if (didStore[address]) {
//       return res.json({
//         success: true,
//         did: didStore[address].did,
//         publicKey: didStore[address].publicKey
//       });
//     }

//     try {
//       // Generate BLS12-381 key pair
//       const privateKey = bls.utils.randomPrivateKey();
//       const publicKey = await bls.getPublicKey(privateKey);

//       // Create DID
//       const did = `did:example:${address}`;

//       // Save to memory (do NOT expose private key to frontend)
//       didStore[address] = {
//         did,
//         privateKey: Buffer.from(privateKey).toString("hex"),
//         publicKey: Buffer.from(publicKey).toString("hex")
//       };

//       console.log("✅ DID created:", didStore[address]);

//       // Return only DID + publicKey
//       res.json({
//         success: true,
//         did,
//         publicKey: didStore[address].publicKey
//       });
//     } catch (err) {
//       console.error("❌ DID generation error:", err);
//       res.status(500).json({ success: false, message: err.message });
//     }
//   });

//   return router;
// };
