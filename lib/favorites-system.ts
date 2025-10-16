export interface FavoriteNFT {
  nftId: number
  addedAt: string
}

export class FavoritesSystem {
  private static getStorageKey(address: string): string {
    return `favorites-${address}`
  }

  static addFavorite(address: string, nftId: number): boolean {
    try {
      const favorites = this.getFavorites(address)

      if (favorites.some((fav) => fav.nftId === nftId)) {
        return true // Already favorited
      }

      favorites.push({
        nftId,
        addedAt: new Date().toISOString(),
      })

      localStorage.setItem(this.getStorageKey(address), JSON.stringify(favorites))
      return true
    } catch (error) {
      console.error("Failed to add favorite:", error)
      return false
    }
  }

  static removeFavorite(address: string, nftId: number): boolean {
    try {
      const favorites = this.getFavorites(address)
      const filtered = favorites.filter((fav) => fav.nftId !== nftId)

      localStorage.setItem(this.getStorageKey(address), JSON.stringify(filtered))
      return true
    } catch (error) {
      console.error("Failed to remove favorite:", error)
      return false
    }
  }

  static getFavorites(address: string): FavoriteNFT[] {
    try {
      const stored = localStorage.getItem(this.getStorageKey(address))
      return stored ? JSON.parse(stored) : []
    } catch (error) {
      console.error("Failed to get favorites:", error)
      return []
    }
  }

  static isFavorite(address: string, nftId: number): boolean {
    const favorites = this.getFavorites(address)
    return favorites.some((fav) => fav.nftId === nftId)
  }

  static getFavoriteIds(address: string): number[] {
    return this.getFavorites(address).map((fav) => fav.nftId)
  }

  static clearFavorites(address: string): void {
    localStorage.removeItem(this.getStorageKey(address))
  }
}
