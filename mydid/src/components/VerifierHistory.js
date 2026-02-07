import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import WalletCard from "./wallet/WalletCard";
import CardDetailsDrawer from "./wallet/CardDetailsDrawer";
import {
  listVerifierHistory,
  deleteHistoryItem,
  clearVerifierHistory
} from "../utils/walletStorage";
import "../styles/walletTheme.css";
import AnimatedPage from "./shared/AnimatedPage";

export default function VerifierHistory() {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showDrawer, setShowDrawer] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = () => {
    const userAddress = localStorage.getItem("userAddress") || "anonymous";
    const items = listVerifierHistory(userAddress);
    setHistory(items);
    console.log(`📋 Loaded ${items.length} verification history items`);
  };

  const handleDelete = (id, e) => {
    // Prevent event propagation if event exists
    if (e && e.stopPropagation) {
      e.stopPropagation();
    }

    if (window.confirm("Remove this verification from history?\n\nThis only removes it from your local view. The credential on blockchain/IPFS is not affected.")) {
      const userAddress = localStorage.getItem("userAddress") || "anonymous";
      deleteHistoryItem(id, userAddress);
      loadHistory();
      console.log(`🗑️ Deleted history item: ${id}`);
    }
  };

  const handleClearAll = () => {
    setShowClearConfirm(true);
  };

  const confirmClearAll = () => {
    const userAddress = localStorage.getItem("userAddress") || "anonymous";
    clearVerifierHistory(userAddress);
    loadHistory();
    setShowClearConfirm(false);
    console.log("🗑️ Cleared all verification history");
  };

  const handleViewDetails = (item) => {
    setSelectedItem(item);
    setShowDrawer(true);
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const truncate = (str, length = 40) => {
    if (!str) return 'N/A';
    return str.length > length ? str.substring(0, length) + '...' : str;
  };

  return (
    <AnimatedPage className="min-h-screen py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 animate-fadeIn">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl sm:text-5xl font-extrabold mb-2 bg-gradient-to-r from-navy-dark via-navy to-navy-dark dark:text-white dark:bg-none bg-clip-text text-transparent drop-shadow-sm dark:drop-shadow-[0_2px_10px_rgba(53,87,125,0.5)]">
                Verification History
              </h1>
              <p className="text-slate-600 dark:text-slate-400 text-lg">
                {history.length} verification{history.length !== 1 ? 's' : ''} recorded locally
              </p>
            </div>
            <div className="flex gap-3">
              {history.length > 0 && (
                <button
                  onClick={handleClearAll}
                  className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 rounded-lg transition-all duration-300 flex items-center gap-2 font-semibold backdrop-blur-sm"
                >
                  🗑️ Clear All
                </button>
              )}
              <button
                onClick={() => navigate("/verifier-dashboard")}
                className="px-6 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-lg transition-all duration-300 flex items-center gap-2 font-semibold backdrop-blur-sm"
              >
                ← Back to Verifier
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="w-full">
          {history.length === 0 ? (
            // Empty State
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-12 text-center max-w-2xl mx-auto">
              <div className="text-6xl mb-4">📭</div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">No Verification History</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Verified credentials will appear here. Start verifying credentials to build your history.
              </p>
              <button
                onClick={() => navigate("/verifier-dashboard")}
                className="px-6 py-3 bg-gradient-to-r from-navy-dark to-navy text-white rounded-lg font-semibold shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-300"
              >
                Verify a Credential
              </button>
            </div>
          ) : (
            // History Grid
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {history.map((item) => (
                <WalletCard
                  key={item.id}
                  type="Verification"
                  title={item.vcType || "Verifiable Credential"}
                  subtitle={formatDate(item.timestamp)}
                  headerBadge={item.result === 'verified' ? 'Verified' : 'Failed'}
                  icon={item.result === 'verified' ? '✓' : '✕'}
                  meta={[
                    { label: 'CID', value: truncate(item.cid, 30) },
                    { label: 'Issuer', value: truncate(item.issuerDid, 30) },
                    { label: 'Subject', value: truncate(item.subjectDid, 30) },
                    { label: 'Hash Match', value: item.chainHashMatch ? '✓ Yes' : '✕ No' }
                  ]}
                  actions={[
                    {
                      label: 'View Details',
                      onClick: (e) => handleViewDetails(item),
                      variant: 'ghost',
                      icon: '👁️'
                    },
                    {
                      label: 'Delete',
                      onClick: (e) => handleDelete(item.id, e),
                      variant: 'danger',
                      icon: '🗑️'
                    }
                  ]}
                  onExpand={() => handleViewDetails(item)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Details Drawer */}
        <CardDetailsDrawer
          isOpen={showDrawer}
          onClose={() => setShowDrawer(false)}
          title="Verification Details"
        >
          {selectedItem && (
            <div className="text-sm">
              {/* Status */}
              <div className={`p-4 rounded-lg mb-6 border-2 ${selectedItem.result === 'verified'
                ? 'bg-green-500/10 border-green-500'
                : 'bg-red-500/10 border-red-500'
                }`}>
                <div className={`text-2xl font-bold mb-2 ${selectedItem.result === 'verified' ? 'text-green-500' : 'text-red-500'
                  }`}>
                  {selectedItem.result === 'verified' ? '✅ Verified' : '❌ Failed'}
                </div>
                <div className="text-gray-500">
                  {formatDate(selectedItem.timestamp)}
                </div>
              </div>

              {/* Details */}
              <div className="flex flex-col gap-4">
                <DetailRow label="Credential Type" value={selectedItem.vcType || 'N/A'} />
                <DetailRow label="IPFS CID" value={selectedItem.cid} mono />
                <DetailRow label="Issuer DID" value={selectedItem.issuerDid || 'N/A'} mono />
                <DetailRow label="Subject DID" value={selectedItem.subjectDid || 'N/A'} mono />
                <DetailRow
                  label="Blockchain Hash Match"
                  value={selectedItem.chainHashMatch ? '✓ Verified' : '✕ Failed'}
                  valueColor={selectedItem.chainHashMatch ? 'var(--color-success)' : 'var(--color-error)'}
                />
              </div>

              {/* Actions */}
              <div className="mt-8 pt-6 border-t border-gray-200 flex gap-3">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(selectedItem.cid);
                    alert('CID copied to clipboard!');
                  }}
                  className="flex-1 py-3 bg-slate-800 text-white rounded-lg font-semibold hover:bg-slate-700 transition-colors"
                >
                  📋 Copy CID
                </button>
                <button
                  onClick={(e) => {
                    setShowDrawer(false);
                    handleDelete(selectedItem.id, e);
                  }}
                  className="flex-1 py-3 bg-red-50 text-red-500 border border-red-200 rounded-lg font-semibold hover:bg-red-100 transition-colors"
                >
                  🗑️ Delete
                </button>
              </div>
            </div>
          )}
        </CardDetailsDrawer>

        {/* Clear All Confirmation Modal */}
        {showClearConfirm && (
          <>
            <div
              className="fixed inset-0 bg-black/50 z-[1001] backdrop-blur-sm"
              onClick={() => setShowClearConfirm(false)}
            />
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-slate-800 rounded-xl p-8 max-w-md w-[90%] shadow-2xl z-[1002] animate-scaleIn">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
                Clear All History?
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                This will permanently delete all {history.length} verification records from your local history.
                <br /><br />
                <strong>Note:</strong> This only affects your local view. Credentials on blockchain/IPFS are not affected.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="flex-1 py-3 bg-transparent border border-gray-300 dark:border-slate-600 rounded-lg text-gray-600 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmClearAll}
                  className="flex-1 py-3 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition-colors shadow-md"
                >
                  Clear All
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </AnimatedPage>
  );
}

// Helper component for detail rows
function DetailRow({ label, value, mono = false, valueColor = 'var(--color-text-primary)' }) {
  return (
    <div className="flex flex-col gap-1 p-3 bg-gray-50 dark:bg-slate-900 rounded-lg border border-gray-100 dark:border-slate-800">
      <div className="text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wider">
        {label}
      </div>
      <div
        className={`text-sm font-semibold break-all ${mono ? 'font-mono' : ''}`}
        style={{ color: valueColor }}
      >
        {value}
      </div>
    </div>
  );
}
