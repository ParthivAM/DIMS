import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import axios from "axios";
import QRCode from "react-qr-code";
import { useAuth } from "../context/AuthContext";
import { Building2, User, Calendar, FileText, Shield, ExternalLink, ArrowLeft, CheckCircle } from "lucide-react";
import AnimatedPage from "./shared/AnimatedPage";

export default function IssuerCredentialView() {
  const { cid } = useParams();
  const navigate = useNavigate();
  const { userRole } = useAuth();

  const [credential, setCredential] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Ensure only issuer can access
  useEffect(() => {
    if (userRole !== "issuer") {
      navigate("/");
    }
  }, [userRole, navigate]);

  useEffect(() => {
    if (cid) {
      fetchCredential();
    }
  }, [cid]);

  const fetchCredential = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("Fetching credential from IPFS:", cid);
      const response = await axios.get(`http://localhost:5000/fetchVC/${cid}`);

      if (response.data.success) {
        setCredential({
          cid: cid,
          vc: response.data.vc
        });
        console.log("Credential loaded:", response.data.vc);
      } else {
        throw new Error("Failed to fetch credential");
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
      return new Date(dateString).toLocaleString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <AnimatedPage className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400 text-lg">Loading credential...</p>
        </div>
      </AnimatedPage>
    );
  }

  if (error) {
    return (
      <AnimatedPage className="min-h-screen flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card p-8 max-w-md text-center border-red-500/30"
        >
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">❌</span>
          </div>
          <p className="text-red-400 text-lg mb-6">{error}</p>
          <button
            onClick={() => navigate("/issuer/view-issued")}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all"
          >
            Back to Issued Credentials
          </button>
        </motion.div>
      </AnimatedPage>
    );
  }

  if (!credential || !credential.vc) {
    return (
      <AnimatedPage className="min-h-screen flex items-center justify-center">
        <p className="text-slate-400">No credential data available</p>
      </AnimatedPage>
    );
  }

  const vc = credential.vc;
  const subject = vc.credentialSubject || {};
  const issuer = vc.issuer || {};

  // Helper functions to handle both issuer formats
  const getIssuerDID = () => {
    if (typeof issuer === 'string') return issuer; // Academic Certificate format
    if (issuer.id) return issuer.id; // Student ID format
    return "N/A";
  };

  const getIssuerName = () => {
    if (typeof issuer === 'object' && issuer.name) return issuer.name; // Student ID format
    if (typeof issuer === 'string') return "Digital Identity Management System"; // Academic Certificate - default name
    return "N/A";
  };

  return (
    <AnimatedPage className="min-h-screen py-12 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => navigate("/issuer/view-issued")}
              className="flex items-center space-x-2 px-4 py-2 bg-white dark:bg-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-300 rounded-xl border border-slate-200 dark:border-slate-700 transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Issued Credentials</span>
            </button>

            <div className="flex items-center space-x-2 px-4 py-2 bg-green-500/20 border border-green-500/30 rounded-xl">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <span className="text-green-400 font-semibold">Verified Credential</span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/50">
              <FileText className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-extrabold bg-gradient-to-r from-navy-dark via-navy to-navy-dark dark:from-blue-400 dark:to-cyan-400 bg-clip-text text-transparent">
                Issued Credential Details
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-1">Verifiable Credential Information</p>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Credential Subject */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass-card p-6"
            >
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Credential Subject</h2>
              </div>

              {/* Photo */}
              {subject.photo && (
                <div className="mb-6 flex justify-center">
                  <div className="relative">
                    <img
                      src={subject.photo}
                      alt="Subject"
                      className="w-32 h-32 rounded-xl object-cover border-4 border-blue-500/30 shadow-lg"
                    />
                    <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full border-4 border-slate-900 flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                  </div>
                </div>
              )}

              {/* Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white dark:bg-slate-800/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                  <p className="text-slate-600 dark:text-slate-400 text-sm mb-1">Full Name</p>
                  <p className="text-gray-900 dark:text-white font-semibold text-lg">{subject.name || "N/A"}</p>
                </div>

                {/* Conditional rendering based on credential type */}
                {vc.type?.includes("AcademicCertificate") ? (
                  <>
                    <div className="bg-white dark:bg-slate-800/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                      <p className="text-slate-600 dark:text-slate-400 text-sm mb-1">Register Number</p>
                      <p className="text-gray-900 dark:text-white font-semibold text-lg">{subject.registerNumber || "N/A"}</p>
                    </div>

                    <div className="bg-white dark:bg-slate-800/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                      <p className="text-slate-600 dark:text-slate-400 text-sm mb-1">Degree</p>
                      <p className="text-gray-900 dark:text-white font-semibold text-lg">{subject.degree || "N/A"}</p>
                    </div>

                    <div className="bg-white dark:bg-slate-800/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                      <p className="text-slate-600 dark:text-slate-400 text-sm mb-1">Branch</p>
                      <p className="text-gray-900 dark:text-white font-semibold text-lg">{subject.branch || "N/A"}</p>
                    </div>

                    <div className="bg-white dark:bg-slate-800/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                      <p className="text-slate-600 dark:text-slate-400 text-sm mb-1">University</p>
                      <p className="text-gray-900 dark:text-white font-semibold text-lg">{subject.university || "N/A"}</p>
                    </div>

                    <div className="bg-white dark:bg-slate-800/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                      <p className="text-slate-600 dark:text-slate-400 text-sm mb-1">CGPA</p>
                      <p className="text-gray-900 dark:text-white font-semibold text-lg">{subject.cgpa || "N/A"}</p>
                    </div>

                    <div className="bg-white dark:bg-slate-800/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                      <p className="text-slate-600 dark:text-slate-400 text-sm mb-1">Class</p>
                      <p className="text-gray-900 dark:text-white font-semibold text-lg">{subject.class || "N/A"}</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="bg-white dark:bg-slate-800/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                      <p className="text-slate-600 dark:text-slate-400 text-sm mb-1">Roll Number</p>
                      <p className="text-gray-900 dark:text-white font-semibold text-lg">{subject.rollNumber || "N/A"}</p>
                    </div>

                    <div className="bg-white dark:bg-slate-800/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                      <p className="text-slate-600 dark:text-slate-400 text-sm mb-1">Date of Birth</p>
                      <p className="text-gray-900 dark:text-white font-semibold text-lg">{subject.dateOfBirth || "N/A"}</p>
                    </div>

                    <div className="bg-white dark:bg-slate-800/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                      <p className="text-slate-600 dark:text-slate-400 text-sm mb-1">Department</p>
                      <p className="text-gray-900 dark:text-white font-semibold text-lg">{subject.department || "N/A"}</p>
                    </div>
                  </>
                )}

                <div className="bg-white dark:bg-slate-800/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700 md:col-span-2">
                  <p className="text-slate-600 dark:text-slate-400 text-sm mb-1">Subject DID</p>
                  <p className="text-blue-400 font-mono text-sm break-all">{subject.id || "N/A"}</p>
                </div>
              </div>
            </motion.div>

            {/* Issuer Information */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass-card p-6"
            >
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Issuer Information</h2>
              </div>

              <div className="space-y-3">
                <div className="bg-white dark:bg-slate-800/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                  <p className="text-slate-600 dark:text-slate-400 text-sm mb-1">Issuer Name</p>
                  <p className="text-gray-900 dark:text-white font-semibold">{getIssuerName()}</p>
                </div>

                <div className="bg-white dark:bg-slate-800/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                  <p className="text-slate-600 dark:text-slate-400 text-sm mb-1">Issuer DID</p>
                  <p className="text-purple-400 font-mono text-sm break-all">{getIssuerDID()}</p>
                </div>

                <div className="bg-white dark:bg-slate-800/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                  <p className="text-slate-600 dark:text-slate-400 text-sm mb-1 flex items-center space-x-2">
                    <Calendar className="w-4 h-4" />
                    <span>Issuance Date</span>
                  </p>
                  <p className="text-gray-900 dark:text-white font-semibold">{formatDate(vc.issuanceDate)}</p>
                </div>
              </div>
            </motion.div>

            {/* IPFS & Blockchain */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="glass-card p-6"
            >
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Storage & Verification</h2>
              </div>

              <div className="space-y-3">
                <div className="bg-white dark:bg-slate-800/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                  <p className="text-slate-600 dark:text-slate-400 text-sm mb-2">IPFS CID</p>
                  <div className="flex items-center justify-between">
                    <code className="text-green-400 font-mono text-sm break-all flex-1">
                      {cid}
                    </code>
                    {subject.documentIPFS?.url && (
                      <a
                        href={subject.documentIPFS.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-3 p-2 bg-green-500/20 hover:bg-green-500/30 rounded-lg transition-all"
                      >
                        <ExternalLink className="w-4 h-4 text-green-400" />
                      </a>
                    )}
                  </div>
                </div>

                {subject.documentHash && (
                  <div className="bg-white dark:bg-slate-800/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                    <p className="text-slate-600 dark:text-slate-400 text-sm mb-2">Document Hash</p>
                    <code className="text-cyan-400 font-mono text-xs break-all">
                      {subject.documentHash}
                    </code>
                  </div>
                )}

                {vc.proof && (
                  <div className="bg-white dark:bg-slate-800/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                    <p className="text-slate-600 dark:text-slate-400 text-sm mb-2">Proof Type</p>
                    <p className="text-gray-900 dark:text-white font-semibold">{vc.proof.type || "N/A"}</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* QR Code */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="glass-card p-6"
            >
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 text-center">QR Code</h3>
              <div className="bg-white p-4 rounded-xl">
                <QRCode
                  value={cid}
                  size={200}
                  style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                />
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-xs text-center mt-3">
                Scan to verify credential
              </p>
            </motion.div>

            {/* Credential Type */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="glass-card p-6"
            >
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Credential Type</h3>
              <div className="space-y-2">
                {vc.type && vc.type.map((type, index) => (
                  <div
                    key={index}
                    className="px-3 py-2 bg-blue-500/20 border border-blue-500/30 rounded-lg text-blue-400 text-sm font-semibold text-center"
                  >
                    {type}
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </AnimatedPage>
  );
}
