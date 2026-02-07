# 🚀 Quick Setup Guide

## Prerequisites

- Node.js v16+ installed
- MetaMask wallet with Sepolia testnet configured
- Pinata account (free tier works)
- Infura or Alchemy account (free tier works)

## Step-by-Step Setup

### 1️⃣ Install Dependencies

```bash
cd mydid/src/backend
npm install
```

### 2️⃣ Get Pinata API Keys

1. Go to [pinata.cloud](https://pinata.cloud)
2. Sign up for free account
3. Navigate to **API Keys** section
4. Click **New Key**
5. Give it a name (e.g., "DID App")
6. Enable **pinFileToIPFS** and **pinJSONToIPFS** permissions
7. Copy **API Key** and **API Secret**

### 3️⃣ Get Infura/Alchemy API Key

**Option A: Infura**
1. Go to [infura.io](https://infura.io)
2. Sign up and create new project
3. Select **Ethereum** → **Sepolia**
4. Copy **Project ID** (this is your API key)

**Option B: Alchemy**
1. Go to [alchemy.com](https://alchemy.com)
2. Sign up and create new app
3. Select **Ethereum** → **Sepolia**
4. Copy **API Key**

### 4️⃣ Get Sepolia Testnet ETH

1. Open MetaMask
2. Switch to **Sepolia Test Network**
3. Copy your wallet address
4. Visit [sepoliafaucet.com](https://sepoliafaucet.com) or [faucet.quicknode.com](https://faucet.quicknode.com/ethereum/sepolia)
5. Paste address and request ETH
6. Wait for confirmation (~1 minute)

### 5️⃣ Export MetaMask Private Key

⚠️ **IMPORTANT: Use a testnet-only wallet!**

1. Open MetaMask
2. Click three dots → **Account Details**
3. Click **Show Private Key**
4. Enter password
5. Copy private key (starts with `0x`)

### 6️⃣ Configure Environment

Create `.env` file:

```bash
cp .env.example .env
```

Edit `.env` and fill in your keys:

```env
# Pinata IPFS
PINATA_API_KEY=your_pinata_api_key_here
PINATA_SECRET_API_KEY=your_pinata_secret_here

# Ethereum Sepolia (choose one)
INFURA_API_KEY=your_infura_key_here
# OR
ALCHEMY_API_KEY=your_alchemy_key_here

# MetaMask Wallet
WALLET_PRIVATE_KEY=0x_your_private_key_here

# Server
PORT=5000
```

### 7️⃣ Deploy Smart Contract

Compile the contract:

```bash
npm run compile
```

Deploy to Sepolia:

```bash
npm run deploy
```

You'll see output like:

```
✅ VCRegistry deployed to: 0x1234567890abcdef...

📋 Add this to your .env file:
VC_CONTRACT_ADDRESS=0x1234567890abcdef...
```

Copy the contract address and add it to `.env`:

```env
VC_CONTRACT_ADDRESS=0x1234567890abcdef...
```

### 8️⃣ Start the Server

Development mode (auto-reload):

```bash
npm run dev
```

Or production mode:

```bash
npm start
```

You should see:

```
============================================================
🚀 Digital Identity Management Server
============================================================
📍 Server URL: http://localhost:5000
🔐 BBS+ Signatures: Enabled (BLS12-381)
📦 IPFS: Configured
⛓️  Blockchain: Connected (Sepolia)
============================================================
```

### 9️⃣ Test the Server

Open another terminal and test:

```bash
curl http://localhost:5000/health
```

Expected response:

```json
{
  "status": "healthy",
  "timestamp": "2025-01-01T00:00:00.000Z",
  "services": {
    "bbsKeys": true,
    "ipfs": "configured",
    "blockchain": "ready",
    "walletBalance": "0.5"
  },
  "loggedInUsers": 0
}
```

## ✅ Verification Checklist

- [ ] Dependencies installed (`node_modules/` exists)
- [ ] `.env` file created with all keys
- [ ] Pinata API keys working
- [ ] Infura/Alchemy API key working
- [ ] Wallet has Sepolia ETH (check balance in response)
- [ ] Smart contract deployed
- [ ] Contract address in `.env`
- [ ] Server starts without errors
- [ ] Health check returns "healthy"
- [ ] All services show as "configured" or "ready"

## 🐛 Common Issues

### "Pinata authentication failed"
- Double-check API keys in `.env`
- Ensure no extra spaces in keys
- Verify Pinata account is active

### "Insufficient funds for gas"
- Get more Sepolia ETH from faucet
- Wait for faucet transaction to confirm

### "Contract not initialized"
- Run `npm run deploy` first
- Add contract address to `.env`
- Restart server

### "BBS+ keys not initialized"
- Delete `bbs-keys.json` if corrupted
- Restart server to regenerate

### Port already in use
- Change `PORT` in `.env` to different number (e.g., 5001)
- Or kill process using port 5000

## 🎉 Next Steps

1. Start the frontend React app
2. Connect MetaMask
3. Issue your first Verifiable Credential
4. View it on IPFS
5. Verify it on blockchain

## 📞 Need Help?

- Check `README.md` for detailed API documentation
- Review error logs in terminal
- Ensure all prerequisites are met
- Verify `.env` configuration

Happy building! 🚀
