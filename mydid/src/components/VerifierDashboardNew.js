import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import QRUploadZone from "./wallet/QRUploadZone";
import WalletCard from "./wallet/WalletCard";
import CardDetailsDrawer from "./wallet/CardDetailsDrawer";
import { saveVerifierHistory } from "../utils/walletStorage";
import "../styles/walletTheme.css";
import AnimatedPage from "./shared/AnimatedPage";

export default function VerifierDashboard() {
  const navigate = useNavigate();
  const [cid, setCid] = useState("");
  const [publicKey, setPublicKey] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saveToHistory, setSaveToHistory] = useState(true);
  const [showDrawer, setShowDrawer] = useState(false);
  const [qrError, setQrError] = useState(null);

  const handleQRSuccess = (data) => {
    console.log("✅ QR decoded:", data);
    setCid(data.cid);
    if (data.publicKey) {
      setPublicKey(data.publicKey);
    }
    setQrError(null);

    // Auto-verify if CID is valid
    if (data.cid && data.cid.length > 10) {
      setTimeout(() => verify(data.cid, data.publicKey), 500);
    }
  };

  const handleQRError = (error) => {
    console.error("❌ QR decode error:", error);
    setQrError(error);
  };

  const verify = async (providedCid = null, providedKey = null) => {
    const cidToVerify = providedCid || cid.trim();
    const keyToVerify = providedKey || publicKey.trim();

    if (!cidToVerify) {
      alert("Please enter or upload a QR code with an IPFS CID");
      return;
    }

    setLoading(true);
    setResult(null);
    setQrError(null);

    try {
      console.log("🔍 Sending verification request:", {
        cid: cidToVerify,
        publicKey: keyToVerify || 'none'
      });

      const response = await axios.post("http://localhost:5000/verifyVC", {
        cid: cidToVerify,
        publicKey: keyToVerify || undefined
      });

      setResult(response.data);
      console.log("✅ Verification result:", response.data);

      // Save to history if enabled
      if (saveToHistory && response.data.verified) {
        const userAddress = localStorage.getItem("userAddress") || "anonymous";
        saveVerifierHistory({
          cid: cidToVerify,
          issuerDid: response.data.details?.issuer || 'N/A',
          subjectDid: response.data.details?.subject || 'N/A',
          vcType: response.data.vc?.type?.[1] || 'VerifiableCredential',
          result: response.data.verified ? 'verified' : 'failed',
          chainHashMatch: response.data.hashMatch || false
        }, userAddress);
        console.log("💾 Saved to verification history");
      }

    } catch (error) {
      console.error("❌ Verification error:", error);

      const errorMessage = error.response?.data?.message
        || error.response?.data?.error
        || error.message
        || "Verification failed";

      setResult({
        success: false,
        verified: false,
        error: errorMessage,
        details: {}
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setCid("");
    setPublicKey("");
    setResult(null);
    setQrError(null);
  };

  const getStatusIcon = (value) => {
    if (value === true) return "✅";
    if (value === false) return "❌";
    return "⚠️";
  };

  const getStatusColor = (value) => {
    if (value === true) return "var(--color-success)";
    if (value === false) return "var(--color-error)";
    return "var(--color-warning)";
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
                Verify Credential
              </h1>
              <p className="text-slate-600 dark:text-slate-400 text-lg">
                Upload QR code or enter CID to verify a credential
              </p>
            </div>
            <button
              onClick={() => navigate("/verifier/history")}
              className="px-6 py-3 bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/30 rounded-xl text-gray-900 dark:text-white font-semibold transition-all flex items-center gap-2"
            >
              📜 View History
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

            {/* Left Column - Input */}
            <div>
              {/* QR Upload */}
              <div style={{ marginBottom: '24px' }}>
                <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                  📷 Upload QR Code
                </h3>
                <QRUploadZone
                  onSuccess={handleQRSuccess}
                  onError={handleQRError}
                />
                {qrError && (
                  <div style={{
                    marginTop: '12px',
                    padding: '12px',
                    background: 'rgba(245, 54, 92, 0.1)',
                    border: '1px solid var(--color-error)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--color-error)',
                    fontSize: 'var(--font-size-sm)'
                  }}>
                    ❌ {qrError}
                  </div>
                )}
              </div>

              {/* Manual Input */}
              <div className="bg-white dark:bg-slate-800/50 p-6 rounded-xl shadow-md border border-slate-200 dark:border-slate-700">
                <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                  ✍️ Or Enter Manually
                </h3>

                <div style={{ marginBottom: '16px' }}>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    IPFS CID *
                  </label>
                  <input
                    type="text"
                    value={cid}
                    onChange={(e) => setCid(e.target.value)}
                    placeholder="QmXyz..."
                    className="w-full px-4 py-3 bg-white dark:bg-slate-900/50 border border-slate-300 dark:border-slate-600 rounded-lg text-sm font-mono focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-gray-900 dark:text-white"
                  />
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    BBS+ Public Key (Optional)
                  </label>
                  <input
                    type="text"
                    value={publicKey}
                    onChange={(e) => setPublicKey(e.target.value)}
                    placeholder="Base64 encoded public key..."
                    className="w-full px-4 py-3 bg-white dark:bg-slate-900/50 border border-slate-300 dark:border-slate-600 rounded-lg text-sm font-mono focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-gray-900 dark:text-white"
                  />
                </div>

                {/* Save to History Toggle */}
                <label className="flex items-center gap-2 mb-5 cursor-pointer text-sm text-slate-600 dark:text-slate-400">
                  <input
                    type="checkbox"
                    checked={saveToHistory}
                    onChange={(e) => setSaveToHistory(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                  <span>Save successful verifications to history</span>
                </label>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={() => verify()}
                    disabled={loading || !cid.trim()}
                    className={`flex-1 py-3.5 rounded-lg font-semibold text-white transition-all flex items-center justify-center gap-2 ${loading || !cid.trim()
                        ? "bg-slate-300 dark:bg-slate-700 cursor-not-allowed"
                        : "bg-gradient-to-r from-navy-dark to-navy hover:shadow-lg hover:-translate-y-0.5"
                      }`}
                  >
                    {loading ? '🔄 Verifying...' : '✓ Verify Credential'}
                  </button>
                  <button
                    onClick={handleReset}
                    className="px-6 py-3.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                  >
                    Reset
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column - Result */}
            <div>
              {result ? (
                <WalletCard
                  type="Verification"
                  title="Credential Verification"
                  subtitle={result.verified ? "Verification Successful" : "Verification Failed"}
                  headerBadge={result.verified ? "Verified" : "Failed"}
                  icon={result.verified ? "✓" : "✕"}
                  meta={[
                    { label: 'Structure Valid', value: getStatusIcon(result.structureValid) },
                    { label: 'IPFS Valid', value: getStatusIcon(result.ipfsValid) },
                    { label: 'Blockchain Valid', value: getStatusIcon(result.blockchainValid) },
                    { label: 'Hash Match', value: getStatusIcon(result.hashMatch) },
                    { label: 'Revoked', value: result.revoked ? '❌ Yes' : '✅ No' },
                    { label: 'Issuer', value: truncate(result.details?.issuer, 30) },
                    { label: 'Subject', value: truncate(result.details?.subject, 30) }
                  ]}
                  actions={[
                    {
                      label: 'View Details',
                      onClick: () => setShowDrawer(true),
                      variant: 'primary',
                      icon: '👁️'
                    },
                    {
                      label: 'Verify Another',
                      onClick: handleReset,
                      variant: 'ghost',
                      icon: '🔄'
                    }
                  ]}
                  onExpand={() => setShowDrawer(true)}
                />
              ) : (
                <div style={{
                  background: 'white',
                  padding: '48px 24px',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: 'var(--shadow-md)',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '64px', marginBottom: '16px' }}>🔍</div>
                  <h3 style={{
                    fontSize: 'var(--font-size-xl)',
                    fontWeight: '600',
                    color: 'var(--color-text-primary)',
                    marginBottom: '8px'
                  }}>
                    Ready to Verify
                  </h3>
                  <p style={{
                    fontSize: 'var(--font-size-base)',
                    color: 'var(--color-text-secondary)',
                    maxWidth: '300px',
                    margin: '0 auto'
                  }}>
                    Upload a QR code or enter a CID to verify a credential
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Details Drawer */}
        <CardDetailsDrawer
          isOpen={showDrawer}
          onClose={() => setShowDrawer(false)}
          title="Verification Details"
        >
          {result && (
            <div style={{ fontSize: 'var(--font-size-sm)' }}>
              {/* Overall Status */}
              <div style={{
                padding: '20px',
                background: result.verified
                  ? 'rgba(45, 206, 137, 0.1)'
                  : 'rgba(245, 54, 92, 0.1)',
                borderRadius: 'var(--radius-md)',
                marginBottom: '24px',
                border: `2px solid ${result.verified ? 'var(--color-success)' : 'var(--color-error)'}`
              }}>
                <div style={{
                  fontSize: 'var(--font-size-2xl)',
                  fontWeight: '600',
                  color: result.verified ? 'var(--color-success)' : 'var(--color-error)',
                  marginBottom: '8px'
                }}>
                  {result.verified ? '✅ Credential Verified' : '❌ Verification Failed'}
                </div>
                {result.error && (
                  <div style={{ color: 'var(--color-error)', fontSize: 'var(--font-size-sm)' }}>
                    {result.error}
                  </div>
                )}
              </div>

              {/* Verification Checks */}
              <h4 style={{
                fontSize: 'var(--font-size-base)',
                fontWeight: '600',
                marginBottom: '12px',
                color: 'var(--color-text-primary)'
              }}>
                Verification Checks
              </h4>
              <div style={{ display: 'grid', gap: '8px', marginBottom: '24px' }}>
                <CheckRow label="Structure Valid" value={result.structureValid} />
                <CheckRow label="IPFS Valid" value={result.ipfsValid} />
                <CheckRow label="Blockchain Valid" value={result.blockchainValid} />
                <CheckRow label="Hash Match" value={result.hashMatch} />
                <CheckRow label="Not Revoked" value={!result.revoked} />
                {result.bbsProofValid !== undefined && (
                  <CheckRow label="BBS+ Proof Valid" value={result.bbsProofValid} />
                )}
              </div>

              {/* Credential Details */}
              {result.details && (
                <>
                  <h4 style={{
                    fontSize: 'var(--font-size-base)',
                    fontWeight: '600',
                    marginBottom: '12px',
                    color: 'var(--color-text-primary)'
                  }}>
                    Credential Details
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                    {result.details.issuer && (
                      <DetailField label="Issuer DID" value={result.details.issuer} mono />
                    )}
                    {result.details.subject && (
                      <DetailField label="Subject DID" value={result.details.subject} mono />
                    )}
                    {result.details.issuanceDate && (
                      <DetailField label="Issuance Date" value={new Date(result.details.issuanceDate).toLocaleString()} />
                    )}
                    {result.details.proofType && (
                      <DetailField label="Proof Type" value={result.details.proofType} />
                    )}
                  </div>
                </>
              )}

              {/* Blockchain Info */}
              {result.details?.blockchain && (
                <>
                  <h4 style={{
                    fontSize: 'var(--font-size-base)',
                    fontWeight: '600',
                    marginBottom: '12px',
                    color: 'var(--color-text-primary)'
                  }}>
                    Blockchain Information
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                    <DetailField label="Issuer Address" value={result.details.blockchain.issuer} mono />
                    <DetailField label="Timestamp" value={result.details.blockchain.timestamp} />
                    <DetailField label="IPFS CID" value={result.details.blockchain.ipfsCID} mono />
                    <DetailField
                      label="Revoked"
                      value={result.details.blockchain.revoked ? 'Yes' : 'No'}
                      valueColor={result.details.blockchain.revoked ? 'var(--color-error)' : 'var(--color-success)'}
                    />
                  </div>
                </>
              )}

              {/* Raw VC Data */}
              {result.vc && (
                <>
                  <h4 style={{
                    fontSize: 'var(--font-size-base)',
                    fontWeight: '600',
                    marginBottom: '12px',
                    color: 'var(--color-text-primary)'
                  }}>
                    Raw VC Data
                  </h4>
                  <pre style={{
                    background: '#f8f9fa',
                    padding: '16px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '11px',
                    overflow: 'auto',
                    maxHeight: '300px',
                    border: '1px solid var(--color-border)'
                  }}>
                    {JSON.stringify(result.vc, null, 2)}
                  </pre>
                </>
              )}
            </div>
          )}
        </CardDetailsDrawer>
      </div>
    </AnimatedPage>
  );
}

// Helper Components
function CheckRow({ label, value }) {
  const icon = value === true ? '✅' : value === false ? '❌' : '⚠️';
  const color = value === true ? 'var(--color-success)' : value === false ? 'var(--color-error)' : 'var(--color-warning)';

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '12px',
      background: 'rgba(0,0,0,0.02)',
      borderRadius: 'var(--radius-sm)'
    }}>
      <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
        {label}
      </span>
      <span style={{ fontSize: 'var(--font-size-base)', color, fontWeight: '600' }}>
        {icon}
      </span>
    </div>
  );
}

function DetailField({ label, value, mono = false, valueColor = 'var(--color-text-primary)' }) {
  return (
    <div style={{
      padding: '12px',
      background: 'rgba(0,0,0,0.02)',
      borderRadius: 'var(--radius-sm)'
    }}>
      <div style={{
        fontSize: 'var(--font-size-xs)',
        color: 'var(--color-text-secondary)',
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        marginBottom: '4px'
      }}>
        {label}
      </div>
      <div style={{
        fontSize: 'var(--font-size-sm)',
        color: valueColor,
        fontWeight: '600',
        fontFamily: mono ? 'monospace' : 'inherit',
        wordBreak: 'break-all'
      }}>
        {value || 'N/A'}
      </div>
    </div>
  );
}
