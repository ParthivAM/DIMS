import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import QRCode from "react-qr-code";
import { getCredentialByCID } from "../utils/indexedDB";
import "../styles/animations.css";

export default function ViewCredential() {
  const { cid } = useParams();
  const navigate = useNavigate();

  const [credential, setCredential] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCredential();
  }, [cid]);

  const fetchCredential = async () => {
    try {
      setLoading(true);
      setError(null);

      // Try IndexedDB first
      let credData = await getCredentialByCID(cid);

      // If not found, fetch from IPFS
      if (!credData || !credData.vc) {
        console.log("Fetching from IPFS...");
        const response = await axios.get(`http://localhost:5000/fetchVC/${cid}`);

        if (response.data.success) {
          credData = {
            cid: cid,
            vc: response.data.vc,
            holderAddress: localStorage.getItem("userAddress")
          };
        } else {
          throw new Error("Failed to fetch credential");
        }
      }

      setCredential(credData);
      console.log("Credential loaded:", credData);
      console.log("VC structure:", credData.vc);
      console.log("Proof object:", credData.vc?.proof);
      console.log("Issuer:", credData.vc?.issuer);
      console.log("Subject:", credData.vc?.credentialSubject);
      console.log("Subject ID:", credData.vc?.credentialSubject?.id);

      if (!credData.vc?.proof) {
        console.error("❌ VC is missing proof object!");
        console.log("Full VC:", JSON.stringify(credData.vc, null, 2));
      } else {
        console.log("✅ VC has proof object:", {
          type: credData.vc.proof.type,
          created: credData.vc.proof.created,
          proofPurpose: credData.vc.proof.proofPurpose,
          verificationMethod: credData.vc.proof.verificationMethod,
          hasProofValue: !!credData.vc.proof.proofValue,
          proofValueLength: credData.vc.proof.proofValue?.length
        });
      }

    } catch (err) {
      console.error("Error fetching credential:", err);
      setError(err.response?.data?.message || err.message || "Failed to load credential");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading credential...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-8">
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

  if (!credential || !credential.vc) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <p className="text-gray-600">No credential data available</p>
      </div>
    );
  }

  const vc = credential.vc;
  const subject = vc.credentialSubject || {};
  const proof = vc.proof || {};

  // Helper function to safely get issuer DID
  const getIssuerDID = () => {
    if (!vc.issuer) return "N/A";
    if (typeof vc.issuer === 'string') return vc.issuer;
    if (vc.issuer.id) return vc.issuer.id;
    return "N/A";
  };

  // Helper function to safely get subject ID
  const getSubjectID = () => {
    if (subject.id) return subject.id;
    if (vc.credentialSubject?.id) return vc.credentialSubject.id;
    return "N/A";
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#141E30] p-8 transition-colors duration-300">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8 animate-fadeIn">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                📄 Verifiable Credential
              </h1>
              <p className="text-gray-600 dark:text-slate-300 font-semibold">Complete verifiable credential information</p>
            </div>
            <button
              onClick={() => navigate("/holder")}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all duration-300 flex items-center gap-2"
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>

        {/* Main Credential Card */}
        <div className="bg-white dark:bg-slate-800/50 rounded-2xl shadow-2xl overflow-hidden mb-6 animate-scaleIn border border-gray-200 dark:border-slate-700">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-navy-dark to-navy p-8 text-white">
            <div className="flex items-center gap-6">
              {subject.photo && (
                <img
                  src={subject.photo}
                  alt="Credential holder"
                  className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
                />
              )}
              <div className="flex-1">
                <h2 className="text-3xl font-bold mb-2">{subject.name || "N/A"}</h2>

                {/* Conditional rendering based on credential type */}
                {vc.type?.includes("AcademicCertificate") ? (
                  <div className="grid grid-cols-2 gap-4 text-indigo-100">
                    <div>
                      <p className="text-sm opacity-80">Register Number</p>
                      <p className="font-semibold">{subject.registerNumber || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-sm opacity-80">Degree</p>
                      <p className="font-semibold">{subject.degree || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-sm opacity-80">Branch</p>
                      <p className="font-semibold">{subject.branch || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-sm opacity-80">University</p>
                      <p className="font-semibold">{subject.university || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-sm opacity-80">CGPA</p>
                      <p className="font-semibold">{subject.cgpa || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-sm opacity-80">Class</p>
                      <p className="font-semibold">{subject.class || "N/A"}</p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4 text-indigo-100">
                    <div>
                      <p className="text-sm opacity-80">Roll Number</p>
                      <p className="font-semibold">{subject.rollNumber || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-sm opacity-80">Department</p>
                      <p className="font-semibold">{subject.department || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-sm opacity-80">Date of Birth</p>
                      <p className="font-semibold">{subject.dateOfBirth || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-sm opacity-80">Document Type</p>
                      <p className="font-semibold">{subject.documentType || "N/A"}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Details Section */}
          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Subject ID */}
              <div className="bg-gray-50 dark:bg-slate-900/50 rounded-lg p-4 border border-gray-200 dark:border-slate-700">
                <p className="text-sm text-gray-500 dark:text-slate-400 mb-2 font-bold">Subject ID</p>
                <p className="font-mono text-xs text-gray-900 dark:text-slate-200 break-all font-semibold">{getSubjectID()}</p>
              </div>

              {/* Issuer */}
              <div className="bg-gray-50 dark:bg-slate-900/50 rounded-lg p-4 border border-gray-200 dark:border-slate-700">
                <p className="text-sm text-gray-500 dark:text-slate-400 mb-2 font-bold">Issuer DID</p>
                <p className="font-mono text-xs text-gray-900 dark:text-slate-200 break-all font-semibold">{getIssuerDID()}</p>
              </div>

              {/* Issuance Date */}
              <div className="bg-gray-50 dark:bg-slate-900/50 rounded-lg p-4 border border-gray-200 dark:border-slate-700">
                <p className="text-sm text-gray-500 dark:text-slate-400 mb-2 font-bold">Issuance Date</p>
                <p className="text-gray-900 dark:text-slate-200 font-semibold">{formatDate(vc.issuanceDate)}</p>
              </div>

              {/* IPFS CID */}
              <div className="bg-gray-50 dark:bg-slate-900/50 rounded-lg p-4 border border-gray-200 dark:border-slate-700">
                <p className="text-sm text-gray-500 dark:text-slate-400 mb-2 font-bold">IPFS CID</p>
                <p className="font-mono text-xs text-gray-900 dark:text-slate-200 break-all font-semibold">{cid}</p>
              </div>

              {/* Document Hash */}
              <div className="bg-gray-50 dark:bg-slate-900/50 rounded-lg p-4 md:col-span-2 border border-gray-200 dark:border-slate-700">
                <p className="text-sm text-gray-500 dark:text-slate-400 mb-2 font-bold">Document Hash</p>
                <p className="font-mono text-xs text-gray-900 dark:text-slate-200 break-all font-semibold">{subject.documentHash || "N/A"}</p>
              </div>
            </div>

            {/* Digital Signature Section */}
            <div className="bg-blue-50 dark:bg-slate-900/50 rounded-xl p-6 mb-8 border border-blue-200 dark:border-slate-700">
              <h3 className="text-xl font-bold text-blue-900 dark:text-indigo-300 mb-4 flex items-center gap-2">
                <span>🔐</span> Digital Signature Information
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-blue-100 dark:border-slate-700">
                    <p className="text-sm text-gray-500 dark:text-slate-400 mb-1 font-bold">Signature Type</p>
                    <p className="text-gray-900 dark:text-slate-200 font-semibold">{proof.type || "N/A"}</p>
                  </div>
                  <div className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-blue-100 dark:border-slate-700">
                    <p className="text-sm text-gray-500 dark:text-slate-400 mb-1 font-bold">Created</p>
                    <p className="text-gray-900 dark:text-slate-200 font-semibold">{formatDate(proof.created)}</p>
                  </div>
                  <div className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-blue-100 dark:border-slate-700">
                    <p className="text-sm text-gray-500 dark:text-slate-400 mb-1 font-bold">Proof Purpose</p>
                    <p className="text-gray-900 dark:text-slate-200 font-semibold">{proof.proofPurpose || "N/A"}</p>
                  </div>
                  <div className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-blue-100 dark:border-slate-700">
                    <p className="text-sm text-gray-500 dark:text-slate-400 mb-1 font-bold">Verification Method</p>
                    <p className="font-mono text-xs text-gray-900 dark:text-slate-200 break-all font-semibold">
                      {proof.verificationMethod ? proof.verificationMethod.substring(0, 40) + "..." : "N/A"}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-slate-400 mb-2 font-bold">Proof Value (Base64)</p>
                  <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-blue-100 dark:border-slate-700 max-h-32 overflow-auto">
                    <p className="font-mono text-xs text-gray-900 dark:text-slate-300 break-all font-semibold">
                      {proof.proofValue || "N/A"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* QR Code Section */}
            <div className="bg-gray-50 dark:bg-slate-900/50 rounded-xl p-6 text-center mb-8 border border-gray-200 dark:border-slate-700">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center justify-center gap-2">
                <span>📱</span> QR Code for Verification
              </h3>
              <p className="text-sm text-gray-600 dark:text-slate-300 mb-4 font-semibold">
                Scan this code with the Verifier Portal to verify this credential
              </p>
              <div className="inline-block p-6 bg-white rounded-xl shadow-lg">
                <QRCode
                  value={JSON.stringify({
                    cid: cid,
                    type: "VerifiableCredential",
                    issuer: vc.issuer?.id
                  })}
                  size={200}
                  level="H"
                />
              </div>
            </div>

            {/* Full JSON */}
            <div className="bg-gray-50 dark:bg-slate-900/50 rounded-xl p-6 border border-gray-200 dark:border-slate-700">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <span>📋</span> BBS+ Public Key
              </h3>
              <div className="bg-white dark:bg-slate-800 rounded-lg p-4 max-h-96 overflow-auto border border-gray-300 dark:border-slate-600">
                <pre className="text-xs text-gray-800 dark:text-slate-300 whitespace-pre-wrap font-mono font-semibold">
                  {JSON.stringify(vc, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-slideIn">
          <button
            onClick={() => navigate(`/disclose/${cid}`)}
            className="px-6 py-4 bg-gradient-to-r from-navy-dark to-navy text-white rounded-xl hover:from-navy hover:to-navy-light transition-all duration-300 font-bold shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            🔐 Generate Proof
          </button>

          <button
            onClick={() => window.open(`https://gateway.pinata.cloud/ipfs/${cid}`, "_blank")}
            className="px-6 py-4 bg-emerald-700 text-white rounded-xl hover:bg-emerald-600 transition-all duration-300 font-bold shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            🌐 View on IPFS
          </button>

          <button
            onClick={() => navigate("/verifier")}
            className="px-6 py-4 bg-slate-700 text-white rounded-xl hover:bg-slate-600 transition-all duration-300 font-bold shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            🔍 Verify Credential
          </button>

          <button
            onClick={() => {
              const dataStr = JSON.stringify(vc, null, 2);
              const dataBlob = new Blob([dataStr], { type: 'application/json' });
              const url = URL.createObjectURL(dataBlob);
              const link = document.createElement('a');
              link.href = url;
              link.download = `credential-${cid.substring(0, 8)}.json`;
              link.click();
            }}
            className="px-6 py-4 bg-slate-700 text-white rounded-xl hover:bg-slate-600 transition-all duration-300 font-bold shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            📥 Download VC
          </button>
        </div>
      </div>
    </div>
  );
}
