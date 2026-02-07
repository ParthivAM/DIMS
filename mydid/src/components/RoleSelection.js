import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Building2, User, Search, ArrowRight, Shield, Sun, Moon } from "lucide-react";
import AnimatedPage from "./shared/AnimatedPage";
import { useTheme } from "../context/ThemeContext";

function RoleSelection() {
  const navigate = useNavigate();
  const { isDarkMode, toggleTheme } = useTheme();

  const roles = [
    {
      id: "issuer",
      title: "Issuer Portal",
      icon: Building2,
      description: "Issue and manage verifiable credentials",
      color: "from-navy-dark to-navy",
      hoverColor: "hover:from-navy-darker hover:to-navy-medium",
      bgGlow: "bg-navy/20",
      route: "/issuer-login",
      features: ["Create VCs", "Manage Credentials", "BBS+ Signatures"]
    },
    {
      id: "holder",
      title: "Holder Portal",
      icon: User,
      description: "Store and share your credentials securely",
      color: "from-navy-dark to-navy",
      hoverColor: "hover:from-navy-darker hover:to-navy-medium",
      bgGlow: "bg-navy/20",
      route: "/holder-login",
      features: ["View VCs", "Selective Disclosure", "Share Proofs"]
    },
    {
      id: "verifier",
      title: "Verifier Portal",
      icon: Search,
      description: "Verify credential authenticity",
      color: "from-navy-dark to-navy",
      hoverColor: "hover:from-navy-darker hover:to-navy-medium",
      bgGlow: "bg-navy/20",
      route: "/verifier-login",
      features: ["Scan QR Codes", "Verify Signatures", "Check Blockchain"]
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15
      }
    }
  };

  return (
    <AnimatedPage className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden w-full">
      {/* Theme Toggle */}
      <motion.button
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={toggleTheme}
        className="absolute top-6 right-6 p-3 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white shadow-lg hover:bg-white/20 transition-all z-50"
      >
        {isDarkMode ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
      </motion.button>

      {/* Animated Background Orbs */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute top-20 left-20 w-72 h-72 bg-navy/20 rounded-full blur-3xl"
      />
      <motion.div
        animate={{
          scale: [1.2, 1, 1.2],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute bottom-20 right-20 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"
      />

      <div className="relative z-10 w-full max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-navy-dark to-navy rounded-2xl shadow-2xl shadow-navy/50 mb-6"
          >
            <Shield className="w-10 h-10 text-white" />
          </motion.div>

          <h1 className="text-5xl md:text-6xl font-extrabold mb-4 bg-gradient-to-r from-navy-dark via-navy to-navy-dark dark:from-blue-400 dark:via-indigo-400 dark:to-blue-400 bg-clip-text text-transparent drop-shadow-[0_2px_10px_rgba(53,87,125,0.5)]">
            DID Vault
          </h1>
          <p className="text-slate-400 text-xl mb-2">Decentralized Digital Identity Management</p>
          <p className="text-slate-500 text-lg">Choose your portal to continue</p>
        </motion.div>

        {/* Role Cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          {roles.map((role) => {
            const Icon = role.icon;
            return (
              <motion.div
                key={role.id}
                variants={cardVariants}
                whileHover={{ y: -10, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate(role.route)}
                className="cursor-pointer group"
              >
                <div className="relative h-full glass-card p-8 overflow-hidden transition-all duration-300 hover:shadow-2xl hover:border-navy/30">
                  {/* Glow Effect */}
                  <div className={`absolute inset-0 ${role.bgGlow} opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-2xl`} />

                  {/* Content */}
                  <div className="relative z-10">
                    {/* Icon */}
                    <div className={`w-16 h-16 mb-6 bg-gradient-to-br ${role.color} rounded-xl flex items-center justify-center shadow-lg transition-all duration-300 group-hover:shadow-2xl group-hover:scale-110`}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>

                    {/* Title */}
                    <h2 className={`text-2xl font-bold mb-3 flex items-center justify-between ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                      {role.title}
                      <ArrowRight className={`w-5 h-5 transition-all duration-300 ${isDarkMode ? 'text-slate-400 group-hover:text-white' : 'text-slate-500 group-hover:text-navy'}`} />
                    </h2>

                    {/* Description */}
                    <p className="text-slate-400 mb-6 text-sm leading-relaxed">
                      {role.description}
                    </p>

                    {/* Features */}
                    <div className="space-y-2">
                      {role.features.map((feature, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.5 + index * 0.1 }}
                          className="flex items-center space-x-2 text-slate-400 text-sm"
                        >
                          <div className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${role.color}`} />
                          <span>{feature}</span>
                        </motion.div>
                      ))}
                    </div>

                    {/* Button */}
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`w-full mt-6 py-3 px-6 bg-gradient-to-r ${role.color} ${role.hoverColor} text-white font-semibold rounded-xl shadow-lg transition-all duration-300 flex items-center justify-center space-x-2`}
                    >
                      <span>Enter Portal</span>
                      <ArrowRight className="w-4 h-4" />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Footer Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-12 text-center text-slate-500 text-sm"
        >
          <p>Powered by Ethereum • IPFS • BBS+ Signatures</p>
        </motion.div>
      </div>
    </AnimatedPage>
  );
}

export default RoleSelection;
