# QL1 Network Configuration

## Network Details

The VOart NFT Marketplace is built on the QL1 blockchain network with the following configuration:

### Network Information

- **Network Name**: QL1 Network
- **Chain ID**: 766 (decimal) / 0x2FE (hexadecimal)
- **RPC URL**: https://rpc.qom.one
- **Block Explorer**: https://scan.qom.one
- **Native Currency**: QOM
  - Symbol: QOM
  - Decimals: 18

### Adding QL1 Network to MetaMask

The marketplace automatically prompts users to add the QL1 network when connecting their wallet. However, you can also add it manually:

1. Open MetaMask
2. Click on the network dropdown (top center)
3. Click "Add Network"
4. Click "Add a network manually"
5. Enter the following details:
   - Network Name: `QL1 Network`
   - New RPC URL: `https://rpc.qom.one`
   - Chain ID: `766`
   - Currency Symbol: `QOM`
   - Block Explorer URL: `https://scan.qom.one`
6. Click "Save"

### QOM Token Contract

- **Contract Address**: 0xa26dfBF98Dd1A32FAe56A3D2B2D60A8a41b0bDF0
- **Token Standard**: ERC-20
- **Decimals**: 18
- **Symbol**: QOM

### Admin Wallet

- **Address**: 0x4A6c64a453BBF65E45C1c778241777d3ee4ddD1C
- **Purpose**: Platform administration and fee collection

### WalletConnect Configuration

- **Project ID**: f6bcdc0742cb0f9dcd115c6592f59322
- **Purpose**: Enables mobile wallet connections via QR codes and deep links
- **Get Your Own**: https://cloud.walletconnect.com

### Block Explorer Usage

View transactions, addresses, and contracts on the QL1 block explorer:

- **Address**: https://scan.qom.one/address/{address}
- **Transaction**: https://scan.qom.one/tx/{txHash}
- **Token**: https://scan.qom.one/token/{tokenAddress}

### Network Configuration in Code

The network configuration is centralized in `lib/network-config.ts` for easy maintenance and consistency across the application.

\`\`\`typescript
import { QL1_NETWORK } from "@/lib/network-config"

// Access network details
console.log(QL1_NETWORK.chainId) // 766
console.log(QL1_NETWORK.rpcUrl) // https://rpc.qom.one
console.log(QL1_NETWORK.blockExplorerUrl) // https://scan.qom.one
console.log(QL1_NETWORK.walletConnectProjectId) // f6bcdc0742cb0f9dcd115c6592f59322
\`\`\`

### Environment Variables

Required environment variables for QL1 network integration:

\`\`\`bash
QL1_RPC_URL=https://rpc.qom.one
PRIVATE_KEY=your_wallet_private_key_here
ADMIN_BUDGET_ADDRESS=0x4A6c64a453BBF65E45C1c778241777d3ee4ddD1C
QOM_TOKEN_ADDRESS=0xa26dfBF98Dd1A32FAe56A3D2B2D60A8a41b0bDF0
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=f6bcdc0742cb0f9dcd115c6592f59322
\`\`\`

### Network Validation

The marketplace automatically validates that users are connected to the correct network (Chain ID 766) and prompts them to switch if they're on a different network.

### Troubleshooting

**Issue**: Wallet won't connect to QL1 Network
- **Solution**: Ensure you're using a compatible wallet (MetaMask, Trust Wallet, etc.) and that the network has been added correctly

**Issue**: Transactions failing
- **Solution**: Verify you have sufficient QOM balance for gas fees and that you're connected to Chain ID 766

**Issue**: Block explorer not loading
- **Solution**: Ensure you're using the correct URL format: https://scan.qom.one (not http://)

**Issue**: WalletConnect not working
- **Solution**: Verify the WalletConnect Project ID is correctly configured in the environment variables

### Future Updates

When blockchain integration is complete, this configuration will be used for:
- Smart contract deployment
- NFT minting on-chain
- Marketplace transactions
- External NFT discovery
- Transaction verification
