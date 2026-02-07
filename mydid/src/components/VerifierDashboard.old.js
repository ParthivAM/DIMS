import React, { useState, useEffect } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import axios from "axios";
import QRCode from "react-qr-code";

export default function VerifierDashboard() {
  const [cid, setCid] = useState("");
  const [publicKey, setPublicKey] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanner, setScanner] = useState(null);

  // Initialize QR Scanner
  useEffect(() => {
    if (scanning && !scanner) {
      const html5QrcodeScanner = new Html5QrcodeScanner(
        "qr-reader",
        { 
          fps: 10, 
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0
        },
        false
      );

      html5QrcodeScanner.render(
        (decodedText) => {
          console.log("QR Code scanned:", decodedText);
          
          // Try to parse as JSON (might contain CID + publicKey)
          try {
            const data = JSON.parse(decodedText);
            if (data.cid) setCid(data.cid);
            if (data.publicKey) setPublicKey(data.publicKey);
          } catch {
            // If not JSON, treat as plain CID
            setCid(decodedText);
          }
          
          // Stop scanning after successful scan
          html5QrcodeScanner.clear();
          setScanning(false);
          setScanner(null);
        },
        (error) => {
          // Ignore scan errors (happens continuously while scanning)
        }
      );

      setScanner(html5QrcodeScanner);
    }

    return () => {
      if (scanner) {
        scanner.clear().catch(console.error);
      }
    };
  }, [scanning, scanner]);

  const startScanning = () => {
    setScanning(true);
    setResult(null);
  };

  const stopScanning = () => {
    if (scanner) {
      scanner.clear();
      setScanner(null);
    }
    setScanning(false);
  };

  const verify = async () => {
    if (!cid.trim()) {
      alert("Please enter or scan an IPFS CID");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      console.log("Sending verification request:", { cid: cid.trim(), publicKey: publicKey.trim() || 'none' });
      
      const response = await axios.post("http://localhost:5000/verifyVC", {
        cid: cid.trim(),
        publicKey: publicKey.trim() || undefined
      });

      setResult(response.data);
      console.log("Verification result:", response.data);
    } catch (error) {
      console.error("Verification error:", error);
      console.error("Error response:", error.response?.data);
      
      const errorMessage = error.response?.data?.message 
        || error.response?.data?.error 
        || error.message 
        || "Verification failed";
      
      const errorDetails = error.response?.data?.stack 
        || error.response?.data?.details 
        || "";
      
      setResult({
        success: false,
        error: errorMessage,
        errorDetails: errorDetails,
        rawError: error.response?.data
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (isValid) => {
    return isValid ? "✅" : "❌";
  };

  const getStatusColor = (isValid) => {
    return isValid ? "text-green-600" : "text-red-600";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Back to Home Button */}
        <div className="mb-6 flex justify-end">
          <button
            onClick={() => {
              if (window.confirm("Return to portal selection? You will be logged out.")) {
                localStorage.clear();
                window.location.href = "/";
              }
            }}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-lg transition-all duration-300 flex items-center gap-2 font-semibold"
          >
            ← Back to Home
          </button>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            🔍 Verifier Portal
          </h1>
          <p className="text-gray-600">
            Scan QR code or enter IPFS CID to verify credentials
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          {/* QR Scanner Section */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-700">
                📷 QR Code Scanner
              </h2>
              {!scanning ? (
                <button
                  onClick={startScanning}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition flex items-center gap-2"
                >
                  <span>📸</span> Start Scanning
                </button>
              ) : (
                <button
                  onClick={stopScanning}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition flex items-center gap-2"
                >
                  <span>⏹️</span> Stop Scanning
                </button>
              )}
            </div>

            {scanning && (
              <div className="border-4 border-indigo-200 rounded-lg p-4 bg-gray-50">
                <div id="qr-reader" className="w-full"></div>
              </div>
            )}
          </div>

          {/* Manual Input Section */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                IPFS CID <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                className="w-full border-2 border-gray-400 rounded-lg p-3 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition bg-white"
                style={{ color: '#000', fontWeight: '600', fontSize: '14px' }}
                placeholder="QmXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                value={cid}
                onChange={(e) => setCid(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                BBS+ Public Key (Base64) <span className="text-gray-400 text-xs">(Optional)</span>
              </label>
              <input
                type="text"
                className="w-full border-2 border-gray-400 rounded-lg p-3 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition bg-white"
                style={{ color: '#000', fontWeight: '600', fontSize: '14px' }}
                placeholder="Enter public key for BBS+ signature verification"
                value={publicKey}
                onChange={(e) => setPublicKey(e.target.value)}
              />
              <p className="text-xs text-gray-500 mt-1">
                Required for BBS+ signature verification. Can be obtained from issuer.
              </p>
            </div>

            <button
              onClick={verify}
              disabled={loading || !cid.trim()}
              className={`w-full py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2 ${
                loading || !cid.trim()
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 shadow-lg"
              }`}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Verifying...
                </>
              ) : (
                <>
                  <span>🔐</span> Verify Credential
                </>
              )}
            </button>
          </div>
        </div>

        {/* Results Section */}
        {result && (
          <div className="bg-white rounded-2xl shadow-xl p-8 animate-fadeIn">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              📊 Verification Results
            </h2>

            {result.success ? (
              <div className="space-y-4">
                {/* Overall Status */}
                <div className={`p-4 rounded-lg border-2 ${result.verified ? 'bg-green-100 border-green-400' : 'bg-yellow-100 border-yellow-400'}`}>
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{result.verified ? '✅' : '⚠️'}</span>
                    <div>
                      <h3 className="font-bold text-lg text-black">
                        {result.verified ? 'Credential Verified' : 'Verification Incomplete'}
                      </h3>
                      <p className="text-sm text-gray-900 font-semibold">
                        {result.verified 
                          ? 'All checks passed successfully' 
                          : 'Some verification checks failed or are incomplete'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Verification Checks */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Structure Check */}
                  <div className="p-4 bg-gray-100 rounded-lg border-2 border-gray-300">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-black">📋 Structure Valid</span>
                      <span className={`text-2xl ${getStatusColor(result.structureValid)}`}>
                        {getStatusIcon(result.structureValid)}
                      </span>
                    </div>
                  </div>

                  {/* IPFS Check */}
                  <div className="p-4 bg-gray-100 rounded-lg border-2 border-gray-300">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-black">📦 IPFS Retrieved</span>
                      <span className={`text-2xl ${getStatusColor(result.ipfsValid)}`}>
                        {getStatusIcon(result.ipfsValid)}
                      </span>
                    </div>
                  </div>

                  {/* BBS+ Proof Check */}
                  <div className="p-4 bg-gray-100 rounded-lg border-2 border-gray-300">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-black">🔐 BBS+ Signature</span>
                      <span className={`text-2xl ${getStatusColor(result.bbsProofValid)}`}>
                        {result.bbsProofValid ? '✅' : result.details?.bbsNote ? 'ℹ️' : '❌'}
                      </span>
                    </div>
                    {result.details?.bbsNote && (
                      <p className="text-xs text-gray-900 font-semibold mt-1">{result.details.bbsNote}</p>
                    )}
                    {result.details?.proofType && (
                      <p className="text-xs text-gray-900 font-semibold mt-1">Type: {result.details.proofType}</p>
                    )}
                  </div>

                  {/* Blockchain Check */}
                  <div className="p-4 bg-gray-100 rounded-lg border-2 border-gray-300">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-black">⛓️ Blockchain Record</span>
                      <span className={`text-2xl ${getStatusColor(result.blockchainValid)}`}>
                        {getStatusIcon(result.blockchainValid)}
                      </span>
                    </div>
                  </div>

                  {/* Revocation Check */}
                  <div className="p-4 bg-gray-100 rounded-lg border-2 border-gray-300">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-black">🚫 Not Revoked</span>
                      <span className={`text-2xl ${getStatusColor(!result.revoked)}`}>
                        {getStatusIcon(!result.revoked)}
                      </span>
                    </div>
                  </div>

                  {/* Hash Match */}
                  <div className="p-4 bg-gray-100 rounded-lg border-2 border-gray-300">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-black">🔗 Hash Match</span>
                      <span className={`text-2xl ${getStatusColor(result.hashMatch)}`}>
                        {getStatusIcon(result.hashMatch)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Credential Details */}
                {result.vc && (
                  <div className="mt-6 p-6 bg-indigo-100 rounded-lg border-2 border-indigo-300">
                    <h3 className="font-bold text-lg mb-4 text-black">📄 Credential Details</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="font-bold text-gray-900">Issuer:</span>
                        <span className="text-black font-mono text-xs font-semibold">{result.details?.issuer}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-bold text-gray-900">Subject:</span>
                        <span className="text-black font-mono text-xs font-semibold">{result.details?.subject}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-bold text-gray-900">Issued:</span>
                        <span className="text-black font-semibold">{new Date(result.details?.issuanceDate).toLocaleString()}</span>
                      </div>
                      
                      {/* Show disclosed fields for selective disclosure */}
                      {result.details?.presentationType === "SelectiveDisclosure" && result.details?.disclosedFields && (
                        <div className="mt-4 pt-4 border-t-2 border-indigo-400">
                          <h4 className="font-bold text-black mb-3 flex items-center gap-2">
                            🔐 Disclosed Fields
                            <span className="text-xs font-semibold text-gray-900">
                              (Only selected fields are revealed)
                            </span>
                          </h4>
                          <div className="space-y-2">
                            {result.details.disclosedFields.map((field) => {
                              const vcData = result.vc.verifiableCredential || result.vc;
                              const value = vcData.credentialSubject?.[field];
                              if (!value || field === 'documentHash' || field === 'id') return null;
                              
                              return (
                                <div key={field} className="flex justify-between bg-white p-2 rounded border border-gray-300">
                                  <span className="font-bold text-black capitalize">
                                    {field.replace(/([A-Z])/g, ' $1').trim()}:
                                  </span>
                                  <span className="text-black font-semibold">{value}</span>
                                </div>
                              );
                            })}
                          </div>
                          <p className="text-xs text-gray-900 font-semibold mt-3 italic">
                            ℹ️ Other fields in the credential are hidden via zero-knowledge proof
                          </p>
                        </div>
                      )}
                      
                      {/* Show full credential for regular VCs */}
                      {!result.details?.presentationType && result.vc.credentialSubject && (
                        <>
                          <div className="flex justify-between">
                            <span className="font-bold text-gray-900">Name:</span>
                            <span className="text-black font-semibold">{result.vc.credentialSubject.name}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-bold text-gray-900">Roll Number:</span>
                            <span className="text-black font-semibold">{result.vc.credentialSubject.rollNumber}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-bold text-gray-900">Department:</span>
                            <span className="text-black font-semibold">{result.vc.credentialSubject.department}</span>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Blockchain Details */}
                    {result.details?.blockchain && (
                      <div className="mt-4 pt-4 border-t-2 border-indigo-400">
                        <h4 className="font-bold text-black mb-2">⛓️ Blockchain Record</h4>
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between">
                            <span className="text-gray-900 font-bold">Issuer Address:</span>
                            <span className="font-mono text-black font-semibold">{result.details.blockchain.issuer}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-900 font-bold">Timestamp:</span>
                            <span className="text-black font-semibold">{result.details.blockchain.timestamp}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-900 font-bold">IPFS CID:</span>
                            <span className="font-mono text-black font-semibold">{result.details.blockchain.ipfsCID}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-6 bg-red-50 border-2 border-red-300 rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-3xl">❌</span>
                  <h3 className="font-bold text-lg text-red-800">Verification Failed</h3>
                </div>
                <p className="text-red-700 mb-2">{result.error || result.message || "Unknown error occurred"}</p>
                
                {result.errorDetails && (
                  <details className="mt-3">
                    <summary className="cursor-pointer text-sm text-red-600 hover:text-red-800">
                      Show technical details
                    </summary>
                    <pre className="mt-2 p-3 bg-red-100 rounded text-xs overflow-auto max-h-40">
                      {result.errorDetails}
                    </pre>
                  </details>
                )}
                
                {result.rawError && (
                  <details className="mt-3">
                    <summary className="cursor-pointer text-sm text-red-600 hover:text-red-800">
                      Show raw error
                    </summary>
                    <pre className="mt-2 p-3 bg-red-100 rounded text-xs overflow-auto max-h-40">
                      {JSON.stringify(result.rawError, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            )}
          </div>
        )}

        {/* Info Section */}
        <div className="mt-6 p-6 bg-blue-100 rounded-lg border-2 border-blue-300">
          <h3 className="font-bold text-blue-900 mb-2">ℹ️ How to Use</h3>
          <ul className="text-sm text-gray-900 font-semibold space-y-1 list-disc list-inside">
            <li>Click "Start Scanning" to use your camera to scan a QR code</li>
            <li>Or manually enter the IPFS CID of the credential</li>
            <li>Optionally provide the BBS+ public key for signature verification</li>
            <li>Click "Verify Credential" to check authenticity</li>
            <li>View detailed verification results including blockchain records</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
