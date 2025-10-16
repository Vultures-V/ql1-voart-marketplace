// Verification Management System for VOart NFT Marketplace

export interface VerificationRequest {
  id: string
  type: "user" | "collection"
  requesterId: string
  requesterName: string
  targetId: string // wallet address for users, collection ID for collections
  targetName: string
  reason: string
  status: "pending" | "approved" | "rejected"
  createdAt: string
  reviewedAt?: string
  reviewedBy?: string
}

export interface VerificationCriteria {
  minFollowers?: number
  minNFTsCreated?: number
  minVolume?: number
  accountAge?: number // days
  socialVerification?: boolean
}

class VerificationSystem {
  private readonly STORAGE_KEY = "verification_requests"
  private readonly VERIFIED_USERS_KEY = "verified_users"
  private readonly VERIFIED_COLLECTIONS_KEY = "verified_collections"

  // Get all verification requests
  getAllRequests(): VerificationRequest[] {
    try {
      const requests = localStorage.getItem(this.STORAGE_KEY)
      return requests ? JSON.parse(requests) : []
    } catch (error) {
      console.error("[v0] Error loading verification requests:", error)
      return []
    }
  }

  // Get pending verification requests
  getPendingRequests(): VerificationRequest[] {
    return this.getAllRequests().filter((req) => req.status === "pending")
  }

  // Submit a verification request
  submitRequest(
    type: "user" | "collection",
    requesterId: string,
    requesterName: string,
    targetId: string,
    targetName: string,
    reason: string,
  ): { success: boolean; message: string } {
    try {
      const requests = this.getAllRequests()

      // Check if there's already a pending request
      const existingRequest = requests.find((req) => req.targetId === targetId && req.status === "pending")

      if (existingRequest) {
        return {
          success: false,
          message: "A verification request is already pending for this item",
        }
      }

      // Check if already verified
      if (type === "user" && this.isUserVerified(targetId)) {
        return {
          success: false,
          message: "This user is already verified",
        }
      }

      if (type === "collection" && this.isCollectionVerified(targetId)) {
        return {
          success: false,
          message: "This collection is already verified",
        }
      }

      const newRequest: VerificationRequest = {
        id: `vr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type,
        requesterId,
        requesterName,
        targetId,
        targetName,
        reason,
        status: "pending",
        createdAt: new Date().toISOString(),
      }

      requests.push(newRequest)
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(requests))

      return {
        success: true,
        message: "Verification request submitted successfully",
      }
    } catch (error) {
      console.error("[v0] Error submitting verification request:", error)
      return {
        success: false,
        message: "Failed to submit verification request",
      }
    }
  }

  // Approve a verification request
  approveRequest(requestId: string, adminAddress: string): { success: boolean; message: string } {
    try {
      const requests = this.getAllRequests()
      const requestIndex = requests.findIndex((req) => req.id === requestId)

      if (requestIndex === -1) {
        return { success: false, message: "Request not found" }
      }

      const request = requests[requestIndex]

      if (request.status !== "pending") {
        return { success: false, message: "Request has already been reviewed" }
      }

      // Update request status
      requests[requestIndex] = {
        ...request,
        status: "approved",
        reviewedAt: new Date().toISOString(),
        reviewedBy: adminAddress,
      }

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(requests))

      // Add to verified list
      if (request.type === "user") {
        this.addVerifiedUser(request.targetId)
        this.updateUserBadges(request.targetId, "Verified")
      } else {
        this.addVerifiedCollection(request.targetId)
        this.updateCollectionVerification(request.targetId, true)
      }

      return {
        success: true,
        message: `${request.type === "user" ? "User" : "Collection"} verified successfully`,
      }
    } catch (error) {
      console.error("[v0] Error approving verification:", error)
      return { success: false, message: "Failed to approve verification" }
    }
  }

  // Reject a verification request
  rejectRequest(requestId: string, adminAddress: string): { success: boolean; message: string } {
    try {
      const requests = this.getAllRequests()
      const requestIndex = requests.findIndex((req) => req.id === requestId)

      if (requestIndex === -1) {
        return { success: false, message: "Request not found" }
      }

      const request = requests[requestIndex]

      if (request.status !== "pending") {
        return { success: false, message: "Request has already been reviewed" }
      }

      requests[requestIndex] = {
        ...request,
        status: "rejected",
        reviewedAt: new Date().toISOString(),
        reviewedBy: adminAddress,
      }

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(requests))

      return { success: true, message: "Verification request rejected" }
    } catch (error) {
      console.error("[v0] Error rejecting verification:", error)
      return { success: false, message: "Failed to reject verification" }
    }
  }

  // Revoke verification
  revokeVerification(type: "user" | "collection", targetId: string): { success: boolean; message: string } {
    try {
      if (type === "user") {
        this.removeVerifiedUser(targetId)
        this.removeUserBadge(targetId, "Verified")
      } else {
        this.removeVerifiedCollection(targetId)
        this.updateCollectionVerification(targetId, false)
      }

      return { success: true, message: "Verification revoked successfully" }
    } catch (error) {
      console.error("[v0] Error revoking verification:", error)
      return { success: false, message: "Failed to revoke verification" }
    }
  }

  // Check if user is verified
  isUserVerified(address: string): boolean {
    try {
      const verified = localStorage.getItem(this.VERIFIED_USERS_KEY)
      const verifiedUsers: string[] = verified ? JSON.parse(verified) : []
      return verifiedUsers.includes(address.toLowerCase())
    } catch (error) {
      return false
    }
  }

  // Check if collection is verified
  isCollectionVerified(collectionId: string): boolean {
    try {
      const verified = localStorage.getItem(this.VERIFIED_COLLECTIONS_KEY)
      const verifiedCollections: string[] = verified ? JSON.parse(verified) : []
      return verifiedCollections.includes(collectionId)
    } catch (error) {
      return false
    }
  }

  // Add verified user
  private addVerifiedUser(address: string): void {
    const verified = localStorage.getItem(this.VERIFIED_USERS_KEY)
    const verifiedUsers: string[] = verified ? JSON.parse(verified) : []
    if (!verifiedUsers.includes(address.toLowerCase())) {
      verifiedUsers.push(address.toLowerCase())
      localStorage.setItem(this.VERIFIED_USERS_KEY, JSON.stringify(verifiedUsers))
    }
  }

  // Remove verified user
  private removeVerifiedUser(address: string): void {
    const verified = localStorage.getItem(this.VERIFIED_USERS_KEY)
    const verifiedUsers: string[] = verified ? JSON.parse(verified) : []
    const updated = verifiedUsers.filter((addr) => addr !== address.toLowerCase())
    localStorage.setItem(this.VERIFIED_USERS_KEY, JSON.stringify(updated))
  }

  // Add verified collection
  private addVerifiedCollection(collectionId: string): void {
    const verified = localStorage.getItem(this.VERIFIED_COLLECTIONS_KEY)
    const verifiedCollections: string[] = verified ? JSON.parse(verified) : []
    if (!verifiedCollections.includes(collectionId)) {
      verifiedCollections.push(collectionId)
      localStorage.setItem(this.VERIFIED_COLLECTIONS_KEY, JSON.stringify(verifiedCollections))
    }
  }

  // Remove verified collection
  private removeVerifiedCollection(collectionId: string): void {
    const verified = localStorage.getItem(this.VERIFIED_COLLECTIONS_KEY)
    const verifiedCollections: string[] = verified ? JSON.parse(verified) : []
    const updated = verifiedCollections.filter((id) => id !== collectionId)
    localStorage.setItem(this.VERIFIED_COLLECTIONS_KEY, JSON.stringify(updated))
  }

  // Update user badges
  private updateUserBadges(address: string, badge: string): void {
    try {
      const profileData = localStorage.getItem(`profile_${address}`)
      if (profileData) {
        const profile = JSON.parse(profileData)
        if (!profile.badges) {
          profile.badges = []
        }
        if (!profile.badges.includes(badge)) {
          profile.badges.push(badge)
          localStorage.setItem(`profile_${address}`, JSON.stringify(profile))
        }
      }
    } catch (error) {
      console.error("[v0] Error updating user badges:", error)
    }
  }

  // Remove user badge
  private removeUserBadge(address: string, badge: string): void {
    try {
      const profileData = localStorage.getItem(`profile_${address}`)
      if (profileData) {
        const profile = JSON.parse(profileData)
        if (profile.badges) {
          profile.badges = profile.badges.filter((b: string) => b !== badge)
          localStorage.setItem(`profile_${address}`, JSON.stringify(profile))
        }
      }
    } catch (error) {
      console.error("[v0] Error removing user badge:", error)
    }
  }

  // Update collection verification status
  private updateCollectionVerification(collectionId: string, isVerified: boolean): void {
    try {
      const collections = JSON.parse(localStorage.getItem("user-collections") || "[]")
      const collectionIndex = collections.findIndex((c: any) => c.id === collectionId)

      if (collectionIndex !== -1) {
        collections[collectionIndex].isVerified = isVerified
        localStorage.setItem("user-collections", JSON.stringify(collections))
      }
    } catch (error) {
      console.error("[v0] Error updating collection verification:", error)
    }
  }

  // Get verification statistics
  getStatistics() {
    const requests = this.getAllRequests()
    const verifiedUsers = JSON.parse(localStorage.getItem(this.VERIFIED_USERS_KEY) || "[]")
    const verifiedCollections = JSON.parse(localStorage.getItem(this.VERIFIED_COLLECTIONS_KEY) || "[]")

    return {
      totalRequests: requests.length,
      pendingRequests: requests.filter((r) => r.status === "pending").length,
      approvedRequests: requests.filter((r) => r.status === "approved").length,
      rejectedRequests: requests.filter((r) => r.status === "rejected").length,
      verifiedUsers: verifiedUsers.length,
      verifiedCollections: verifiedCollections.length,
    }
  }
}

export const verificationSystem = new VerificationSystem()
