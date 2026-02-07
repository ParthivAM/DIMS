# Decentralized DigiLocker Backend

Production-ready backend for Digital Identity Management with BBS+ Signatures, IPFS storage, and Ethereum blockchain anchoring.

## 🏗️ Architecture

```
backend/
├── server.js                 # Main Express server
├── routes/
│   ├── authRoutes.js        # MetaMask authentication
│   ├── vcRoutes.js          # VC issuance endpoints
│   └── verifyRoutes.js      # VC verification & revocation
├── utils/
│   ├── ipfs.js              # Pinata IPFS integration
│   ├── blockchain.js        # Ethereum Sepolia integration
│   └── crypto.js            # SHA-256 hashing utilities
├── contracts/
│   └── VCRegistry.sol       # Smart contract for VC registry
├── scripts/
│   └── deploy.js            # Hardhat deployment script
├── .env                     # Environment configuration
└── package.json
```

## 🚀 Features

- ✅ **MetaMask Authentication** - Secure wallet-based login
- ✅ **BBS+ Signatures** - Selective disclosure with BLS12-381
- ✅ **IPFS Storage** - Decentralized document & VC storage via Pinata
- ✅ **Blockchain Anchoring** - Ethereum Sepolia testnet integration
- ✅ **SHA-256 Hashing** - Document integrity verification
- ✅ **Verifiable Credentials** - W3C VC standard compliance
- ✅ **Revocation Support** - On-chain credential revocation

## 📦 Installation

### 1. Install Dependencies

```bash
cd mydid/src/backend
npm install
```

### 2. Configure Environment

Create `.env` file:

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```env
# Pinata IPFS
PINATA_API_KEY=your_pinata_api_key
PINATA_SECRET_API_KEY=your_pinata_secret_key

# Ethereum Sepolia
INFURA_API_KEY=your_infura_key
# OR
ALCHEMY_API_KEY=your_alchemy_key

WALLET_PRIVATE_KEY=your_wallet_private_key
VC_CONTRACT_ADDRESS=deployed_contract_address

PORT=5000
```

### 3. Get API Keys

#### Pinata (IPFS)
1. Sign up at [pinata.cloud](https://pinata.cloud)
2. Generate API keys from dashboard
3. Add to `.env`

#### Infura/Alchemy (Ethereum RPC)
1. Sign up at [infura.io](https://infura.io) or [alchemy.com](https://alchemy.com)
2. Create Sepolia project
3. Copy API key to `.env`

#### MetaMask Wallet
1. Export private key from MetaMask (⚠️ Use testnet wallet only!)
2. Add to `.env` as `WALLET_PRIVATE_KEY`
3. Fund with Sepolia ETH from [faucet](https://sepoliafaucet.com)

## ⛓️ Smart Contract Deployment

### 1. Compile Contract

```bash
npm run compile
```

### 2. Deploy to Sepolia

```bash
npm run deploy
```

Copy the deployed contract address and add to `.env`:

```env
VC_CONTRACT_ADDRESS=0x...
```

### 3. Verify on Etherscan (Optional)

Add to `.env`:

```env
ETHERSCAN_API_KEY=your_etherscan_key
```

## 🏃 Running the Server

### Development Mode (with auto-reload)

```bash
npm run dev
```

### Production Mode

```bash
npm start
```

Server will start at `http://localhost:5000`

## 📡 API Endpoints

### Authentication

#### POST `/login`
MetaMask wallet authentication

**Request:**
```json
{
  "address": "0x...",
  "message": "Login to DID App",
  "signature": "0x..."
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "address": "0x...",
    "did": "did:ethr:0x...",
    "publicKey": "0x..."
  }
}
```

### Verifiable Credentials

#### POST `/issueVC`
Issue new VC with IPFS & blockchain anchoring

**Request:** `multipart/form-data`
- `name`: Student name
- `rollNumber`: Roll number
- `dob`: Date of birth
- `department`: Department
- `photo`: Photo file
- `address`: Wallet address

**Response:**
```json
{
  "success": true,
  "vc": { /* W3C VC JSON */ },
  "ipfs": {
    "documentCID": "Qm...",
    "documentURL": "https://gateway.pinata.cloud/ipfs/Qm...",
    "vcCID": "Qm...",
    "vcURL": "https://gateway.pinata.cloud/ipfs/Qm..."
  },
  "blockchain": {
    "txHash": "0x...",
    "blockNumber": 12345,
    "vcId": "1"
  },
  "documentHash": "abc123...",
  "bbsPublicKey": "base64_key"
}
```

#### GET `/bbs-public-key`
Get BBS+ public key

**Response:**
```json
{
  "success": true,
  "publicKey": "base64_encoded_key",
  "keyType": "BLS12-381-G2"
}
```

### Verification

#### POST `/verifyVC`
Verify VC from IPFS and blockchain

**Request:**
```json
{
  "cid": "Qm...",
  "documentHash": "abc123..."
}
```

**Response:**
```json
{
  "success": true,
  "verified": true,
  "structureValid": true,
  "ipfsValid": true,
  "blockchainValid": true,
  "hashMatch": true,
  "revoked": false,
  "details": {
    "issuer": "did:ethr:0x...",
    "blockchain": {
      "issuer": "0x...",
      "timestamp": "2025-01-01T00:00:00Z",
      "ipfsCID": "Qm...",
      "revoked": false
    }
  }
}
```

#### GET `/vc/:cid`
Retrieve VC JSON from IPFS

**Response:**
```json
{
  "success": true,
  "vc": { /* W3C VC JSON */ }
}
```

### Revocation

#### POST `/revokeVC`
Revoke a credential (issuer only)

**Request:**
```json
{
  "documentHash": "abc123...",
  "address": "0x..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "VC revoked successfully",
  "blockchain": {
    "txHash": "0x...",
    "blockNumber": 12346
  }
}
```

### Health Check

#### GET `/health`
Server health status

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-01-01T00:00:00Z",
  "services": {
    "bbsKeys": true,
    "ipfs": "configured",
    "blockchain": "ready",
    "walletBalance": "0.5"
  },
  "loggedInUsers": 3
}
```

## 🔐 Security Best Practices

1. **Never commit `.env` file** - Contains sensitive keys
2. **Use testnet wallets** - Never use mainnet private keys
3. **Rotate API keys** - Regularly update Pinata/Infura keys
4. **Validate inputs** - All endpoints validate user data
5. **Session management** - Implement proper session expiry
6. **Rate limiting** - Add rate limiting for production

## 🧪 Testing

Test individual components:

```bash
# Test IPFS connection
curl http://localhost:5000/health

# Test authentication
curl -X POST http://localhost:5000/login \
  -H "Content-Type: application/json" \
  -d '{"address":"0x...","message":"Login to DID App","signature":"0x..."}'
```

## 🐛 Troubleshooting

### IPFS Upload Fails
- Check Pinata API keys in `.env`
- Verify Pinata account has sufficient storage
- Test connection: `curl https://api.pinata.cloud/data/testAuthentication -H "pinata_api_key: YOUR_KEY" -H "pinata_secret_api_key: YOUR_SECRET"`

### Blockchain Transaction Fails
- Ensure wallet has sufficient Sepolia ETH
- Check RPC endpoint is accessible
- Verify contract address is correct
- Check gas price settings

### BBS+ Signature Fails
- Falls back to HMAC automatically
- Check `bbs-keys.json` exists and is valid
- Regenerate keys if corrupted

## 🔐 BBS+ Signature Upgrade (Node v20+ Support)

### ✅ Migration Complete

The backend has been upgraded from `@mattrglobal/bbs-signatures` to `@digitalbazaar/bbs-signatures` for full Node v20+ compatibility.

**Key Improvements:**
- ✅ **Node v20+ Compatible** - No WASM compatibility issues
- ✅ **Active Maintenance** - Digital Bazaar actively maintains the library
- ✅ **True BBS+ Signatures** - No fallback to HMAC required
- ✅ **Selective Disclosure** - Full support for zero-knowledge proofs
- ✅ **Better Performance** - Optimized for modern Node.js

### Testing BBS+ Signatures

Test the BBS+ implementation:

```bash
curl http://localhost:5000/test-bbs
```

**Expected Response:**
```json
{
  "success": true,
  "verified": true,
  "proofVerified": true,
  "message": "BBS+ signatures working correctly!",
  "details": {
    "signatureLength": 112,
    "proofLength": 368,
    "messagesCount": 3,
    "disclosedCount": 2
  }
}
```

### New Selective Disclosure Endpoints

#### POST `/createProof`
Create a selective disclosure proof from a VC

**Request:**
```json
{
  "vc": { /* Full VC JSON */ },
  "publicKey": "base64_public_key",
  "disclosedAttributes": ["name", "department"]
}
```

**Response:**
```json
{
  "success": true,
  "proof": "base64_proof",
  "disclosedAttributes": ["name", "department"],
  "disclosedIndexes": [0, 3],
  "message": "Selective disclosure proof created successfully"
}
```

#### POST `/verifyProof`
Verify a selective disclosure proof

**Request:**
```json
{
  "proof": "base64_proof",
  "publicKey": "base64_public_key",
  "disclosedMessages": ["John Doe", "Computer Science"],
  "disclosedIndexes": [0, 3]
}
```

**Response:**
```json
{
  "success": true,
  "verified": true,
  "message": "Proof is valid"
}
```

### Migration Notes

**What Changed:**
- Replaced `@mattrglobal/bbs-signatures` with `@digitalbazaar/bbs-signatures`
- Updated all signing/verification logic to use `TextEncoder`
- Added dynamic ESM import for CommonJS compatibility
- Removed HMAC fallback (no longer needed)
- Added selective disclosure proof generation and verification

**Breaking Changes:**
- Old saved keys in `bbs-keys.json` are still compatible
- Signature format remains W3C BbsBlsSignature2020 compliant
- API endpoints remain unchanged (backward compatible)

## 📚 Technology Stack

- **Express.js** - Web framework
- **Ethers.js v6** - Ethereum interaction
- **@digitalbazaar/bbs-signatures** - BBS+ signatures (Node v20+ compatible)
- **@pinata/sdk** - IPFS integration
- **Hardhat** - Smart contract development
- **Multer** - File upload handling
- **dotenv** - Environment configuration

## 📄 License

MIT

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Open pull request

## 📞 Support

For issues and questions, please open a GitHub issue.
