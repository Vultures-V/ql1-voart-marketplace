/**
 * Marketplace Whitelist Management System
 * Controls who can list and buy NFTs on the marketplace
 * Admin-only access control
 */

export interface MarketplaceWhitelistEntry {
  address: string
  addedBy: string
  addedAt: string
  isActive: boolean
}

export interface MarketplaceWhitelistStats {
  totalAddresses: number
  whitelistEnabled: boolean
  lastUpdated: string
}

const STORAGE_KEY = "marketplace_whitelist"
const SETTINGS_KEY = "marketplace_whitelist_settings"

export class MarketplaceWhitelistSystem {
  /**
   * Check if whitelist is enabled
   */
  static isWhitelistEnabled(): boolean {
    if (typeof window === "undefined") return false
    const settings = localStorage.getItem(SETTINGS_KEY)
    if (!settings) return false
    return JSON.parse(settings).enabled || false
  }

  /**
   * Enable or disable whitelist
   */
  static setWhitelistEnabled(enabled: boolean, adminAddress: string): { success: boolean; message: string } {
    try {
      const settings = {
        enabled,
        updatedBy: adminAddress,
        updatedAt: new Date().toISOString(),
      }
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
      return {
        success: true,
        message: `Marketplace whitelist ${enabled ? "enabled" : "disabled"}`,
      }
    } catch (error) {
      return {
        success: false,
        message: "Failed to update whitelist settings",
      }
    }
  }

  /**
   * Get all whitelisted addresses
   */
  static getWhitelist(): MarketplaceWhitelistEntry[] {
    if (typeof window === "undefined") return []
    const data = localStorage.getItem(STORAGE_KEY)
    if (!data) return []
    return JSON.parse(data)
  }

  /**
   * Check if address is whitelisted
   */
  static isWhitelisted(address: string): boolean {
    if (!this.isWhitelistEnabled()) return true // If whitelist disabled, everyone is allowed
    const whitelist = this.getWhitelist()
    return whitelist.some((entry) => entry.address.toLowerCase() === address.toLowerCase() && entry.isActive)
  }

  /**
   * Add address to whitelist
   */
  static addToWhitelist(address: string, adminAddress: string): { success: boolean; message: string } {
    try {
      if (!address || address.length < 10) {
        return { success: false, message: "Invalid wallet address" }
      }

      const whitelist = this.getWhitelist()

      // Check if already exists
      const existing = whitelist.find((entry) => entry.address.toLowerCase() === address.toLowerCase())
      if (existing) {
        return { success: false, message: "Address already whitelisted" }
      }

      const newEntry: MarketplaceWhitelistEntry = {
        address,
        addedBy: adminAddress,
        addedAt: new Date().toISOString(),
        isActive: true,
      }

      whitelist.push(newEntry)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(whitelist))

      return {
        success: true,
        message: "Address added to marketplace whitelist",
      }
    } catch (error) {
      return {
        success: false,
        message: "Failed to add address to whitelist",
      }
    }
  }

  /**
   * Remove address from whitelist
   */
  static removeFromWhitelist(address: string): { success: boolean; message: string } {
    try {
      const whitelist = this.getWhitelist()
      const filtered = whitelist.filter((entry) => entry.address.toLowerCase() !== address.toLowerCase())

      if (filtered.length === whitelist.length) {
        return { success: false, message: "Address not found in whitelist" }
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))

      return {
        success: true,
        message: "Address removed from marketplace whitelist",
      }
    } catch (error) {
      return {
        success: false,
        message: "Failed to remove address from whitelist",
      }
    }
  }

  /**
   * Bulk import addresses
   */
  static bulkImport(addresses: string[], adminAddress: string): { success: boolean; message: string; added: number } {
    let added = 0
    const whitelist = this.getWhitelist()

    for (const address of addresses) {
      if (!address || address.length < 10) continue

      const exists = whitelist.some((entry) => entry.address.toLowerCase() === address.toLowerCase())
      if (exists) continue

      whitelist.push({
        address,
        addedBy: adminAddress,
        addedAt: new Date().toISOString(),
        isActive: true,
      })
      added++
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(whitelist))

    return {
      success: true,
      message: `Added ${added} addresses to marketplace whitelist`,
      added,
    }
  }

  /**
   * Get whitelist statistics
   */
  static getStats(): MarketplaceWhitelistStats {
    const whitelist = this.getWhitelist()
    const settings = localStorage.getItem(SETTINGS_KEY)
    const enabled = settings ? JSON.parse(settings).enabled || false : false

    return {
      totalAddresses: whitelist.filter((e) => e.isActive).length,
      whitelistEnabled: enabled,
      lastUpdated: settings ? JSON.parse(settings).updatedAt || "Never" : "Never",
    }
  }

  /**
   * Clear all whitelist data
   */
  static clearAll(): { success: boolean; message: string } {
    try {
      localStorage.removeItem(STORAGE_KEY)
      localStorage.removeItem(SETTINGS_KEY)
      return {
        success: true,
        message: "Marketplace whitelist cleared",
      }
    } catch (error) {
      return {
        success: false,
        message: "Failed to clear whitelist",
      }
    }
  }
}
