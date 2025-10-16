# Origami NFT Marketplace Smart Contracts

Smart contracts for the Origami NFT Marketplace on QL1 Chain.

## Contracts

### OrigamiNFT.sol
ERC721 NFT contract with:
- Lazy minting support
- EIP-2981 royalty standard (0-5% creator royalties)
- Category and rarity tracking
- Metadata storage

### OrigamiMarketplace.sol
Marketplace contract with:
- Buy/sell functionality
- Offer system
- 7% platform fee (3% buyer + 3% seller + 1% royalty donation)
- Whitelist support for restricted access
- Automatic royalty distribution
- QOM token payments

### NFTFactory.sol
Factory contract for deploying user collections

## Quick Start

### 1. Compile Contracts

\`\`\`bash
npm run compile:contracts
\`\`\`

### 2. Deploy to QL1

\`\`\`bash
npm run deploy:contracts
\`\`\`

The deployment script will automatically use your environment variables from v0 project settings.

### 3. Get Contract Addresses

After deployment, copy the addresses from the output and add them to your v0 environment variables:
- `NEXT_PUBLIC_NFT_CONTRACT_ADDRESS`
- `NEXT_PUBLIC_MARKETPLACE_CONTRACT_ADDRESS`
- `NEXT_PUBLIC_FACTORY_CONTRACT_ADDRESS`

## Environment Variables

Required (already set in v0):
- `QL1_RPC_URL` - QL1 RPC endpoint (https://rpc.qom.one)
- `PRIVATE_KEY` - Deployer wallet private key
- `QOM_TOKEN_ADDRESS` - QOM token contract address
- `ADMIN_BUDGET_ADDRESS` - Platform fee recipient address

## Contract Features

### Platform Fees
- 7% total commission on sales
- 3% paid by buyer
- 3% paid by seller
- 1% platform donation (deducted from royalty)
- Automatically sent to ADMIN_BUDGET_ADDRESS

**Example:** 100 QOM sale with 5% royalty
- Buyer pays: 103 QOM (100 + 3%)
- Seller receives: ~92 QOM (100 - 3% - 5% royalty)
- Creator receives: 4 QOM (5% - 1% donation)
- Platform receives: 7 QOM (3% + 3% + 1%)

### Creator Royalties
- 0-5% royalty per NFT (set by creator)
- 1% platform donation deducted from royalty
- Automatically distributed on secondary sales
- EIP-2981 compliant

### Whitelist System
- Optional access control for marketplace
- Admin can enable/disable whitelist
- Admin can add/remove addresses
- Batch operations supported
- When enabled, only whitelisted addresses can list/buy NFTs

### Security
- ReentrancyGuard on all payment functions
- Ownable for admin functions
- SafeERC20 for token transfers
- Whitelist access control

## Verification

After deployment, verify contracts on QL1 block explorer:
- https://scan.qom.one/address/[CONTRACT_ADDRESS]

## Troubleshooting

See `DEPLOYMENT_GUIDE.md` for detailed troubleshooting steps.
