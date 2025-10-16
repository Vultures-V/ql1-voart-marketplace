// User Management System for Admin Panel
export interface UserProfile {
  address: string
  username?: string
  email?: string
  bio?: string
  avatar?: string
  isVerified: boolean
  isBanned: boolean
  banReason?: string
  bannedAt?: string
  bannedBy?: string
  createdAt: string
  lastActive?: string
  nftsCreated: number
  nftsPurchased: number
  totalVolume: number
}

export interface BanAction {
  userAddress: string
  reason: string
  bannedBy: string
  bannedAt: string
  duration?: number // in days, undefined = permanent
}

export interface UserAction {
  id: string
  type: "ban" | "unban" | "verify" | "unverify" | "warning"
  userAddress: string
  adminAddress: string
  reason: string
  timestamp: string
  metadata?: any
}

export class UserManagementSystem {
  private static STORAGE_KEY = "voart_user_management"
  private static BANNED_USERS_KEY = "voart_banned_users"
  private static USER_ACTIONS_KEY = "voart_user_actions"

  // Get all users with their profiles
  static getAllUsers(): UserProfile[] {
    if (typeof window === "undefined") return []

    const users = JSON.parse(localStorage.getItem("voart_users") || "[]")
    const bannedUsers = this.getBannedUsers()
    const nfts = JSON.parse(localStorage.getItem("marketplace-nfts") || "[]")

    return users.map((user: any) => {
      const banInfo = bannedUsers.find((b) => b.userAddress === user.address)
      const userNFTs = nfts.filter((nft: any) => nft.creator === user.address)

      const soldNFTs = userNFTs.filter((nft: any) => nft.status === "sold")
      const totalVolume = soldNFTs.reduce((sum: number, nft: any) => {
        // Use actual sale price if available, otherwise use listing price
        const salePrice = nft.salePrice || nft.purchasePrice || Number.parseFloat(nft.price) || 0
        return sum + salePrice
      }, 0)

      return {
        address: user.address,
        username: user.username || `User ${user.address.slice(0, 6)}`,
        email: user.email,
        bio: user.bio,
        avatar: user.avatar,
        isVerified: user.isVerified || false,
        isBanned: !!banInfo,
        banReason: banInfo?.reason,
        bannedAt: banInfo?.bannedAt,
        bannedBy: banInfo?.bannedBy,
        createdAt: user.createdAt || new Date().toISOString(),
        lastActive: user.lastActive,
        nftsCreated: userNFTs.length,
        nftsPurchased: user.nftsPurchased || 0,
        totalVolume,
      }
    })
  }

  // Ban a user
  static banUser(
    userAddress: string,
    reason: string,
    adminAddress: string,
    duration?: number,
  ): {
    success: boolean
    message: string
  } {
    try {
      const bannedUsers = this.getBannedUsers()

      // Check if already banned
      if (bannedUsers.some((b) => b.userAddress === userAddress)) {
        return { success: false, message: "User is already banned" }
      }

      const banAction: BanAction = {
        userAddress,
        reason,
        bannedBy: adminAddress,
        bannedAt: new Date().toISOString(),
        duration,
      }

      bannedUsers.push(banAction)
      localStorage.setItem(this.BANNED_USERS_KEY, JSON.stringify(bannedUsers))

      // Log action
      this.logUserAction({
        id: `ban-${Date.now()}`,
        type: "ban",
        userAddress,
        adminAddress,
        reason,
        timestamp: new Date().toISOString(),
        metadata: { duration },
      })

      return {
        success: true,
        message: `User banned successfully${duration ? ` for ${duration} days` : " permanently"}`,
      }
    } catch (error) {
      console.error("Error banning user:", error)
      return { success: false, message: "Failed to ban user" }
    }
  }

  // Unban/Lift ban from a user
  static unbanUser(userAddress: string, adminAddress: string): { success: boolean; message: string } {
    try {
      const bannedUsers = this.getBannedUsers()
      const updatedBannedUsers = bannedUsers.filter((b) => b.userAddress !== userAddress)

      if (bannedUsers.length === updatedBannedUsers.length) {
        return { success: false, message: "User is not banned" }
      }

      localStorage.setItem(this.BANNED_USERS_KEY, JSON.stringify(updatedBannedUsers))

      // Log action
      this.logUserAction({
        id: `unban-${Date.now()}`,
        type: "unban",
        userAddress,
        adminAddress,
        reason: "Ban lifted by admin",
        timestamp: new Date().toISOString(),
      })

      return { success: true, message: "User ban lifted successfully" }
    } catch (error) {
      console.error("Error unbanning user:", error)
      return { success: false, message: "Failed to unban user" }
    }
  }

  // Check if user is banned
  static isUserBanned(userAddress: string): boolean {
    const bannedUsers = this.getBannedUsers()
    const banInfo = bannedUsers.find((b) => b.userAddress === userAddress)

    if (!banInfo) return false

    // Check if temporary ban has expired
    if (banInfo.duration) {
      const bannedDate = new Date(banInfo.bannedAt)
      const expiryDate = new Date(bannedDate.getTime() + banInfo.duration * 24 * 60 * 60 * 1000)

      if (new Date() > expiryDate) {
        // Auto-unban
        this.unbanUser(userAddress, "system")
        return false
      }
    }

    return true
  }

  // Get banned users
  static getBannedUsers(): BanAction[] {
    if (typeof window === "undefined") return []
    return JSON.parse(localStorage.getItem(this.BANNED_USERS_KEY) || "[]")
  }

  // Fix user issues (reset corrupted data, restore access, etc.)
  static fixUserIssues(
    userAddress: string,
    adminAddress: string,
    fixType: string,
  ): {
    success: boolean
    message: string
  } {
    try {
      const users = JSON.parse(localStorage.getItem("voart_users") || "[]")
      const userIndex = users.findIndex((u: any) => u.address === userAddress)

      if (userIndex === -1) {
        return { success: false, message: "User not found" }
      }

      let fixMessage = ""

      switch (fixType) {
        case "reset_profile":
          users[userIndex] = {
            ...users[userIndex],
            bio: "",
            avatar: "",
            lastActive: new Date().toISOString(),
          }
          fixMessage = "User profile reset successfully"
          break

        case "restore_access":
          // Remove any temporary restrictions
          users[userIndex].restricted = false
          fixMessage = "User access restored"
          break

        case "clear_violations":
          users[userIndex].violations = []
          fixMessage = "User violations cleared"
          break

        case "reset_stats":
          users[userIndex].nftsPurchased = 0
          users[userIndex].totalVolume = 0
          fixMessage = "User stats reset"
          break

        default:
          return { success: false, message: "Unknown fix type" }
      }

      localStorage.setItem("voart_users", JSON.stringify(users))

      // Log action
      this.logUserAction({
        id: `fix-${Date.now()}`,
        type: "warning",
        userAddress,
        adminAddress,
        reason: `Fixed: ${fixType}`,
        timestamp: new Date().toISOString(),
        metadata: { fixType },
      })

      return { success: true, message: fixMessage }
    } catch (error) {
      console.error("Error fixing user issues:", error)
      return { success: false, message: "Failed to fix user issues" }
    }
  }

  // Log user action
  private static logUserAction(action: UserAction): void {
    const actions = this.getUserActions()
    actions.unshift(action) // Add to beginning
    // Keep only last 1000 actions
    if (actions.length > 1000) {
      actions.splice(1000)
    }
    localStorage.setItem(this.USER_ACTIONS_KEY, JSON.stringify(actions))
  }

  // Get user actions history
  static getUserActions(userAddress?: string): UserAction[] {
    if (typeof window === "undefined") return []
    const actions = JSON.parse(localStorage.getItem(this.USER_ACTIONS_KEY) || "[]")

    if (userAddress) {
      return actions.filter((a: UserAction) => a.userAddress === userAddress)
    }

    return actions
  }

  // Get user statistics
  static getUserStats() {
    const users = this.getAllUsers()
    const bannedUsers = this.getBannedUsers()

    return {
      totalUsers: users.length,
      verifiedUsers: users.filter((u) => u.isVerified).length,
      bannedUsers: bannedUsers.length,
      activeUsers: users.filter((u) => !u.isBanned).length,
      newUsersToday: users.filter((u) => {
        const createdDate = new Date(u.createdAt)
        const today = new Date()
        return createdDate.toDateString() === today.toDateString()
      }).length,
    }
  }

  // Search users
  static searchUsers(query: string): UserProfile[] {
    const users = this.getAllUsers()
    const lowerQuery = query.toLowerCase()

    return users.filter(
      (user) =>
        user.address.toLowerCase().includes(lowerQuery) ||
        user.username?.toLowerCase().includes(lowerQuery) ||
        user.email?.toLowerCase().includes(lowerQuery),
    )
  }
}
