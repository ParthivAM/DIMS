import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield, FileText, Building2 } from "lucide-react";
import AnimatedPage from "./shared/AnimatedPage";
import { useAuth } from "../context/AuthContext";

function IssuerDashboard() {
  const navigate = useNavigate();
  const { userRole } = useAuth();

  // Ensure only issuer can access
  useEffect(() => {
    const role = localStorage.getItem("userRole");
    if (role !== "issuer" || userRole !== "issuer") {
      navigate("/");
    }
  }, [userRole, navigate]);

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
        {/* Back to Home Button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-6 flex justify-end"
        >
          <button
            onClick={() => {
              if (window.confirm("Return to portal selection? You will be logged out.")) {
                localStorage.clear();
                navigate("/");
              }
            }}
            className="px-6 py-3 bg-navy hover:bg-navy-medium text-white rounded-xl shadow-lg transition-all duration-300 flex items-center gap-2 font-semibold"
          >
            ← Back to Home
          </button>
        </motion.div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-navy-dark to-navy rounded-2xl shadow-lg shadow-navy/50 mb-4">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-5xl font-extrabold mb-4 bg-gradient-to-r from-navy-dark via-navy to-navy-dark dark:text-white dark:bg-none bg-clip-text text-transparent drop-shadow-sm dark:drop-shadow-[0_2px_10px_rgba(53,87,125,0.5)]">
            Issuer Dashboard
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-lg">Issue and manage verifiable credentials</p>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          <motion.button
            variants={itemVariants}
            whileHover={{ scale: 1.05, y: -5 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate("/issuer/requests")}
            className="glass-card p-8 text-center hover:bg-gradient-to-br hover:from-navy/10 hover:to-navy-light/10 hover:border-navy/30 transition-all duration-300 group"
          >
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-navy-dark to-navy rounded-2xl flex items-center justify-center shadow-lg shadow-navy/30 group-hover:shadow-navy/50 transition-all">
              <FileText className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Handle Credential Requests</h3>
            <p className="text-slate-600 dark:text-slate-400 text-sm">Review and approve credential requests from holders</p>
          </motion.button>

          <motion.button
            variants={itemVariants}
            whileHover={{ scale: 1.05, y: -5 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate("/issuer/view-issued")}
            className="glass-card p-8 text-center hover:bg-gradient-to-br hover:from-navy/10 hover:to-navy-light/10 hover:border-navy/30 transition-all duration-300 group"
          >
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-navy-dark to-navy rounded-2xl flex items-center justify-center shadow-lg shadow-navy/30 group-hover:shadow-navy/50 transition-all">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">View Issued Credentials</h3>
            <p className="text-slate-600 dark:text-slate-400 text-sm">Manage and track all issued verifiable credentials</p>
          </motion.button>
        </motion.div>
      </div>
    </AnimatedPage>
  );
}

export default IssuerDashboard;
