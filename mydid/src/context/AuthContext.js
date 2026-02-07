import React, { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [userAddress, setUserAddress] = useState(null);
  const [did, setDid] = useState(null);
  const [publicKey, setPublicKey] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [vcData, setVcData] = useState(null);

  // Restore session from localStorage on mount
  useEffect(() => {
    const savedAddress = localStorage.getItem("userAddress");
    const savedDid = localStorage.getItem("did");
    const savedPublicKey = localStorage.getItem("publicKey");
    const savedRole = localStorage.getItem("userRole");

    if (savedAddress && savedDid && savedPublicKey && savedRole) {
      setUserAddress(savedAddress);
      setDid(savedDid);
      setPublicKey(savedPublicKey);
      setUserRole(savedRole);
    }
  }, []);

  const login = (address, didValue, pubKey, role) => {
    setUserAddress(address);
    setDid(didValue);
    setPublicKey(pubKey);
    setUserRole(role);

    // Store in localStorage
    localStorage.setItem("userAddress", address);
    localStorage.setItem("did", didValue);
    localStorage.setItem("publicKey", pubKey);
    localStorage.setItem("userRole", role);
  };

  const logout = () => {
    setUserAddress(null);
    setDid(null);
    setPublicKey(null);
    setUserRole(null);
    setVcData(null);

    // Clear localStorage
    localStorage.removeItem("userAddress");
    localStorage.removeItem("did");
    localStorage.removeItem("publicKey");
    localStorage.removeItem("userRole");
  };

  const value = {
    userAddress,
    did,
    publicKey,
    userRole,
    vcData,
    setVcData,
    login,
    logout,
    isAuthenticated: !!userAddress && !!userRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
