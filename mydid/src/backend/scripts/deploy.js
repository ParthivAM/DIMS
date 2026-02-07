// scripts/deploy.js - Deploy VCRegistry contract to Sepolia
const hre = require("hardhat");

async function main() {
  console.log("\n🚀 Deploying VCRegistry contract to Sepolia...\n");

  // Get deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("📋 Deploying with account:", deployer.address);

  // Get account balance
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", hre.ethers.formatEther(balance), "ETH\n");

  // Deploy contract
  const VCRegistry = await hre.ethers.getContractFactory("VCRegistry");
  const vcRegistry = await VCRegistry.deploy();

  await vcRegistry.waitForDeployment();

  const contractAddress = await vcRegistry.getAddress();

  console.log("✅ VCRegistry deployed to:", contractAddress);
  console.log("\n📋 Add this to your .env file:");
  console.log(`VC_CONTRACT_ADDRESS=${contractAddress}`);
  console.log("\n⏳ Waiting for block confirmations...");

  // Wait for a few block confirmations
  await vcRegistry.deploymentTransaction().wait(5);

  console.log("✅ Contract deployment confirmed\n");

  // Verify on Etherscan (optional)
  if (process.env.ETHERSCAN_API_KEY) {
    console.log("🔍 Verifying contract on Etherscan...");
    try {
      await hre.run("verify:verify", {
        address: contractAddress,
        constructorArguments: [],
      });
      console.log("✅ Contract verified on Etherscan\n");
    } catch (error) {
      console.log("⚠️ Verification failed:", error.message, "\n");
    }
  }

  console.log("🎉 Deployment complete!\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
