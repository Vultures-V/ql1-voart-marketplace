"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import {
  SearchIcon,
  FilterIcon,
  GridIcon,
  ListIcon,
  HeartIcon,
  EyeIcon,
  ZapIcon,
  ShoppingCartIcon,
  PackageIcon,
  XIcon,
} from "@/components/simple-icons"
import Link from "next/link"
import Image from "next/image"
import { useWallet } from "@/hooks/use-wallet"
import { useToast } from "@/hooks/use-toast"
import { processCommissionTransaction } from "@/lib/commission-system"
import { isAdminWallet } from "@/lib/admin-utils"
import { StorageManager } from "@/lib/storage-utils"
import { TransactionHistory } from "@/lib/transaction-history"
import { FavoritesSystem } from "@/lib/favorites-system"
import { NFTGridSkeleton } from "@/components/nft-card-skeleton"
import { EmptyState } from "@/components/empty-state"

interface NFT {
  id: number
  name: string
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
  status?: string
  description?: string
  isBurned?: boolean
}

const ITEMS_PER_PAGE = 20

export default function MarketplacePage() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState("recent")
  const [filterCategory, setFilterCategory] = useState("all")
  const [filterRarity, setFilterRarity] = useState("all")
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000])
  const [maxPrice, setMaxPrice] = useState(1000)
  const [currentPage, setCurrentPage] = useState(1)
  const [nfts, setNfts] = useState<NFT[]>([])
  const [favoriteIds, setFavoriteIds] = useState<Set<number>>(new Set())
  const [showDiagnostics, setShowDiagnostics] = useState(false)
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const { isConnected, address } = useWallet()
  const { toast } = useToast()

  useEffect(() => {
    const loadNFTs = () => {
      setIsLoading(true)

      if (typeof window !== "undefined") {
        StorageManager.cleanupOrphanedNFTReferences()
        StorageManager.synchronizeNFTStorage()
      }

      const storedNFTs = JSON.parse(localStorage.getItem("marketplace-nfts") || "[]")
      setNfts(storedNFTs)

      const prices = storedNFTs.map((nft: NFT) => Number.parseFloat(nft.price))
      const calculatedMaxPrice = prices.length > 0 ? Math.max(...prices) : 1000
      setMaxPrice(calculatedMaxPrice)
      setPriceRange([0, calculatedMaxPrice])

      if (address) {
        const userFavorites = FavoritesSystem.getFavoriteIds(address)
        setFavoriteIds(new Set(userFavorites))
      }

      setTimeout(() => setIsLoading(false), 500)
    }

    loadNFTs()

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "marketplace-nfts") {
        StorageManager.cleanupOrphanedNFTReferences()
        loadNFTs()
      }
    }

    const handleNFTAdded = () => {
      loadNFTs()
    }

    window.addEventListener("storage", handleStorageChange)
    window.addEventListener("nft-added", handleNFTAdded)

    return () => {
      window.removeEventListener("storage", handleStorageChange)
      window.removeEventListener("nft-added", handleNFTAdded)
    }
  }, [address])

  const handleLike = (nftId: number) => {
    if (!isConnected || !address) {
      toast({
        title: "Connect wallet",
        description: "Please connect your wallet to favorite NFTs",
        variant: "destructive",
      })
      return
    }

    const isFavorited = favoriteIds.has(nftId)

    if (isFavorited) {
      FavoritesSystem.removeFavorite(address, nftId)
      const newFavorites = new Set(favoriteIds)
      newFavorites.delete(nftId)
      setFavoriteIds(newFavorites)
    } else {
      FavoritesSystem.addFavorite(address, nftId)
      const newFavorites = new Set(favoriteIds)
      newFavorites.add(nftId)
      setFavoriteIds(newFavorites)
    }

    setNfts((prev) =>
      prev.map((nft) => (nft.id === nftId ? { ...nft, likes: isFavorited ? nft.likes - 1 : nft.likes + 1 } : nft)),
    )

    toast({
      title: isFavorited ? "Removed from favorites" : "Added to favorites",
      description: isFavorited ? "NFT removed from your favorites" : "NFT added to your favorites",
    })
  }

  const handleBuyNow = async (nft: NFT) => {
    if (!isConnected || !address) {
      toast({
        title: "Connect wallet",
        description: "Please connect your wallet to purchase NFTs",
        variant: "destructive",
      })
      return
    }

    const isAdmin = isAdminWallet(address)
    if (nft.creator === address && !isAdmin) {
      toast({
        title: "Cannot buy own NFT",
        description: "You cannot purchase your own NFT",
        variant: "destructive",
      })
      return
    }

    const salePrice = Number.parseFloat(nft.price)

    toast({
      title: "Purchase initiated",
      description: "Processing purchase with commission structure...",
    })

    try {
      const result = await processCommissionTransaction(address, nft.creator, salePrice, nft.id.toString())

      if (result.success) {
        setNfts((prev) => prev.map((n) => (n.id === nft.id ? { ...n, status: "sold" } : n)))

        const userOwnedNFTs = StorageManager.getUserOwnedNFTs(address)
        userOwnedNFTs.push({
          id: nft.id,
          name: nft.name,
          price: nft.price,
          currency: nft.currency,
          creator: nft.creator,
          purchasedAt: new Date().toISOString(),
          purchasePrice: salePrice,
          commissionPaid: result.breakdown.buyerCommission,
          transactionHash: result.transactionHash,
        })

        const success = StorageManager.setUserOwnedNFTs(address, userOwnedNFTs)

        if (!success) {
          throw new Error("Failed to save purchase data. Storage quota exceeded.")
        }

        TransactionHistory.addTransaction(address, {
          type: "purchase",
          nftId: nft.id,
          nftName: nft.name,
          nftImage: nft.image,
          price: nft.price,
          currency: nft.currency,
          from: nft.creator,
          to: address,
          transactionHash: result.transactionHash,
          commissionPaid: result.breakdown.buyerCommission,
        })

        toast({
          title: "Purchase successful!",
          description: `You now own ${nft.name}. Commission fees processed via QOM tokens.`,
        })
      } else {
        throw new Error(result.error || "Transaction failed")
      }
    } catch (error) {
      toast({
        title: "Purchase failed",
        description: error instanceof Error ? error.message : "Transaction failed",
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

  const filteredNFTs = nfts.filter((nft) => {
    const matchesSearch =
      nft.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (nft.creatorName || "").toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = filterCategory === "all" || nft.category.toLowerCase() === filterCategory
    const matchesRarity = filterRarity === "all" || nft.rarity.toLowerCase() === filterRarity
    const nftPrice = Number.parseFloat(nft.price)
    const matchesPrice = nftPrice >= priceRange[0] && nftPrice <= priceRange[1]
    const isAvailable =
      nft.status !== "sold" &&
      nft.status !== "deleted" &&
      nft.status !== "delisted" &&
      nft.status !== "transferred" &&
      !nft.isBurned &&
      !(nft.status && typeof nft.status === "object" && nft.status.isBurned)

    return matchesSearch && matchesCategory && matchesRarity && matchesPrice && isAvailable
  })

  const sortedNFTs = [...filteredNFTs].sort((a, b) => {
    switch (sortBy) {
      case "price-low":
        return Number.parseFloat(a.price) - Number.parseFloat(b.price)
      case "price-high":
        return Number.parseFloat(b.price) - Number.parseFloat(a.price)
      case "popular":
        return b.likes - a.likes
      case "recent":
      default:
        return b.id - a.id
    }
  })

  const totalPages = Math.ceil(sortedNFTs.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const paginatedNFTs = sortedNFTs.slice(startIndex, endIndex)

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, filterCategory, filterRarity, sortBy, priceRange])

  const PurchaseButton = ({ nft }: { nft: NFT }) => {
    const isAdmin = isAdminWallet(address)
    const canPurchase = nft.creator !== address || isAdmin

    return (
      <Button size="sm" className="origami-button" onClick={() => handleBuyNow(nft)} disabled={!canPurchase}>
        <ShoppingCartIcon className="w-4 h-4 mr-1" />
        Buy Now
      </Button>
    )
  }

  const clearAllFilters = () => {
    setSearchQuery("")
    setFilterCategory("all")
    setFilterRarity("all")
    setPriceRange([0, maxPrice])
    setCurrentPage(1)
  }

  const activeFiltersCount = [
    filterCategory !== "all",
    filterRarity !== "all",
    searchQuery !== "",
    priceRange[0] !== 0 || priceRange[1] !== maxPrice,
  ].filter(Boolean).length

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-4">NFT Marketplace</h1>
          <p className="text-muted-foreground text-lg">Discover unique digital art</p>
          <button
            onClick={() => setShowDiagnostics(!showDiagnostics)}
            className="mt-2 text-xs text-muted-foreground hover:text-foreground underline"
          >
            {showDiagnostics ? "Hide" : "Show"} Storage Diagnostics
          </button>
        </div>

        {/* Diagnostics Panel */}
        {showDiagnostics && (
          <Card className="origami-card mb-8 border-primary/50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <PackageIcon className="w-5 h-5" />
                Marketplace Storage Diagnostics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-muted/20 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Total NFTs in Marketplace</p>
                  <p className="text-2xl font-bold text-primary">{nfts.length}</p>
                </div>
                <div className="p-4 bg-muted/20 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Your NFTs</p>
                  <p className="text-2xl font-bold text-primary">
                    {nfts.filter((nft) => nft.creator === address).length}
                  </p>
                </div>
                <div className="p-4 bg-muted/20 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Other Creators</p>
                  <p className="text-2xl font-bold text-primary">
                    {nfts.filter((nft) => nft.creator !== address).length}
                  </p>
                </div>
              </div>

              <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                <p className="text-sm font-semibold mb-2">How the Marketplace Works:</p>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>The marketplace shows ALL NFTs from ALL wallets (global storage)</li>
                  <li>You can view and purchase NFTs from any creator</li>
                  <li>You can only edit/delete your own NFTs</li>
                  <li>If testing with multiple wallets in different browsers, each browser has separate storage</li>
                </ul>
              </div>

              {nfts.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-semibold">NFTs by Creator:</p>
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {Array.from(new Set(nfts.map((nft) => nft.creator))).map((creator) => {
                      const creatorNFTs = nfts.filter((nft) => nft.creator === creator)
                      const isCurrentWallet = creator === address
                      return (
                        <div
                          key={creator}
                          className={`text-xs p-2 rounded ${isCurrentWallet ? "bg-primary/10 border border-primary/30" : "bg-muted/20"}`}
                        >
                          <span className="font-mono">
                            {creator?.slice(0, 6)}...{creator?.slice(-4)}
                          </span>
                          {isCurrentWallet && <Badge className="ml-2 text-xs">You</Badge>}
                          <span className="ml-2 text-muted-foreground">({creatorNFTs.length} NFTs)</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Search and Filters */}
        <Card className="origami-card mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col gap-4">
              {/* Search and main controls */}
              <div className="flex flex-col lg:flex-row gap-4 items-center">
                {/* Search */}
                <div className="relative flex-1 w-full">
                  <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search NFTs, creators, collections..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-4 items-center">
                  <Select value={filterCategory} onValueChange={setFilterCategory}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="art">Art</SelectItem>
                      <SelectItem value="music">Music</SelectItem>
                      <SelectItem value="photography">Photography</SelectItem>
                      <SelectItem value="3d">3D Models</SelectItem>
                      <SelectItem value="origami">Origami</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={filterRarity} onValueChange={setFilterRarity}>
                    <SelectTrigger className="w-[120px]">
                      <SelectValue placeholder="Rarity" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Rarities</SelectItem>
                      <SelectItem value="common">Common</SelectItem>
                      <SelectItem value="uncommon">Uncommon</SelectItem>
                      <SelectItem value="rare">Rare</SelectItem>
                      <SelectItem value="epic">Epic</SelectItem>
                      <SelectItem value="legendary">Legendary</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="recent">Recently Listed</SelectItem>
                      <SelectItem value="price-low">Price: Low to High</SelectItem>
                      <SelectItem value="price-high">Price: High to Low</SelectItem>
                      <SelectItem value="popular">Most Popular</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* View Mode Toggle */}
                  <div className="flex border rounded-lg">
                    <button
                      onClick={() => setViewMode("grid")}
                      className={`p-2 ${viewMode === "grid" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
                    >
                      <GridIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setViewMode("list")}
                      className={`p-2 ${viewMode === "list" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
                    >
                      <ListIcon className="w-4 h-4" />
                    </button>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                    className="origami-card"
                  >
                    <FilterIcon className="w-4 h-4 mr-2" />
                    {showAdvancedFilters ? "Hide" : "Show"} Filters
                  </Button>
                </div>
              </div>

              {showAdvancedFilters && (
                <div className="p-4 bg-muted/20 rounded-lg space-y-4 border border-border/50">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-sm font-medium">Price Range (QOM)</label>
                      <span className="text-sm text-muted-foreground">
                        {priceRange[0]} - {priceRange[1]}
                      </span>
                    </div>
                    <Slider
                      min={0}
                      max={maxPrice}
                      step={1}
                      value={priceRange}
                      onValueChange={(value) => setPriceRange(value as [number, number])}
                      className="w-full"
                    />
                  </div>

                  {activeFiltersCount > 0 && (
                    <Button variant="outline" size="sm" onClick={clearAllFilters} className="w-full bg-transparent">
                      <XIcon className="w-4 h-4 mr-2" />
                      Clear All Filters ({activeFiltersCount})
                    </Button>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Results Count and Pagination Info */}
        {!isLoading && sortedNFTs.length > 0 && (
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <p className="text-muted-foreground">
              Showing {startIndex + 1}-{Math.min(endIndex, sortedNFTs.length)} of {sortedNFTs.length} results
            </p>
            <div className="flex items-center space-x-2">
              <FilterIcon className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Active filters: {activeFiltersCount}</span>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading ? (
          <NFTGridSkeleton count={20} />
        ) : sortedNFTs.length === 0 ? (
          nfts.length === 0 ? (
            <EmptyState
              icon={<PackageIcon className="w-10 h-10 text-primary" />}
              title="No NFTs Found"
              description="The marketplace is ready for your creations! Be the first to mint and list an NFT."
              action={{
                label: "Mint Your First NFT",
                href: "/mint",
              }}
            />
          ) : (
            <EmptyState
              icon={<SearchIcon className="w-10 h-10 text-primary" />}
              title="No NFTs Match Your Filters"
              description="No NFTs match your current search and filter criteria. Try adjusting your filters or clearing them."
              action={{
                label: "Clear All Filters",
                onClick: clearAllFilters,
              }}
            />
          )
        ) : (
          <>
            <div
              className={
                viewMode === "grid"
                  ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6"
                  : "space-y-4"
              }
            >
              {paginatedNFTs.map((nft) => (
                <Card key={nft.id} className="origami-card group hover:scale-105 transition-all duration-300">
                  <CardContent className="p-0">
                    <div className="relative">
                      <Image
                        src={nft.image || "/placeholder.svg"}
                        alt={nft.name}
                        width={300}
                        height={300}
                        className="w-full aspect-square object-cover rounded-t-lg"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 25vw, 20vw"
                        loading="lazy"
                        placeholder="blur"
                        blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
                      />

                      {/* Overlay with actions */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-t-lg flex items-center justify-center space-x-2">
                        <Link href={`/nft/${nft.id}`}>
                          <Button variant="secondary" size="sm" className="origami-card">
                            <EyeIcon className="w-4 h-4 mr-1" />
                            View
                          </Button>
                        </Link>
                        <PurchaseButton nft={nft} />
                      </div>

                      {/* Badges */}
                      <div className="absolute top-3 left-3 flex flex-col space-y-1">
                        {nft.isLazyMinted && (
                          <Badge className="bg-primary/90 text-primary-foreground">
                            <ZapIcon className="w-3 h-3 mr-1" />
                            Lazy Mint
                          </Badge>
                        )}
                        <Badge className={getRarityColor(nft.rarity)}>{nft.rarity}</Badge>
                      </div>

                      {/* Heart icon */}
                      <button
                        className="absolute top-3 right-3 p-2 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
                        onClick={() => handleLike(nft.id)}
                      >
                        <HeartIcon
                          className={`w-4 h-4 ${favoriteIds.has(nft.id) ? "text-red-500 fill-red-500" : "text-white"}`}
                        />
                      </button>
                    </div>

                    <div className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-foreground text-sm text-balance">{nft.name}</h3>
                        <div className="text-right ml-2">
                          <p className="text-lg font-bold text-primary">
                            {nft.price} {nft.currency}
                          </p>
                        </div>
                      </div>

                      <p className="text-xs text-muted-foreground mb-3">
                        by {nft.creatorName || `${nft.creator.slice(0, 6)}...${nft.creator.slice(-4)}`}
                      </p>

                      <div className="flex justify-between items-center text-xs text-muted-foreground">
                        <div className="flex items-center space-x-3">
                          <span className="flex items-center">
                            <HeartIcon className="w-3 h-3 mr-1" />
                            {nft.likes}
                          </span>
                          <span className="flex items-center">
                            <EyeIcon className="w-3 h-3 mr-1" />
                            {nft.views}
                          </span>
                        </div>
                        <Link href={`/nft/${nft.id}`}>
                          <Button variant="outline" size="sm" className="text-xs px-2 py-1 bg-transparent">
                            View
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-12">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="origami-card"
                >
                  Previous
                </Button>

                <div className="flex items-center gap-2">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum
                    if (totalPages <= 5) {
                      pageNum = i + 1
                    } else if (currentPage <= 3) {
                      pageNum = i + 1
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i
                    } else {
                      pageNum = currentPage - 2 + i
                    }

                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        className={currentPage === pageNum ? "origami-button" : "origami-card"}
                      >
                        {pageNum}
                      </Button>
                    )
                  })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="origami-card"
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
