/**
 * Offers System for NFT Marketplace
 * Manages offer creation, acceptance, rejection, and tracking
 */

export interface Offer {
  id: string
  nftId: string
  nftTitle: string
  nftImage: string
  nftContractAddress?: string
  nftTokenId?: string
  offerAmount: number // in QOM
  offerAmountUSD: number
  fromAddress: string
  fromUsername?: string
  toAddress: string
  toUsername?: string
  status: "pending" | "accepted" | "rejected" | "expired" | "cancelled"
  message?: string
  createdAt: string
  expiresAt: string
  acceptedAt?: string
  rejectedAt?: string
}

export class OffersSystem {
  private static readonly OFFERS_KEY = "marketplace-offers"
  private static readonly OFFER_ACTIONS_KEY = "marketplace-offer-actions"

  /**
   * Create a new offer on an NFT
   */
  static createOffer(offer: Omit<Offer, "id" | "createdAt" | "status">): Offer {
    const offers = this.getAllOffers()

    const newOffer: Offer = {
      ...offer,
      id: `offer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      status: "pending",
      createdAt: new Date().toISOString(),
    }

    offers.push(newOffer)
    localStorage.setItem(this.OFFERS_KEY, JSON.stringify(offers))

    // Log action
    this.logAction({
      type: "offer_created",
      offerId: newOffer.id,
      nftId: offer.nftId,
      fromAddress: offer.fromAddress,
      toAddress: offer.toAddress,
      amount: offer.offerAmount,
      timestamp: new Date().toISOString(),
    })

    console.log("[v0] Offer created:", newOffer)
    return newOffer
  }

  /**
   * Accept an offer
   */
  static acceptOffer(offerId: string, acceptedBy: string): boolean {
    const offers = this.getAllOffers()
    const offerIndex = offers.findIndex((o) => o.id === offerId)

    if (offerIndex === -1) {
      console.error("[v0] Offer not found:", offerId)
      return false
    }

    const offer = offers[offerIndex]

    // Verify the person accepting is the NFT owner
    if (offer.toAddress.toLowerCase() !== acceptedBy.toLowerCase()) {
      console.error("[v0] Unauthorized: Only NFT owner can accept offers")
      return false
    }

    // Update offer status
    offers[offerIndex] = {
      ...offer,
      status: "accepted",
      acceptedAt: new Date().toISOString(),
    }

    localStorage.setItem(this.OFFERS_KEY, JSON.stringify(offers))

    // Log action
    this.logAction({
      type: "offer_accepted",
      offerId,
      nftId: offer.nftId,
      fromAddress: offer.fromAddress,
      toAddress: offer.toAddress,
      amount: offer.offerAmount,
      timestamp: new Date().toISOString(),
    })

    console.log("[v0] Offer accepted:", offers[offerIndex])
    return true
  }

  /**
   * Reject an offer
   */
  static rejectOffer(offerId: string, rejectedBy: string): boolean {
    const offers = this.getAllOffers()
    const offerIndex = offers.findIndex((o) => o.id === offerId)

    if (offerIndex === -1) {
      console.error("[v0] Offer not found:", offerId)
      return false
    }

    const offer = offers[offerIndex]

    // Verify the person rejecting is the NFT owner
    if (offer.toAddress.toLowerCase() !== rejectedBy.toLowerCase()) {
      console.error("[v0] Unauthorized: Only NFT owner can reject offers")
      return false
    }

    // Update offer status
    offers[offerIndex] = {
      ...offer,
      status: "rejected",
      rejectedAt: new Date().toISOString(),
    }

    localStorage.setItem(this.OFFERS_KEY, JSON.stringify(offers))

    // Log action
    this.logAction({
      type: "offer_rejected",
      offerId,
      nftId: offer.nftId,
      fromAddress: offer.fromAddress,
      toAddress: offer.toAddress,
      timestamp: new Date().toISOString(),
    })

    console.log("[v0] Offer rejected:", offers[offerIndex])
    return true
  }

  /**
   * Cancel an offer (by the person who made it)
   */
  static cancelOffer(offerId: string, cancelledBy: string): boolean {
    const offers = this.getAllOffers()
    const offerIndex = offers.findIndex((o) => o.id === offerId)

    if (offerIndex === -1) {
      console.error("[v0] Offer not found:", offerId)
      return false
    }

    const offer = offers[offerIndex]

    // Verify the person cancelling is the one who made the offer
    if (offer.fromAddress.toLowerCase() !== cancelledBy.toLowerCase()) {
      console.error("[v0] Unauthorized: Only offer creator can cancel")
      return false
    }

    // Update offer status
    offers[offerIndex] = {
      ...offer,
      status: "cancelled",
    }

    localStorage.setItem(this.OFFERS_KEY, JSON.stringify(offers))

    // Log action
    this.logAction({
      type: "offer_cancelled",
      offerId,
      nftId: offer.nftId,
      fromAddress: offer.fromAddress,
      toAddress: offer.toAddress,
      timestamp: new Date().toISOString(),
    })

    console.log("[v0] Offer cancelled:", offers[offerIndex])
    return true
  }

  /**
   * Get all offers
   */
  static getAllOffers(): Offer[] {
    try {
      const offers = localStorage.getItem(this.OFFERS_KEY)
      return offers ? JSON.parse(offers) : []
    } catch (error) {
      console.error("[v0] Error loading offers:", error)
      return []
    }
  }

  /**
   * Get offers for a specific NFT
   */
  static getOffersForNFT(nftId: string): Offer[] {
    const offers = this.getAllOffers()
    return offers.filter((offer) => offer.nftId === nftId)
  }

  /**
   * Get offers sent by a user
   */
  static getOffersSentByUser(address: string): Offer[] {
    const offers = this.getAllOffers()
    return offers.filter((offer) => offer.fromAddress.toLowerCase() === address.toLowerCase())
  }

  /**
   * Get offers received by a user
   */
  static getOffersReceivedByUser(address: string): Offer[] {
    const offers = this.getAllOffers()
    return offers.filter((offer) => offer.toAddress.toLowerCase() === address.toLowerCase())
  }

  /**
   * Get pending offers for an NFT
   */
  static getPendingOffersForNFT(nftId: string): Offer[] {
    const offers = this.getOffersForNFT(nftId)
    return offers.filter((offer) => offer.status === "pending")
  }

  /**
   * Check if offer has expired
   */
  static isOfferExpired(offer: Offer): boolean {
    return new Date(offer.expiresAt) < new Date()
  }

  /**
   * Mark expired offers
   */
  static markExpiredOffers(): void {
    const offers = this.getAllOffers()
    let updated = false

    const updatedOffers = offers.map((offer) => {
      if (offer.status === "pending" && this.isOfferExpired(offer)) {
        updated = true
        return { ...offer, status: "expired" as const }
      }
      return offer
    })

    if (updated) {
      localStorage.setItem(this.OFFERS_KEY, JSON.stringify(updatedOffers))
      console.log("[v0] Expired offers marked")
    }
  }

  /**
   * Log offer action for admin tracking
   */
  private static logAction(action: any): void {
    try {
      const actions = JSON.parse(localStorage.getItem(this.OFFER_ACTIONS_KEY) || "[]")
      actions.push(action)
      localStorage.setItem(this.OFFER_ACTIONS_KEY, JSON.stringify(actions))
    } catch (error) {
      console.error("[v0] Error logging offer action:", error)
    }
  }

  /**
   * Get all offer actions (for admin)
   */
  static getOfferActions(): any[] {
    try {
      return JSON.parse(localStorage.getItem(this.OFFER_ACTIONS_KEY) || "[]")
    } catch (error) {
      console.error("[v0] Error loading offer actions:", error)
      return []
    }
  }

  /**
   * Get offer statistics for a user
   */
  static getUserOfferStats(address: string): {
    sent: number
    received: number
    accepted: number
    rejected: number
    pending: number
  } {
    const sent = this.getOffersSentByUser(address)
    const received = this.getOffersReceivedByUser(address)

    return {
      sent: sent.length,
      received: received.length,
      accepted: received.filter((o) => o.status === "accepted").length,
      rejected: received.filter((o) => o.status === "rejected").length,
      pending: received.filter((o) => o.status === "pending").length,
    }
  }
}
