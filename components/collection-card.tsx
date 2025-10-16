"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { OrigamiButton } from "@/components/ui/origami-button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Users } from "@/components/simple-icons"
import Link from "next/link"
import Image from "next/image"

interface CollectionCardProps {
  collection: {
    id: string
    name: string
    description: string
    image: string
    banner?: string
    creator: {
      name: string
      avatar: string
      verified: boolean
    }
    stats: {
      items: number
      owners: number
      floorPrice: string
      volume: string
    }
    isVerified?: boolean
    isCollaborative?: boolean
  }
}

export function CollectionCard({ collection }: CollectionCardProps) {
  return (
    <Card className="origami-card group hover:scale-105 transition-all duration-300">
      <CardContent className="p-0">
        {/* Banner */}
        <div className="relative h-32 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-t-lg overflow-hidden">
          {collection.banner && (
            <Image
              src={collection.banner || "/placeholder.svg"}
              alt={`${collection.name} banner`}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              priority={false}
            />
          )}

          {/* Badges */}
          <div className="absolute top-3 left-3 flex space-x-2">
            {collection.isVerified && <Badge className="bg-blue-500/90 text-white">Verified</Badge>}
            {collection.isCollaborative && (
              <Badge className="bg-purple-500/90 text-white">
                <Users className="w-3 h-3 mr-1" />
                Collaborative
              </Badge>
            )}
          </div>
        </div>

        {/* Collection Logo */}
        <div className="relative px-4 -mt-8">
          <div className="w-16 h-16 rounded-lg border-4 border-background overflow-hidden bg-background">
            <Image
              src={collection.image || "/placeholder.svg"}
              alt={collection.name}
              width={64}
              height={64}
              className="object-cover"
              sizes="64px"
            />
          </div>
        </div>

        {/* Content */}
        <div className="p-4 pt-2">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="font-bold text-foreground text-lg">{collection.name}</h3>
              <div className="flex items-center space-x-2 mt-1">
                <Avatar className="w-5 h-5">
                  <AvatarImage src={collection.creator.avatar || "/placeholder.svg"} />
                  <AvatarFallback>{collection.creator.name[0]}</AvatarFallback>
                </Avatar>
                <span className="text-sm text-muted-foreground">by {collection.creator.name}</span>
              </div>
            </div>
          </div>

          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{collection.description}</p>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
            <div>
              <p className="text-muted-foreground">Items</p>
              <p className="font-semibold text-foreground">{collection.stats.items}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Owners</p>
              <p className="font-semibold text-foreground">{collection.stats.owners}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Floor</p>
              <p className="font-semibold text-foreground">{collection.stats.floorPrice} QOM</p>
            </div>
            <div>
              <p className="text-muted-foreground">Volume</p>
              <p className="font-semibold text-foreground">{collection.stats.volume} QOM</p>
            </div>
          </div>

          <Link href={`/collection/${collection.id}`}>
            <OrigamiButton variant="outline" className="w-full">
              View Collection
            </OrigamiButton>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
