import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { Share2, CheckCircle, AlertCircle, User, Shield } from "lucide-react";

export default function HolderShareDID() {
  const { userAddress, did } = useAuth();
  const [isShared, setIsShared] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [error, setError] = useState(null);
  const [holderName, setHolderName] = useState("");
  const [showNameInput, setShowNameInput] = useState(false);

  // Check if DID is already shared
  useEffect(() => {
    checkIfShared();
  }, [userAddress]);

  const checkIfShared = async () => {
    try {
      const response = await axios.get("http://localhost:5000/getRegisteredHolders");
      if (response.data.success) {
        const isRegistered = response.data.holders.some(
          h => h.holderAddress === userAddress
        );
        setIsShared(isRegistered);
      }
    } catch (err) {
      console.error("Error checking registration status:", err);
    }
  };

  const handleShareDID = async () => {
    if (!holderName.trim() && !isShared) {
      setShowNameInput(true);
      return;
    }

    try {
      setIsSharing(true);
      setError(null);

      const response = await axios.post("http://localhost:5000/registerHolderDID", {
        holderAddress: userAddress,
        holderDID: did,
        holderName: holderName.trim() || "Unknown Holder"
      });

      if (response.data.success) {
        setIsShared(true);
        setShowNameInput(false);
        console.log(" DID shared successfully");
      } else {
        setError(response.data.message || "Failed to share DID");
      }
    } catch (err) {
      console.error("Error sharing DID:", err);
      setError(err.response?.data?.message || "Failed to share DID with issuer");
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl shadow-lg p-6 border-2 border-green-200 dark:border-green-800"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
            <Share2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-800 dark:text-white">Share Your DID</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">Allow issuers to send credentials directly to you</p>
          </div>
        </div>

        {isShared && (
          <div className="flex items-center space-x-2 px-3 py-1 bg-green-100 dark:bg-green-900/50 rounded-full border border-green-300 dark:border-green-700">
            <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
            <span className="text-sm font-semibold text-green-700 dark:text-green-300">Shared</span>
          </div>
        )}
      </div>

      {/* DID Display */}
      <div className="bg-white dark:bg-slate-800 rounded-lg p-4 mb-4 border border-green-200 dark:border-green-800">
        <div className="flex items-center space-x-2 mb-2">
          <Shield className="w-4 h-4 text-green-600 dark:text-green-400" />
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Your DID:</span>
        </div>
        <p className="font-mono text-sm text-gray-800 dark:text-gray-200 break-all bg-gray-50 dark:bg-slate-900 p-2 rounded">
          {did}
        </p>
      </div>

      {/* Name Input (if not shared yet) */}
      {showNameInput && !isShared && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="mb-4"
        >
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            <User className="w-4 h-4 inline mr-1" />
            Your Name (Optional)
          </label>
          <input
            type="text"
            value={holderName}
            onChange={(e) => setHolderName(e.target.value)}
            placeholder="Enter your name for issuers to identify you"
            className="w-full px-4 py-3 border-2 border-green-300 dark:border-green-700 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 dark:bg-slate-800 dark:text-white transition-all font-semibold"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            This helps issuers identify you when issuing credentials
          </p>
        </motion.div>
      )}

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2"
        >
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </motion.div>
      )}

      {/* Action Button */}
      {!isShared ? (
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleShareDID}
          disabled={isSharing}
          className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg transition-all duration-300 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSharing ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Sharing...</span>
            </>
          ) : (
            <>
              <Share2 className="w-5 h-5" />
              <span>Share DID with Issuers</span>
            </>
          )}
        </motion.button>
      ) : (
        <div className="bg-green-100 border-2 border-green-300 rounded-xl p-4">
          <div className="flex items-center space-x-3">
            <CheckCircle className="w-6 h-6 text-green-600" />
            <div>
              <p className="font-bold text-green-800 dark:text-green-300">DID Shared Successfully!</p>
              <p className="text-sm text-green-700 dark:text-green-400">
                Issuers can now send verifiable credentials directly to your DID
              </p>
            </div>
          </div>

          {/* Update Button */}
          <button
            onClick={() => {
              setIsShared(false);
              setShowNameInput(true);
            }}
            className="mt-3 w-full px-4 py-2 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 text-green-700 dark:text-green-400 font-semibold rounded-lg border border-green-300 dark:border-green-700 transition-all"
          >
            Update Information
          </button>
        </div>
      )}

      {/* Info Box */}
      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <p className="text-xs text-blue-800 dark:text-blue-300">
          <strong>Why share your DID?</strong><br />
          When you share your DID, issuers can select you from their list and issue credentials directly to you.
          You'll automatically receive these credentials in your wallet.
        </p>
      </div>
    </motion.div>
  );
}
