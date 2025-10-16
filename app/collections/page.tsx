"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { OrigamiButton } from "@/components/ui/origami-button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CollectionCard } from "@/components/collection-card"
import { SearchIcon, FilterIcon, FolderIcon } from "@/components/simple-icons"
import { useWallet } from "@/hooks/use-wallet"

const mockCollections: any[] = []

export default function CollectionsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState("volume")
  const [filterCategory, setFilterCategory] = useState("all")
  const { isConnected } = useWallet()

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
          <p className="text-muted-foreground">Showing {mockCollections.length} collections</p>
          <div className="flex items-center space-x-2">
            <FilterIcon className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Active filters: 0</span>
          </div>
        </div>

        {/* Collections Grid or Empty State */}
        {mockCollections.length === 0 ? (
          <div className="text-center py-20">
            <div className="max-w-md mx-auto">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <FolderIcon className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-2xl font-semibold text-foreground mb-4">No Collections Yet</h3>
              <p className="text-muted-foreground mb-6">
                Collections will appear here once artists start creating curated groups of NFTs.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <OrigamiButton variant="secondary">Browse Marketplace</OrigamiButton>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockCollections.map((collection) => (
              <CollectionCard key={collection.id} collection={collection} />
            ))}
          </div>
        )}

        {/* Load More */}
        {mockCollections.length > 0 && (
          <div className="text-center mt-12">
            <OrigamiButton variant="secondary">Load More Collections</OrigamiButton>
          </div>
        )}
      </div>
    </div>
  )
}
