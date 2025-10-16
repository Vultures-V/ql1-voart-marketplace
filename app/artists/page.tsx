"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SearchIcon, UsersIcon, TrendingUpIcon, VerifiedIcon } from "@/components/simple-icons"

const featuredArtists: any[] = []

export default function ArtistsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedFilter, setSelectedFilter] = useState("all")

  const filteredArtists = featuredArtists.filter((artist) => {
    const matchesSearch =
      artist.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      artist.username.toLowerCase().includes(searchQuery.toLowerCase())

    if (selectedFilter === "all") return matchesSearch
    if (selectedFilter === "verified") return matchesSearch && artist.verified
    if (selectedFilter === "new") return matchesSearch && artist.joinedDate === "2024"

    return matchesSearch
  })

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">Featured Artists</h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Discover talented creators who are pushing the boundaries of digital art on the marketplace
          </p>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              type="text"
              placeholder="Search artists..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex gap-2">
            <Button
              variant={selectedFilter === "all" ? "default" : "outline"}
              onClick={() => setSelectedFilter("all")}
              className="origami-card"
            >
              <UsersIcon className="w-4 h-4 mr-2" />
              All Artists
            </Button>
            <Button
              variant={selectedFilter === "verified" ? "default" : "outline"}
              onClick={() => setSelectedFilter("verified")}
              className="origami-card"
            >
              <VerifiedIcon className="w-4 h-4 mr-2" />
              Verified
            </Button>
            <Button
              variant={selectedFilter === "new" ? "default" : "outline"}
              onClick={() => setSelectedFilter("new")}
              className="origami-card"
            >
              <TrendingUpIcon className="w-4 h-4 mr-2" />
              New Artists
            </Button>
          </div>
        </div>

        {/* Artists Grid or Empty State */}
        {filteredArtists.length === 0 ? (
          <div className="text-center py-20">
            <div className="max-w-md mx-auto">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <UsersIcon className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-2xl font-semibold text-foreground mb-4">No Artists Yet</h3>
              <p className="text-muted-foreground mb-6">
                Artists will appear here once they start creating and listing NFTs on the marketplace.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button className="origami-card">Become an Artist</Button>
                <Button variant="outline" className="origami-card bg-transparent">
                  Browse Marketplace
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredArtists.map((artist) => (
              <div
                key={artist.id}
                className="origami-card bg-card border border-border rounded-lg overflow-hidden hover:shadow-lg transition-all duration-300"
              >
                {/* Artist card content would go here */}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
