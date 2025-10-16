"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useWallet } from "@/hooks/use-wallet"
import { OffersSystem } from "@/lib/offers-system"
import { getQOMPrice } from "@/lib/qom-pricing"
import { DollarSignIcon, ClockIcon } from "@/components/simple-icons"

interface MakeOfferDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  nft: {
    id: string
    title: string
    image: string
    price: number
    creator: string
    contractAddress?: string
    tokenId?: string
  }
}

export function MakeOfferDialog({ open, onOpenChange, nft }: MakeOfferDialogProps) {
  const { address, isConnected } = useWallet()
  const [offerAmount, setOfferAmount] = useState("")
  const [expiryDays, setExpiryDays] = useState("7")
  const [message, setMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const qomPrice = getQOMPrice()
  const offerAmountUSD = Number.parseFloat(offerAmount || "0") * qomPrice

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isConnected || !address) {
      alert("Please connect your wallet first")
      return
    }

    if (!offerAmount || Number.parseFloat(offerAmount) <= 0) {
      alert("Please enter a valid offer amount")
      return
    }

    setIsSubmitting(true)

    try {
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + Number.parseInt(expiryDays))

      OffersSystem.createOffer({
        nftId: nft.id,
        nftTitle: nft.title,
        nftImage: nft.image,
        nftContractAddress: nft.contractAddress,
        nftTokenId: nft.tokenId,
        offerAmount: Number.parseFloat(offerAmount),
        offerAmountUSD,
        fromAddress: address,
        toAddress: nft.creator,
        message: message || undefined,
        expiresAt: expiresAt.toISOString(),
      })

      alert("Offer submitted successfully!")
      onOpenChange(false)

      // Reset form
      setOfferAmount("")
      setExpiryDays("7")
      setMessage("")
    } catch (error) {
      console.error("[v0] Error submitting offer:", error)
      alert("Failed to submit offer. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Make an Offer</DialogTitle>
          <DialogDescription>
            Submit an offer for "{nft.title}". The creator will be notified and can accept or reject your offer.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="offer-amount">Offer Amount (QOM)</Label>
            <div className="relative">
              <Input
                id="offer-amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="Enter amount in QOM"
                value={offerAmount}
                onChange={(e) => setOfferAmount(e.target.value)}
                className="pr-20"
                required
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">QOM</div>
            </div>
            {offerAmount && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <DollarSignIcon className="h-3 w-3" />
                <span>≈ ${offerAmountUSD.toFixed(2)} USD</span>
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Current listing price: {nft.price} QOM (${(nft.price * qomPrice).toFixed(2)})
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="expiry">Offer Expiry</Label>
            <div className="relative">
              <select
                id="expiry"
                name="expiry"
                value={expiryDays}
                onChange={(e) => setExpiryDays(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="1">1 day</option>
                <option value="3">3 days</option>
                <option value="7">7 days</option>
                <option value="14">14 days</option>
                <option value="30">30 days</option>
              </select>
              <ClockIcon className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message (Optional)</Label>
            <Textarea
              id="message"
              placeholder="Add a message to the creator..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !isConnected} className="flex-1">
              {isSubmitting ? "Submitting..." : "Submit Offer"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
