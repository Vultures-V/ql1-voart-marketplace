"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { SocialShare } from "@/components/social-share"
import { CommentSystem } from "@/components/comment-system"
import { MakeOfferDialog } from "@/components/make-offer-dialog"
import {
  Heart,
  Share2,
  Flag,
  Eye,
  Clock,
  Zap,
  ExternalLink,
  ShoppingCart,
  DollarSign,
  Trash2,
  EyeOff,
  Shield,
  Ban,
} from "@/components/simple-icons"
import Link from "next/link"
import Image from "next/image"
import { useWallet } from "@/hooks/use-wallet"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { NFTManager } from "@/lib/nft-management"
import { isAdminWallet } from "@/lib/admin-utils"
import { StorageManager } from "@/lib/storage-utils"
import { qomToUSD, formatUSD } from "@/lib/qom-pricing"

interface NFT {
  id: number
  name: string
  description: string
  image: string
  price: string
  currency: string
  creator: string
  creatorName?: string
  likes: number
  views: number
  isLazyMinted: boolean
  category: string
  rarity: string
  contractType?: string
  properties?: {
    color?: string
    tags?: string[]
  }
  saleType?: string
  auctionDuration?: string
  royalty?: {
    percentage: string
    address: string
  }
  createdAt?: string
  status?: string
}

export default function NFTDetailPage({ params }: { params: { id: string } }) {
  const [nft, setNft] = useState<NFT | null>(null)
  const [isLiked, setIsLiked] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isPurchasing, setIsPurchasing] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showOfferDialog, setShowOfferDialog] = useState(false)
  const [wasDeleted, setWasDeleted] = useState(false)

  const { isConnected, address } = useWallet()
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    const loadNFT = () => {
      try {
        console.log("[v0] ========== NFT DETAIL LOAD ==========")
        console.log("[v0] Loading NFT ID:", params.id)
        console.log("[v0] Connected wallet:", address || "Not connected")

        const storedNFTs = JSON.parse(localStorage.getItem("marketplace-nfts") || "[]")
        console.log("[v0] Total NFTs in storage:", storedNFTs.length)

        const defaultNFTs = [
          {
            id: 1,
            name: "Golden Crane Digital Art",
            description:
              "A masterpiece of digital art, this golden crane represents peace, prosperity, and eternal beauty. Created using traditional Japanese techniques combined with modern digital artistry.",
            image: "/golden-origami-crane-digital-art.jpg",
            price: "2.5",
            currency: "QOM",
            creator: "0x0000000000000000000000000000000000000000",
            creatorName: "Master Akira",
            likes: 24,
            views: 156,
            isLazyMinted: true,
            category: "Art",
            rarity: "Rare",
            contractType: "ERC721",
            properties: {
              color: "Gold",
              tags: ["traditional", "crane", "digital-art"],
            },
            saleType: "fixed",
            royalty: {
              percentage: "10",
              address: "0x0000000000000000000000000000000000000000",
            },
            createdAt: new Date(Date.now() - 86400000).toISOString(),
            status: "listed",
          },
          {
            id: 2,
            name: "Digital Paper Dragon",
            description:
              "An epic digital dragon crafted from virtual paper, breathing neon fire in the digital realm. This piece combines ancient mythology with futuristic aesthetics.",
            image: "/digital-paper-dragon-neon.jpg",
            price: "1.8",
            currency: "QOM",
            creator: "0x8ba1f109551bD432803012645Hac136c30C6213",
            creatorName: "Paper Artist",
            likes: 18,
            views: 89,
            isLazyMinted: false,
            category: "Art",
            rarity: "Epic",
            contractType: "ERC721",
            properties: {
              color: "Neon",
              tags: ["dragon", "mythology", "neon"],
            },
            saleType: "fixed",
            royalty: {
              percentage: "15",
              address: "0x8ba1f109551bD432803012645Hac136c30C6213",
            },
            createdAt: new Date(Date.now() - 172800000).toISOString(),
            status: "listed",
          },
        ]

        const allNFTs = [...storedNFTs, ...defaultNFTs]
        const foundNFT = allNFTs.find((n) => n.id.toString() === params.id)

        if (foundNFT) {
          console.log("[v0] NFT found:", {
            id: foundNFT.id,
            name: foundNFT.name,
            creator: foundNFT.creator,
            creatorShort: `${foundNFT.creator?.slice(0, 6)}...${foundNFT.creator?.slice(-4)}`,
            status: foundNFT.status,
          })
          console.log("[v0] Ownership check:", {
            nftCreator: foundNFT.creator,
            connectedWallet: address,
            isOwner: foundNFT.creator === address,
            isAdmin: isAdminWallet(address),
          })

          setNft(foundNFT)
          setWasDeleted(false)

          const updatedNFT = { ...foundNFT, views: foundNFT.views + 1 }
          const updatedNFTs = allNFTs.map((n) => (n.id === foundNFT.id ? updatedNFT : n))

          const userNFTs = updatedNFTs.filter((n) => !defaultNFTs.some((d) => d.id === n.id))
          localStorage.setItem("marketplace-nfts", JSON.stringify(userNFTs))

          setNft(updatedNFT)

          if (address) {
            const userLikes = JSON.parse(localStorage.getItem(`user-likes-${address}`) || "[]")
            setIsLiked(userLikes.includes(foundNFT.id))
          }
        } else {
          console.log("[v0] NFT not found in storage")
          console.log(
            "[v0] Available NFT IDs:",
            allNFTs.map((n) => n.id),
          )
          setNft(null)
          setWasDeleted(true)
        }
        console.log("[v0] =====================================")
      } catch (error) {
        console.error("[v0] Error loading NFT:", error)
        toast({
          title: "Error loading NFT",
          description: "Failed to load NFT details",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadNFT()

    const handleStorageChange = () => {
      console.log("[v0] Storage changed, reloading NFT data")
      loadNFT()
    }

    window.addEventListener("storage", handleStorageChange)

    return () => {
      window.removeEventListener("storage", handleStorageChange)
    }
  }, [params.id, address, toast])

  const handleLike = () => {
    if (!isConnected) {
      toast({
        title: "Connect wallet",
        description: "Please connect your wallet to like NFTs",
        variant: "destructive",
      })
      return
    }

    if (!nft) return

    const newIsLiked = !isLiked
    setIsLiked(newIsLiked)

    // Update NFT likes count
    const updatedNFT = { ...nft, likes: newIsLiked ? nft.likes + 1 : nft.likes - 1 }
    setNft(updatedNFT)

    // Update user's liked NFTs
    const userLikes = JSON.parse(localStorage.getItem(`user-likes-${address}`) || "[]")
    const updatedLikes = newIsLiked ? [...userLikes, nft.id] : userLikes.filter((id: number) => id !== nft.id)

    localStorage.setItem(`user-likes-${address}`, JSON.stringify(updatedLikes))

    toast({
      title: newIsLiked ? "Added to favorites" : "Removed from favorites",
      description: newIsLiked ? "NFT added to your favorites" : "NFT removed from your favorites",
    })
  }

  const handlePurchase = async () => {
    if (!isConnected) {
      toast({
        title: "Connect wallet",
        description: "Please connect your wallet to purchase NFTs",
        variant: "destructive",
      })
      return
    }

    if (!nft) return

    const isAdmin = isAdminWallet(address)
    if (nft.creator === address && !isAdmin) {
      toast({
        title: "Cannot buy own NFT",
        description: "You cannot purchase your own NFT",
        variant: "destructive",
      })
      return
    }

    setIsPurchasing(true)

    try {
      // Simulate purchase transaction
      toast({
        title: "Purchase initiated",
        description: `Purchasing ${nft.name} for ${nft.price} ${nft.currency}...`,
      })

      // Simulate transaction delay
      await new Promise((resolve) => setTimeout(resolve, 3000))

      // Update NFT status to sold
      const updatedNFT = { ...nft, status: "sold" }
      setNft(updatedNFT)

      const userOwnedNFTs = StorageManager.getUserOwnedNFTs(address)
      userOwnedNFTs.push({
        id: nft.id,
        name: nft.name,
        price: nft.price,
        currency: nft.currency,
        creator: nft.creator,
        purchasedAt: new Date().toISOString(),
        purchasePrice: nft.price,
      })

      const success = StorageManager.setUserOwnedNFTs(address, userOwnedNFTs)

      if (!success) {
        throw new Error("Failed to save purchase data. Storage quota exceeded.")
      }

      toast({
        title: "Purchase successful!",
        description: `You now own ${nft.name}. Check your collection to view it.`,
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to complete the purchase. Please try again."
      toast({
        title: "Purchase failed",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsPurchasing(false)
    }
  }

  const handleDeleteNFT = async () => {
    if (!address || !nft) return

    setIsDeleting(true)
    try {
      const success = NFTManager.burnNFT(nft.id, address)

      if (success) {
        toast({
          title: "NFT Deleted",
          description: "Your NFT has been permanently deleted from the marketplace.",
        })

        // Redirect to profile after deletion
        setTimeout(() => {
          router.push("/profile")
        }, 2000)
      } else {
        throw new Error("Failed to delete NFT")
      }
    } catch (error) {
      toast({
        title: "Delete failed",
        description: "Failed to delete the NFT. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  const handleDelistNFT = async () => {
    if (!address || !nft) return

    try {
      const success = NFTManager.delistNFT(nft.id, address)

      if (success) {
        setNft({ ...nft, status: "delisted" })
        toast({
          title: "NFT Delisted",
          description: "Your NFT has been removed from the marketplace but you still own it.",
        })
      } else {
        throw new Error("Failed to delist NFT")
      }
    } catch (error) {
      toast({
        title: "Delist failed",
        description: "Failed to delist the NFT. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleHideNFT = async () => {
    if (!address || !nft) return

    try {
      const success = NFTManager.hideNFT(nft.id, address)

      if (success) {
        toast({
          title: "NFT Hidden",
          description: "Your NFT has been hidden from your profile but remains on the marketplace.",
        })
      } else {
        throw new Error("Failed to hide NFT")
      }
    } catch (error) {
      toast({
        title: "Hide failed",
        description: "Failed to hide the NFT. Please try again.",
        variant: "destructive",
      })
    }
  }

  const getRarityColor = (rarity: string) => {
    if (!rarity) return "bg-gray-500/10 text-gray-500"

    switch (rarity.toLowerCase()) {
      case "common":
        return "bg-gray-500/10 text-gray-500"
      case "uncommon":
        return "bg-green-500/10 text-green-500"
      case "rare":
        return "bg-blue-500/10 text-blue-500"
      case "epic":
        return "bg-purple-500/10 text-purple-500"
      case "legendary":
        return "bg-orange-500/10 text-orange-500"
      default:
        return "bg-gray-500/10 text-gray-500"
    }
  }

  const PurchaseButtons = () => (
    <div className="flex flex-col sm:flex-row gap-3">
      <Button className="origami-button flex-1" onClick={handlePurchase} disabled={isPurchasing}>
        {isPurchasing ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            Processing...
          </>
        ) : (
          <>
            <ShoppingCart className="w-4 h-4 mr-2" />
            Buy Now
          </>
        )}
      </Button>
      <Button variant="secondary" className="origami-card flex-1" onClick={() => setShowOfferDialog(true)}>
        <DollarSign className="w-4 h-4 mr-2" />
        Make Offer
      </Button>
    </div>
  )

  const CreatorManagementButtons = () => {
    const isAdmin = isAdminWallet(address)
    const isCreator = nft?.creator === address
    const hasManagementAccess = isAdmin || isCreator

    console.log("[v0] ========== OWNERSHIP CHECK ==========")
    console.log("[v0] NFT ID:", nft?.id)
    console.log("[v0] NFT Creator:", nft?.creator)
    console.log("[v0] Connected Wallet:", address)
    console.log("[v0] Is Creator:", isCreator)
    console.log("[v0] Is Admin:", isAdmin)
    console.log("[v0] Has Management Access:", hasManagementAccess)
    console.log("[v0] =====================================")

    if (!hasManagementAccess) return null

    return (
      <div className="space-y-3">
        <div className="text-center p-3 bg-primary/10 rounded-lg">
          {isAdmin && !isCreator ? (
            <div className="flex items-center justify-center space-x-2">
              <Shield className="w-4 h-4 text-primary" />
              <p className="text-primary font-medium text-sm">Admin Access</p>
            </div>
          ) : (
            <p className="text-primary font-medium text-sm">You own this NFT</p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-2">
          {!nft?.status ||
            (nft.status === "listed" && (
              <Button variant="secondary" className="origami-card w-full text-sm" onClick={handleDelistNFT}>
                <EyeOff className="w-4 h-4 mr-2" />
                Remove from Sale
              </Button>
            ))}

          <Button variant="secondary" className="origami-card w-full text-sm" onClick={handleHideNFT}>
            <EyeOff className="w-4 h-4 mr-2" />
            Hide from Profile
          </Button>

          <Button variant="destructive" className="w-full text-sm" onClick={() => setShowDeleteConfirm(true)}>
            <Trash2 className="w-4 h-4 mr-2" />
            Delete NFT
          </Button>
        </div>

        {/* Delete Confirmation Dialog */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-background border rounded-lg p-6 max-w-md mx-4">
              <h3 className="text-lg font-semibold text-foreground mb-2">Delete NFT</h3>
              <p className="text-muted-foreground mb-4">
                Are you sure you want to permanently delete this NFT? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  className="origami-card flex-1"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                >
                  Cancel
                </Button>
                <Button variant="destructive" className="flex-1" onClick={handleDeleteNFT} disabled={isDeleting}>
                  {isDeleting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading NFT details...</p>
        </div>
      </div>
    )
  }

  if (!nft || wasDeleted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Ban className="w-10 h-10 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-4">{wasDeleted ? "NFT Deleted" : "NFT Not Found"}</h1>
          <p className="text-muted-foreground mb-6">
            {wasDeleted
              ? "This NFT has been removed from the marketplace by an administrator."
              : "The NFT you're looking for doesn't exist or has been removed."}
          </p>
          <Link href="/marketplace">
            <Button className="origami-button">Back to Marketplace</Button>
          </Link>
        </div>
      </div>
    )
  }

  const isAdmin = isAdminWallet(address)
  const isOwner = nft.creator === address
  const hasOwnershipAccess = isOwner || isAdmin
  const isSold = nft.status === "sold"
  const isDelisted = nft.status === "delisted"

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* NFT Image */}
          <div className="space-y-3">
            <Card className="origami-card">
              <CardContent className="p-0">
                <div className="relative">
                  <Image
                    src={nft.image || "/placeholder.svg"}
                    alt={nft.name}
                    width={250}
                    height={250}
                    className="w-full aspect-square object-cover rounded-lg"
                    sizes="(max-width: 1024px) 100vw, 25vw"
                    priority={true}
                    placeholder="blur"
                    blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
                  />

                  {/* Badges */}
                  <div className="absolute top-3 left-3 flex flex-col space-y-1">
                    {nft.isLazyMinted && (
                      <Badge className="bg-primary/90 text-primary-foreground text-xs">
                        <Zap className="w-3 h-3 mr-1" />
                        Lazy Mint
                      </Badge>
                    )}
                    <Badge className={`text-xs ${getRarityColor(nft.rarity)}`}>{nft.rarity}</Badge>
                    {isSold && <Badge className="bg-red-500/90 text-white text-xs">SOLD</Badge>}
                    {isDelisted && <Badge className="bg-yellow-500/90 text-white text-xs">DELISTED</Badge>}
                  </div>

                  {/* Action buttons */}
                  <div className="absolute top-3 right-3 flex space-x-1">
                    <button
                      onClick={handleLike}
                      className={`p-1.5 rounded-full transition-colors ${
                        isLiked ? "bg-red-500 text-white" : "bg-black/50 text-white hover:bg-black/70"
                      }`}
                    >
                      <Heart className="w-3.5 h-3.5" fill={isLiked ? "currentColor" : "none"} />
                    </button>
                    <button className="p-1.5 bg-black/50 rounded-full hover:bg-black/70 transition-colors text-white">
                      <Share2 className="w-3.5 h-3.5" />
                    </button>
                    <button className="p-1.5 bg-black/50 rounded-full hover:bg-black/70 transition-colors text-white">
                      <Flag className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2">
              <Card className="origami-card">
                <CardContent className="p-2 text-center">
                  <div className="flex items-center justify-center space-x-1 text-muted-foreground">
                    <Heart className="w-3 h-3" />
                    <span className="text-xs">Likes</span>
                  </div>
                  <p className="text-sm font-bold text-foreground">{nft.likes}</p>
                </CardContent>
              </Card>
              <Card className="origami-card">
                <CardContent className="p-2 text-center">
                  <div className="flex items-center justify-center space-x-1 text-muted-foreground">
                    <Eye className="w-3 h-3" />
                    <span className="text-xs">Views</span>
                  </div>
                  <p className="text-sm font-bold text-foreground">{nft.views}</p>
                </CardContent>
              </Card>
              <Card className="origami-card">
                <CardContent className="p-2 text-center">
                  <div className="flex items-center justify-center space-x-1 text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span className="text-xs">Created</span>
                  </div>
                  <p className="text-sm font-bold text-foreground">
                    {nft.createdAt ? new Date(nft.createdAt).toLocaleDateString() : "Recently"}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* NFT Details */}
          <div className="space-y-4">
            {/* Header */}
            <div>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-2">
                <span>{nft.category}</span>
                {nft.contractType && (
                  <>
                    <span>•</span>
                    <span>{nft.contractType}</span>
                  </>
                )}
              </div>
              <h1 className="text-lg font-bold text-foreground mb-2">{nft.name}</h1>

              {/* Creator */}
              <div className="flex items-center space-x-3">
                <Avatar className="w-7 h-7">
                  <AvatarImage src="/placeholder.svg" />
                  <AvatarFallback className="text-xs">
                    {(nft.creatorName || nft.creator.slice(2, 4)).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-xs text-muted-foreground">Created by</p>
                  <p className="text-sm font-medium text-foreground">
                    {nft.creatorName || `${nft.creator.slice(0, 6)}...${nft.creator.slice(-4)}`}
                  </p>
                </div>
              </div>
            </div>

            {/* Price & Purchase */}
            <Card className="origami-card">
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-xs text-muted-foreground">{isSold ? "Sold for" : "Current Price"}</p>
                    <p className="text-lg font-bold text-primary">
                      {nft.price} {nft.currency}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      ≈ {formatUSD(qomToUSD(Number.parseFloat(nft.price)))}
                    </p>
                  </div>
                  {nft.saleType === "auction" && !isSold && (
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Ends in</p>
                      <p className="text-base font-semibold text-foreground">5d 12h 30m</p>
                    </div>
                  )}
                </div>

                {!isSold && !hasOwnershipAccess && <PurchaseButtons />}

                {hasOwnershipAccess && <CreatorManagementButtons />}

                {isSold && (
                  <div className="text-center p-3 bg-red-500/10 rounded-lg">
                    <p className="text-red-500 font-medium text-sm">This NFT has been sold</p>
                  </div>
                )}

                {isDelisted && (
                  <div className="text-center p-3 bg-yellow-500/10 rounded-lg">
                    <p className="text-yellow-600 font-medium text-sm">This NFT has been delisted</p>
                  </div>
                )}

                <div className="flex items-center justify-center space-x-4 mt-3 pt-3 border-t">
                  <SocialShare
                    title={nft.name}
                    url={`https://nft-marketplace.vercel.app/nft/${params.id}`}
                    description={nft.description}
                  />
                  <button className="flex items-center space-x-1 text-sm text-muted-foreground hover:text-primary">
                    <ExternalLink className="w-4 h-4" />
                    <span>View on QL1 Explorer</span>
                  </button>
                </div>
              </CardContent>
            </Card>

            {/* Tabs */}
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="properties">Properties</TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="space-y-4">
                <Card className="origami-card">
                  <CardHeader>
                    <CardTitle>Description</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground leading-relaxed">{nft.description}</p>
                  </CardContent>
                </Card>

                <Card className="origami-card">
                  <CardHeader>
                    <CardTitle>Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Contract Type</span>
                      <span>{nft.contractType || "ERC721"}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Token ID</span>
                      <span className="font-mono text-sm">{nft.id}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Blockchain</span>
                      <span>QL1 Chain</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Category</span>
                      <span>{nft.category}</span>
                    </div>
                    {nft.royalty && (
                      <>
                        <Separator />
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Royalty</span>
                          <span>{nft.royalty.percentage}%</span>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="properties" className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {nft.properties?.color && (
                    <Card className="origami-card">
                      <CardContent className="p-4 text-center">
                        <p className="text-sm text-muted-foreground uppercase tracking-wide">Color</p>
                        <p className="font-semibold text-foreground">{nft.properties.color}</p>
                        <p className="text-xs text-muted-foreground mt-1">25% have this trait</p>
                      </CardContent>
                    </Card>
                  )}
                  <Card className="origami-card">
                    <CardContent className="p-4 text-center">
                      <p className="text-sm text-muted-foreground uppercase tracking-wide">Rarity</p>
                      <p className="font-semibold text-foreground">{nft.rarity}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {nft.rarity === "Legendary"
                          ? "5%"
                          : nft.rarity === "Epic"
                            ? "10%"
                            : nft.rarity === "Rare"
                              ? "20%"
                              : nft.rarity === "Uncommon"
                                ? "35%"
                                : "30%"}{" "}
                        have this trait
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="origami-card">
                    <CardContent className="p-4 text-center">
                      <p className="text-sm text-muted-foreground uppercase tracking-wide">Minting</p>
                      <p className="font-semibold text-foreground">{nft.isLazyMinted ? "Lazy Mint" : "Standard"}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {nft.isLazyMinted ? "60%" : "40%"} have this trait
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="origami-card">
                    <CardContent className="p-4 text-center">
                      <p className="text-sm text-muted-foreground uppercase tracking-wide">Category</p>
                      <p className="font-semibold text-foreground">{nft.category}</p>
                      <p className="text-xs text-muted-foreground mt-1">45% have this trait</p>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="history" className="space-y-4">
                <Card className="origami-card">
                  <CardContent className="p-0">
                    <div className="space-y-0">
                      <div className="flex items-center justify-between p-4 border-b">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                            <Clock className="w-4 h-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">Listed</p>
                            <p className="text-sm text-muted-foreground">
                              by {nft.creatorName || `${nft.creator.slice(0, 6)}...${nft.creator.slice(-4)}`}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-foreground">
                            {nft.price} {nft.currency}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {nft.createdAt ? new Date(nft.createdAt).toLocaleDateString() : "Recently"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                            <Zap className="w-4 h-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{nft.isLazyMinted ? "Lazy Minted" : "Minted"}</p>
                            <p className="text-sm text-muted-foreground">
                              by {nft.creatorName || `${nft.creator.slice(0, 6)}...${nft.creator.slice(-4)}`}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">
                            {nft.createdAt ? new Date(nft.createdAt).toLocaleDateString() : "Recently"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        <div className="mt-16">
          <CommentSystem nftId={params.id} comments={[]} />
        </div>
      </div>
      {nft && (
        <MakeOfferDialog
          open={showOfferDialog}
          onOpenChange={setShowOfferDialog}
          nft={{
            id: nft.id.toString(),
            title: nft.name,
            image: nft.image,
            price: Number.parseFloat(nft.price),
            creator: nft.creator,
            contractAddress: nft.contractType,
            tokenId: nft.id.toString(),
          }}
        />
      )}
    </div>
  )
}
