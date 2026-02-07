import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import axios from "axios";
import { motion } from "framer-motion";
import { Wallet, Shield, Lock, Zap, CheckCircle } from "lucide-react";

function Login({ onLogin }) {
  const [isConnecting, setIsConnecting] = useState(false);
  // 🔹 Auto-login on page load
  useEffect(() => {
    const checkAlreadyConnected = async () => {
      if (window.ethereum) {
        try {
          const provider = new ethers.BrowserProvider(window.ethereum);
          const accounts = await provider.send("eth_accounts", []);
          if (accounts.length > 0) {
            // define handleLogin here
            const signer = await provider.getSigner();
            const address = await signer.getAddress();
            const publicKey = address;
            const did = `did:ethr:${address}`;

            localStorage.setItem("userAddress", address);
            localStorage.setItem("did", did);
            localStorage.setItem("publicKey", publicKey);

            const message = "Login to DID App";
            const signature = await signer.signMessage(message);

            const response = await axios.post("http://localhost:5000/login", {
              address,
              message,
              signature,
            });

            if (response.data.success) {
              onLogin(address, did, publicKey);
            }
          }
        } catch (err) {
          console.error("Auto-login check failed:", err);
        }
      }
    };

    checkAlreadyConnected();
  }, [onLogin]); // only onLogin as dependency


  // 🔹 Common login flow
  const handleLogin = async (provider) => {
    const signer = await provider.getSigner();
    const address = await signer.getAddress();

    const publicKey = address;
    const did = `did:ethr:${address}`;

    // Save to localStorage
    localStorage.setItem("userAddress", address);
    localStorage.setItem("did", did);
    localStorage.setItem("publicKey", publicKey);

    const message = "Login to DID App";
    const signature = await signer.signMessage(message);

    const response = await axios.post("http://localhost:5000/login", {
      address,
      message,
      signature,
    });

    if (response.data.success) {
      console.log("✅ Auto-login / manual login successful");
      onLogin(address, did, publicKey);
    }
  };

  // 🔹 Triggered when user clicks "Connect"
  const connectWallet = async () => {
    if (!window.ethereum) {
      alert("MetaMask not detected! Please install MetaMask.");
      window.location.href = "https://metamask.io/download.html";
      return;
    }

    try {
      setIsConnecting(true);
      const provider = new ethers.BrowserProvider(window.ethereum);

      // Force MetaMask popup if not connected
      await provider.send("eth_requestAccounts", []);

      // Run login flow
      await handleLogin(provider);
    } catch (error) {
      console.error("Login error:", error);
      alert("Login error: " + (error.response?.data?.message || error.message));
      setIsConnecting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-indigo-900/20 to-slate-900" />
      <div className="absolute inset-0 bg-gradient-radial opacity-50" />

      {/* Floating Orbs */}
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
        className="absolute top-20 left-20 w-72 h-72 bg-indigo-500/20 rounded-full blur-3xl"
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
        className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"
      />

      {/* Login Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="glass-card text-center">
          {/* Logo */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-2xl shadow-indigo-500/50 mb-6"
          >
            <Shield className="w-10 h-10 text-white" />
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-4xl font-bold mb-3 gradient-text"
          >
            DID Vault
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-slate-400 mb-8"
          >
            Decentralized Digital Identity Management
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
              { icon: Shield, label: "Private" },
              { icon: Zap, label: "Fast" }
            ].map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 + index * 0.1 }}
                  className="flex flex-col items-center space-y-2 p-3 bg-slate-800/30 rounded-xl border border-slate-700/50"
                >
                  <Icon className="w-5 h-5 text-indigo-400" />
                  <span className="text-xs text-slate-300">{feature.label}</span>
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
            className="w-full btn-primary flex items-center justify-center space-x-3 py-4 text-lg relative overflow-hidden group"
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

            {/* Shine effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
              initial={{ x: '-100%' }}
              whileHover={{ x: '100%' }}
              transition={{ duration: 0.5 }}
            />
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
              className="text-indigo-400 hover:text-indigo-300 transition-colors underline"
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
  );
}

export default Login;
