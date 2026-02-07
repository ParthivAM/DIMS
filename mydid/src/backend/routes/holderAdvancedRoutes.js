// routes/holderAdvancedRoutes.js - Advanced holder routes for fetching and selective disclosure
const express = require("express");
const QRCode = require("qrcode");
const { retrieveJSONFromIPFS, uploadJSONToPinata } = require("../utils/ipfs");

module.exports = (loggedInUsers, bbsLib) => {
  const router = express.Router();

  /**
   * GET /fetchVC/:cid - Fetch VC from IPFS by CID
   * Allows holder to retrieve any VC using its IPFS CID
   */
  router.get("/fetchVC/:cid", async (req, res) => {
    try {
      const { cid } = req.params;

      console.log(`\n📥 Fetching VC from IPFS: ${cid}`);

      // Retrieve VC from IPFS
      const vcData = await retrieveJSONFromIPFS(cid);

      if (!vcData) {
        return res.status(404).json({
          success: false,
          message: "VC not found on IPFS"
        });
      }

      console.log("✅ VC fetched successfully");
      console.log(`   Type: ${vcData.type ? vcData.type.join(', ') : 'Unknown'}`);
      console.log(`   Issuer: ${vcData.issuer?.id || 'Unknown'}`);

      res.json({
        success: true,
        vc: vcData,
        cid: cid
      });

    } catch (err) {
      console.error("❌ Error fetching VC:", err);
      res.status(500).json({
        success: false,
        message: err.message || "Unable to fetch VC from IPFS"
      });
    }
  });

  /**
   * POST /generateProof - Generate selective disclosure proof
   * Uses BBS+ signatures to create a proof with only selected fields
   */
  router.post("/generateProof", async (req, res) => {
    try {
      const { vc, selectedFields, publicKey } = req.body;

      console.log("\n🔐 Generating selective disclosure proof...");
      console.log(`   Selected fields: ${selectedFields.join(', ')}`);

      if (!vc || !selectedFields || selectedFields.length === 0) {
        return res.status(400).json({
          success: false,
          message: "VC and selectedFields are required"
        });
      }

      if (!bbsLib) {
        throw new Error("BBS+ library not initialized");
      }

      // Extract the original signature from VC
      const originalSignature = vc.proof?.proofValue;
      if (!originalSignature) {
        throw new Error("VC does not contain a valid BBS+ signature");
      }

      // Convert signature from base64 to Uint8Array
      const signatureBytes = new Uint8Array(Buffer.from(originalSignature, 'base64'));

      // Get public key
      let publicKeyBytes;
      if (publicKey) {
        publicKeyBytes = new Uint8Array(Buffer.from(publicKey, 'base64'));
      } else {
        throw new Error("Public key is required for proof generation");
      }

      // Prepare messages in the same order as signing
      const credentialSubject = vc.credentialSubject || {};
      const vcType = vc.type?.includes("AcademicCertificate") ? "AcademicCertificate" : "StudentID";
      
      console.log(`   Credential type: ${vcType}`);
      
      let allMessages;
      let fieldMapping;
      
      if (vcType === "AcademicCertificate") {
        // Academic Certificate message order (must match vcRoutes.js lines 201-216)
        allMessages = [
          credentialSubject.name || "",
          credentialSubject.registerNumber || "",
          credentialSubject.degree || "",
          credentialSubject.branch || "",
          credentialSubject.university || "",
          credentialSubject.location || "",
          credentialSubject.cgpa || "",
          credentialSubject.class || "",
          credentialSubject.examHeldIn || "",
          credentialSubject.issuedDate || "",
          credentialSubject.id || "",
          vc.issuer || "",
          vc.issuanceDate || "",
          credentialSubject.documentHash || ""
        ];
        
        fieldMapping = {
          'name': 0,
          'registerNumber': 1,
          'degree': 2,
          'branch': 3,
          'university': 4,
          'location': 5,
          'cgpa': 6,
          'class': 7,
          'examHeldIn': 8,
          'issuedDate': 9,
          'id': 10,
          'issuer': 11,
          'issuanceDate': 12,
          'documentHash': 13
        };
      } else {
        // Student ID message order (must match vcRoutes.js lines 218-227)
        allMessages = [
          credentialSubject.name || "",
          credentialSubject.rollNumber || "",
          credentialSubject.dateOfBirth || "",
          credentialSubject.department || "",
          credentialSubject.id || "",
          vc.issuer?.id || "",
          vc.issuanceDate || "",
          credentialSubject.documentHash || ""
        ];
        
        fieldMapping = {
          'name': 0,
          'rollNumber': 1,
          'dateOfBirth': 2,
          'department': 3,
          'id': 4,
          'issuer': 5,
          'issuanceDate': 6,
          'documentHash': 7
        };
      }

      console.log(`   Total messages: ${allMessages.length}`);
      
      // Convert messages to Uint8Array
      const encoder = new TextEncoder();
      const messageBytes = allMessages.map(m => encoder.encode(String(m)));

      const disclosedIndices = selectedFields
        .map(field => fieldMapping[field])
        .filter(idx => idx !== undefined);

      console.log(`   Disclosing indices: [${disclosedIndices.join(', ')}]`);

      // Generate derived proof with correct ciphersuite
      const derivedProof = await bbsLib.deriveProof({
        signature: signatureBytes,
        publicKey: publicKeyBytes,
        messages: messageBytes,
        disclosedMessageIndexes: disclosedIndices,
        header: new Uint8Array(),
        presentationHeader: new Uint8Array(),
        ciphersuite: bbsLib.CIPHERSUITES.BLS12381_SHA256
      });

      console.log("✅ Derived proof generated");
      console.log(`   Proof size: ${derivedProof.length} bytes`);

      // Create presentation document with only disclosed fields
      const disclosedCredentialSubject = {};
      selectedFields.forEach(field => {
        if (credentialSubject[field] !== undefined) {
          disclosedCredentialSubject[field] = credentialSubject[field];
        }
      });
      
      // Always include documentHash for blockchain verification (not disclosed to user)
      if (credentialSubject.documentHash) {
        disclosedCredentialSubject.documentHash = credentialSubject.documentHash;
      }

      const presentation = {
        "@context": vc["@context"],
        type: ["VerifiablePresentation", "SelectiveDisclosurePresentation"],
        verifiableCredential: {
          ...vc,
          credentialSubject: disclosedCredentialSubject,
          proof: {
            type: "BbsBlsSignatureProof2020",
            created: new Date().toISOString(),
            proofPurpose: "assertionMethod",
            verificationMethod: vc.proof.verificationMethod,
            proofValue: Buffer.from(derivedProof).toString('base64'),
            disclosedFields: selectedFields,
            originalCID: req.body.originalCID || null
          }
        },
        proof: {
          type: "BbsBlsSignatureProof2020",
          created: new Date().toISOString(),
          proofPurpose: "authentication",
          challenge: Math.random().toString(36).substring(7),
          disclosedFields: selectedFields
        }
      };

      // Upload presentation to IPFS
      console.log("📤 Uploading presentation to IPFS...");
      const proofUpload = await uploadJSONToPinata(presentation, `Proof-${Date.now()}`);

      console.log(`✅ Presentation uploaded: ${proofUpload.cid}`);

      // Generate QR code
      const qrData = JSON.stringify({
        cid: proofUpload.cid,
        type: "SelectiveDisclosureProof",
        disclosedFields: selectedFields
      });

      const qrCode = await QRCode.toDataURL(qrData, {
        width: 300,
        margin: 2,
        color: {
          dark: '#4F46E5',
          light: '#FFFFFF'
        }
      });

      console.log("✅ QR code generated");

      res.json({
        success: true,
        proofCid: proofUpload.cid,
        proofUrl: proofUpload.ipfsUrl,
        qrCode: qrCode,
        selectedFields: selectedFields,
        presentation: presentation,
        disclosedData: disclosedCredentialSubject
      });

    } catch (err) {
      console.error("❌ Error generating proof:", err);
      console.error("   Stack:", err.stack);
      res.status(500).json({
        success: false,
        message: err.message || "Failed to generate proof",
        error: err.toString()
      });
    }
  });

  /**
   * POST /verifyProof - Verify selective disclosure proof
   * Verifies a BBS+ derived proof
   */
  router.post("/verifyProof", async (req, res) => {
    try {
      const { proofCid, publicKey } = req.body;

      console.log("\n🔍 Verifying selective disclosure proof...");
      console.log(`   Proof CID: ${proofCid}`);

      // Fetch presentation from IPFS
      const presentation = await retrieveJSONFromIPFS(proofCid);

      if (!presentation || !presentation.verifiableCredential) {
        throw new Error("Invalid presentation format");
      }

      const vc = presentation.verifiableCredential;
      const proof = vc.proof;

      if (!proof || !proof.proofValue) {
        throw new Error("Presentation does not contain a valid proof");
      }

      // Convert proof from base64
      const proofBytes = new Uint8Array(Buffer.from(proof.proofValue, 'base64'));

      // Get public key
      let publicKeyBytes;
      if (publicKey) {
        publicKeyBytes = new Uint8Array(Buffer.from(publicKey, 'base64'));
      } else {
        throw new Error("Public key is required for verification");
      }

      // Prepare disclosed messages
      const disclosedFields = proof.disclosedFields || [];
      const credentialSubject = vc.credentialSubject || {};

      const disclosedMessages = disclosedFields.map(field => {
        const value = credentialSubject[field] || "";
        return new TextEncoder().encode(value);
      });

      console.log(`   Disclosed fields: ${disclosedFields.join(', ')}`);

      // Verify proof with correct ciphersuite
      const verified = await bbsLib.verifyProof({
        proof: proofBytes,
        publicKey: publicKeyBytes,
        messages: disclosedMessages,
        header: new Uint8Array(),
        presentationHeader: new Uint8Array(),
        ciphersuite: bbsLib.CIPHERSUITES.BLS12381_SHA256
      });

      console.log(`✅ Proof verification: ${verified ? 'VALID' : 'INVALID'}`);

      res.json({
        success: true,
        verified: verified,
        disclosedFields: disclosedFields,
        disclosedData: credentialSubject,
        presentation: presentation
      });

    } catch (err) {
      console.error("❌ Error verifying proof:", err);
      res.status(500).json({
        success: false,
        message: err.message || "Failed to verify proof"
      });
    }
  });

  return router;
};
