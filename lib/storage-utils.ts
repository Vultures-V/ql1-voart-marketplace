/**
 * Storage utility to handle localStorage quota limits
 * Implements efficient data storage and retrieval with error handling
 */

export class StorageManager {
  /**
   * Safely set item in localStorage with quota error handling
   */
  static setItem(key: string, value: any): boolean {
    try {
      const serialized = JSON.stringify(value)
      localStorage.setItem(key, serialized)
      return true
    } catch (error) {
      if (error instanceof DOMException && error.name === "QuotaExceededError") {
        console.error("[v0] localStorage quota exceeded for key:", key)
        // Attempt to free up space
        this.cleanupOldData()

        // Try again after cleanup
        try {
          localStorage.setItem(key, JSON.stringify(value))
          return true
        } catch (retryError) {
          console.error("[v0] Still failed after cleanup:", retryError)
          return false
        }
      }
      console.error("[v0] Error setting localStorage:", error)
      return false
    }
  }

  /**
   * Get item from localStorage with error handling
   */
  static getItem<T>(key: string, defaultValue: T): T {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : defaultValue
    } catch (error) {
      console.error("[v0] Error getting localStorage:", error)
      return defaultValue
    }
  }

  /**
   * Store user-owned NFTs efficiently (only essential data)
   */
  static setUserOwnedNFTs(address: string, nfts: any[]): boolean {
    // Store only essential data to reduce storage size
    const compactNFTs = nfts.map((nft) => ({
      id: nft.id,
      name: nft.name,
      price: nft.price,
      currency: nft.currency,
      creator: nft.creator,
      purchasedAt: nft.purchasedAt,
      purchasePrice: nft.purchasePrice,
      // Don't store image data or large descriptions
    }))

    return this.setItem(`user-owned-${address}`, compactNFTs)
  }

  /**
   * Get user-owned NFTs and merge with full NFT data from marketplace
   */
  static getUserOwnedNFTs(address: string): any[] {
    const compactNFTs = this.getItem<any[]>(`user-owned-${address}`, [])
    const allNFTs = this.getItem<any[]>("marketplace-nfts", [])

    return compactNFTs
      .map((compact) => {
        const fullNFT = allNFTs.find((nft) => nft.id === compact.id)
        // Only return NFTs that still exist in the marketplace
        return fullNFT ? { ...fullNFT, ...compact } : null
      })
      .filter((nft) => nft !== null) // Remove null entries for deleted NFTs
  }

  /**
   * Clean up old or unnecessary data to free space
   */
  static cleanupOldData(): void {
    try {
      // Remove old price cache if exists
      const priceUpdated = localStorage.getItem("qom_price_updated")
      if (priceUpdated) {
        const lastUpdate = new Date(priceUpdated)
        const daysSinceUpdate = (Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24)
        if (daysSinceUpdate > 7) {
          localStorage.removeItem("qom_usd_rate")
          localStorage.removeItem("qom_price_source")
          localStorage.removeItem("qom_price_updated")
        }
      }

      // Limit user likes to last 100 items per user
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith("user-likes-")) {
          const likes = this.getItem<number[]>(key, [])
          if (likes.length > 100) {
            this.setItem(key, likes.slice(-100))
          }
        }
      })

      console.log("[v0] Storage cleanup completed")
    } catch (error) {
      console.error("[v0] Error during cleanup:", error)
    }
  }

  /**
   * Get current storage usage information
   */
  static getStorageInfo(): { used: number; available: number; percentage: number } {
    let used = 0
    for (const key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        used += localStorage[key].length + key.length
      }
    }

    // Most browsers limit localStorage to 5-10MB
    const available = 5 * 1024 * 1024 // 5MB estimate
    const percentage = (used / available) * 100

    return { used, available, percentage }
  }

  /**
   * Check if storage is near quota limit
   */
  static isStorageNearLimit(): boolean {
    const { percentage } = this.getStorageInfo()
    return percentage > 80 // Warning if over 80%
  }

  /**
   * Synchronize voart_nfts storage with marketplace-nfts
   * This ensures backward compatibility while unifying storage
   */
  static synchronizeNFTStorage(): void {
    try {
      const marketplaceNFTs = this.getItem<any[]>("marketplace-nfts", [])

      // Update voart_nfts to match marketplace-nfts
      this.setItem("voart_nfts", marketplaceNFTs)

      console.log("[v0] NFT storage synchronized:", marketplaceNFTs.length, "NFTs")
    } catch (error) {
      console.error("[v0] Error synchronizing NFT storage:", error)
    }
  }

  /**
   * Get all NFTs from unified storage
   * Reads from marketplace-nfts as the source of truth
   */
  static getAllNFTs(): any[] {
    return this.getItem<any[]>("marketplace-nfts", [])
  }

  /**
   * Set all NFTs to unified storage
   * Writes to both marketplace-nfts and voart_nfts for compatibility
   */
  static setAllNFTs(nfts: any[]): boolean {
    const success = this.setItem("marketplace-nfts", nfts)
    if (success) {
      // Keep voart_nfts in sync
      this.setItem("voart_nfts", nfts)
    }
    return success
  }

  /**
   * Remove NFT from user's owned collection
   */
  static removeUserOwnedNFT(address: string, nftId: number): boolean {
    try {
      const ownedNFTs = this.getItem<any[]>(`user-owned-${address}`, [])
      const updatedNFTs = ownedNFTs.filter((nft) => nft.id !== nftId)
      return this.setItem(`user-owned-${address}`, updatedNFTs)
    } catch (error) {
      console.error("[v0] Error removing owned NFT:", error)
      return false
    }
  }

  /**
   * Clean up orphaned NFT references across all user-owned storage
   * Removes references to NFTs that no longer exist in marketplace
   */
  static cleanupOrphanedNFTReferences(): number {
    try {
      const allNFTs = this.getItem<any[]>("marketplace-nfts", [])
      const validNFTIds = new Set(allNFTs.map((nft) => nft.id))
      let cleanedCount = 0

      // Find all user-owned storage keys
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith("user-owned-")) {
          const ownedNFTs = this.getItem<any[]>(key, [])
          const originalLength = ownedNFTs.length

          // Filter out NFTs that don't exist in marketplace anymore
          const cleanedNFTs = ownedNFTs.filter((nft) => validNFTIds.has(nft.id))

          if (cleanedNFTs.length < originalLength) {
            this.setItem(key, cleanedNFTs)
            cleanedCount += originalLength - cleanedNFTs.length
          }
        }
      })

      if (cleanedCount > 0) {
        console.log(`[v0] Cleaned up ${cleanedCount} orphaned NFT reference(s)`)
      }

      return cleanedCount
    } catch (error) {
      console.error("[v0] Error cleaning up orphaned NFT references:", error)
      return 0
    }
  }
}
