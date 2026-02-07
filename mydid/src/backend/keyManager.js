// keyManager.js
const fs = require("fs");
const bs58 = require("bs58");
const { generateBls12381G2KeyPair } = require("@mattrglobal/bbs-signatures");

// Generate BBS+ compatible BLS12-381 key pair
async function generateKeys() {
  try {
    const keyPair = await generateBls12381G2KeyPair();

    const privateKeyBase58 = bs58.encode(keyPair.secretKey);
    const publicKeyBase58 = bs58.encode(keyPair.publicKey);

    const keyData = {
      privateKey: privateKeyBase58,
      publicKey: publicKeyBase58,
    };

    fs.writeFileSync("bbs_keys.json", JSON.stringify(keyData, null, 2));

    console.log("✅ Keys generated and saved to bbs_keys.json");
  } catch (err) {
    console.error("❌ Error generating keys:", err);
  }
}

generateKeys();
