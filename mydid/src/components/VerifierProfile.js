import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Wallet, Key, Shield, User as UserIcon, Copy, CheckCircle } from "lucide-react";
import AnimatedPage from "./shared/AnimatedPage";
import { useAuth } from "../context/AuthContext";

function VerifierProfile() {
    const navigate = useNavigate();
    const { userAddress, did, publicKey, userRole } = useAuth();
    const [copiedField, setCopiedField] = React.useState(null);

    // Ensure only verifier can access
    useEffect(() => {
        const role = localStorage.getItem("userRole");
        if (role !== "verifier" || userRole !== "verifier") {
            navigate("/");
        }
    }, [userRole, navigate]);

    const handleCopy = (text, field) => {
        navigator.clipboard.writeText(text);
        setCopiedField(field);
        setTimeout(() => setCopiedField(null), 2000);
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <AnimatedPage className="min-h-screen py-12 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-12"
                >
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-navy-dark to-navy rounded-3xl shadow-2xl shadow-navy/50 mb-6">
                        <UserIcon className="w-10 h-10 text-gray-900 dark:text-white" />
                    </div>
                    <h1 className="text-5xl font-extrabold mb-4 bg-gradient-to-r from-navy-dark via-navy to-navy-dark dark:text-white dark:bg-none bg-clip-text text-transparent drop-shadow-[0_2px_10px_rgba(53,87,125,0.5)]">
                        Verifier Profile
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400 text-lg">Your identity and credentials information</p>
                </motion.div>

                {/* Profile Cards */}
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="space-y-6"
                >
                    {/* Wallet Address Card */}
                    <motion.div variants={itemVariants} className="glass-card p-6">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-gradient-to-br from-navy-dark to-navy rounded-xl flex items-center justify-center">
                                    <Wallet className="w-6 h-6 text-gray-900 dark:text-white" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Wallet Address</h3>
                                    <p className="text-slate-600 dark:text-slate-400 text-sm">Your Ethereum wallet address</p>
                                </div>
                            </div>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleCopy(userAddress, 'wallet')}
                                className="p-2 bg-navy/10 hover:bg-navy/20 border border-navy/30 rounded-lg transition-all"
                            >
                                {copiedField === 'wallet' ? (
                                    <CheckCircle className="w-5 h-5 text-blue-400" />
                                ) : (
                                    <Copy className="w-5 h-5 text-blue-400" />
                                )}
                            </motion.button>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
                            <code className="text-blue-600 dark:text-blue-300 text-sm font-mono break-all leading-relaxed">
                                {userAddress}
                            </code>
                        </div>
                    </motion.div>

                    {/* DID Card */}
                    <motion.div variants={itemVariants} className="glass-card p-6">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-gradient-to-br from-navy-dark to-navy rounded-xl flex items-center justify-center">
                                    <Shield className="w-6 h-6 text-gray-900 dark:text-white" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Decentralized ID (DID)</h3>
                                    <p className="text-slate-600 dark:text-slate-400 text-sm">Your unique decentralized identifier</p>
                                </div>
                            </div>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleCopy(did, 'did')}
                                className="p-2 bg-navy/10 hover:bg-navy/20 border border-navy/30 rounded-lg transition-all"
                            >
                                {copiedField === 'did' ? (
                                    <CheckCircle className="w-5 h-5 text-blue-400" />
                                ) : (
                                    <Copy className="w-5 h-5 text-blue-400" />
                                )}
                            </motion.button>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
                            <code className="text-blue-600 dark:text-blue-300 text-sm font-mono break-all leading-relaxed">
                                {did}
                            </code>
                        </div>
                    </motion.div>

                    {/* Public Key Card */}
                    <motion.div variants={itemVariants} className="glass-card p-6">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-gradient-to-br from-navy-dark to-navy rounded-xl flex items-center justify-center">
                                    <Key className="w-6 h-6 text-gray-900 dark:text-white" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Public Key</h3>
                                    <p className="text-slate-600 dark:text-slate-400 text-sm">Your cryptographic public key</p>
                                </div>
                            </div>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleCopy(publicKey, 'publicKey')}
                                className="p-2 bg-navy/10 hover:bg-navy/20 border border-navy/30 rounded-lg transition-all"
                            >
                                {copiedField === 'publicKey' ? (
                                    <CheckCircle className="w-5 h-5 text-blue-400" />
                                ) : (
                                    <Copy className="w-5 h-5 text-blue-400" />
                                )}
                            </motion.button>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
                            <code className="text-blue-600 dark:text-blue-300 text-sm font-mono break-all leading-relaxed">
                                {publicKey}
                            </code>
                        </div>
                    </motion.div>

                    {/* Info Note */}
                    <motion.div
                        variants={itemVariants}
                        className="bg-navy/10 border border-navy/30 rounded-xl p-4"
                    >
                        <div className="flex items-start gap-3">
                            <Shield className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="text-blue-300 text-sm font-semibold mb-1">Security Information</p>
                                <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed">
                                    Your DID and public key are used to verify credentials. Keep your private key secure and never share it with anyone.
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            </div>
        </AnimatedPage>
    );
}

export default VerifierProfile;
