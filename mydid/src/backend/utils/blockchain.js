// utils/blockchain.js - Ethereum blockchain integration for VC registry
const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

let provider = null;
let wallet = null;
let vcContract = null;

/**
 * Initialize blockchain connection to Sepolia testnet
 */
async function initializeBlockchain() {
  try {
    // Setup provider (Infura or Alchemy)
    const infuraKey = process.env.INFURA_API_KEY;
    const alchemyKey = process.env.ALCHEMY_API_KEY;
    
    if (infuraKey) {
      provider = new ethers.InfuraProvider("sepolia", infuraKey);
      console.log("✅ Connected to Sepolia via Infura");
    } else if (alchemyKey) {
      provider = new ethers.AlchemyProvider("sepolia", alchemyKey);
      console.log("✅ Connected to Sepolia via Alchemy");
    } else {
      throw new Error("No RPC provider configured (INFURA_API_KEY or ALCHEMY_API_KEY)");
    }

    // Setup wallet
    const privateKey = process.env.WALLET_PRIVATE_KEY;
    if (!privateKey) {
      throw new Error("WALLET_PRIVATE_KEY not configured in .env");
    }

    wallet = new ethers.Wallet(privateKey, provider);
    console.log(`✅ Wallet initialized: ${wallet.address}`);

    // Load contract
    const contractAddress = process.env.VC_CONTRACT_ADDRESS;
    if (!contractAddress) {
      console.warn("⚠️ VC_CONTRACT_ADDRESS not set - blockchain features disabled");
      return;
    }

    // Try to load ABI from artifacts
    const abiPath = path.join(__dirname, "../artifacts/contracts/VCRegistry.sol/VCRegistry.json");
    let abi;

    if (fs.existsSync(abiPath)) {
      const artifact = JSON.parse(fs.readFileSync(abiPath, "utf8"));
      abi = artifact.abi;
      console.log("✅ Loaded contract ABI from artifacts");
    } else {
      // Fallback minimal ABI if artifacts not found
      console.warn("⚠️ Contract artifacts not found, using minimal ABI");
      abi = [
        "function storeVC(string memory documentHash, string memory ipfsCID) public returns (uint256)",
        "function verifyVC(string memory documentHash) public view returns (bool exists, string memory ipfsCID, address issuer, uint256 timestamp, bool revoked)",
        "function revokeVC(string memory documentHash) public",
        "event VCStored(uint256 indexed vcId, string documentHash, string ipfsCID, address indexed issuer, uint256 timestamp)",
        "event VCRevoked(string documentHash, address indexed revoker, uint256 timestamp)"
      ];
    }

    vcContract = new ethers.Contract(contractAddress, abi, wallet);
    console.log(`✅ VC Registry contract loaded at: ${contractAddress}`);

  } catch (error) {
    console.error("❌ Blockchain initialization error:", error.message);
    throw error;
  }
}

/**
 * Store VC metadata on blockchain
 * @param {string} documentHash - SHA-256 hash of document
 * @param {string} ipfsCID - IPFS CID of VC JSON
 * @returns {Promise<{txHash: string, vcId: number}>}
 */
async function storeVCOnChain(documentHash, ipfsCID) {
  try {
    if (!vcContract) {
      throw new Error("VC contract not initialized");
    }

    console.log(`📤 Storing VC on blockchain...`);
    console.log(`   Hash: ${documentHash}`);
    console.log(`   CID: ${ipfsCID}`);

    const tx = await vcContract.storeVC(documentHash, ipfsCID);
    console.log(`⏳ Transaction submitted: ${tx.hash}`);
    
    const receipt = await tx.wait();
    console.log(`✅ Transaction confirmed in block ${receipt.blockNumber}`);

    // Extract vcId from event logs
    let vcId = null;
    if (receipt.logs && receipt.logs.length > 0) {
      try {
        const event = receipt.logs.find(log => log.topics[0] === vcContract.interface.getEvent("VCStored").topicHash);
        if (event) {
          const parsed = vcContract.interface.parseLog(event);
          vcId = parsed.args.vcId.toString();
        }
      } catch (e) {
        console.warn("⚠️ Could not parse vcId from event");
      }
    }

    return {
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      vcId: vcId,
      gasUsed: receipt.gasUsed.toString()
    };

  } catch (error) {
    console.error("❌ Error storing VC on blockchain:", error);
    throw new Error(`Blockchain storage failed: ${error.message}`);
  }
}

/**
 * Verify VC from blockchain
 * @param {string} documentHash - SHA-256 hash to verify
 * @returns {Promise<{exists: boolean, ipfsCID: string, issuer: string, timestamp: number, revoked: boolean}>}
 */
async function verifyVCOnChain(documentHash) {
  try {
    if (!vcContract) {
      throw new Error("VC contract not initialized");
    }

    console.log(`🔍 Verifying VC on blockchain: ${documentHash}`);

    const result = await vcContract.verifyVC(documentHash);
    
    const verification = {
      exists: result.exists,
      ipfsCID: result.ipfsCID,
      issuer: result.issuer,
      timestamp: Number(result.timestamp),
      revoked: result.revoked
    };

    console.log(`✅ Verification result:`, verification);
    return verification;

  } catch (error) {
    console.error("❌ Error verifying VC on blockchain:", error);
    throw new Error(`Blockchain verification failed: ${error.message}`);
  }
}

/**
 * Revoke VC on blockchain
 * @param {string} documentHash - SHA-256 hash to revoke
 * @returns {Promise<{txHash: string}>}
 */
async function revokeVCOnChain(documentHash) {
  try {
    if (!vcContract) {
      throw new Error("VC contract not initialized");
    }

    console.log(`🚫 Revoking VC on blockchain: ${documentHash}`);

    const tx = await vcContract.revokeVC(documentHash);
    console.log(`⏳ Revocation transaction submitted: ${tx.hash}`);
    
    const receipt = await tx.wait();
    console.log(`✅ Revocation confirmed in block ${receipt.blockNumber}`);

    return {
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString()
    };

  } catch (error) {
    console.error("❌ Error revoking VC on blockchain:", error);
    throw new Error(`Blockchain revocation failed: ${error.message}`);
  }
}

/**
 * Get wallet balance
 * @returns {Promise<string>}
 */
async function getWalletBalance() {
  try {
    if (!wallet || !provider) {
      throw new Error("Wallet not initialized");
    }

    const balance = await provider.getBalance(wallet.address);
    const balanceInEth = ethers.formatEther(balance);
    return balanceInEth;
  } catch (error) {
    console.error("❌ Error getting wallet balance:", error);
    return "0";
  }
}

/**
 * Check if blockchain is ready
 * @returns {boolean}
 */
function isBlockchainReady() {
  return !!(provider && wallet && vcContract);
}

module.exports = {
  initializeBlockchain,
  storeVCOnChain,
  verifyVCOnChain,
  revokeVCOnChain,
  getWalletBalance,
  isBlockchainReady
};
