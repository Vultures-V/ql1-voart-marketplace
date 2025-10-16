"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { NFTManagementModal } from "@/components/nft-management-modal"
import { OffersList } from "@/components/offers-list"
import {
  Heart,
  ShoppingCart,
  TrendingUpIcon,
  Clock,
  Gavel,
  Plus,
  Settings,
  Eye,
  RefreshCw,
} from "@/components/simple-icons"
import { useWallet } from "@/hooks/use-wallet"
import { useBlockchainNFTs } from "@/hooks/use-blockchain-nfts"
import { NFTManager } from "@/lib/nft-management"
import { StorageManager } from "@/lib/storage-utils"
import Image from "next/image"
import Link from "next/link"

export function ProfileTabs() {
  const [activeTab, setActiveTab] = useState("created")
  const [createdNFTs, setCreatedNFTs] = useState<any[]>([])
  const [ownedNFTs, setOwnedNFTs] = useState<any[]>([])
  const [favoriteNFTs, setFavoriteNFTs] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [offersTab, setOffersTab] = useState<"received" | "sent">("received")

  const { address } = useWallet()
  const { nfts: blockchainNFTs, isLoading: isLoadingBlockchain, refresh: refreshBlockchainNFTs } = useBlockchainNFTs()

  useEffect(() => {
    loadUserNFTs()
  }, [address, blockchainNFTs])

  const loadUserNFTs = () => {
    if (!address) {
      setIsLoading(false)
      return
    }

    try {
      const userCreatedNFTs = NFTManager.getUserCreatedNFTs(address)
      const visibleCreatedNFTs = userCreatedNFTs.filter((nft) => !nft.status.isHidden && !nft.status.isBurned)
      setCreatedNFTs(visibleCreatedNFTs)

      const userOwnedNFTs = StorageManager.getUserOwnedNFTs(address)
      const filteredOwnedNFTs = userOwnedNFTs.filter((nft) => !nft.status.isDeleted)

      const formattedBlockchainNFTs = blockchainNFTs.map((nft) => ({
        id: `${nft.contractAddress}-${nft.tokenId}`,
        name: nft.metadata?.name || `${nft.name} #${nft.tokenId}`,
        image: nft.metadata?.image || "/placeholder.svg",
        description: nft.metadata?.description || "",
        price: "Not Listed",
        currency: "QOM",
        creator: address,
        creatorName: "External",
        rarity: "Unknown",
        likes: 0,
        views: 0,
        isExternal: true,
        contractAddress: nft.contractAddress,
        tokenId: nft.tokenId,
        attributes: nft.metadata?.attributes || [],
      }))

      const allOwnedNFTs = [...filteredOwnedNFTs, ...formattedBlockchainNFTs]
      setOwnedNFTs(allOwnedNFTs)

      const userLikes = JSON.parse(localStorage.getItem(`user-likes-${address}`) || "[]")
      const marketplaceNFTs = JSON.parse(localStorage.getItem("marketplace-nfts") || "[]")
      const likedNFTs = marketplaceNFTs.filter((nft: any) => userLikes.includes(nft.id) && !nft.status.isDeleted)
      setFavoriteNFTs(likedNFTs)
    } catch (error) {
      console.error("Error loading user NFTs:", error)
    } finally {
      setIsLoading(false)
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

  const NFTCard = ({ nft, showManagement = false }: { nft: any; showManagement?: boolean }) => (
    <Card key={nft.id} className="origami-card group hover:scale-105 transition-all duration-300">
      <CardContent className="p-0">
        <div className="relative">
          <Image
            src={nft.image || "/placeholder.svg"}
            alt={nft.name}
            width={300}
            height={300}
            className="w-full aspect-square object-cover rounded-t-lg"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            loading="lazy"
          />

          <div className="absolute top-3 left-3 flex flex-col space-y-1">
            {nft.isExternal && (
              <Badge variant="secondary" className="bg-green-500/10 text-green-500">
                On-Chain
              </Badge>
            )}
            <Badge className={getRarityColor(nft.rarity)}>{nft.rarity}</Badge>
            {nft.status?.isListed === false && !nft.status?.isBurned && <Badge variant="secondary">Delisted</Badge>}
            {nft.status?.isTransferred && <Badge variant="outline">Transferred</Badge>}
          </div>

          {showManagement && address && (
            <div className="absolute top-3 right-3">
              <NFTManagementModal nft={nft} userAddress={address} onUpdate={loadUserNFTs}>
                <Button size="sm" variant="secondary" className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <Settings className="w-4 h-4" />
                </Button>
              </NFTManagementModal>
            </div>
          )}

          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-t-lg flex items-center justify-center">
            <Link href={`/nft/${nft.id}`}>
              <Button variant="secondary" size="sm">
                <Eye className="w-4 h-4 mr-1" />
                View Details
              </Button>
            </Link>
          </div>
        </div>

        <div className="p-4">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-semibold text-foreground text-sm truncate">{nft.name}</h3>
            <div className="text-right ml-2">
              <p className="text-sm font-bold text-primary">
                {nft.price} {nft.currency}
              </p>
            </div>
          </div>

          <p className="text-xs text-muted-foreground mb-3 truncate">
            by {nft.creatorName || `${nft.creator?.slice(0, 6)}...${nft.creator?.slice(-4)}`}
          </p>

          <div className="flex justify-between items-center text-xs text-muted-foreground">
            <div className="flex items-center space-x-3">
              <span className="flex items-center">
                <Heart className="w-3 h-3 mr-1" />
                {nft.likes || 0}
              </span>
              <span className="flex items-center">
                <Eye className="w-3 h-3 mr-1" />
                {nft.views || 0}
              </span>
            </div>
            {showManagement && !nft.isExternal && (
              <NFTManagementModal nft={nft} userAddress={address!} onUpdate={loadUserNFTs}>
                <Button variant="ghost" size="sm" className="h-6 px-2">
                  <Settings className="w-3 h-3" />
                </Button>
              </NFTManagementModal>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )

  const EmptyState = ({
    title,
    description,
    actionText,
    onAction,
  }: {
    title: string
    description: string
    actionText?: string
    onAction?: () => void
  }) => (
    <div className="text-center py-12">
      <div className="max-w-md mx-auto">
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-muted-foreground mb-6">{description}</p>
        {actionText && onAction && (
          <Button onClick={onAction} className="origami-button">
            <Plus className="w-4 h-4 mr-2" />
            {actionText}
          </Button>
        )}
      </div>
    </div>
  )

  if (isLoading || isLoadingBlockchain) {
    return (
      <div className="origami-card">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="ml-3 text-muted-foreground">Scanning blockchain for your NFTs...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="origami-card">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5 mb-6">
          <TabsTrigger value="created" className="flex items-center gap-2">
            <TrendingUpIcon className="w-4 h-4" />
            Created ({createdNFTs.length})
          </TabsTrigger>
          <TabsTrigger value="owned" className="flex items-center gap-2">
            <ShoppingCart className="w-4 h-4" />
            Owned ({ownedNFTs.length})
          </TabsTrigger>
          <TabsTrigger value="favorited" className="flex items-center gap-2">
            <Heart className="w-4 h-4" />
            Favorited ({favoriteNFTs.length})
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Activity
          </TabsTrigger>
          <TabsTrigger value="offers" className="flex items-center gap-2">
            <Gavel className="w-4 h-4" />
            Offers
          </TabsTrigger>
        </TabsList>

        <TabsContent value="created" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Created NFTs ({createdNFTs.length})</h3>
            <Link href="/mint">
              <Button variant="outline" size="sm">
                Create New NFT
              </Button>
            </Link>
          </div>
          {createdNFTs.length === 0 ? (
            <EmptyState
              title="No NFTs Created Yet"
              description="Start your creative journey by minting your first NFT. Share your art with the world!"
              actionText="Create Your First NFT"
              onAction={() => {
                window.location.href = "/mint"
              }}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {createdNFTs.map((nft) => (
                <NFTCard key={nft.id} nft={nft} showManagement={true} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="owned" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Owned NFTs ({ownedNFTs.length})</h3>
            <Button variant="outline" size="sm" onClick={refreshBlockchainNFTs} disabled={isLoadingBlockchain}>
              <RefreshCw className={`w-4 h-4 mr-1 ${isLoadingBlockchain ? "animate-spin" : ""}`} />
              {isLoadingBlockchain ? "Scanning..." : "Refresh NFTs"}
            </Button>
          </div>
          {ownedNFTs.length === 0 ? (
            <EmptyState
              title="No NFTs Owned"
              description="Explore the marketplace to discover and collect amazing NFTs from talented creators."
              actionText="Browse Marketplace"
              onAction={() => {
                window.location.href = "/marketplace"
              }}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {ownedNFTs.map((nft) => (
                <NFTCard key={nft.id} nft={nft} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="favorited" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Favorited NFTs ({favoriteNFTs.length})</h3>
          </div>
          {favoriteNFTs.length === 0 ? (
            <EmptyState
              title="No Favorites Yet"
              description="Heart the NFTs you love to keep track of them here. Build your wishlist!"
              actionText="Explore NFTs"
              onAction={() => {
                window.location.href = "/marketplace"
              }}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {favoriteNFTs.map((nft) => (
                <NFTCard key={nft.id} nft={nft} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <h3 className="text-lg font-semibold">Recent Activity</h3>
          <EmptyState
            title="No Activity Yet"
            description="Your trading history, mints, and transactions will appear here once you start using the platform."
          />
        </TabsContent>

        <TabsContent value="offers" className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Offers</h3>
            <div className="flex gap-2">
              <Button
                variant={offersTab === "received" ? "default" : "outline"}
                size="sm"
                onClick={() => setOffersTab("received")}
              >
                Received
              </Button>
              <Button
                variant={offersTab === "sent" ? "default" : "outline"}
                size="sm"
                onClick={() => setOffersTab("sent")}
              >
                Sent
              </Button>
            </div>
          </div>
          <OffersList type={offersTab} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
