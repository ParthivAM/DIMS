import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import RoleSelection from "./components/RoleSelection";
import IssuerLogin from "./components/IssuerLogin";
import HolderLogin from "./components/HolderLogin";
import VerifierLogin from "./components/VerifierLogin";
import IssuerDashboard from "./components/IssuerDashboard";
import IssuerViewIssued from "./components/IssuerViewIssued";
import IssuerCredentialView from "./components/IssuerCredentialView";
import IssuerViewRequests from "./components/IssuerViewRequests";
import IssuerProfile from "./components/IssuerProfile";
import HolderDashboard from "./components/HolderDashboard";
import HolderMyVCs from "./components/HolderMyVCs";
import HolderRequestCredential from "./components/HolderRequestCredential";
import HolderMyRequests from "./components/HolderMyRequests";
import HolderProfile from "./components/HolderProfile";
import VerifierDashboard from "./components/VerifierDashboard";
import VerifierDashboardNew from "./components/VerifierDashboardNew";
import VerifierHistory from "./components/VerifierHistory";
import VerifierProfile from "./components/VerifierProfile";
import VCForm from "./components/Form";
import ViewVC from "./components/VCView";
import ViewVCDetail from "./components/ViewVCDetail";
import ViewCredential from "./components/ViewCredential";
import SelectiveDisclosure from "./components/SelectiveDisclosure";
import Navbar from "./components/shared/Navbar";

// Import Wallet UI theme
import "./styles/walletTheme.css";

// Protected Route Component
function ProtectedRoute({ children, allowedRole }) {
  const { isAuthenticated, userRole } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (allowedRole && userRole !== allowedRole) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function AppContent() {
  const location = useLocation();
  const { logout, userAddress } = useAuth();
  const isLoginPage = location.pathname === '/' ||
    location.pathname === '/issuer-login' ||
    location.pathname === '/holder-login' ||
    location.pathname === '/verifier-login';

  return (
    <div className="min-h-screen flex flex-col">
      {/* Show Navbar on all pages except login */}
      {!isLoginPage && <Navbar userAddress={userAddress} onLogout={logout} />}

      {/* Main Content */}
      <main className={`flex-1 ${!isLoginPage ? 'pt-20' : ''}`}>
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            {/* Public Routes */}
            <Route path="/" element={<RoleSelection />} />
            <Route path="/issuer-login" element={<IssuerLogin />} />
            <Route path="/holder-login" element={<HolderLogin />} />
            <Route path="/verifier-login" element={<VerifierLogin />} />

            {/* Issuer Routes */}
            <Route
              path="/issuer-dashboard"
              element={
                <ProtectedRoute allowedRole="issuer">
                  <IssuerDashboard />
                </ProtectedRoute>
              }
            />
            {/* Manual VC issuance disabled - use request flow only */}
            {/* <Route
              path="/vc-form"
              element={
                <ProtectedRoute allowedRole="issuer">
                  <VCForm />
                </ProtectedRoute>
              }
            /> */}
            <Route
              path="/issuer/view-issued"
              element={
                <ProtectedRoute allowedRole="issuer">
                  <IssuerViewIssued />
                </ProtectedRoute>
              }
            />
            <Route
              path="/issuer/credential/:cid"
              element={
                <ProtectedRoute allowedRole="issuer">
                  <IssuerCredentialView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/issuer/requests"
              element={
                <ProtectedRoute allowedRole="issuer">
                  <IssuerViewRequests />
                </ProtectedRoute>
              }
            />
            <Route
              path="/issuer/profile"
              element={
                <ProtectedRoute allowedRole="issuer">
                  <IssuerProfile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/view"
              element={
                <ProtectedRoute allowedRole="issuer">
                  <ViewVC />
                </ProtectedRoute>
              }
            />

            {/* Holder Routes */}
            <Route
              path="/holder-dashboard"
              element={
                <ProtectedRoute allowedRole="holder">
                  <HolderDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/holder"
              element={
                <ProtectedRoute allowedRole="holder">
                  <HolderMyVCs />
                </ProtectedRoute>
              }
            />
            <Route
              path="/view-vc/:cid"
              element={
                <ProtectedRoute allowedRole="holder">
                  <ViewVCDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/view-credential/:cid"
              element={
                <ProtectedRoute allowedRole="holder">
                  <ViewCredential />
                </ProtectedRoute>
              }
            />
            <Route
              path="/disclose/:cid"
              element={
                <ProtectedRoute allowedRole="holder">
                  <SelectiveDisclosure />
                </ProtectedRoute>
              }
            />
            <Route
              path="/holder/request-credential"
              element={
                <ProtectedRoute allowedRole="holder">
                  <HolderRequestCredential />
                </ProtectedRoute>
              }
            />
            <Route
              path="/holder/my-requests"
              element={
                <ProtectedRoute allowedRole="holder">
                  <HolderMyRequests />
                </ProtectedRoute>
              }
            />
            <Route
              path="/holder/profile"
              element={
                <ProtectedRoute allowedRole="holder">
                  <HolderProfile />
                </ProtectedRoute>
              }
            />

            {/* Verifier Routes */}
            <Route
              path="/verifier-dashboard"
              element={
                <ProtectedRoute allowedRole="verifier">
                  <VerifierDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/verifier"
              element={
                <ProtectedRoute allowedRole="verifier">
                  <VerifierDashboardNew />
                </ProtectedRoute>
              }
            />
            <Route
              path="/verifier/history"
              element={
                <ProtectedRoute allowedRole="verifier">
                  <VerifierHistory />
                </ProtectedRoute>
              }
            />
            <Route
              path="/verifier/profile"
              element={
                <ProtectedRoute allowedRole="verifier">
                  <VerifierProfile />
                </ProtectedRoute>
              }
            />
          </Routes>
        </AnimatePresence>
      </main>

    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <AppContent />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
