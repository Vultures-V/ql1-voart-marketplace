"use client"

import { useCallback } from "react"
import { ethers } from "ethers"
import { useContract } from "./use-contract"
import { ORIGAMI_MARKETPLACE_ABI, ORIGAMI_NFT_ABI, ERC20_ABI, CONTRACTS } from "@/lib/contract-abis"
import { useToast } from "./use-toast"

export function useMarketplace() {
  const marketplace = useContract(CONTRACTS.MARKETPLACE, ORIGAMI_MARKETPLACE_ABI)
  const nft = useContract(CONTRACTS.NFT, ORIGAMI_NFT_ABI)
  const qomToken = useContract(CONTRACTS.QOM_TOKEN, ERC20_ABI)
  const { toast } = useToast()

  // List an NFT for sale
  const listNFT = useCallback(
    async (tokenId: number, priceInQOM: string) => {
      try {
        // First, approve marketplace to transfer NFT
        console.log("[v0] Approving marketplace for NFT", tokenId)
        const approvalReceipt = await nft.write("setApprovalForAll", CONTRACTS.MARKETPLACE, true)
        if (!approvalReceipt) return null

        // Then list the NFT
        const price = ethers.parseEther(priceInQOM)
        console.log("[v0] Listing NFT", tokenId, "for", priceInQOM, "QOM")
        return await marketplace.write("listItem", CONTRACTS.NFT, tokenId, price)
      } catch (error) {
        console.error("[v0] Error listing NFT:", error)
        return null
      }
    },
    [marketplace, nft],
  )

  // Buy a listed NFT
  const buyNFT = useCallback(
    async (listingId: string, priceInQOM: string) => {
      try {
        // Calculate total payment (price + buyer commission)
        const price = ethers.parseEther(priceInQOM)
        const buyerCommissionRate = await marketplace.read<bigint>("buyerCommissionRate")
        if (!buyerCommissionRate) return null

        const buyerCommission = (price * buyerCommissionRate) / BigInt(10000)
        const totalPayment = price + buyerCommission

        console.log("[v0] Total payment:", ethers.formatEther(totalPayment), "QOM")

        // First, approve QOM token spending
        console.log("[v0] Approving QOM token spending")
        const approvalReceipt = await qomToken.write("approve", CONTRACTS.MARKETPLACE, totalPayment)
        if (!approvalReceipt) return null

        // Then buy the NFT
        console.log("[v0] Buying NFT with listing ID:", listingId)
        return await marketplace.write("buyItem", listingId)
      } catch (error) {
        console.error("[v0] Error buying NFT:", error)
        return null
      }
    },
    [marketplace, qomToken],
  )

  // Delist an NFT
  const delistNFT = useCallback(
    async (listingId: string) => {
      console.log("[v0] Delisting NFT with listing ID:", listingId)
      return await marketplace.write("delistItem", listingId)
    },
    [marketplace],
  )

  // Make an offer on an NFT
  const makeOffer = useCallback(
    async (tokenId: number, seller: string, offerAmountInQOM: string, expiryDays: number) => {
      try {
        const offerAmount = ethers.parseEther(offerAmountInQOM)

        // Approve QOM token for the offer amount
        console.log("[v0] Approving QOM token for offer")
        const approvalReceipt = await qomToken.write("approve", CONTRACTS.MARKETPLACE, offerAmount)
        if (!approvalReceipt) return null

        console.log("[v0] Making offer on NFT", tokenId, "for", offerAmountInQOM, "QOM")
        return await marketplace.write("makeOffer", CONTRACTS.NFT, tokenId, seller, offerAmount, expiryDays)
      } catch (error) {
        console.error("[v0] Error making offer:", error)
        return null
      }
    },
    [marketplace, qomToken],
  )

  // Accept an offer
  const acceptOffer = useCallback(
    async (offerId: string, offerIndex: number) => {
      console.log("[v0] Accepting offer:", offerId, "index:", offerIndex)
      return await marketplace.write("acceptOffer", offerId, offerIndex)
    },
    [marketplace],
  )

  // Cancel an offer
  const cancelOffer = useCallback(
    async (offerId: string, offerIndex: number) => {
      console.log("[v0] Cancelling offer:", offerId, "index:", offerIndex)
      return await marketplace.write("cancelOffer", offerId, offerIndex)
    },
    [marketplace],
  )

  // Get listing details
  const getListing = useCallback(
    async (listingId: string) => {
      return await marketplace.read("listings", listingId)
    },
    [marketplace],
  )

  // Calculate commissions for a sale
  const calculateCommissions = useCallback(
    async (priceInQOM: string, buyer: string, seller: string) => {
      const price = ethers.parseEther(priceInQOM)
      return await marketplace.read("calculateCommissions", price, buyer, seller)
    },
    [marketplace],
  )

  // Listen to marketplace events
  const listenToSales = useCallback(
    (callback: (event: any) => void) => {
      return marketplace.listen("ItemSold", callback)
    },
    [marketplace],
  )

  const listenToListings = useCallback(
    (callback: (event: any) => void) => {
      return marketplace.listen("ItemListed", callback)
    },
    [marketplace],
  )

  const listenToOffers = useCallback(
    (callback: (event: any) => void) => {
      return marketplace.listen("OfferMade", callback)
    },
    [marketplace],
  )

  return {
    listNFT,
    buyNFT,
    delistNFT,
    makeOffer,
    acceptOffer,
    cancelOffer,
    getListing,
    calculateCommissions,
    listenToSales,
    listenToListings,
    listenToOffers,
    txStatus: marketplace.txStatus,
    resetTxStatus: marketplace.resetTxStatus,
  }
}
