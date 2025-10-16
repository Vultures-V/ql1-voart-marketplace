# 🎴 VOart - NFT Marketplace

> A premium NFT marketplace on QL1 blockchain with exclusive Beta Access protection.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.20-orange)](https://soliditylang.org/)

## 🌟 Overview

VOart is a decentralized NFT marketplace built on the QL1 blockchain, featuring an elegant design and exclusive access control. The platform enables creators to mint, trade, and manage NFT collections with built-in royalty systems and community-driven features.

**🔐 Beta Access:** This marketplace requires ownership of the VOart VIP Pass NFT for access, ensuring an exclusive and curated community experience.

## ✨ Key Features

### 🎨 NFT Creation & Management
- **Smart Minting** - Create NFTs with rich metadata (name, description, category, rarity)
- **Collection Factory** - Deploy custom ERC-721 collections via smart contracts
- **IPFS Storage** - Decentralized storage via Web3.Storage
- **Royalty System** - Automatic creator royalties (0-5%) on all secondary sales
- **Multi-Format Support** - Images, audio, video, and 3D models

### 🏪 Marketplace Trading
- **Fixed-Price Listings** - List NFTs for sale with QOM tokens
- **Offer System** - Make and accept offers with expiry dates
- **Advanced Filtering** - Search by category, rarity, price, and more
- **Real-Time Pricing** - Live QOM price updates from QomSwap
- **Secure Transactions** - On-chain settlement with automatic fee distribution

### 🛡️ Security & Access Control
- **Beta Access Guard** - Requires VOart VIP Pass NFT (0x5e0fA84eEE57E64bbb6Fb15661442517B62eAFD1)
- **Whitelist System** - Admin-controlled marketplace access
- **Wallet Protection** - Secure MetaMask and WalletConnect integration
- **Smart Contract Audited** - Multiple security reviews and improvements

### 👤 User Features
- **Profile System** - Customizable profiles with avatar upload
- **Portfolio Tracking** - View owned NFTs, created items, and favorites
- **Activity History** - Track all marketplace interactions
- **Social Features** - Follow creators, favorite NFTs, and build collections

### 🎯 Admin Dashboard
- **User Management** - Verification, moderation, and permissions
- **Analytics** - Platform statistics and QOM price monitoring
- **Whitelist Control** - Manage marketplace access
- **Reports System** - Handle user reports and disputes
- **Transaction Settings** - Configure platform fees (UI ready, blockchain integration pending)

## 🏗️ Tech Stack

**Frontend:**
- Next.js 15 (App Router)
- React 18 with TypeScript
- Tailwind CSS v4
- shadcn/ui components
- SWR for data fetching

**Blockchain:**
- QL1 Chain (Chain ID: 766)
- Solidity 0.8.20
- Hardhat development environment
- ethers.js v6

**Storage & APIs:**
- IPFS via Web3.Storage
- QomSwap API for price feeds
- localStorage (blockchain integration in progress)

**Wallet Integration:**
- MetaMask
- WalletConnect v2

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- MetaMask or WalletConnect-compatible wallet
- VOart VIP Pass NFT (for marketplace access)
- QOM tokens for gas fees

### Installation

\`\`\`bash
# Clone the repository
git clone https://github.com/yourusername/voart-marketplace.git
cd voart-marketplace

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your configuration (see below)

# Run development server
npm run dev
\`\`\`

Visit `http://localhost:3000` to see the marketplace.

### Environment Variables

Create a `.env.local` file with the following variables:

\`\`\`env
# QL1 Network Configuration
QL1_RPC_URL=https://rpc.qom.one
PRIVATE_KEY=your_private_key_here

# Token Addresses
QOM_TOKEN_ADDRESS=0xa26dfBF98Dd1A32FAe56A3D2B2D60A8a41b0bDF0
ADMIN_BUDGET_ADDRESS=0x4A6c64a453BBF65E45C1c778241777d3ee4ddD1C

# Beta Access (VOart VIP Pass NFT)
NEXT_PUBLIC_BETA_NFT_CONTRACT=0x5e0fA84eEE57E64bbb6Fb15661442517B62eAFD1

# API Keys (get from respective services)
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id
WEB3_STORAGE_API_KEY=your_web3_storage_api_key

# Contract Addresses (after deployment)
NEXT_PUBLIC_NFT_FACTORY_ADDRESS=0x0000000000000000000000000000000000000000
NEXT_PUBLIC_MARKETPLACE_ADDRESS=0x0000000000000000000000000000000000000000
NEXT_PUBLIC_NFT_CONTRACT_ADDRESS=0x0000000000000000000000000000000000000000
\`\`\`

**Get API Keys:**
- WalletConnect Project ID: https://cloud.walletconnect.com
- Web3.Storage API Key: https://web3.storage

## 📁 Project Structure

\`\`\`
voart-marketplace/
├── app/                      # Next.js app directory
│   ├── marketplace/          # NFT marketplace page
│   ├── mint/                 # NFT minting interface
│   ├── create-collection/    # Collection creation
│   ├── profile/              # User profile & portfolio
│   ├── admin/                # Admin dashboard
│   └── nft/[id]/            # NFT detail pages
├── components/               # React components
│   ├── ui/                   # shadcn/ui components
│   ├── navigation.tsx        # Main navigation
│   ├── beta-access-guard.tsx # VIP Pass verification
│   └── ...
├── contracts/                # Solidity smart contracts
│   ├── OrigamiNFT.sol       # ERC-721 NFT contract
│   ├── OrigamiMarketplace.sol # Marketplace contract
│   ├── NFTFactory.sol       # Collection factory
│   └── scripts/             # Deployment scripts
├── lib/                      # Utility libraries
│   ├── storage-*.ts         # Data management
│   ├── contract-abis.ts     # Contract interfaces
│   └── network-config.ts    # Blockchain config
├── hooks/                    # React hooks
│   ├── use-wallet.tsx       # Wallet connection
│   └── use-nft-access.tsx   # Beta access check
└── public/                   # Static assets
\`\`\`

## 💰 Fee Structure

**Trading Fees:**
- Buyer Commission: 3% of sale price
- Seller Commission: 3% of sale price
- Platform Donation: 1% (deducted from creator royalty)
- **Total Platform Fees: 6%**

**Creator Royalties:**
- Configurable: 0-5% on secondary sales
- Automatically enforced on-chain
- Distributed to original creator

**Collection & Minting Fees:**
- **Collection Creation:** Admin-adjustable (set via Admin Dashboard upon launch)
- **NFT Minting:** Admin-adjustable (set via Admin Dashboard upon launch)
- Platform administrators can configure these fees in QOM tokens through the Transaction Settings panel
- Fees will be determined and announced when the marketplace goes live with full blockchain integration
- Currently set to FREE during development phase

All fees are automatically distributed via smart contracts.

## 🔗 Network Information

- **Network Name:** QL1 Chain
- **Chain ID:** 766
- **RPC URL:** https://rpc.qom.one
- **Block Explorer:** https://scan.qom.one
- **Native Token:** QOM
- **QOM Token Contract:** 0xa26dfBF98Dd1A32FAe56A3D2B2D60A8a41b0bDF0

**Add QL1 to MetaMask:**
The marketplace will automatically prompt you to add the QL1 network when you connect your wallet.

## 📜 Smart Contracts

### OrigamiNFT.sol
ERC-721 compliant NFT contract with:
- Rich metadata (name, description, category, rarity, creator)
- ERC-2981 royalty standard support
- Minter role management
- Maximum 10,000 NFTs per collection
- Pausable for emergency stops

### OrigamiMarketplace.sol
Decentralized marketplace with:
- Fixed-price listings with QOM tokens
- Offer system with expiration dates
- Automatic commission distribution (3% + 3%)
- Royalty enforcement on all sales
- Whitelist support for controlled access (VOart VIP Pass NFT holders receive priority)
- Emergency pause functionality

### NFTFactory.sol
Factory pattern for collection deployment:
- Deploy new OrigamiNFT collections
- Track all deployed collections
- Creator collection management
- Maximum 100 collections per creator
- Whitelist and pause controls

**Security Features:**
- ReentrancyGuard on all state-changing functions
- Access control with OpenZeppelin
- Pausable for emergency situations
- Multiple security audits completed

## 🛠️ Development

\`\`\`bash
# Development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Type checking
npm run type-check

# Linting
npm run lint
\`\`\`

### Smart Contract Development

\`\`\`bash
# Compile contracts
cd contracts
npx hardhat compile

# Run tests
npx hardhat test

# Deploy to QL1
npx hardhat run scripts/deploy.js --network ql1

# Verify contracts
npx hardhat verify --network ql1 <contract_address>
\`\`\`

## 📊 Current Status

**✅ Completed:**
- Frontend UI/UX (100%)
- Smart contracts (audited & production-ready)
- Wallet integration (MetaMask, WalletConnect)
- Beta Access Guard (VOart VIP Pass NFT)
- Admin dashboard
- Profile system
- QOM price integration

**🚧 In Progress:**
- Blockchain integration (frontend → contracts)
- Database integration (Supabase/Neon)
- Contract deployment to QL1 mainnet

**📋 Roadmap:**
- Mobile app (React Native)
- Advanced analytics
- Social features expansion
- Multi-chain support
- DAO governance

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

**Ways to contribute:**
- Report bugs and issues
- Suggest new features
- Improve documentation
- Submit pull requests
- Share feedback

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## 🔒 Security

Security is our top priority. If you discover a security vulnerability, please email **venturesvone@gmail.com** instead of opening a public issue.

**Security measures:**
- Smart contract audits completed
- Environment variables for sensitive data
- Beta Access Guard protection
- Regular security updates

## 📞 Support & Community

- **GitHub Issues:** [Report bugs](https://github.com/yourusername/voart-marketplace/issues)
- **Documentation:** See `/docs` folder
- **Twitter:** [@VVOART](https://twitter.com/VVOART)
- **Telegram:** [Join our community](https://t.me/VulturesVLT)
- **Website:** [voart.io]

## 🙏 Acknowledgments

- Built on QL1 blockchain ecosystem
- Powered by QOM token
- IPFS storage via Web3.Storage
- UI components from shadcn/ui
- Icons from Lucide React

---

**Created by VulturesV on the VOart Marketplace**
