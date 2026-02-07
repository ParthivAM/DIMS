import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { Clock, FileText, XCircle, CheckCircle } from "lucide-react";
import AnimatedPage from "./shared/AnimatedPage";

export default function HolderMyRequests() {
    const { userAddress } = useAuth();
    const navigate = useNavigate();
    const [myRequests, setMyRequests] = useState([]);
    const [loadingRequests, setLoadingRequests] = useState(true);

    useEffect(() => {
        fetchMyRequests();
    }, [userAddress]);

    const fetchMyRequests = async () => {
        try {
            setLoadingRequests(true);
            const response = await axios.get(`http://localhost:5000/holder/myRequests/${userAddress}`);
            if (response.data.success) {
                setMyRequests(response.data.requests);
            }
        } catch (err) {
            console.error("Error fetching requests:", err);
        } finally {
            setLoadingRequests(false);
        }
    };

    const handleDeleteRequest = async (requestId) => {
        if (!window.confirm("Are you sure you want to delete this request?")) {
            return;
        }

        try {
            console.log("🗑️ Deleting request:", requestId);

            const response = await axios.delete(`http://localhost:5000/holder/request/${requestId}`, {
                data: { holderAddress: userAddress }
            });

            if (response.data.success) {
                console.log("✅ Request deleted successfully");
                setMyRequests(prevRequests => prevRequests.filter(req => (req.requestId || req.id) !== requestId));
                alert("✅ Request deleted successfully");
            }
        } catch (err) {
            console.error("❌ Error deleting request:", err);
            alert("Failed to delete request: " + (err.response?.data?.message || err.message));
        }
    };

    const getStatusBadge = (status) => {
        switch (status?.toLowerCase()) {
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

    return (
        <AnimatedPage className="min-h-screen py-8 px-4">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <h1 className="text-4xl font-extrabold mb-2 pb-2 bg-gradient-to-r from-navy-dark via-navy to-navy-dark dark:text-white dark:bg-none bg-clip-text text-transparent drop-shadow-sm dark:drop-shadow-[0_2px_10px_rgba(53,87,125,0.5)]">My Requests</h1>
                    <p className="text-slate-600 dark:text-slate-400">Track your credential requests and their status</p>
                </motion.div>

                {/* Back Button */}
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="mb-6"
                >
                    <button
                        onClick={() => navigate("/holder/request-credential")}
                        className="px-6 py-3 bg-navy hover:bg-navy-medium text-white rounded-xl shadow-lg transition-all duration-300 flex items-center gap-2 font-semibold"
                    >
                        ← Back to Request Credential
                    </button>
                </motion.div>

                {/* Requests List */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="glass-card p-6"
                >
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center justify-between">
                        <span className="flex items-center space-x-2">
                            <Clock className="w-6 h-6 text-blue-400" />
                            <span>All Requests</span>
                        </span>
                        <span className="text-sm font-normal text-slate-400">
                            {myRequests.length} total
                        </span>
                    </h2>

                    {loadingRequests ? (
                        <div className="text-center py-8">
                            <div className="w-12 h-12 border-4 border-navy border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                            <p className="text-slate-400">Loading requests...</p>
                        </div>
                    ) : myRequests.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <FileText className="w-8 h-8 text-slate-600" />
                            </div>
                            <p className="text-slate-400">No requests yet</p>
                            <p className="text-slate-500 text-sm mt-1">Submit your first credential request</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {myRequests.map((request, index) => (
                                <motion.div
                                    key={request.requestId || request.id || index}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="bg-white dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700 rounded-xl p-4 hover:border-navy/30 transition-all shadow-sm dark:shadow-none"
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div>
                                            <h3 className="text-gray-900 dark:text-white font-semibold">{request.credentialType}</h3>
                                            <p className="text-xs text-slate-500 mt-1">{formatDate(request.requestedAt)}</p>
                                        </div>
                                        {getStatusBadge(request.status)}
                                    </div>

                                    <p className="text-slate-600 dark:text-slate-300 text-sm mb-3">{request.message}</p>

                                    {request.verificationID && (
                                        <div className="mb-3">
                                            <p className="text-xs text-slate-500 mb-1">
                                                {request.credentialType === "Student ID" ? "Admission Number:" : "Education Govt ID:"}
                                            </p>
                                            <div className="bg-navy/10 border border-navy/30 rounded-lg px-3 py-2">
                                                <code className="text-blue-400 text-sm font-mono font-semibold">
                                                    {request.verificationID}
                                                </code>
                                            </div>
                                        </div>
                                    )}

                                    {request.status === "approved" && request.issuedVCCID && (
                                        <div className="mt-3 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                                            <p className="text-green-400 text-xs font-semibold mb-1">✅ Credential Issued</p>
                                            <code className="text-green-300 text-xs break-all">
                                                CID: {request.issuedVCCID}
                                            </code>
                                        </div>
                                    )}

                                    {request.status === "rejected" && request.rejectionReason && (
                                        <div className="mt-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                                            <p className="text-red-400 text-xs font-semibold mb-1">❌ Rejected</p>
                                            <p className="text-red-300 text-xs">{request.rejectionReason}</p>
                                        </div>
                                    )}

                                    {/* Delete Button */}
                                    <div className="mt-3 pt-3 border-t border-slate-700">
                                        <button
                                            onClick={() => handleDeleteRequest(request.requestId || request.id)}
                                            className="w-full px-3 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 hover:border-red-500/50 text-red-400 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 text-sm"
                                        >
                                            <XCircle className="w-4 h-4" />
                                            Delete Request
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </motion.div>
            </div>
        </AnimatedPage>
    );
}
