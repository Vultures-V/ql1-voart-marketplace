# Origami NFT Marketplace - Contract Deployment Guide

## Prerequisites

Before deploying, ensure you have:

1. **QL1 Wallet with QOM tokens** for gas fees
2. **Private Key** from your wallet
3. **QOM Token Address** on QL1 chain
4. **Admin Budget Address** (your wallet address to receive platform fees)

## Environment Variables

You already have these set in your v0 project:

- `QL1_RPC_URL` - QL1 blockchain RPC endpoint (https://rpc.qom.one)
- `PRIVATE_KEY` - Your wallet's private key (KEEP SECRET!)
- `QOM_TOKEN_ADDRESS` - QOM token contract address on QL1 (0xa26dfBF98Dd1A32FAe56A3D2B2D60A8a41b0bDF0)
- `ADMIN_BUDGET_ADDRESS` - Address to receive platform fees (7% total: 3% buyer + 3% seller + 1% donation)

## Deployment Steps

### Step 1: Compile Contracts

First, compile the Solidity contracts to check for errors:

\`\`\`bash
npm run compile:contracts
\`\`\`

This will:
- Compile `OrigamiNFT.sol`
- Compile `OrigamiMarketplace.sol`
- Generate contract ABIs in `contracts/artifacts/`

### Step 2: Deploy to QL1 Blockchain

Deploy both contracts to the QL1 chain:

\`\`\`bash
npm run deploy:contracts
\`\`\`

The deployment script will:
1. ✅ Verify you're connected to QL1 (Chain ID 766)
2. ✅ Check your wallet balance
3. ✅ Deploy OrigamiNFT contract
4. ✅ Deploy OrigamiMarketplace contract
5. ✅ Verify contract configuration
6. ✅ Save deployment info to `deployment-info.json`

### Step 3: Copy Contract Addresses

After successful deployment, you'll see output like:

\`\`\`bash
📋 Contract Addresses:
   OrigamiNFT: 0x1234567890abcdef1234567890abcdef12345678
   OrigamiMarketplace: 0xabcdef1234567890abcdef1234567890abcdef12
\`\`\`

### Step 4: Add Addresses to Environment Variables

Add these two environment variables to your v0 project:

1. **NEXT_PUBLIC_NFT_CONTRACT_ADDRESS**
   - Copy the OrigamiNFT address from deployment output

2. **NEXT_PUBLIC_MARKETPLACE_CONTRACT_ADDRESS**
   - Copy the OrigamiMarketplace address from deployment output

## Verification

After deployment, verify your contracts on the QL1 block explorer:

- NFT Contract: `https://scan.qom.one/address/[NFT_ADDRESS]`
- Marketplace Contract: `https://scan.qom.one/address/[MARKETPLACE_ADDRESS]`

## Troubleshooting

### "Insufficient funds for gas"
- Your wallet needs QOM tokens to pay for deployment gas fees
- Get QOM tokens from a QL1 faucet or exchange

### "Wrong network"
- Ensure `QL1_RPC_URL` is set to `https://rpc.qom.one`
- Check that you're connected to Chain ID 766

### "Invalid QOM_TOKEN_ADDRESS"
- Verify the QOM token address is correct for QL1 chain
- Check it's a valid Ethereum address format

### "Deployment failed"
- Check your private key is correct
- Ensure you have enough QOM for gas
- Verify RPC endpoint is accessible

## What Happens After Deployment?

Once deployed and environment variables are set:

1. ✅ Users can connect their wallets (MetaMask, etc.)
2. ✅ Users can mint origami NFTs
3. ✅ Users can list NFTs for sale
4. ✅ Users can buy NFTs with QOM tokens
5. ✅ Platform automatically collects 7% total fees (3% buyer + 3% seller + 1% donation)
6. ✅ Creators receive royalties (0-5%)

## Security Notes

- **NEVER share your PRIVATE_KEY**
- **NEVER commit .env files to git**
- The deployment script saves addresses to `deployment-info.json` for reference
- Keep this file safe - you'll need these addresses to interact with your contracts

## Next Steps

After deployment:
1. Test minting an NFT
2. Test listing an NFT for sale
3. Test buying an NFT
4. Verify commission payments to admin budget address
5. Check royalty payments to creators
