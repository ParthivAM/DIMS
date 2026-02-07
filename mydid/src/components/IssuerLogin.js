import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ethers } from "ethers";
import axios from "axios";
import { motion } from "framer-motion";
import { Wallet, Building2, Lock, Zap, CheckCircle, ArrowLeft } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import AnimatedPage from './shared/AnimatedPage';

function IssuerLogin() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [isConnecting, setIsConnecting] = useState(false);

  // Auto-login check
  useEffect(() => {
    const checkAlreadyConnected = async () => {
      const savedRole = localStorage.getItem("userRole");
      if (savedRole === "issuer" && window.ethereum) {
        try {
          const provider = new ethers.BrowserProvider(window.ethereum);
          const accounts = await provider.send("eth_accounts", []);
          if (accounts.length > 0) {
            const signer = await provider.getSigner();
            const address = await signer.getAddress();
            const publicKey = address;
            const did = `did:ethr:${address}`;

            const message = "Login to DID App as Issuer";
            const signature = await signer.signMessage(message);

            const response = await axios.post("http://localhost:5000/login", {
              address,
              message,
              signature,
            });

            if (response.data.success) {
              login(address, did, publicKey, "issuer");
              navigate("/issuer-dashboard");
            }
          }
        } catch (err) {
          console.error("Auto-login check failed:", err);
        }
      }
    };

    checkAlreadyConnected();
  }, [login, navigate]);

  const handleLogin = async (provider) => {
    const signer = await provider.getSigner();
    const address = await signer.getAddress();
    const publicKey = address;
    const did = `did:ethr:${address}`;

    const message = "Login to DID App as Issuer";
    const signature = await signer.signMessage(message);

    const response = await axios.post("http://localhost:5000/login", {
      address,
      message,
      signature,
    });

    if (response.data.success) {
      login(address, did, publicKey, "issuer");
      navigate("/issuer-dashboard");
    }
  };

  const connectWallet = async () => {
    if (!window.ethereum) {
      alert("MetaMask not detected! Please install MetaMask.");
      window.location.href = "https://metamask.io/download.html";
      return;
    }

    try {
      setIsConnecting(true);
      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      await handleLogin(provider);
    } catch (error) {
      console.error("Login error:", error);
      alert("Login error: " + (error.response?.data?.message || error.message));
      setIsConnecting(false);
    }
  };

  return (
    <AnimatedPage>
      <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
        {/* Decorative background orbs */}
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-20 left-20 w-72 h-72 bg-navy/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-20 right-20 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl"
        />

        {/* Login Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative z-10 w-full max-w-md"
        >
          {/* Back Button */}
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            whileHover={{ x: -5 }}
            onClick={() => navigate("/")}
            className="mb-6 flex items-center space-x-2 text-slate-600 hover:text-navy dark:text-slate-400 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Portal Selection</span>
          </motion.button>

          <div className="glass-card text-center">
            {/* Logo */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-navy-dark to-navy rounded-2xl shadow-2xl shadow-navy/50 mb-6"
            >
              <Building2 className="w-10 h-10 text-white" />
            </motion.div>

            {/* Title */}
            <motion.h1
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-4xl font-bold mb-3 bg-gradient-to-r from-navy-dark to-navy dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent"
            >
              Issuer Portal
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-slate-600 dark:text-slate-400 mb-8"
            >
              Issue and manage verifiable credentials
            </motion.p>

            {/* Features */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="grid grid-cols-3 gap-4 mb-8"
            >
              {[
                { icon: Lock, label: "Secure" },
                { icon: Building2, label: "Trusted" },
                { icon: Zap, label: "Fast" }
              ].map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <motion.div
                    key={feature.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 + index * 0.1 }}
                    className="flex flex-col items-center space-y-2 p-3 bg-navy/5 dark:bg-navy/20 rounded-xl border border-navy/10 dark:border-navy/50"
                  >
                    <Icon className="w-5 h-5 text-navy dark:text-blue-300" />
                    <span className="text-xs text-slate-600 dark:text-slate-300">{feature.label}</span>
                  </motion.div>
                );
              })}
            </motion.div>

            {/* Connect Button */}
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.7 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={connectWallet}
              disabled={isConnecting}
              className="w-full bg-gradient-to-r from-navy-dark to-navy hover:from-navy-darker hover:to-navy-medium text-white font-bold py-4 px-6 rounded-xl shadow-lg shadow-navy/50 transition-all duration-300 flex items-center justify-center space-x-3 text-lg relative overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isConnecting ? (
                <>
                  <div className="spinner" />
                  <span>Connecting...</span>
                </>
              ) : (
                <>
                  <Wallet className="w-6 h-6" />
                  <span>Connect MetaMask</span>
                </>
              )}
            </motion.button>

            {/* Info Text */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="mt-6 text-sm text-slate-500"
            >
              Don't have MetaMask?{' '}
              <a
                href="https://metamask.io/download.html"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-300 hover:text-blue-700 dark:hover:text-blue-200 transition-colors underline"
              >
                Install it here
              </a>
            </motion.p>
          </div>

          {/* Trust Indicators */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
            className="mt-6 flex items-center justify-center space-x-6 text-sm text-slate-400"
          >
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span>Blockchain Secured</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span>BBS+ Signatures</span>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </AnimatedPage>
  );
}

export default IssuerLogin;