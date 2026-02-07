import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { Inbox, User, Calendar, FileText, CheckCircle, XCircle, Clock, AlertCircle, Send, Trash2, GraduationCap, Hash, MapPin, Award, BookOpen, Image, ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import AnimatedPage from "./shared/AnimatedPage";

export default function IssuerViewRequests() {
  const { userAddress, userRole, setVcData } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all"); // all, pending, approved, rejected
  const [processingId, setProcessingId] = useState(null);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [issuingVC, setIssuingVC] = useState(false);
  const [issueFormData, setIssueFormData] = useState({
    credentialType: "StudentID",
    // Student ID fields
    name: "",
    rollNumber: "",
    dob: "",
    department: "",
    photo: null,
    // Academic Certificate fields
    registerNumber: "",
    degree: "",
    branch: "",
    university: "",
    location: "",
    cgpa: "",
    class: "",
    examHeldIn: "",
    issueDate: ""
  });

  // Ensure only issuer can access
  useEffect(() => {
    if (userRole !== "issuer") {
      navigate("/");
    }
  }, [userRole, navigate]);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      // Fetch all requests (not just verified - includes approved and rejected too)
      const response = await axios.get("http://localhost:5000/issuer/allRequests");

      if (response.data.success) {
        setRequests(response.data.requests);
        console.log(`📋 Loaded ${response.data.requests.length} requests`);
      } else {
        setError(response.data.message || "Failed to load requests");
      }
    } catch (err) {
      console.error("Error fetching requests:", err);
      setError(err.response?.data?.message || "Failed to load credential requests");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = (request) => {
    setSelectedRequest(request);

    // Auto-fill form based on credential type
    const formData = {
      credentialType: request.vcType === "Academic Certificate" ? "AcademicCertificate" : "StudentID",
      // Student ID fields
      name: request.holderName || "",
      rollNumber: "",
      dob: "",
      department: "",
      photo: null,
      // Academic Certificate fields
      registerNumber: "",
      degree: "",
      branch: "",
      university: "",
      location: "",
      cgpa: "",
      class: "",
      examHeldIn: "",
      issueDate: ""
    };

    // Auto-fill from attached Student ID VC for Academic Certificate
    if (request.vcType === "Academic Certificate" && request.attachedStudentVC && request.attachedStudentVC.data) {
      const studentVC = request.attachedStudentVC.data.credentialSubject;
      if (studentVC) {
        formData.name = studentVC.name || request.holderName || "";
        formData.registerNumber = studentVC.rollNumber || "";
        formData.department = studentVC.department || "";
        formData.dob = studentVC.dateOfBirth || "";
        console.log("✅ Auto-filled form with Student ID data:", formData);
      }
    }

    setIssueFormData(formData);
    setShowIssueModal(true);
  };

  const handleIssueVC = async (e) => {
    e.preventDefault();

    if (!issueFormData.photo) {
      alert("Please select a photo");
      return;
    }

    try {
      const requestId = selectedRequest.requestId || selectedRequest.id;
      setProcessingId(requestId);
      setIssuingVC(true);

      console.log('🔄 Issuing VC for request:', requestId);
      console.log('Request data:', selectedRequest);

      // Prepare form data for VC issuance
      const data = new FormData();
      data.append("credentialType", issueFormData.credentialType);
      data.append("name", issueFormData.name);
      data.append("address", userAddress);
      data.append("holderDID", selectedRequest.holderDID);
      if (selectedRequest.holderAddress) {
        data.append("holderAddress", selectedRequest.holderAddress);
      }
      data.append("photo", issueFormData.photo);

      // Student ID specific fields
      if (issueFormData.credentialType === "StudentID") {
        data.append("rollNumber", issueFormData.rollNumber);
        data.append("dob", issueFormData.dob);
        data.append("department", issueFormData.department);
      }

      // Academic Certificate specific fields
      if (issueFormData.credentialType === "AcademicCertificate") {
        data.append("registerNumber", issueFormData.registerNumber);
        data.append("degree", issueFormData.degree);
        data.append("branch", issueFormData.branch);
        data.append("university", issueFormData.university);
        data.append("location", issueFormData.location);
        data.append("cgpa", issueFormData.cgpa);
        data.append("class", issueFormData.class);
        data.append("examHeldIn", issueFormData.examHeldIn);
        data.append("issueDate", issueFormData.issueDate);
      }

      // Issue VC
      console.log('📝 Issuing VC to blockchain...');
      const vcResponse = await axios.post("http://localhost:5000/issueVC", data, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      if (vcResponse.data.success) {
        const vcCID = vcResponse.data.ipfs?.vcCID;
        console.log('✅ VC issued with CID:', vcCID);

        // Link VC to holder
        if (vcCID) {
          console.log('🔗 Linking VC to holder...');
          await axios.post("http://localhost:5000/linkVCToHolder", {
            holderDID: selectedRequest.holderDID,
            vcCID: vcCID
          });
        }

        // Approve the request
        console.log('✅ Approving request:', requestId);
        await axios.post("http://localhost:5000/issuer/approveRequest", {
          requestId: requestId,
          vcCID: vcCID,
          issuerAddress: userAddress
        });

        // Store VC data in context for the view page
        // The view page expects: { vc, ipfs, bbsPublicKey, messageCount }
        setVcData({
          vc: vcResponse.data.vc,
          ipfs: vcResponse.data.ipfs,
          bbsPublicKey: vcResponse.data.bbsPublicKey,
          messageCount: vcResponse.data.messageCount
        });

        // Close modal and refresh requests
        setShowIssueModal(false);
        setSelectedRequest(null);

        // Refresh the requests list to show updated status
        await fetchRequests();

        console.log('✅ Request approved and VC issued successfully');
        setIssuingVC(false);
        alert('✅ Credential issued successfully!');

        // Redirect to view the issued credential details
        navigate(`/view`);
      }
    } catch (error) {
      console.error('❌ Error issuing VC:', error);
      setIssuingVC(false);
      alert(`Failed to issue credential: ${error.response?.data?.error || error.message}`);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (requestId) => {
    const reason = prompt("Enter rejection reason (optional):");
    if (reason === null) return; // User cancelled

    try {
      setProcessingId(requestId);

      console.log('❌ Rejecting request:', requestId);
      const response = await axios.post("http://localhost:5000/issuer/rejectRequest", {
        requestId: requestId,
        rejectionReason: reason || "No reason provided",
        issuerAddress: userAddress
      });

      if (response.data.success) {
        alert("❌ Request rejected");
        fetchRequests();
      }
    } catch (err) {
      console.error("Error rejecting request:", err);
      alert(err.response?.data?.message || "Failed to reject request");
    } finally {
      setProcessingId(null);
    }
  };

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch {
      return dateString;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "pending":
        return (
          <span className="flex items-center space-x-1 px-3 py-1 bg-yellow-500/20 text-yellow-400 text-xs font-semibold rounded-full border border-yellow-500/30">
            <Clock className="w-3 h-3" />
            <span>Pending</span>
          </span>
        );
      case "approved":
        return (
          <span className="flex items-center space-x-1 px-3 py-1 bg-green-500/20 text-green-400 text-xs font-semibold rounded-full border border-green-500/30">
            <CheckCircle className="w-3 h-3" />
            <span>Approved</span>
          </span>
        );
      case "rejected":
        return (
          <span className="flex items-center space-x-1 px-3 py-1 bg-red-500/20 text-red-400 text-xs font-semibold rounded-full border border-red-500/30">
            <XCircle className="w-3 h-3" />
            <span>Rejected</span>
          </span>
        );
      default:
        return null;
    }
  };

  const filteredRequests = requests.filter(req => {
    if (filter === "all") return true;
    return req.status === filter;
  });

  const handleDeleteRequest = async (requestId) => {
    if (!window.confirm("Are you sure you want to delete this request?")) {
      return;
    }

    try {
      console.log("🗑️ Deleting request:", requestId);

      // Delete from backend
      const response = await axios.delete(`http://localhost:5000/issuer/request/${requestId}`, {
        data: { issuerAddress: userAddress }
      });

      if (response.data.success) {
        console.log("✅ Request deleted successfully");
        // Update local state
        setRequests(prevRequests => prevRequests.filter(req => (req.requestId || req.id) !== requestId));
        alert("✅ Request deleted successfully");
      }
    } catch (err) {
      console.error("❌ Error deleting request:", err);
      alert("Failed to delete request: " + (err.response?.data?.message || err.message));
    }
  };

  const stats = {
    total: requests.length,
    verified: requests.filter(r => r.status === "verified").length,
    approved: requests.filter(r => r.status === "approved").length,
    rejected: requests.filter(r => r.status === "rejected").length
  };

  if (loading) {
    return (
      <AnimatedPage className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400 text-lg">Loading requests...</p>
        </div>
      </AnimatedPage>
    );
  }

  return (
    <AnimatedPage className="min-h-screen py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center space-x-4 mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-navy-dark to-navy rounded-2xl flex items-center justify-center shadow-lg shadow-navy/50">
              <Inbox className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-extrabold bg-gradient-to-r from-navy-dark via-navy to-navy-dark dark:text-white dark:bg-none bg-clip-text text-transparent">
                Credential Requests
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-1">Review and process holder credential requests</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="glass-card p-4"
            >
              <p className="text-slate-600 dark:text-slate-400 text-sm mb-1">Total Requests</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="glass-card p-4"
            >
              <p className="text-blue-400 text-sm mb-1">Verified</p>
              <p className="text-3xl font-bold text-blue-400">{stats.verified}</p>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="glass-card p-4"
            >
              <p className="text-green-400 text-sm mb-1">Approved</p>
              <p className="text-3xl font-bold text-green-400">{stats.approved}</p>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="glass-card p-4"
            >
              <p className="text-red-400 text-sm mb-1">Rejected</p>
              <p className="text-3xl font-bold text-red-400">{stats.rejected}</p>
            </motion.div>
          </div>
        </motion.div>

        {/* Filter Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6 flex items-center space-x-2 overflow-x-auto pb-2"
        >
          {[
            { value: "all", label: "All", count: stats.total },
            { value: "verified", label: "Verified", count: stats.verified },
            { value: "approved", label: "Approved", count: stats.approved },
            { value: "rejected", label: "Rejected", count: stats.rejected }
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value)}
              className={`px-4 py-2 rounded-xl font-semibold transition-all whitespace-nowrap ${filter === tab.value
                ? "bg-navy text-white shadow-lg shadow-navy/30"
                : "bg-white dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 border border-slate-200 dark:border-slate-700"
                }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </motion.div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-xl flex items-center space-x-3"
          >
            <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0" />
            <p className="text-red-400">{error}</p>
          </motion.div>
        )}

        {/* Requests List */}
        {filteredRequests.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-12 text-center"
          >
            <div className="w-20 h-20 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Inbox className="w-10 h-10 text-slate-600" />
            </div>
            <p className="text-slate-600 dark:text-slate-400 text-lg">No {filter !== "all" ? filter : ""} requests</p>
            <p className="text-slate-500 text-sm mt-1">
              {filter === "pending" ? "All requests have been processed" : "Check back later for new requests"}
            </p>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {filteredRequests.map((request, index) => (
              <motion.div
                key={request.requestId || request.id || index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="glass-card p-6 hover:border-navy/30 transition-all"
              >
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-navy-dark to-navy rounded-xl flex items-center justify-center">
                          <User className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white">{request.holderName}</h3>
                          <p className="text-sm text-slate-600 dark:text-slate-400">{request.credentialType}</p>
                        </div>
                      </div>
                      {getStatusBadge(request.status)}
                    </div>

                    <div className="bg-white dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700 rounded-lg p-4 mb-3">
                      <p className="text-slate-700 dark:text-slate-300 text-sm">{request.message}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-slate-600 dark:text-slate-500 mb-1">Holder DID:</p>
                        <code className="text-blue-400 text-xs font-mono break-all">
                          {request.holderDID}
                        </code>
                      </div>
                      <div>
                        <p className="text-slate-500 mb-1 flex items-center space-x-1">
                          <Calendar className="w-3 h-3" />
                          <span>Requested:</span>
                        </p>
                        <p className="text-slate-700 dark:text-slate-300">{formatDate(request.requestedAt)}</p>
                      </div>
                      {request.verificationID && (
                        <div className="md:col-span-2">
                          <p className="text-slate-600 dark:text-slate-500 mb-1">
                            {request.credentialType === "Student ID" ? "Admission Number:" : "Education Govt ID:"}
                          </p>
                          <div className="bg-navy/10 border border-navy/30 rounded-lg px-3 py-2">
                            <code className="text-blue-400 text-sm font-mono font-semibold">
                              {request.verificationID}
                            </code>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Attached Student ID VC - For Academic Certificate */}
                    {request.vcType === "Academic Certificate" && request.attachedStudentVC && (
                      <div className="mt-3 p-3 bg-navy/10 border border-navy/30 rounded-lg">
                        <p className="text-blue-400 text-sm font-semibold mb-2 flex items-center space-x-2">
                          <FileText className="w-4 h-4" />
                          <span>🔗 Attached Student ID Credential</span>
                        </p>
                        {request.attachedStudentVC.data && request.attachedStudentVC.data.credentialSubject ? (
                          <div className="text-xs text-blue-300 space-y-1 mt-2">
                            <p><strong>Name:</strong> {request.attachedStudentVC.data.credentialSubject.name}</p>
                            <p><strong>Roll Number:</strong> {request.attachedStudentVC.data.credentialSubject.rollNumber}</p>
                            <p><strong>Department:</strong> {request.attachedStudentVC.data.credentialSubject.department}</p>
                            <p><strong>DOB:</strong> {request.attachedStudentVC.data.credentialSubject.dateOfBirth}</p>
                            <p className="mt-2"><strong>IPFS CID:</strong></p>
                            <code className="text-blue-200 break-all">{request.attachedStudentVC.cid}</code>
                          </div>
                        ) : (
                          <p className="text-blue-300 text-xs">CID: {request.attachedStudentVC.cid}</p>
                        )}
                      </div>
                    )}

                    {request.status === "approved" && request.issuedVCCID && (
                      <div className="mt-3 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                        <p className="text-green-400 text-sm font-semibold mb-1">✅ Credential Issued</p>
                        <code className="text-green-300 text-xs break-all">
                          CID: {request.issuedVCCID}
                        </code>
                      </div>
                    )}

                    {request.status === "rejected" && request.rejectionReason && (
                      <div className="mt-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                        <p className="text-red-400 text-sm font-semibold mb-1">❌ Rejection Reason:</p>
                        <p className="text-red-300 text-sm">{request.rejectionReason}</p>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex md:flex-col gap-2">
                    {request.status === "verified" && (
                      <>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleApprove(request)}
                          disabled={processingId === (request.requestId || request.id)}
                          className="flex-1 md:flex-none px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
                        >
                          <CheckCircle className="w-4 h-4" />
                          <span>Approve & Issue</span>
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleReject(request.requestId || request.id)}
                          disabled={processingId === (request.requestId || request.id)}
                          className="flex-1 md:flex-none px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
                        >
                          <XCircle className="w-4 h-4" />
                          <span>Reject</span>
                        </motion.button>
                      </>
                    )}
                    {/* Delete Button - Available for all requests */}
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleDeleteRequest(request.requestId || request.id)}
                      className="flex-1 md:flex-none px-4 py-2 bg-slate-700 hover:bg-slate-600 border border-red-500/30 hover:border-red-500/50 text-red-400 rounded-xl font-semibold transition-all flex items-center justify-center space-x-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Delete</span>
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Issue VC Modal */}
        {showIssueModal && selectedRequest && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="bg-slate-900 border border-slate-700/50 rounded-2xl shadow-2xl p-0 max-w-4xl w-full max-h-[90vh] overflow-y-auto relative"
            >
              {/* Decorative Background Elements */}
              <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-full blur-3xl -z-10"></div>
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-purple-500/10 to-pink-500/10 rounded-full blur-3xl -z-10"></div>

              {/* Modal Header */}
              <div className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur-sm flex items-start justify-between mb-8 p-8 pb-6 max-w-full border-b border-slate-700/30">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="relative">
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-500 via-cyan-500 to-teal-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-500/50">
                        <Send className="w-8 h-8 text-white" />
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-4 border-slate-900 flex items-center justify-center">
                        <Sparkles className="w-2.5 h-2.5 text-white" />
                      </div>
                    </div>
                    <div>
                      <h2 className="text-3xl font-bold text-white mb-1">Issue Credential</h2>
                      <p className="text-slate-400 text-sm">Create and issue a verifiable credential</p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setShowIssueModal(false)}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-800/50 rounded-xl transition-all"
                >
                  <XCircle className="w-7 h-7" />
                </button>
              </div>

              {/* Holder Profile Badge */}
              <div className="mt-4 mb-8 mx-8 p-6 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-2 border-blue-500/30 rounded-2xl relative overflow-hidden max-w-3xl mx-auto">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl"></div>
                <div className="relative">
                  <div className="flex items-center gap-4 mb-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                      <User className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-blue-300 font-medium mb-1">ISSUING TO</p>
                      <p className="text-white text-xl font-bold">{selectedRequest.holderName || "Holder"}</p>
                    </div>
                    <div className="px-4 py-2 bg-green-500/20 border border-green-500/30 rounded-xl">
                      <p className="text-green-400 text-xs font-bold flex items-center gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5" />
                        Verified
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Hash className="w-4 h-4 text-blue-400" />
                    <code className="text-blue-300 text-sm font-mono break-all">
                      {selectedRequest.holderDID}
                    </code>
                  </div>
                </div>
              </div>

              <form onSubmit={handleIssueVC} className="space-y-8 px-8 pb-8 max-w-3xl mx-auto">
                {/* Section: Credential Type & Basic Info */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3 pb-3 border-b border-slate-700/50">
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                      <GraduationCap className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">Credential Type & Basic Information</h3>
                      <p className="text-xs text-slate-400">Select credential type and enter student details</p>
                    </div>
                  </div>

                  {/* Credential Type */}
                  <div>
                    <label className="block text-sm font-bold text-slate-300 mb-3 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-purple-400" />
                      Credential Type <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <select
                        value={issueFormData.credentialType}
                        onChange={(e) => setIssueFormData({ ...issueFormData, credentialType: e.target.value })}
                        required
                        className="w-full px-5 py-4 bg-slate-800 border-2 border-slate-700 rounded-xl text-white text-base focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20 hover:border-slate-600 transition-all appearance-none cursor-pointer shadow-lg shadow-black/20"
                      >
                        <option value="StudentID">🎓 Student ID</option>
                        <option value="AcademicCertificate">📜 Academic Certificate</option>
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                        <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Student Name */}
                  <div>
                    <label className="block text-sm font-bold text-slate-300 mb-3 flex items-center gap-2">
                      <User className="w-4 h-4 text-blue-400" />
                      Student Name <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={issueFormData.name}
                      onChange={(e) => setIssueFormData({ ...issueFormData, name: e.target.value })}
                      placeholder="Enter full name"
                      required
                      className="w-full px-5 py-4 bg-slate-800 border-2 border-slate-700 rounded-xl text-white text-base placeholder-slate-500 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 hover:border-slate-600 transition-all shadow-lg shadow-black/20"
                    />
                  </div>
                </div>

                {/* Student ID Fields */}
                {issueFormData.credentialType === "StudentID" && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 pb-3 border-b border-slate-700/50">
                      <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-lg flex items-center justify-center">
                        <Hash className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white">Student ID Details</h3>
                        <p className="text-xs text-slate-400">Academic identification information</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Roll Number */}
                      <div>
                        <label className="block text-sm font-bold text-slate-300 mb-3 flex items-center gap-2">
                          <Hash className="w-4 h-4 text-cyan-400" />
                          Roll Number <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="text"
                          value={issueFormData.rollNumber}
                          onChange={(e) => setIssueFormData({ ...issueFormData, rollNumber: e.target.value })}
                          placeholder="e.g., 2024CS001"
                          required
                          className="w-full px-5 py-4 bg-slate-800 border-2 border-slate-700 rounded-xl text-white text-base placeholder-slate-500 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/20 hover:border-slate-600 transition-all shadow-lg shadow-black/20"
                        />
                      </div>

                      {/* Date of Birth */}
                      <div>
                        <label className="block text-sm font-bold text-slate-300 mb-3 flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-blue-400" />
                          Date of Birth <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="date"
                          value={issueFormData.dob}
                          onChange={(e) => setIssueFormData({ ...issueFormData, dob: e.target.value })}
                          required
                          style={{ colorScheme: "dark" }}
                          className="w-full px-5 py-4 bg-slate-800 border-2 border-slate-700 rounded-xl text-white text-base focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 hover:border-slate-600 transition-all shadow-lg shadow-black/20"
                        />
                      </div>
                    </div>

                    {/* Department */}
                    <div>
                      <label className="block text-sm font-bold text-slate-300 mb-3 flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-purple-400" />
                        Department <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={issueFormData.department}
                        onChange={(e) => setIssueFormData({ ...issueFormData, department: e.target.value })}
                        placeholder="e.g., Computer Science"
                        required
                        className="w-full px-5 py-4 bg-slate-800 border-2 border-slate-700 rounded-xl text-white text-base placeholder-slate-500 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20 hover:border-slate-600 transition-all shadow-lg shadow-black/20"
                      />
                    </div>
                  </div>
                )}

                {/* Academic Certificate Fields */}
                {issueFormData.credentialType === "AcademicCertificate" && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 pb-3 border-b border-slate-700/50">
                      <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg flex items-center justify-center">
                        <Award className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white">Academic Certificate Details</h3>
                        <p className="text-xs text-slate-400">Degree and academic performance information</p>
                      </div>
                    </div>

                    {/* Register Number */}
                    <div>
                      <label className="block text-sm font-bold text-slate-300 mb-3 flex items-center gap-2">
                        <Hash className="w-4 h-4 text-amber-400" />
                        Register Number <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={issueFormData.registerNumber}
                        onChange={(e) => setIssueFormData({ ...issueFormData, registerNumber: e.target.value })}
                        placeholder="e.g., REG2024001"
                        required
                        className="w-full px-5 py-4 bg-slate-800 border-2 border-slate-700 rounded-xl text-white text-base placeholder-slate-500 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/20 hover:border-slate-600 transition-all shadow-lg shadow-black/20"
                      />
                    </div>

                    {/* Degree & Branch */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-bold text-slate-300 mb-3 flex items-center gap-2">
                          <GraduationCap className="w-4 h-4 text-blue-400" />
                          Degree <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="text"
                          value={issueFormData.degree}
                          onChange={(e) => setIssueFormData({ ...issueFormData, degree: e.target.value })}
                          placeholder="e.g., Bachelor of Technology"
                          required
                          className="w-full px-5 py-4 bg-slate-800/80 backdrop-blur-sm border-2 border-slate-600 rounded-xl text-white text-base placeholder-slate-500 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 hover:border-slate-500 transition-all shadow-lg shadow-black/20"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-300 mb-3 flex items-center gap-2">
                          <BookOpen className="w-4 h-4 text-purple-400" />
                          Branch <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="text"
                          value={issueFormData.branch}
                          onChange={(e) => setIssueFormData({ ...issueFormData, branch: e.target.value })}
                          placeholder="e.g., Computer Science"
                          required
                          className="w-full px-5 py-4 bg-slate-800/80 backdrop-blur-sm border-2 border-slate-600 rounded-xl text-white text-base placeholder-slate-500 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20 hover:border-slate-500 transition-all shadow-lg shadow-black/20"
                        />
                      </div>
                    </div>

                    {/* University & Location */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-bold text-slate-300 mb-3 flex items-center gap-2">
                          <BookOpen className="w-4 h-4 text-cyan-400" />
                          University <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="text"
                          value={issueFormData.university}
                          onChange={(e) => setIssueFormData({ ...issueFormData, university: e.target.value })}
                          placeholder="e.g., ABC University"
                          required
                          className="w-full px-5 py-4 bg-slate-800/80 backdrop-blur-sm border-2 border-slate-600 rounded-xl text-white text-base placeholder-slate-500 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/20 hover:border-slate-500 transition-all shadow-lg shadow-black/20"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-300 mb-3 flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-green-400" />
                          Location <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="text"
                          value={issueFormData.location}
                          onChange={(e) => setIssueFormData({ ...issueFormData, location: e.target.value })}
                          placeholder="e.g., City, State"
                          required
                          className="w-full px-5 py-4 bg-slate-800/80 backdrop-blur-sm border-2 border-slate-600 rounded-xl text-white text-base placeholder-slate-500 focus:border-green-500 focus:ring-4 focus:ring-green-500/20 hover:border-slate-500 transition-all shadow-lg shadow-black/20"
                        />
                      </div>
                    </div>

                    {/* CGPA & Class */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-bold text-slate-300 mb-3 flex items-center gap-2">
                          <Award className="w-4 h-4 text-yellow-400" />
                          CGPA <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="text"
                          value={issueFormData.cgpa}
                          onChange={(e) => setIssueFormData({ ...issueFormData, cgpa: e.target.value })}
                          placeholder="e.g., 8.5"
                          required
                          className="w-full px-5 py-4 bg-slate-800/80 backdrop-blur-sm border-2 border-slate-600 rounded-xl text-white text-base placeholder-slate-500 focus:border-yellow-500 focus:ring-4 focus:ring-yellow-500/20 hover:border-slate-500 transition-all shadow-lg shadow-black/20"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-300 mb-3 flex items-center gap-2">
                          <Award className="w-4 h-4 text-orange-400" />
                          Class <span className="text-red-400">*</span>
                        </label>
                        <div className="relative">
                          <select
                            value={issueFormData.class}
                            onChange={(e) => setIssueFormData({ ...issueFormData, class: e.target.value })}
                            required
                            className="w-full px-5 py-4 bg-slate-800 border-2 border-slate-700 rounded-xl text-white text-base focus:border-orange-500 focus:ring-4 focus:ring-orange-500/20 hover:border-slate-600 transition-all appearance-none cursor-pointer shadow-lg shadow-black/20"
                          >
                            <option value="">Select Class</option>
                            <option value="First Class with Distinction">First Class with Distinction</option>
                            <option value="First Class">First Class</option>
                            <option value="Second Class">Second Class</option>
                            <option value="Pass Class">Pass Class</option>
                          </select>
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                            <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Exam Held In & Issue Date */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-bold text-slate-300 mb-3 flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-pink-400" />
                          Exam Held In <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="text"
                          value={issueFormData.examHeldIn}
                          onChange={(e) => setIssueFormData({ ...issueFormData, examHeldIn: e.target.value })}
                          placeholder="e.g., May 2024"
                          required
                          className="w-full px-5 py-4 bg-slate-800 border-2 border-slate-700 rounded-xl text-white text-base placeholder-slate-500 focus:border-pink-500 focus:ring-4 focus:ring-pink-500/20 hover:border-slate-600 transition-all shadow-lg shadow-black/20"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-300 mb-3 flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-rose-400" />
                          Issue Date <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="date"
                          value={issueFormData.issueDate}
                          onChange={(e) => setIssueFormData({ ...issueFormData, issueDate: e.target.value })}
                          required
                          style={{ colorScheme: "dark" }}
                          className="w-full px-5 py-4 bg-slate-800 border-2 border-slate-700 rounded-xl text-white text-base focus:border-rose-500 focus:ring-4 focus:ring-rose-500/20 hover:border-slate-600 transition-all shadow-lg shadow-black/20"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Photo Upload */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3 pb-3 border-b border-slate-700/50">
                    <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-rose-500 rounded-lg flex items-center justify-center">
                      <Image className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">Photo Upload</h3>
                      <p className="text-xs text-slate-400">Student photograph for credential</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-300 mb-3 flex items-center gap-2">
                      <Image className="w-4 h-4 text-pink-400" />
                      Student Photo <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setIssueFormData({ ...issueFormData, photo: e.target.files[0] })}
                        required
                        className="w-full px-5 py-4 bg-slate-800 border-2 border-slate-700 rounded-xl text-white text-base file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-pink-500 file:text-white hover:file:bg-pink-600 file:cursor-pointer focus:border-pink-500 focus:ring-4 focus:ring-pink-500/20 hover:border-slate-600 transition-all shadow-lg shadow-black/20 cursor-pointer"
                      />
                    </div>
                    <p className="text-xs text-slate-400 mt-2 ml-1 flex items-center gap-1.5">
                      <div className="w-1 h-1 bg-slate-500 rounded-full"></div>
                      Upload a clear passport-size photograph (JPG, PNG)
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4 pt-6 border-t border-slate-700/50">
                  <button
                    type="button"
                    onClick={() => setShowIssueModal(false)}
                    className="flex-1 px-6 py-4 bg-slate-700/50 hover:bg-slate-600/50 border-2 border-slate-600 hover:border-slate-500 text-white rounded-xl font-bold transition-all text-base"
                  >
                    Cancel
                  </button>
                  <motion.button
                    type="submit"
                    disabled={processingId === selectedRequest.id}
                    whileHover={{ scale: processingId === selectedRequest.id ? 1 : 1.02 }}
                    whileTap={{ scale: processingId === selectedRequest.id ? 1 : 0.98 }}
                    className="relative flex-1 group overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-600 rounded-xl blur-xl opacity-75 group-hover:opacity-100 transition-opacity"></div>
                    <div className="relative bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-500 hover:from-blue-600 hover:via-cyan-600 hover:to-teal-600 text-white font-bold py-4 px-6 rounded-xl shadow-2xl transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed text-base">
                      {processingId === selectedRequest.id ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Issuing Credential...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-5 h-5" />
                          <span>Issue Credential</span>
                          <CheckCircle className="w-5 h-5" />
                        </>
                      )}
                    </div>
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Loading Overlay when Issuing VC */}
        {issuingVC && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/95 backdrop-blur-md flex items-center justify-center z-[9999]"
          >
            <div className="text-center">
              <motion.div
                animate={{
                  rotate: 360,
                  scale: [1, 1.2, 1]
                }}
                transition={{
                  rotate: { duration: 2, repeat: Infinity, ease: "linear" },
                  scale: { duration: 1, repeat: Infinity, ease: "easeInOut" }
                }}
                className="w-24 h-24 mx-auto mb-6 relative"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-500 rounded-full blur-xl opacity-75"></div>
                <div className="relative w-24 h-24 bg-gradient-to-br from-blue-500 via-cyan-500 to-teal-500 rounded-full flex items-center justify-center">
                  <Send className="w-12 h-12 text-white" />
                </div>
              </motion.div>

              <motion.div
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                <h3 className="text-3xl font-bold text-white mb-3">Issuing Credential...</h3>
                <p className="text-slate-300 text-lg mb-6">Please wait while we create and sign your credential</p>
              </motion.div>

              <div className="flex flex-col gap-3 items-center">
                <motion.div
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}
                  className="flex items-center gap-2 text-blue-400"
                >
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <span className="text-sm">Creating credential structure...</span>
                </motion.div>
                <motion.div
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
                  className="flex items-center gap-2 text-cyan-400"
                >
                  <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
                  <span className="text-sm">Signing with BBS+ signature...</span>
                </motion.div>
                <motion.div
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: 0.6 }}
                  className="flex items-center gap-2 text-teal-400"
                >
                  <div className="w-2 h-2 bg-teal-400 rounded-full"></div>
                  <span className="text-sm">Storing on IPFS...</span>
                </motion.div>
                <motion.div
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: 0.9 }}
                  className="flex items-center gap-2 text-green-400"
                >
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-sm">Finalizing...</span>
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </AnimatedPage>
  );
}
