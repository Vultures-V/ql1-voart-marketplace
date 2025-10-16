// Storage Whitelist Management System
export interface WhitelistEntry {
  address: string
  addedAt: string
  addedBy: string
  storageUsed: number
  nftsUploaded: number
}

class StorageWhitelistManager {
  private readonly STORAGE_KEY = "voart_storage_whitelist"
  private readonly MAX_STORAGE_PER_WALLET = 100

  isWhitelisted(walletAddress: string): boolean {
    if (!walletAddress) return false
    const whitelist = this.getWhitelist()
    return whitelist.some((entry) => entry.address.toLowerCase() === walletAddress.toLowerCase())
  }

  getWhitelist(): WhitelistEntry[] {
    if (typeof window === "undefined") return []
    try {
      const data = localStorage.getItem(this.STORAGE_KEY)
      return data ? JSON.parse(data) : []
    } catch (error) {
      console.error("Error loading whitelist:", error)
      return []
    }
  }

  addToWhitelist(walletAddress: string, adminAddress: string) {
    if (!walletAddress || !adminAddress) {
      return { success: false, message: "Invalid wallet or admin address" }
    }

    const whitelist = this.getWhitelist()

    if (this.isWhitelisted(walletAddress)) {
      return { success: false, message: "Wallet is already whitelisted" }
    }

    const newEntry: WhitelistEntry = {
      address: walletAddress,
      addedAt: new Date().toISOString(),
      addedBy: adminAddress,
      storageUsed: 0,
      nftsUploaded: 0,
    }

    whitelist.push(newEntry)
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(whitelist))

    return { success: true, message: "Wallet added to storage whitelist" }
  }

  removeFromWhitelist(walletAddress: string) {
    if (!walletAddress) {
      return { success: false, message: "Invalid wallet address" }
    }

    const whitelist = this.getWhitelist()
    const filtered = whitelist.filter((entry) => entry.address.toLowerCase() !== walletAddress.toLowerCase())

    if (filtered.length === whitelist.length) {
      return { success: false, message: "Wallet not found in whitelist" }
    }

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filtered))
    return { success: true, message: "Wallet removed from storage whitelist" }
  }

  bulkImport(addresses: string[], adminAddress: string) {
    let added = 0
    addresses.forEach((address) => {
      const result = this.addToWhitelist(address.trim(), adminAddress)
      if (result.success) added++
    })

    return {
      success: true,
      message: `Added ${added} out of ${addresses.length} addresses`,
      added,
    }
  }

  updateStorageUsage(walletAddress: string, fileSizeMB: number): void {
    const whitelist = this.getWhitelist()
    const entry = whitelist.find((e) => e.address.toLowerCase() === walletAddress.toLowerCase())

    if (entry) {
      entry.storageUsed += fileSizeMB
      entry.nftsUploaded += 1
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(whitelist))
    }
  }

  getStorageUsage(walletAddress: string) {
    const whitelist = this.getWhitelist()
    const entry = whitelist.find((e) => e.address.toLowerCase() === walletAddress.toLowerCase())

    const used = entry?.storageUsed || 0
    const limit = this.MAX_STORAGE_PER_WALLET
    const remaining = Math.max(0, limit - used)

    return { used, limit, remaining }
  }

  getTotalStats() {
    const whitelist = this.getWhitelist()
    const totalStorageUsed = whitelist.reduce((sum, entry) => sum + entry.storageUsed, 0)
    const totalNFTsUploaded = whitelist.reduce((sum, entry) => sum + entry.nftsUploaded, 0)

    return {
      totalWallets: whitelist.length,
      totalStorageUsed,
      totalNFTsUploaded,
      storageLimit: 5000,
    }
  }

  clearWhitelist() {
    localStorage.removeItem(this.STORAGE_KEY)
    return { success: true, message: "Whitelist cleared" }
  }
}

export const storageWhitelist = new StorageWhitelistManager()
