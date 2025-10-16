"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { OffersSystem, type Offer } from "@/lib/offers-system"
import { useWallet } from "@/hooks/use-wallet"
import { getQOMPrice } from "@/lib/qom-pricing"
import { CheckIcon, XIcon, ClockIcon, DollarSignIcon, MessageSquareIcon } from "@/components/simple-icons"
import Image from "next/image"
import Link from "next/link"

interface OffersListProps {
  type: "sent" | "received"
}

export function OffersList({ type }: OffersListProps) {
  const { address } = useWallet()
  const [offers, setOffers] = useState<Offer[]>([])
  const [filter, setFilter] = useState<"all" | "pending" | "accepted" | "rejected">("all")
  const qomPrice = getQOMPrice()

  useEffect(() => {
    if (!address) return

    // Mark expired offers
    OffersSystem.markExpiredOffers()

    // Load offers
    const loadedOffers =
      type === "sent" ? OffersSystem.getOffersSentByUser(address) : OffersSystem.getOffersReceivedByUser(address)

    // Sort by date (newest first)
    loadedOffers.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    setOffers(loadedOffers)
  }, [address, type])

  const handleAcceptOffer = (offerId: string) => {
    if (!address) return

    const success = OffersSystem.acceptOffer(offerId, address)
    if (success) {
      // Reload offers
      const updatedOffers =
        type === "sent" ? OffersSystem.getOffersSentByUser(address) : OffersSystem.getOffersReceivedByUser(address)
      setOffers(updatedOffers)
      alert("Offer accepted! The NFT ownership will be transferred.")
    }
  }

  const handleRejectOffer = (offerId: string) => {
    if (!address) return

    const success = OffersSystem.rejectOffer(offerId, address)
    if (success) {
      // Reload offers
      const updatedOffers =
        type === "sent" ? OffersSystem.getOffersSentByUser(address) : OffersSystem.getOffersReceivedByUser(address)
      setOffers(updatedOffers)
    }
  }

  const handleCancelOffer = (offerId: string) => {
    if (!address) return

    const success = OffersSystem.cancelOffer(offerId, address)
    if (success) {
      // Reload offers
      const updatedOffers = OffersSystem.getOffersSentByUser(address)
      setOffers(updatedOffers)
    }
  }

  const filteredOffers = offers.filter((offer) => {
    if (filter === "all") return true
    return offer.status === filter
  })

  const getStatusBadge = (status: Offer["status"]) => {
    const variants: Record<Offer["status"], { variant: any; label: string }> = {
      pending: { variant: "default", label: "Pending" },
      accepted: { variant: "default", label: "Accepted" },
      rejected: { variant: "destructive", label: "Rejected" },
      expired: { variant: "secondary", label: "Expired" },
      cancelled: { variant: "secondary", label: "Cancelled" },
    }

    const config = variants[status]
    return (
      <Badge variant={config.variant} className="capitalize">
        {config.label}
      </Badge>
    )
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
  }

  const isExpiringSoon = (expiresAt: string) => {
    const expires = new Date(expiresAt)
    const now = new Date()
    const daysUntilExpiry = (expires.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    return daysUntilExpiry <= 2 && daysUntilExpiry > 0
  }

  if (!address) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Connect your wallet to view offers</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filter tabs */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setFilter("all")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            filter === "all"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          All ({offers.length})
        </button>
        <button
          onClick={() => setFilter("pending")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            filter === "pending"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Pending ({offers.filter((o) => o.status === "pending").length})
        </button>
        <button
          onClick={() => setFilter("accepted")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            filter === "accepted"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Accepted ({offers.filter((o) => o.status === "accepted").length})
        </button>
        <button
          onClick={() => setFilter("rejected")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            filter === "rejected"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Rejected ({offers.filter((o) => o.status === "rejected").length})
        </button>
      </div>

      {/* Offers list */}
      {filteredOffers.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            {filter === "all" ? `No offers ${type === "sent" ? "sent" : "received"} yet` : `No ${filter} offers`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOffers.map((offer) => (
            <Card key={offer.id} className="p-4">
              <div className="flex gap-4">
                {/* NFT Image */}
                <Link href={`/nft/${offer.nftId}`} className="flex-shrink-0">
                  <div className="relative w-24 h-24 rounded-lg overflow-hidden">
                    <Image
                      src={offer.nftImage || "/placeholder.svg"}
                      alt={offer.nftTitle}
                      fill
                      className="object-cover"
                    />
                  </div>
                </Link>

                {/* Offer Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div>
                      <Link href={`/nft/${offer.nftId}`} className="font-semibold hover:underline line-clamp-1">
                        {offer.nftTitle}
                      </Link>
                      <p className="text-sm text-muted-foreground">
                        {type === "sent" ? "To" : "From"}:{" "}
                        {type === "sent"
                          ? offer.toAddress.slice(0, 6) + "..." + offer.toAddress.slice(-4)
                          : offer.fromAddress.slice(0, 6) + "..." + offer.fromAddress.slice(-4)}
                      </p>
                    </div>
                    {getStatusBadge(offer.status)}
                  </div>

                  <div className="flex items-center gap-4 text-sm mb-2">
                    <div className="flex items-center gap-1 font-semibold">
                      <DollarSignIcon className="h-4 w-4" />
                      <span>{offer.offerAmount} QOM</span>
                      <span className="text-muted-foreground font-normal">(${offer.offerAmountUSD.toFixed(2)})</span>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <ClockIcon className="h-4 w-4" />
                      <span>
                        {offer.status === "pending"
                          ? `Expires ${formatDate(offer.expiresAt)}`
                          : `Created ${formatDate(offer.createdAt)}`}
                      </span>
                      {offer.status === "pending" && isExpiringSoon(offer.expiresAt) && (
                        <Badge variant="destructive" className="ml-2">
                          Expiring Soon
                        </Badge>
                      )}
                    </div>
                  </div>

                  {offer.message && (
                    <div className="flex items-start gap-2 text-sm text-muted-foreground mb-3 p-2 bg-muted/50 rounded">
                      <MessageSquareIcon className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <p className="line-clamp-2">{offer.message}</p>
                    </div>
                  )}

                  {/* Actions */}
                  {offer.status === "pending" && (
                    <div className="flex gap-2">
                      {type === "received" ? (
                        <>
                          <Button size="sm" onClick={() => handleAcceptOffer(offer.id)} className="gap-1">
                            <CheckIcon className="h-4 w-4" />
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRejectOffer(offer.id)}
                            className="gap-1"
                          >
                            <XIcon className="h-4 w-4" />
                            Reject
                          </Button>
                        </>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCancelOffer(offer.id)}
                          className="gap-1"
                        >
                          <XIcon className="h-4 w-4" />
                          Cancel Offer
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
