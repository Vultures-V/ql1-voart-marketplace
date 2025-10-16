import { Card, CardContent } from "@/components/ui/card"
import { OrigamiButton } from "@/components/ui/origami-button"
import { HeartIcon, EyeIcon } from "@/components/simple-icons"
import Image from "next/image"

export function FeaturedNFTs() {
  const featuredNFTs: any[] = []

  return (
    <section>
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-bold text-foreground">Featured NFTs</h2>
        <OrigamiButton variant="secondary">View All</OrigamiButton>
      </div>

      {featuredNFTs.length === 0 ? (
        <div className="text-center py-16 bg-muted/20 rounded-lg border-2 border-dashed border-muted">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <HeartIcon className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">No Featured NFTs Yet</h3>
            <p className="text-muted-foreground mb-6">
              Featured NFTs will appear here once they are curated by the platform.
            </p>
            <OrigamiButton variant="primary">Explore Marketplace</OrigamiButton>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {featuredNFTs.map((nft) => (
            <Card key={nft.id} className="origami-card group cursor-pointer">
              <CardContent className="p-0">
                <div className="relative overflow-hidden rounded-t-lg">
                  <Image
                    src={nft.image || "/placeholder.svg"}
                    alt={nft.name}
                    width={300}
                    height={300}
                    className="w-full aspect-square object-cover transition-transform duration-300 group-hover:scale-105"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 25vw, 20vw"
                    loading="lazy"
                    placeholder="blur"
                    blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
                  />
                  <div className="absolute top-3 right-3 flex space-x-2">
                    <button className="bg-background/80 backdrop-blur-sm p-2 rounded-full hover:bg-background transition-colors">
                      <HeartIcon className="w-4 h-4 text-foreground" />
                    </button>
                  </div>
                </div>

                <div className="p-4">
                  <h3 className="font-semibold text-foreground mb-2 text-balance text-sm">{nft.name}</h3>
                  <p className="text-xs text-muted-foreground mb-3">by {nft.artist}</p>

                  <div className="flex items-center justify-between mb-4">
                    <span className="text-lg font-bold text-qom-gold">{nft.price}</span>
                    <div className="flex items-center space-x-3 text-xs text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <HeartIcon className="w-3 h-3" />
                        <span>{nft.likes}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <EyeIcon className="w-3 h-3" />
                        <span>{nft.views}</span>
                      </div>
                    </div>
                  </div>

                  <OrigamiButton variant="primary" className="w-full text-sm">
                    Buy Now
                  </OrigamiButton>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </section>
  )
}
