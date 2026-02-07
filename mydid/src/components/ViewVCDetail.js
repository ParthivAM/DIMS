import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import QRCode from "react-qr-code";

export default function ViewVCDetail() {
  const { cid } = useParams();
  const navigate = useNavigate();
  const [vc, setVc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (cid) {
      fetchVC();
    }
  }, [cid]);

  const fetchVC = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("Fetching VC:", cid);

      const response = await axios.get(
        `http://localhost:5000/holder/vc/${cid}`
      );

      if (response.data.success) {
        setVc(response.data.vc);
        console.log("VC loaded:", response.data.vc);
      } else {
        setError("Failed to load credential");
      }
    } catch (err) {
      console.error("Error fetching VC:", err);
      setError(err.response?.data?.message || "Failed to load credential");
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

  if (!vc) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <p className="text-gray-600">No credential data available</p>
      </div>
    );
  }

  const subject = vc.credentialSubject || {};
  const proof = vc.proof || {};

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-800">
            📄 Verifiable Credential Details
          </h1>
          <button
            onClick={() => navigate("/holder")}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
          >
            ← Back to Dashboard
          </button>
        </div>

        {/* Credential Card */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
          {/* Photo and Basic Info */}
          {subject.photo && (
            <div className="flex items-center gap-6 mb-6 pb-6 border-b border-gray-200">
              <img
                src={subject.photo}
                alt="Credential holder"
                className="w-32 h-32 rounded-full object-cover border-4 border-indigo-200"
              />
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                  {subject.name || "N/A"}
                </h2>

                {/* Conditional rendering based on credential type */}
                {vc.type?.includes("AcademicCertificate") ? (
                  <>
                    <p className="text-gray-600">Register Number: {subject.registerNumber || "N/A"}</p>
                    <p className="text-gray-600">Degree: {subject.degree || "N/A"}</p>
                    <p className="text-gray-600">Branch: {subject.branch || "N/A"}</p>
                    <p className="text-gray-600">University: {subject.university || "N/A"}</p>
                  </>
                ) : (
                  <>
                    <p className="text-gray-600">Roll Number: {subject.rollNumber || "N/A"}</p>
                    <p className="text-gray-600">Department: {subject.department || "N/A"}</p>
                    <p className="text-gray-600">DOB: {subject.dateOfBirth || "N/A"}</p>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Credential Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Subject ID</p>
              <p className="font-mono text-xs text-gray-800 break-all">{subject.id || "N/A"}</p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Document Type</p>
              <p className="text-gray-800 font-semibold">{subject.documentType || "N/A"}</p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Issuer</p>
              <p className="font-mono text-xs text-gray-800 break-all">
                {vc.issuer?.id || "N/A"}
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Issuance Date</p>
              <p className="text-gray-800">{formatDate(vc.issuanceDate)}</p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Document Hash</p>
              <p className="font-mono text-xs text-gray-800 break-all">
                {subject.documentHash || "N/A"}
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">IPFS CID</p>
              <p className="font-mono text-xs text-gray-800 break-all">{cid}</p>
            </div>
          </div>

          {/* Proof Information */}
          <div className="bg-indigo-50 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-bold text-indigo-900 mb-4">
              🔐 Digital Signature Information
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-indigo-700 mb-1">Signature Type</p>
                <p className="text-indigo-900 font-semibold">{proof.type || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-indigo-700 mb-1">Created</p>
                <p className="text-indigo-900">{formatDate(proof.created)}</p>
              </div>
              <div>
                <p className="text-sm text-indigo-700 mb-1">Proof Purpose</p>
                <p className="text-indigo-900">{proof.proofPurpose || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-indigo-700 mb-1">Verification Method</p>
                <p className="font-mono text-xs text-indigo-800 break-all">
                  {proof.verificationMethod || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm text-indigo-700 mb-1">Proof Value (Base64)</p>
                <div className="bg-white p-3 rounded border border-indigo-200 max-h-32 overflow-auto">
                  <p className="font-mono text-xs text-gray-700 break-all">
                    {proof.proofValue || "N/A"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* QR Code */}
          <div className="bg-gray-50 rounded-lg p-6 text-center">
            <h3 className="text-lg font-bold text-gray-800 mb-4">
              📱 QR Code for Verification
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Scan this code with the Verifier Portal to verify this credential
            </p>
            <div className="inline-block p-4 bg-white rounded-lg shadow-md">
              <QRCode
                value={JSON.stringify({
                  cid: cid,
                  type: "VerifiableCredential"
                })}
                size={200}
                level="H"
              />
            </div>
          </div>
        </div>

        {/* Full JSON */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">
            📋 Full Credential JSON
          </h3>
          <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-auto">
            <pre className="text-xs text-gray-700">
              {JSON.stringify(vc, null, 2)}
            </pre>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex gap-4">
          <button
            onClick={() => window.open(`https://gateway.pinata.cloud/ipfs/${cid}`, "_blank")}
            className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
          >
            🌐 View on IPFS
          </button>
          <button
            onClick={() => navigate(`/verifier`)}
            className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium"
          >
            🔍 Verify Credential
          </button>
        </div>
      </div>
    </div>
  );
}
