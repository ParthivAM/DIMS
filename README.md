# Decentralized Identity Management System

A blockchain-based identity management solution that enables users to create, manage, and verify digital identities without relying on centralized authorities. Built as a final-year Computer Engineering project to demonstrate the practical application of decentralized technologies in solving real-world identity challenges.

---

## Table of Contents

- [Project Overview](#project-overview)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [System Architecture](#system-architecture)
- [How It Works](#how-it-works)
- [Setup and Installation](#setup-and-installation)
- [Screenshots and Demo](#screenshots-and-demo)
- [Future Improvements](#future-improvements)
- [Disclaimer](#disclaimer)

---

## Project Overview

### The Problem with Centralized Identity Systems

Traditional identity management systems rely on centralized authorities such as governments, corporations, or service providers to issue and verify credentials. This approach introduces several challenges:

- **Single Points of Failure**: Centralized databases are vulnerable to breaches, outages, and data loss.
- **Privacy Concerns**: Users have limited control over how their personal data is stored, shared, or monetized.
- **Interoperability Issues**: Credentials from one system are often not recognized or transferable to another.
- **Trust Dependencies**: Users must trust third parties to protect their data and verify their identity accurately.

### The Decentralized Solution

This project implements a Self-Sovereign Identity (SSI) model where:

- **Users own their identity**: Credentials are stored in user-controlled wallets, not on centralized servers.
- **Blockchain ensures integrity**: Identity records are anchored on the Ethereum blockchain, providing tamper-proof verification.
- **Selective disclosure**: Users can share only the specific claims required for verification, preserving privacy.
- **Interoperability**: Built on open standards, enabling credentials to be verified across different platforms and services.

---

## Key Features

### Identity Management
- **Decentralized Identifier (DID) Generation**: Create unique, cryptographically verifiable identifiers anchored on the blockchain.
- **Wallet-Based Authentication**: Authenticate using MetaMask without usernames or passwords.
- **Profile Management**: Manage identity attributes and credentials through an intuitive dashboard.

### Verifiable Credentials
- **Credential Issuance**: Authorized issuers can create and sign verifiable credentials.
- **Credential Storage**: Credentials are encrypted and stored on IPFS with blockchain anchoring.
- **Selective Disclosure**: Share only the required claims from a credential using BBS+ signatures.
- **Credential Verification**: Verifiers can cryptographically validate credentials without contacting the issuer.

### Role-Based Dashboards
- **Holder Dashboard**: Request, store, and share verifiable credentials.
- **Issuer Dashboard**: Review credential requests and issue signed credentials.
- **Verifier Dashboard**: Scan and verify credentials presented by holders.

### Security Features
- **BBS+ Signatures**: Enable selective disclosure while maintaining cryptographic proof.
- **On-Chain Anchoring**: Credential hashes stored on Ethereum for immutable verification.
- **QR Code Sharing**: Share and scan credentials securely via QR codes.

---

## Tech Stack

### Blockchain Layer
| Technology | Purpose |
|------------|---------|
| Ethereum (Sepolia Testnet) | Decentralized ledger for DID and credential anchoring |
| Solidity | Smart contract development |
| Hardhat | Development environment, testing, and deployment |
| Ethers.js | Blockchain interaction library |

### Decentralized Storage
| Technology | Purpose |
|------------|---------|
| IPFS (via Pinata) | Off-chain storage for credential documents |

### Backend
| Technology | Purpose |
|------------|---------|
| Node.js | Server runtime |
| Express.js | REST API framework |
| BBS Signatures | Selective disclosure cryptography |

### Frontend
| Technology | Purpose |
|------------|---------|
| React 19 | User interface framework |
| React Router | Client-side routing |
| Tailwind CSS | Utility-first styling |
| Framer Motion | UI animations |
| Lucide React | Icon library |

### Authentication and Wallet
| Technology | Purpose |
|------------|---------|
| MetaMask | Ethereum wallet integration |
| DID Resolver | Decentralized identifier resolution |

### DevOps
| Technology | Purpose |
|------------|---------|
| Docker | Containerization |
| Docker Compose | Multi-container orchestration |

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              USER LAYER                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                      │
│  │   Holder    │  │   Issuer    │  │  Verifier   │                      │
│  │  Dashboard  │  │  Dashboard  │  │  Dashboard  │                      │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘                      │
└─────────┼────────────────┼────────────────┼─────────────────────────────┘
          │                │                │
          ▼                ▼                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          APPLICATION LAYER                               │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                     React Frontend (Port 3000)                    │   │
│  │  • MetaMask Integration  • QR Code Generation  • Form Handling   │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                    │                                     │
│                                    ▼                                     │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                   Express Backend (Port 5000)                     │   │
│  │  • REST API  • BBS+ Signatures  • Credential Management          │   │
│  └──────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
          │                                │
          ▼                                ▼
┌─────────────────────────┐  ┌────────────────────────────────────────────┐
│    BLOCKCHAIN LAYER     │  │           STORAGE LAYER                    │
│  ┌───────────────────┐  │  │  ┌────────────────────────────────────┐   │
│  │ Ethereum Network  │  │  │  │              IPFS                  │   │
│  │ (Sepolia Testnet) │  │  │  │   • Credential Documents           │   │
│  │                   │  │  │  │   • Identity Metadata              │   │
│  │ • VCRegistry.sol  │  │  │  │   • Pinata Gateway                 │   │
│  │ • DID Anchoring   │  │  │  └────────────────────────────────────┘   │
│  └───────────────────┘  │  │                                            │
└─────────────────────────┘  └────────────────────────────────────────────┘
```

### Component Interaction

1. **MetaMask Wallet**: Users authenticate by connecting their MetaMask wallet. The wallet address serves as the basis for the DID.

2. **Smart Contracts**: The `VCRegistry.sol` contract handles:
   - Registering new DIDs on-chain
   - Storing credential hashes for verification
   - Managing issuer authorizations

3. **IPFS Storage**: Credential documents and metadata are stored on IPFS, with only the content hash recorded on-chain to minimize gas costs.

4. **Backend Services**: The Express server manages:
   - Credential creation and signing
   - BBS+ signature generation for selective disclosure
   - Communication between frontend and blockchain/IPFS

---

## How It Works

### Identity Creation and Credential Issuance Flow

```
Step 1: Wallet Connection
   └── User connects MetaMask wallet to the application

Step 2: Role Selection
   └── User selects role (Holder, Issuer, or Verifier)

Step 3: DID Generation
   └── System generates a DID based on the wallet address
   └── DID is anchored on the Ethereum blockchain

Step 4: Credential Request (Holder)
   └── Holder submits a credential request to an Issuer
   └── Request includes required identity claims

Step 5: Credential Issuance (Issuer)
   └── Issuer reviews the request
   └── Issuer creates a Verifiable Credential with claims
   └── Credential is signed using BBS+ signatures
   └── Credential hash is stored on blockchain
   └── Full credential is stored on IPFS

Step 6: Credential Storage (Holder)
   └── Holder receives and stores the credential in their wallet
   └── Credential metadata is indexed for easy retrieval

Step 7: Credential Presentation (Holder to Verifier)
   └── Holder creates a Verifiable Presentation
   └── Holder selects which claims to disclose
   └── QR code is generated for the presentation

Step 8: Verification (Verifier)
   └── Verifier scans the QR code
   └── System validates the cryptographic signatures
   └── Blockchain is queried to confirm credential validity
   └── Verification result is displayed
```

---

## Setup and Installation

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- MetaMask browser extension
- Git

### Clone the Repository

```bash
git clone https://github.com/ParthivAM/DIMS.git
cd DIMS
```

### Backend Setup

```bash
# Navigate to backend directory
cd mydid/src/backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Configure environment variables in .env:
# - PINATA_API_KEY: Your Pinata API key for IPFS
# - PINATA_SECRET_KEY: Your Pinata secret key
# - SEPOLIA_RPC_URL: Ethereum Sepolia RPC endpoint
# - PRIVATE_KEY: Deployer wallet private key (for contract deployment)

# Compile smart contracts
npm run compile

# Deploy contracts to Sepolia testnet
npm run deploy

# Start the backend server
npm run dev
```

### Frontend Setup

```bash
# Navigate to frontend directory (from project root)
cd mydid

# Install dependencies
npm install

# Start the development server
npm start
```

### MetaMask Configuration

1. Install the MetaMask browser extension.
2. Create or import a wallet.
3. Add the Sepolia testnet:
   - Network Name: Sepolia
   - RPC URL: https://sepolia.infura.io/v3/YOUR_INFURA_KEY
   - Chain ID: 11155111
   - Currency Symbol: ETH
4. Obtain test ETH from a Sepolia faucet.

### Docker Setup (Alternative)

```bash
# From the project root
cd mydid

# Build and run containers
docker-compose up --build

# Access the application at http://localhost:3000
```

### Verify Installation

1. Open http://localhost:3000 in your browser.
2. Connect your MetaMask wallet.
3. Select a role and verify the dashboard loads correctly.

---

## Screenshots and Demo

### Application Screenshots

*Screenshots will be added here*

```
[Placeholder: Home Page]
[Placeholder: Wallet Connection]
[Placeholder: Holder Dashboard]
[Placeholder: Credential Request Form]
[Placeholder: Issuer Dashboard]
[Placeholder: Credential Issuance]
[Placeholder: Verifier Dashboard]
[Placeholder: QR Code Verification]
```

### Demo Video

*A demonstration video showcasing the complete workflow will be linked here*

---

## Future Improvements

### Short-Term Enhancements
- **Enhanced UI/UX**: Improved visual design and mobile responsiveness.
- **Batch Credential Operations**: Support for issuing multiple credentials simultaneously.
- **Credential Revocation**: Implement on-chain credential revocation with status lists.

### Medium-Term Features
- **Zero-Knowledge Proofs**: Enable proving claims without revealing underlying data.
- **Multi-Chain Support**: Deploy contracts on additional EVM-compatible networks.
- **Role-Based Access Control**: More granular permissions for institutional issuers.

### Long-Term Vision
- **DID Method Standardization**: Full compliance with W3C DID Core specification.
- **Interoperability Layer**: Integration with other SSI ecosystems (Hyperledger Indy, ION).
- **Mobile Wallet Application**: Native mobile app for credential management.
- **Governance Framework**: Decentralized governance for issuer accreditation.

---

## Disclaimer

This project is developed for educational and demonstration purposes as part of a final-year Computer Engineering project. It is not intended for production use in its current state.

**Important Considerations:**

- The application uses the Ethereum Sepolia testnet. No real cryptocurrency or assets are involved.
- Security audits have not been conducted on the smart contracts.
- The cryptographic implementations are for learning purposes and may not meet production security standards.
- Users should not upload genuine personal identity documents to this system.

For any questions or feedback regarding this project, please open an issue in the repository.

---

## License

This project is licensed under the MIT License. See the LICENSE file for details.

---

## Acknowledgments

- W3C Decentralized Identifiers (DIDs) specification
- W3C Verifiable Credentials Data Model
- Ethereum and Solidity documentation
- IPFS and Pinata documentation
- The open-source community for the libraries and tools used in this project
