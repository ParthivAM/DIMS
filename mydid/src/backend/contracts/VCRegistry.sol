// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title VCRegistry
 * @dev Smart contract for storing and verifying Verifiable Credentials on Ethereum
 */
contract VCRegistry {
    
    struct VC {
        string documentHash;      // SHA-256 hash of the document
        string ipfsCID;          // IPFS CID where VC JSON is stored
        address issuer;          // Address of the issuer
        uint256 timestamp;       // Issuance timestamp
        bool revoked;            // Revocation status
        bool exists;             // Check if VC exists
    }
    
    // Mapping from document hash to VC data
    mapping(string => VC) private vcRegistry;
    
    // Array to track all VC IDs for enumeration
    uint256 public vcCount;
    mapping(uint256 => string) public vcIdToHash;
    
    // Events
    event VCStored(
        uint256 indexed vcId,
        string documentHash,
        string ipfsCID,
        address indexed issuer,
        uint256 timestamp
    );
    
    event VCRevoked(
        string documentHash,
        address indexed revoker,
        uint256 timestamp
    );
    
    /**
     * @dev Store a new Verifiable Credential
     * @param documentHash SHA-256 hash of the document
     * @param ipfsCID IPFS CID where VC JSON is stored
     * @return vcId Unique identifier for this VC
     */
    function storeVC(
        string memory documentHash,
        string memory ipfsCID
    ) public returns (uint256) {
        require(bytes(documentHash).length > 0, "Document hash cannot be empty");
        require(bytes(ipfsCID).length > 0, "IPFS CID cannot be empty");
        require(!vcRegistry[documentHash].exists, "VC already exists");
        
        vcCount++;
        uint256 vcId = vcCount;
        
        vcRegistry[documentHash] = VC({
            documentHash: documentHash,
            ipfsCID: ipfsCID,
            issuer: msg.sender,
            timestamp: block.timestamp,
            revoked: false,
            exists: true
        });
        
        vcIdToHash[vcId] = documentHash;
        
        emit VCStored(vcId, documentHash, ipfsCID, msg.sender, block.timestamp);
        
        return vcId;
    }
    
    /**
     * @dev Verify a Verifiable Credential
     * @param documentHash SHA-256 hash to verify
     * @return exists Whether the VC exists
     * @return ipfsCID IPFS CID of the VC
     * @return issuer Address of the issuer
     * @return timestamp Issuance timestamp
     * @return revoked Revocation status
     */
    function verifyVC(string memory documentHash) 
        public 
        view 
        returns (
            bool exists,
            string memory ipfsCID,
            address issuer,
            uint256 timestamp,
            bool revoked
        ) 
    {
        VC memory vc = vcRegistry[documentHash];
        return (
            vc.exists,
            vc.ipfsCID,
            vc.issuer,
            vc.timestamp,
            vc.revoked
        );
    }
    
    /**
     * @dev Revoke a Verifiable Credential
     * @param documentHash SHA-256 hash of the VC to revoke
     */
    function revokeVC(string memory documentHash) public {
        require(vcRegistry[documentHash].exists, "VC does not exist");
        require(
            vcRegistry[documentHash].issuer == msg.sender,
            "Only issuer can revoke"
        );
        require(!vcRegistry[documentHash].revoked, "VC already revoked");
        
        vcRegistry[documentHash].revoked = true;
        
        emit VCRevoked(documentHash, msg.sender, block.timestamp);
    }
    
    /**
     * @dev Get VC by ID
     * @param vcId The VC identifier
     * @return documentHash The document hash
     * @return ipfsCID IPFS CID
     * @return issuer Issuer address
     * @return timestamp Issuance timestamp
     * @return revoked Revocation status
     */
    function getVCById(uint256 vcId)
        public
        view
        returns (
            string memory documentHash,
            string memory ipfsCID,
            address issuer,
            uint256 timestamp,
            bool revoked
        )
    {
        require(vcId > 0 && vcId <= vcCount, "Invalid VC ID");
        string memory hash = vcIdToHash[vcId];
        VC memory vc = vcRegistry[hash];
        
        return (
            vc.documentHash,
            vc.ipfsCID,
            vc.issuer,
            vc.timestamp,
            vc.revoked
        );
    }
    
    /**
     * @dev Get all VCs issued by a specific address
     * @param issuerAddress The issuer's address
     * @return hashes Array of document hashes
     */
    function getVCsByIssuer(address issuerAddress)
        public
        view
        returns (string[] memory hashes)
    {
        uint256 count = 0;
        
        // Count VCs by this issuer
        for (uint256 i = 1; i <= vcCount; i++) {
            string memory hash = vcIdToHash[i];
            if (vcRegistry[hash].issuer == issuerAddress) {
                count++;
            }
        }
        
        // Populate array
        hashes = new string[](count);
        uint256 index = 0;
        for (uint256 i = 1; i <= vcCount; i++) {
            string memory hash = vcIdToHash[i];
            if (vcRegistry[hash].issuer == issuerAddress) {
                hashes[index] = hash;
                index++;
            }
        }
        
        return hashes;
    }
}
