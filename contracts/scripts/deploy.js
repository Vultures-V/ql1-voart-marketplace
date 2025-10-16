const hre = require("hardhat")
const fs = require("fs")

function isValidAddress(address) {
  return hre.ethers.isAddress(address)
}

async function main() {
  console.log("🚀 Starting deployment to QL1 Chain...")
  console.log("=".repeat(60))

  let network
  let retries = 3
  while (retries > 0) {
    try {
      network = await hre.ethers.provider.getNetwork()
      break
    } catch (error) {
      retries--
      if (retries === 0) throw new Error(`❌ Failed to connect to network: ${error.message}`)
      console.log(`⚠️  Network connection failed, retrying... (${retries} attempts left)`)
      await new Promise((resolve) => setTimeout(resolve, 2000))
    }
  }

  console.log("🌐 Connected to network:", network.name, "(Chain ID:", network.chainId.toString(), ")")

  if (network.chainId !== 766n) {
    throw new Error(`❌ Wrong network! Expected chainId 766 (QL1), but got ${network.chainId}`)
  }
  console.log("✅ Network verification passed - Connected to QL1 Chain")

  // Get deployer account
  const [deployer] = await hre.ethers.getSigners()
  console.log("📍 Deploying contracts with account:", deployer.address)

  // Get deployer balance
  const balance = await hre.ethers.provider.getBalance(deployer.address)
  console.log("💰 Account balance:", hre.ethers.formatEther(balance), "QOM")

  const minBalance = hre.ethers.parseEther("0.1")
  if (balance < minBalance) {
    throw new Error("❌ Insufficient balance for deployment. Need at least 0.1 QOM")
  }

  console.log("=".repeat(60))

  const QOM_TOKEN_ADDRESS = process.env.QOM_TOKEN_ADDRESS
  const ADMIN_BUDGET_ADDRESS = process.env.ADMIN_BUDGET_ADDRESS

  if (!QOM_TOKEN_ADDRESS) {
    throw new Error("❌ QOM_TOKEN_ADDRESS environment variable is required")
  }

  if (!ADMIN_BUDGET_ADDRESS) {
    throw new Error("❌ ADMIN_BUDGET_ADDRESS environment variable is required")
  }

  if (!isValidAddress(QOM_TOKEN_ADDRESS)) {
    throw new Error(`❌ Invalid QOM_TOKEN_ADDRESS: ${QOM_TOKEN_ADDRESS}`)
  }

  if (!isValidAddress(ADMIN_BUDGET_ADDRESS)) {
    throw new Error(`❌ Invalid ADMIN_BUDGET_ADDRESS: ${ADMIN_BUDGET_ADDRESS}`)
  }

  console.log("⚙️  Configuration:")
  console.log("   QOM Token Address:", QOM_TOKEN_ADDRESS)
  console.log("   Admin Budget Address:", ADMIN_BUDGET_ADDRESS)
  console.log("=".repeat(60))

  const deploymentStartTime = Date.now()

  console.log("\n📦 Deploying NFTFactory contract...")
  const NFTFactory = await hre.ethers.getContractFactory("NFTFactory")
  const nftFactory = await NFTFactory.deploy()
  await nftFactory.waitForDeployment()
  const factoryAddress = await nftFactory.getAddress()

  const factoryDeployTx = nftFactory.deploymentTransaction()
  console.log("✅ NFTFactory deployed to:", factoryAddress)
  console.log("   Transaction Hash:", factoryDeployTx.hash)
  console.log("   Gas Used:", factoryDeployTx.gasLimit.toString())

  console.log("\n📦 Deploying OrigamiMarketplace contract...")
  const OrigamiMarketplace = await hre.ethers.getContractFactory("OrigamiMarketplace")
  const origamiMarketplace = await OrigamiMarketplace.deploy(
    QOM_TOKEN_ADDRESS,
    ADMIN_BUDGET_ADDRESS,
    factoryAddress, // Pass factory address to marketplace
  )
  await origamiMarketplace.waitForDeployment()
  const marketplaceAddress = await origamiMarketplace.getAddress()

  const marketplaceDeployTx = origamiMarketplace.deploymentTransaction()
  console.log("✅ OrigamiMarketplace deployed to:", marketplaceAddress)
  console.log("   Transaction Hash:", marketplaceDeployTx.hash)
  console.log("   Gas Used:", marketplaceDeployTx.gasLimit.toString())

  console.log("\n🔍 Verifying contract configuration...")
  try {
    const marketplaceQomToken = await origamiMarketplace.qomToken()
    const marketplaceAdminBudget = await origamiMarketplace.adminBudgetAddress()
    const marketplaceFactory = await origamiMarketplace.nftFactory() // Verify factory address
    const buyerCommission = await origamiMarketplace.BUYER_COMMISSION()
    const sellerCommission = await origamiMarketplace.SELLER_COMMISSION()
    const platformDonation = await origamiMarketplace.PLATFORM_DONATION() // Verify platform donation

    console.log("   QOM Token in Marketplace:", marketplaceQomToken)
    console.log("   Admin Budget in Marketplace:", marketplaceAdminBudget)
    console.log("   NFT Factory in Marketplace:", marketplaceFactory) // Log factory address
    console.log("   Buyer Commission:", buyerCommission.toString(), "(3%)")
    console.log("   Seller Commission:", sellerCommission.toString(), "(3%)")
    console.log("   Platform Donation:", platformDonation.toString(), "(1%)") // Log platform donation

    if (marketplaceQomToken.toLowerCase() !== QOM_TOKEN_ADDRESS.toLowerCase()) {
      console.warn("⚠️  Warning: QOM Token address mismatch!")
    }
    if (marketplaceAdminBudget.toLowerCase() !== ADMIN_BUDGET_ADDRESS.toLowerCase()) {
      console.warn("⚠️  Warning: Admin Budget address mismatch!")
    }
    if (marketplaceFactory.toLowerCase() !== factoryAddress.toLowerCase()) {
      // Verify factory address
      console.warn("⚠️  Warning: NFT Factory address mismatch!")
    }
    console.log("✅ Contract configuration verified")
  } catch (error) {
    console.warn("⚠️  Could not verify contract configuration:", error.message)
  }

  const deploymentDuration = ((Date.now() - deploymentStartTime) / 1000).toFixed(2)
  const minutes = Math.floor(deploymentDuration / 60)
  const seconds = (deploymentDuration % 60).toFixed(2)
  const timeDisplay = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`

  console.log("\n" + "=".repeat(60))
  console.log("🎉 Deployment Complete!")
  console.log("⏱️  Total deployment time:", timeDisplay)
  console.log("=".repeat(60))
  console.log("\n📋 Contract Addresses:")
  console.log("   NFTFactory:", factoryAddress)
  console.log("   OrigamiMarketplace:", marketplaceAddress)
  console.log("\n🔗 Block Explorer:")
  console.log("   Factory Contract:", `https://scan.qom.one/address/${factoryAddress}`)
  console.log("   Marketplace Contract:", `https://scan.qom.one/address/${marketplaceAddress}`)
  console.log("\n💡 Next Steps:")
  console.log("   1. Verify contracts on block explorer:")
  console.log("      npx hardhat verify --network ql1", factoryAddress)
  console.log(
    "      npx hardhat verify --network ql1",
    marketplaceAddress,
    QOM_TOKEN_ADDRESS,
    ADMIN_BUDGET_ADDRESS,
    factoryAddress,
  ) // Added factory address to verify command
  console.log("   2. Update frontend environment variables:")
  console.log("      NEXT_PUBLIC_NFT_FACTORY_ADDRESS=" + factoryAddress)
  console.log("      NEXT_PUBLIC_MARKETPLACE_ADDRESS=" + marketplaceAddress)
  console.log("   3. Test collection creation via NFTFactory")
  console.log("   4. Test minting and listing functionality")
  console.log("=".repeat(60))

  const deploymentInfo = {
    network: "ql1",
    chainId: 766,
    timestamp: new Date().toISOString(),
    deploymentDuration: timeDisplay,
    deployer: deployer.address,
    contracts: {
      NFTFactory: {
        address: factoryAddress,
        transactionHash: factoryDeployTx.hash,
        gasUsed: factoryDeployTx.gasLimit.toString(),
      },
      OrigamiMarketplace: {
        address: marketplaceAddress,
        transactionHash: marketplaceDeployTx.hash,
        gasUsed: marketplaceDeployTx.gasLimit.toString(),
      },
    },
    configuration: {
      qomTokenAddress: QOM_TOKEN_ADDRESS,
      adminBudgetAddress: ADMIN_BUDGET_ADDRESS,
      nftFactoryAddress: factoryAddress, // Added factory address to config
      buyerCommission: "300", // 3%
      sellerCommission: "300", // 3%
      platformDonation: "100", // 1%
    },
  }

  try {
    if (fs.existsSync("deployment-info.json")) {
      const backupName = `deployment-info.backup.${Date.now()}.json`
      fs.copyFileSync("deployment-info.json", backupName)
      console.log(`\n💾 Previous deployment info backed up to ${backupName}`)
    }

    fs.writeFileSync("deployment-info.json", JSON.stringify(deploymentInfo, null, 2))
    console.log("💾 Deployment info saved to deployment-info.json")
  } catch (error) {
    console.error("❌ Failed to save deployment info:", error.message)
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error)
    process.exit(1)
  })
