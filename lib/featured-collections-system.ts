// Featured Collections Management System
export interface FeaturedCollection {
  collectionId: string
  collectionName: string
  featuredAt: string
  featuredBy: string
  priority: number // 1-10, higher = more prominent
  expiresAt?: string // Optional expiry date
}

export class FeaturedCollectionsSystem {
  private static STORAGE_KEY = "voart_featured_collections"

  // Feature a collection
  static featureCollection(
    collectionId: string,
    collectionName: string,
    adminAddress: string,
    priority = 5,
    expiresAt?: string,
  ): {
    success: boolean
    message: string
  } {
    try {
      const featured = this.getFeaturedCollections()

      // Check if already featured
      if (featured.some((f) => f.collectionId === collectionId)) {
        return { success: false, message: "Collection is already featured" }
      }

      const newFeatured: FeaturedCollection = {
        collectionId,
        collectionName,
        featuredAt: new Date().toISOString(),
        featuredBy: adminAddress,
        priority,
        expiresAt,
      }

      featured.push(newFeatured)
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(featured))

      return { success: true, message: "Collection featured successfully" }
    } catch (error) {
      console.error("Error featuring collection:", error)
      return { success: false, message: "Failed to feature collection" }
    }
  }

  // Unfeature a collection
  static unfeatureCollection(collectionId: string): { success: boolean; message: string } {
    try {
      const featured = this.getFeaturedCollections()
      const updated = featured.filter((f) => f.collectionId !== collectionId)

      if (featured.length === updated.length) {
        return { success: false, message: "Collection is not featured" }
      }

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updated))

      return { success: true, message: "Collection unfeatured successfully" }
    } catch (error) {
      console.error("Error unfeaturing collection:", error)
      return { success: false, message: "Failed to unfeature collection" }
    }
  }

  // Get all featured collections
  static getFeaturedCollections(): FeaturedCollection[] {
    if (typeof window === "undefined") return []

    const featured = JSON.parse(localStorage.getItem(this.STORAGE_KEY) || "[]")

    // Filter out expired features
    const now = new Date()
    const active = featured.filter((f: FeaturedCollection) => {
      if (!f.expiresAt) return true
      return new Date(f.expiresAt) > now
    })

    // Sort by priority (highest first)
    return active.sort((a: FeaturedCollection, b: FeaturedCollection) => b.priority - a.priority)
  }

  // Check if collection is featured
  static isCollectionFeatured(collectionId: string): boolean {
    return this.getFeaturedCollections().some((f) => f.collectionId === collectionId)
  }

  // Update priority
  static updatePriority(collectionId: string, priority: number): { success: boolean; message: string } {
    try {
      const featured = this.getFeaturedCollections()
      const index = featured.findIndex((f) => f.collectionId === collectionId)

      if (index === -1) {
        return { success: false, message: "Collection is not featured" }
      }

      featured[index].priority = priority
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(featured))

      return { success: true, message: "Priority updated successfully" }
    } catch (error) {
      console.error("Error updating priority:", error)
      return { success: false, message: "Failed to update priority" }
    }
  }
}
