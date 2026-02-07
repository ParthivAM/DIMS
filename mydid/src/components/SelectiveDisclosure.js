import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { getCredentialByCID } from "../utils/indexedDB";
import "../styles/animations.css";

export default function SelectiveDisclosure() {
  const { cid } = useParams();
  const navigate = useNavigate();

  const [vc, setVc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedFields, setSelectedFields] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [proofResult, setProofResult] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchVC();
  }, [cid]);

  const fetchVC = async () => {
    try {
      setLoading(true);
      setError(null);

      // Try to get from IndexedDB first
      let vcData = await getCredentialByCID(cid);

      // If not in IndexedDB, fetch from IPFS
      if (!vcData || !vcData.vc) {
        console.log("Fetching VC from IPFS...");
        const response = await axios.get(`http://localhost:5000/fetchVC/${cid}`);

        if (response.data.success) {
          vcData = {
            cid: cid,
            vc: response.data.vc
          };
        } else {
          throw new Error("Failed to fetch VC");
        }
      }

      setVc(vcData.vc);
      console.log("VC loaded:", vcData.vc);
      console.log("Proof object:", vcData.vc?.proof);

      if (!vcData.vc?.proof) {
        console.error("❌ VC is missing proof object!");
        console.log("Full VC:", JSON.stringify(vcData.vc, null, 2));
        setError("This credential is missing the digital signature (proof object). It cannot be used for selective disclosure.");
      } else {
        console.log("✅ VC has proof:", {
          type: vcData.vc.proof.type,
          hasProofValue: !!vcData.vc.proof.proofValue
        });
      }

    } catch (err) {
      console.error("Error fetching VC:", err);
      setError(err.response?.data?.message || err.message || "Failed to load credential");
    } finally {
      setLoading(false);
    }
  };

  const isAcademicCertificate = vc?.type?.includes("AcademicCertificate");

  const availableFields = vc ? (
    isAcademicCertificate ? [
      // Academic Certificate fields
      { key: 'name', label: 'Name', value: vc.credentialSubject?.name },
      { key: 'registerNumber', label: 'Register Number', value: vc.credentialSubject?.registerNumber },
      { key: 'degree', label: 'Degree', value: vc.credentialSubject?.degree },
      { key: 'branch', label: 'Branch', value: vc.credentialSubject?.branch },
      { key: 'university', label: 'University', value: vc.credentialSubject?.university },
      { key: 'location', label: 'Location', value: vc.credentialSubject?.location },
      { key: 'cgpa', label: 'CGPA', value: vc.credentialSubject?.cgpa },
      { key: 'class', label: 'Class', value: vc.credentialSubject?.class },
      { key: 'examHeldIn', label: 'Exam Held In', value: vc.credentialSubject?.examHeldIn },
      { key: 'issuedDate', label: 'Issue Date', value: vc.credentialSubject?.issuedDate },
      { key: 'id', label: 'Subject ID', value: vc.credentialSubject?.id },
      { key: 'issuer', label: 'Issuer', value: vc.issuer },
      { key: 'issuanceDate', label: 'Issuance Date', value: vc.issuanceDate },
      { key: 'documentHash', label: 'Document Hash', value: vc.credentialSubject?.documentHash }
    ] : [
      // Student ID fields
      { key: 'name', label: 'Name', value: vc.credentialSubject?.name },
      { key: 'rollNumber', label: 'Roll Number', value: vc.credentialSubject?.rollNumber },
      { key: 'dateOfBirth', label: 'Date of Birth', value: vc.credentialSubject?.dateOfBirth },
      { key: 'department', label: 'Department', value: vc.credentialSubject?.department },
      { key: 'id', label: 'Subject ID', value: vc.credentialSubject?.id },
      { key: 'issuer', label: 'Issuer', value: vc.issuer?.id },
      { key: 'issuanceDate', label: 'Issuance Date', value: vc.issuanceDate },
      { key: 'documentHash', label: 'Document Hash', value: vc.credentialSubject?.documentHash }
    ]
  ).filter(field => field.value) : [];

  const handleFieldToggle = (fieldKey) => {
    setSelectedFields(prev => {
      if (prev.includes(fieldKey)) {
        return prev.filter(f => f !== fieldKey);
      } else {
        return [...prev, fieldKey];
      }
    });
  };

  const handleSelectAll = () => {
    setSelectedFields(availableFields.map(f => f.key));
  };

  const handleDeselectAll = () => {
    setSelectedFields([]);
  };

  const handleGenerateProof = async () => {
    if (selectedFields.length === 0) {
      alert("Please select at least one field to disclose");
      return;
    }

    try {
      setGenerating(true);
      setError(null);

      console.log("Generating proof with fields:", selectedFields);

      // Get public key from localStorage
      const publicKey = localStorage.getItem("publicKey");
      if (!publicKey) {
        throw new Error("Public key not found. Please login again.");
      }

      console.log("Sending proof generation request:", {
        vcType: vc.type,
        selectedFields: selectedFields,
        hasPublicKey: !!publicKey
      });

      const response = await axios.post("http://localhost:5000/generateProof", {
        vc: vc,
        selectedFields: selectedFields,
        publicKey: publicKey,
        originalCID: cid
      });

      if (response.data.success) {
        console.log("✅ Proof generated successfully");
        setProofResult(response.data);
        setShowModal(true);
      } else {
        throw new Error(response.data.message || "Failed to generate proof");
      }

    } catch (err) {
      console.error("Error generating proof:", err);
      setError(err.response?.data?.message || err.message || "Failed to generate proof");
    } finally {
      setGenerating(false);
    }
  };

  const handleDownloadQR = () => {
    if (!proofResult?.qrCode) return;

    const link = document.createElement('a');
    link.href = proofResult.qrCode;
    link.download = `proof-${proofResult.proofCid.substring(0, 8)}.png`;
    link.click();
  };

  const handleCopyProofCID = () => {
    if (!proofResult?.proofCid) return;
    navigator.clipboard.writeText(proofResult.proofCid);
    alert("Proof CID copied to clipboard!");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading credential...</p>
        </div>
      </div>
    );
  }

  if (error && !vc) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex items-center justify-center p-8">
        <div className="bg-red-50 border-2 border-red-300 rounded-lg p-8 max-w-md text-center">
          <p className="text-red-700 text-lg mb-4">❌ {error}</p>
          <button
            onClick={() => navigate("/holder")}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#141E30] p-8 transition-colors duration-300">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 animate-fadeIn">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                🔐 Selective Disclosure
              </h1>
              <p className="text-gray-600 dark:text-slate-300 font-semibold">Choose which attributes to share</p>
            </div>
            <button
              onClick={() => navigate("/holder")}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all duration-300 flex items-center gap-2"
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-white dark:bg-slate-800/50 border border-indigo-200 dark:border-indigo-500/30 rounded-lg p-6 mb-6 animate-slideIn shadow-sm dark:shadow-none">
          <h3 className="font-bold text-indigo-600 dark:text-indigo-300 mb-2 flex items-center gap-2">
            <span>💡</span> How It Works
          </h3>
          <ul className="text-sm text-gray-600 dark:text-slate-300 font-semibold space-y-1 list-disc list-inside">
            <li>Select only the attributes you want to share</li>
            <li>A cryptographic proof will be generated using BBS+ signatures</li>
            <li>The verifier can confirm these attributes without seeing the full credential</li>
            <li>Your privacy is protected through zero-knowledge proofs</li>
          </ul>
        </div>

        {/* Field Selection */}
        <div className="bg-white dark:bg-slate-800/50 rounded-xl shadow-lg p-8 mb-6 animate-scaleIn border border-gray-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Select Fields to Disclose</h2>
            <div className="flex gap-2">
              <button
                onClick={handleSelectAll}
                className="px-4 py-2 bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-500/30 transition text-sm font-medium border border-indigo-200 dark:border-indigo-500/30"
              >
                Select All
              </button>
              <button
                onClick={handleDeselectAll}
                className="px-4 py-2 bg-gray-100 dark:bg-slate-700/50 text-gray-600 dark:text-slate-300 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700 transition text-sm font-medium border border-gray-200 dark:border-slate-600"
              >
                Deselect All
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {availableFields.map((field) => (
              <label
                key={field.key}
                className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-all duration-300 ${selectedFields.includes(field.key)
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/20'
                  : 'border-gray-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-500/50 hover:bg-gray-50 dark:hover:bg-slate-700/50'
                  }`}
              >
                <input
                  type="checkbox"
                  checked={selectedFields.includes(field.key)}
                  onChange={() => handleFieldToggle(field.key)}
                  className="mt-1 w-5 h-5 text-indigo-600 dark:text-indigo-500 rounded focus:ring-indigo-500 bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600"
                />
                <div className="flex-1">
                  <p className="font-bold text-gray-900 dark:text-slate-200">{field.label}</p>
                  <p className="text-sm text-gray-600 dark:text-slate-400 font-semibold break-all mt-1">
                    {field.value.length > 60
                      ? field.value.substring(0, 60) + "..."
                      : field.value}
                  </p>
                </div>
              </label>
            ))}
          </div>

          {/* Selected Count */}
          <div className="mt-6 p-4 bg-indigo-50 dark:bg-indigo-500/10 rounded-lg border border-indigo-200 dark:border-indigo-500/30">
            <p className="text-center text-gray-700 dark:text-slate-300 font-bold text-lg">
              <span className="text-indigo-600 dark:text-indigo-400">{selectedFields.length}</span> of{" "}
              <span className="text-gray-500 dark:text-slate-400">{availableFields.length}</span> fields selected
            </p>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4 mb-6">
            <p className="text-red-700">❌ {error}</p>
          </div>
        )}

        {/* Generate Button */}
        <div className="flex gap-4">
          <button
            onClick={handleGenerateProof}
            disabled={generating || selectedFields.length === 0}
            className="flex-1 px-8 py-4 bg-gradient-to-r from-navy-dark to-navy text-white rounded-lg hover:from-navy hover:to-navy-light transition-all duration-300 font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            {generating ? (
              <>
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                Generating Proof...
              </>
            ) : (
              <>
                <span>🔐</span> Generate Selective Disclosure Proof
              </>
            )}
          </button>
        </div>

        {/* Success Modal */}
        {showModal && proofResult && (
          <div className="fixed inset-0 bg-black/50 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-scaleIn border border-gray-200 dark:border-slate-700">
              <div className="bg-gradient-to-r from-navy-dark to-navy p-6 text-white rounded-t-2xl">
                <h2 className="text-2xl font-bold flex items-center gap-3">
                  <span>✅</span> Proof Generated Successfully!
                </h2>
              </div>

              <div className="p-8">
                {/* QR Code */}
                <div className="text-center mb-6">
                  <p className="text-gray-600 dark:text-slate-300 mb-4 font-semibold">Scan this QR code to share your proof:</p>
                  <div className="inline-block p-4 bg-white rounded-lg shadow-lg border-4 border-indigo-100 dark:border-indigo-500/30">
                    <img
                      src={proofResult.qrCode}
                      alt="Proof QR Code"
                      className="w-64 h-64"
                    />
                  </div>
                </div>

                {/* Proof CID */}
                <div className="bg-gray-50 dark:bg-slate-800/50 rounded-lg p-4 mb-6 border border-gray-200 dark:border-slate-700">
                  <p className="text-sm text-gray-500 dark:text-slate-400 mb-2 font-bold">Proof IPFS CID:</p>
                  <div className="flex items-center gap-2">
                    <p className="font-mono text-sm text-gray-900 dark:text-slate-300 break-all flex-1 font-semibold">
                      {proofResult.proofCid}
                    </p>
                    <button
                      onClick={handleCopyProofCID}
                      className="px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition text-sm whitespace-nowrap"
                    >
                      📋 Copy
                    </button>
                  </div>
                </div>

                {/* Disclosed Fields */}
                <div className="bg-indigo-50 dark:bg-indigo-500/10 rounded-lg p-4 mb-6 border border-indigo-200 dark:border-indigo-500/30">
                  <p className="text-sm text-indigo-700 dark:text-indigo-300 font-bold mb-2">Disclosed Fields:</p>
                  <div className="flex flex-wrap gap-2">
                    {proofResult.selectedFields.map(field => (
                      <span
                        key={field}
                        className="px-3 py-1 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 rounded-full text-sm font-medium border border-indigo-200 dark:border-indigo-500/30"
                      >
                        {field}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Disclosed Data */}
                <div className="bg-emerald-50 dark:bg-emerald-500/10 rounded-lg p-4 mb-6 border border-emerald-200 dark:border-emerald-500/30">
                  <p className="text-sm text-emerald-700 dark:text-emerald-400 font-bold mb-2">Disclosed Data:</p>
                  <div className="space-y-2">
                    {Object.entries(proofResult.disclosedData || {}).map(([key, value]) => (
                      <div key={key} className="flex gap-2">
                        <span className="font-bold text-gray-900 dark:text-slate-200">{key}:</span>
                        <span className="text-gray-600 dark:text-slate-400 font-semibold break-all">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={handleDownloadQR}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-navy-dark to-navy text-white rounded-lg hover:from-navy hover:to-navy-light transition font-medium"
                  >
                    📥 Download QR Code
                  </button>
                  <button
                    onClick={() => window.open(`https://gateway.pinata.cloud/ipfs/${proofResult.proofCid}`, "_blank")}
                    className="flex-1 px-6 py-3 bg-emerald-700 text-white rounded-lg hover:bg-emerald-600 transition font-medium"
                  >
                    🌐 View on IPFS
                  </button>
                  <button
                    onClick={() => {
                      setShowModal(false);
                      navigate("/holder");
                    }}
                    className="flex-1 px-6 py-3 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition font-medium"
                  >
                    ✓ Done
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
