"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { OrigamiButton } from "@/components/ui/origami-button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CollectionCard } from "@/components/collection-card"
import { SearchIcon, FilterIcon, FolderIcon } from "@/components/simple-icons"
import { useWallet } from "@/hooks/use-wallet"

interface Collection {
    id: string
    name: string
    description: string
    category: string
    volume?: number
    floorPrice?: number
    items?: number
    createdAt?: number
    bannerImage?: string
    logoImage?: string
}

export default function CollectionsPage() {
    const [searchQuery, setSearchQuery] = useState("")
    const [sortBy, setSortBy] = useState("volume")
    const [filterCategory, setFilterCategory] = useState("all")
    const [collections, setCollections] = useState<Collection[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [displayCount, setDisplayCount] = useState(12)
    const { isConnected } = useWallet()

    useEffect(() => {
        console.log("[v0] Loading collections from localStorage")
        const loadCollections = () => {
            try {
                const storedCollections = JSON.parse(localStorage.getItem("user-collections") || "[]")
                console.log("[v0] Loaded collections:", storedCollections)
                setCollections(storedCollections)
            } catch (error) {
                console.error("[v0] Error loading collections:", error)
                setCollections([])
            } finally {
                setIsLoading(false)
            }
        }

        loadCollections()

        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === "user-collections" && e.storageArea === localStorage) {
                console.log("[v0] Collections updated in localStorage from another tab")
                loadCollections()
            }
        }

        window.addEventListener("storage", handleStorageChange)

        const handleCustomUpdate = () => {
            console.log("[v0] Collections updated in same tab")
            loadCollections()
        }

        window.addEventListener("collections-updated", handleCustomUpdate)

        return () => {
            window.removeEventListener("storage", handleStorageChange)
            window.removeEventListener("collections-updated", handleCustomUpdate)
        }
    }, [])

    const filteredCollections = collections.filter((collection) => {
        const matchesSearch =
            collection.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            collection.description?.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesCategory = filterCategory === "all" || collection.category?.toLowerCase() === filterCategory
        return matchesSearch && matchesCategory
    })

    const sortedCollections = [...filteredCollections].sort((a, b) => {
        if (sortBy === "volume") return (b.volume || 0) - (a.volume || 0)
        if (sortBy === "floor") return (b.floorPrice || 0) - (a.floorPrice || 0)
        if (sortBy === "items") return (b.items || 0) - (a.items || 0)
        if (sortBy === "created") return (b.createdAt || 0) - (a.createdAt || 0)
        return 0
    })

    const displayedCollections = sortedCollections.slice(0, displayCount)
    const hasMore = sortedCollections.length > displayCount

    const handleLoadMore = () => {
        setDisplayCount((prev) => prev + 12)
    }

    return (
        <div className="min-h-screen bg-background">
            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
                    <div>
                        <h1 className="text-4xl font-bold text-foreground mb-4">Collections</h1>
                        <p className="text-muted-foreground text-lg">Discover curated NFT collections</p>
                    </div>
                </div>

                {/* Search and Filters */}
                <Card className="origami-card mb-8">
                    <CardContent className="p-6">
                        <div className="flex flex-col lg:flex-row gap-4 items-center">
                            {/* Search */}
                            <div className="relative flex-1">
                                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search collections..."
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
                                        <SelectItem value="gaming">Gaming</SelectItem>
                                        <SelectItem value="collectibles">Collectibles</SelectItem>
                                    </SelectContent>
                                </Select>

                                <Select value={sortBy} onValueChange={setSortBy}>
                                    <SelectTrigger className="w-[140px]">
                                        <SelectValue placeholder="Sort by" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="volume">Volume</SelectItem>
                                        <SelectItem value="floor">Floor Price</SelectItem>
                                        <SelectItem value="items">Items</SelectItem>
                                        <SelectItem value="created">Recently Created</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Results Count */}
                <div className="flex justify-between items-center mb-6">
                    <p className="text-muted-foreground">
                        Showing {displayedCollections.length} of {sortedCollections.length} collection
                        {sortedCollections.length !== 1 ? "s" : ""}
                    </p>
                    <div className="flex items-center space-x-2">
                        <FilterIcon className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                            Active filters: {[searchQuery !== "", filterCategory !== "all"].filter(Boolean).length}
                        </span>
                    </div>
                </div>

                {/* Collections Grid or Empty State */}
                {isLoading ? (
                    <div className="text-center py-20">
                        <p className="text-muted-foreground">Loading collections...</p>
                    </div>
                ) : sortedCollections.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="max-w-md mx-auto">
                            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                <FolderIcon className="w-10 h-10 text-primary" />
                            </div>
                            <h3 className="text-2xl font-semibold text-foreground mb-4">
                                {collections.length === 0 ? "No Collections Yet" : "No Matching Collections"}
                            </h3>
                            <p className="text-muted-foreground mb-6">
                                {collections.length === 0
                                    ? "Collections will appear here once you create them. Start by creating your first collection!"
                                    : "No collections match your search criteria. Try adjusting your filters."}
                            </p>
                            <div className="flex flex-col sm:flex-row gap-3 justify-center">
                                {collections.length === 0 ? (
                                    <OrigamiButton href="/create-collection">Create Collection</OrigamiButton>
                                ) : (
                                    <OrigamiButton
                                        variant="secondary"
                                        onClick={() => {
                                            setSearchQuery("")
                                            setFilterCategory("all")
                                        }}
                                    >
                                        Clear Filters
                                    </OrigamiButton>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {displayedCollections.map((collection) => (
                            <CollectionCard key={collection.id} collection={collection} />
                        ))}
                    </div>
                )}

                {/* Load More */}
                {hasMore && (
                    <div className="text-center mt-12">
                        <OrigamiButton variant="secondary" onClick={handleLoadMore}>
                            Load More Collections ({sortedCollections.length - displayCount} remaining)
                        </OrigamiButton>
                    </div>
                )}
            </div>
        </div>
    )
}
