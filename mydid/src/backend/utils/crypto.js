// utils/crypto.js - Cryptographic utilities for hashing and verification
const crypto = require("crypto");
const fs = require("fs");

/**
 * Compute SHA-256 hash of file contents
 * @param {string} filePath - Path to the file
 * @returns {string} - Hex-encoded SHA-256 hash
 */
function computeFileHash(filePath) {
  try {
    const fileBuffer = fs.readFileSync(filePath);
    const hash = crypto.createHash("sha256").update(fileBuffer).digest("hex");
    console.log(`✅ Computed SHA-256 hash: ${hash}`);
    return hash;
  } catch (error) {
    console.error("❌ Error computing file hash:", error);
    throw new Error("Failed to compute file hash");
  }
}

/**
 * Compute SHA-256 hash of string data
 * @param {string} data - String data to hash
 * @returns {string} - Hex-encoded SHA-256 hash
 */
function computeStringHash(data) {
  try {
    const hash = crypto.createHash("sha256").update(data).digest("hex");
    return hash;
  } catch (error) {
    console.error("❌ Error computing string hash:", error);
    throw new Error("Failed to compute string hash");
  }
}

/**
 * Generate random challenge for proof
 * @returns {string} - Hex-encoded random challenge
 */
function generateChallenge() {
  return crypto.randomBytes(32).toString("hex");
}

module.exports = {
  computeFileHash,
  computeStringHash,
  generateChallenge
};
