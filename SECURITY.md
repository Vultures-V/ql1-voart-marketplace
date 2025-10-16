# Security Guidelines for VOART NFT Marketplace

## Sensitive Information Protection

This document outlines how to handle sensitive information when working with this project.

## Environment Variables

### DO NOT Commit These Files:
- `.env`
- `.env.local`
- `.env.production`
- Any file containing real API keys, private keys, or secrets

### SAFE to Commit:
- `.env.example` - Template with placeholder values
- `.env.local.example` - Template with placeholder values

## Required Environment Variables

### Critical Secrets (NEVER share publicly):

1. **PRIVATE_KEY**
   - Your wallet's private key for contract deployment
   - Get from MetaMask: Account Details > Export Private Key
   - NEVER commit this to GitHub
   - NEVER share with anyone

2. **WEB3_STORAGE_API_KEY**
   - Your Web3.Storage API key for IPFS uploads
   - Get from: https://web3.storage
   - Keep this secret

### Public Configuration (Safe to share):

These addresses are public on the blockchain and safe to commit:
- `QOM_TOKEN_ADDRESS` - QOM token contract (public)
- `ADMIN_BUDGET_ADDRESS` - Admin wallet address (public)
- `NEXT_PUBLIC_BETA_NFT_CONTRACT` - Beta NFT contract (public)
- `NEXT_PUBLIC_NFT_FACTORY_CONTRACT_ADDRESS` - Factory contract (public)
- `NEXT_PUBLIC_MARKETPLACE_CONTRACT_ADDRESS` - Marketplace contract (public)

## Before Pushing to GitHub

### Checklist:

1. Verify `.env` and `.env.local` are in `.gitignore`
2. Check that `.env.example` has placeholder values only
3. Search for hardcoded secrets in code:
   \`\`\`bash
   grep -r "PRIVATE_KEY" --include="*.ts" --include="*.tsx" --include="*.js"
   grep -r "API_KEY" --include="*.ts" --include="*.tsx" --include="*.js"
   \`\`\`
4. Ensure no real private keys or API keys are in the code
5. Review git status before committing:
   \`\`\`bash
   git status
   \`\`\`

## Setup for New Developers

1. Clone the repository
2. Copy `.env.local.example` to `.env.local`:
   \`\`\`bash
   cp .env.local.example .env.local
   \`\`\`
3. Fill in your own values in `.env.local`
4. NEVER commit `.env.local`

## What to Do If You Accidentally Commit Secrets

1. **Immediately rotate/regenerate the exposed secret**
   - Private Key: Create new wallet, transfer funds
   - API Key: Regenerate on the service provider
2. Remove the secret from git history:
   \`\`\`bash
   git filter-branch --force --index-filter \
   "git rm --cached --ignore-unmatch .env" \
   --prune-empty --tag-name-filter cat -- --all
   \`\`\`
3. Force push (if repository is private and you're the only user)
4. Notify team members if applicable

## Hardcoded Values in Code

The following addresses are hardcoded in the code and are SAFE (they're public blockchain addresses):

- Admin Budget Address: `0x4A6c64a453BBF65E45C1c778241777d3ee4ddD1C`
- QOM Token: `0xa26dfBF98Dd1A32FAe56A3D2B2D60A8a41b0bDF0`
- Beta NFT Contract: `0x5e0fA84eEE57E64bbb6Fb15661442517B62eAFD1`
- QomSwap Pool: `0xA21d14Fe48f48556f760Fa173aE9Bc3f6a996C5B`

These are public on the QL1 blockchain and cannot be used to steal funds or access private data.

## Questions?

If you're unsure whether something is safe to commit, ask first or err on the side of caution and keep it in environment variables.
