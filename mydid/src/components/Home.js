import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Wallet, Key, Shield, FileText, User, CheckCircle } from "lucide-react";
import AnimatedPage from "./shared/AnimatedPage";
import { InfoCard } from "./shared/GlassCard";

function Home({ userAddress, did, publicKey }) {
  const navigate = useNavigate();

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
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl font-extrabold mb-4 bg-gradient-to-r from-indigo-400 via-blue-400 to-purple-400 bg-clip-text text-transparent drop-shadow-[0_2px_10px_rgba(99,102,241,0.5)]">
            Welcome to DID Wallet
          </h1>
          <p className="text-slate-400 text-lg">Your Digital Identity Information</p>
        </motion.div>

        {/* Info Cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12"
        >
          <motion.div variants={itemVariants}>
            <InfoCard
              icon={Wallet}
              title="Wallet Address"
              value={userAddress}
              className="h-full"
            />
          </motion.div>

          <motion.div variants={itemVariants}>
            <InfoCard
              icon={Shield}
              title="Decentralized ID (DID)"
              value={did}
              className="h-full"
            />
          </motion.div>

          <motion.div variants={itemVariants}>
            <InfoCard
              icon={Key}
              title="Public Key"
              value={publicKey}
              className="h-full"
            />
          </motion.div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          <motion.button
            variants={itemVariants}
            whileHover={{ scale: 1.05, y: -5 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate("/vc-form")}
            className="glass-card p-8 text-center hover:bg-gradient-to-br hover:from-emerald-500/10 hover:to-teal-500/10 hover:border-emerald-500/30 transition-all duration-300 group"
          >
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/30 group-hover:shadow-emerald-500/50 transition-all">
              <FileText className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Generate Credential</h3>
            <p className="text-slate-400 text-sm">Create a new verifiable credential</p>
          </motion.button>

          <motion.button
            variants={itemVariants}
            whileHover={{ scale: 1.05, y: -5 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate("/holder")}
            className="glass-card p-8 text-center hover:bg-gradient-to-br hover:from-blue-500/10 hover:to-purple-500/10 hover:border-blue-500/30 transition-all duration-300 group"
          >
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:shadow-blue-500/50 transition-all">
              <User className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">My Credentials</h3>
            <p className="text-slate-400 text-sm">View and manage your VCs</p>
          </motion.button>

          <motion.button
            variants={itemVariants}
            whileHover={{ scale: 1.05, y: -5 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate("/verifier")}
            className="glass-card p-8 text-center hover:bg-gradient-to-br hover:from-indigo-500/10 hover:to-purple-500/10 hover:border-indigo-500/30 transition-all duration-300 group"
          >
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30 group-hover:shadow-indigo-500/50 transition-all">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Verify Credentials</h3>
            <p className="text-slate-400 text-sm">Check credential authenticity</p>
          </motion.button>
        </motion.div>
      </div>
    </AnimatedPage>
  );
}

export default Home;
