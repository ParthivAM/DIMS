import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { Building2, FileText, Calendar, User, ExternalLink, Search, AlertCircle, Trash2 } from "lucide-react";
import AnimatedPage from "./shared/AnimatedPage";

export default function IssuerViewIssued() {
  const navigate = useNavigate();
  const { userAddress, userRole } = useAuth();
  const [credentials, setCredentials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Ensure only issuer can access
  useEffect(() => {
    if (userRole !== "issuer") {
      navigate("/");
    }
  }, [userRole, navigate]);

  useEffect(() => {
    if (userAddress) {
      fetchIssuedCredentials();
    }
  }, [userAddress]);

  const fetchIssuedCredentials = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all requests from challenge system
      console.log("📋 Fetching all requests from challenge system...");
      const response = await axios.get("http://localhost:5000/debug/requests");

      console.log("📊 Response:", response.data);
      console.log("📊 Total requests:", response.data.requests?.length);

      if (response.data.success && response.data.requests) {
        // Log all requests for debugging
        console.log("📋 All requests:", response.data.requests);

        // Filter only approved requests (which have issued VCs)
        const approvedRequests = response.data.requests.filter(
          req => {
            console.log(`Checking request ${req.requestId}:`, {
              status: req.status,
              issuedVCCID: req.issuedVCCID,
              passes: req.status === "approved" && req.issuedVCCID
            });
            return req.status === "approved" && req.issuedVCCID;
          }
        );

        console.log("✅ Approved requests with VCs:", approvedRequests.length);

        // Fetch full VC data from IPFS for each approved request
        const enrichedCredentials = await Promise.all(
          approvedRequests.map(async (req) => {
            try {
              // Fetch VC from IPFS
              const vcResponse = await axios.get(
                `http://localhost:5000/holder/vc/${req.issuedVCCID}`
              );

              return {
                vcCID: req.issuedVCCID,
                holderAddress: req.holderAddress,
                holderName: req.holderName,
                credentialType: req.vcType || req.credentialType,
                issuanceDate: req.approvedAt || req.updatedAt,
                requestedAt: req.requestedAt,
                fullVC: vcResponse.data.vc || null
              };
            } catch (err) {
              console.warn(`Could not fetch VC ${req.issuedVCCID}:`, err.message);
              return {
                vcCID: req.issuedVCCID,
                holderAddress: req.holderAddress,
                holderName: req.holderName,
                credentialType: req.vcType || req.credentialType,
                issuanceDate: req.approvedAt || req.updatedAt,
                requestedAt: req.requestedAt,
                fullVC: null,
                error: "Could not fetch VC data"
              };
            }
          })
        );

        setCredentials(enrichedCredentials);
      } else {
        setCredentials([]);
      }
    } catch (err) {
      console.error("Error fetching credentials:", err);
      setError("Failed to load issued credentials");
      setCredentials([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredCredentials = credentials.filter((cred) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      cred.vcCID?.toLowerCase().includes(searchLower) ||
      cred.holderName?.toLowerCase().includes(searchLower) ||
      cred.fullVC?.credentialSubject?.name?.toLowerCase().includes(searchLower) ||
      cred.fullVC?.credentialSubject?.rollNumber?.toLowerCase().includes(searchLower) ||
      cred.fullVC?.credentialSubject?.registerNumber?.toLowerCase().includes(searchLower) ||
      cred.fullVC?.credentialSubject?.department?.toLowerCase().includes(searchLower) ||
      cred.credentialType?.toLowerCase().includes(searchLower)
    );
  });

  const handleDeleteCredential = async (vcCID, event) => {
    // Prevent card click event
    event.stopPropagation();

    if (!window.confirm("Are you sure you want to remove this credential from your issued list? (It will still exist on IPFS and blockchain)")) {
      return;
    }

    try {
      console.log("🗑️ Deleting issued credential:", vcCID);

      // Remove from local state immediately for better UX
      setCredentials(prevCreds => prevCreds.filter(cred => cred.vcCID !== vcCID));

      alert("✅ Credential removed from your issued list");
    } catch (err) {
      console.error("❌ Error deleting credential:", err);
      alert("Failed to remove credential: " + err.message);
      // Refresh to restore state
      fetchIssuedCredentials();
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <AnimatedPage className="min-h-screen py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-navy-dark to-navy rounded-xl flex items-center justify-center shadow-lg shadow-navy/50">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-extrabold bg-gradient-to-r from-navy-dark via-navy to-navy-dark dark:text-white dark:bg-none bg-clip-text text-transparent">
                  Issued Credentials
                </h1>
                <p className="text-slate-600 dark:text-slate-400 mt-1">
                  View and manage all credentials you've issued
                </p>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate("/issuer-dashboard")}
              className="px-6 py-3 bg-white dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all"
            >
              ← Back to Dashboard
            </motion.button>
          </div>
        </motion.div>

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, roll number, department, or CID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
        >
          <div className="glass-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 dark:text-slate-400 text-sm mb-1">Total Issued</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{credentials.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-blue-400" />
              </div>
            </div>
          </div>

          <div className="glass-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 dark:text-slate-400 text-sm mb-1">Filtered Results</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{filteredCredentials.length}</p>
              </div>
              <div className="w-12 h-12 bg-cyan-500/20 rounded-xl flex items-center justify-center">
                <Search className="w-6 h-6 text-cyan-400" />
              </div>
            </div>
          </div>

          <div className="glass-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 dark:text-slate-400 text-sm mb-1">Issuer Address</p>
                <p className="text-sm font-mono text-gray-900 dark:text-white">
                  {userAddress?.slice(0, 8)}...{userAddress?.slice(-6)}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                <Building2 className="w-6 h-6 text-purple-400" />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Credentials List */}
        {loading ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className="inline-block w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-slate-400">Loading issued credentials...</p>
          </motion.div>
        ) : error ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card p-8 text-center"
          >
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <p className="text-red-400 text-lg font-semibold mb-2">Error Loading Credentials</p>
            <p className="text-slate-400 mb-4">{error}</p>
            <button
              onClick={fetchIssuedCredentials}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Retry
            </button>
          </motion.div>
        ) : filteredCredentials.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card p-12 text-center"
          >
            <FileText className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              {searchTerm ? "No matching credentials" : "No credentials issued yet"}
            </h3>
            <p className="text-slate-400 mb-6">
              {searchTerm
                ? "Try adjusting your search terms"
                : "Start by issuing your first verifiable credential"}
            </p>
            {!searchTerm && (
              <button
                onClick={() => navigate("/vc-form")}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white font-semibold rounded-xl transition-all"
              >
                Issue New Credential
              </button>
            )}
          </motion.div>
        ) : (
          <div className="space-y-4">
            {filteredCredentials.map((cred, index) => {
              const subject = cred.fullVC?.credentialSubject || {};
              const issuanceDate = cred.fullVC?.issuanceDate;

              return (
                <motion.div
                  key={cred.vcCID || index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.01 }}
                  className="glass-card p-6 hover:border-blue-500/30 transition-all cursor-pointer"
                  onClick={() => navigate(`/issuer/credential/${cred.vcCID}`)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg flex items-center justify-center">
                          <User className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                            {cred.holderName || subject.name || "Unknown"}
                          </h3>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            {cred.credentialType || "Credential"}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                        {/* Show different fields based on credential type */}
                        {(cred.credentialType?.includes("Academic") || cred.fullVC?.type?.some(t => t.includes("Academic"))) ? (
                          <>
                            <div>
                              <p className="text-xs text-slate-600 dark:text-slate-500 mb-1">Register Number</p>
                              <p className="text-sm text-slate-700 dark:text-slate-300 font-semibold">
                                {subject.registerNumber || "N/A"}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-600 dark:text-slate-500 mb-1">Degree</p>
                              <p className="text-sm text-slate-700 dark:text-slate-300 font-semibold">
                                {subject.degree || "N/A"}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-600 dark:text-slate-500 mb-1">University</p>
                              <p className="text-sm text-slate-700 dark:text-slate-300 font-semibold">
                                {subject.university || "N/A"}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-600 dark:text-slate-500 mb-1">CGPA</p>
                              <p className="text-sm text-slate-700 dark:text-slate-300 font-semibold">
                                {subject.cgpa || "N/A"}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-600 dark:text-slate-500 mb-1">Class</p>
                              <p className="text-sm text-slate-700 dark:text-slate-300 font-semibold">
                                {subject.class || "N/A"}
                              </p>
                            </div>
                          </>
                        ) : (
                          <>
                            <div>
                              <p className="text-xs text-slate-600 dark:text-slate-500 mb-1">Roll Number</p>
                              <p className="text-sm text-slate-700 dark:text-slate-300 font-semibold">
                                {subject.rollNumber || "N/A"}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-600 dark:text-slate-500 mb-1">Department</p>
                              <p className="text-sm text-slate-700 dark:text-slate-300 font-semibold">
                                {subject.department || "N/A"}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-600 dark:text-slate-500 mb-1">Date of Birth</p>
                              <p className="text-sm text-slate-700 dark:text-slate-300 font-semibold">
                                {subject.dateOfBirth || subject.dob || "N/A"}
                              </p>
                            </div>
                          </>
                        )}
                        <div>
                          <p className="text-xs text-slate-600 dark:text-slate-500 mb-1">Issued Date</p>
                          <p className="text-sm text-slate-700 dark:text-slate-300 font-semibold flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(issuanceDate || cred.issuanceDate)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-600 dark:text-slate-500">CID:</span>
                        <code className="text-xs font-mono text-blue-400 bg-blue-500/10 px-2 py-1 rounded">
                          {cred.vcCID?.slice(0, 20)}...{cred.vcCID?.slice(-10)}
                        </code>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <span className="px-3 py-1 bg-green-500/20 text-green-400 text-xs font-semibold rounded-full border border-green-500/30">
                        Active
                      </span>
                      <button
                        onClick={(e) => handleDeleteCredential(cred.vcCID, e)}
                        className="p-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 hover:border-red-500/50 text-red-400 rounded-lg transition-all duration-200"
                        title="Remove from issued list"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <ExternalLink className="w-5 h-5 text-slate-400" />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </AnimatedPage>
  );
}
