import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Send, FileText, User, MessageSquare, CheckCircle, AlertCircle, CreditCard, Hash, GraduationCap, BookOpen, Link2, Sparkles, Clock } from "lucide-react";
import AnimatedPage from "./shared/AnimatedPage";

export default function HolderRequestCredential() {
  const { userAddress, did } = useAuth();
  const navigate = useNavigate();
  const [message, setMessage] = useState("");
  const [credentialType, setCredentialType] = useState("Student ID");
  const [holderName, setHolderName] = useState("");
  const [verificationID, setVerificationID] = useState("");
  const [studentIDDocument, setStudentIDDocument] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [error, setError] = useState(null);

  // For Academic Certificate - attach existing Student ID VC
  const [myStudentIDVCs, setMyStudentIDVCs] = useState([]);
  const [selectedStudentVC, setSelectedStudentVC] = useState("");
  const [loadingVCs, setLoadingVCs] = useState(false);





  const fetchMyStudentIDVCs = async () => {
    try {
      setLoadingVCs(true);
      console.log("📚 Fetching Student ID VCs for holder:", userAddress);
      const response = await axios.get(`http://localhost:5000/holder/vcs/${userAddress}`);

      if (response.data.success && response.data.vcs) {
        // Filter only Student ID VCs
        const studentIDs = response.data.vcs.filter(vc => {
          // Check if fullVC exists and has StudentID type
          if (vc.fullVC && vc.fullVC.type) {
            return vc.fullVC.type.includes("StudentID");
          }
          // Fallback to credentialType field
          return vc.credentialType === "StudentID";
        }).map(vc => ({
          // Normalize the structure for easier use
          cid: vc.vcCID,
          issuanceDate: vc.fullVC?.issuanceDate || vc.issuanceDate,
          credentialSubject: vc.fullVC?.credentialSubject || {
            name: vc.name,
            rollNumber: vc.rollNumber,
            department: vc.department
          },
          type: vc.fullVC?.type || ["VerifiableCredential", "StudentID"],
          fullVC: vc.fullVC
        }));
        console.log("✅ Found Student ID VCs:", studentIDs.length);
        setMyStudentIDVCs(studentIDs);
      }
    } catch (err) {
      console.error("Error fetching Student ID VCs:", err);
      setError("Failed to load your Student ID credentials");
    } finally {
      setLoadingVCs(false);
    }
  };

  // Fetch Student ID VCs when Academic Certificate is selected
  useEffect(() => {
    if (credentialType === "Academic Certificate" && userAddress) {
      fetchMyStudentIDVCs();
    }
  }, [credentialType, userAddress]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!message.trim()) {
      setError("Please enter a message");
      return;
    }

    if (!holderName.trim()) {
      setError("Please enter your name");
      return;
    }

    if (!verificationID.trim()) {
      setError(`Please enter ${credentialType === "Student ID" ? "Admission Number" : "Education Govt ID"}`);
      return;
    }

    // Validate Student ID VC selection for Academic Certificate
    if (credentialType === "Academic Certificate" && !selectedStudentVC) {
      setError("Please select a Student ID credential to attach");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      setSubmitSuccess(false);

      // Step 1: Create pending request
      console.log("📝 Step 1: Creating credential request...");
      console.log("Request data:", {
        holderDID: did,
        holderAddress: userAddress,
        holderName: holderName.trim() || "Unknown",
        vcType: credentialType,
        verificationID: verificationID.trim(),
        message: message.trim()
      });

      let requestResponse;
      try {
        const requestPayload = {
          holderDID: did,
          holderAddress: userAddress,
          holderName: holderName.trim() || "Unknown",
          vcType: credentialType,
          verificationID: verificationID.trim(),
          message: message.trim()
        };

        // Attach Student ID VC for Academic Certificate requests
        if (credentialType === "Academic Certificate" && selectedStudentVC) {
          const selectedVC = myStudentIDVCs.find(vc => vc.cid === selectedStudentVC);
          requestPayload.attachedStudentVC = {
            cid: selectedStudentVC,
            data: selectedVC // Include full VC data
          };
          console.log("🔗 Attaching Student ID VC:", selectedStudentVC);
        }

        requestResponse = await axios.post("http://localhost:5000/holder/requestCredential", requestPayload);
      } catch (step1Error) {
        console.error("❌ Step 1 failed:", step1Error);
        console.error("Response data:", step1Error.response?.data);
        setError(step1Error.response?.data?.message || "Failed to create request");
        return;
      }

      if (!requestResponse.data.success) {
        console.error("❌ Step 1 response not successful:", requestResponse.data);
        setError(requestResponse.data.message || "Failed to create request");
        return;
      }

      const requestId = requestResponse.data.requestId;
      console.log(`✅ Request created: ${requestId}`);
      console.log('Request ID type:', typeof requestId);
      console.log('Request ID value:', requestId);

      // Step 2: Request challenge nonce
      console.log("🔐 Step 2: Requesting challenge nonce...");
      console.log('Sending to challenge/request:', { requestId });

      let challengeResponse;
      try {
        challengeResponse = await axios.post("http://localhost:5000/challenge/request", {
          requestId
        });
      } catch (step2Error) {
        console.error("❌ Step 2 failed:", step2Error);
        console.error("Response data:", step2Error.response?.data);
        setError(step2Error.response?.data?.message || "Failed to get challenge");
        return;
      }

      if (!challengeResponse.data.success) {
        console.error("❌ Step 2 response not successful:", challengeResponse.data);
        setError(challengeResponse.data.message || "Failed to get challenge");
        return;
      }

      const { nonceId, messageToSign } = challengeResponse.data;
      console.log(`✅ Challenge received: ${nonceId}`);
      console.log(`📝 Message to sign: ${messageToSign.substring(0, 50)}...`);

      // Step 3: Sign message with MetaMask
      console.log("✍️ Step 3: Requesting signature from MetaMask...");
      setError("Please sign the message in MetaMask to prove DID ownership...");

      let signature;
      try {
        if (!window.ethereum) {
          throw new Error("MetaMask not found");
        }

        // Request signature from MetaMask
        signature = await window.ethereum.request({
          method: "personal_sign",
          params: [messageToSign, userAddress]
        });

        console.log(`✅ Signature received: ${signature.substring(0, 20)}...`);
      } catch (signError) {
        console.error("❌ Signature rejected:", signError);
        setError("Signature rejected. Please sign the message to verify DID ownership.");
        return;
      }

      // Step 4: Verify challenge
      console.log("🔍 Step 4: Verifying signature...");
      setError("Verifying your signature...");

      const verifyResponse = await axios.post("http://localhost:5000/challenge/verify", {
        requestId,
        nonceId,
        signature
      });

      if (!verifyResponse.data.success || !verifyResponse.data.verified) {
        setError(verifyResponse.data.message || "Signature verification failed");
        return;
      }

      console.log("✅ DID ownership verified!");

      // Success!
      setSubmitSuccess(true);
      setError(null);
      setMessage("");
      setHolderName("");
      setCredentialType("Student ID");
      setVerificationID("");

      // Hide success message after 5 seconds
      setTimeout(() => setSubmitSuccess(false), 5000);

    } catch (err) {
      console.error("❌ Error in request flow:", err);
      setError(err.response?.data?.message || err.message || "Failed to submit credential request");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatedPage className="min-h-screen py-8 px-4 sm:py-12">
      <div className="max-w-[1400px] mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-6">
            <div className="relative">
              <div className="w-20 h-20 bg-gradient-to-br from-navy-dark to-navy rounded-3xl flex items-center justify-center shadow-xl shadow-navy/20 transform hover:scale-105 transition-transform">
                <Send className="w-10 h-10 text-white" />
              </div>
            </div>
            <div className="flex-1">
              <h1 className="text-4xl sm:text-5xl font-extrabold mb-2 pb-2 bg-gradient-to-r from-navy-dark via-navy to-navy-dark dark:text-white dark:bg-none bg-clip-text text-transparent drop-shadow-sm dark:drop-shadow-[0_2px_10px_rgba(53,87,125,0.5)]">
                Request Credential
              </h1>
              <p className="text-slate-600 dark:text-slate-400 text-lg">Submit a verified request to issuers for digital credentials</p>
              <div className="flex items-center gap-2 mt-3">
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/10 border border-green-500/30 rounded-full">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-green-300 text-xs font-medium">DID Verified</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-500/10 border border-slate-500/30 rounded-full">
                  <CheckCircle className="w-3 h-3 text-slate-400" />
                  <span className="text-slate-300 text-xs font-medium">Secure Request</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="w-full max-w-[1600px] mx-auto px-4">
          {/* Request Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-xl border border-slate-200 dark:border-slate-700 rounded-3xl shadow-2xl p-12 relative overflow-hidden w-full"
          >
            {/* Decorative Elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-navy-dark/5 to-navy/5 rounded-full blur-3xl -z-10"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-navy-dark/5 to-navy/5 rounded-full blur-3xl -z-10"></div>

            <div className="w-full px-2 sm:px-4">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-navy-dark to-navy rounded-xl flex items-center justify-center">
                      <FileText className="w-6 h-6 text-white" />
                    </div>
                    <span>New Request</span>
                  </h2>
                  <p className="text-slate-600 dark:text-slate-400 text-sm">Fill in the details below to submit your request</p>
                </div>
                <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl">
                  <div className="flex items-center gap-1">
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold">1</div>
                    <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">Details</span>
                  </div>
                  <div className="w-8 h-px bg-slate-300 dark:bg-slate-600"></div>
                  <div className="flex items-center gap-1">
                    <div className="w-6 h-6 bg-slate-400 dark:bg-slate-600 rounded-full flex items-center justify-center text-white text-xs font-bold">2</div>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Submit</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Success Message */}
            {submitSuccess && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 mx-6 p-3 bg-green-500/20 border border-green-500/30 rounded-xl flex items-center space-x-3"
              >
                <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0" />
                <div>
                  <p className="text-green-400 font-semibold">✅ Request Verified & Submitted!</p>
                  <p className="text-green-300 text-sm">DID ownership verified. Issuer will review your request.</p>
                </div>
              </motion.div>
            )}

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 mx-6 p-3 bg-red-500/20 border border-red-500/30 rounded-xl flex items-center space-x-3"
              >
                <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0" />
                <p className="text-red-400">{error}</p>
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6 w-full px-2 sm:px-4">
              {/* Two Column Layout for Identity and Credential Details */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                {/* Section 1: Identity Information */}
                <div className="bg-white dark:bg-slate-800/50 backdrop-blur-md rounded-2xl p-5 lg:p-6 border-2 border-slate-200 dark:border-slate-700 shadow-xl">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-gradient-to-br from-navy-dark to-navy rounded-xl flex items-center justify-center">
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-white">Identity Information</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Your verified identity details</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {/* Your DID */}
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                        <Hash className="w-4 h-4 text-slate-500" />
                        Your DID (Auto-filled)
                      </label>
                      <div className="bg-slate-50 dark:bg-slate-900/50 border-2 border-slate-200 dark:border-slate-700 rounded-xl p-4">
                        <code className="text-navy dark:text-blue-400 text-sm font-mono break-all leading-relaxed font-semibold">{did}</code>
                      </div>
                    </div>

                    {/* Your Name */}
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                        <User className="w-4 h-4 text-slate-500" />
                        Your Name <span className="text-xs text-slate-500 font-normal" >*</span>
                      </label>
                      <input
                        type="text"
                        value={holderName}
                        onChange={(e) => setHolderName(e.target.value)}
                        placeholder="Enter your full name"
                        required
                        className="w-full px-5 py-3 bg-white dark:bg-slate-900/50 border-2 border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white text-base placeholder-slate-400 focus:border-navy focus:ring-4 focus:ring-navy/20 hover:border-slate-300 dark:hover:border-slate-600 transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 2: Credential Details */}
                <div className="bg-white dark:bg-slate-800/50 backdrop-blur-md rounded-2xl p-5 lg:p-6 border-2 border-slate-200 dark:border-slate-700 shadow-xl">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-gradient-to-br from-navy-dark to-navy rounded-xl flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-white">Credential Details</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Specify what you're requesting</p>
                    </div>
                  </div>

                  <div className="space-y-8">
                    {/* Credential Type */}
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                        <GraduationCap className="w-4 h-4 text-slate-500" />
                        Credential Type <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <select
                          value={credentialType}
                          onChange={(e) => {
                            setCredentialType(e.target.value);
                            setVerificationID("");
                          }}
                          required
                          className="w-full px-8 py-5 bg-white dark:bg-slate-900/50 border-2 border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white text-lg focus:border-navy focus:ring-4 focus:ring-navy/20 hover:border-slate-300 dark:hover:border-slate-600 transition-all appearance-none cursor-pointer"
                        >
                          <option value="Student ID">🎓 Student ID</option>
                          <option value="Academic Certificate">📜 Academic Certificate</option>
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                          <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* Verification ID */}
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                        <Hash className="w-4 h-4 text-slate-500" />
                        {credentialType === "Student ID" ? "Admission Number" : "Education Govt ID"} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={verificationID}
                        onChange={(e) => setVerificationID(e.target.value)}
                        placeholder={credentialType === "Student ID" ? "e.g., ADM2024001" : "e.g., EDU123456789"}
                        required
                        className="w-full px-8 py-5 bg-white dark:bg-slate-900/50 border-2 border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white text-lg placeholder-slate-400 focus:border-navy focus:ring-4 focus:ring-navy/20 hover:border-slate-300 dark:hover:border-slate-600 transition-all"
                      />
                      <p className="text-xs text-slate-500 mt-2 ml-1">
                        {credentialType === "Student ID"
                          ? "Your unique admission/enrollment number"
                          : "Government-issued education ID for verification"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Attach Student ID VC - Only for Academic Certificate */}
              {credentialType === "Academic Certificate" && (
                <div className="bg-white dark:bg-slate-800/50 backdrop-blur-md rounded-2xl p-8 lg:p-16 border-2 border-slate-200 dark:border-slate-700 shadow-xl">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 bg-gradient-to-br from-navy-dark to-navy rounded-xl flex items-center justify-center">
                      <Link2 className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-800 dark:text-white">Attach Student ID</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Link your existing Student ID credential</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-slate-500" />
                      Your Student ID Credential <span className="text-red-500">*</span>
                    </label>

                    {loadingVCs ? (
                      <div className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border-2 border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 flex items-center gap-3">
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-green-500 border-t-transparent"></div>
                        <span>Loading your Student ID credentials...</span>
                      </div>
                    ) : myStudentIDVCs.length === 0 ? (
                      <div className="w-full px-5 py-4 bg-red-500/10 border-2 border-red-500/30 rounded-xl">
                        <p className="text-red-400 font-bold flex items-center gap-2 mb-2">
                          <AlertCircle className="w-5 h-5" />
                          No Student ID Found
                        </p>
                        <p className="text-red-300 text-sm mb-2">You need a Student ID credential before requesting an Academic Certificate.</p>
                        <p className="text-red-200 text-xs">Please request a Student ID first, then come back to request your Academic Certificate.</p>
                      </div>
                    ) : (
                      <>
                        <div className="relative">
                          <select
                            value={selectedStudentVC}
                            onChange={(e) => setSelectedStudentVC(e.target.value)}
                            required
                            className="w-full px-8 py-5 bg-white dark:bg-slate-900/50 border-2 border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white text-lg focus:border-navy focus:ring-4 focus:ring-navy/20 hover:border-slate-300 dark:hover:border-slate-600 transition-all appearance-none cursor-pointer"
                          >
                            <option value="">Select a Student ID to attach</option>
                            {myStudentIDVCs.map((vc, index) => (
                              <option key={vc.cid || index} value={vc.cid}>
                                Student ID - {vc.credentialSubject?.name || "Unknown"} (Issued: {new Date(vc.issuanceDate).toLocaleDateString()})
                              </option>
                            ))}
                          </select>
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                            <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </div>
                        <p className="text-xs text-slate-400 mt-2 ml-1 flex items-center gap-1.5">
                          <div className="w-1 h-1 bg-slate-500 rounded-full"></div>
                          Select an existing Student ID credential to link with your Academic Certificate request
                        </p>

                        {selectedStudentVC && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-4 p-4 bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-2 border-green-500/30 rounded-xl"
                          >
                            <p className="text-green-400 font-bold flex items-center gap-2 mb-3">
                              <CheckCircle className="w-5 h-5" />
                              Student ID Selected
                            </p>
                            {(() => {
                              const vc = myStudentIDVCs.find(v => v.cid === selectedStudentVC);
                              return vc ? (
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                  <div>
                                    <p className="text-slate-600 dark:text-slate-400 text-xs mb-1 font-semibold">Name</p>
                                    <p className="text-slate-800 dark:text-white font-bold">{vc.credentialSubject?.name}</p>
                                  </div>
                                  <div>
                                    <p className="text-slate-600 dark:text-slate-400 text-xs mb-1 font-semibold">Roll Number</p>
                                    <p className="text-slate-800 dark:text-white font-bold">{vc.credentialSubject?.rollNumber}</p>
                                  </div>
                                  <div>
                                    <p className="text-slate-600 dark:text-slate-400 text-xs mb-1 font-semibold">Department</p>
                                    <p className="text-slate-800 dark:text-white font-bold">{vc.credentialSubject?.department}</p>
                                  </div>
                                  <div>
                                    <p className="text-slate-600 dark:text-slate-400 text-xs mb-1 font-semibold">CID</p>
                                    <code className="text-slate-700 dark:text-slate-300 text-xs font-mono font-semibold">{vc.cid.substring(0, 15)}...</code>
                                  </div>
                                </div>
                              ) : null;
                            })()}
                          </motion.div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Section 3: Request Message */}
              <div className="bg-white dark:bg-slate-800/50 backdrop-blur-md rounded-2xl p-5 lg:p-6 border-2 border-slate-200 dark:border-slate-700 shadow-xl">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-br from-navy-dark to-navy rounded-xl flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-white">Request Message</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Explain your request to the issuer</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-slate-500" />
                    Your Message <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="E.g., I am requesting an academic certificate for my graduation in 2024. I have completed all requirements and need this for employment purposes..."
                    rows={4}
                    required
                    className="w-full px-8 py-5 bg-white dark:bg-slate-900/50 border-2 border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white text-lg placeholder-slate-400 focus:border-navy focus:ring-4 focus:ring-navy/20 hover:border-slate-300 dark:hover:border-slate-600 transition-all resize-none leading-relaxed"
                  />
                  <p className="text-xs text-slate-500 mt-2 ml-1">
                    Provide details about what credential you need and why you're requesting it
                  </p>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <motion.button
                  type="submit"
                  disabled={isSubmitting || !message.trim()}
                  whileHover={{ scale: isSubmitting ? 1 : 1.01 }}
                  whileTap={{ scale: isSubmitting ? 1 : 0.99 }}
                  className="w-full max-w-md mx-auto block bg-gradient-to-r from-navy-dark to-navy hover:from-navy-darker hover:to-navy-medium text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-navy/30"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span className="text-base">Submitting Request...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      <span className="text-base">Submit Request & Verify DID</span>
                    </>
                  )}
                </motion.button>
                <p className="text-center text-xs text-slate-400 mt-4 flex items-center justify-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  You'll be asked to sign with MetaMask to verify your DID ownership
                </p>
              </div>
            </form>
          </motion.div>
        </div>

        {/* View My Requests Button */}
        <div className="w-full max-w-[1400px] mx-auto px-8 mt-8">
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            onClick={() => navigate("/holder/my-requests")}
            className="w-full glass-card p-6 hover:bg-navy/5 hover:border-navy/20 transition-all duration-300 group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Clock className="w-6 h-6 text-navy group-hover:scale-110 transition-transform" />
                <div className="text-left">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-navy dark:group-hover:text-blue-300 transition-colors">View My Requests</h3>
                  <p className="text-slate-600 dark:text-slate-400 text-sm">Track the status of your credential requests</p>
                </div>
              </div>
              <div className="text-navy text-2xl group-hover:translate-x-1 transition-transform">→</div>
            </div>
          </motion.button>
        </div>
      </div>
    </AnimatedPage>
  );
}
