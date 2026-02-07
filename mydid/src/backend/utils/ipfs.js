// utils/ipfs.js - IPFS integration using Pinata SDK
const pinataSDK = require("@pinata/sdk");
const fs = require("fs");

let pinata = null;

/**
 * Initialize Pinata client
 */
function initializePinata() {
  const apiKey = process.env.PINATA_API_KEY;
  const secretApiKey = process.env.PINATA_SECRET_API_KEY;

  if (!apiKey || !secretApiKey) {
    throw new Error("Pinata API keys not configured in .env file");
  }

  pinata = new pinataSDK(apiKey, secretApiKey);
  console.log("✅ Pinata IPFS client initialized");
}

/**
 * Test Pinata authentication
 * @returns {Promise<boolean>}
 */
async function testPinataConnection() {
  try {
    await pinata.testAuthentication();
    console.log("✅ Pinata authentication successful");
    return true;
  } catch (error) {
    console.error("❌ Pinata authentication failed:", error.message);
    return false;
  }
}

/**
 * Upload file to IPFS via Pinata
 * @param {string} filePath - Path to file
 * @param {string} fileName - Original filename
 * @returns {Promise<{cid: string, ipfsUrl: string}>}
 */
async function uploadFileToPinata(filePath, fileName) {
  try {
    if (!pinata) {
      throw new Error("Pinata not initialized");
    }

    const readableStream = fs.createReadStream(filePath);
    
    const options = {
      pinataMetadata: {
        name: fileName,
        keyvalues: {
          uploadedAt: new Date().toISOString(),
          type: "document"
        }
      },
      pinataOptions: {
        cidVersion: 0
      }
    };

    const result = await pinata.pinFileToIPFS(readableStream, options);
    
    const cid = result.IpfsHash;
    const ipfsUrl = `https://gateway.pinata.cloud/ipfs/${cid}`;
    
    console.log(`✅ File uploaded to IPFS: ${cid}`);
    console.log(`📋 IPFS URL: ${ipfsUrl}`);

    return { cid, ipfsUrl };
  } catch (error) {
    console.error("❌ Error uploading file to Pinata:", error);
    throw new Error("Failed to upload file to IPFS");
  }
}

/**
 * Upload JSON data to IPFS via Pinata
 * @param {Object} jsonData - JSON object to upload
 * @param {string} name - Name for the pinned JSON
 * @returns {Promise<{cid: string, ipfsUrl: string}>}
 */
async function uploadJSONToPinata(jsonData, name) {
  try {
    if (!pinata) {
      throw new Error("Pinata not initialized");
    }

    const options = {
      pinataMetadata: {
        name: name,
        keyvalues: {
          uploadedAt: new Date().toISOString(),
          type: "vc-json"
        }
      },
      pinataOptions: {
        cidVersion: 0
      }
    };

    const result = await pinata.pinJSONToIPFS(jsonData, options);
    
    const cid = result.IpfsHash;
    const ipfsUrl = `https://gateway.pinata.cloud/ipfs/${cid}`;
    
    console.log(`✅ JSON uploaded to IPFS: ${cid}`);
    console.log(`📋 IPFS URL: ${ipfsUrl}`);

    return { cid, ipfsUrl };
  } catch (error) {
    console.error("❌ Error uploading JSON to Pinata:", error);
    throw new Error("Failed to upload JSON to IPFS");
  }
}

/**
 * Retrieve JSON from IPFS
 * @param {string} cid - IPFS CID
 * @returns {Promise<Object>}
 */
async function retrieveJSONFromIPFS(cid) {
  try {
    const axios = require("axios");
    const url = `https://gateway.pinata.cloud/ipfs/${cid}`;
    const response = await axios.get(url);
    console.log(`✅ Retrieved JSON from IPFS: ${cid}`);
    return response.data;
  } catch (error) {
    console.error("❌ Error retrieving JSON from IPFS:", error);
    throw new Error("Failed to retrieve JSON from IPFS");
  }
}

/**
 * Unpin content from IPFS (optional cleanup)
 * @param {string} cid - IPFS CID to unpin
 * @returns {Promise<boolean>}
 */
async function unpinFromIPFS(cid) {
  try {
    if (!pinata) {
      throw new Error("Pinata not initialized");
    }

    await pinata.unpin(cid);
    console.log(`✅ Unpinned from IPFS: ${cid}`);
    return true;
  } catch (error) {
    console.error("❌ Error unpinning from IPFS:", error);
    return false;
  }
}

module.exports = {
  initializePinata,
  testPinataConnection,
  uploadFileToPinata,
  uploadJSONToPinata,
  retrieveJSONFromIPFS,
  unpinFromIPFS
};
