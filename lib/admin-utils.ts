// Admin utility functions for managing admin permissions across the marketplace

export const ADMIN_WALLET_ADDRESSES = [
  "0x4A6c64a453BBF65E45C1c778241777d3ee4ddD1C", // Primary admin wallet
]

/**
 * Check if a wallet address has admin privileges
 * Performs case-insensitive comparison since Ethereum addresses are case-insensitive
 */
export function isAdminWallet(address: string | null | undefined): boolean {
  if (!address) return false

  const normalizedAddress = address.toLowerCase()
  return ADMIN_WALLET_ADDRESSES.some((adminAddress) => adminAddress.toLowerCase() === normalizedAddress)
}

/**
 * Get admin wallet addresses (for display purposes)
 */
export function getAdminWallets(): string[] {
  return [...ADMIN_WALLET_ADDRESSES]
}

/**
 * Add a new admin wallet address
 */
export function addAdminWallet(address: string): void {
  if (!ADMIN_WALLET_ADDRESSES.includes(address)) {
    ADMIN_WALLET_ADDRESSES.push(address)
  }
}

/**
 * Remove an admin wallet address
 */
export function removeAdminWallet(address: string): void {
  const index = ADMIN_WALLET_ADDRESSES.findIndex((addr) => addr.toLowerCase() === address.toLowerCase())
  if (index > -1) {
    ADMIN_WALLET_ADDRESSES.splice(index, 1)
  }
}
