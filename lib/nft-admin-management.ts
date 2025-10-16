// NFT Admin Management System - for admin-level NFT operations
export interface NFTAdminAction {
  id: string
  type: "hide" | "unhide" | "feature" | "unfeature" | "remove" | "flag"
  nftId: number
  adminAddress: string
  reason: string
  timestamp: string
  metadata?: any
}

export class NFTAdminManagement {
  private static HIDDEN_NFTS_KEY = "voart_admin_hidden_nfts"
  private static FEATURED_NFTS_KEY = "voart_admin_featured_nfts"
  private static FLAGGED_NFTS_KEY = "voart_admin_flagged_nfts"
  private static NFT_ACTIONS_KEY = "voart_nft_admin_actions"

  // Hide NFT from marketplace (admin action)
  static hideNFT(nftId: number, adminAddress: string, reason: string): { success: boolean; message: string } {
    try {
      const hiddenNFTs = this.getHiddenNFTs()

      if (hiddenNFTs.some((h) => h.nftId === nftId)) {
        return { success: false, message: "NFT is already hidden" }
      }

      hiddenNFTs.push({
        nftId,
        hiddenBy: adminAddress,
        reason,
        hiddenAt: new Date().toISOString(),
      })

      localStorage.setItem(this.HIDDEN_NFTS_KEY, JSON.stringify(hiddenNFTs))

      this.logNFTAction({
        id: `hide-${Date.now()}`,
        type: "hide",
        nftId,
        adminAddress,
        reason,
        timestamp: new Date().toISOString(),
      })

      return { success: true, message: "NFT hidden from marketplace" }
    } catch (error) {
      console.error("Error hiding NFT:", error)
      return { success: false, message: "Failed to hide NFT" }
    }
  }

  // Unhide NFT
  static unhideNFT(nftId: number, adminAddress: string): { success: boolean; message: string } {
    try {
      const hiddenNFTs = this.getHiddenNFTs()
      const updatedHidden = hiddenNFTs.filter((h) => h.nftId !== nftId)

      if (hiddenNFTs.length === updatedHidden.length) {
        return { success: false, message: "NFT is not hidden" }
      }

      localStorage.setItem(this.HIDDEN_NFTS_KEY, JSON.stringify(updatedHidden))

      this.logNFTAction({
        id: `unhide-${Date.now()}`,
        type: "unhide",
        nftId,
        adminAddress,
        reason: "NFT unhidden by admin",
        timestamp: new Date().toISOString(),
      })

      return { success: true, message: "NFT unhidden successfully" }
    } catch (error) {
      console.error("Error unhiding NFT:", error)
      return { success: false, message: "Failed to unhide NFT" }
    }
  }

  // Feature NFT on homepage
  static featureNFT(nftId: number, adminAddress: string): { success: boolean; message: string } {
    try {
      const featuredNFTs = this.getFeaturedNFTs()

      if (featuredNFTs.some((f) => f.nftId === nftId)) {
        return { success: false, message: "NFT is already featured" }
      }

      featuredNFTs.push({
        nftId,
        featuredBy: adminAddress,
        featuredAt: new Date().toISOString(),
      })

      localStorage.setItem(this.FEATURED_NFTS_KEY, JSON.stringify(featuredNFTs))

      this.logNFTAction({
        id: `feature-${Date.now()}`,
        type: "feature",
        nftId,
        adminAddress,
        reason: "Featured by admin",
        timestamp: new Date().toISOString(),
      })

      return { success: true, message: "NFT featured successfully" }
    } catch (error) {
      console.error("Error featuring NFT:", error)
      return { success: false, message: "Failed to feature NFT" }
    }
  }

  // Unfeature NFT
  static unfeatureNFT(nftId: number, adminAddress: string): { success: boolean; message: string } {
    try {
      const featuredNFTs = this.getFeaturedNFTs()
      const updatedFeatured = featuredNFTs.filter((f) => f.nftId !== nftId)

      if (featuredNFTs.length === updatedFeatured.length) {
        return { success: false, message: "NFT is not featured" }
      }

      localStorage.setItem(this.FEATURED_NFTS_KEY, JSON.stringify(updatedFeatured))

      this.logNFTAction({
        id: `unfeature-${Date.now()}`,
        type: "unfeature",
        nftId,
        adminAddress,
        reason: "Unfeatured by admin",
        timestamp: new Date().toISOString(),
      })

      return { success: true, message: "NFT unfeatured successfully" }
    } catch (error) {
      console.error("Error unfeaturing NFT:", error)
      return { success: false, message: "Failed to unfeature NFT" }
    }
  }

  // Flag NFT for review
  static flagNFT(nftId: number, adminAddress: string, reason: string): { success: boolean; message: string } {
    try {
      const flaggedNFTs = this.getFlaggedNFTs()

      flaggedNFTs.push({
        nftId,
        flaggedBy: adminAddress,
        reason,
        flaggedAt: new Date().toISOString(),
        status: "pending",
      })

      localStorage.setItem(this.FLAGGED_NFTS_KEY, JSON.stringify(flaggedNFTs))

      this.logNFTAction({
        id: `flag-${Date.now()}`,
        type: "flag",
        nftId,
        adminAddress,
        reason,
        timestamp: new Date().toISOString(),
      })

      return { success: true, message: "NFT flagged for review" }
    } catch (error) {
      console.error("Error flagging NFT:", error)
      return { success: false, message: "Failed to flag NFT" }
    }
  }

  // Check if NFT is hidden
  static isNFTHidden(nftId: number): boolean {
    const hiddenNFTs = this.getHiddenNFTs()
    return hiddenNFTs.some((h) => h.nftId === nftId)
  }

  // Get hidden NFTs
  static getHiddenNFTs(): any[] {
    if (typeof window === "undefined") return []
    return JSON.parse(localStorage.getItem(this.HIDDEN_NFTS_KEY) || "[]")
  }

  // Get featured NFTs
  static getFeaturedNFTs(): any[] {
    if (typeof window === "undefined") return []
    return JSON.parse(localStorage.getItem(this.FEATURED_NFTS_KEY) || "[]")
  }

  // Get flagged NFTs
  static getFlaggedNFTs(): any[] {
    if (typeof window === "undefined") return []
    return JSON.parse(localStorage.getItem(this.FLAGGED_NFTS_KEY) || "[]")
  }

  // Log NFT action
  private static logNFTAction(action: NFTAdminAction): void {
    const actions = this.getNFTActions()
    actions.unshift(action)
    if (actions.length > 1000) {
      actions.splice(1000)
    }
    localStorage.setItem(this.NFT_ACTIONS_KEY, JSON.stringify(actions))
  }

  // Get NFT actions history
  static getNFTActions(nftId?: number): NFTAdminAction[] {
    if (typeof window === "undefined") return []
    const actions = JSON.parse(localStorage.getItem(this.NFT_ACTIONS_KEY) || "[]")

    if (nftId !== undefined) {
      return actions.filter((a: NFTAdminAction) => a.nftId === nftId)
    }

    return actions
  }

  // Get NFT stats
  static getNFTStats() {
    return {
      hiddenNFTs: this.getHiddenNFTs().length,
      featuredNFTs: this.getFeaturedNFTs().length,
      flaggedNFTs: this.getFlaggedNFTs().filter((f) => f.status === "pending").length,
    }
  }

  static deleteNFT(nftId: number, adminAddress: string, reason: string): { success: boolean; message: string } {
    try {
      // Remove from marketplace-nfts
      const marketplaceNFTs = JSON.parse(localStorage.getItem("marketplace-nfts") || "[]")
      const nftToDelete = marketplaceNFTs.find((nft: any) => nft.id === nftId)

      if (!nftToDelete) {
        return { success: false, message: "NFT not found in marketplace" }
      }

      const updatedMarketplaceNFTs = marketplaceNFTs.filter((nft: any) => nft.id !== nftId)
      localStorage.setItem("marketplace-nfts", JSON.stringify(updatedMarketplaceNFTs))

      // Remove from user-specific storage if creator exists
      if (nftToDelete.creator) {
        const userNFTsKey = `user-nfts-${nftToDelete.creator}`
        const userNFTs = JSON.parse(localStorage.getItem(userNFTsKey) || "[]")
        const updatedUserNFTs = userNFTs.filter((nft: any) => nft.id !== nftId)
        localStorage.setItem(userNFTsKey, JSON.stringify(updatedUserNFTs))
      }

      // Remove from hidden, featured, and flagged lists
      const hiddenNFTs = this.getHiddenNFTs().filter((h) => h.nftId !== nftId)
      localStorage.setItem(this.HIDDEN_NFTS_KEY, JSON.stringify(hiddenNFTs))

      const featuredNFTs = this.getFeaturedNFTs().filter((f) => f.nftId !== nftId)
      localStorage.setItem(this.FEATURED_NFTS_KEY, JSON.stringify(featuredNFTs))

      const flaggedNFTs = this.getFlaggedNFTs().filter((f) => f.nftId !== nftId)
      localStorage.setItem(this.FLAGGED_NFTS_KEY, JSON.stringify(flaggedNFTs))

      // Log the deletion action
      this.logNFTAction({
        id: `delete-${Date.now()}`,
        type: "remove",
        nftId,
        adminAddress,
        reason,
        timestamp: new Date().toISOString(),
        metadata: { deletedNFT: nftToDelete },
      })

      // Trigger storage event to update UI
      window.dispatchEvent(new Event("storage"))

      return { success: true, message: "NFT deleted successfully" }
    } catch (error) {
      console.error("Error deleting NFT:", error)
      return { success: false, message: "Failed to delete NFT" }
    }
  }
}
