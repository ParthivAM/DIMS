import React, { useState } from "react";
import "./VCForm.css";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import QRCode from "react-qr-code";

function VCView() {
  const { vcData: vc } = useAuth();
  const [shareUrl, setShareUrl] = useState("");
  const [isSharing, setIsSharing] = useState(false);
  const navigate = useNavigate();

  if (!vc || !vc.vc) 
    return <p style={{ textAlign: "center", marginTop: "50px" }}>No VC to display. Please issue a VC first.</p>;

  const subject = vc.vc.credentialSubject;
  const proof = vc.vc.proof;

  const handleShareVC = () => {
    setIsSharing(true);

    const vcData = {
      vc: vc.vc,
      bbsPublicKey: vc.bbsPublicKey,
      messageCount: vc.messageCount,
      sharedAt: new Date().toISOString()
    };

    const encodedData = btoa(JSON.stringify(vcData));
    const shareUrl = `${window.location.origin}/view-shared?data=${encodedData}`;

    setShareUrl(shareUrl);
    setIsSharing(false);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl).then(() => {
      alert("Share URL copied to clipboard!");
    }).catch(() => {
      alert("Failed to copy URL. Please copy manually.");
    });
  };

  // Helper to shorten the displayed link
  const getShortUrl = (url) => {
    if (url.length <= 50) return url;
    return url.slice(0, 25) + "..." + url.slice(-20);
  };

  return (
    <div className="vcview-container" style={{ position: "relative", minHeight: "100vh", paddingBottom: "100px" }}>
      {/* Existing VC display sections */}
      <h2 style={{ textAlign: "center", marginBottom: "20px", color: "black" }}>
        Verifiable Credential 
      </h2>

      <div style={{ display: "flex", alignItems: "center", marginBottom: "20px" }}>
        {subject.photo && (
          <img
            src={subject.photo}
            alt="User"
            style={{ width: "120px", height: "120px", borderRadius: "50%", marginRight: "20px", objectFit: "cover" }}
          />
        )}
        <div>
          <p style={{ color: "#000", fontWeight: "600", fontSize: "16px", marginBottom: "8px" }}><strong style={{ color: "#000" }}>Name:</strong> {subject.name}</p>
          <p style={{ color: "#000", fontWeight: "600", fontSize: "16px", marginBottom: "8px" }}><strong style={{ color: "#000" }}>Roll Number:</strong> {subject.rollNumber}</p>
          <p style={{ color: "#000", fontWeight: "600", fontSize: "16px", marginBottom: "8px" }}><strong style={{ color: "#000" }}>Date of Birth:</strong> {subject.dateOfBirth}</p>
          <p style={{ color: "#000", fontWeight: "600", fontSize: "16px", marginBottom: "8px" }}><strong style={{ color: "#000" }}>Department:</strong> {subject.department}</p>
        </div>
      </div>

      {/* Proof Section */}
      <div style={{ backgroundColor: "#dbeafe", padding: "15px", borderRadius: "8px", marginBottom: "20px", border: "2px solid #93c5fd" }}>
        <h3 style={{ color: "#1e3a8a", marginBottom: "10px", fontWeight: "bold" }}>Digital Signature Information</h3>
        <p style={{ color: "#000", fontWeight: "600", marginBottom: "6px" }}><strong style={{ color: "#000" }}>Signature Type:</strong> {proof.type}</p>
        <p style={{ color: "#000", fontWeight: "600", marginBottom: "6px" }}><strong style={{ color: "#000" }}>Created:</strong> {new Date(proof.created).toLocaleString()}</p>
        <p style={{ color: "#000", fontWeight: "600", marginBottom: "6px" }}><strong style={{ color: "#000" }}>Proof Purpose:</strong> {proof.proofPurpose}</p>
        <p style={{ color: "#000", fontWeight: "600", marginBottom: "6px" }}><strong style={{ color: "#000" }}>Verification Method:</strong> {proof.verificationMethod}</p>
        <div style={{ marginBottom: "6px" }}>
          <strong style={{ color: "#000", fontWeight: "bold" }}>Challenge:</strong>
          <div style={{ backgroundColor: "#fff", padding: "8px", borderRadius: "4px", fontSize: "12px", wordBreak: "break-all", marginTop: "5px", color: "#000", fontWeight: "600", border: "1px solid #d1d5db" }}>
            {proof.challenge}
          </div>
        </div>
        <div style={{ marginTop: "10px" }}>
          <strong style={{ color: "#000", fontWeight: "bold" }}>Proof Value (Base64):</strong>
          <div style={{ backgroundColor: "#fff", padding: "8px", borderRadius: "4px", fontSize: "12px", wordBreak: "break-all", marginTop: "5px", color: "#000", fontWeight: "600", border: "1px solid #d1d5db" }}>
            {proof.proofValue}
          </div>
        </div>
      </div>

      {/* BBS+ Public Key */}
      <div style={{ backgroundColor: "#dbeafe", padding: "15px", borderRadius: "8px", marginBottom: "20px", border: "2px solid #93c5fd" }}>
        <h3 style={{ color: "#1e3a8a", marginBottom: "10px", fontWeight: "bold" }}>BBS+ Public Key</h3>
        <p style={{ color: "#000", fontWeight: "600", marginBottom: "6px" }}><strong style={{ color: "#000" }}>Key Type:</strong> BLS12-381-G2</p>
        <div style={{ backgroundColor: "#fff", padding: "8px", borderRadius: "4px", fontSize: "12px", wordBreak: "break-all", marginTop: "5px", color: "#000", fontWeight: "600", border: "1px solid #d1d5db" }}>
          {vc.bbsPublicKey}
        </div>
      </div>

      {/* QR Code for Verification */}
      {vc.ipfs && vc.ipfs.vcCID && (
        <div style={{ backgroundColor: "#dbeafe", padding: "15px", borderRadius: "8px", marginBottom: "20px", textAlign: "center", border: "2px solid #93c5fd" }}>
          <h3 style={{ color: "#1e3a8a", marginBottom: "15px", fontWeight: "bold" }}>📱 QR Code for Verification</h3>
          <p style={{ marginBottom: "15px", fontSize: "14px", color: "#000", fontWeight: "600" }}>
            Scan this QR code with the Verifier Portal to verify this credential
          </p>
          <div style={{ display: "inline-block", padding: "20px", backgroundColor: "white", borderRadius: "8px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
            <QRCode 
              value={JSON.stringify({
                cid: vc.ipfs.vcCID,
                publicKey: vc.bbsPublicKey
              })}
              size={200}
              level="H"
            />
          </div>
          <div style={{ marginTop: "15px", fontSize: "12px", color: "#000" }}>
            <p style={{ fontWeight: "bold", color: "#000" }}><strong>IPFS CID:</strong></p>
            <div style={{ backgroundColor: "#fff", padding: "8px", borderRadius: "4px", fontSize: "11px", wordBreak: "break-all", marginTop: "5px", maxWidth: "400px", margin: "5px auto", color: "#000", fontWeight: "600", border: "1px solid #d1d5db" }}>
              {vc.ipfs.vcCID}
            </div>
          </div>
        </div>
      )}

      {/* Selective Disclosure */}
      <div style={{ backgroundColor: "#dbeafe", padding: "15px", borderRadius: "8px", marginBottom: "20px", border: "2px solid #93c5fd" }}>
        <h3 style={{ color: "#1e3a8a", marginBottom: "10px", fontWeight: "bold" }}>Selective Disclosure Details</h3>
        <p style={{ color: "#000", fontWeight: "600", marginBottom: "10px" }}>This VC supports selective disclosure with {vc.messageCount} signed messages:</p>
        <ul style={{ fontSize: "14px", marginTop: "10px", color: "#000", fontWeight: "600" }}>
          <li style={{ marginBottom: "6px" }}>Name: {subject.name}</li>
          <li style={{ marginBottom: "6px" }}>Roll Number: {subject.rollNumber}</li>
          <li style={{ marginBottom: "6px" }}>Date of Birth: {subject.dateOfBirth}</li>
          <li style={{ marginBottom: "6px" }}>Department: {subject.department}</li>
          <li style={{ marginBottom: "6px" }}>Student ID: {subject.id}</li>
          <li style={{ marginBottom: "6px" }}>Issuer: {vc.vc.issuer.id}</li>
          <li style={{ marginBottom: "6px" }}>Issuance Date: {vc.vc.issuanceDate}</li>
        </ul>
      </div>

      
      <div style={{ backgroundColor: "#e5e7eb", padding: "15px", borderRadius: "8px", overflowX: "auto", border: "2px solid #9ca3af" }}>
        <h3 style={{ color: "#000", marginBottom: "10px", fontWeight: "bold" }}> Full VC JSON</h3>
        <pre style={{ fontSize: "12px", color: "#000", fontWeight: "600" }}>{JSON.stringify(vc.vc, null, 2)}</pre>
      </div>

    </div>
  );
}

export default VCView;
