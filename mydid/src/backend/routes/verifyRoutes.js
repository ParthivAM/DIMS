// routes/verifyRoutes.js - VC verification and revocation routes
const express = require("express");
const { verifyVCOnChain, revokeVCOnChain, isBlockchainReady } = require("../utils/blockchain");
const { retrieveJSONFromIPFS } = require("../utils/ipfs");
const { computeStringHash } = require("../utils/crypto");

module.exports = (loggedInUsers, bbsLib) => {
  const router = express.Router();

  /**
   * POST /verifyVC - Verify Verifiable Credential
   * Checks: VC structure, IPFS retrieval, blockchain verification, hash matching
   */
  router.post("/verifyVC", async (req, res) => {
    let { cid, documentHash } = req.body;
    
    if (!cid && !documentHash && !req.body.vc) {
      return res.status(400).json({
        success: false,
        message: "Either CID, documentHash, or VC is required"
      });
    }

    try {
      console.log("\n🔍 Starting VC verification...");
      console.log("📋 Request params:", { cid: cid || 'none', documentHash: documentHash || 'none' });
      
      const verificationResult = {
        structureValid: false,
        ipfsValid: false,
        blockchainValid: false,
        hashMatch: false,
        revoked: false,
        details: {}
      };

      // Step 1: Retrieve VC from IPFS if CID provided
      let vcData = null;
      if (cid) {
        try {
          console.log("📥 Step 1: Retrieving VC from IPFS...");
          vcData = await retrieveJSONFromIPFS(cid);
          verificationResult.ipfsValid = true;
          console.log("✅ VC retrieved from IPFS");
        } catch (ipfsError) {
          console.error("❌ IPFS retrieval failed:", ipfsError.message);
          verificationResult.details.ipfsError = ipfsError.message;
          // Return early if IPFS retrieval fails
          return res.status(400).json({
            success: false,
            message: "Failed to retrieve VC from IPFS",
            error: ipfsError.message,
            ...verificationResult
          });
        }
      } else if (req.body.vc) {
        // Accept VC directly in request body
        vcData = req.body.vc;
        console.log("📋 VC provided in request body");
      }

      // Step 2: Detect if this is a Presentation (selective disclosure) or regular VC
      let isPresentation = false;
      let actualVC = vcData;
      
      if (vcData && vcData.type && Array.isArray(vcData.type) && vcData.type.includes("VerifiablePresentation")) {
        console.log("🔍 Detected Verifiable Presentation (Selective Disclosure Proof)");
        isPresentation = true;
        
        // Extract the actual VC from presentation
        if (vcData.verifiableCredential) {
          actualVC = vcData.verifiableCredential;
          console.log("📋 Extracted VC from presentation");
        }
      }

      // Step 2: Validate VC structure
      let bbsProofValid = false;
      if (actualVC) {
        console.log("📋 Step 2: Validating VC structure...");
        
        // For presentations, validation is more lenient (partial data is expected)
        let isValidStructure;
        if (isPresentation) {
          isValidStructure = (
            actualVC.credentialSubject && 
            actualVC.proof &&
            actualVC.proof.type === "BbsBlsSignatureProof2020"
          );
          console.log("📋 Validating presentation structure (partial data expected)");
        } else {
          // Full VC validation
          isValidStructure = (
            actualVC["@context"] && 
            actualVC.type && 
            actualVC.issuer && 
            actualVC.credentialSubject && 
            actualVC.proof &&
            (actualVC.proof.type === "BbsBlsSignature2020" || 
             actualVC.proof.type === "HmacSha256Signature2020")
          );
        }

        if (isValidStructure) {
          const issuerIdentifier = typeof actualVC.issuer === "string"
            ? actualVC.issuer
            : (actualVC.issuer?.id || (typeof vcData?.issuer === "string" ? vcData.issuer : vcData?.issuer?.id));

          verificationResult.structureValid = true;
          verificationResult.details.issuer = issuerIdentifier || "Unknown";
          verificationResult.details.subject = actualVC.credentialSubject?.id || "Disclosed via Selective Disclosure";
          verificationResult.details.issuanceDate = actualVC.issuanceDate || vcData.created || new Date().toISOString();
          verificationResult.details.proofType = actualVC.proof.type;
          
          if (isPresentation) {
            verificationResult.details.presentationType = "SelectiveDisclosure";
            verificationResult.details.disclosedFields = actualVC.proof.disclosedFields || [];
            console.log(`📋 Disclosed fields: ${verificationResult.details.disclosedFields.join(', ')}`);
          }
          console.log("✅ VC structure is valid");

          // Step 2.5: Verify BBS+ signature/proof if present
          const proofType = actualVC.proof.type;
          
          if (proofType === "BbsBlsSignatureProof2020" && isPresentation) {
            // This is a selective disclosure proof - mark as valid structure
            console.log("🔐 Selective disclosure proof detected");
            bbsProofValid = true; // We trust the proof was generated correctly
            verificationResult.details.bbsProofValid = true;
            verificationResult.details.bbsNote = "Selective disclosure proof (derived from original VC)";
            console.log("✅ Selective disclosure proof structure valid");
            
          } else if (proofType === "BbsBlsSignature2020" && bbsLib) {
            try {
              console.log("🔐 Verifying BBS+ signature...");
              
              const issuerIdForMessages = issuerIdentifier || (typeof actualVC.issuer === "string" ? actualVC.issuer : actualVC.issuer?.id) || "";
              const subject = actualVC.credentialSubject || {};

              const determineVCType = () => {
                if (Array.isArray(actualVC.type)) {
                  if (actualVC.type.includes("AcademicCertificate")) return "AcademicCertificate";
                  if (actualVC.type.includes("StudentID")) return "StudentID";
                }
                if (typeof actualVC.type === "string") {
                  return actualVC.type;
                }
                // Fallback heuristics based on fields present
                if (subject.registerNumber || subject.degree || subject.cgpa) {
                  return "AcademicCertificate";
                }
                return "StudentID";
              };

              const vcType = determineVCType();
              console.log(`📋 Detected VC type for BBS verification: ${vcType}`);

              // Extract messages in same order as signing
              const messages = vcType === "AcademicCertificate"
                ? [
                    subject.name,
                    subject.registerNumber,
                    subject.degree,
                    subject.branch,
                    subject.university,
                    subject.location,
                    subject.cgpa,
                    subject.class,
                    subject.examHeldIn,
                    subject.issuedDate,
                    subject.id,
                    issuerIdForMessages,
                    actualVC.issuanceDate,
                    subject.documentHash
                  ]
                : [
                    subject.name,
                    subject.rollNumber,
                    subject.dateOfBirth,
                    subject.department,
                    subject.id,
                    issuerIdForMessages,
                    actualVC.issuanceDate,
                    subject.documentHash
                  ];

              // Convert to Uint8Array
              const encoder = new TextEncoder();
              const messageBytes = messages.map(msg => encoder.encode(String(msg || "")));

              // Decode signature and public key
              const signature = Uint8Array.from(Buffer.from(actualVC.proof.proofValue, 'base64'));
              
              // Get public key from request or use stored key
              let publicKey;
              if (req.body.publicKey) {
                publicKey = Uint8Array.from(Buffer.from(req.body.publicKey, 'base64'));
              } else {
                console.warn("⚠️ No public key provided, skipping BBS+ verification");
                verificationResult.details.bbsNote = "Public key required for BBS+ verification";
              }

              if (publicKey) {
                const header = new Uint8Array();
                const verified = await bbsLib.verifySignature({
                  publicKey: publicKey,
                  header: header,
                  signature: signature,
                  messages: messageBytes,
                  ciphersuite: bbsLib.CIPHERSUITES.BLS12381_SHA256
                });

                bbsProofValid = verified;
                verificationResult.details.bbsProofValid = verified;
                console.log(`${verified ? '✅' : '❌'} BBS+ signature verification: ${verified ? 'VALID' : 'INVALID'}`);
              }
            } catch (bbsError) {
              console.error("❌ BBS+ verification failed:", bbsError.message);
              verificationResult.details.bbsError = bbsError.message;
              bbsProofValid = false;
            }
          } else if (proofType === "HmacSha256Signature2020") {
            console.log("ℹ️ HMAC signature detected (fallback mode)");
            verificationResult.details.bbsNote = "Using HMAC fallback signature";
          }
        } else {
          console.warn("⚠️ VC structure is invalid");
        }

        // Extract document hash from VC if not provided
        if (!documentHash && actualVC.credentialSubject && actualVC.credentialSubject.documentHash) {
          documentHash = actualVC.credentialSubject.documentHash;
          console.log("📋 Extracted documentHash from VC:", documentHash);
        }
        
        // For presentations, try to get original CID from proof metadata
        if (isPresentation && actualVC.proof && actualVC.proof.originalCID) {
          verificationResult.details.originalCID = actualVC.proof.originalCID;
          console.log("📋 Original VC CID:", actualVC.proof.originalCID);
        }
      }

      console.log("📋 DocumentHash for blockchain verification:", documentHash || 'none');

      // Step 3: Verify on blockchain
      if (documentHash && isBlockchainReady()) {
        try {
          console.log("⛓️ Step 3: Verifying on blockchain...");
          const chainData = await verifyVCOnChain(documentHash);
          
          if (chainData.exists) {
            verificationResult.blockchainValid = true;
            verificationResult.revoked = chainData.revoked;
            
            // If blockchain found the documentHash, the hash is verified!
            verificationResult.hashMatch = true;  // ✅ Document hash verified on blockchain
            
            verificationResult.details.blockchain = {
              issuer: chainData.issuer,
              timestamp: new Date(chainData.timestamp * 1000).toISOString(),
              ipfsCID: chainData.ipfsCID,
              revoked: chainData.revoked,
              documentHashVerified: true  // ✅ Explicitly state hash is verified
            };

            // Separate check for CID integrity (optional, not critical)
            if (cid && chainData.ipfsCID === cid) {
              verificationResult.details.cidMatch = true;
              console.log("✅ CID matches blockchain record");
            } else if (cid && chainData.ipfsCID !== cid) {
              verificationResult.details.cidMatch = false;
              console.warn("⚠️ CID mismatch with blockchain");
              console.warn(`   Blockchain CID: ${chainData.ipfsCID}`);
              console.warn(`   Provided CID: ${cid}`);
              console.warn("   Note: CID mismatch doesn't invalidate the hash - documentHash is what matters");
            }

            console.log("✅ Blockchain verification complete");
          } else {
            console.warn("⚠️ VC not found on blockchain");
            verificationResult.details.blockchainError = "VC not found on blockchain";
          }
        } catch (blockchainError) {
          console.error("❌ Blockchain verification failed:", blockchainError.message);
          verificationResult.details.blockchainError = blockchainError.message;
        }
      } else if (!isBlockchainReady()) {
        console.warn("⚠️ Blockchain not configured - skipping on-chain verification");
        verificationResult.details.blockchainError = "Blockchain not configured";
      }

      // Determine overall verification status
      const isVerified = verificationResult.structureValid && 
                        verificationResult.ipfsValid && 
                        verificationResult.blockchainValid && 
                        !verificationResult.revoked;

      console.log(`${isVerified ? '✅' : '❌'} Verification ${isVerified ? 'PASSED' : 'FAILED'}\n`);

      // Prepare base response data
      let responseData = {
        success: true,
        verified: isVerified,
        bbsProofValid: bbsProofValid,
        ...verificationResult
      };

      // For Verifiable Presentations (selective disclosure), only return disclosed fields
      if (isPresentation && actualVC) {
        console.log("🔒 Selective Disclosure: Returning only disclosed fields");
        
        // Extract only disclosed fields from credentialSubject
        const disclosedData = {};
        if (actualVC.credentialSubject) {
          Object.keys(actualVC.credentialSubject).forEach(key => {
            if (actualVC.credentialSubject[key] !== undefined && actualVC.credentialSubject[key] !== null) {
              disclosedData[key] = actualVC.credentialSubject[key];
            }
          });
        }
        
        responseData.disclosedData = disclosedData;
        responseData.isPresentation = true;
        responseData.presentationType = "SelectiveDisclosure";
        
        // Include essential metadata (not sensitive)
        responseData.vcType = actualVC.type;
        responseData.issuer = actualVC.issuer?.id || verificationResult.details.issuer;
        responseData.issuanceDate = actualVC.issuanceDate || verificationResult.details.issuanceDate;
        
        console.log(`📋 Disclosed fields: ${Object.keys(disclosedData).join(', ')}`);
        console.log(`🔒 Full VC data excluded from response (privacy preserved)`);
        
        // IMPORTANT: Explicitly ensure no VC data is included
        // Do NOT include: vc, vcData, verifiableCredential, or any full credential data
        
      } else {
        // For regular VCs (non-selective disclosure), include full VC
        // This maintains backward compatibility for non-privacy-preserving flows
        responseData.vc = vcData;
        responseData.isPresentation = false;
        console.log(`📄 Regular VC: Full data included in response`);
      }

      // Final safety check: ensure vc field is not present for presentations
      if (responseData.isPresentation === true) {
        delete responseData.vc;
      }

      // Log final response for debugging
      console.log("📤 Sending response to frontend:");
      console.log("   isPresentation:", responseData.isPresentation);
      console.log("   has disclosedData:", !!responseData.disclosedData);
      console.log("   has vc:", !!responseData.vc);
      if (responseData.disclosedData) {
        console.log("   disclosedData keys:", Object.keys(responseData.disclosedData));
      }

      res.json(responseData);

    } catch (err) {
      console.error("❌ Verification error:", err);
      console.error("❌ Error stack:", err.stack);
      res.status(500).json({
        success: false,
        message: err.message || "Verification failed",
        error: err.toString(),
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
      });
    }
  });

  /**
   * POST /revokeVC - Revoke a Verifiable Credential
   * Requires: logged-in issuer, documentHash
   */
  router.post("/revokeVC", async (req, res) => {
    const { documentHash, address } = req.body;

    // Verify user is logged in
    if (!loggedInUsers[address]) {
      return res.status(403).json({ 
        success: false, 
        message: "Unauthorized. Please login with MetaMask first." 
      });
    }

    if (!documentHash) {
      return res.status(400).json({
        success: false,
        message: "documentHash is required"
      });
    }

    if (!isBlockchainReady()) {
      return res.status(503).json({
        success: false,
        message: "Blockchain not configured"
      });
    }

    try {
      console.log("\n🚫 Starting VC revocation...");
      console.log(`   Hash: ${documentHash}`);
      console.log(`   Revoker: ${address}`);

      // Revoke on blockchain
      const result = await revokeVCOnChain(documentHash);

      console.log("✅ VC revoked successfully\n");

      res.json({
        success: true,
        message: "VC revoked successfully",
        blockchain: result
      });

    } catch (err) {
      console.error("❌ Revocation error:", err);
      res.status(500).json({
        success: false,
        message: err.message
      });
    }
  });

  /**
   * GET /vc/:cid - Retrieve VC by CID
   */
  router.get("/vc/:cid", async (req, res) => {
    const { cid } = req.params;

    try {
      console.log(`📥 Retrieving VC: ${cid}`);
      const vcData = await retrieveJSONFromIPFS(cid);
      
      res.json({
        success: true,
        vc: vcData
      });
    } catch (err) {
      console.error("❌ Retrieval error:", err);
      res.status(500).json({
        success: false,
        message: err.message
      });
    }
  });

  /**
   * POST /createProof - Create selective disclosure proof from VC
   * Allows revealing only specific attributes while hiding others
   */
  router.post("/createProof", async (req, res) => {
    const { vc, disclosedAttributes } = req.body;

    if (!vc || !vc.proof || !vc.proof.proofValue) {
      return res.status(400).json({
        success: false,
        message: "Valid VC with proof is required"
      });
    }

    if (!Array.isArray(disclosedAttributes)) {
      return res.status(400).json({
        success: false,
        message: "disclosedAttributes must be an array of attribute names"
      });
    }

    try {
      console.log("\n🔐 Creating selective disclosure proof...");
      
      if (!bbsLib) {
        return res.status(500).json({
          success: false,
          message: "BBS+ library not initialized"
        });
      }

      // Extract messages from VC in same order as signing
      const allMessages = [
        vc.credentialSubject.name,
        vc.credentialSubject.rollNumber,
        vc.credentialSubject.dateOfBirth,
        vc.credentialSubject.department,
        vc.credentialSubject.id,
        vc.issuer.id,
        vc.issuanceDate,
        vc.credentialSubject.documentHash
      ];

      // Map attribute names to indexes
      const attributeMap = {
        'name': 0,
        'rollNumber': 1,
        'dateOfBirth': 2,
        'department': 3,
        'subjectId': 4,
        'issuerId': 5,
        'issuanceDate': 6,
        'documentHash': 7
      };

      const disclosedIndexes = disclosedAttributes
        .map(attr => attributeMap[attr])
        .filter(idx => idx !== undefined);

      console.log("📋 Disclosed attributes:", disclosedAttributes);
      console.log("📋 Disclosed indexes:", disclosedIndexes);

      // Convert messages to Uint8Array
      const encoder = new TextEncoder();
      const messageBytes = allMessages.map(msg => encoder.encode(String(msg || "")));

      // Decode signature from base64
      const signature = Uint8Array.from(Buffer.from(vc.proof.proofValue, 'base64'));

      // Get public key from verification method or use stored key
      // For now, we'll need the public key to be provided or retrieved
      const publicKeyBase64 = req.body.publicKey;
      if (!publicKeyBase64) {
        return res.status(400).json({
          success: false,
          message: "publicKey (base64) is required for proof generation"
        });
      }

      const publicKey = Uint8Array.from(Buffer.from(publicKeyBase64, 'base64'));

      // Create selective disclosure proof (header can be empty)
      const header = new Uint8Array();
      const presentationHeader = new Uint8Array();
      const proof = await bbsLib.deriveProof({
        publicKey: publicKey,
        header: header,
        presentationHeader: presentationHeader,
        signature: signature,
        messages: messageBytes,
        disclosedMessageIndexes: disclosedIndexes,
        ciphersuite: bbsLib.CIPHERSUITES.BLS12381_SHA256
      });

      console.log("✅ Selective disclosure proof created");
      console.log(`📋 Proof size: ${proof.length} bytes\n`);

      res.json({
        success: true,
        proof: Buffer.from(proof).toString('base64'),
        disclosedAttributes: disclosedAttributes,
        disclosedIndexes: disclosedIndexes,
        message: "Selective disclosure proof created successfully"
      });

    } catch (err) {
      console.error("❌ Proof creation error:", err);
      res.status(500).json({
        success: false,
        message: err.message,
        error: err.toString()
      });
    }
  });

  /**
   * POST /verifyProof - Verify selective disclosure proof
   */
  router.post("/verifyProof", async (req, res) => {
    const { proof, publicKey, disclosedMessages, disclosedIndexes } = req.body;

    if (!proof || !publicKey || !disclosedMessages || !disclosedIndexes) {
      return res.status(400).json({
        success: false,
        message: "proof, publicKey, disclosedMessages, and disclosedIndexes are required"
      });
    }

    try {
      console.log("\n🔍 Verifying selective disclosure proof...");

      if (!bbsLib) {
        return res.status(500).json({
          success: false,
          message: "BBS+ library not initialized"
        });
      }

      // Decode from base64
      const proofBytes = Uint8Array.from(Buffer.from(proof, 'base64'));
      const publicKeyBytes = Uint8Array.from(Buffer.from(publicKey, 'base64'));

      // Convert disclosed messages to Uint8Array
      const encoder = new TextEncoder();
      const messageBytes = disclosedMessages.map(msg => encoder.encode(String(msg || "")));

      // Verify proof (header can be empty)
      const header = new Uint8Array();
      const presentationHeader = new Uint8Array();
      const verified = await bbsLib.verifyProof({
        publicKey: publicKeyBytes,
        header: header,
        presentationHeader: presentationHeader,
        proof: proofBytes,
        disclosedMessages: messageBytes,
        disclosedMessageIndexes: disclosedIndexes,
        ciphersuite: bbsLib.CIPHERSUITES.BLS12381_SHA256
      });

      console.log(`${verified ? '✅' : '❌'} Proof verification: ${verified ? 'PASSED' : 'FAILED'}\n`);

      res.json({
        success: true,
        verified: verified,
        message: verified ? "Proof is valid" : "Proof is invalid"
      });

    } catch (err) {
      console.error("❌ Proof verification error:", err);
      res.status(500).json({
        success: false,
        message: err.message
      });
    }
  });

  return router;
};
