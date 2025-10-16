// NFT Management utilities for creators
export interface NFTManagementAction {
  type: "delist" | "hide" | "transfer" | "burn"
  nftId: number
  targetAddress?: string
  reason?: string
}

export interface NFTStatus {
  isListed: boolean
  isHidden: boolean
  isBurned: boolean
  isTransferred: boolean
}

export class NFTManager {
  private static getStorageKey(address: string, type: string): string {
    return `user-${type}-${address}`
  }

  // Delist NFT from marketplace (remove from sale but keep ownership)
  static delistNFT(nftId: number, userAddress: string): boolean {
    try {
      // Remove from marketplace listings
      const marketplaceNFTs = JSON.parse(localStorage.getItem("marketplace-nfts") || "[]")
      const updatedMarketplace = marketplaceNFTs.map((nft: any) =>
        nft.id === nftId ? { ...nft, status: "delisted" } : nft,
      )
      localStorage.setItem("marketplace-nfts", JSON.stringify(updatedMarketplace))

      // Add to delisted NFTs tracking
      const delistedNFTs = JSON.parse(localStorage.getItem(this.getStorageKey(userAddress, "delisted")) || "[]")
      if (!delistedNFTs.includes(nftId)) {
        delistedNFTs.push(nftId)
        localStorage.setItem(this.getStorageKey(userAddress, "delisted"), JSON.stringify(delistedNFTs))
      }

      return true
    } catch (error) {
      console.error("Error delisting NFT:", error)
      return false
    }
  }

  // Re-list a delisted NFT
  static relistNFT(nftId: number, userAddress: string, price: string): boolean {
    try {
      // Update marketplace status
      const marketplaceNFTs = JSON.parse(localStorage.getItem("marketplace-nfts") || "[]")
      const updatedMarketplace = marketplaceNFTs.map((nft: any) =>
        nft.id === nftId ? { ...nft, status: "listed", price } : nft,
      )
      localStorage.setItem("marketplace-nfts", JSON.stringify(updatedMarketplace))

      // Remove from delisted tracking
      const delistedNFTs = JSON.parse(localStorage.getItem(this.getStorageKey(userAddress, "delisted")) || "[]")
      const updatedDelisted = delistedNFTs.filter((id: number) => id !== nftId)
      localStorage.setItem(this.getStorageKey(userAddress, "delisted"), JSON.stringify(updatedDelisted))

      return true
    } catch (error) {
      console.error("Error relisting NFT:", error)
      return false
    }
  }

  // Hide NFT from profile display
  static hideNFT(nftId: number, userAddress: string): boolean {
    try {
      const hiddenNFTs = JSON.parse(localStorage.getItem(this.getStorageKey(userAddress, "hidden")) || "[]")
      if (!hiddenNFTs.includes(nftId)) {
        hiddenNFTs.push(nftId)
        localStorage.setItem(this.getStorageKey(userAddress, "hidden"), JSON.stringify(hiddenNFTs))
      }
      return true
    } catch (error) {
      console.error("Error hiding NFT:", error)
      return false
    }
  }

  // Unhide NFT
  static unhideNFT(nftId: number, userAddress: string): boolean {
    try {
      const hiddenNFTs = JSON.parse(localStorage.getItem(this.getStorageKey(userAddress, "hidden")) || "[]")
      const updatedHidden = hiddenNFTs.filter((id: number) => id !== nftId)
      localStorage.setItem(this.getStorageKey(userAddress, "hidden"), JSON.stringify(updatedHidden))
      return true
    } catch (error) {
      console.error("Error unhiding NFT:", error)
      return false
    }
  }

  // Transfer NFT to another address
  static transferNFT(nftId: number, fromAddress: string, toAddress: string): boolean {
    try {
      // Remove from current owner's NFTs
      const fromNFTs = JSON.parse(localStorage.getItem(this.getStorageKey(fromAddress, "nfts")) || "[]")
      const nftToTransfer = fromNFTs.find((nft: any) => nft.id === nftId)

      if (!nftToTransfer) return false

      const updatedFromNFTs = fromNFTs.filter((nft: any) => nft.id !== nftId)
      localStorage.setItem(this.getStorageKey(fromAddress, "nfts"), JSON.stringify(updatedFromNFTs))

      // Add to new owner's NFTs
      const toNFTs = JSON.parse(localStorage.getItem(this.getStorageKey(toAddress, "owned")) || "[]")
      toNFTs.push({
        ...nftToTransfer,
        transferredAt: new Date().toISOString(),
        previousOwner: fromAddress,
      })
      localStorage.setItem(this.getStorageKey(toAddress, "owned"), JSON.stringify(toNFTs))

      // Update marketplace if listed
      const marketplaceNFTs = JSON.parse(localStorage.getItem("marketplace-nfts") || "[]")
      const updatedMarketplace = marketplaceNFTs.map((nft: any) =>
        nft.id === nftId ? { ...nft, status: "transferred", creator: toAddress } : nft,
      )
      localStorage.setItem("marketplace-nfts", JSON.stringify(updatedMarketplace))

      // Track transfer history
      const transfers = JSON.parse(localStorage.getItem(this.getStorageKey(fromAddress, "transfers")) || "[]")
      transfers.push({
        nftId,
        to: toAddress,
        timestamp: new Date().toISOString(),
        type: "transfer",
      })
      localStorage.setItem(this.getStorageKey(fromAddress, "transfers"), JSON.stringify(transfers))

      return true
    } catch (error) {
      console.error("Error transferring NFT:", error)
      return false
    }
  }

  // Burn NFT (permanent destruction)
  static burnNFT(nftId: number, userAddress: string): boolean {
    try {
      const marketplaceNFTs = JSON.parse(localStorage.getItem("marketplace-nfts") || "[]")
      const updatedMarketplace = marketplaceNFTs.filter((nft: any) => nft.id !== nftId)
      localStorage.setItem("marketplace-nfts", JSON.stringify(updatedMarketplace))

      const burnedNFTs = JSON.parse(localStorage.getItem(this.getStorageKey(userAddress, "burned")) || "[]")
      burnedNFTs.push({
        nftId,
        timestamp: new Date().toISOString(),
        reason: "User burned NFT",
      })
      localStorage.setItem(this.getStorageKey(userAddress, "burned"), JSON.stringify(burnedNFTs))

      const userNFTs = JSON.parse(localStorage.getItem(this.getStorageKey(userAddress, "nfts")) || "[]")
      const updatedUserNFTs = userNFTs.filter((nft: any) => nft.id !== nftId)
      localStorage.setItem(this.getStorageKey(userAddress, "nfts"), JSON.stringify(updatedUserNFTs))

      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith("user-owned-")) {
          const ownedNFTs = JSON.parse(localStorage.getItem(key) || "[]")
          const updatedOwned = ownedNFTs.filter((nft: any) => nft.id !== nftId)
          if (updatedOwned.length !== ownedNFTs.length) {
            localStorage.setItem(key, JSON.stringify(updatedOwned))
          }
        }
      })

      window.dispatchEvent(
        new StorageEvent("storage", {
          key: "marketplace-nfts",
          newValue: JSON.stringify(updatedMarketplace),
          url: window.location.href,
        }),
      )

      // Run cleanup to remove any orphaned references
      if (typeof StorageManager !== "undefined") {
        StorageManager.cleanupOrphanedNFTReferences()
      }

      return true
    } catch (error) {
      console.error("Error burning NFT:", error)
      return false
    }
  }

  // Get NFT status for a user
  static getNFTStatus(nftId: number, userAddress: string): NFTStatus {
    const hiddenNFTs = JSON.parse(localStorage.getItem(this.getStorageKey(userAddress, "hidden")) || "[]")
    const delistedNFTs = JSON.parse(localStorage.getItem(this.getStorageKey(userAddress, "delisted")) || "[]")
    const burnedNFTs = JSON.parse(localStorage.getItem(this.getStorageKey(userAddress, "burned")) || "[]")

    const marketplaceNFTs = JSON.parse(localStorage.getItem("marketplace-nfts") || "[]")
    const nft = marketplaceNFTs.find((n: any) => n.id === nftId)

    return {
      isListed: nft?.status === "listed",
      isHidden: hiddenNFTs.includes(nftId),
      isBurned: burnedNFTs.some((b: any) => b.nftId === nftId),
      isTransferred: nft?.status === "transferred",
    }
  }

  // Get user's created NFTs with status
  static getUserCreatedNFTs(userAddress: string): any[] {
    const marketplaceNFTs = JSON.parse(localStorage.getItem("marketplace-nfts") || "[]")

    const userCreatedNFTs = marketplaceNFTs.filter((nft: any) => nft.creator === userAddress)

    return userCreatedNFTs.map((nft) => ({
      ...nft,
      status: this.getNFTStatus(nft.id, userAddress),
    }))
  }
}
