# Beta Access NFT Gating Setup

This marketplace is configured with NFT-gated access for beta testing. Only users who own a VOart VIP Pass NFT on the QL1 chain can access the platform.

## How It Works

1. **User connects wallet** - Standard Web3 wallet connection (MetaMask, WalletConnect, etc.)
2. **NFT ownership check** - System verifies the connected wallet owns at least 1 VOart VIP Pass NFT
3. **Access granted/denied** - Users with the NFT can access the marketplace, others see an access denied screen with a link to purchase

## Configuration

### VOart VIP Pass NFT Details

- **Contract Address:** `0x5e0fA84eEE57E64bbb6Fb15661442517B62eAFD1`
- **Network:** QL1 (Chain ID: 766)
- **Purchase Link:** https://thirdweb.com/ql1/0x5e0fA84eEE57E64bbb6Fb15661442517B62eAFD1

### Environment Variable

The contract address is already configured in `.env.example`:

\`\`\`bash
NEXT_PUBLIC_BETA_NFT_CONTRACT=0x5e0fA84eEE57E64bbb6Fb15661442517B62eAFD1
\`\`\`

**Important:** The variable must be prefixed with `NEXT_PUBLIC_` to be accessible in the browser.

### Deploy & Test

1. Deploy your app to Vercel
2. Connect with a wallet that owns the VOart VIP Pass NFT - should see full marketplace
3. Connect with a wallet that doesn't own the NFT - should see access denied screen with a link to purchase

## Development Mode

If `NEXT_PUBLIC_BETA_NFT_CONTRACT` is not set or set to `0x0000000000000000000000000000000000000000`, the gate is **disabled** and all users can access the platform. This is useful for local development.

## Customization

### Change Access Denied Message

Edit `/components/beta-access-guard.tsx` to customize:
- Purchase link for VOart VIP Pass
- Instructions for getting VIP access
- Visual design of the access denied screen

### Support Multiple NFT Collections

Modify `/hooks/use-nft-access.tsx` to check multiple contract addresses:

\`\`\`typescript
const BETA_NFT_CONTRACTS = [
  "0xContract1...",
  "0xContract2...",
]

// Check each contract and grant access if any balance > 0
\`\`\`

### Add Minimum Balance Requirement

Require users to own multiple NFTs:

\`\`\`typescript
// In use-nft-access.tsx
setState({
  hasAccess: balanceNumber >= 5, // Require 5+ NFTs
  // ...
})
\`\`\`

## Troubleshooting

### "Verification Error" appears

**Possible causes:**
- Invalid contract address
- Contract not deployed on QL1
- RPC endpoint issues
- Contract doesn't implement ERC-721 standard

**Solutions:**
1. Verify contract address is correct
2. Check contract on QL1 block explorer
3. Test contract `balanceOf()` function manually
4. Check browser console for detailed error logs

### Access denied for valid NFT holders

**Possible causes:**
- Wrong wallet connected
- NFT transferred after last check
- Network issues

**Solutions:**
1. Click "Refresh" button to re-check ownership
2. Verify wallet address matches NFT owner
3. Check QL1 RPC endpoint is responding

## Security Notes

- NFT ownership is checked client-side using ethers.js
- For production, consider adding server-side verification
- Results are not cached - checked on every page load
- No sensitive data is stored - only checks public blockchain state

## Removing Beta Access

To remove the NFT gate and make the marketplace public:

1. Remove `<BetaAccessGuard>` wrapper from `/app/layout.tsx`
2. Delete or comment out the environment variable
3. Redeploy

The marketplace will be accessible to all users without NFT verification.
